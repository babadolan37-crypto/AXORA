# ✅ Quick Start Checklist: Double-Entry Implementation

## 📋 TAHAPAN IMPLEMENTASI

### **PHASE 1: Database Setup (30 menit)**

- [ ] **Step 1.1**: Buka Supabase Dashboard → SQL Editor
- [ ] **Step 1.2**: Copy & Run `/DOUBLE_ENTRY_SCHEMA.sql` (Core tables + functions)
- [ ] **Step 1.3**: Copy & Run `/SEED_CHART_OF_ACCOUNTS.sql` (Default accounts)
- [ ] **Step 1.4**: Copy & Run `/TRANSACTION_PROCEDURES.sql` (RPC functions)
- [ ] **Step 1.5**: Verify tables created:
  ```sql
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public'
    AND table_name IN ('accounts', 'journal_entries', 'journal_lines', 'expenses', 'salaries');
  ```
- [ ] **Step 1.6**: Test default accounts creation:
  ```sql
  SELECT create_default_accounts_for_user(auth.uid());
  SELECT * FROM accounts WHERE user_id = auth.uid();
  ```

---

### **PHASE 2: Test RPC Functions (15 menit)**

- [ ] **Step 2.1**: Test Get Balance
  ```sql
  SELECT get_account_balance(
    (SELECT id FROM accounts WHERE code = '1101' AND user_id = auth.uid()),
    CURRENT_DATE
  );
  -- Should return 0 (no transactions yet)
  ```

- [ ] **Step 2.2**: Create Opening Balance (Kas Awal)
  ```sql
  -- Manual insert untuk saldo awal
  INSERT INTO journal_entries (user_id, entry_number, entry_date, entry_type, description, status, posted_at)
  VALUES (auth.uid(), 'OB-2025-0001', CURRENT_DATE, 'opening_balance', 'Saldo Awal', 'posted', NOW())
  RETURNING id;
  
  -- Insert lines (ganti UUID dengan id dari atas)
  INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit) VALUES
  ('YOUR_ENTRY_ID', (SELECT id FROM accounts WHERE code = '1101' AND user_id = auth.uid()), 1000000, 0), -- Kas Kecil
  ('YOUR_ENTRY_ID', (SELECT id FROM accounts WHERE code = '3101' AND user_id = auth.uid()), 0, 1000000); -- Modal
  ```

- [ ] **Step 2.3**: Verify Balance Updated
  ```sql
  SELECT get_account_balance(
    (SELECT id FROM accounts WHERE code = '1101' AND user_id = auth.uid()),
    CURRENT_DATE
  );
  -- Should return 1000000
  ```

- [ ] **Step 2.4**: Test Create Expense
  ```sql
  SELECT create_expense_transaction(
    p_user_id := auth.uid(),
    p_expense_date := CURRENT_DATE,
    p_category := 'Transport',
    p_description := 'Test bensin',
    p_amount := 50000,
    p_paid_from_account_id := (SELECT id FROM accounts WHERE code = '1101' AND user_id = auth.uid()),
    p_paid_to := 'SPBU Test',
    p_payment_method := 'cash'
  );
  ```

- [ ] **Step 2.5**: Verify Balance Reduced
  ```sql
  SELECT get_account_balance(
    (SELECT id FROM accounts WHERE code = '1101' AND user_id = auth.uid()),
    CURRENT_DATE
  );
  -- Should return 950000 (1,000,000 - 50,000)
  ```

- [ ] **Step 2.6**: Test Insufficient Balance
  ```sql
  SELECT create_expense_transaction(
    p_user_id := auth.uid(),
    p_expense_date := CURRENT_DATE,
    p_category := 'Transport',
    p_description := 'Test over balance',
    p_amount := 2000000, -- More than balance!
    p_paid_from_account_id := (SELECT id FROM accounts WHERE code = '1101' AND user_id = auth.uid())
  );
  -- Should FAIL with error: "Insufficient balance"
  ```

---

### **PHASE 3: Frontend Integration (2 jam)**

- [ ] **Step 3.1**: Create `hooks/useAccounting.ts`
  ```typescript
  export const useAccounting = () => {
    // Copy pseudocode from IMPLEMENTATION_GUIDE.md
  };
  ```

