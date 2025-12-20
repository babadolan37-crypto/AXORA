# 💰 SISTEM KAS BESAR & KAS KECIL - Penjelasan Lengkap

## 🎯 **STATUS SAAT INI:**

### ⚠️ **FITUR BELUM FULLY ACTIVE**

Sistem Kas Besar & Kas Kecil **SUDAH DIBANGUN LENGKAP** di aplikasi, tapi **BELUM BISA BERFUNGSI 100%** karena:

❌ Kolom `cash_type` **BELUM ADA** di tabel database:
- `income_entries` 
- `expense_entries`

✅ Tabel cash management **SUDAH ADA** di database:
- `cash_balances` ✅
- `cash_transactions` ✅
- `cash_transfers` ✅

---

## 📊 **BAGAIMANA SISTEM BEKERJA:**

### **1. SALDO TERPISAH**

Aplikasi memiliki **2 jenis kas yang terpisah**:

| Kas | Fungsi | Contoh Penggunaan |
|-----|--------|-------------------|
| **💼 Kas Besar** | Kas utama perusahaan | Modal usaha, transaksi besar, gaji bulanan |
| **💵 Kas Kecil** | Petty cash untuk operasional | Bensin, makan siang, ATK, biaya kecil |

**Saldo dihitung secara otomatis:**
```
Saldo Kas Besar = Saldo Awal + Pemasukan (Kas Besar) - Pengeluaran (Kas Besar)
Saldo Kas Kecil = Saldo Awal + Pemasukan (Kas Kecil) - Pengeluaran (Kas Kecil)
```

---

### **2. SETIAP TRANSAKSI PUNYA JENIS KAS**

**Saat Tambah Pemasukan/Pengeluaran:**
```
┌─────────────────────────────┐
│ 📝 Form Transaksi          │
├─────────────────────────────┤
│ Tanggal: 15 Des 2024       │
│ Kategori: Gaji Karyawan    │
│ Nominal: 5,000,000         │
│                            │
│ ⭐ Jenis Kas:              │
│    ○ Kas Besar ← DEFAULT   │
│    ○ Kas Kecil            │
└─────────────────────────────┘
```

**Hasil:**
- Pilih **Kas Besar** → Saldo Kas Besar berkurang 5jt
- Pilih **Kas Kecil** → Saldo Kas Kecil berkurang 5jt

---

### **3. TRANSFER ANTAR KAS**

Bisa pindahkan uang dari satu kas ke kas lainnya:

**Contoh: Transfer Kas Besar → Kas Kecil**
```
💼 Kas Besar:  10,000,000
💵 Kas Kecil:     500,000

Transfer: 2,000,000 dari Kas Besar → Kas Kecil

📊 Hasil:
💼 Kas Besar:   8,000,000 (-2jt)
💵 Kas Kecil:   2,500,000 (+2jt)
```

**Menu:**
- Dashboard → Tombol **"Transfer Kas"**
- Pilih dari mana ke mana
- Input nominal
- ✅ Otomatis update kedua saldo!

---

### **4. AUTO-CALCULATE BALANCE**

**Code di `/hooks/useCashManagement.ts` (line 194-200):**

```typescript
// Update balance otomatis
const currentBalance = balances.find(b => b.cashType === transaction.cashType)?.balance || 0;

const newBalance = transaction.transactionType === 'in' 
  ? currentBalance + transaction.amount   // Pemasukan: tambah saldo
  : currentBalance - transaction.amount;  // Pengeluaran: kurangi saldo

await updateBalance(transaction.cashType, newBalance);
```

**Artinya:**
- ✅ Setiap **tambah transaksi** → Saldo **otomatis update**
- ✅ Setiap **transfer kas** → Kedua saldo **otomatis update**
- ✅ Setiap **hapus transaksi** → Saldo **otomatis dikembalikan**

---

## ⚠️ **KENAPA BELUM BISA JALAN 100%?**

### **Masalah:**

1. **Kolom `cash_type` belum ada** di tabel:
   - `income_entries`
   - `expense_entries`

2. **Akibatnya:**
   - ❌ Transaksi baru **tidak bisa pilih Kas Besar/Kecil**
   - ❌ Transaksi lama **tidak punya data jenis kas**
   - ⚠️ Dashboard **hanya show saldo dari `cash_balances` table** (manual)
   - ⚠️ Perhitungan otomatis **belum sync dengan transaksi di `income_entries` & `expense_entries`**

### **Solusi Sementara (Sudah Diterapkan):**

✅ **Backward Compatible Mode:**
- Aplikasi retry save tanpa `cash_type` jika error
- Transaksi tetap tersimpan
- Tapi data `cash_type` tidak tercatat

---

## 🚀 **CARA AKTIFKAN FITUR 100%:**

### **STEP 1: Jalankan SQL Migration**

