-- ============================================
-- DOUBLE-ENTRY ACCOUNTING SYSTEM SCHEMA
-- ============================================
-- Untuk: Babadolan (Aplikasi Akuntansi PT)
-- Database: PostgreSQL (Supabase)
-- Prinsip: Double-entry bookkeeping
-- ============================================

-- ============================================
-- 1. CHART OF ACCOUNTS (Buku Besar)
-- ============================================
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Account Identity
  code VARCHAR(20) NOT NULL, -- e.g., "1101", "5101"
  name VARCHAR(255) NOT NULL, -- e.g., "Kas Kecil", "Beban Gaji"
  
  -- Account Classification
  type VARCHAR(20) NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  sub_type VARCHAR(50), -- e.g., 'cash', 'bank', 'salary_expense', 'utilities'
  
  -- Account Rules
  normal_balance VARCHAR(10) NOT NULL CHECK (normal_balance IN ('debit', 'credit')),
  -- asset/expense = debit normal, liability/equity/revenue = credit normal
  
  is_cash_account BOOLEAN DEFAULT FALSE, -- TRUE untuk Kas Kecil, Bank, dll
  is_system_account BOOLEAN DEFAULT FALSE, -- TRUE untuk akun yang tidak bisa dihapus
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Hierarchy (optional untuk sub-accounts)
  parent_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  
  -- Metadata
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, code)
);

-- Index untuk performa
CREATE INDEX idx_accounts_user_type ON accounts(user_id, type);
CREATE INDEX idx_accounts_user_cash ON accounts(user_id, is_cash_account) WHERE is_cash_account = TRUE;

-- ============================================
-- 2. JOURNAL ENTRIES (Header Transaksi)
-- ============================================
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Entry Metadata
  entry_number VARCHAR(50) NOT NULL, -- e.g., "JE-2025-0001"
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Entry Type & Source
  entry_type VARCHAR(50) NOT NULL, 
  -- 'expense', 'income', 'transfer', 'salary', 'debt_payment', 'opening_balance', etc
  
  source_module VARCHAR(50), -- 'manual', 'expense_form', 'salary_form', 'transfer_form'
  reference_id UUID, -- ID dari tabel sumber (expenses, salaries, dll) jika ada
  
  -- Entry Description
  description TEXT NOT NULL,
  notes TEXT,
  
  -- Entry Status
  status VARCHAR(20) NOT NULL DEFAULT 'posted' CHECK (status IN ('draft', 'posted', 'void')),
  posted_at TIMESTAMP WITH TIME ZONE,
  voided_at TIMESTAMP WITH TIME ZONE,
  voided_by UUID REFERENCES auth.users(id),
  void_reason TEXT,
  
  -- Attachments
  photos TEXT[], -- Array of photo URLs
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(user_id, entry_number)
);

-- Index untuk performa
CREATE INDEX idx_journal_entries_user_date ON journal_entries(user_id, entry_date DESC);
CREATE INDEX idx_journal_entries_user_status ON journal_entries(user_id, status);
CREATE INDEX idx_journal_entries_type ON journal_entries(user_id, entry_type);
CREATE INDEX idx_journal_entries_reference ON journal_entries(reference_id) WHERE reference_id IS NOT NULL;

-- ============================================
-- 3. JOURNAL LINES (Detail Debit/Credit)
-- ============================================
CREATE TABLE IF NOT EXISTS journal_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  
  -- Account Link
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  
  -- Amounts (ALWAYS store as positive numbers)
  debit DECIMAL(15, 2) DEFAULT 0 CHECK (debit >= 0),
  credit DECIMAL(15, 2) DEFAULT 0 CHECK (credit >= 0),
  
  -- Line Description (optional, override entry description)
  description TEXT,
  
  -- Metadata for analysis
  tags TEXT[], -- e.g., ['project_a', 'department_sales']
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: Either debit OR credit must be > 0, not both
  CONSTRAINT chk_debit_or_credit CHECK (
    (debit > 0 AND credit = 0) OR 
    (debit = 0 AND credit > 0)
  )
);

-- Index untuk performa query saldo
CREATE INDEX idx_journal_lines_account ON journal_lines(account_id);
CREATE INDEX idx_journal_lines_journal ON journal_lines(journal_entry_id);

-- ============================================
-- 4. EXPENSES (Metadata untuk UI - OPTIONAL)
-- ============================================
-- Tabel ini OPSIONAL, hanya untuk menyimpan metadata form pengeluaran
-- Saldo TETAP dihitung dari journal_lines, bukan dari tabel ini
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Link ke journal entry (WAJIB)
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  
  -- Form Data
  expense_date DATE NOT NULL,
  category VARCHAR(100) NOT NULL, -- e.g., "ATK", "Transport", "Gaji"
  description TEXT,
  total_amount DECIMAL(15, 2) NOT NULL CHECK (total_amount > 0),
  
  -- Payment Method
  paid_from_account_id UUID NOT NULL REFERENCES accounts(id), -- Kas Kecil, Bank, dll
  payment_method VARCHAR(50), -- 'cash', 'transfer', 'check'
  
  -- Additional Metadata
  paid_to VARCHAR(255), -- Penerima
  employee_id UUID, -- Jika ada relasi ke karyawan
  
  -- Detail Items (for Transfer/Reimburse)
  expense_items JSONB, -- [{ description, amount, category }]
  
  -- Attachments
  photos TEXT[],
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(journal_entry_id)
);

