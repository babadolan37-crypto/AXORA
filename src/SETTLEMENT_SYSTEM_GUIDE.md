# 📋 Panduan Sistem Settlement Transfer Kas

## Overview
Sistem ini memungkinkan Anda melacak detail pengeluaran karyawan dari setiap transfer kas, termasuk upload bukti per item dan penyelesaian (settlement) kelebihan/kekurangan pembayaran.

## Fitur Utama

### 1. Transfer Kas ke Karyawan
- Transfer sejumlah uang dari kas (Besar/Kecil) ke rekening karyawan
- Mencatat nama karyawan, jumlah transfer, dan deskripsi
- Status awal: **Menunggu Laporan** 

### 2. Laporan Pengeluaran Detail
Karyawan wajib melaporkan pengeluaran aktual dengan:
- **Multiple expense items** (bisa tambah banyak item)
- Setiap item harus punya:
  - Tanggal pengeluaran
  - Kategori (Transportasi, Makanan, ATK, dll)
  - Deskripsi
  - Vendor/toko
  - Jumlah
  - **Bukti transaksi (foto)** - WAJIB!

### 3. Auto-Calculate Selisih
Sistem otomatis menghitung:
- **Total pengeluaran** = sum dari semua expense items
- **Selisih** = Total pengeluaran - Jumlah transfer

### 4. Settlement/Pengembalian Dana

#### Skenario A: Karyawan Pakai Lebih Sedikit (Harus Kembalikan Sisa)
**Contoh:**
- Transfer: Rp 700.000
- Pengeluaran aktual: Rp 600.000
- **Selisih: -Rp 100.000** (lebih Rp 100.000)

**Proses:**
1. Status berubah jadi: **Perlu Pengembalian**
2. Muncul section upload bukti transfer pengembalian
3. Upload bukti bahwa karyawan sudah transfer balik Rp 100.000
4. Klik "Konfirmasi Pengembalian"
5. Status jadi: **Selesai** ✅

#### Skenario B: Karyawan Pakai Lebih Banyak (Finance Harus Bayar Tambahan)
**Contoh:**
- Transfer: Rp 700.000
- Pengeluaran aktual: Rp 750.000
- **Selisih: +Rp 50.000** (kurang Rp 50.000)

**Proses:**
1. Status berubah jadi: **Perlu Pembayaran**
2. Muncul section upload bukti transfer pembayaran tambahan
3. Upload bukti bahwa finance sudah transfer Rp 50.000 ke karyawan
4. Klik "Konfirmasi Pembayaran"
5. Status jadi: **Selesai** ✅

#### Skenario C: Pengeluaran Pas (Tidak Ada Selisih)
**Contoh:**
- Transfer: Rp 700.000
- Pengeluaran aktual: Rp 700.000
- **Selisih: Rp 0** (pas!)

**Proses:**
1. Status langsung jadi: **Selesai** ✅
2. Tidak perlu settlement

## Status Transfer

| Status | Badge | Deskripsi |
|--------|-------|-----------|
| `pending` | ⏳ Menunggu Laporan | Transfer baru, belum ada laporan pengeluaran |
| `reported` | 📋 Sudah Dilaporkan | Karyawan sudah lapor, sistem sedang hitung selisih |
| `need_return` | 🔄 Perlu Pengembalian | Karyawan harus kembalikan sisa uang |
| `need_payment` | 💰 Perlu Pembayaran | Finance harus bayar tambahan ke karyawan |
| `settled` | ✅ Selesai | Semua settlement sudah selesai |

## Validasi Wajib

### Upload Bukti Pengeluaran
✅ **Wajib:** Setiap expense item HARUS ada bukti foto (struk/nota)
- Format: JPG, PNG, JPEG
- Akan dikompress otomatis (max 800px, quality 0.7)
- Disimpan sebagai base64 di database

### Upload Bukti Settlement
✅ **Wajib:** Pengembalian/pembayaran tambahan HARUS ada bukti transfer
- Bukti screenshot transfer dari karyawan (untuk pengembalian)
- Bukti screenshot transfer dari finance (untuk pembayaran tambahan)

## Export Excel

File Excel akan berisi 5 sheets:

### Sheet 1: Ringkasan Saldo
- Saldo Kas Besar
- Saldo Kas Kecil
- Total Kas

### Sheet 2: Daftar Transfer
Semua transfer dengan kolom:
- Tanggal Transfer
- Jenis Kas
- Nama Karyawan
- Deskripsi
- Jumlah Transfer
- Pengeluaran Aktual
- Selisih
- Status
- Tanggal Pengembalian
- Jumlah Pengembalian
- Tanggal Pembayaran Tambahan
- Jumlah Pembayaran Tambahan
- Catatan

### Sheet 3: Detail Pengeluaran
Breakdown semua expense items:
- Nama Karyawan
- Tanggal Pengeluaran
- Kategori
- Deskripsi
- Vendor/Toko
- Jumlah
- Bukti (Ada/Tidak Ada)

### Sheet 4: Analisis Per Kategori
- Total pengeluaran per kategori
- Jumlah transaksi per kategori
- Sorted dari terbesar

