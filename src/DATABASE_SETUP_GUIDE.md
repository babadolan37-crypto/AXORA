# 🗄️ Panduan Setup Database Babadolan

## ❌ Error yang Muncul:

```
Error loading advances: {
  "code": "PGRST205",
  "message": "Could not find the table 'public.advance_payments' in the schema cache"
}
```

**Artinya:** Database belum di-setup. Tabel-tabel belum dibuat.

---

## ✅ Solusi: Jalankan Migration SQL (5 Menit!)

### 📋 Step-by-Step Setup:

#### **1. Login ke Supabase Dashboard**
- Buka: https://app.supabase.com
- Login dengan akun Anda
- Pilih project **Babadolan** Anda

#### **2. Buka SQL Editor**
- Klik **"SQL Editor"** di sidebar kiri
- Atau langsung ke: `https://app.supabase.com/project/YOUR_PROJECT_ID/sql`

#### **3. Buat New Query**
- Klik tombol **"+ New query"** di pojok kanan atas
- Akan muncul editor SQL kosong

#### **4. Copy-Paste Migration Script**

**Pilihan A: Copy dari File** (RECOMMENDED)
```bash
# Buka file: /COMPLETE_DATABASE_MIGRATION.sql
# Copy SEMUA isinya (Ctrl+A, Ctrl+C)
# Paste ke SQL Editor di Supabase (Ctrl+V)
```

**Pilihan B: Copy dari kotak di bawah**
<details>
<summary>Klik untuk expand SQL Script (LONG)</summary>

