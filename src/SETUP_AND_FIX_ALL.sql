-- =================================================================
-- SQL SETUP & FIX: ALL IN ONE (Script Pamungkas)
-- Jalankan script ini untuk memperbaiki semua error (Tabel hilang, Tipe Data, Nama Kolom)
-- =================================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Hapus Policy lama untuk menghindari konflik
-- HANYA JIKA TABEL SUDAH ADA
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs') THEN
        DROP POLICY IF EXISTS "Users can view own logs" ON audit_logs;
        DROP POLICY IF EXISTS "Users can insert own logs" ON audit_logs;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
        DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
        DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'scheduled_transfers') THEN
        DROP POLICY IF EXISTS "Users can manage own transfers" ON scheduled_transfers;
    END IF;
END $$;

-- =================================================================
-- BAGIAN 1: PEMBUATAN TABEL (Jika Belum Ada)
-- =================================================================

-- Tabel companies (Perusahaan)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel profiles (Profil User berbasis perusahaan)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'manager', 'employee', 'viewer')),
  full_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel company_settings (Pengaturan bersama perusahaan)
CREATE TABLE IF NOT EXISTS company_settings (
  company_id UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  income_sources JSONB DEFAULT '["Penjualan Produk","Penjualan Jasa","Pemasukan Investasi","Pembayaran Piutang","Lainnya"]'::jsonb,
  expense_categories JSONB DEFAULT '["Gaji Karyawan","Sewa","Bahan Baku","Listrik","Air","Internet & Telekomunikasi","Transportasi","Peralatan Kantor","Marketing","Pajak","Lainnya"]'::jsonb,
  payment_methods JSONB DEFAULT '["Tunai","Transfer Bank","Cek","Kartu Kredit","E-Wallet"]'::jsonb,
  employees JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'manager', 'employee', 'viewer')),
  full_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabel audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id),
  user_name TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel scheduled_transfers
CREATE TABLE IF NOT EXISTS scheduled_transfers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_cash TEXT NOT NULL CHECK (from_cash IN ('big', 'small')),
  to_cash TEXT NOT NULL CHECK (to_cash IN ('big', 'small')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  day_of_week INTEGER,
  day_of_month INTEGER,
  next_run_date TIMESTAMPTZ NOT NULL,
  last_run_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  description TEXT NOT NULL,
  auto_approve BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel fixed_assets
CREATE TABLE IF NOT EXISTS fixed_assets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Elektronik', 'Kendaraan', 'Mesin', 'Furniture', 'Bangunan', 'Tanah', 'Lainnya')),
  purchase_date DATE NOT NULL,
  purchase_cost NUMERIC(15, 2) NOT NULL,
  residual_value NUMERIC(15, 2) DEFAULT 0,
  useful_life_years INTEGER NOT NULL,
  depreciation_method TEXT DEFAULT 'straight_line',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disposed', 'sold')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- =================================================================
-- BAGIAN 2: PERBAIKAN KOLOM & TIPE DATA (Jika Tabel Sudah Ada tapi Salah)
-- =================================================================

DO $$
BEGIN
    -- [AUDIT_LOGS] Fix Nama Kolom (camelCase -> snake_case)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'userId') THEN
        ALTER TABLE audit_logs RENAME COLUMN "userId" TO user_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'createdAt') THEN
        ALTER TABLE audit_logs RENAME COLUMN "createdAt" TO created_at;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'entityType') THEN
        ALTER TABLE audit_logs RENAME COLUMN "entityType" TO entity_type;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'entityId') THEN
        ALTER TABLE audit_logs RENAME COLUMN "entityId" TO entity_id;
    END IF;

    -- [AUDIT_LOGS] Fix Tipe Data (TEXT -> UUID)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'user_id' AND data_type = 'text') THEN
        ALTER TABLE audit_logs ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
    END IF;

    -- [USER_PROFILES] Fix Tipe Data (TEXT -> UUID)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'user_id' AND data_type = 'text') THEN
        ALTER TABLE user_profiles ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
    END IF;

    -- [SCHEDULED_TRANSFERS] Fix Tipe Data (TEXT -> UUID)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scheduled_transfers' AND column_name = 'user_id' AND data_type = 'text') THEN
        ALTER TABLE scheduled_transfers ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
    END IF;
END $$;

-- =================================================================
-- BAGIAN 3: SECURITY POLICIES (RLS)
-- =================================================================

-- Policy companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Company members can view company" ON companies;
CREATE POLICY "Company members can view company" ON companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.company_id = companies.id
    )
  );
DROP POLICY IF EXISTS "Users can create company" ON companies;
CREATE POLICY "Users can create company" ON companies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile (profiles)" ON profiles;
DROP POLICY IF EXISTS "Admins can view company profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile (profiles)" ON profiles;
CREATE POLICY "Users can view own profile (profiles)" ON profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins can view company profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles me
      WHERE me.id = auth.uid()
        AND me.company_id = profiles.company_id
        AND me.role IN ('owner','admin')
    )
  );
CREATE POLICY "Users can update own profile (profiles)" ON profiles
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert own profile (profiles)" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Policy company_settings
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Company members can view settings" ON company_settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON company_settings;
CREATE POLICY "Company members can view settings" ON company_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.company_id = company_settings.company_id
    )
  );
CREATE POLICY "Admins can manage settings" ON company_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.company_id = company_settings.company_id
        AND p.role IN ('owner','admin')
    )
  );

-- Policy audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON audit_logs;

DROP POLICY IF EXISTS "Company members can view logs" ON audit_logs;
DROP POLICY IF EXISTS "Members can insert logs" ON audit_logs;
CREATE POLICY "Company members can view logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.company_id = audit_logs.company_id
    )
    OR auth.uid() = user_id
  );
CREATE POLICY "Members can insert logs" ON audit_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.company_id = audit_logs.company_id
    )
    OR auth.uid() = user_id
  );

-- Policy user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

CREATE POLICY "Users can view their own profile" ON user_profiles 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON user_profiles 
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy scheduled_transfers
ALTER TABLE scheduled_transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own transfers" ON scheduled_transfers;

CREATE POLICY "Users can manage own transfers" ON scheduled_transfers 
    FOR ALL USING (auth.uid() = user_id);

-- Policy fixed_assets
ALTER TABLE fixed_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own assets" ON fixed_assets;
DROP POLICY IF EXISTS "Users can manage own assets" ON fixed_assets;

CREATE POLICY "Users can view own assets" ON fixed_assets
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Users can manage own assets" ON fixed_assets
    FOR ALL USING (auth.uid() = user_id);

-- =================================================================
-- BAGIAN 4: TRIGGERS
-- =================================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, role, full_name, email)
  VALUES (new.id, 'admin', new.raw_user_meta_data->>'full_name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Init profile untuk user lama
INSERT INTO public.user_profiles (user_id, role, email)
SELECT id, 'admin', email FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Seed profiles untuk user lama (sinkronisasi minimal)
INSERT INTO public.profiles (id, role, full_name, email)
SELECT u.id, COALESCE(up.role, 'owner'), COALESCE(up.full_name, u.email), u.email
FROM auth.users u
LEFT JOIN user_profiles up ON up.user_id = u.id
ON CONFLICT (id) DO NOTHING;
