-- =================================================================
-- SYSTEM: ADMIN, SECURITY & RBAC FEATURES
-- =================================================================

-- 1. Ensure Profiles Table Structure (Membership)
-- Add status if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='status') THEN
        ALTER TABLE profiles ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'rejected', 'suspended'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='approved_at') THEN
        ALTER TABLE profiles ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='approved_by') THEN
        ALTER TABLE profiles ADD COLUMN approved_by UUID REFERENCES profiles(id);
    END IF;
END $$;

-- 2. RBAC: Permission Check Function
-- Returns true if user has permission for specific action
CREATE OR REPLACE FUNCTION has_permission(action_key TEXT, target_company_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  user_role TEXT;
  user_status TEXT;
BEGIN
  -- Get role and status
  SELECT role, status INTO user_role, user_status
  FROM profiles
  WHERE id = auth.uid() AND company_id = target_company_id;

  -- Must be active
  IF user_status != 'active' THEN RETURN FALSE; END IF;

  -- Permission Matrix (Hardcoded for simplicity & security)
  -- OWNER: All access
  IF user_role = 'owner' THEN RETURN TRUE; END IF;

  -- ADMIN: Manage users, all transactions
  IF user_role = 'admin' THEN
    RETURN action_key IN (
      'txn.read', 'txn.create', 'txn.update', 'txn.delete',
      'report.read', 'report.export',
      'member.read', 'member.invite', 'member.approve', 'member.role.update', 'member.suspend'
    );
  END IF;

  -- EMPLOYEE: Operational only
  IF user_role = 'employee' THEN
    RETURN action_key IN (
      'txn.read', 'txn.create', 'txn.update', -- No delete
      'report.read' -- Basic reports only
    );
  END IF;

  -- VIEWER: Read only
  IF user_role = 'viewer' THEN
    RETURN action_key IN ('txn.read', 'report.read');
  END IF;

  RETURN FALSE;
END;
$$;

-- 3. Secure Function: Update Member Role (Owner/Admin Only)
CREATE OR REPLACE FUNCTION update_member_role(target_user_id UUID, new_role TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  actor_role TEXT;
  actor_company_id UUID;
  target_company_id UUID;
BEGIN
  -- Get Actor Info
  SELECT role, company_id INTO actor_role, actor_company_id
  FROM profiles WHERE id = auth.uid();

  -- Get Target Info
  SELECT company_id INTO target_company_id
  FROM profiles WHERE id = target_user_id;

  -- Validation
  IF actor_company_id != target_company_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Different company');
  END IF;

  -- Only Owner/Admin can change roles
  IF actor_role NOT IN ('owner', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  -- Admin cannot change Owner's role
  IF actor_role = 'admin' AND new_role = 'owner' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Admin cannot assign Owner role');
  END IF;

  -- Update
  UPDATE profiles 
  SET role = new_role, updated_at = NOW()
  WHERE id = target_user_id;

  -- Log
  INSERT INTO audit_logs (company_id, user_id, action, entity_type, entity_id, description)
  VALUES (actor_company_id, auth.uid(), 'UPDATE_ROLE', 'user', target_user_id, 'Changed role to ' || new_role);

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 4. Secure Function: Suspend/Activate Member
CREATE OR REPLACE FUNCTION toggle_member_status(target_user_id UUID, new_status TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  actor_role TEXT;
  actor_company_id UUID;
  target_company_id UUID;
BEGIN
  SELECT role, company_id INTO actor_role, actor_company_id FROM profiles WHERE id = auth.uid();
  SELECT company_id INTO target_company_id FROM profiles WHERE id = target_user_id;

  IF actor_company_id != target_company_id OR actor_role NOT IN ('owner', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  IF new_status NOT IN ('active', 'suspended') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid status');
  END IF;

  UPDATE profiles SET status = new_status WHERE id = target_user_id;

  INSERT INTO audit_logs (company_id, user_id, action, entity_type, entity_id, description)
  VALUES (actor_company_id, auth.uid(), 'CHANGE_STATUS', 'user', target_user_id, 'Changed status to ' || new_status);

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 5. Helper: Check Active Member (Middleware for RLS)
CREATE OR REPLACE FUNCTION is_active_member_of(target_company_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() 
      AND company_id = target_company_id 
      AND status = 'active'
  );
END;
$$;

-- Grant Permissions
GRANT EXECUTE ON FUNCTION has_permission(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_member_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_member_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_active_member_of(UUID) TO authenticated;
