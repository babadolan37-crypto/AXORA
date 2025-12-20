-- =================================================================
-- SQL SETUP: FIXED ASSETS (MANAJEMEN ASET TETAP)
-- =================================================================

-- 1. Create Table: fixed_assets
CREATE TABLE IF NOT EXISTS fixed_assets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Elektronik', 'Kendaraan', 'Mesin', 'Furniture', 'Bangunan', 'Tanah', 'Lainnya')),
  purchase_date DATE NOT NULL,
  purchase_cost NUMERIC(15, 2) NOT NULL, -- Harga Perolehan
  residual_value NUMERIC(15, 2) DEFAULT 0, -- Nilai Sisa
  useful_life_years INTEGER NOT NULL, -- Umur Ekonomis (Tahun)
  depreciation_method TEXT DEFAULT 'straight_line', -- Metode Penyusutan (Garis Lurus)
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disposed', 'sold')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- 2. Enable RLS
ALTER TABLE fixed_assets ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies
DROP POLICY IF EXISTS "Users can manage own assets" ON fixed_assets;
CREATE POLICY "Users can manage own assets" ON fixed_assets
  FOR ALL USING (auth.uid() = user_id);

-- 4. Fix potential type mismatch for user_id (Preventive)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fixed_assets' AND column_name = 'user_id' AND data_type = 'text') THEN
        ALTER TABLE fixed_assets ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
    END IF;
END $$;
