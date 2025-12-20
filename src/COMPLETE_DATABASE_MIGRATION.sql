-- ========================================
-- BABADOLAN - Complete Database Migration
-- ========================================
-- File ini berisi SEMUA tabel yang diperlukan aplikasi Babadolan
-- Jalankan file ini di Supabase SQL Editor untuk setup database lengkap
-- 
-- Cara Setup:
-- 1. Login ke https://app.supabase.com
-- 2. Pilih project Anda
-- 3. Klik "SQL Editor" di sidebar kiri
-- 4. Klik "New Query"
-- 5. Copy & paste SEMUA script di bawah ini
-- 6. Klik "Run" untuk execute
-- 7. Refresh aplikasi Babadolan
-- ========================================

-- Enable UUID extension (jika belum aktif)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- TABLE 1: Cash Transactions
-- ========================================
-- Tabel untuk mencatat semua transaksi kas (masuk & keluar)
CREATE TABLE IF NOT EXISTS cash_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  cash_type TEXT NOT NULL CHECK (cash_type IN ('big', 'small')),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('in', 'out')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  category TEXT,
  description TEXT NOT NULL,
  receipt_url TEXT,
  is_inter_cash_transfer BOOLEAN DEFAULT FALSE,
  linked_transaction_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cash_transactions_user_id ON cash_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_cash_type ON cash_transactions(cash_type);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_date ON cash_transactions(date);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_is_transfer ON cash_transactions(is_inter_cash_transfer);

-- RLS Policies
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own transactions" ON cash_transactions;
CREATE POLICY "Users can view their own transactions"
  ON cash_transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own transactions" ON cash_transactions;
CREATE POLICY "Users can insert their own transactions"
  ON cash_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own transactions" ON cash_transactions;
CREATE POLICY "Users can update their own transactions"
  ON cash_transactions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own transactions" ON cash_transactions;
CREATE POLICY "Users can delete their own transactions"
  ON cash_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- TABLE 2: Cash Balances
-- ========================================
-- Tabel untuk menyimpan saldo kas dan pengaturan
CREATE TABLE IF NOT EXISTS cash_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cash_type TEXT NOT NULL CHECK (cash_type IN ('big', 'small')),
  balance NUMERIC DEFAULT 0,
  low_balance_threshold NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, cash_type)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_cash_balances_user_id ON cash_balances(user_id);

-- RLS Policies
ALTER TABLE cash_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own balances" ON cash_balances;
CREATE POLICY "Users can view their own balances"
  ON cash_balances FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own balances" ON cash_balances;
CREATE POLICY "Users can insert their own balances"
  ON cash_balances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own balances" ON cash_balances;
CREATE POLICY "Users can update their own balances"
  ON cash_balances FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own balances" ON cash_balances;
CREATE POLICY "Users can delete their own balances"
  ON cash_balances FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- TABLE 3: Advance Payments
-- ========================================
-- Tabel untuk advance payment dan settlement karyawan
CREATE TABLE IF NOT EXISTS advance_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  employee_name TEXT NOT NULL,
  advance_amount NUMERIC NOT NULL,
  advance_date DATE NOT NULL,
  cash_type TEXT NOT NULL CHECK (cash_type IN ('big', 'small')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'settled', 'returned')),
  actual_expenses NUMERIC DEFAULT 0,
  expense_items JSONB DEFAULT '[]'::jsonb,
  settlement_date DATE,
  difference NUMERIC DEFAULT 0,
  return_date DATE,
  return_amount NUMERIC,
  return_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_advance_payments_user_id ON advance_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_advance_payments_status ON advance_payments(status);
CREATE INDEX IF NOT EXISTS idx_advance_payments_employee ON advance_payments(employee_name);

-- RLS Policies
ALTER TABLE advance_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own advance payments" ON advance_payments;
CREATE POLICY "Users can view their own advance payments"
  ON advance_payments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own advance payments" ON advance_payments;
CREATE POLICY "Users can insert their own advance payments"
  ON advance_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own advance payments" ON advance_payments;
CREATE POLICY "Users can update their own advance payments"
  ON advance_payments FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own advance payments" ON advance_payments;
CREATE POLICY "Users can delete their own advance payments"
  ON advance_payments FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- TABLE 4: Income Entries
