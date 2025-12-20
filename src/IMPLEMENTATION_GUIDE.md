# 🚀 Implementation Guide: Double-Entry System untuk Babadolan

## 📋 TABLE OF CONTENTS
1. [Alur Backend (API Endpoints)](#alur-backend)
2. [Pseudocode Implementasi](#pseudocode)
3. [Frontend Integration](#frontend-integration)
4. [Migration dari Sistem Lama](#migration-path)
5. [Acceptance Criteria](#acceptance-criteria)
6. [UI/UX Recommendations](#uiux-recommendations)

---

## 🔄 ALUR BACKEND

### **Stack: React + Supabase (PostgreSQL)**

### **1. CREATE EXPENSE (Pengeluaran)**

```
ENDPOINT: POST /api/expenses
METHOD: Call Supabase RPC function

FLOW:
1. User mengisi form pengeluaran
2. Frontend call: supabase.rpc('create_expense_transaction', params)
3. Backend (Supabase Function):
   a. BEGIN TRANSACTION
   b. Validasi: amount > 0
   c. Validasi: account exists
   d. Validasi: saldo cukup (check balance)
   e. Insert journal_entries (header)
   f. Insert journal_lines (2 baris: Debit Beban, Kredit Kas)
   g. Insert expenses (metadata UI)
   h. COMMIT
4. Return: expense_id + new_balance
5. Frontend refresh saldo dari database

ERROR HANDLING:
- Jika saldo tidak cukup: ROLLBACK + error "Saldo tidak cukup"
- Jika validasi gagal: ROLLBACK + error message
- Postgres otomatis rollback jika ada exception
```

**Contoh Call dari Frontend:**
```typescript
const { data, error } = await supabase.rpc('create_expense_transaction', {
  p_user_id: user.id,
  p_expense_date: '2025-12-15',
  p_category: 'Transport',
  p_description: 'Bensin motor',
  p_amount: 50000,
  p_paid_from_account_id: kasKecilAccountId,
  p_paid_to: 'SPBU Pertamina',
  p_payment_method: 'cash',
  p_photos: ['https://...'],
  p_notes: 'Bensin full tank'
});

if (error) {
  alert(error.message); // "Insufficient balance. Current: Rp 30,000, Required: Rp 50,000"
} else {
  alert('Pengeluaran berhasil disimpan!');
  refreshBalance(); // Fetch saldo baru dari DB
}
```

---

### **2. CREATE SALARY (Gaji Karyawan)**

```
ENDPOINT: POST /api/salaries
METHOD: Call Supabase RPC function

FLOW:
1. User mengisi form gaji (nama, periode, gaji pokok, tunjangan, potongan)
2. Frontend hitung: net_salary = base + allowances - deductions
3. Frontend call: supabase.rpc('create_salary_payment', params)
4. Backend (Supabase Function):
   a. BEGIN TRANSACTION
   b. Validasi: net_salary > 0
   c. Validasi: account exists
   d. Validasi: saldo cukup
   e. Insert journal_entries (header)
   f. Insert journal_lines (2 baris: Debit Beban Gaji, Kredit Kas/Bank)
   g. Insert salaries (metadata UI)
   h. COMMIT
5. Return: salary_id + new_balance
6. Frontend refresh saldo
```

**Contoh Call dari Frontend:**
```typescript
const { data, error } = await supabase.rpc('create_salary_payment', {
  p_user_id: user.id,
  p_payment_date: '2025-12-25',
  p_employee_name: 'John Doe',
  p_period_month: 12,
  p_period_year: 2025,
  p_base_salary: 5000000,
  p_allowances: 500000,
  p_deductions: 200000,
  p_paid_from_account_id: kasKecilAccountId,
  p_notes: 'Gaji Desember 2025'
});

// Net salary = 5,000,000 + 500,000 - 200,000 = 5,300,000
// Akan otomatis kurangi saldo Kas Kecil
```

---

### **3. CREATE INCOME (Pemasukan)**

```
ENDPOINT: POST /api/income
METHOD: Call Supabase RPC function

FLOW:
1. User mengisi form pemasukan
2. Frontend call: supabase.rpc('create_income_transaction', params)
3. Backend:
   a. BEGIN TRANSACTION
   b. Insert journal_entries
   c. Insert journal_lines (2 baris: Debit Kas, Kredit Pendapatan)
   d. COMMIT
4. Return: journal_entry_id + new_balance
5. Frontend refresh saldo
```

---

### **4. CREATE TRANSFER (Transfer Antar Kas)**

```
ENDPOINT: POST /api/transfer
METHOD: Call Supabase RPC function

FLOW:
1. User pilih: Dari mana (Kas Besar) → Ke mana (Kas Kecil)
2. Frontend call: supabase.rpc('create_cash_transfer', params)
3. Backend:
   a. BEGIN TRANSACTION
   b. Validasi: saldo sumber cukup
   c. Insert journal_entries
   d. Insert journal_lines (2 baris: Debit Kas Tujuan, Kredit Kas Sumber)
   e. COMMIT
4. Return: journal_entry_id + both new balances
5. Frontend refresh saldo kedua akun
```

---

## 💻 PSEUDOCODE IMPLEMENTASI

### **A. Supabase RPC Call (TypeScript)**

```typescript
// hooks/useAccounting.ts
export const useAccounting = () => {
  const { user } = useAuth();

  // Get account balance
  const getAccountBalance = async (accountId: string, asOfDate?: string) => {
    const { data, error } = await supabase.rpc('get_account_balance', {
      p_account_id: accountId,
      p_as_of_date: asOfDate || new Date().toISOString().split('T')[0]
    });

    if (error) throw error;
    return data as number;
  };

  // Create expense
  const createExpense = async (expenseData: ExpenseInput) => {
    // 1. Get current balance (untuk preview)
    const currentBalance = await getAccountBalance(expenseData.paid_from_account_id);

    // 2. Check if sufficient
    if (currentBalance < expenseData.amount) {
      throw new Error(`Saldo tidak cukup. Saldo: Rp ${currentBalance.toLocaleString()}, Dibutuhkan: Rp ${expenseData.amount.toLocaleString()}`);
    }

    // 3. Call RPC function (atomic transaction)
    const { data, error } = await supabase.rpc('create_expense_transaction', {
      p_user_id: user.id,
      p_expense_date: expenseData.date,
      p_category: expenseData.category,
      p_description: expenseData.description,
      p_amount: expenseData.amount,
      p_paid_from_account_id: expenseData.paid_from_account_id,
      p_paid_to: expenseData.paid_to,
      p_payment_method: expenseData.payment_method,
      p_photos: expenseData.photos,
      p_notes: expenseData.notes,
      p_expense_items: expenseData.expense_items
    });

    if (error) throw error;

    // 4. Get new balance
    const newBalance = await getAccountBalance(expenseData.paid_from_account_id);

    return {
      expenseId: data,
      oldBalance: currentBalance,
      newBalance: newBalance,
      difference: currentBalance - newBalance
    };
  };

  // Create salary
  const createSalary = async (salaryData: SalaryInput) => {
    const netSalary = salaryData.base_salary + salaryData.allowances - salaryData.deductions;

    const { data, error } = await supabase.rpc('create_salary_payment', {
      p_user_id: user.id,
      p_payment_date: salaryData.payment_date,
      p_employee_name: salaryData.employee_name,
      p_period_month: salaryData.period_month,
      p_period_year: salaryData.period_year,
      p_base_salary: salaryData.base_salary,
      p_allowances: salaryData.allowances,
      p_deductions: salaryData.deductions,
      p_paid_from_account_id: salaryData.paid_from_account_id,
      p_notes: salaryData.notes
    });

    if (error) throw error;
    return data;
  };

  // Get all cash accounts with balances
  const getCashAccounts = async () => {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_cash_account', true)
      .eq('is_active', true)
      .order('code');

    if (error) throw error;

    // Get balance for each
    const accountsWithBalance = await Promise.all(
      data.map(async (account) => ({
        ...account,
        balance: await getAccountBalance(account.id)
      }))
    );

    return accountsWithBalance;
  };

  return {
    getAccountBalance,
    getCashAccounts,
    createExpense,
    createSalary,
    // ... more functions
  };
};
```

---

### **B. Form Pengeluaran (Frontend Component)**

```typescript
// components/ExpenseForm.tsx
export const ExpenseForm = () => {
  const { createExpense, getCashAccounts } = useAccounting();
  const [cashAccounts, setCashAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [amount, setAmount] = useState(0);
  const [previewBalance, setPreviewBalance] = useState(null);

  useEffect(() => {
    loadCashAccounts();
  }, []);

  const loadCashAccounts = async () => {
    const accounts = await getCashAccounts();
    setCashAccounts(accounts);
    if (accounts.length > 0) {
      setSelectedAccount(accounts[0]);
    }
  };

  // Real-time preview saldo
  useEffect(() => {
    if (selectedAccount && amount > 0) {
      setPreviewBalance({
        before: selectedAccount.balance,
        after: selectedAccount.balance - amount,
        sufficient: selectedAccount.balance >= amount
      });
    }
  }, [selectedAccount, amount]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const result = await createExpense({
        date: formData.date,
        category: formData.category,
        description: formData.description,
        amount: amount,
        paid_from_account_id: selectedAccount.id,
        paid_to: formData.paid_to,
        payment_method: 'cash',
        photos: [],
        notes: formData.notes
      });

      // Show success with balance info
      alert(`
        ✅ Pengeluaran berhasil!
        
        Saldo Sebelum: Rp ${result.oldBalance.toLocaleString()}
        Pengeluaran: Rp ${amount.toLocaleString()}
        Saldo Sesudah: Rp ${result.newBalance.toLocaleString()}
      `);

      // Refresh account list
      loadCashAccounts();
      resetForm();

    } catch (error) {
      alert(`❌ ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Account Selection */}
      <div>
        <label>Bayar dari:</label>
        <select 
          value={selectedAccount?.id} 
          onChange={(e) => setSelectedAccount(cashAccounts.find(a => a.id === e.target.value))}
        >
          {cashAccounts.map(account => (
            <option key={account.id} value={account.id}>
              {account.name} - Saldo: Rp {account.balance.toLocaleString()}
            </option>
          ))}
        </select>
      </div>

      {/* Amount */}
      <div>
        <label>Jumlah:</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value))}
        />
      </div>

      {/* Real-time Balance Preview */}
      {previewBalance && (
        <div className={previewBalance.sufficient ? 'bg-green-50' : 'bg-red-50'}>
          <p>Saldo Sebelum: Rp {previewBalance.before.toLocaleString()}</p>
          <p>Saldo Sesudah: Rp {previewBalance.after.toLocaleString()}</p>
          {!previewBalance.sufficient && (
            <p className="text-red-600">⚠️ Saldo tidak cukup!</p>
          )}
        </div>
      )}

      {/* ... other fields ... */}

      <button 
        type="submit" 
        disabled={!previewBalance?.sufficient}
      >
        Simpan Pengeluaran
      </button>
    </form>
  );
};
```

---

## 🔄 MIGRATION PATH (Sistem Lama → Baru)

### **Strategi Migration:**

1. **Parallel Run**: Sistem lama tetap jalan, sistem baru dibuat berdampingan
2. **Data Import**: Migrate data lama ke sistem baru dengan opening balance
3. **Cut-off Date**: Tentukan tanggal cutoff (misal 1 Jan 2026)
4. **Hard Switch**: Setelah cutoff, sistem lama read-only

### **Migration Script:**

```sql
-- MIGRATION_FROM_OLD_SYSTEM.sql

