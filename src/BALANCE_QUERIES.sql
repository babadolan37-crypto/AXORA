-- ============================================
-- QUERY: Menghitung Saldo & Laporan
-- ============================================
-- Untuk: Babadolan (Aplikasi Akuntansi PT)
-- Deskripsi: Query untuk menghitung saldo dan generate laporan
-- ============================================

-- ============================================
-- 1. SALDO SATU AKUN (Kas Kecil)
-- ============================================
-- Menggunakan function yang sudah dibuat
SELECT get_account_balance(
  (SELECT id FROM accounts WHERE code = '1101' AND user_id = 'YOUR_USER_ID'),
  CURRENT_DATE
) AS saldo_kas_kecil;

-- Atau query manual:
SELECT 
  a.code,
  a.name,
  a.normal_balance,
  COALESCE(SUM(jl.debit), 0) AS total_debit,
  COALESCE(SUM(jl.credit), 0) AS total_credit,
  CASE 
    WHEN a.normal_balance = 'debit' THEN 
      COALESCE(SUM(jl.debit), 0) - COALESCE(SUM(jl.credit), 0)
    ELSE 
      COALESCE(SUM(jl.credit), 0) - COALESCE(SUM(jl.debit), 0)
  END AS balance
FROM accounts a
LEFT JOIN journal_lines jl ON jl.account_id = a.id
LEFT JOIN journal_entries je ON je.id = jl.journal_entry_id 
  AND je.status = 'posted'
  AND je.entry_date <= CURRENT_DATE
WHERE a.user_id = 'YOUR_USER_ID'
  AND a.code = '1101' -- Kas Kecil
GROUP BY a.id, a.code, a.name, a.normal_balance;

-- ============================================
-- 2. SALDO SEMUA AKUN KAS
-- ============================================
SELECT 
  a.code,
  a.name,
  a.type,
  COALESCE(SUM(jl.debit), 0) AS total_debit,
  COALESCE(SUM(jl.credit), 0) AS total_credit,
  -- Asset: Saldo = Debit - Credit
  COALESCE(SUM(jl.debit), 0) - COALESCE(SUM(jl.credit), 0) AS balance
FROM accounts a
LEFT JOIN journal_lines jl ON jl.account_id = a.id
LEFT JOIN journal_entries je ON je.id = jl.journal_entry_id 
  AND je.status = 'posted'
  AND je.entry_date <= CURRENT_DATE
WHERE a.user_id = 'YOUR_USER_ID'
  AND a.is_cash_account = TRUE
  AND a.is_active = TRUE
GROUP BY a.id, a.code, a.name, a.type
ORDER BY a.code;

-- ============================================
-- 3. RINGKASAN SALDO PER TYPE
-- ============================================
-- Total Aset, Total Liability, dll
SELECT 
  a.type,
  SUM(
    CASE 
      WHEN a.normal_balance = 'debit' THEN 
        COALESCE(jl_sum.total_debit, 0) - COALESCE(jl_sum.total_credit, 0)
      ELSE 
        COALESCE(jl_sum.total_credit, 0) - COALESCE(jl_sum.total_debit, 0)
    END
  ) AS total_balance
FROM accounts a
LEFT JOIN (
  SELECT 
    jl.account_id,
    SUM(jl.debit) AS total_debit,
    SUM(jl.credit) AS total_credit
  FROM journal_lines jl
  JOIN journal_entries je ON je.id = jl.journal_entry_id
  WHERE je.status = 'posted'
    AND je.entry_date <= CURRENT_DATE
  GROUP BY jl.account_id
) jl_sum ON jl_sum.account_id = a.id
WHERE a.user_id = 'YOUR_USER_ID'
  AND a.is_active = TRUE
GROUP BY a.type
ORDER BY 
  CASE a.type
    WHEN 'asset' THEN 1
    WHEN 'liability' THEN 2
    WHEN 'equity' THEN 3
    WHEN 'revenue' THEN 4
    WHEN 'expense' THEN 5
  END;

-- ============================================
-- 4. TRIAL BALANCE (Neraca Saldo)
-- ============================================
-- Menampilkan semua akun dengan total debit/credit
SELECT 
  a.code,
  a.name,
  a.type,
  COALESCE(SUM(jl.debit), 0) AS total_debit,
  COALESCE(SUM(jl.credit), 0) AS total_credit
FROM accounts a
LEFT JOIN journal_lines jl ON jl.account_id = a.id
LEFT JOIN journal_entries je ON je.id = jl.journal_entry_id 
  AND je.status = 'posted'
  AND je.entry_date BETWEEN '2025-01-01' AND '2025-12-31'
