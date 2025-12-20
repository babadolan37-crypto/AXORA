-- =================================================================
-- SQL SETUP UNTUK FITUR ADMIN & KEAMANAN
-- (User Roles, Audit Logs, Scheduled Transfers)
-- =================================================================

-- 1. Enable UUID extension (jika belum)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================
-- TABEL 1: User Profiles (untuk User Roles)
-- =================================================================
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

-- RLS Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- =================================================================
-- TABEL 2: Audit Logs (untuk Riwayat Aktivitas)
-- =================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID, -- Diganti ke UUID agar konsisten, jika error ganti TEXT
  old_value JSONB,
  new_value JSONB,
  description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own logs" ON audit_logs;
CREATE POLICY "Users can view own logs" ON audit_logs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own logs" ON audit_logs;
CREATE POLICY "Users can insert own logs" ON audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =================================================================
-- TABEL 3: Scheduled Transfers (Transfer Terjadwal)
-- =================================================================
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

-- RLS Policies
ALTER TABLE scheduled_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own transfers" ON scheduled_transfers;
CREATE POLICY "Users can manage own transfers" ON scheduled_transfers FOR ALL USING (auth.uid() = user_id);


-- =================================================================
-- TRIGGER: Auto-create Profile untuk User Baru
-- =================================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, role, full_name, email)
  VALUES (
    NEW.id,
    'admin', -- Default role
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- =================================================================
-- INISIALISASI: Buat Profile untuk User yang SUDAH ADA
-- =================================================================
INSERT INTO user_profiles (user_id, role, full_name, email)
SELECT 
  id,
  'admin',
  COALESCE(raw_user_meta_data->>'full_name', SPLIT_PART(email, '@', 1)),
  email
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

