-- ============================================
-- BABADOLAN - Database Schema
-- ============================================
-- 🚨 PENTING: Copy & Paste SQL ini ke Supabase SQL Editor!
-- ============================================

-- Enable UUID extension (jika belum)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABEL 1: user_settings (Pengaturan User)
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  income_sources JSONB DEFAULT '["Penjualan Produk", "Penjualan Jasa", "Pemasukan Investasi", "Pembayaran Piutang", "Lainnya"]'::jsonb,
  expense_categories JSONB DEFAULT '["Gaji Karyawan", "Sewa", "Bahan Baku", "Listrik", "Air", "Internet & Telekomunikasi", "Transportasi", "Peralatan Kantor", "Marketing", "Pajak", "Lainnya"]'::jsonb,
  payment_methods JSONB DEFAULT '["Tunai", "Transfer Bank", "Cek", "Kartu Kredit", "E-Wallet"]'::jsonb,
  employees JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABEL 2: income_entries (Pemasukan)
-- ============================================
CREATE TABLE IF NOT EXISTS income_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  source TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount NUMERIC(20, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  notes TEXT DEFAULT '',
  photos JSONB DEFAULT '[]'::jsonb,
  received_from TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABEL 3: expense_entries (Pengeluaran)
-- ============================================
CREATE TABLE IF NOT EXISTS expense_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount NUMERIC(20, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  notes TEXT DEFAULT '',
  photos JSONB DEFAULT '[]'::jsonb,
  paid_to TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABEL 4: debt_entries (Piutang & Hutang)
-- ============================================
CREATE TABLE IF NOT EXISTS debt_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('piutang', 'hutang')),
  date DATE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount NUMERIC(20, 2) NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'belum lunas' CHECK (status IN ('belum lunas', 'lunas')),
  payment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Data Terpisah Per User
-- ============================================

-- Enable RLS untuk semua table
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (jika ada)
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON user_settings;

DROP POLICY IF EXISTS "Users can view own income" ON income_entries;
DROP POLICY IF EXISTS "Users can insert own income" ON income_entries;
DROP POLICY IF EXISTS "Users can update own income" ON income_entries;
DROP POLICY IF EXISTS "Users can delete own income" ON income_entries;

DROP POLICY IF EXISTS "Users can view own expenses" ON expense_entries;
DROP POLICY IF EXISTS "Users can insert own expenses" ON expense_entries;
DROP POLICY IF EXISTS "Users can update own expenses" ON expense_entries;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expense_entries;

DROP POLICY IF EXISTS "Users can view own debts" ON debt_entries;
DROP POLICY IF EXISTS "Users can insert own debts" ON debt_entries;
DROP POLICY IF EXISTS "Users can update own debts" ON debt_entries;
DROP POLICY IF EXISTS "Users can delete own debts" ON debt_entries;

-- ============================================
-- POLICIES: user_settings
-- ============================================
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete own settings" ON user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- POLICIES: income_entries
-- ============================================
CREATE POLICY "Users can view own income" ON income_entries
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert own income" ON income_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update own income" ON income_entries
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete own income" ON income_entries
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- POLICIES: expense_entries
-- ============================================
CREATE POLICY "Users can view own expenses" ON expense_entries
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert own expenses" ON expense_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update own expenses" ON expense_entries
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete own expenses" ON expense_entries
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- POLICIES: debt_entries
-- ============================================
CREATE POLICY "Users can view own debts" ON debt_entries
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert own debts" ON debt_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update own debts" ON debt_entries
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete own debts" ON debt_entries
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- INDEXES untuk Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_income_user_date ON income_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expense_user_date ON expense_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_debt_user_type ON debt_entries(user_id, type);
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);

-- ============================================
-- TABEL 5: cash_balances (Saldo Kas)
-- ============================================
CREATE TABLE IF NOT EXISTS cash_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cash_type TEXT NOT NULL CHECK (cash_type IN ('big', 'small')),
  balance NUMERIC(20, 2) DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, cash_type)
);

