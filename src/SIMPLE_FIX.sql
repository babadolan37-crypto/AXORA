-- ============================================
-- SIMPLE FIX: Perbaikan Error Kolom Missing
-- ============================================
-- Jalankan HANYA INI jika ada error:
-- "column is_inter_cash_transfer does not exist"
--
-- Script ini HANYA menambah kolom yang hilang
-- ============================================

-- Tambah kolom yang hilang di cash_transactions
DO $$ 
BEGIN
    -- 1. is_inter_cash_transfer
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_transactions' 
        AND column_name = 'is_inter_cash_transfer'
    ) THEN
        ALTER TABLE cash_transactions
        ADD COLUMN is_inter_cash_transfer BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ Added: is_inter_cash_transfer';
    END IF;

    -- 2. linked_transaction_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_transactions' 
        AND column_name = 'linked_transaction_id'
    ) THEN
        ALTER TABLE cash_transactions
        ADD COLUMN linked_transaction_id UUID REFERENCES cash_transactions(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Added: linked_transaction_id';
    END IF;

    -- 3. proof
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_transactions' 
        AND column_name = 'proof'
    ) THEN
        ALTER TABLE cash_transactions
        ADD COLUMN proof TEXT[];
        RAISE NOTICE '✅ Added: proof';
    END IF;
    
    -- 4. description (if missing)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_transactions' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE cash_transactions
        ADD COLUMN description TEXT;
        RAISE NOTICE '✅ Added: description';
    END IF;
END $$;

-- Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_cash_transactions_is_transfer 
ON cash_transactions(is_inter_cash_transfer);

CREATE INDEX IF NOT EXISTS idx_cash_transactions_linked 
ON cash_transactions(linked_transaction_id);

-- Update data lama (set default FALSE)
UPDATE cash_transactions 
SET is_inter_cash_transfer = FALSE 
WHERE is_inter_cash_transfer IS NULL;

-- ============================================
-- SELESAI!
-- ============================================
-- Refresh aplikasi (F5) setelah menjalankan ini
-- ============================================