```sql
-- ========================================
-- BABADOLAN - Complete Database Migration
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABLE 1: Cash Transactions
CREATE TABLE IF NOT EXISTS cash_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  cash_type TEXT NOT NULL CHECK (cash_type IN ('big', 'small')),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('in', 'out')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  category TEXT,
  description TEXT NOT NULL,
  receipt_url TEXT,
  is_inter_cash_transfer BOOLEAN DEFAULT FALSE,
  linked_transaction_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_transactions_user_id ON cash_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_cash_type ON cash_transactions(cash_type);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_date ON cash_transactions(date);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_is_transfer ON cash_transactions(is_inter_cash_transfer);

ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own transactions" ON cash_transactions;
CREATE POLICY "Users can view their own transactions"
  ON cash_transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own transactions" ON cash_transactions;
CREATE POLICY "Users can insert their own transactions"
  ON cash_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own transactions" ON cash_transactions;
CREATE POLICY "Users can update their own transactions"
  ON cash_transactions FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own transactions" ON cash_transactions;
CREATE POLICY "Users can delete their own transactions"
  ON cash_transactions FOR DELETE USING (auth.uid() = user_id);

-- TABLE 2: Cash Balances
CREATE TABLE IF NOT EXISTS cash_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cash_type TEXT NOT NULL CHECK (cash_type IN ('big', 'small')),
  balance NUMERIC DEFAULT 0,
  low_balance_threshold NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, cash_type)
);

CREATE INDEX IF NOT EXISTS idx_cash_balances_user_id ON cash_balances(user_id);

ALTER TABLE cash_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own balances" ON cash_balances;
CREATE POLICY "Users can view their own balances"
  ON cash_balances FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own balances" ON cash_balances;
CREATE POLICY "Users can insert their own balances"
  ON cash_balances FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own balances" ON cash_balances;
CREATE POLICY "Users can update their own balances"
  ON cash_balances FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own balances" ON cash_balances;
CREATE POLICY "Users can delete their own balances"
  ON cash_balances FOR DELETE USING (auth.uid() = user_id);

-- TABLE 3: Advance Payments
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

CREATE INDEX IF NOT EXISTS idx_advance_payments_user_id ON advance_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_advance_payments_status ON advance_payments(status);
CREATE INDEX IF NOT EXISTS idx_advance_payments_employee ON advance_payments(employee_name);

ALTER TABLE advance_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own advance payments" ON advance_payments;
CREATE POLICY "Users can view their own advance payments"
  ON advance_payments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own advance payments" ON advance_payments;
CREATE POLICY "Users can insert their own advance payments"
  ON advance_payments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own advance payments" ON advance_payments;
CREATE POLICY "Users can update their own advance payments"
  ON advance_payments FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own advance payments" ON advance_payments;
CREATE POLICY "Users can delete their own advance payments"
  ON advance_payments FOR DELETE USING (auth.uid() = user_id);

-- TABLE 4: Income Entries
CREATE TABLE IF NOT EXISTS income_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_income_entries_user_id ON income_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_income_entries_date ON income_entries(date);
CREATE INDEX IF NOT EXISTS idx_income_entries_category ON income_entries(category);

ALTER TABLE income_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own income entries" ON income_entries;
CREATE POLICY "Users can view their own income entries"
  ON income_entries FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own income entries" ON income_entries;
CREATE POLICY "Users can insert their own income entries"
  ON income_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own income entries" ON income_entries;
CREATE POLICY "Users can update their own income entries"
  ON income_entries FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own income entries" ON income_entries;
CREATE POLICY "Users can delete their own income entries"
  ON income_entries FOR DELETE USING (auth.uid() = user_id);

-- TABLE 5: Expense Entries
CREATE TABLE IF NOT EXISTS expense_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  employee TEXT,
  receipt_url TEXT,
  transfer_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_entries_user_id ON expense_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_entries_date ON expense_entries(date);
CREATE INDEX IF NOT EXISTS idx_expense_entries_category ON expense_entries(category);
CREATE INDEX IF NOT EXISTS idx_expense_entries_employee ON expense_entries(employee);

ALTER TABLE expense_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own expense entries" ON expense_entries;
CREATE POLICY "Users can view their own expense entries"
  ON expense_entries FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own expense entries" ON expense_entries;
CREATE POLICY "Users can insert their own expense entries"
  ON expense_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own expense entries" ON expense_entries;
CREATE POLICY "Users can update their own expense entries"
  ON expense_entries FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own expense entries" ON expense_entries;
CREATE POLICY "Users can delete their own expense entries"
  ON expense_entries FOR DELETE USING (auth.uid() = user_id);

-- TABLE 6: App Settings
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  income_categories JSONB DEFAULT '[]'::jsonb,
  expense_categories JSONB DEFAULT '[]'::jsonb,
  employees JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_app_settings_user_id ON app_settings(user_id);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own settings" ON app_settings;
CREATE POLICY "Users can view their own settings"
  ON app_settings FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own settings" ON app_settings;
CREATE POLICY "Users can insert their own settings"
  ON app_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON app_settings;
CREATE POLICY "Users can update their own settings"
  ON app_settings FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own settings" ON app_settings;
CREATE POLICY "Users can delete their own settings"
  ON app_settings FOR DELETE USING (auth.uid() = user_id);

-- FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_cash_transactions_updated_at ON cash_transactions;
CREATE TRIGGER update_cash_transactions_updated_at
  BEFORE UPDATE ON cash_transactions FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cash_balances_updated_at ON cash_balances;
CREATE TRIGGER update_cash_balances_updated_at
  BEFORE UPDATE ON cash_balances FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_advance_payments_updated_at ON advance_payments;
CREATE TRIGGER update_advance_payments_updated_at
  BEFORE UPDATE ON advance_payments FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_income_entries_updated_at ON income_entries;
CREATE TRIGGER update_income_entries_updated_at
  BEFORE UPDATE ON income_entries FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expense_entries_updated_at ON expense_entries;
CREATE TRIGGER update_expense_entries_updated_at
  BEFORE UPDATE ON expense_entries FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```
</details>

#### **5. Run Migration**
- Klik tombol **"RUN"** (atau tekan `Ctrl + Enter`)
- Tunggu beberapa detik sampai selesai
- Pastikan tidak ada error merah

#### **6. Verifikasi Success**
Setelah run, Anda akan lihat pesan sukses:
```
✅ BABADOLAN Database Migration Completed Successfully!

Tables Created:
  1. cash_transactions (with inter-cash transfer support)
  2. cash_balances
  3. advance_payments
  4. income_entries
  5. expense_entries
  6. app_settings

Features Enabled:
  ✓ Row Level Security (RLS)
  ✓ Auto-update timestamps
  ✓ Indexes for performance
  ✓ Data validation constraints
```