-- ============================================
-- TABEL 6: cash_transfers (Transfer Kas)
-- ============================================
CREATE TABLE IF NOT EXISTS cash_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  cash_type TEXT NOT NULL CHECK (cash_type IN ('big', 'small')),
  employee_name TEXT NOT NULL,
  transfer_amount NUMERIC(20, 2) NOT NULL,
  actual_expense NUMERIC(20, 2) DEFAULT 0,
  difference NUMERIC(20, 2) DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('pending', 'reported', 'settled', 'need_return', 'need_payment')),
  description TEXT DEFAULT '',
  return_amount NUMERIC(20, 2),
  return_date DATE,
  return_proof TEXT,
  additional_payment NUMERIC(20, 2),
  additional_payment_date DATE,
  additional_payment_proof TEXT,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABEL 7: expense_details (Detail Pengeluaran Kas)
-- ============================================
CREATE TABLE IF NOT EXISTS expense_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID REFERENCES cash_transfers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(20, 2) NOT NULL,
  proof TEXT DEFAULT '',
  vendor TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- RLS untuk Tabel Kas
-- ============================================
ALTER TABLE cash_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_details ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (jika ada)
DROP POLICY IF EXISTS "Users can view own cash balances" ON cash_balances;
DROP POLICY IF EXISTS "Users can insert own cash balances" ON cash_balances;
DROP POLICY IF EXISTS "Users can update own cash balances" ON cash_balances;
DROP POLICY IF EXISTS "Users can delete own cash balances" ON cash_balances;

DROP POLICY IF EXISTS "Users can view own cash transfers" ON cash_transfers;
DROP POLICY IF EXISTS "Users can insert own cash transfers" ON cash_transfers;
DROP POLICY IF EXISTS "Users can update own cash transfers" ON cash_transfers;
DROP POLICY IF EXISTS "Users can delete own cash transfers" ON cash_transfers;

DROP POLICY IF EXISTS "Users can view own expense details" ON expense_details;
DROP POLICY IF EXISTS "Users can insert own expense details" ON expense_details;
DROP POLICY IF EXISTS "Users can update own expense details" ON expense_details;
DROP POLICY IF EXISTS "Users can delete own expense details" ON expense_details;

-- ============================================
-- POLICIES: cash_balances
-- ============================================
CREATE POLICY "Users can view own cash balances" ON cash_balances
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert own cash balances" ON cash_balances
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update own cash balances" ON cash_balances
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete own cash balances" ON cash_balances
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- POLICIES: cash_transfers
-- ============================================
CREATE POLICY "Users can view own cash transfers" ON cash_transfers
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert own cash transfers" ON cash_transfers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update own cash transfers" ON cash_transfers
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete own cash transfers" ON cash_transfers
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- POLICIES: expense_details
-- ============================================
-- expense_details harus cek via join ke cash_transfers
CREATE POLICY "Users can view own expense details" ON expense_details
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cash_transfers
      WHERE cash_transfers.id = expense_details.transfer_id
      AND cash_transfers.user_id = auth.uid()
    )
  );
  
CREATE POLICY "Users can insert own expense details" ON expense_details
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM cash_transfers
      WHERE cash_transfers.id = expense_details.transfer_id
      AND cash_transfers.user_id = auth.uid()
    )
  );
  
CREATE POLICY "Users can update own expense details" ON expense_details
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM cash_transfers
      WHERE cash_transfers.id = expense_details.transfer_id
      AND cash_transfers.user_id = auth.uid()
    )
  );
  
CREATE POLICY "Users can delete own expense details" ON expense_details
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM cash_transfers
      WHERE cash_transfers.id = expense_details.transfer_id
      AND cash_transfers.user_id = auth.uid()
    )
  );

-- ============================================
-- INDEXES untuk Cash Management Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cash_balances_user ON cash_balances(user_id, cash_type);
CREATE INDEX IF NOT EXISTS idx_cash_transfers_user_date ON cash_transfers(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_cash_transfers_status ON cash_transfers(user_id, status);
CREATE INDEX IF NOT EXISTS idx_expense_details_transfer ON expense_details(transfer_id);

-- ============================================
-- ✅ SUCCESS! Database schema berhasil dibuat!
-- ============================================
-- Tabel yang dibuat:
-- ✅ user_settings
-- ✅ income_entries
-- ✅ expense_entries
-- ✅ debt_entries
-- ✅ cash_balances
-- ✅ cash_transfers
-- ✅ expense_details
--
-- RLS Policies: AKTIF (setiap user hanya bisa akses data mereka sendiri)
-- Indexes: DIBUAT (untuk query cepat)
-- ============================================