-- ========================================
-- Tabel untuk mencatat pemasukan perusahaan
CREATE TABLE IF NOT EXISTS income_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_income_entries_user_id ON income_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_income_entries_date ON income_entries(date);
CREATE INDEX IF NOT EXISTS idx_income_entries_category ON income_entries(category);

-- RLS Policies
ALTER TABLE income_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own income entries" ON income_entries;
CREATE POLICY "Users can view their own income entries"
  ON income_entries FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own income entries" ON income_entries;
CREATE POLICY "Users can insert their own income entries"
  ON income_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own income entries" ON income_entries;
CREATE POLICY "Users can update their own income entries"
  ON income_entries FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own income entries" ON income_entries;
CREATE POLICY "Users can delete their own income entries"
  ON income_entries FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- TABLE 5: Expense Entries
-- ========================================
-- Tabel untuk mencatat pengeluaran perusahaan
CREATE TABLE IF NOT EXISTS expense_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  employee TEXT,
  receipt_url TEXT,
  transfer_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expense_entries_user_id ON expense_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_entries_date ON expense_entries(date);
CREATE INDEX IF NOT EXISTS idx_expense_entries_category ON expense_entries(category);
CREATE INDEX IF NOT EXISTS idx_expense_entries_employee ON expense_entries(employee);

-- RLS Policies
ALTER TABLE expense_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own expense entries" ON expense_entries;
CREATE POLICY "Users can view their own expense entries"
  ON expense_entries FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own expense entries" ON expense_entries;
CREATE POLICY "Users can insert their own expense entries"
  ON expense_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own expense entries" ON expense_entries;
CREATE POLICY "Users can update their own expense entries"
  ON expense_entries FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own expense entries" ON expense_entries;
CREATE POLICY "Users can delete their own expense entries"
  ON expense_entries FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- TABLE 6: App Settings
-- ========================================
-- Tabel untuk menyimpan pengaturan aplikasi per user
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  income_categories JSONB DEFAULT '[]'::jsonb,
  expense_categories JSONB DEFAULT '[]'::jsonb,
  employees JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_app_settings_user_id ON app_settings(user_id);

-- RLS Policies
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own settings" ON app_settings;
CREATE POLICY "Users can view their own settings"
  ON app_settings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own settings" ON app_settings;
CREATE POLICY "Users can insert their own settings"
  ON app_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON app_settings;
CREATE POLICY "Users can update their own settings"
  ON app_settings FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own settings" ON app_settings;
CREATE POLICY "Users can delete their own settings"
  ON app_settings FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- FUNCTIONS & TRIGGERS
-- ========================================

-- Function untuk auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers untuk auto-update updated_at
DROP TRIGGER IF EXISTS update_cash_transactions_updated_at ON cash_transactions;
CREATE TRIGGER update_cash_transactions_updated_at
  BEFORE UPDATE ON cash_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cash_balances_updated_at ON cash_balances;
CREATE TRIGGER update_cash_balances_updated_at
  BEFORE UPDATE ON cash_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_advance_payments_updated_at ON advance_payments;
CREATE TRIGGER update_advance_payments_updated_at
  BEFORE UPDATE ON advance_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_income_entries_updated_at ON income_entries;
CREATE TRIGGER update_income_entries_updated_at
  BEFORE UPDATE ON income_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expense_entries_updated_at ON expense_entries;
CREATE TRIGGER update_expense_entries_updated_at
  BEFORE UPDATE ON expense_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '✅ BABADOLAN Database Migration Completed Successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  1. cash_transactions (with inter-cash transfer support)';
  RAISE NOTICE '  2. cash_balances';
  RAISE NOTICE '  3. advance_payments';
  RAISE NOTICE '  4. income_entries';
  RAISE NOTICE '  5. expense_entries';
  RAISE NOTICE '  6. app_settings';
  RAISE NOTICE '';
  RAISE NOTICE 'Features Enabled:';
  RAISE NOTICE '  ✓ Row Level Security (RLS)';
  RAISE NOTICE '  ✓ Auto-update timestamps';
  RAISE NOTICE '  ✓ Indexes for performance';
  RAISE NOTICE '  ✓ Data validation constraints';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Refresh aplikasi Babadolan';
  RAISE NOTICE '  2. Login dengan email & password Anda';
  RAISE NOTICE '  3. Mulai gunakan semua fitur!';
  RAISE NOTICE '';
  RAISE NOTICE 'Happy accounting! 🎉';
END $$;
