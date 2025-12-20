# 🎉 Update Terbaru: Sistem Pemisahan Kas Besar & Kas Kecil

## 📋 Daftar Isi
- [Ringkasan Update](#ringkasan-update)
- [Perubahan Database](#perubahan-database)
- [Perubahan Kode](#perubahan-kode)
- [Cara Setup](#cara-setup)
- [Cara Menggunakan](#cara-menggunakan)
- [FAQ](#faq)

---

## 🎯 Ringkasan Update

### Kenapa Perlu Dipisah?
Sebelumnya semua pemasukan dan pengeluaran dicatat dalam satu kas saja. Padahal dalam praktik bisnis:
- **Kas Besar** untuk transaksi utama (gaji, sewa, pembelian bahan baku)
- **Kas Kecil** untuk operasional harian (ATK, transportasi, konsumsi)

### Apa yang Berubah?

#### ✅ Fitur Baru
1. **Pilihan Kas** di form Input Pemasukan
2. **Pilihan Kas** di form Input Pengeluaran  
3. **Kolom Jenis Kas** di tabel riwayat transaksi
4. **Badge Warna** untuk membedakan Kas Besar (biru) dan Kas Kecil (ungu)
5. **Default Value** = Kas Besar untuk data lama

#### 🔄 Backward Compatible
- Data lama tetap aman ✅
- Otomatis di-set ke "Kas Besar" ✅
- Tidak perlu input ulang data ✅

---

## 🗄️ Perubahan Database

### Tabel yang Diubah

#### 1. `income_entries`
```sql
-- Kolom baru
cash_type TEXT NOT NULL DEFAULT 'big' CHECK (cash_type IN ('big', 'small'))
```

#### 2. `expense_entries`
```sql
-- Kolom baru
cash_type TEXT NOT NULL DEFAULT 'big' CHECK (cash_type IN ('big', 'small'))
```

### Index Baru untuk Performa
```sql
-- Index untuk filter cepat
idx_income_entries_cash_type (user_id, cash_type)
idx_expense_entries_cash_type (user_id, cash_type)
idx_income_entries_date_cash_type (user_id, date DESC, cash_type)
idx_expense_entries_date_cash_type (user_id, date DESC, cash_type)
```

---

## 💻 Perubahan Kode

### 1. Type Definitions (`/types/accounting.ts`)

#### Before:
```typescript
export interface IncomeEntry {
  id: string;
  date: string;
  source: string;
  // ... fields lain
}
```

#### After:
```typescript
export interface IncomeEntry {
  id: string;
  date: string;
  source: string;
  // ... fields lain
  cashType: 'big' | 'small'; // ✅ BARU
}
```

### 2. Form Components

#### `/components/IncomeSheet.tsx`
- ✅ Tambah dropdown "Jenis Kas"
- ✅ Default value: Kas Besar
- ✅ Badge di tabel riwayat

#### `/components/ExpenseSheet.tsx`
- ✅ Tambah dropdown "Jenis Kas"
- ✅ Default value: Kas Besar
- ✅ Badge di tabel riwayat

### 3. Data Hooks (`/hooks/useSupabaseData.ts`)

#### Load Data:
```typescript
loadIncomeEntries() {
  // ... load dari database
  cashType: item.cash_type || 'big' // ✅ BARU
}
```

#### Save Data:
```typescript
addIncomeEntry(entry) {
  insert({
    // ... fields lain
    cash_type: entry.cashType || 'big' // ✅ BARU
  })
}
```

### 4. Migration (`/App.tsx`)
```typescript
// Migrate localStorage data
await addIncomeEntry({
  // ... fields lain
  cashType: entry.cashType || 'big' // ✅ BARU - default untuk data lama
})
```

---

## 🚀 Cara Setup

### Step 1: Backup Database
```sql
-- Backup data penting
CREATE TABLE income_entries_backup AS SELECT * FROM income_entries;
CREATE TABLE expense_entries_backup AS SELECT * FROM expense_entries;
```

### Step 2: Jalankan Migration

#### Opsi A: Copy File SQL
1. Buka file `/MIGRATION_ADD_CASH_TYPE.sql`
2. Copy seluruh isinya
3. Buka Supabase Dashboard → SQL Editor
4. Paste & Run

#### Opsi B: Manual SQL
Buka Supabase Dashboard → SQL Editor → Run:

```sql
-- 1. Tambah kolom di income_entries
ALTER TABLE income_entries 
ADD COLUMN IF NOT EXISTS cash_type TEXT DEFAULT 'big' 
CHECK (cash_type IN ('big', 'small'));

UPDATE income_entries SET cash_type = 'big' WHERE cash_type IS NULL;
ALTER TABLE income_entries ALTER COLUMN cash_type SET NOT NULL;

-- 2. Tambah kolom di expense_entries
ALTER TABLE expense_entries 
ADD COLUMN IF NOT EXISTS cash_type TEXT DEFAULT 'big' 
CHECK (cash_type IN ('big', 'small'));

UPDATE expense_entries SET cash_type = 'big' WHERE cash_type IS NULL;
ALTER TABLE expense_entries ALTER COLUMN cash_type SET NOT NULL;

-- 3. Tambah index
CREATE INDEX IF NOT EXISTS idx_income_entries_cash_type 
ON income_entries(user_id, cash_type);

CREATE INDEX IF NOT EXISTS idx_expense_entries_cash_type 
ON expense_entries(user_id, cash_type);
```

### Step 3: Verifikasi

```sql
-- Cek kolom sudah ada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns
WHERE table_name IN ('income_entries', 'expense_entries') 
  AND column_name = 'cash_type';

-- Cek data
SELECT cash_type, COUNT(*) FROM income_entries GROUP BY cash_type;
SELECT cash_type, COUNT(*) FROM expense_entries GROUP BY cash_type;
```

Expected output:
```
cash_type | count
----------|------
big       | (jumlah record lama)
```

### Step 4: Deploy Kode

1. **Production**: Deploy otomatis via Git push
2. **Local**: Restart dev server
3. **Test**: Coba tambah pemasukan/pengeluaran baru

---

## 📖 Cara Menggunakan

### Tambah Pemasukan dengan Kas Kecil

1. Klik **"Tambah Pemasukan"**
2. Isi form:
   - Tanggal: `2024-12-15`
   - Sumber: `Penjualan Kecil`
   - Jumlah: `500000`
   - **Jenis Kas**: Pilih **Kas Kecil** ✅
3. Klik **"Simpan"**

### Tambah Pengeluaran dengan Kas Kecil

1. Klik **"Tambah Pengeluaran"**
2. Isi form:
   - Tanggal: `2024-12-15`
   - Kategori: `Transportasi`
   - Jumlah: `150000`
   - **Jenis Kas**: Pilih **Kas Kecil** ✅
3. Klik **"Simpan"**

### Melihat Riwayat

Tabel sekarang menampilkan kolom **"Jenis Kas"** dengan badge:
- 🔵 **Kas Besar** (biru)
- 🟣 **Kas Kecil** (ungu)

### Edit Data Lama

1. Klik icon **Edit** (pensil) di tabel
2. Ubah **Jenis Kas** sesuai kebutuhan
3. Klik **"Update"**

---

## ❓ FAQ

### Q: Apakah data lama hilang?
**A:** Tidak! Data lama tetap aman dan otomatis di-set ke "Kas Besar"

### Q: Bagaimana kalau saya ingin ubah data lama jadi Kas Kecil?
**A:** Edit satu per satu via form edit, atau update massal via SQL:
```sql
UPDATE income_entries 
SET cash_type = 'small' 
WHERE category = 'Penjualan Kecil' AND user_id = 'YOUR_USER_ID';
```

### Q: Apakah bisa filter transaksi per jenis kas?
**A:** Belum ada di UI, tapi bisa via SQL:
```sql
SELECT * FROM income_entries 
WHERE cash_type = 'small' AND user_id = 'YOUR_USER_ID';
```

### Q: Export Excel sudah support pemisahan kas?
**A:** Belum, akan ditambahkan di update berikutnya

### Q: Saldo Kas Besar & Kas Kecil apakah otomatis terpisah?
**A:** Ya! Sistem sudah support tracking terpisah via tabel `cash_balances`

### Q: Rollback bagaimana kalau ada masalah?
**A:** Jalankan SQL berikut:
```sql
-- Hapus index
DROP INDEX IF EXISTS idx_income_entries_cash_type;
DROP INDEX IF EXISTS idx_expense_entries_cash_type;

-- Hapus kolom
ALTER TABLE income_entries DROP COLUMN IF EXISTS cash_type;
ALTER TABLE expense_entries DROP COLUMN IF EXISTS cash_type;

-- Restore backup (jika ada)
-- TRUNCATE income_entries;
-- INSERT INTO income_entries SELECT * FROM income_entries_backup;
```

---

## 🎨 UI/UX Changes

### Form Input
**Before:**
```
┌─────────────────┐
│ Tanggal         │
│ Sumber          │
│ Jumlah          │
│ Metode          │
└─────────────────┘
```

**After:**
```
┌─────────────────┐
│ Tanggal         │
│ Sumber          │
│ Jumlah          │
│ Metode          │
│ ✨ Jenis Kas   │  ← BARU
│   ⚪ Kas Besar  │
│   ⚪ Kas Kecil  │
└─────────────────┘
```

### Tabel Riwayat
**Before:**
```
Tanggal | Sumber | Jumlah | Metode
```

**After:**
```
Tanggal | Sumber | Jumlah | Jenis Kas | Metode
                           ↑ BARU
                           [Kas Besar] atau [Kas Kecil]
```

---

## 🔮 Roadmap Selanjutnya

### Version 1.1 (Soon)
- [ ] Filter transaksi per jenis kas
- [ ] Dashboard chart terpisah Kas Besar vs Kas Kecil
- [ ] Export Excel dengan sheet terpisah
- [ ] Saldo awal terpisah per kas

### Version 1.2 (Future)
- [ ] Transfer otomatis Kas Besar → Kas Kecil
- [ ] Notifikasi saldo Kas Kecil rendah
- [ ] Budget per jenis kas
- [ ] Laporan komparatif

---

## 📁 File yang Diubah

### Database
- ✅ `/MIGRATION_ADD_CASH_TYPE.sql` - Migration script lengkap

### Types
- ✅ `/types/accounting.ts` - Tambah field `cashType`

### Components
- ✅ `/components/IncomeSheet.tsx` - Form & tabel income
- ✅ `/components/ExpenseSheet.tsx` - Form & tabel expense

### Hooks
- ✅ `/hooks/useSupabaseData.ts` - CRUD operations

### Main App
- ✅ `/App.tsx` - Migration localStorage

### Documentation
- ✅ `/CARA_PISAHKAN_KAS.md` - Panduan singkat
- ✅ `/README_CASH_TYPE_UPDATE.md` - Dokumentasi lengkap (file ini)

---

## 🧪 Testing Checklist

- [ ] Tambah pemasukan Kas Besar
- [ ] Tambah pemasukan Kas Kecil
- [ ] Tambah pengeluaran Kas Besar
- [ ] Tambah pengeluaran Kas Kecil
- [ ] Edit transaksi lama
- [ ] Lihat badge di tabel
- [ ] Cek database langsung
- [ ] Test di mobile
- [ ] Test di tablet
- [ ] Test di desktop

---

## 🙏 Credits

- **Developer**: Figma Make AI
- **Database**: Supabase
- **UI Framework**: React + Tailwind CSS
- **Date**: 15 Desember 2024

---

## 📞 Support

Jika ada pertanyaan atau masalah:
1. Cek file `/CARA_PISAHKAN_KAS.md` untuk quick guide
2. Cek FAQ di atas
3. Lihat SQL migration di `/MIGRATION_ADD_CASH_TYPE.sql`

---

**🎉 Selamat menggunakan fitur baru Babadolan!** 🎉
