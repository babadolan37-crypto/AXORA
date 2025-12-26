
-- =================================================================
-- BAGIAN 5: FIX RLS & TRIGGERS TAMBAHAN (Updated)
-- =================================================================

-- Fix: Trigger untuk membuat company_settings otomatis saat company dibuat
-- Ini menghindari masalah RLS saat frontend mencoba insert ke company_settings
CREATE OR REPLACE FUNCTION handle_new_company()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.company_settings (company_id)
  VALUES (new.id)
  ON CONFLICT (company_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_company_created ON companies;
CREATE TRIGGER on_company_created
  AFTER INSERT ON companies
  FOR EACH ROW EXECUTE PROCEDURE handle_new_company();

-- Pastikan policy INSERT companies benar-benar terbuka untuk authenticated users
DROP POLICY IF EXISTS "Users can create company" ON companies;
CREATE POLICY "Users can create company" ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
