# 🔄 Panduan Transfer Antar Kas

## Overview
Fitur Transfer Antar Kas memungkinkan Anda memindahkan uang dari Kas Besar ke Kas Kecil, atau sebaliknya, **tanpa perlu laporan pengeluaran**. Transaksi ini bersifat internal dan otomatis.

## Kapan Menggunakan?

### 📤 Kas Besar → Kas Kecil
Gunakan untuk:
- **Alokasi modal operasional mingguan**
- Memberikan dana operasional harian ke kas kecil
- Refill kas kecil yang habis

**Contoh:**
```
Transfer Rp 5.000.000 dari Kas Besar ke Kas Kecil
Untuk modal operasional minggu ini
```

### 📥 Kas Kecil → Kas Besar
Gunakan untuk:
- **Pengembalian sisa kas kecil** di akhir minggu/bulan
- Konsolidasi dana yang tidak terpakai
- Mengembalikan uang yang berlebih ke kas utama

**Contoh:**
```
Transfer Rp 2.500.000 dari Kas Kecil ke Kas Besar
Pengembalian sisa kas minggu ini
```

## Cara Menggunakan

### 1. Buka Form Transfer
Di Dashboard, klik tombol **"Transfer Kas"** (icon ⇄)

### 2. Pilih Arah Transfer
- **Dari Kas Besar → Ke Kas Kecil**
- **Dari Kas Kecil → Ke Kas Besar**

### 3. Input Data
- **Tanggal Transfer**: Tanggal transaksi
- **Jumlah**: Masukkan nominal transfer
- **Keterangan**: Deskripsi tujuan transfer

### 4. Preview
Sistem akan menampilkan preview saldo setelah transfer:
```
Kas Besar: Rp 10.000.000 → Rp 5.000.000 (-5.000.000)
Kas Kecil: Rp 1.000.000 → Rp 6.000.000 (+5.000.000)
```

### 5. Transfer
Klik **"Transfer Sekarang"** untuk eksekusi

## Validasi Otomatis

✅ **Cek Saldo Tersedia**
- Sistem otomatis cek apakah saldo cukup
- Tidak bisa transfer lebih dari saldo yang ada
- Muncul warning jika saldo tidak mencukupi

✅ **Update Saldo Real-time**
- Saldo langsung update setelah transfer
- Otomatis catat 2 transaksi (debit & kredit)
- Linked transaction untuk traceability

## Fitur Teknis

### Linked Transactions
Setiap inter-cash transfer akan membuat **2 transaksi yang saling terhubung**:

**Transaksi #1 (Source - Pengeluaran)**
```
Kas: Kas Besar
Type: out (Pengeluaran)
Jumlah: Rp 5.000.000
Deskripsi: Transfer modal operasional mingguan [Transfer ke Kas Kecil]
is_inter_cash_transfer: true
linked_transaction_id: <ID Transaksi #2>
```

**Transaksi #2 (Destination - Pemasukan)**
```
Kas: Kas Kecil  
Type: in (Pemasukan)
Jumlah: Rp 5.000.000
Deskripsi: Transfer modal operasional mingguan [Transfer dari Kas Besar]
is_inter_cash_transfer: true
linked_transaction_id: <ID Transaksi #1>
```

### Database Schema

```sql
-- Fields tambahan di cash_transactions:
is_inter_cash_transfer BOOLEAN DEFAULT FALSE
linked_transaction_id UUID REFERENCES cash_transactions(id)
```

## Perbedaan dengan Transfer ke Karyawan

| Fitur | Inter-Cash Transfer | Transfer ke Karyawan |
|-------|---------------------|---------------------|
| Tujuan | Kas internal (Besar ↔ Kecil) | Rekening karyawan |
| Laporan Pengeluaran | ❌ Tidak perlu | ✅ Wajib |
| Bukti Transaksi | ❌ Tidak perlu | ✅ Wajib per item |
| Settlement | ❌ Otomatis | ✅ Manual (jika ada selisih) |
| Use Case | Alokasi dana internal | Operasional eksternal |

## Contoh Workflow Mingguan