#### **7. Cek Tabel di Database**
- Klik **"Table Editor"** di sidebar kiri
- Pastikan semua 6 tabel muncul:
  - ✅ `cash_transactions`
  - ✅ `cash_balances`
  - ✅ `advance_payments`
  - ✅ `income_entries`
  - ✅ `expense_entries`
  - ✅ `app_settings`

#### **8. Refresh Aplikasi Babadolan**
- Kembali ke aplikasi Babadolan
- **Hard refresh**: `Ctrl + Shift + R` (Windows) atau `Cmd + Shift + R` (Mac)
- Atau tutup tab, buka lagi

#### **9. Test Fitur**
- Error `advance_payments not found` seharusnya hilang
- Coba buat advance payment baru
- Coba transfer antar kas
- Semua fitur seharusnya jalan normal!

---

## 🎯 Yang Dibuat oleh Migration:

### **1. Cash Transactions**
- Transfer Antar Kas (Kas Besar ↔ Kas Kecil)
- Transaksi masuk/keluar
- Upload bukti
- Linked transactions untuk transfer

### **2. Cash Balances**
- Saldo Kas Besar & Kas Kecil
- Batas saldo rendah
- Auto-calculate dari transaksi

### **3. Advance Payments** ⭐ (INI YANG ERROR)
- Uang muka karyawan
- Settlement pengeluaran
- Tracking pengembalian dana
- Upload bukti per item

### **4. Income Entries**
- Pemasukan perusahaan
- Kategori pemasukan
- Upload bukti

### **5. Expense Entries**
- Pengeluaran perusahaan
- Kategori pengeluaran
- Transfer ke karyawan
- Detail pengeluaran

### **6. App Settings**
- Kategori income/expense
- Daftar karyawan
- Pengaturan aplikasi

---

## 🔐 Security Features:

✅ **Row Level Security (RLS)**
- Setiap user hanya bisa lihat data mereka sendiri
- Auto-filter by `user_id`

✅ **Data Validation**
- Amount harus > 0
- Cash type hanya 'big' atau 'small'
- Status hanya nilai valid

✅ **Auto-Timestamps**
- `created_at` saat insert
- `updated_at` auto-update saat edit

✅ **Indexes untuk Performance**
- Query cepat
- Optimized untuk filtering & sorting

---

## ❓ Troubleshooting

### Problem: "permission denied for schema public"
**Solution:** User belum punya akses. Run ini dulu:
```sql
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
```

### Problem: "relation already exists"
**Solution:** Tabel sudah ada. Hapus dulu atau skip dengan `CREATE TABLE IF NOT EXISTS`

### Problem: "syntax error at or near..."
**Solution:** Copy-paste script lengkap, jangan potong-potong

### Problem: Error masih muncul setelah run migration
**Solution:**
1. Hard refresh aplikasi (`Ctrl + Shift + R`)
2. Logout & login lagi
3. Clear browser cache
4. Cek di Table Editor apakah tabel benar-benar ada

---

## 🆘 Need Help?

Jika masih ada error:

1. **Screenshot error message** (full text)
2. **Cek Table Editor** - apakah tabel `advance_payments` ada?
3. **Cek RLS policies** - pastikan policies aktif
4. **Logout & login lagi** - kadang session perlu refresh

---

## ✅ Checklist Setup:

- [ ] Login ke Supabase Dashboard
- [ ] Buka SQL Editor
- [ ] Copy-paste COMPLETE_DATABASE_MIGRATION.sql
- [ ] Run migration
- [ ] Lihat success message
- [ ] Cek Table Editor (6 tabel ada)
- [ ] Hard refresh aplikasi Babadolan
- [ ] Test fitur advance payment
- [ ] Error hilang! 🎉

---

## 🎉 After Setup Success:

Anda bisa langsung gunakan semua fitur:
- ✅ Advance & Reimbursement
- ✅ Transfer Antar Kas (Real-time!)
- ✅ Settlement dengan Upload Bukti
- ✅ Tracking Karyawan
- ✅ OCR Scanner
- ✅ Export Excel Lengkap

**Selamat menggunakan Babadolan!** 🚀
