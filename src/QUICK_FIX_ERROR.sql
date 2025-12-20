-- ========================================
-- QUICK FIX: Error "advance_payments not found"
-- ========================================
-- Jalankan script ini di Supabase SQL Editor
-- Waktu: < 1 menit
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create advance_payments table
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

-- Enable RLS
ALTER TABLE advance_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Table advance_payments created successfully!';
  RAISE NOTICE 'Next: Refresh aplikasi Babadolan';
END $$;
