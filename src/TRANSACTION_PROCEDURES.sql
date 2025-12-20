-- ============================================
-- STORED PROCEDURES: Atomic Transactions
-- ============================================
-- Untuk: Babadolan (Aplikasi Akuntansi PT)
-- Deskripsi: Stored procedures untuk create transaksi secara atomic
-- ============================================

-- ============================================
-- 1. CREATE EXPENSE (Pengeluaran Umum)
-- ============================================
-- Jurnal:
--   Debit: Beban [kategori] 
--   Kredit: Kas/Bank [dari akun mana]
-- ============================================

CREATE OR REPLACE FUNCTION create_expense_transaction(
  p_user_id UUID,
  p_expense_date DATE,
  p_category VARCHAR(100),
  p_description TEXT,
  p_amount DECIMAL(15, 2),
  p_paid_from_account_id UUID,
  p_paid_to VARCHAR(255) DEFAULT NULL,
  p_payment_method VARCHAR(50) DEFAULT 'cash',
  p_photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_notes TEXT DEFAULT NULL,
  p_expense_items JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_journal_entry_id UUID;
  v_expense_id UUID;
  v_expense_account_id UUID;
  v_current_balance DECIMAL(15, 2);
  v_entry_number VARCHAR(50);
  v_line_description TEXT;
BEGIN
  -- Validasi: Amount > 0
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than 0';
  END IF;
  
  -- Validasi: Account exists dan milik user
  IF NOT EXISTS (
    SELECT 1 FROM accounts 
    WHERE id = p_paid_from_account_id 
      AND user_id = p_user_id
      AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'Invalid payment account';
  END IF;
  
  -- Validasi: Cek saldo cukup untuk akun kas
  SELECT get_account_balance(p_paid_from_account_id, p_expense_date) INTO v_current_balance;
  
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance. Current: Rp %, Required: Rp %', 
      v_current_balance, p_amount;
  END IF;
  
  -- Cari akun beban berdasarkan kategori
  SELECT id INTO v_expense_account_id
  FROM accounts
  WHERE user_id = p_user_id
    AND type = 'expense'
    AND (name ILIKE '%' || p_category || '%' OR sub_type ILIKE '%' || p_category || '%')
    AND is_active = TRUE
  LIMIT 1;
  
  -- Jika tidak ada, gunakan "Beban Lain-lain"
  IF v_expense_account_id IS NULL THEN
    SELECT id INTO v_expense_account_id
    FROM accounts
    WHERE user_id = p_user_id
      AND type = 'expense'
      AND code = '5201' -- Beban Lain-lain
    LIMIT 1;
  END IF;
  
  IF v_expense_account_id IS NULL THEN
    RAISE EXCEPTION 'No expense account found for category: %', p_category;
  END IF;
  
  -- Generate entry number
  v_entry_number := 'EXP-' || TO_CHAR(p_expense_date, 'YYYYMMDD') || '-' || 
                    LPAD(NEXTVAL('journal_entry_seq')::TEXT, 6, '0');
  
  -- 1. Create journal entry (header)
  INSERT INTO journal_entries (
    user_id, 
    entry_number, 
    entry_date, 
    entry_type, 
    source_module,
    description, 
    notes,
    status,
    posted_at,
    photos,
    created_by
  ) VALUES (
    p_user_id,
    v_entry_number,
    p_expense_date,
    'expense',
    'expense_form',
    COALESCE(p_description, 'Pengeluaran ' || p_category),
    p_notes,
    'posted',
    NOW(),
    p_photos,
    p_user_id
  ) RETURNING id INTO v_journal_entry_id;
  
  -- 2. Create journal lines (detail)
  -- Debit: Beban
  v_line_description := p_category || ': ' || COALESCE(p_description, '-');
  INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit, description)
  VALUES (v_journal_entry_id, v_expense_account_id, p_amount, 0, v_line_description);
  
  -- Kredit: Kas/Bank
  v_line_description := 'Pembayaran ' || p_category || 
                        CASE WHEN p_paid_to IS NOT NULL THEN ' kepada ' || p_paid_to ELSE '' END;
  INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit, description)
  VALUES (v_journal_entry_id, p_paid_from_account_id, 0, p_amount, v_line_description);
  
  -- 3. Create expense metadata (optional, untuk UI)
  INSERT INTO expenses (
    user_id,
    journal_entry_id,
    expense_date,
    category,
    description,
    total_amount,
    paid_from_account_id,
    payment_method,
    paid_to,
    expense_items,
    photos
  ) VALUES (
    p_user_id,
    v_journal_entry_id,
    p_expense_date,
    p_category,
    p_description,
    p_amount,
    p_paid_from_account_id,
    p_payment_method,
    p_paid_to,
    p_expense_items,
    p_photos
  ) RETURNING id INTO v_expense_id;
  
  -- Return expense ID
  RETURN v_expense_id;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback otomatis oleh Postgres
    RAISE EXCEPTION 'Failed to create expense: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. CREATE SALARY PAYMENT (Gaji Karyawan)
