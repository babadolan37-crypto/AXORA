-- Migration: Add Inter-Cash Transfer Support
-- Date: 2024-12-15
-- Description: Menambahkan field untuk support transfer antar kas (Kas Besar ↔ Kas Kecil)

-- Add columns to cash_transactions table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_transactions' 
        AND column_name = 'is_inter_cash_transfer'
    ) THEN
        ALTER TABLE cash_transactions
        ADD COLUMN is_inter_cash_transfer BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_transactions' 
        AND column_name = 'linked_transaction_id'
    ) THEN
        ALTER TABLE cash_transactions
        ADD COLUMN linked_transaction_id UUID REFERENCES cash_transactions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for better performance on inter-cash transfer queries
CREATE INDEX IF NOT EXISTS idx_cash_transactions_inter_cash 
ON cash_transactions(is_inter_cash_transfer) 
WHERE is_inter_cash_transfer = TRUE;

CREATE INDEX IF NOT EXISTS idx_cash_transactions_linked 
ON cash_transactions(linked_transaction_id) 
WHERE linked_transaction_id IS NOT NULL;

-- Update existing transactions to mark them as non-inter-cash transfers
UPDATE cash_transactions 
SET is_inter_cash_transfer = FALSE 
WHERE is_inter_cash_transfer IS NULL;

-- Update RLS policies if needed
-- Drop and recreate the INSERT policy to include new columns
DROP POLICY IF EXISTS "Users can insert their own cash transactions" ON cash_transactions;
CREATE POLICY "Users can insert their own cash transactions"
ON cash_transactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Drop and recreate the SELECT policy
DROP POLICY IF EXISTS "Users can view their own cash transactions" ON cash_transactions;
CREATE POLICY "Users can view their own cash transactions"
ON cash_transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Drop and recreate the UPDATE policy to include new columns
DROP POLICY IF EXISTS "Users can update their own cash transactions" ON cash_transactions;
CREATE POLICY "Users can update their own cash transactions"
ON cash_transactions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Drop and recreate the DELETE policy
DROP POLICY IF EXISTS "Users can delete their own cash transactions" ON cash_transactions;
CREATE POLICY "Users can delete their own cash transactions"
ON cash_transactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

COMMENT ON COLUMN cash_transactions.is_inter_cash_transfer IS 'Flag untuk menandai transaksi sebagai transfer antar kas internal';
COMMENT ON COLUMN cash_transactions.linked_transaction_id IS 'ID transaksi pasangan untuk inter-cash transfer (debit-credit pair)';