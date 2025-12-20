-- ============================================
-- MIGRATION: Menambahkan Cash Type ke Income & Expense
-- ============================================
-- File: MIGRATION_ADD_CASH_TYPE.sql
-- Deskripsi: Menambahkan kolom cash_type untuk memisahkan 
--            pemasukan dan pengeluaran Kas Besar & Kas Kecil
-- Dibuat: 2025-12-15
-- ============================================

-- 1. Tambahkan kolom cash_type ke tabel income_entries
ALTER TABLE income_entries 
ADD COLUMN IF NOT EXISTS cash_type TEXT DEFAULT 'big' CHECK (cash_type IN ('big', 'small'));

-- Update existing data dengan default 'big' (Kas Besar)
UPDATE income_entries 
SET cash_type = 'big' 
WHERE cash_type IS NULL;

-- Set NOT NULL setelah update
ALTER TABLE income_entries 
ALTER COLUMN cash_type SET NOT NULL;

-- 2. Tambahkan kolom cash_type ke tabel expense_entries
ALTER TABLE expense_entries 
ADD COLUMN IF NOT EXISTS cash_type TEXT DEFAULT 'big' CHECK (cash_type IN ('big', 'small'));

-- Update existing data dengan default 'big' (Kas Besar)
UPDATE expense_entries 
SET cash_type = 'big' 
WHERE cash_type IS NULL;

-- Set NOT NULL setelah update
ALTER TABLE expense_entries 
ALTER COLUMN cash_type SET NOT NULL;

-- 3. Tambahkan index untuk performa query
CREATE INDEX IF NOT EXISTS idx_income_entries_cash_type 
ON income_entries(user_id, cash_type);

CREATE INDEX IF NOT EXISTS idx_expense_entries_cash_type 
ON expense_entries(user_id, cash_type);

-- 4. Tambahkan index gabungan untuk query filter tanggal + cash_type
CREATE INDEX IF NOT EXISTS idx_income_entries_date_cash_type 
ON income_entries(user_id, date DESC, cash_type);

CREATE INDEX IF NOT EXISTS idx_expense_entries_date_cash_type 
ON expense_entries(user_id, date DESC, cash_type);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Cek struktur tabel income_entries
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'income_entries' 
  AND column_name = 'cash_type';

-- Cek struktur tabel expense_entries
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'expense_entries' 
  AND column_name = 'cash_type';

-- Cek data income per cash type
SELECT 
  cash_type,
  COUNT(*) as total_records,
  SUM(amount) as total_amount
FROM income_entries
GROUP BY cash_type;

-- Cek data expense per cash type
SELECT 
  cash_type,
  COUNT(*) as total_records,
  SUM(amount) as total_amount
FROM expense_entries
GROUP BY cash_type;

-- ============================================
-- ROLLBACK (jika diperlukan)
-- ============================================
-- Uncomment untuk rollback
-- DROP INDEX IF EXISTS idx_income_entries_cash_type;
-- DROP INDEX IF EXISTS idx_expense_entries_cash_type;
-- DROP INDEX IF EXISTS idx_income_entries_date_cash_type;
-- DROP INDEX IF EXISTS idx_expense_entries_date_cash_type;
-- ALTER TABLE income_entries DROP COLUMN IF EXISTS cash_type;
-- ALTER TABLE expense_entries DROP COLUMN IF EXISTS cash_type;