-- 1. Create default accounts untuk user
SELECT create_default_accounts_for_user('USER_ID_HERE');

-- 2. Hitung opening balance dari sistem lama (per 31 Des 2025)
WITH old_balances AS (
  SELECT 
    'Kas Besar' AS account_name,
    SUM(amount) AS total_income,
    0 AS total_expense
  FROM income_entries
  WHERE user_id = 'USER_ID' AND cash_type = 'big'
  
  UNION ALL
  
  SELECT 
    'Kas Besar',
    0,
    SUM(amount)
  FROM expense_entries
  WHERE user_id = 'USER_ID' AND cash_type = 'big'
  
  -- ... similar for Kas Kecil
)
SELECT 
  account_name,
  SUM(total_income) - SUM(total_expense) AS opening_balance
FROM old_balances
GROUP BY account_name;

-- 3. Create opening balance journal entry
-- Kas Besar opening: Rp 10,000,000
-- Kas Kecil opening: Rp 2,000,000
INSERT INTO journal_entries (user_id, entry_number, entry_date, entry_type, description, status, posted_at)
VALUES ('USER_ID', 'OB-2026-0001', '2026-01-01', 'opening_balance', 'Opening Balance 2026', 'posted', NOW())
RETURNING id;

-- Insert lines (contoh)
INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit) VALUES
('ENTRY_ID', (SELECT id FROM accounts WHERE code = '1102'), 10000000, 0), -- Kas Besar
('ENTRY_ID', (SELECT id FROM accounts WHERE code = '1101'), 2000000, 0),  -- Kas Kecil
('ENTRY_ID', (SELECT id FROM accounts WHERE code = '3101'), 0, 12000000); -- Modal Pemilik