CREATE INDEX idx_expenses_user_date ON expenses(user_id, expense_date DESC);
CREATE INDEX idx_expenses_category ON expenses(user_id, category);
CREATE INDEX idx_expenses_account ON expenses(paid_from_account_id);

-- ============================================
-- 5. SALARIES (Metadata Gaji Karyawan - OPTIONAL)
-- ============================================
CREATE TABLE IF NOT EXISTS salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Link ke journal entry (WAJIB)
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  
  -- Salary Data
  payment_date DATE NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  period_month INT CHECK (period_month BETWEEN 1 AND 12),
  period_year INT CHECK (period_year >= 2020),
  
  -- Amounts
  base_salary DECIMAL(15, 2) NOT NULL CHECK (base_salary >= 0),
  allowances DECIMAL(15, 2) DEFAULT 0 CHECK (allowances >= 0),
  deductions DECIMAL(15, 2) DEFAULT 0 CHECK (deductions >= 0),
  net_salary DECIMAL(15, 2) NOT NULL CHECK (net_salary > 0),
  -- net_salary = base_salary + allowances - deductions
  
  -- Payment Method
  paid_from_account_id UUID NOT NULL REFERENCES accounts(id), -- Kas Kecil, Bank, dll
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(journal_entry_id)
);

CREATE INDEX idx_salaries_user_date ON salaries(user_id, payment_date DESC);
CREATE INDEX idx_salaries_employee ON salaries(user_id, employee_name);

-- ============================================
-- 6. CONSTRAINT: BALANCED JOURNAL ENTRIES
-- ============================================
-- Setiap journal entry HARUS balance (total debit = total credit)

CREATE OR REPLACE FUNCTION check_journal_balance()
RETURNS TRIGGER AS $$
DECLARE
  total_debit DECIMAL(15, 2);
  total_credit DECIMAL(15, 2);
BEGIN
  -- Hitung total debit dan credit untuk journal entry ini
  SELECT 
    COALESCE(SUM(debit), 0),
    COALESCE(SUM(credit), 0)
  INTO total_debit, total_credit
  FROM journal_lines
  WHERE journal_entry_id = NEW.journal_entry_id;
  
  -- Validasi: Debit harus = Credit
  IF total_debit != total_credit THEN
    RAISE EXCEPTION 'Journal entry not balanced: Debit=% Credit=% (Diff=%)', 
      total_debit, total_credit, ABS(total_debit - total_credit);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_journal_balance
AFTER INSERT OR UPDATE ON journal_lines
FOR EACH ROW
EXECUTE FUNCTION check_journal_balance();

-- ============================================
-- 7. FUNCTION: Hitung Saldo Akun
-- ============================================
CREATE OR REPLACE FUNCTION get_account_balance(
  p_account_id UUID,
  p_as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(15, 2) AS $$
DECLARE
  v_normal_balance VARCHAR(10);
  v_total_debit DECIMAL(15, 2);
  v_total_credit DECIMAL(15, 2);
  v_balance DECIMAL(15, 2);
BEGIN
  -- Get account normal balance
  SELECT normal_balance INTO v_normal_balance
  FROM accounts
  WHERE id = p_account_id;
  
  IF v_normal_balance IS NULL THEN
    RAISE EXCEPTION 'Account not found: %', p_account_id;
  END IF;
  
  -- Hitung total debit dan credit sampai tanggal tertentu
  SELECT 
    COALESCE(SUM(jl.debit), 0),
    COALESCE(SUM(jl.credit), 0)
  INTO v_total_debit, v_total_credit
  FROM journal_lines jl
  JOIN journal_entries je ON je.id = jl.journal_entry_id
  WHERE jl.account_id = p_account_id
    AND je.status = 'posted'
    AND je.entry_date <= p_as_of_date;
  
  -- Hitung balance berdasarkan normal balance
  IF v_normal_balance = 'debit' THEN
    -- Aset, Beban: Saldo = Debit - Credit
    v_balance := v_total_debit - v_total_credit;
  ELSE
    -- Liability, Equity, Revenue: Saldo = Credit - Debit
    v_balance := v_total_credit - v_total_debit;
  END IF;
  
  RETURN v_balance;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. FUNCTION: Validasi Saldo Cukup
-- ============================================
CREATE OR REPLACE FUNCTION validate_sufficient_balance(
  p_account_id UUID,
  p_amount DECIMAL(15, 2)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_balance DECIMAL(15, 2);
BEGIN
  v_current_balance := get_account_balance(p_account_id, CURRENT_DATE);
  
  RETURN v_current_balance >= p_amount;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. RLS (Row Level Security) Policies
-- ============================================

-- Enable RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE salaries ENABLE ROW LEVEL SECURITY;

-- Policies untuk accounts
CREATE POLICY accounts_user_policy ON accounts
  FOR ALL USING (auth.uid() = user_id);

-- Policies untuk journal_entries
CREATE POLICY journal_entries_user_policy ON journal_entries
  FOR ALL USING (auth.uid() = user_id);

-- Policies untuk journal_lines
CREATE POLICY journal_lines_user_policy ON journal_lines
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM journal_entries je
      WHERE je.id = journal_entry_id
        AND je.user_id = auth.uid()
    )
  );

-- Policies untuk expenses
CREATE POLICY expenses_user_policy ON expenses
  FOR ALL USING (auth.uid() = user_id);

-- Policies untuk salaries
CREATE POLICY salaries_user_policy ON salaries
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 10. SEED DATA: Chart of Accounts Default
-- ============================================
-- NOTE: Akan di-insert otomatis saat user pertama kali login
-- Lihat file SEED_CHART_OF_ACCOUNTS.sql terpisah
