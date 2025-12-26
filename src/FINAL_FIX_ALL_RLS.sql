-- =================================================================
-- FINAL SECURITY & RLS FIX
-- Ensure Owners can see Pending Requests and Manage Users
-- =================================================================

-- 1. Reset Policies for Profiles to be absolutely sure
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view company profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile (profiles)" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- 2. Helper Function: Is Admin of Company (Secure)
CREATE OR REPLACE FUNCTION is_admin_of_company(target_company_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Check if the CURRENT user is an owner/admin of the TARGET company
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND company_id = target_company_id
      AND role IN ('owner', 'admin')
      AND status = 'active'
  );
END;
$$;

-- 3. Policy: Users can SEE their OWN profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- 4. Policy: Users can INSERT their OWN profile (Registration)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 5. Policy: Users can UPDATE their OWN profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 6. Policy: Admins/Owners can VIEW ALL profiles in their company
-- This includes 'pending', 'active', 'rejected' users.
CREATE POLICY "Admins can view all company profiles" ON profiles
  FOR SELECT USING (
    is_admin_of_company(company_id)
  );

-- 7. Policy: Admins/Owners can UPDATE profiles in their company (Approve/Reject)
CREATE POLICY "Admins can update company profiles" ON profiles
  FOR UPDATE USING (
    is_admin_of_company(company_id)
  );

-- 8. Fix Company Settings RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage settings" ON company_settings;
DROP POLICY IF EXISTS "Active members can view settings" ON company_settings;

CREATE POLICY "Admins can manage settings" ON company_settings
  FOR ALL USING (
    is_admin_of_company(company_id)
  );

CREATE POLICY "Active members can view settings" ON company_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND company_id = company_settings.company_id
      AND status = 'active'
    )
  );

-- 9. Fix Audit Logs RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Active members can view logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can insert logs" ON audit_logs;

-- Everyone can insert logs (system logs actions)
CREATE POLICY "Everyone can insert logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only Admins can view logs
CREATE POLICY "Admins can view logs" ON audit_logs
  FOR SELECT USING (
    is_admin_of_company(company_id)
  );

-- 10. Ensure Status Column Exists (Safety)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='status') THEN
        ALTER TABLE profiles ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- 11. Grant Permissions
GRANT EXECUTE ON FUNCTION is_admin_of_company(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_member(UUID, UUID) TO authenticated;
