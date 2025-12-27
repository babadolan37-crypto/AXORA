-- Function to approve a pending member
CREATE OR REPLACE FUNCTION approve_member(target_user_id UUID, actor_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  actor_role TEXT;
  actor_company UUID;
  target_company UUID;
BEGIN
  -- Get actor details
  SELECT role, company_id INTO actor_role, actor_company
  FROM profiles WHERE id = actor_user_id;

  -- Get target details
  SELECT company_id INTO target_company
  FROM profiles WHERE id = target_user_id;

  -- Validation
  IF actor_company IS NULL OR target_company IS NULL OR actor_company != target_company THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: Different company');
  END IF;

  IF actor_role NOT IN ('owner', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: Insufficient permissions');
  END IF;

  -- Update status
  UPDATE profiles
  SET status = 'active'
  WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Member approved');
END;
$$;

-- Function to reject/remove a member
CREATE OR REPLACE FUNCTION reject_member(target_user_id UUID, actor_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  actor_role TEXT;
  actor_company UUID;
  target_company UUID;
BEGIN
  -- Get actor details
  SELECT role, company_id INTO actor_role, actor_company
  FROM profiles WHERE id = actor_user_id;

  -- Get target details
  SELECT company_id INTO target_company
  FROM profiles WHERE id = target_user_id;

  -- Validation
  IF actor_company IS NULL OR target_company IS NULL OR actor_company != target_company THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: Different company');
  END IF;

  IF actor_role NOT IN ('owner', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: Insufficient permissions');
  END IF;

  -- Soft delete or Hard delete? 
  -- For rejection, we usually want to remove access. 
  -- We can set status to 'rejected' or delete the profile row.
  -- Let's set status to 'rejected' to keep history, or delete if it's a fresh request.
  -- Based on UI, it implies "Reject". Let's update status to 'rejected'.
  
  UPDATE profiles
  SET status = 'rejected'
  WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Member rejected');
END;
$$;

-- Function to toggle member status (suspend/activate)
CREATE OR REPLACE FUNCTION toggle_member_status(target_user_id UUID, new_status TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  actor_user_id UUID := auth.uid();
  actor_role TEXT;
  actor_company UUID;
  target_company UUID;
BEGIN
  -- Get actor details
  SELECT role, company_id INTO actor_role, actor_company
  FROM profiles WHERE id = actor_user_id;

  -- Get target details
  SELECT company_id INTO target_company
  FROM profiles WHERE id = target_user_id;

  -- Validation
  IF actor_company IS NULL OR target_company IS NULL OR actor_company != target_company THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  IF actor_role NOT IN ('owner', 'admin') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Insufficient permissions');
  END IF;

  UPDATE profiles
  SET status = new_status
  WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Status updated');
END;
$$;

-- Function to update member role
CREATE OR REPLACE FUNCTION update_member_role(target_user_id UUID, new_role TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  actor_user_id UUID := auth.uid();
  actor_role TEXT;
  actor_company UUID;
  target_company UUID;
BEGIN
  -- Get actor details
  SELECT role, company_id INTO actor_role, actor_company
  FROM profiles WHERE id = actor_user_id;

  -- Get target details
  SELECT company_id INTO target_company
  FROM profiles WHERE id = target_user_id;

  -- Validation
  IF actor_company IS NULL OR target_company IS NULL OR actor_company != target_company THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  IF actor_role NOT IN ('owner') AND new_role = 'admin' THEN
     -- Only owner can make admins? Or admin can make admins? 
     -- Let's stick to: Owner can do anything. Admin can manage others but not make Admins?
     -- For simplicity: Owner and Admin can manage roles, but Admin cannot touch Owner.
     NULL;
  END IF;
  
  -- Prevent changing Owner's role
  IF (SELECT role FROM profiles WHERE id = target_user_id) = 'owner' THEN
     RETURN jsonb_build_object('success', false, 'message', 'Cannot change Owner role');
  END IF;

  UPDATE profiles
  SET role = new_role
  WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Role updated');
END;
$$;