WHERE a.user_id = 'YOUR_USER_ID'
  AND a.is_active = TRUE
GROUP BY a.id, a.code, a.name, a.type
HAVING COALESCE(SUM(jl.debit), 0) > 0 OR COALESCE(SUM(jl.credit), 0) > 0
ORDER BY a.code;

-- Validasi: Total Debit HARUS = Total Credit
SELECT 
  SUM(total_debit) AS grand_total_debit,
  SUM(total_credit) AS grand_total_credit,
  SUM(total_debit) - SUM(total_credit) AS difference
FROM (
  SELECT 
    COALESCE(SUM(jl.debit), 0) AS total_debit,
    COALESCE(SUM(jl.credit), 0) AS total_credit
  FROM journal_lines jl
  JOIN journal_entries je ON je.id = jl.journal_entry_id
  WHERE je.status = 'posted'
    AND je.entry_date BETWEEN '2025-01-01' AND '2025-12-31'
    AND je.user_id = 'YOUR_USER_ID'
) t;

-- ============================================
-- 5. INCOME STATEMENT (Laba Rugi)
-- ============================================
-- Periode tertentu (misal 2025)
WITH revenue_accounts AS (
  SELECT 
    a.name AS account_name,
    COALESCE(SUM(jl.credit), 0) - COALESCE(SUM(jl.debit), 0) AS amount
  FROM accounts a
  LEFT JOIN journal_lines jl ON jl.account_id = a.id
  LEFT JOIN journal_entries je ON je.id = jl.journal_entry_id
    AND je.status = 'posted'
    AND je.entry_date BETWEEN '2025-01-01' AND '2025-12-31'
  WHERE a.user_id = 'YOUR_USER_ID'
    AND a.type = 'revenue'
    AND a.is_active = TRUE
  GROUP BY a.id, a.name
  HAVING COALESCE(SUM(jl.credit), 0) - COALESCE(SUM(jl.debit), 0) > 0
),
expense_accounts AS (
  SELECT 
    a.name AS account_name,
    COALESCE(SUM(jl.debit), 0) - COALESCE(SUM(jl.credit), 0) AS amount
  FROM accounts a
  LEFT JOIN journal_lines jl ON jl.account_id = a.id
  LEFT JOIN journal_entries je ON je.id = jl.journal_entry_id
    AND je.status = 'posted'
    AND je.entry_date BETWEEN '2025-01-01' AND '2025-12-31'
  WHERE a.user_id = 'YOUR_USER_ID'
    AND a.type = 'expense'
    AND a.is_active = TRUE
  GROUP BY a.id, a.name
  HAVING COALESCE(SUM(jl.debit), 0) - COALESCE(SUM(jl.credit), 0) > 0
)
SELECT 
  'PENDAPATAN' AS section,
  account_name,
  amount
FROM revenue_accounts
UNION ALL
SELECT 
  'Total Pendapatan' AS section,
  '' AS account_name,
  SUM(amount) AS amount
FROM revenue_accounts
UNION ALL
SELECT 
  'BEBAN' AS section,
  account_name,
  amount
FROM expense_accounts
UNION ALL
SELECT 
  'Total Beban' AS section,
  '' AS account_name,
  SUM(amount) AS amount
FROM expense_accounts
UNION ALL
SELECT 
  'LABA/RUGI BERSIH' AS section,
  '' AS account_name,
  (SELECT SUM(amount) FROM revenue_accounts) - (SELECT SUM(amount) FROM expense_accounts) AS amount;

-- ============================================
-- 6. BALANCE SHEET (Neraca)
-- ============================================
-- Per tanggal tertentu
WITH account_balances AS (
  SELECT 
    a.id,
    a.code,
    a.name,
    a.type,
    a.normal_balance,
    COALESCE(SUM(jl.debit), 0) AS total_debit,
    COALESCE(SUM(jl.credit), 0) AS total_credit,
    CASE 
      WHEN a.normal_balance = 'debit' THEN 
        COALESCE(SUM(jl.debit), 0) - COALESCE(SUM(jl.credit), 0)
      ELSE 
        COALESCE(SUM(jl.credit), 0) - COALESCE(SUM(jl.debit), 0)
    END AS balance
  FROM accounts a
  LEFT JOIN journal_lines jl ON jl.account_id = a.id
  LEFT JOIN journal_entries je ON je.id = jl.journal_entry_id
    AND je.status = 'posted'
    AND je.entry_date <= '2025-12-31'
  WHERE a.user_id = 'YOUR_USER_ID'
    AND a.is_active = TRUE
  GROUP BY a.id, a.code, a.name, a.type, a.normal_balance
)
SELECT 
  'ASET' AS section,
  code,
  name,
  balance