-- ============================================
-- Jurnal:
--   Debit: Beban Gaji
--   Kredit: Kas/Bank [dari akun mana]
-- ============================================

CREATE OR REPLACE FUNCTION create_salary_payment(
  p_user_id UUID,
  p_payment_date DATE,
  p_employee_name VARCHAR(255),
  p_period_month INT,
  p_period_year INT,
  p_base_salary DECIMAL(15, 2),
  p_allowances DECIMAL(15, 2) DEFAULT 0,
  p_deductions DECIMAL(15, 2) DEFAULT 0,
  p_paid_from_account_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_journal_entry_id UUID;
  v_salary_id UUID;
  v_salary_account_id UUID;
  v_net_salary DECIMAL(15, 2);
  v_current_balance DECIMAL(15, 2);
  v_entry_number VARCHAR(50);
  v_description TEXT;
BEGIN
  -- Hitung net salary
  v_net_salary := p_base_salary + p_allowances - p_deductions;
  
  -- Validasi: Net salary > 0
  IF v_net_salary <= 0 THEN
    RAISE EXCEPTION 'Net salary must be greater than 0';
  END IF;
  
  -- Validasi: Account exists
  IF NOT EXISTS (
    SELECT 1 FROM accounts 
    WHERE id = p_paid_from_account_id 
      AND user_id = p_user_id
      AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'Invalid payment account';
  END IF;
  
  -- Validasi: Cek saldo cukup
  SELECT get_account_balance(p_paid_from_account_id, p_payment_date) INTO v_current_balance;
  
  IF v_current_balance < v_net_salary THEN
    RAISE EXCEPTION 'Insufficient balance. Current: Rp %, Required: Rp %', 
      v_current_balance, v_net_salary;
  END IF;
  
  -- Cari akun "Beban Gaji"
  SELECT id INTO v_salary_account_id
  FROM accounts
  WHERE user_id = p_user_id
    AND type = 'expense'
    AND code = '5101' -- Beban Gaji
  LIMIT 1;
  
  IF v_salary_account_id IS NULL THEN
    RAISE EXCEPTION 'Salary expense account (5101) not found';
  END IF;
  
  -- Generate entry number
  v_entry_number := 'SAL-' || TO_CHAR(p_payment_date, 'YYYYMM') || '-' || 
                    LPAD(NEXTVAL('journal_entry_seq')::TEXT, 4, '0');
  
  -- Description
  v_description := 'Gaji ' || p_employee_name || ' periode ' || 
                   TO_CHAR(TO_DATE(p_period_year || '-' || p_period_month || '-01', 'YYYY-MM-DD'), 'Month YYYY');
  
  -- 1. Create journal entry (header)
  INSERT INTO journal_entries (
    user_id, 
    entry_number, 
    entry_date, 
    entry_type, 
    source_module,
    description, 
    notes,
    status,
    posted_at,
    created_by
  ) VALUES (
    p_user_id,
    v_entry_number,
    p_payment_date,
    'salary',
    'salary_form',
    v_description,
    p_notes,
    'posted',
    NOW(),
    p_user_id
  ) RETURNING id INTO v_journal_entry_id;
  
  -- 2. Create journal lines (detail)
  -- Debit: Beban Gaji
  INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit, description)
  VALUES (v_journal_entry_id, v_salary_account_id, v_net_salary, 0, v_description);
  
  -- Kredit: Kas/Bank
  INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit, description)
  VALUES (v_journal_entry_id, p_paid_from_account_id, 0, v_net_salary, 
          'Pembayaran gaji ' || p_employee_name);
  
  -- 3. Create salary metadata
  INSERT INTO salaries (
    user_id,
    journal_entry_id,
    payment_date,
    employee_name,
    period_month,
    period_year,
    base_salary,
    allowances,
    deductions,
    net_salary,
    paid_from_account_id,
    notes
  ) VALUES (
    p_user_id,
    v_journal_entry_id,
    p_payment_date,
    p_employee_name,
    p_period_month,
    p_period_year,
    p_base_salary,
    p_allowances,
    p_deductions,
    v_net_salary,
    p_paid_from_account_id,
    p_notes
  ) RETURNING id INTO v_salary_id;
  
  -- Return salary ID
  RETURN v_salary_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create salary payment: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. CREATE INCOME (Pemasukan)
