-- ============================================
-- STEP 1: VERIFY - Cek apakah tabel sudah ada
-- ============================================
-- Jalankan query ini PERTAMA untuk cek status tabel
-- ============================================

-- Cek tabel cash_transactions
SELECT 
    'cash_transactions' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'cash_transactions'
    ) as table_exists;

-- Cek tabel cash_balances
SELECT 
    'cash_balances' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'cash_balances'
    ) as table_exists;

-- Cek kolom di cash_transactions (jika ada)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cash_transactions'
ORDER BY ordinal_position;

-- ============================================
-- HASIL:
-- ============================================
-- Jika table_exists = FALSE → Tabel belum dibuat
-- Jika table_exists = TRUE → Tabel sudah ada
-- ============================================