### Senin Pagi (Alokasi Dana)
```
Transfer Rp 3.000.000 dari Kas Besar ke Kas Kecil
Keterangan: Modal operasional minggu ini (16-20 Des)
```

**Hasil:**
- Kas Besar: -Rp 3.000.000
- Kas Kecil: +Rp 3.000.000

### Jumat Sore (Pengembalian Sisa)
```
Transfer Rp 800.000 dari Kas Kecil ke Kas Besar  
Keterangan: Pengembalian sisa kas kecil minggu ini
```

**Hasil:**
- Kas Kecil: -Rp 800.000
- Kas Besar: +Rp 800.000

**Total Digunakan:**
- Rp 3.000.000 (alokasi) - Rp 800.000 (sisa) = Rp 2.200.000

## Tracking & Audit

### Riwayat Transaksi
Semua transfer antar kas tercatat di riwayat dengan label:
- `[Transfer ke Kas Besar]`
- `[Transfer ke Kas Kecil]`

### Linked Transaction
Setiap transaksi punya `linked_transaction_id` untuk trace pasangan transaksinya.

### Query Example
```sql
-- Lihat semua inter-cash transfers
SELECT * FROM cash_transactions 
WHERE is_inter_cash_transfer = true
ORDER BY date DESC;

-- Lihat linked transactions
SELECT * FROM cash_transactions 
WHERE id = '<transaction_id>' 
   OR linked_transaction_id = '<transaction_id>';
```

## Tips & Best Practices

### 1. Transfer Rutin
✅ Buat jadwal transfer mingguan yang konsisten
✅ Contoh: Setiap Senin pagi transfer Rp X ke kas kecil

### 2. Pengembalian Sisa
✅ Kembalikan sisa kas kecil setiap Jumat
✅ Jaga kas kecil tetap lean dan termonitor

### 3. Keterangan Jelas
✅ Gunakan keterangan yang descriptive
✅ Contoh: "Transfer modal operasional minggu ke-3 Desember"
✅ Hindari: "Transfer" (terlalu umum)

### 4. Amount yang Masuk Akal
✅ Transfer dalam kelipatan yang wajar (1jt, 2jt, 5jt, dst)
✅ Sesuaikan dengan kebutuhan operasional riil

### 5. Monitoring
✅ Review total inter-cash transfer per bulan
✅ Pastikan tidak ada double transfer
✅ Cek balance akhir bulan match dengan fisik

## Migration SQL

Untuk menjalankan fitur ini, eksekusi SQL berikut di Supabase:

```sql
-- Add columns
ALTER TABLE cash_transactions
ADD COLUMN IF NOT EXISTS is_inter_cash_transfer BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS linked_transaction_id UUID REFERENCES cash_transactions(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cash_transactions_inter_cash 
ON cash_transactions(is_inter_cash_transfer) 
WHERE is_inter_cash_transfer = TRUE;

CREATE INDEX IF NOT EXISTS idx_cash_transactions_linked 
ON cash_transactions(linked_transaction_id) 
WHERE linked_transaction_id IS NOT NULL;

-- Update existing data
UPDATE cash_transactions 
SET is_inter_cash_transfer = FALSE 
WHERE is_inter_cash_transfer IS NULL;
```

File SQL lengkap ada di: `/MIGRATION_ADD_INTER_CASH_TRANSFER.sql`

## FAQ

**Q: Apakah bisa transfer lebih dari saldo?**
A: Tidak. Sistem otomatis validasi dan akan tolak jika saldo tidak cukup.

**Q: Apakah transfer antar kas perlu bukti?**
A: Tidak. Ini internal transfer, tidak perlu bukti transaksi.

**Q: Apakah bisa di-cancel setelah transfer?**
A: Ya, tapi harus hapus manual kedua transaksi yang linked.

**Q: Apakah muncul di laporan?**
A: Ya, muncul di riwayat transaksi kas dengan label khusus.

**Q: Bagaimana cara hapus inter-cash transfer?**
A: Hapus salah satu transaksi, yang linked juga harus dihapus manual.

## Update Log

**v1.0.0** (15 Des 2024)
- Initial release
- Support Kas Besar ↔ Kas Kecil
- Auto-validation saldo
- Linked transactions
- Real-time balance update