-- 4. Setelah cutoff, sistem lama jadi read-only
-- User HANYA bisa input transaksi via sistem baru
```

---

## ✅ ACCEPTANCE CRITERIA

### **Test Case 1: Pengeluaran dari Kas Kecil**

```
GIVEN:
- Saldo Kas Kecil = Rp 1,000,000

WHEN:
- User submit pengeluaran:
  * Kategori: Transport
  * Jumlah: Rp 50,000
  * Bayar dari: Kas Kecil

THEN:
- ✅ Transaksi tersimpan
- ✅ Journal entry created dengan 2 lines:
  * Debit Beban Transport: 50,000
  * Kredit Kas Kecil: 50,000
- ✅ Saldo Kas Kecil turun menjadi Rp 950,000
- ✅ Query get_account_balance() return 950,000
- ✅ UI menampilkan "Saldo Sebelum: 1,000,000 | Saldo Sesudah: 950,000"
```

### **Test Case 2: Saldo Tidak Cukup**

```
GIVEN:
- Saldo Kas Kecil = Rp 30,000

WHEN:
- User submit pengeluaran Rp 50,000 dari Kas Kecil

THEN:
- ❌ Transaksi DITOLAK
- ❌ Error message: "Insufficient balance. Current: Rp 30,000, Required: Rp 50,000"
- ✅ Saldo Kas Kecil tetap Rp 30,000 (tidak berubah)
- ✅ Tidak ada journal entry tersimpan
```

### **Test Case 3: Gaji Karyawan**

```
GIVEN:
- Saldo Kas Kecil = Rp 10,000,000

