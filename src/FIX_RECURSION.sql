-- ===================================================
-- FIX: INFINITE RECURSION IN RLS POLICIES
-- ===================================================
-- Masalah: Policy sebelumnya menyebabkan "Infinite Loop" saat mengecek admin status.
-- Solusi: Gunakan fungsi "Security Definer" untuk bypass RLS saat pengecekan role.

-- 1. Buat fungsi helper yang aman (Bypass RLS)
CREATE OR REPLACE FUNCTION is_admin_of_company(target_company_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Penting: Jalan dengan hak akses superuser/creator
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND company_id = target_company_id
      AND role IN ('owner', 'admin')
  );
END;
$$;

-- 2. Perbaiki Policy di tabel PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view company profiles" ON profiles;

CREATE POLICY "Admins can view company profiles" ON profiles
  FOR SELECT USING (
    -- Gunakan fungsi helper, jangan query tabel langsung di sini
    is_admin_of_company(company_id)
  );

-- 3. Perbaiki Policy di tabel COMPANY_SETTINGS (Opsional tapi direkomendasikan)
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage settings" ON company_settings;

CREATE POLICY "Admins can manage settings" ON company_settings
  FOR ALL USING (
    is_admin_of_company(company_id)
  );

-- 4. Tambahan: Pastikan user bisa melihat profilenya sendiri (Non-recursive)
DROP POLICY IF EXISTS "Users can view own profile (profiles)" ON profiles;
CREATE POLICY "Users can view own profile (profiles)" ON profiles
  FOR SELECT USING (id = auth.uid());
