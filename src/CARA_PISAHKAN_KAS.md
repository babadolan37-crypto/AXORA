# 🔄 Panduan: Memisahkan Kas Besar & Kas Kecil

## 📌 Ringkasan Perubahan

Aplikasi Babadolan sekarang mendukung pemisahan **Kas Besar** dan **Kas Kecil** untuk pemasukan dan pengeluaran!

### ✨ Fitur Baru:
- ✅ Pilih jenis kas (Besar/Kecil) saat input pemasukan
- ✅ Pilih jenis kas (Besar/Kecil) saat input pengeluaran  
- ✅ Lihat badge jenis kas di tabel riwayat transaksi
- ✅ Filter & laporan terpisah per jenis kas (segera hadir di Dashboard)

---

## 🚀 Cara Setup Database

### 1️⃣ Jalankan Migration SQL

Buka Supabase Dashboard → SQL Editor → Copy-paste SQL berikut:

```sql
-- Tambahkan kolom cash_type ke income_entries
ALTER TABLE income_entries 
ADD COLUMN IF NOT EXISTS cash_type TEXT DEFAULT 'big' CHECK (cash_type IN ('big', 'small'));

-- Update data lama dengan default 'big'
UPDATE income_entries SET cash_type = 'big' WHERE cash_type IS NULL;
ALTER TABLE income_entries ALTER COLUMN cash_type SET NOT NULL;

-- Tambahkan kolom cash_type ke expense_entries
ALTER TABLE expense_entries 
ADD COLUMN IF NOT EXISTS cash_type TEXT DEFAULT 'big' CHECK (cash_type IN ('big', 'small'));

-- Update data lama dengan default 'big'
UPDATE expense_entries SET cash_type = 'big' WHERE cash_type IS NULL;
ALTER TABLE expense_entries ALTER COLUMN cash_type SET NOT NULL;

-- Tambahkan index untuk performa
CREATE INDEX IF NOT EXISTS idx_income_entries_cash_type 
ON income_entries(user_id, cash_type);

CREATE INDEX IF NOT EXISTS idx_expense_entries_cash_type 
ON expense_entries(user_id, cash_type);

CREATE INDEX IF NOT EXISTS idx_income_entries_date_cash_type 
ON income_entries(user_id, date DESC, cash_type);

CREATE INDEX IF NOT EXISTS idx_expense_entries_date_cash_type 
ON expense_entries(user_id, date DESC, cash_type);
```

### 2️⃣ Verifikasi

Jalankan query berikut untuk cek instalasi:

```sql
-- Cek struktur tabel income
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns
WHERE table_name = 'income_entries' AND column_name = 'cash_type';

-- Cek struktur tabel expense
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns
WHERE table_name = 'expense_entries' AND column_name = 'cash_type';

-- Cek data income per kas
SELECT cash_type, COUNT(*) as total_records, SUM(amount) as total_amount
FROM income_entries
GROUP BY cash_type;

-- Cek data expense per kas
SELECT cash_type, COUNT(*) as total_records, SUM(amount) as total_amount
FROM expense_entries
GROUP BY cash_type;
```

---

## 📝 Cara Menggunakan

### Input Pemasukan
1. Klik **Tambah Pemasukan**
2. Isi form seperti biasa
3. **Pilih Jenis Kas**: Kas Besar atau Kas Kecil
4. Klik **Simpan**

### Input Pengeluaran
1. Klik **Tambah Pengeluaran**
2. Isi form seperti biasa
3. **Pilih Jenis Kas**: Kas Besar atau Kas Kecil
4. Klik **Simpan**

### Lihat Riwayat
- Tabel transaksi sekarang menampilkan **kolom "Jenis Kas"**
- Badge berwarna:
  - 🔵 **Biru** = Kas Besar
  - 🟣 **Ungu** = Kas Kecil

---

## 💡 Rekomendasi Penggunaan

### Kas Besar (Big Cash)
Gunakan untuk transaksi:
- ✅ Penjualan besar
- ✅ Pembayaran gaji karyawan
- ✅ Pembelian aset/bahan baku utama
- ✅ Bayar sewa kantor
- ✅ Investasi

### Kas Kecil (Small Cash)
Gunakan untuk transaksi:
- ✅ Pembelian ATK
- ✅ Biaya transportasi
- ✅ Konsumsi/makan karyawan
- ✅ Parkir
- ✅ Biaya operasional harian

---

## 🔧 Troubleshooting

### ❌ Error: column "cash_type" does not exist
**Solusi**: Jalankan migration SQL di atas

### ❌ Data lama tidak muncul cash_type
**Solusi**: Data lama otomatis di-set ke **Kas Besar** (default)

### ❌ Badge tidak muncul di tabel
**Solusi**: Refresh browser (Ctrl+F5 / Cmd+Shift+R)

---

## 📊 Coming Soon

- 🔜 Filter transaksi per jenis kas
- 🔜 Laporan terpisah Kas Besar & Kas Kecil
- 🔜 Export Excel per jenis kas
- 🔜 Dashboard chart per jenis kas
- 🔜 Auto-sync saldo Kas Besar & Kas Kecil

---

## 📄 File Migration Lengkap

Lihat file: `/MIGRATION_ADD_CASH_TYPE.sql` untuk migration lengkap termasuk rollback.

---

**Dibuat:** 15 Desember 2024  
**Versi:** 1.0.0  
**Status:** ✅ Production Ready
