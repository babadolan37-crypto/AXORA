-- ============================================
-- QUICK FIX: Create Cash Management Tables
-- ============================================
-- Jalankan script ini di Supabase SQL Editor untuk memperbaiki error:
-- "Cash transactions table not found"
--
-- Script ini akan:
-- 1. Create tabel cash_transactions
-- 2. Create tabel cash_balances  
-- 3. Setup RLS policies
-- 4. Initialize saldo awal untuk user
-- ============================================

-- ============================================
-- OPSI A: Fresh Install (RECOMMENDED)
-- ============================================
-- Uncomment 2 baris di bawah jika ingin hapus tabel lama dan buat ulang
-- DROP TABLE IF EXISTS cash_transactions CASCADE;
-- DROP TABLE IF EXISTS cash_balances CASCADE;

-- ============================================
-- 1. TABEL: cash_transactions
-- ============================================
CREATE TABLE IF NOT EXISTS cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Transaction Details
  cash_type VARCHAR(10) NOT NULL CHECK (cash_type IN ('big', 'small')),
  transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  
  -- Inter-cash transfer support
  is_inter_cash_transfer BOOLEAN DEFAULT FALSE,
  linked_transaction_id UUID REFERENCES cash_transactions(id) ON DELETE SET NULL,
  
  -- Attachments
  proof TEXT[], -- Array of photo URLs
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ADD MISSING COLUMNS (if table already exists)
-- ============================================
-- This section handles existing tables that are missing columns
DO $$ 
BEGIN
    -- Add is_inter_cash_transfer if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_transactions' 
        AND column_name = 'is_inter_cash_transfer'
    ) THEN
        ALTER TABLE cash_transactions
        ADD COLUMN is_inter_cash_transfer BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ Added column: is_inter_cash_transfer';
    END IF;

    -- Add linked_transaction_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_transactions' 
        AND column_name = 'linked_transaction_id'
    ) THEN
        ALTER TABLE cash_transactions
        ADD COLUMN linked_transaction_id UUID REFERENCES cash_transactions(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Added column: linked_transaction_id';
    END IF;

    -- Add proof if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_transactions' 
        AND column_name = 'proof'
    ) THEN
        ALTER TABLE cash_transactions
        ADD COLUMN proof TEXT[];
        RAISE NOTICE '✅ Added column: proof';
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cash_transactions_user_id ON cash_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_cash_type ON cash_transactions(cash_type);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_date ON cash_transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_is_transfer ON cash_transactions(is_inter_cash_transfer);

-- ============================================
-- 2. TABEL: cash_balances
-- ============================================
CREATE TABLE IF NOT EXISTS cash_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Balance Info
  cash_type VARCHAR(10) NOT NULL CHECK (cash_type IN ('big', 'small')),
  balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  
  -- Thresholds
  low_balance_threshold NUMERIC(15, 2) DEFAULT 0,
  
  -- Metadata
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: One balance per user per cash_type
  UNIQUE(user_id, cash_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cash_balances_user ON cash_balances(user_id, cash_type);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_balances ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can view their own transactions" ON cash_transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON cash_transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON cash_transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON cash_transactions;

DROP POLICY IF EXISTS "Users can view own cash balances" ON cash_balances;
DROP POLICY IF EXISTS "Users can insert own cash balances" ON cash_balances;
DROP POLICY IF EXISTS "Users can update own cash balances" ON cash_balances;
DROP POLICY IF EXISTS "Users can delete own cash balances" ON cash_balances;

-- Create policies for cash_transactions
CREATE POLICY "Users can view their own transactions"
  ON cash_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON cash_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON cash_transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON cash_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for cash_balances
CREATE POLICY "Users can view own cash balances"
  ON cash_balances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cash balances"
  ON cash_balances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cash balances"
  ON cash_balances FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cash balances"
  ON cash_balances FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. INITIALIZE DEFAULT BALANCES
-- ============================================
-- Function to initialize balances for a user
CREATE OR REPLACE FUNCTION initialize_cash_balances_for_user(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Check if balances already exist
  IF NOT EXISTS (SELECT 1 FROM cash_balances WHERE user_id = p_user_id) THEN
    -- Insert default balances (both start at 0)
    INSERT INTO cash_balances (user_id, cash_type, balance, low_balance_threshold, last_updated)
    VALUES 
      (p_user_id, 'big', 0, 1000000, NOW()),
      (p_user_id, 'small', 0, 500000, NOW());
    
    RAISE NOTICE 'Cash balances initialized for user %', p_user_id;
  ELSE
    RAISE NOTICE 'Cash balances already exist for user %', p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. AUTO-INITIALIZE for Current User
-- ============================================
-- Run this to initialize balances for your account
SELECT initialize_cash_balances_for_user(auth.uid());

-- ============================================
-- 6. VERIFY INSTALLATION
-- ============================================
-- Check if tables created successfully
SELECT 
  'cash_transactions' AS table_name,
  COUNT(*) AS record_count
FROM cash_transactions
WHERE user_id = auth.uid()

UNION ALL

SELECT 
  'cash_balances' AS table_name,
  COUNT(*) AS record_count
FROM cash_balances
WHERE user_id = auth.uid();

-- ============================================
-- SUCCESS!
-- ============================================
-- Setelah menjalankan script ini:
-- 1. ✅ Tabel cash_transactions dibuat
-- 2. ✅ Tabel cash_balances dibuat
-- 3. ✅ RLS policies aktif
-- 4. ✅ Saldo awal 0 untuk Kas Besar & Kas Kecil
--
-- Sekarang Anda bisa:
-- - Tambah pengeluaran → Saldo otomatis turun
-- - Tambah pemasukan → Saldo otomatis naik
-- - Set saldo awal lewat Dashboard
-- ============================================