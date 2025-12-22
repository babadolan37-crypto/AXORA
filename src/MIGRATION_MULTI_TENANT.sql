-- ============================================
-- MIGRATION: Multi-Tenant (SaaS) Architecture
-- ============================================

-- 1. Create COMPANIES table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE, -- The Access Code (e.g., "WEALTH-99")
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create PROFILES table (Links User to Company)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'staff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Profiles
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 5. RLS Policies for Companies
-- Members can view their company details
CREATE POLICY "Members can view company" ON companies
  FOR SELECT USING (
    id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- 6. Function to Handle New Company Registration
-- This function will be called during Sign Up to handle transaction atomically
CREATE OR REPLACE FUNCTION create_company_and_user(
  user_email TEXT,
  user_password TEXT,
  user_name TEXT,
  company_name TEXT,
  company_code TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
  new_company_id UUID;
BEGIN
  -- Note: Actual user creation happens via Supabase Auth client. 
  -- This function is strictly for data setup AFTER auth.users entry exists,
  -- OR we handle the data setup separately.
  
  -- BETTER APPROACH for Client-Side call:
  -- 1. Client creates Auth User.
  -- 2. Client calls this RPC to setup Company + Profile.
  
  RETURN '{"status": "error", "message": "Use client-side flow"}'::jsonb;
END;
$$;

-- 7. Helper to Join Company
CREATE OR REPLACE FUNCTION join_company(
  input_code TEXT,
  user_name TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_company_id UUID;
BEGIN
  -- Find company by code
  SELECT id INTO target_company_id FROM companies WHERE code = input_code;
  
  IF target_company_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Kode Perusahaan tidak ditemukan');
  END IF;

  -- Create or Update Profile
  INSERT INTO profiles (id, full_name, company_id, role)
  VALUES (auth.uid(), user_name, target_company_id, 'staff')
  ON CONFLICT (id) DO UPDATE
  SET company_id = EXCLUDED.company_id,
      role = 'staff',
      updated_at = NOW();

  RETURN jsonb_build_object('success', true, 'company_id', target_company_id);
END;
$$;

-- 8. Helper to Create Company
CREATE OR REPLACE FUNCTION create_new_company(
  input_name TEXT,
  input_code TEXT,
  user_name TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_company_id UUID;
BEGIN
  -- Check if code exists
  IF EXISTS (SELECT 1 FROM companies WHERE code = input_code) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Kode Perusahaan sudah digunakan. Cari kode lain.');
  END IF;

  -- Create Company
  INSERT INTO companies (name, code, owner_id)
  VALUES (input_name, input_code, auth.uid())
  RETURNING id INTO new_company_id;

  -- Create Profile (Owner)
  INSERT INTO profiles (id, full_name, company_id, role)
  VALUES (auth.uid(), user_name, new_company_id, 'owner');

  RETURN jsonb_build_object('success', true, 'company_id', new_company_id);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION join_company(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_new_company(TEXT, TEXT, TEXT) TO authenticated;

-- Allow anon to check code availability (optional, for validation UX)
CREATE OR REPLACE FUNCTION check_company_code(input_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM companies WHERE code = input_code);
END;
$$;
GRANT EXECUTE ON FUNCTION check_company_code(TEXT) TO anon, authenticated;