Login ke **Supabase Dashboard** → **SQL Editor** → Run SQL ini:

```sql
-- ====================================
-- ADD CASH_TYPE COLUMN TO MAIN TABLES
-- ====================================

-- 1. Add to expense_entries
ALTER TABLE expense_entries 
ADD COLUMN IF NOT EXISTS cash_type TEXT 
CHECK (cash_type IN ('big', 'small'))
DEFAULT 'big';

-- 2. Add to income_entries
ALTER TABLE income_entries 
ADD COLUMN IF NOT EXISTS cash_type TEXT 
CHECK (cash_type IN ('big', 'small'))
DEFAULT 'big';

-- 3. Set default untuk data existing
UPDATE expense_entries 
SET cash_type = 'big' 
WHERE cash_type IS NULL;

UPDATE income_entries 
SET cash_type = 'big' 
WHERE cash_type IS NULL;

-- 4. Create index untuk performa
CREATE INDEX IF NOT EXISTS idx_expense_entries_cash_type 
ON expense_entries(cash_type);

CREATE INDEX IF NOT EXISTS idx_income_entries_cash_type 
ON income_entries(cash_type);

-- 5. Verify
SELECT 
  'expense_entries' as table_name, 
  COUNT(*) as total_rows,
  COUNT(CASE WHEN cash_type = 'big' THEN 1 END) as kas_besar,
  COUNT(CASE WHEN cash_type = 'small' THEN 1 END) as kas_kecil
FROM expense_entries
UNION ALL
SELECT 
  'income_entries', 
  COUNT(*),
  COUNT(CASE WHEN cash_type = 'big' THEN 1 END),
  COUNT(CASE WHEN cash_type = 'small' THEN 1 END)
FROM income_entries;
```

### **STEP 2: Hard Refresh Aplikasi**

```
Windows: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

### **STEP 3: Set Saldo Awal**

1. Klik tab **"Pengaturan"**
2. Scroll ke **"Saldo Kas"**
3. Set:
   - **Saldo Awal Kas Besar:** Misal 10,000,000
   - **Saldo Awal Kas Kecil:** Misal 2,000,000
   - **Batas Saldo Rendah:** Misal 1,000,000
4. Klik **"Simpan Saldo"**

### **STEP 4: Test Fitur!**

#### **Test 1: Tambah Pengeluaran**
1. Tab **"Transaksi"** → **"Pengeluaran"**
2. Klik **"+ Tambah Pengeluaran"**
3. Pilih **Jenis Kas**: Kas Besar
4. Isi nominal: 500,000
5. Simpan
6. ✅ **Check Dashboard** → Saldo Kas Besar berkurang 500rb!

#### **Test 2: Transfer Kas**
1. Tab **"Dashboard"**
2. Klik **"Transfer Kas"**
3. Dari: Kas Besar → Ke: Kas Kecil
4. Nominal: 1,000,000
5. Simpan
6. ✅ **Check Dashboard:**
   - Kas Besar: -1jt
   - Kas Kecil: +1jt

#### **Test 3: Lihat Riwayat**
1. Tab **"Transaksi"**
2. ✅ Setiap transaksi ada badge **"Kas Besar"** atau **"Kas Kecil"**
3. ✅ Bisa filter berdasarkan jenis kas

---

## 📊 **FITUR LENGKAP SETELAH MIGRATION:**

### **✅ Dashboard**
```
┌────────────────────────────────────┐
│ 💼 KAS BESAR                       │
│ Rp 8.500.000                      │
│ ✏️ Atur Saldo                     │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ 💵 KAS KECIL                       │
│ Rp 1.750.000                      │
│ ⚠️ Saldo rendah (batas: 2jt)      │
│ ✏️ Atur Saldo                     │
└────────────────────────────────────┘

[🔄 Transfer Kas]
```

### **✅ Form Transaksi**
```
┌─────────────────────────────┐
│ Jenis Kas                   │
│ ○ Kas Besar (💼)            │
│ ○ Kas Kecil (💵)            │
└─────────────────────────────┘
```

### **✅ Transfer Antar Kas**
```
┌─────────────────────────────┐
│ Transfer Antar Kas          │
├─────────────────────────────┤
│ Dari: Kas Besar             │
│ Ke: Kas Kecil               │
│ Nominal: 2,000,000          │
│ Keterangan: Top up kas kecil│
│                             │
│ [Proses Transfer]           │
└─────────────────────────────┘
```

### **✅ Riwayat Transaksi**
```
┌────────────────────────────────────┐
│ 15 Des 2024 | 💼 Kas Besar        │
│ Gaji Karyawan                      │
│ Rp 5.000.000                       │
├────────────────────────────────────┤
│ 15 Des 2024 | 💵 Kas Kecil        │
│ Bensin Mobil                       │
│ Rp 150.000                         │
└────────────────────────────────────┘
```

### **✅ Export Excel**
```
Sheet: Pengeluaran
┌──────────────┬─────────────┬──────────┬───────────┐
│ Tanggal      │ Kategori    │ Jenis Kas│ Nominal   │
├──────────────┼─────────────┼──────────┼───────────┤
│ 15 Des 2024  │ Gaji        │ Kas Besar│ 5,000,000 │
│ 15 Des 2024  │ Bensin      │ Kas Kecil│   150,000 │
└──────────────┴─────────────┴──────────┴───────────┘

