-- ============================================
-- MIGRATION: Add Access Code Feature
-- ============================================

-- 1. Create app_config table for global settings
CREATE TABLE IF NOT EXISTS app_config (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  access_code TEXT DEFAULT 'WEALTHIFY2025', -- Default code
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id)
);

-- 2. Insert default row if not exists
INSERT INTO app_config (id, access_code)
VALUES (TRUE, 'WEALTHIFY2025')
ON CONFLICT (id) DO NOTHING;

-- 3. Enable RLS
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- 4. Create RPC to verify code (Secure way)
CREATE OR REPLACE FUNCTION verify_access_code(input_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM app_config WHERE access_code = input_code
  );
END;
$$;

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION verify_access_code(TEXT) TO anon, authenticated, service_role;

-- 6. Policies
-- Allow Authenticated users to view the code (Settings)
CREATE POLICY "Authenticated can view config" ON app_config
FOR SELECT
TO authenticated
USING (true);

-- Allow Authenticated users (Admins) to update the code
CREATE POLICY "Authenticated can update config" ON app_config
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
