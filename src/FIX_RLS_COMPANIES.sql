-- Fix for "new row violates row-level security policy for table companies"
-- Jalankan script ini di Supabase SQL Editor

-- 1. Enable RLS (just in case)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can create company" ON companies;
DROP POLICY IF EXISTS "Company members can view company" ON companies;

-- 3. Create permissive INSERT policy for authenticated users
-- Ini mengizinkan user yang sudah login untuk membuat perusahaan baru
CREATE POLICY "Users can create company" ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 4. Create SELECT policy
-- Mengizinkan user melihat perusahaan jika mereka adalah member (via profiles)
-- ATAU jika mereka baru saja membuat perusahaan (biasanya via return value)
CREATE POLICY "Company members can view company" ON companies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.company_id = companies.id
    )
    -- Opsional: Izinkan melihat perusahaan yang baru dibuat meski belum ada profile
    -- (Biasanya insert returning * membutuhkan akses select juga di beberapa kasus, 
    -- tapi Postgres standar insert returning menggunakan permissions insert)
  );

-- 5. Fix Profiles RLS as well (needed for linking user to company)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- 6. Fix Company Settings RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage settings" ON company_settings;

-- Izinkan insert settings untuk perusahaan baru
CREATE POLICY "Admins can manage settings" ON company_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.company_id = company_settings.company_id
      AND p.role IN ('owner','admin')
    )
  );

-- Special policy for INSERTing settings (when creating company)
-- Saat buat company, user belum punya profile yang linked, jadi kita butuh policy khusus
-- atau kita bisa insert settings menggunakan service role di backend, 
-- tapi karena ini client-side, kita perlu policy yang agak longgar atau trigger.
-- Solusi terbaik: Gunakan TRIGGER untuk auto-create settings saat company dibuat.

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_company_created ON companies;
DROP FUNCTION IF EXISTS handle_new_company();

-- Create Trigger Function
CREATE OR REPLACE FUNCTION handle_new_company()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.company_settings (company_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger
CREATE TRIGGER on_company_created
  AFTER INSERT ON companies
  FOR EACH ROW EXECUTE PROCEDURE handle_new_company();

-- Dengan trigger ini, kita tidak perlu insert manual ke company_settings dari frontend
-- Cukup insert ke companies, dan trigger akan menangani sisanya (bypass RLS)