- [ ] **Step 3.2**: Create `hooks/useAccounts.ts` (Get cash accounts)
  ```typescript
  export const useAccounts = () => {
    const [cashAccounts, setCashAccounts] = useState([]);
    
    const loadCashAccounts = async () => {
      const { data } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_cash_account', true)
        .eq('is_active', true)
        .order('code');
      
      // Get balances
      const withBalances = await Promise.all(
        data.map(async (acc) => ({
          ...acc,
          balance: await getAccountBalance(acc.id)
        }))
      );
      
      setCashAccounts(withBalances);
    };
    
    return { cashAccounts, loadCashAccounts };
  };
  ```

- [ ] **Step 3.3**: Update `ExpenseForm.tsx` component
  - Replace `addExpenseEntry()` with `createExpense()`
  - Add balance preview UI
  - Add success notification with before/after balance

- [ ] **Step 3.4**: Update `SalaryForm.tsx` component
  - Replace old logic with `createSalary()`

- [ ] **Step 3.5**: Create `CashBalanceDisplay.tsx` component
  ```typescript
  export const CashBalanceDisplay = () => {
    const { cashAccounts } = useAccounts();
    
    return (
      <div className="grid grid-cols-3 gap-4">
        {cashAccounts.map(account => (
          <div key={account.id}>
            <h4>{account.name}</h4>
            <p>Rp {account.balance.toLocaleString()}</p>
          </div>
        ))}
      </div>
    );
  };
  ```

- [ ] **Step 3.6**: Add balance display to Dashboard

---

### **PHASE 4: Migration dari Sistem Lama (1 jam)**

- [ ] **Step 4.1**: Backup data lama
  ```typescript
  const oldIncome = await supabase.from('income_entries').select('*');
  const oldExpense = await supabase.from('expense_entries').select('*');
  // Save to JSON files
  ```

- [ ] **Step 4.2**: Hitung opening balance
  ```sql
  -- Total income - expense per akun kas
  WITH old_income AS (
    SELECT 
      CASE WHEN cash_type = 'big' THEN '1102' ELSE '1101' END as account_code,
      SUM(amount) as total
    FROM income_entries
    WHERE user_id = auth.uid()
    GROUP BY cash_type
  ),
  old_expense AS (
    SELECT 
      CASE WHEN cash_type = 'big' THEN '1102' ELSE '1101' END as account_code,
      SUM(amount) as total
    FROM expense_entries
    WHERE user_id = auth.uid()
    GROUP BY cash_type
  )
  SELECT 
    i.account_code,
    COALESCE(i.total, 0) - COALESCE(e.total, 0) as balance
  FROM old_income i
  LEFT JOIN old_expense e ON e.account_code = i.account_code;
  ```

- [ ] **Step 4.3**: Create opening balance entry (manual di SQL Editor)

- [ ] **Step 4.4**: Mark cutoff date
  ```sql
  -- Update app_settings
  INSERT INTO app_settings (user_id, key, value) VALUES
  (auth.uid(), 'cutoff_date', '2025-12-31'),
  (auth.uid(), 'migration_completed', 'true');
  ```

- [ ] **Step 4.5**: Disable old forms (income_entries, expense_entries)
  - Add condition: `if (migrationCompleted) { use new system }`

---

### **PHASE 5: Testing & Validation (30 menit)**

- [ ] **Test Case 1**: Create expense (sufficient balance)
  - Expected: ✅ Success, balance decreased
  
- [ ] **Test Case 2**: Create expense (insufficient balance)
  - Expected: ❌ Error with clear message
  
- [ ] **Test Case 3**: Create salary payment
  - Expected: ✅ Success, balance decreased by net_salary
  
- [ ] **Test Case 4**: Create income
  - Expected: ✅ Success, balance increased
  
- [ ] **Test Case 5**: Transfer between accounts
  - Expected: ✅ Success, source decreased, destination increased
  
- [ ] **Test Case 6**: Trial balance validation
  ```sql
  -- Should return 0 rows (all balanced)
  SELECT 
    je.entry_number,
    SUM(jl.debit) - SUM(jl.credit) as difference
  FROM journal_entries je
  JOIN journal_lines jl ON jl.journal_entry_id = je.id
  WHERE je.user_id = auth.uid()
  GROUP BY je.id, je.entry_number
  HAVING SUM(jl.debit) != SUM(jl.credit);
  ```

