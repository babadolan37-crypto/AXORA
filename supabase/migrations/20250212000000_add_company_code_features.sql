-- Migration to add audit logs and company code RPCs

-- 1. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  actor_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company audit logs" ON audit_logs
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- 2. RPC to check if company code exists (for Registration)
CREATE OR REPLACE FUNCTION check_company_code(input_code TEXT)
RETURNS TABLE (exists BOOLEAN, company_name TEXT, company_id UUID) 
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY 
  SELECT TRUE, name, id 
  FROM companies 
  WHERE code = input_code 
  LIMIT 1;
END;
$$;

-- 3. RPC to validate user login against company code
CREATE OR REPLACE FUNCTION validate_user_company(user_uuid UUID, input_code TEXT)
RETURNS BOOLEAN 
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  user_company_id UUID;
  target_company_id UUID;
BEGIN
  -- Get user's company_id
  SELECT company_id INTO user_company_id
  FROM profiles
  WHERE id = user_uuid;

  -- Get company_id for the input code
  SELECT id INTO target_company_id
  FROM companies
  WHERE code = input_code;

  -- Return true if they match
  RETURN user_company_id IS NOT NULL AND user_company_id = target_company_id;
END;
$$;

-- 4. RPC to change company code (Owner only)
CREATE OR REPLACE FUNCTION change_company_code(company_uuid UUID, new_code TEXT, actor_uuid UUID)
RETURNS JSONB 
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  is_owner BOOLEAN;
  old_code TEXT;
BEGIN
  -- Check if actor is owner
  SELECT (role = 'owner') INTO is_owner
  FROM profiles
  WHERE id = actor_uuid AND company_id = company_uuid;

  IF NOT is_owner THEN
    RETURN jsonb_build_object('success', false, 'message', 'Hanya Owner yang dapat mengganti kode perusahaan');
  END IF;

  -- Check if new code is unique
  IF EXISTS (SELECT 1 FROM companies WHERE code = new_code) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Kode perusahaan sudah digunakan');
  END IF;

  -- Get old code
  SELECT code INTO old_code FROM companies WHERE id = company_uuid;

  -- Update code
  UPDATE companies 
  SET code = new_code, updated_at = NOW()
  WHERE id = company_uuid;

  -- Log audit
  INSERT INTO audit_logs (company_id, actor_user_id, action, metadata)
  VALUES (company_uuid, actor_uuid, 'COMPANY_CODE_CHANGED', jsonb_build_object('old_code', old_code, 'new_code', new_code));

  RETURN jsonb_build_object('success', true, 'message', 'Kode perusahaan berhasil diubah');
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_company_code(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION validate_user_company(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION change_company_code(UUID, TEXT, UUID) TO authenticated, service_role;