-- ============================================
-- Jurnal:
--   Debit: Kas/Bank [ke akun mana]
--   Kredit: Pendapatan [kategori]
-- ============================================

CREATE OR REPLACE FUNCTION create_income_transaction(
  p_user_id UUID,
  p_income_date DATE,
  p_source VARCHAR(100),
  p_description TEXT,
  p_amount DECIMAL(15, 2),
  p_received_to_account_id UUID,
  p_received_from VARCHAR(255) DEFAULT NULL,
  p_payment_method VARCHAR(50) DEFAULT 'cash',
  p_photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_journal_entry_id UUID;
  v_income_id UUID;
  v_revenue_account_id UUID;
  v_entry_number VARCHAR(50);
  v_line_description TEXT;
BEGIN
  -- Validasi: Amount > 0
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than 0';
  END IF;
  
  -- Validasi: Account exists
  IF NOT EXISTS (
    SELECT 1 FROM accounts 
    WHERE id = p_received_to_account_id 
      AND user_id = p_user_id
      AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'Invalid receiving account';
  END IF;
  
  -- Cari akun pendapatan berdasarkan source
  SELECT id INTO v_revenue_account_id
  FROM accounts
  WHERE user_id = p_user_id
    AND type = 'revenue'
    AND (name ILIKE '%' || p_source || '%' OR sub_type ILIKE '%' || p_source || '%')
    AND is_active = TRUE
  LIMIT 1;
  
  -- Jika tidak ada, gunakan "Pendapatan Lain-lain"
  IF v_revenue_account_id IS NULL THEN
    SELECT id INTO v_revenue_account_id
    FROM accounts
    WHERE user_id = p_user_id
      AND type = 'revenue'
      AND code = '4201' -- Pendapatan Lain-lain
    LIMIT 1;
  END IF;
  
  IF v_revenue_account_id IS NULL THEN
    RAISE EXCEPTION 'No revenue account found for source: %', p_source;
  END IF;
  
  -- Generate entry number
  v_entry_number := 'INC-' || TO_CHAR(p_income_date, 'YYYYMMDD') || '-' || 
                    LPAD(NEXTVAL('journal_entry_seq')::TEXT, 6, '0');
  
  -- 1. Create journal entry (header)
  INSERT INTO journal_entries (
    user_id, 
    entry_number, 
    entry_date, 
    entry_type, 
    source_module,
    description, 
    notes,
    status,
    posted_at,
    photos,
    created_by
  ) VALUES (
    p_user_id,
    v_entry_number,
    p_income_date,
    'income',
    'income_form',
    COALESCE(p_description, 'Pemasukan ' || p_source),
    p_notes,
    'posted',
    NOW(),
    p_photos,
    p_user_id
  ) RETURNING id INTO v_journal_entry_id;
  
  -- 2. Create journal lines (detail)
  -- Debit: Kas/Bank
  v_line_description := 'Penerimaan ' || p_source || 
                        CASE WHEN p_received_from IS NOT NULL THEN ' dari ' || p_received_from ELSE '' END;
  INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit, description)
  VALUES (v_journal_entry_id, p_received_to_account_id, p_amount, 0, v_line_description);
  
  -- Kredit: Pendapatan
  v_line_description := p_source || ': ' || COALESCE(p_description, '-');
  INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit, description)
  VALUES (v_journal_entry_id, v_revenue_account_id, 0, p_amount, v_line_description);
  
  -- Return journal entry ID
  RETURN v_journal_entry_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create income: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. CREATE TRANSFER (Transfer Antar Kas)
-- ============================================
-- Jurnal:
--   Debit: Kas Tujuan
--   Kredit: Kas Sumber
-- ============================================

