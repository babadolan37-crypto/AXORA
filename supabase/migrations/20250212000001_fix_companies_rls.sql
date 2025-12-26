-- Fix for "new row violates row-level security policy for table companies"

-- 1. Enable RLS (just in case)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can create company" ON companies;
DROP POLICY IF EXISTS "Company members can view company" ON companies;

-- 3. Create permissive INSERT policy for authenticated users
CREATE POLICY "Users can create company" ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 4. Create SELECT policy
CREATE POLICY "Company members can view company" ON companies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.company_id = companies.id
    )
  );

-- 5. Fix Profiles RLS
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

-- 6. Trigger for Company Settings (Auto-create)
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
