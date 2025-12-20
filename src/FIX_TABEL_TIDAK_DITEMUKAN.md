# 🚨 FIX ERROR: "Could not find the table in the schema cache"

## ❌ ERROR YANG TERJADI:

```
Error adding income entry: {
  "code": "PGRST205",
  "message": "Could not find the table 'public.income_entries' in the schema cache"
}

Error adding expense entry: {
  "code": "PGRST205",
  "message": "Could not find the table 'public.expense_entries' in the schema cache"
}
```

## 🔍 PENYEBAB:

**Tabel Supabase belum dibuat!** 

Aplikasi sudah siap, tapi database Supabase masih kosong. Kita perlu membuat 4 tabel:
- ✅ `user_settings` - Pengaturan user (sumber pemasukan, kategori, dll)
- ✅ `income_entries` - Data pemasukan
- ✅ `expense_entries` - Data pengeluaran
- ✅ `debt_entries` - Data piutang & hutang

---

## ✅ CARA MEMPERBAIKI (5 MENIT!)

### **LANGKAH 1: Buka Supabase Dashboard**

1. Buka browser → https://supabase.com/dashboard
2. Login dengan akun Supabase Anda
3. Pilih project: **tpemoqesoasfsvutjral** (atau project Babadolan Anda)

---

### **LANGKAH 2: Buka SQL Editor**

```
Dashboard Supabase
├── Sidebar Kiri
│   └── 🔍 Klik "SQL Editor"
└── Klik tombol "+ New Query"
```

**Visual:**
```
┌─────────────────────────────────────┐
│ 🏠 Project: tpemoqesoasfsvutjral   │
├─────────────────────────────────────┤
│ Sidebar:                            │
│   📊 Table Editor                   │
│   🔐 Authentication                 │
│   💾 Database                       │
│   ⚡ SQL Editor  ← KLIK INI!        │
│   📡 API                            │
│   🔧 Settings                       │
└─────────────────────────────────────┘
```

---

### **LANGKAH 3: Copy SQL dari File**

1. **Buka file:** `/SUPABASE_CREATE_TABLES.sql` (ada di project ini)
2. **Select All** (Ctrl+A atau Cmd+A)
3. **Copy** (Ctrl+C atau Cmd+C)

**ATAU copy langsung dari kotak di bawah ini:**

<details>
<summary><b>📋 KLIK DI SINI UNTUK MELIHAT SQL (COPY SEMUA!)</b></summary>

```sql
-- ============================================
-- BABADOLAN - Database Schema
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABEL 1: user_settings
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  income_sources JSONB DEFAULT '["Penjualan Produk", "Penjualan Jasa", "Pemasukan Investasi", "Pembayaran Piutang", "Lainnya"]'::jsonb,
  expense_categories JSONB DEFAULT '["Gaji Karyawan", "Sewa", "Bahan Baku", "Listrik", "Air", "Internet & Telekomunikasi", "Transportasi", "Peralatan Kantor", "Marketing", "Pajak", "Lainnya"]'::jsonb,
  payment_methods JSONB DEFAULT '["Tunai", "Transfer Bank", "Cek", "Kartu Kredit", "E-Wallet"]'::jsonb,
  employees JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABEL 2: income_entries
CREATE TABLE IF NOT EXISTS income_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  source TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount NUMERIC(20, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  notes TEXT DEFAULT '',
  photos JSONB DEFAULT '[]'::jsonb,
  received_from TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABEL 3: expense_entries
CREATE TABLE IF NOT EXISTS expense_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount NUMERIC(20, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  notes TEXT DEFAULT '',
  photos JSONB DEFAULT '[]'::jsonb,
  paid_to TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABEL 4: debt_entries
CREATE TABLE IF NOT EXISTS debt_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('piutang', 'hutang')),
  date DATE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount NUMERIC(20, 2) NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'belum lunas' CHECK (status IN ('belum lunas', 'lunas')),
  payment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON user_settings;

DROP POLICY IF EXISTS "Users can view own income" ON income_entries;
DROP POLICY IF EXISTS "Users can insert own income" ON income_entries;
DROP POLICY IF EXISTS "Users can update own income" ON income_entries;
DROP POLICY IF EXISTS "Users can delete own income" ON income_entries;

DROP POLICY IF EXISTS "Users can view own expenses" ON expense_entries;
DROP POLICY IF EXISTS "Users can insert own expenses" ON expense_entries;
DROP POLICY IF EXISTS "Users can update own expenses" ON expense_entries;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expense_entries;

DROP POLICY IF EXISTS "Users can view own debts" ON debt_entries;
DROP POLICY IF EXISTS "Users can insert own debts" ON debt_entries;
DROP POLICY IF EXISTS "Users can update own debts" ON debt_entries;
DROP POLICY IF EXISTS "Users can delete own debts" ON debt_entries;

-- Policies: user_settings
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own settings" ON user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Policies: income_entries
CREATE POLICY "Users can view own income" ON income_entries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own income" ON income_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own income" ON income_entries
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own income" ON income_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Policies: expense_entries
CREATE POLICY "Users can view own expenses" ON expense_entries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON expense_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON expense_entries
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON expense_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Policies: debt_entries
CREATE POLICY "Users can view own debts" ON debt_entries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own debts" ON debt_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own debts" ON debt_entries
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own debts" ON debt_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_income_user_date ON income_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expense_user_date ON expense_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_debt_user_type ON debt_entries(user_id, type);
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);
```