FROM account_balances
WHERE type = 'asset' AND balance > 0
UNION ALL
SELECT 
  'Total Aset' AS section,
  '' AS code,
  '' AS name,
  SUM(balance) AS balance
FROM account_balances
WHERE type = 'asset'
UNION ALL
SELECT 
  'KEWAJIBAN' AS section,
  code,
  name,
  balance
FROM account_balances
WHERE type = 'liability' AND balance > 0
UNION ALL
SELECT 
  'MODAL' AS section,
  code,
  name,
  balance
FROM account_balances
WHERE type = 'equity' AND balance != 0
UNION ALL
SELECT 
  'Total Kewajiban & Modal' AS section,
  '' AS code,
  '' AS name,
  (SELECT SUM(balance) FROM account_balances WHERE type IN ('liability', 'equity')) AS balance;

-- ============================================
-- 7. CASH FLOW (Arus Kas)
-- ============================================
-- Perubahan kas periode tertentu
WITH cash_accounts AS (
  SELECT id FROM accounts 
  WHERE user_id = 'YOUR_USER_ID' 
    AND is_cash_account = TRUE
)
SELECT 
  je.entry_date,
  je.entry_number,
  je.description,
  a.name AS account_name,
  jl.debit AS cash_in,
  jl.credit AS cash_out,
  jl.debit - jl.credit AS net_change
FROM journal_lines jl
JOIN journal_entries je ON je.id = jl.journal_entry_id
JOIN accounts a ON a.id = jl.account_id
WHERE jl.account_id IN (SELECT id FROM cash_accounts)
  AND je.status = 'posted'
  AND je.entry_date BETWEEN '2025-01-01' AND '2025-12-31'
ORDER BY je.entry_date, je.entry_number;

-- Ringkasan Arus Kas
SELECT 
  a.name AS cash_account,
  SUM(jl.debit) AS total_in,
  SUM(jl.credit) AS total_out,
  SUM(jl.debit) - SUM(jl.credit) AS net_change
FROM journal_lines jl
JOIN journal_entries je ON je.id = jl.journal_entry_id
JOIN accounts a ON a.id = jl.account_id
WHERE a.user_id = 'YOUR_USER_ID'
  AND a.is_cash_account = TRUE
  AND je.status = 'posted'
  AND je.entry_date BETWEEN '2025-01-01' AND '2025-12-31'
GROUP BY a.id, a.name
ORDER BY a.code;

-- ============================================
-- 8. RIWAYAT TRANSAKSI SATU AKUN (General Ledger)
-- ============================================
SELECT 
  je.entry_date,
  je.entry_number,
  je.description,
  jl.debit,
  jl.credit,
  -- Running balance (computed via window function)
  SUM(jl.debit - jl.credit) OVER (ORDER BY je.entry_date, je.entry_number) AS running_balance
FROM journal_lines jl
JOIN journal_entries je ON je.id = jl.journal_entry_id
WHERE jl.account_id = (SELECT id FROM accounts WHERE code = '1101' AND user_id = 'YOUR_USER_ID')
  AND je.status = 'posted'
ORDER BY je.entry_date, je.entry_number;

-- ============================================
-- 9. VALIDASI: Cek Transaksi Tidak Balance
-- ============================================
-- Seharusnya return 0 rows jika semua benar
SELECT 
  je.entry_number,
  je.entry_date,
  je.description,
  SUM(jl.debit) AS total_debit,
  SUM(jl.credit) AS total_credit,
  SUM(jl.debit) - SUM(jl.credit) AS difference
FROM journal_entries je
JOIN journal_lines jl ON jl.journal_entry_id = je.id
WHERE je.user_id = 'YOUR_USER_ID'
  AND je.status = 'posted'
GROUP BY je.id, je.entry_number, je.entry_date, je.description
HAVING SUM(jl.debit) != SUM(jl.credit);

-- ============================================
-- 10. QUERY: Saldo Sebelum & Sesudah Transaksi
-- ============================================
-- Untuk UI: tampilkan preview saldo sebelum simpan
WITH current_balance AS (
  SELECT get_account_balance(
    'ACCOUNT_ID_HERE',
    CURRENT_DATE
  ) AS balance
)
SELECT 
  balance AS saldo_sebelum,
  balance - 50000 AS saldo_sesudah  -- Contoh: pengeluaran 50rb
FROM current_balance;
