-- ⚡ QUICK FIX: Error "is_inter_cash_transfer column not found"
-- Copy seluruh SQL ini dan paste ke Supabase SQL Editor
-- Kemudian klik "Run" atau tekan Ctrl+Enter

-- Step 1: Add missing columns
ALTER TABLE cash_transactions
ADD COLUMN IF NOT EXISTS is_inter_cash_transfer BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS linked_transaction_id UUID REFERENCES cash_transactions(id) ON DELETE SET NULL;

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cash_transactions_inter_cash 
ON cash_transactions(is_inter_cash_transfer) 
WHERE is_inter_cash_transfer = TRUE;

CREATE INDEX IF NOT EXISTS idx_cash_transactions_linked 
ON cash_transactions(linked_transaction_id) 
WHERE linked_transaction_id IS NOT NULL;

-- Step 3: Update existing data
UPDATE cash_transactions 
SET is_inter_cash_transfer = FALSE 
WHERE is_inter_cash_transfer IS NULL;

-- Step 4: Add comments for documentation
COMMENT ON COLUMN cash_transactions.is_inter_cash_transfer IS 'Flag untuk menandai transaksi sebagai transfer antar kas internal';
COMMENT ON COLUMN cash_transactions.linked_transaction_id IS 'ID transaksi pasangan untuk inter-cash transfer (debit-credit pair)';

-- ✅ SELESAI!
-- Sekarang refresh aplikasi (Ctrl+Shift+R) dan coba fitur Transfer Kas