</details>

---

### **LANGKAH 4: Paste & Run SQL**

1. **Di SQL Editor**, paste SQL yang sudah di-copy (Ctrl+V atau Cmd+V)
2. **Klik tombol "RUN"** di pojok kanan bawah editor

**Visual:**
```
┌─────────────────────────────────────────────────┐
│ SQL Editor                                      │
├─────────────────────────────────────────────────┤
│ [Paste SQL di sini]                            │
│                                                 │
│ CREATE TABLE IF NOT EXISTS user_settings (     │
│   user_id UUID PRIMARY KEY...                  │
│   ...                                           │
│                                                 │
│                                                 │
│                                [RUN] ← KLIK INI!│
└─────────────────────────────────────────────────┘
```

**Tunggu 2-3 detik...**

---

### **LANGKAH 5: Verify Tabel Sudah Dibuat**

1. Klik **"Table Editor"** di sidebar
2. Pastikan 4 tabel ini muncul:
   - ✅ `user_settings`
   - ✅ `income_entries`
   - ✅ `expense_entries`
   - ✅ `debt_entries`

**Visual:**
```
┌─────────────────────────────────────┐
│ Table Editor                        │
├─────────────────────────────────────┤
│ Tables:                             │
│   ✅ debt_entries                   │
│   ✅ expense_entries                │
│   ✅ income_entries                 │
│   ✅ user_settings                  │
│                                     │
│ ← Semua tabel harus muncul di sini! │
└─────────────────────────────────────┘
```

---

### **LANGKAH 6: Refresh Aplikasi**

1. Kembali ke aplikasi Babadolan
2. **Refresh browser** (F5 atau Cmd+R)
3. **Login lagi** dengan akun Anda
4. **Coba tambah pemasukan/pengeluaran**

---

## 🎉 SETELAH FIX:

### **SEBELUM FIX:**
```
❌ Error: "Could not find the table 'public.income_entries'"
❌ Tidak bisa tambah pemasukan
❌ Tidak bisa tambah pengeluaran
❌ Form tidak save
```

### **SESUDAH FIX:**
```
✅ Tabel sudah dibuat di Supabase
✅ Bisa tambah pemasukan
✅ Bisa tambah pengeluaran
✅ Data tersimpan di cloud
✅ Auto-sync antar device
✅ Alert sukses muncul: "Pemasukan berhasil ditambahkan!"
```

---

## 🧪 TEST SETELAH FIX:

### **Test 1: Tambah Pemasukan**
```
1. Klik tab "Transaksi"
2. Klik "Tambah Pemasukan"
3. Isi form:
   - Tanggal: Hari ini
   - Sumber: Penjualan Produk
   - Jumlah: 1000000
   - Metode: Tunai
   - Deskripsi: Test pemasukan
   - Siapa yang Bayar: Customer A
4. Klik "Simpan"
5. ✅ Muncul alert: "✅ Pemasukan berhasil ditambahkan!"
6. ✅ Data muncul di tabel
```

### **Test 2: Tambah Pengeluaran**
```
1. Klik "Tambah Pengeluaran"
2. Isi form:
   - Tanggal: Hari ini
   - Kategori: Gaji Karyawan
   - Jumlah: 5000000
   - Metode: Transfer Bank
   - Deskripsi: Gaji Desember
   - Dibayar ke Siapa: Karyawan B
3. Klik "Simpan"
4. ✅ Muncul alert: "✅ Pengeluaran berhasil ditambahkan!"
5. ✅ Data muncul di tabel
```

### **Test 3: Sync Antar Device**
```
1. Tambah data di laptop
2. Buka aplikasi di HP (login dengan akun yang sama)
3. ✅ Data otomatis muncul di HP!
```

---

## 🚨 TROUBLESHOOTING:

### **Error: "relation does not exist"**
```
❌ SQL belum di-run dengan benar
✅ Ulangi Langkah 3-4
✅ Pastikan SEMUA SQL ter-copy (scroll sampai bawah)
✅ Klik RUN lagi
```

### **Error: "permission denied"**
```
❌ RLS policies belum aktif
✅ Jalankan SQL lagi (policies akan dibuat ulang)
✅ Pastikan SQL berjalan sampai selesai tanpa error
```

### **Tabel muncul tapi masih error saat save**
```
❌ Field di database tidak sesuai
✅ Drop semua tabel:
   DROP TABLE IF EXISTS income_entries CASCADE;
   DROP TABLE IF EXISTS expense_entries CASCADE;
   DROP TABLE IF EXISTS debt_entries CASCADE;
   DROP TABLE IF EXISTS user_settings CASCADE;
✅ Jalankan SQL dari awal lagi
```

### **Error: "Could not find the table" masih muncul**
```
❌ Cache Supabase belum refresh
✅ Tunggu 30 detik
✅ Refresh browser aplikasi (F5)
✅ Login lagi
```

---

## 📊 STRUKTUR TABEL YANG DIBUAT:

### **1. user_settings**
```
Kolom:
- user_id (UUID, PRIMARY KEY)
- income_sources (JSONB array)
- expense_categories (JSONB array)
- payment_methods (JSONB array)
- employees (JSONB array)
- created_at, updated_at

Fungsi: Simpan pengaturan user (sumber, kategori, dll)
```

### **2. income_entries**
```
Kolom:
- id (UUID, PRIMARY KEY)
- user_id (UUID, FOREIGN KEY)
- date (DATE)
- source (TEXT)
- description (TEXT)
- amount (NUMERIC 20,2)
- payment_method (TEXT)
- notes (TEXT)
- photos (JSONB array)
- received_from (TEXT) ← Siapa yang bayar
- created_at, updated_at

Fungsi: Simpan data pemasukan
```

### **3. expense_entries**
```
Kolom:
- id (UUID, PRIMARY KEY)
- user_id (UUID, FOREIGN KEY)
- date (DATE)
- category (TEXT)
- description (TEXT)
- amount (NUMERIC 20,2)
- payment_method (TEXT)
- notes (TEXT)
- photos (JSONB array)
- paid_to (TEXT) ← Dibayar ke siapa
- created_at, updated_at

Fungsi: Simpan data pengeluaran
```

### **4. debt_entries**
```
Kolom:
- id (UUID, PRIMARY KEY)
- user_id (UUID, FOREIGN KEY)
- type (TEXT: 'piutang' | 'hutang')
- date (DATE)
- name (TEXT)
- description (TEXT)
- amount (NUMERIC 20,2)
- due_date (DATE)
- status (TEXT: 'belum lunas' | 'lunas')
- payment_date (DATE)
- created_at, updated_at

Fungsi: Simpan data piutang & hutang
```

---

## 🔐 SECURITY (RLS Policies):

Setiap user **HANYA bisa akses data mereka sendiri**:

```sql
-- User A (id: xxx-111) → hanya bisa lihat/edit data dengan user_id = xxx-111
-- User B (id: yyy-222) → hanya bisa lihat/edit data dengan user_id = yyy-222
```

**KEAMANAN OTOMATIS:**
- ✅ User A tidak bisa lihat data User B
- ✅ User A tidak bisa edit data User B
- ✅ User A tidak bisa delete data User B
- ✅ Data terpisah dan aman per user

---

## ✅ CHECKLIST SETELAH SETUP:

- [ ] SQL sudah di-run di Supabase SQL Editor
- [ ] 4 tabel muncul di Table Editor
- [ ] Aplikasi di-refresh
- [ ] Login ulang berhasil
- [ ] Bisa tambah pemasukan (alert sukses muncul)
- [ ] Bisa tambah pengeluaran (alert sukses muncul)
- [ ] Data muncul di tabel
- [ ] Data sync antar device (test di HP)

---

## 📞 JIKA MASIH ERROR:

1. **Screenshot error** dari:
   - Console browser (F12 → Console tab)
   - Alert error yang muncul
2. **Cek Supabase Table Editor** - apakah 4 tabel sudah muncul?
3. **Cek SQL Editor** - apakah ada error merah saat run SQL?

---

**🎉 SELESAI! Sekarang aplikasi Babadolan siap dipakai dengan Supabase!** ✨

**💡 Keuntungan setelah setup:**
- ✅ Data tersimpan di cloud (aman)
- ✅ Auto-sync antar device (laptop ↔ HP)
- ✅ Backup otomatis
- ✅ Login dengan email/password
- ✅ Data terpisah per user (secure)
