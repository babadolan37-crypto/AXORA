-- ============================================
-- FRESH INSTALL: Create Cash Tables from Scratch
-- ============================================
-- Jalankan script ini untuk membuat tabel baru
-- Script ini akan MENGHAPUS data lama (jika ada)
-- ============================================

-- STEP 1: Drop existing tables (jika ada)
DROP TABLE IF EXISTS cash_transactions CASCADE;
DROP TABLE IF EXISTS cash_balances CASCADE;

-- STEP 2: Create cash_transactions table
CREATE TABLE cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  cash_type VARCHAR(10) NOT NULL CHECK (cash_type IN ('big', 'small')),
  transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  is_inter_cash_transfer BOOLEAN DEFAULT FALSE,
  linked_transaction_id UUID,
  proof TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint
ALTER TABLE cash_transactions
ADD CONSTRAINT fk_linked_transaction 
FOREIGN KEY (linked_transaction_id) 
REFERENCES cash_transactions(id) 
ON DELETE SET NULL;

-- STEP 3: Create cash_balances table
CREATE TABLE cash_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  cash_type VARCHAR(10) NOT NULL CHECK (cash_type IN ('big', 'small')),
  balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  low_balance_threshold NUMERIC(15, 2) DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, cash_type)
);

-- STEP 4: Create indexes for performance
CREATE INDEX idx_cash_transactions_user ON cash_transactions(user_id);
CREATE INDEX idx_cash_transactions_date ON cash_transactions(date);
CREATE INDEX idx_cash_transactions_type ON cash_transactions(cash_type, transaction_type);
CREATE INDEX idx_cash_balances_user ON cash_balances(user_id);

-- STEP 5: Enable RLS
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_balances ENABLE ROW LEVEL SECURITY;

-- STEP 6: Create RLS policies
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

-- STEP 7: Verify tables created
SELECT 'cash_transactions' as table_name, COUNT(*) as row_count FROM cash_transactions
UNION ALL
SELECT 'cash_balances' as table_name, COUNT(*) as row_count FROM cash_balances;

-- ============================================
-- SELESAI!
-- ============================================
-- Jika berhasil, Anda akan lihat:
-- table_name          | row_count
-- --------------------|-----------
-- cash_transactions   | 0
-- cash_balances       | 0
-- 
-- Refresh browser (F5) setelah ini!
-- ============================================