CREATE OR REPLACE FUNCTION create_cash_transfer(
  p_user_id UUID,
  p_transfer_date DATE,
  p_from_account_id UUID,
  p_to_account_id UUID,
  p_amount DECIMAL(15, 2),
  p_description TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_journal_entry_id UUID;
  v_current_balance DECIMAL(15, 2);
  v_entry_number VARCHAR(50);
  v_from_account_name VARCHAR(255);
  v_to_account_name VARCHAR(255);
BEGIN
  -- Validasi: Amount > 0
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than 0';
  END IF;
  
  -- Validasi: Accounts berbeda
  IF p_from_account_id = p_to_account_id THEN
    RAISE EXCEPTION 'Cannot transfer to the same account';
  END IF;
  
  -- Validasi: Both accounts exist dan is_cash_account
  IF NOT EXISTS (
    SELECT 1 FROM accounts 
    WHERE id = p_from_account_id 
      AND user_id = p_user_id
      AND is_cash_account = TRUE
      AND is_active = TRUE
  ) OR NOT EXISTS (
    SELECT 1 FROM accounts 
    WHERE id = p_to_account_id 
      AND user_id = p_user_id
      AND is_cash_account = TRUE
      AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'Invalid cash accounts';
  END IF;
  
  -- Validasi: Saldo cukup
  SELECT get_account_balance(p_from_account_id, p_transfer_date) INTO v_current_balance;
  
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance. Current: Rp %, Required: Rp %', 
      v_current_balance, p_amount;
  END IF;
  
  -- Get account names
  SELECT name INTO v_from_account_name FROM accounts WHERE id = p_from_account_id;
  SELECT name INTO v_to_account_name FROM accounts WHERE id = p_to_account_id;
  
  -- Generate entry number
  v_entry_number := 'TRF-' || TO_CHAR(p_transfer_date, 'YYYYMMDD') || '-' || 
                    LPAD(NEXTVAL('journal_entry_seq')::TEXT, 6, '0');
  
  -- 1. Create journal entry (header)
  INSERT INTO journal_entries (
    user_id, 
    entry_number, 
    entry_date, 
    entry_type, 
    source_module,
    description, 
    notes,
    status,
    posted_at,
    created_by
  ) VALUES (
    p_user_id,
    v_entry_number,
    p_transfer_date,
    'transfer',
    'transfer_form',
    COALESCE(p_description, 'Transfer dari ' || v_from_account_name || ' ke ' || v_to_account_name),
    p_notes,
    'posted',
    NOW(),
    p_user_id
  ) RETURNING id INTO v_journal_entry_id;
  
  -- 2. Create journal lines (detail)
  -- Debit: Kas Tujuan
  INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit, description)
  VALUES (v_journal_entry_id, p_to_account_id, p_amount, 0, 
          'Penerimaan transfer dari ' || v_from_account_name);
  
  -- Kredit: Kas Sumber
  INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit, description)
  VALUES (v_journal_entry_id, p_from_account_id, 0, p_amount, 
          'Transfer ke ' || v_to_account_name);
  
  -- Return journal entry ID
  RETURN v_journal_entry_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create transfer: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. VOID TRANSACTION (Batalkan Transaksi)
-- ============================================

CREATE OR REPLACE FUNCTION void_transaction(
  p_journal_entry_id UUID,
  p_user_id UUID,
  p_void_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_entry_status VARCHAR(20);
BEGIN
  -- Cek apakah entry milik user dan statusnya posted
  SELECT status INTO v_entry_status
  FROM journal_entries
  WHERE id = p_journal_entry_id AND user_id = p_user_id;
  
  IF v_entry_status IS NULL THEN
    RAISE EXCEPTION 'Journal entry not found';
  END IF;
  
  IF v_entry_status != 'posted' THEN
    RAISE EXCEPTION 'Cannot void entry with status: %', v_entry_status;
  END IF;
  
  -- Update status ke void
  UPDATE journal_entries
  SET 
    status = 'void',
    voided_at = NOW(),
    voided_by = p_user_id,
    void_reason = p_void_reason
  WHERE id = p_journal_entry_id;
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to void transaction: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEQUENCE untuk Entry Number
-- ============================================
CREATE SEQUENCE IF NOT EXISTS journal_entry_seq START 1;