WHEN:
- User submit gaji:
  * Karyawan: John Doe
  * Gaji Pokok: Rp 5,000,000
  * Tunjangan: Rp 500,000
  * Potongan: Rp 200,000
  * Net: Rp 5,300,000
  * Bayar dari: Kas Kecil

THEN:
- ✅ Transaksi tersimpan
- ✅ Journal entry created:
  * Debit Beban Gaji: 5,300,000
  * Kredit Kas Kecil: 5,300,000
- ✅ Saldo Kas Kecil turun menjadi Rp 4,700,000
```

### **Test Case 4: Transfer Antar Kas**

```
GIVEN:
- Saldo Kas Besar = Rp 20,000,000
- Saldo Kas Kecil = Rp 500,000

WHEN:
- User transfer Rp 2,000,000 dari Kas Besar ke Kas Kecil

THEN:
- ✅ Journal entry created:
  * Debit Kas Kecil: 2,000,000
  * Kredit Kas Besar: 2,000,000
- ✅ Saldo Kas Besar turun menjadi Rp 18,000,000
- ✅ Saldo Kas Kecil naik menjadi Rp 2,500,000
- ✅ Total saldo kas tetap Rp 20,500,000 (balance)
```

### **Test Case 5: Trial Balance Seimbang**

```
WHEN:
- Query trial balance untuk periode tertentu

THEN:
- ✅ Total Debit = Total Credit (difference = 0)
- ✅ Semua journal entries balanced
- ✅ Tidak ada transaksi yang debit ≠ credit
```

---

## 🎨 UI/UX RECOMMENDATIONS

### **1. Balance Display**

```typescript
// Tampilkan saldo real-time di header
<div className="cash-balance-header">
  <div>
    <h4>Kas Besar</h4>
    <p>Rp {kasBesarBalance.toLocaleString()}</p>
  </div>
  <div>
    <h4>Kas Kecil</h4>
    <p>Rp {kasKecilBalance.toLocaleString()}</p>
  </div>
  <div>
    <h4>Total Kas</h4>
    <p>Rp {(kasBesarBalance + kasKecilBalance).toLocaleString()}</p>
  </div>
