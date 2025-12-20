-- ============================================
-- MIGRATION: Add "Diterima dari" and "Dibayarkan kepada" Fields
-- ============================================
-- Run this SQL if you already have the database setup

-- Add received_from column to income_entries (if not exists)
ALTER TABLE income_entries 
ADD COLUMN IF NOT EXISTS received_from TEXT;

-- Add paid_to column to expense_entries (if not exists)
ALTER TABLE expense_entries 
ADD COLUMN IF NOT EXISTS paid_to TEXT;

-- Add employees column to user_settings (if not exists)
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS employees JSONB DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN income_entries.received_from IS 'Siapa yang bayar/kasih duit (Klien A, Customer B, PT. ABC, dll)';
COMMENT ON COLUMN expense_entries.paid_to IS 'Dibayar ke siapa/untuk apa (Supplier X, Vendor Y, Karyawan Z, dll)';
COMMENT ON COLUMN user_settings.employees IS 'Daftar nama karyawan untuk tracking gaji';

-- Success!
SELECT 'Migration completed! New fields added.' AS status;