- [ ] **Test Case 7**: Balance query accuracy
  ```sql
  -- Manual check
  SELECT 
    a.name,
    get_account_balance(a.id, CURRENT_DATE) as calculated_balance,
    (SELECT SUM(debit) - SUM(credit) 
     FROM journal_lines jl 
     JOIN journal_entries je ON je.id = jl.journal_entry_id
     WHERE jl.account_id = a.id 
       AND je.status = 'posted') as manual_balance
  FROM accounts a
  WHERE a.user_id = auth.uid() AND a.is_cash_account = true;
  -- calculated_balance should = manual_balance
  ```

---

### **PHASE 6: UI/UX Enhancements (1 jam)**

- [ ] **UI 1**: Add "Saldo Sebelum / Sesudah" preview in forms
- [ ] **UI 2**: Add balance display in header
- [ ] **UI 3**: Add transaction history with running balance
- [ ] **UI 4**: Add "Lock" icon for posted transactions
- [ ] **UI 5**: Add "Void Transaction" button
- [ ] **UI 6**: Add success toast with balance change
- [ ] **UI 7**: Add insufficient balance warning (red)
- [ ] **UI 8**: Add loading state during submission

---

### **PHASE 7: Production Deployment (15 menit)**

- [ ] **Deploy 1**: Commit all changes to Git
- [ ] **Deploy 2**: Run migrations on production Supabase
- [ ] **Deploy 3**: Test on staging first
- [ ] **Deploy 4**: Monitor error logs
- [ ] **Deploy 5**: Prepare rollback plan (backup SQL)

---

## 🎯 ACCEPTANCE CRITERIA FINAL CHECK

### **Must Pass All:**

- [ ] ✅ Saldo Kas Kecil berkurang saat pengeluaran
- [ ] ✅ Error muncul jika saldo tidak cukup
- [ ] ✅ Trial balance selalu balanced (debit = credit)
- [ ] ✅ Tidak ada cara ubah saldo tanpa jurnal
- [ ] ✅ Posted transactions tidak bisa di-edit
- [ ] ✅ UI menampilkan saldo sebelum/sesudah
- [ ] ✅ Saldo selalu refresh dari database (bukan frontend calculation)
- [ ] ✅ Multiple users concurrent transactions aman

---

## 📊 MONITORING QUERIES

### **Daily Health Check:**

```sql
-- 1. Check unbalanced entries
SELECT COUNT(*) as unbalanced_entries
FROM (
  SELECT je.entry_number
  FROM journal_entries je
  JOIN journal_lines jl ON jl.journal_entry_id = je.id
  WHERE je.status = 'posted'
  GROUP BY je.id, je.entry_number
  HAVING SUM(jl.debit) != SUM(jl.credit)
) t;
-- Should always be 0

-- 2. Check account balances
SELECT 
  a.code,
  a.name,
  get_account_balance(a.id, CURRENT_DATE) as balance
FROM accounts a
WHERE a.is_cash_account = true
ORDER BY a.code;

-- 3. Check today's transactions
SELECT COUNT(*) as transactions_today
FROM journal_entries
WHERE entry_date = CURRENT_DATE
  AND status = 'posted';
```

---

## 🚨 TROUBLESHOOTING

### **Problem: Balance tidak update**
```sql
-- Check if trigger active
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'trg_check_journal_balance';

-- Re-create trigger if needed
DROP TRIGGER IF EXISTS trg_check_journal_balance ON journal_lines;
-- Then re-run from DOUBLE_ENTRY_SCHEMA.sql
```

### **Problem: RPC function not found**
```sql
-- List all functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name LIKE '%expense%';

-- Re-create if needed
-- Run TRANSACTION_PROCEDURES.sql
```

### **Problem: Permission denied**
```sql
-- Check RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Re-enable RLS if needed
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
-- Then re-run policies from DOUBLE_ENTRY_SCHEMA.sql
```

---

## 🎉 DONE!

Setelah semua checklist ✅, sistem Anda:
- ✅ Konsisten (saldo selalu benar)
- ✅ Tahan error (atomic transactions)
- ✅ Audit trail lengkap
- ✅ Scalable untuk tambah fitur baru
- ✅ Production-ready!

**Next:** Monitor daily, add reporting features, optimize queries.