</div>
```

### **2. Transaction Confirmation Dialog**

```typescript
// Sebelum submit, tampilkan konfirmasi
const showConfirmation = () => {
  return (
    <Dialog>
      <h3>Konfirmasi Pengeluaran</h3>
      <table>
        <tr>
          <td>Kategori:</td>
          <td>{category}</td>
        </tr>
        <tr>
          <td>Jumlah:</td>
          <td>Rp {amount.toLocaleString()}</td>
        </tr>
        <tr>
          <td>Bayar dari:</td>
          <td>{accountName}</td>
        </tr>
        <tr className="divider">
          <td colSpan={2}><hr /></td>
        </tr>
        <tr>
          <td>Saldo Sebelum:</td>
          <td className="text-blue-600">Rp {currentBalance.toLocaleString()}</td>
        </tr>
        <tr>
          <td>Saldo Sesudah:</td>
          <td className={newBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
            Rp {newBalance.toLocaleString()}
          </td>
        </tr>
      </table>
      <button onClick={confirmSubmit}>Konfirmasi</button>
      <button onClick={cancel}>Batal</button>
    </Dialog>
  );
};
```

### **3. Success Notification**

```typescript
// Setelah berhasil simpan
toast.success(
  <div>
    <h4>✅ Pengeluaran Berhasil Disimpan</h4>
    <p>Saldo {accountName} berhasil diupdate</p>
    <div className="balance-change">
      <span>Rp {oldBalance.toLocaleString()}</span>
      <span>→</span>
      <span>Rp {newBalance.toLocaleString()}</span>
    </div>
  </div>
);
```

### **4. Real-time Balance Preview**

```typescript
// Di form, tampilkan preview real-time
{amount > 0 && (
  <div className="balance-preview">
    <div className="flex justify-between">
      <span>Saldo Sekarang:</span>
      <span>Rp {currentBalance.toLocaleString()}</span>
    </div>
    <div className="flex justify-between">
      <span>Pengeluaran:</span>
      <span className="text-red-600">- Rp {amount.toLocaleString()}</span>
    </div>
    <div className="flex justify-between font-bold border-t pt-2">
      <span>Saldo Sesudah:</span>
      <span className={afterBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
        Rp {afterBalance.toLocaleString()}
      </span>
    </div>
    {afterBalance < 0 && (
      <div className="bg-red-50 text-red-600 p-2 rounded mt-2">
        ⚠️ Saldo tidak cukup!
      </div>
    )}
  </div>
)}
```

### **5. Transaction History dengan Running Balance**

```typescript
// Tampilkan riwayat transaksi dengan running balance
<table>
  <thead>
    <tr>
      <th>Tanggal</th>
      <th>Deskripsi</th>
      <th>Debit</th>
      <th>Kredit</th>
      <th>Saldo</th>
    </tr>
  </thead>
  <tbody>
    {transactions.map(tx => (
      <tr key={tx.id}>
        <td>{tx.date}</td>
        <td>{tx.description}</td>
        <td>{tx.debit > 0 && `Rp ${tx.debit.toLocaleString()}`}</td>
        <td>{tx.credit > 0 && `Rp ${tx.credit.toLocaleString()}`}</td>
        <td className="font-bold">
          Rp {tx.running_balance.toLocaleString()}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### **6. Lock Edited Transactions**

```typescript
// Jangan bisa edit transaksi yang sudah posted
{transaction.status === 'posted' ? (
  <div className="locked-transaction">
    <Lock size={16} />
    <span>Transaksi sudah tercatat dan tidak bisa diubah</span>
    <button onClick={() => voidTransaction(transaction.id)}>
      Batalkan Transaksi
    </button>
  </div>
) : (
  <button onClick={() => editTransaction(transaction.id)}>
    Edit
  </button>
)}
```

---

## 🎯 KESIMPULAN

### **Keuntungan Sistem Double-Entry:**

✅ **Single Source of Truth**: Saldo SELALU dihitung dari journal_lines  
✅ **Atomic Transactions**: Tidak mungkin data inkonsisten  
✅ **Self-Balancing**: Trigger otomatis validasi debit = credit  
✅ **Audit Trail**: Semua perubahan tercatat di journal  
✅ **Flexible Reporting**: Bisa generate laporan apapun dari journal  
✅ **Scalable**: Mudah tambah akun baru tanpa ubah logic  

### **Next Steps:**

1. ✅ Jalankan `DOUBLE_ENTRY_SCHEMA.sql` di Supabase
2. ✅ Jalankan `SEED_CHART_OF_ACCOUNTS.sql`
3. ✅ Jalankan `TRANSACTION_PROCEDURES.sql`
4. ✅ Test semua procedures dengan sample data
5. ✅ Buat React hooks (`useAccounting.ts`)
6. ✅ Update UI components untuk call RPC functions
7. ✅ Migrate data lama dengan `MIGRATION_FROM_OLD_SYSTEM.sql`
8. ✅ Test acceptance criteria satu per satu
9. ✅ Deploy ke production

---

**🎉 Selamat! Sistem akuntansi Anda sekarang robust, tahan error, dan mengikuti best practices!**
