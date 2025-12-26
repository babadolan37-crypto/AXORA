-- =================================================================
-- SECURITY UPGRADE: MEMBER APPROVAL & DATA PROTECTION
-- =================================================================

-- 1. Add 'status' column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
CHECK (status IN ('active', 'pending', 'rejected', 'banned'));

-- Update existing users to 'active' so they don't get locked out
UPDATE profiles SET status = 'active' WHERE status IS NULL;

-- 2. Function to Approve Member (Owner/Admin only)
CREATE OR REPLACE FUNCTION approve_member(target_user_id UUID, actor_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  target_company_id UUID;
  actor_company_id UUID;
  actor_role TEXT;
BEGIN
  -- Get Target Info
  SELECT company_id INTO target_company_id FROM profiles WHERE id = target_user_id;
  
  -- Get Actor Info
  SELECT company_id, role INTO actor_company_id, actor_role 
  FROM profiles WHERE id = actor_user_id;

  -- Validation
  IF target_company_id IS NULL OR actor_company_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User or Company not found');
  END IF;

  IF target_company_id != actor_company_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Different company');
  END IF;

  IF actor_role NOT IN ('owner', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  -- Update Status
  UPDATE profiles SET status = 'active' WHERE id = target_user_id;
  
  -- Log Audit
  INSERT INTO audit_logs (company_id, actor_user_id, action, description, entity_type, entity_id)
  VALUES (actor_company_id, actor_user_id, 'APPROVE_MEMBER', 'Approved user join request', 'user', target_user_id);

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 3. Function to Reject Member
CREATE OR REPLACE FUNCTION reject_member(target_user_id UUID, actor_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  target_company_id UUID;
  actor_company_id UUID;
  actor_role TEXT;
BEGIN
  SELECT company_id INTO target_company_id FROM profiles WHERE id = target_user_id;
  SELECT company_id, role INTO actor_company_id, actor_role FROM profiles WHERE id = actor_user_id;

  IF target_company_id != actor_company_id OR actor_role NOT IN ('owner', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  -- Set status rejected
  UPDATE profiles SET status = 'rejected' WHERE id = target_user_id;
  
  -- Log Audit
  INSERT INTO audit_logs (company_id, actor_user_id, action, description, entity_type, entity_id)
  VALUES (actor_company_id, actor_user_id, 'REJECT_MEMBER', 'Rejected user join request', 'user', target_user_id);

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 4. UPDATE RLS POLICIES TO REQUIRE 'active' STATUS
-- This ensures 'pending' users cannot see company data

-- Helper function to check if user is active member
CREATE OR REPLACE FUNCTION is_active_member(target_company_id UUID)
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

-- Update Company Settings Policy
DROP POLICY IF EXISTS "Company members can view settings" ON company_settings;
CREATE POLICY "Active members can view settings" ON company_settings
  FOR SELECT USING (is_active_member(company_id));

-- Update Audit Logs Policy
DROP POLICY IF EXISTS "Company members can view logs" ON audit_logs;
CREATE POLICY "Active members can view logs" ON audit_logs
  FOR SELECT USING (
    is_active_member(company_id) OR auth.uid() = user_id
  );

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION approve_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_active_member(UUID) TO authenticated;