### Sheet 5: Analisis Per Karyawan
- Total transfer per karyawan
- Total pengeluaran per karyawan
- Selisih total
- Jumlah transfer
- Summary status

## Database Schema

### Table: `cash_transfers`

```sql
CREATE TABLE cash_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  cash_type TEXT NOT NULL, -- 'big' or 'small'
  employee_name TEXT NOT NULL,
  transfer_amount NUMERIC NOT NULL,
  actual_expense NUMERIC DEFAULT 0,
  difference NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'reported', 'settled', 'need_return', 'need_payment'
  description TEXT NOT NULL,
  expense_details JSONB DEFAULT '[]'::jsonb, -- Array of expense detail objects
  notes TEXT,
  
  -- Settlement fields
  return_amount NUMERIC,
  return_date TEXT,
  return_proof TEXT, -- Base64 image
  additional_payment NUMERIC,
  additional_payment_date TEXT,
  additional_payment_proof TEXT, -- Base64 image
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE cash_transfers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own transfers
CREATE POLICY "Users can view own cash transfers"
  ON cash_transfers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cash transfers"
  ON cash_transfers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cash transfers"
  ON cash_transfers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cash transfers"
  ON cash_transfers FOR DELETE
  USING (auth.uid() = user_id);

-- Index for better performance
CREATE INDEX idx_cash_transfers_user_id ON cash_transfers(user_id);
CREATE INDEX idx_cash_transfers_date ON cash_transfers(date);
CREATE INDEX idx_cash_transfers_status ON cash_transfers(status);
```

### Expense Details Structure (JSONB)

```typescript
{
  id: string;
  date: string; // ISO format
  category: string; // 'Transportasi', 'Makanan', 'ATK', dll
  description: string;
  amount: number;
  proof: string; // Base64 image or URL
  vendor?: string; // Optional
}
```

## Contoh Workflow Lengkap

### 1. Transfer Kas (Finance)
```
Tanggal: 10 Des 2024
Jenis Kas: Kas Kecil
Karyawan: Kinnan
Transfer: Rp 700.000
Deskripsi: Biaya operasional lapangan minggu ini
```

### 2. Laporan Pengeluaran (Karyawan)
```
Item #1:
- Tanggal: 10 Des 2024
- Kategori: Transportasi
- Deskripsi: Bensin motor
- Vendor: SPBU Pertamina
- Jumlah: Rp 40.000
- Bukti: [Upload foto struk]

Item #2:
- Tanggal: 10 Des 2024
- Kategori: Makanan
- Deskripsi: Makan siang tim
- Vendor: Warteg Bahari
- Jumlah: Rp 75.000
- Bukti: [Upload foto nota]

Item #3:
- Tanggal: 11 Des 2024
- Kategori: ATK
- Deskripsi: Kertas HVS & tinta printer
- Vendor: Toko Sejahtera
- Jumlah: Rp 135.000
- Bukti: [Upload foto struk]

Total: Rp 250.000
```

### 3. Settlement
```
Transfer: Rp 700.000
Total Pengeluaran: Rp 250.000
Selisih: -Rp 450.000 (lebih)

→ Status: Perlu Pengembalian
→ Kinnan harus transfer balik Rp 450.000
→ Upload bukti transfer
→ Konfirmasi pengembalian
→ Status: Selesai ✅
```

## Tips & Best Practices

### Untuk Karyawan
1. ✅ Selalu simpan semua struk/nota transaksi
2. ✅ Foto bukti harus jelas dan bisa dibaca
3. ✅ Lapor pengeluaran sesegera mungkin (max 3 hari)
4. ✅ Catat vendor/toko untuk audit trail
5. ✅ Jika lebih, segera kembalikan ke perusahaan

### Untuk Finance
1. ✅ Verifikasi bukti pengeluaran sebelum approve
2. ✅ Cross-check dengan kategori pengeluaran
3. ✅ Monitor status transfer secara berkala
4. ✅ Export Excel untuk laporan bulanan
5. ✅ Simpan bukti settlement untuk arsip

### Untuk Admin
1. ✅ Review analisis per kategori tiap bulan
2. ✅ Monitor pola pengeluaran karyawan
3. ✅ Set reminder untuk pending transfers > 7 hari
4. ✅ Backup database secara regular
5. ✅ Audit trail dengan settlement proofs

## Troubleshooting

### Error: "Semua pengeluaran harus memiliki bukti transaksi"
❌ Pastikan SEMUA expense items sudah upload foto bukti

### Error: "Wajib upload bukti transfer pengembalian"
❌ Upload dulu bukti transfer sebelum konfirmasi pengembalian

### Status stuck di "Sudah Dilaporkan"
❌ Cek apakah ada selisih yang perlu di-settle
❌ Refresh halaman atau reload data

### Export Excel tidak muncul sheet Detail Pengeluaran
❌ Pastikan ada transfer yang sudah punya expense details

## Update Log

**v1.0.0** (15 Des 2024)
- Initial release
- Upload bukti per expense item
- Settlement dengan upload bukti
- Export Excel 5 sheets lengkap
- Auto-calculate selisih
- Validasi wajib bukti
