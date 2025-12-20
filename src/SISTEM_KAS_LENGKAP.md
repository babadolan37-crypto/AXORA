# 📚 Dokumentasi Lengkap Sistem Kas Babadolan

## 📋 Daftar Isi
1. [Overview Sistem](#overview-sistem)
2. [Komponen Utama](#komponen-utama)
3. [Alur Kerja (Workflow)](#alur-kerja-workflow)
4. [Database Schema](#database-schema)
5. [Fitur-Fitur](#fitur-fitur)
6. [File & Struktur](#file--struktur)
7. [Setup & Instalasi](#setup--instalasi)

---

## Overview Sistem

Sistem Kas Babadolan adalah modul manajemen kas perusahaan yang komprehensif dengan fitur:
- ✅ Manajemen Kas Besar & Kas Kecil terpisah
- ✅ Transfer kas ke karyawan dengan tracking lengkap
- ✅ 2 mode input: Pengeluaran Langsung & Transfer + Laporan
- ✅ Sistem pengembalian/pembayaran otomatis jika ada selisih
- ✅ Upload bukti transaksi (foto)
- ✅ Export Excel dengan 5 sheet analisis
- ✅ Real-time saldo dan statistik
- ✅ Filter & pencarian advanced
- ✅ Mobile responsive (PWA ready)

---

## Komponen Utama

### 1. **Cash Management Sheet** (`CashManagementSheet.tsx`)
Komponen utama yang menampilkan:
- Card saldo Kas Besar & Kas Kecil
- Statistik pending, pengembalian, pembayaran
- Filter status dan jenis kas
- Toggle view mode (Tabel/Cards)
- Action buttons (Transfer Baru, Pengeluaran Langsung, Export)

### 2. **Form Input**
#### a. Direct Cash Expense Form (`DirectCashExpenseForm.tsx`)
- Input pengeluaran langsung dengan detail lengkap
- Multiple expense items dalam 1 form
- Auto-calculate total transfer
- Status langsung "Settled"

#### b. Cash Transfer Form (`CashTransferForm.tsx`)
- Input transfer tanpa detail pengeluaran
- Status awal "Pending"
- Menunggu laporan dari karyawan

#### c. Expense Report Form (`ExpenseReportForm.tsx`)
- Form untuk melaporkan detail pengeluaran
- Upload bukti WAJIB untuk setiap item
- Auto-calculate selisih
- Tentukan status final (settled/need_return/need_payment)

### 3. **Tampilan Data**
#### a. Simple Cash Expense Table (`SimpleCashExpenseTable.tsx`)
- Tampilan tabel sederhana dan clean
- Expand/collapse untuk lihat detail breakdown
- Cocok untuk overview cepat
- Responsive mobile dengan card view

#### b. Cash Transfer List (`CashTransferList.tsx`)
- Tampilan card detail dengan semua informasi
- Action buttons untuk lapor, proses pengembalian/pembayaran
- Status badge dan color coding
- View bukti transaksi

---

## Alur Kerja (Workflow)

### Workflow A: Pengeluaran Langsung ⚡
```
┌─────────────────────────────────────────────┐
│ 1. Klik "Pengeluaran Langsung"              │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│ 2. Isi Informasi:                           │
│    - Tanggal, Jenis Kas, Penerima          │
│    - Deskripsi (opsional)                   │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│ 3. Tambah Detail Pengeluaran:               │
│    - Kategori, Deskripsi, Jumlah           │
│    - Bisa multiple items                    │
│    - Total auto-calculate                   │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│ 4. Simpan                                    │
│    Status: ✅ SETTLED                       │
│    Transfer Amount = Total Pengeluaran      │
│    Difference = 0                            │
└──────────────────────────────────────────────┘
```

### Workflow B: Transfer + Laporan 📋
```
┌─────────────────────────────────────────────┐
│ 1. Finance: Klik "Transfer Baru"            │
│    - Input jumlah transfer                   │
│    - Status: ⏳ PENDING                      │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│ 2. Karyawan: Gunakan uang untuk pengeluaran│
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│ 3. Karyawan: Klik "Lapor Pengeluaran"      │
│    - Input detail semua pengeluaran         │
│    - Upload bukti WAJIB untuk tiap item     │
│    - Sistem hitung selisih otomatis         │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────▼─────────┐
        │  CEK SELISIH       │
        └─┬─────────┬──────┬─┘
          │         │      │
    ┌─────▼──┐  ┌──▼───┐ ┌▼──────┐
    │ LEBIH  │  │ PAS  │ │KURANG │
    │Transfer│  │      │ │Transfer│
    └─┬──────┘  └──┬───┘ └┬──────┘
      │            │      │
┌─────▼────┐  ┌───▼────┐ ┌▼────────┐
│🔄 NEED   │  │✅      │ │💰 NEED   │
│  RETURN  │  │SETTLED │ │  PAYMENT │
└─┬────────┘  └────────┘ └┬─────────┘
  │                        │
┌─▼────────────┐  ┌────────▼─────────┐
│Proses        │  │Proses Pembayaran │
│Pengembalian  │  │Tambahan          │
└─┬────────────┘  └┬─────────────────┘
  │                │
  └────────┬───────┘
           │
    ┌──────▼──────┐
    │✅ SETTLED   │
    └─────────────┘
```

---

## Database Schema

### Tabel: `cash_balances`
```sql
id              UUID PRIMARY KEY
user_id         UUID (FK to auth.users)
cash_type       TEXT ('big' | 'small')
balance         NUMERIC DEFAULT 0
last_updated    TIMESTAMP
```

### Tabel: `cash_transfers`
```sql
id                          UUID PRIMARY KEY
user_id                     UUID (FK to auth.users)
date                        DATE
cash_type                   TEXT
employee_name               TEXT
transfer_amount             NUMERIC
actual_expense              NUMERIC DEFAULT 0
difference                  NUMERIC DEFAULT 0
status                      TEXT (pending|reported|settled|need_return|need_payment)
description                 TEXT
return_amount               NUMERIC
return_date                 DATE
return_proof                TEXT (base64 image)
additional_payment          NUMERIC
additional_payment_date     DATE
additional_payment_proof    TEXT
notes                       TEXT
created_at                  TIMESTAMP
updated_at                  TIMESTAMP
```

### Tabel: `expense_details`
```sql
id              UUID PRIMARY KEY
transfer_id     UUID (FK to cash_transfers)
date            DATE
category        TEXT
description     TEXT
amount          NUMERIC
proof           TEXT (base64 image)
vendor          TEXT
created_at      TIMESTAMP
```

---

## Fitur-Fitur

### 1. Manajemen Saldo Kas ✅
- Card terpisah untuk Kas Besar dan Kas Kecil
- Real-time balance display
- Top-up kas dengan modal prompt
- Auto-update setelah transaksi

### 2. Dual Input Mode ✅
**Mode A: Pengeluaran Langsung**
- Single-step input
- Detail lengkap di awal
- Auto-calculate total
- Status langsung selesai

**Mode B: Transfer + Laporan**
- Multi-step workflow
- Transfer dulu, laporan kemudian
- Upload bukti wajib
- Sistem selisih otomatis

### 3. Sistem Selisih & Settlement ✅
- Auto-calculate: Actual Expense - Transfer Amount
- Status handling:
  - Pas (0) → Settled ✅
  - Lebih (negatif) → Need Return 🔄
  - Kurang (positif) → Need Payment 💰
- Tracking tanggal & bukti pengembalian/pembayaran

### 4. Filter & View Options ✅
**Filter:**
- By Status (All, Pending, Settled, Need Return, Need Payment)
- By Cash Type (All, Kas Besar, Kas Kecil)

**View Mode:**
- Table View: Simple & clean, expand untuk detail
- Cards View: Comprehensive dengan semua aksi

### 5. Export Excel ✅
5 Sheet export:
1. **Ringkasan Saldo**: Total Kas Besar & Kas Kecil
2. **Daftar Transfer**: Semua transaksi transfer
3. **Detail Pengeluaran**: Breakdown semua pengeluaran
4. **Analisis Kategori**: Grouping by category
5. **Analisis Karyawan**: Grouping by employee

### 6. Upload & View Bukti ✅
- Image compression otomatis (max 1MB)
- Store as base64 in database
- Modal viewer untuk lihat bukti
- Wajib upload untuk Expense Report Form

### 7. Statistics Dashboard ✅
Real-time cards:
- 🟡 Menunggu Laporan (Pending count)
- 🟠 Perlu Pengembalian (Need Return count)
- 🔴 Perlu Pembayaran (Need Payment count)

---

## File & Struktur

### Components
```
/components/
├── CashManagementSheet.tsx          # Main container
├── DirectCashExpenseForm.tsx        # Form pengeluaran langsung
├── CashTransferForm.tsx             # Form transfer baru
├── ExpenseReportForm.tsx            # Form laporan pengeluaran
├── SimpleCashExpenseTable.tsx       # Table view
├── CashTransferList.tsx             # Cards view
└── CashManagementSetupGuide.tsx     # Setup guide modal
```

### Hooks
```
/hooks/
└── useCashManagement.ts             # Custom hook untuk CRUD operations
```

### Types
```
/types/
└── cash-management.ts               # TypeScript interfaces & types
```

### Utils
```
/utils/
├── cashExcelExport.ts               # Excel export logic
└── imageCompression.ts              # Image compression utilities
```

### Documentation
```
/
├── SISTEM_KAS_LENGKAP.md           # Dokumentasi lengkap (this file)
├── FITUR_PENGELUARAN_LANGSUNG.md   # Detail fitur pengeluaran langsung
├── QUICK_GUIDE_KAS.md              # Quick reference guide
├── CONTOH_DATA_KAS.sql             # Sample data & queries
└── SUPABASE_CREATE_TABLES.sql      # Database schema DDL
```

---

## Setup & Instalasi

### 1. Database Setup
```bash
# 1. Buka Supabase Dashboard
# 2. Go to SQL Editor
# 3. Copy & paste SUPABASE_CREATE_TABLES.sql
# 4. Execute query
```

### 2. Insert Sample Data (Optional)
```bash
# Copy queries dari CONTOH_DATA_KAS.sql
# Sesuaikan YOUR_TRANSFER_ID dengan ID sebenarnya
# Execute untuk populate data testing
```

### 3. Verify Installation
```sql
-- Cek tabel sudah dibuat
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'cash_%';

-- Cek RLS policies
SELECT * FROM pg_policies 
WHERE tablename LIKE 'cash_%';
```

### 4. Test di Aplikasi
1. Login ke aplikasi
2. Navigate ke tab "Manajemen Kas"
3. Coba input dengan "Pengeluaran Langsung"
4. Coba workflow "Transfer Baru" + "Lapor Pengeluaran"
5. Test export Excel
6. Verify data di Supabase Dashboard

---

## Kategori Pengeluaran Default

```typescript
DEFAULT_CASH_EXPENSE_CATEGORIES = [
  'Makanan & Minuman',
  'Transportasi',
  'Akomodasi',
  'Peralatan Kantor',
  'Komunikasi',
  'Parkir',
  'Tol',
  'Bahan Baku',
  'Supplies',
  'Entertainment',
  'Lainnya'
]
```

---

## Status Transaksi

| Status | Icon | Arti | Action |
|--------|------|------|--------|
| pending | ⏳ | Menunggu laporan pengeluaran | Lapor Pengeluaran |
| reported | 📋 | Sudah dilaporkan, menunggu verifikasi | Verifikasi |
| settled | ✅ | Selesai, tidak ada selisih | - |
| need_return | 🔄 | Karyawan perlu kembalikan uang | Proses Pengembalian |
| need_payment | 💰 | Finance perlu bayar tambahan | Proses Pembayaran |

---

## Best Practices

### 💡 Untuk Finance
1. Gunakan "Pengeluaran Langsung" untuk transaksi rutin yang sudah pasti
2. Gunakan "Transfer Baru" untuk pengeluaran lapangan yang belum detail
3. Selalu cek statistik pending untuk follow-up
4. Export Excel secara berkala untuk audit
5. Verifikasi bukti foto sebelum settle

### 💡 Untuk Karyawan
1. Lapor pengeluaran sesegera mungkin setelah transaksi
2. Upload bukti yang jelas dan terbaca
3. Isi detail lengkap (vendor, kategori, deskripsi)
4. Kembalikan sisa uang jika lebih bayar
5. Simpan struk/bukti fisik sebagai backup

### 💡 Untuk Admin
1. Backup database secara berkala
2. Monitor saldo kas untuk mencegah overdraft
3. Review laporan Excel bulanan
4. Setup alerts untuk pending yang terlalu lama
5. Training user untuk workflow yang benar

---

## Troubleshooting

### Q: Data tidak muncul setelah input?
**A:** 
- Cek koneksi internet
- Verify RLS policies di Supabase
- Check console untuk error messages
- Pastikan user sudah login

### Q: Upload bukti gagal?
**A:**
- Ukuran file terlalu besar → sistem auto-compress
- Format tidak supported → gunakan JPG/PNG
- Check browser permission untuk file upload

### Q: Export Excel kosong?
**A:**
- Pastikan ada data transaksi
- Check filter yang aktif (mungkin filter out semua data)
- Verify browser allow download

### Q: Selisih tidak akurat?
**A:**
- Pastikan semua expense details sudah diinput
- Check perhitungan manual: Actual Expense - Transfer Amount
- Verify tidak ada data duplicate

---

## Roadmap & Future Enhancements

### 🚀 Planned Features
- [ ] Approval workflow multi-level
- [ ] Push notification untuk pending > 3 hari
- [ ] Recurring expense templates
- [ ] Budget planning & tracking
- [ ] Integration dengan rekening bank
- [ ] Auto-categorize dengan AI/ML
- [ ] QR code untuk struk digital
- [ ] Advanced analytics & dashboards

---

## Support & Contact

📧 **Technical Support**: Check `/SUPABASE_SETUP.md`  
📖 **Full Documentation**: Check all `.md` files in root  
💻 **Source Code**: Components in `/components/`  
🗄️ **Database**: SQL scripts in root directory  

---

**Version**: 2.0  
**Last Updated**: 10 Desember 2025  
**Status**: ✅ Production Ready  
**Author**: Babadolan Development Team