Sheet: Ringkasan Per Kas
┌──────────────┬──────────────┬──────────────┬──────────┐
│ Jenis Kas    │ Pemasukan    │ Pengeluaran  │ Saldo    │
├──────────────┼──────────────┼──────────────┼──────────┤
│ Kas Besar    │ 20,000,000   │ 11,500,000   │ 8,500,000│
│ Kas Kecil    │  3,000,000   │  1,250,000   │ 1,750,000│
└──────────────┴──────────────┴──────────────┴──────────┘
```

---

## 🔄 **ALUR KERJA LENGKAP:**

### **Scenario 1: Pengeluaran Operasional Kecil**
```
1. Manager ambil uang dari Kas Kecil untuk beli ATK
2. Catat transaksi → Pilih "Kas Kecil"
3. Nominal: 250,000
4. ✅ Saldo Kas Kecil otomatis berkurang 250rb
5. ✅ Dashboard update real-time
```

### **Scenario 2: Top Up Kas Kecil**
```
1. Kas Kecil hampir habis (saldo 200rb)
2. Dashboard show warning: ⚠️ Saldo rendah
3. Klik "Transfer Kas"
4. Dari Kas Besar → Ke Kas Kecil
5. Transfer 2jt
6. ✅ Kas Besar: -2jt
7. ✅ Kas Kecil: +2jt (sekarang 2.2jt)
```

### **Scenario 3: Bayar Gaji Besar**
```
1. Bayar gaji bulanan 15 karyawan
2. Total: 30jt
3. Catat di Pengeluaran → Pilih "Kas Besar"
4. ✅ Saldo Kas Besar otomatis berkurang 30jt
5. ✅ Transaksi tercatat dengan badge "Kas Besar"
```

### **Scenario 4: Cek Laporan Bulanan**
```
1. Export Excel
2. Buka sheet "Ringkasan Per Kas"
3. ✅ Lihat breakdown lengkap:
   - Total pengeluaran Kas Besar
   - Total pengeluaran Kas Kecil
   - Saldo akhir masing-masing
4. ✅ Mudah audit & reconciliation
```

---

## 💡 **BEST PRACTICES:**

### **1. Kapan Pakai Kas Besar?**
- ✅ Transaksi > 1jt
- ✅ Gaji karyawan
- ✅ Bayar supplier
- ✅ Investasi/modal
- ✅ Transfer bank

### **2. Kapan Pakai Kas Kecil?**
- ✅ Transaksi < 500rb
- ✅ Bensin/parkir
- ✅ Makan siang tim
- ✅ ATK & supplies
- ✅ Biaya tak terduga kecil

### **3. Atur Batas Saldo Rendah**
```
Kas Besar: 5jt
Kas Kecil: 500rb

Jika saldo < batas → Dashboard show warning ⚠️
```

### **4. Rutin Rekonsiliasi**
- Cek saldo fisik vs saldo di aplikasi
- Gunakan fitur "Atur Saldo" jika ada selisih
- Export Excel untuk audit bulanan

---

## 🎯 **KESIMPULAN:**

### **STATUS SEKARANG:**
- ⚠️ Fitur **HAMPIR READY**, cuma butuh 1 SQL migration
- ✅ Code **SUDAH LENGKAP** dengan auto-calculate
- ✅ Backward compatible → Aplikasi tetap bisa dipakai

### **SETELAH MIGRATION:**
- ✅ **Saldo otomatis update** setiap transaksi
- ✅ **Transfer antar kas** berfungsi sempurna
- ✅ **Dashboard real-time** per jenis kas
- ✅ **Export Excel** dengan breakdown lengkap
- ✅ **Filter & analisis** per jenis kas

---

## 📝 **NEXT STEPS:**

1. ✅ **Run SQL migration** (5 menit)
2. ✅ **Hard refresh** aplikasi
3. ✅ **Set saldo awal** di Pengaturan
4. ✅ **Test transaksi** baru
5. ✅ **Enjoy fitur Kas Besar/Kecil!** 🎉

---

**File SQL Migration:** `/fix-cash-type.sql`  
**Panduan Detail:** `/FIX-CASH-TYPE-ERROR.md`  
**Last Updated:** December 15, 2024  
**Status:** ⚠️ Perlu SQL Migration untuk Full Activation
