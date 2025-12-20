-- ============================================
-- FIX: Add cash_type column to expense_entries
-- ============================================

-- Add cash_type column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expense_entries' 
    AND column_name = 'cash_type'
  ) THEN
    ALTER TABLE expense_entries 
    ADD COLUMN cash_type TEXT CHECK (cash_type IN ('big', 'small'));
    
    -- Set default value for existing rows to 'big'
    UPDATE expense_entries SET cash_type = 'big' WHERE cash_type IS NULL;
  END IF;
END $$;

-- Also check income_entries table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'income_entries' 
    AND column_name = 'cash_type'
  ) THEN
    ALTER TABLE income_entries 
    ADD COLUMN cash_type TEXT CHECK (cash_type IN ('big', 'small'));
    
    -- Set default value for existing rows to 'big'
    UPDATE income_entries SET cash_type = 'big' WHERE cash_type IS NULL;
  END IF;
END $$;

-- Verify the columns were added
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name IN ('expense_entries', 'income_entries')
  AND column_name = 'cash_type';
