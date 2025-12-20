# 📊 Perbedaan Jenis Transaksi di Babadolan

## Overview

Aplikasi Babadolan memiliki **4 jenis sistem transaksi** yang berbeda dengan tujuan dan fungsi masing-masing.

---

## 1️⃣ TRANSAKSI PEMASUKAN & PENGELUARAN (Income & Expense Entries)

### 📍 Lokasi di Aplikasi
**Tab "Transaksi"** → Form Pemasukan/Pengeluaran

### 💾 Database
- Tabel: `income_entries` dan `expense_entries`
- Hook: `useSupabaseData()`

### 🎯 Tujuan
Untuk mencatat **transaksi bisnis utama** perusahaan:
- Pemasukan dari klien/customer
- Pengeluaran untuk operasional/vendor

### 📋 Field yang Dicatat

#### Pemasukan (Income):
```typescript
{
  date: string;           // Tanggal transaksi
  source: string;         // Sumber pemasukan (Penjualan Produk, Jasa, dll)
  description: string;    // Deskripsi detail
  amount: number;         // Jumlah uang
  paymentMethod: string;  // Metode bayar (Tunai, Transfer, dll)
  receivedFrom: string;   // Diterima dari siapa? (Klien A, Customer B)
  cashType: 'big'|'small';// Masuk ke Kas Besar atau Kas Kecil
  photos: string[];       // Bukti transaksi (opsional)
  notes: string;          // Catatan tambahan
}
```

#### Pengeluaran (Expense):
```typescript
{
  date: string;           // Tanggal transaksi
  category: string;       // Kategori (Gaji, Sewa, Bahan Baku, dll)
  description: string;    // Deskripsi detail
  amount: number;         // Jumlah uang
  paymentMethod: string;  // Metode bayar (Tunai, Transfer, dll)
  paidTo: string;         // Dibayar ke siapa? (Supplier X, Karyawan Y)
  cashType: 'big'|'small';// Keluar dari Kas Besar atau Kas Kecil
  photos: string[];       // Bukti transaksi (opsional)
  notes: string;          // Catatan tambahan
}
```

### ✅ Kapan Digunakan?
- ✅ Penerimaan uang dari klien/customer
- ✅ Pembayaran gaji karyawan (langsung)
- ✅ Pembelian bahan baku/operasional
- ✅ Pembayaran tagihan (listrik, air, sewa)
- ✅ Semua transaksi bisnis reguler

### ⚙️ Fitur Khusus
- Upload foto bukti transaksi
- OCR Scanner untuk auto-detect nominal dari struk
- Auto-categorization pengeluaran
- Tracking "Dari Siapa" dan "Ke Siapa"
- Export Excel per kategori

---

## 2️⃣ TRANSAKSI KAS (Cash Transactions)

### 📍 Lokasi di Aplikasi
**Tab "Advance"** → Riwayat Transaksi Kas (di bagian bawah)

### 💾 Database
- Tabel: `cash_transactions`
- Hook: `useCashManagement()`

### 🎯 Tujuan
Untuk mencatat **pergerakan uang tunai** di sistem Kas:
- Pemasukan manual ke kas
- Pengeluaran langsung dari kas
- Transfer antar Kas Besar ↔ Kas Kecil

### 📋 Field yang Dicatat
```typescript
{
  date: string;                // Tanggal transaksi
  cashType: 'big'|'small';     // Kas Besar atau Kas Kecil
  transactionType: 'in'|'out'; // Masuk (in) atau Keluar (out)
  amount: number;              // Jumlah uang
  description: string;         // Deskripsi transaksi
  proof: string;               // Bukti transaksi (base64 image)
  
  // Khusus untuk Transfer Antar Kas:
  isInterCashTransfer: boolean;  // Flag transfer internal
  linkedTransactionId: string;   // ID transaksi pasangan
}
```

### ✅ Kapan Digunakan?
- ✅ **Setor tunai langsung ke kas** (tidak dari klien)
- ✅ **Tarik tunai dari kas** untuk keperluan dadakan
- ✅ **Transfer Kas Besar → Kas Kecil** (alokasi mingguan)
- ✅ **Transfer Kas Kecil → Kas Besar** (pengembalian sisa)
- ✅ Adjustment saldo kas

### ❌ Jangan Digunakan Untuk
- ❌ Transaksi dari klien/customer (gunakan Income Entry)
- ❌ Transfer ke karyawan dengan laporan pengeluaran (gunakan Advance)
- ❌ Pembayaran vendor (gunakan Expense Entry)

### ⚙️ Fitur Khusus
- **Direct Cash Transaction**: Langsung update saldo tanpa proses lain
- **Inter-Cash Transfer**: Linked transactions (2 transaksi otomatis)
- **Real-time Balance Update**: Saldo update langsung
- Upload bukti transaksi

---

## 3️⃣ ADVANCE & REIMBURSEMENT

### 📍 Lokasi di Aplikasi
**Tab "Advance"** → Form Advance/Laporan Pengeluaran

### 💾 Database
- Tabel: `advance_payments`
- Hook: `useAdvancePayment()`

### 🎯 Tujuan
Untuk mencatat **transfer uang ke karyawan** yang perlu **laporan pengeluaran detail**:
- Kasbon/advance payment
- Operasional karyawan
- Settlement dengan bukti per item

### 📋 Field yang Dicatat
```typescript
{
  date: string;              // Tanggal transfer
  cashType: 'big'|'small';   // Dari Kas Besar atau Kas Kecil
  employeeName: string;      // Nama karyawan
  transferAmount: number;    // Jumlah uang yang di-transfer
  
  // Setelah karyawan belanja:
  actualExpense: number;     // Total pengeluaran sebenarnya
  expenseDetails: [{         // Detail pengeluaran per item
    date: string;
    category: string;        // Kategori pengeluaran
    description: string;
    amount: number;
    proof: string;           // WAJIB: Bukti per item
    vendor: string;
  }];
  
  // Settlement:
  difference: number;        // Selisih (transfer - actual)
  status: string;            // 'pending' | 'reported' | 'settled' | 'need_return'
  returnAmount: number;      // Uang yang harus dikembalikan
  returnDate: string;
  returnProof: string;
}
```

### ✅ Kapan Digunakan?
- ✅ Transfer uang ke karyawan untuk operasional
- ✅ Kasbon karyawan
- ✅ Belanja dengan dana perusahaan (perlu bukti detail)
- ✅ Transaksi yang perlu **tracking pengembalian dana**

### 🔄 Workflow
1. **Transfer**: Kasir transfer Rp 3.000.000 ke Karyawan A
2. **Belanja**: Karyawan A belanja, total Rp 2.700.000
3. **Laporan**: Karyawan A upload bukti per item pengeluaran
4. **Settlement**:
   - Jika kurang: Sistem hitung selisih Rp 300.000 harus dikembalikan
   - Jika lebih: Sistem hitung tambahan yang harus dibayar

### ⚙️ Fitur Khusus
- **Multiple Expense Items**: Rincian pengeluaran per item
- **Proof Required**: Wajib upload bukti per item
- **Auto-Calculate Difference**: Hitung selisih otomatis
- **Settlement Tracking**: Track pengembalian/tambahan pembayaran
- **Status Management**: pending → reported → settled
- Export Excel 5 sheets termasuk analisis settlement

---

## 4️⃣ UTANG & PIUTANG (Debt Entries)

### 📍 Lokasi di Aplikasi
**Tab "Utang/Piutang"**

### 💾 Database
- Tabel: `debt_entries`
- Hook: `useSupabaseData()`

### 🎯 Tujuan
Untuk mencatat **utang dan piutang** perusahaan:
- Utang ke supplier/vendor
- Piutang dari klien/customer
- Tracking cicilan pembayaran

### 📋 Field yang Dicatat
```typescript
{
  date: string;          // Tanggal transaksi
  type: 'debt'|'credit'; // Utang atau Piutang
  counterparty: string;  // Nama pihak terkait
  amount: number;        // Jumlah total
  paid: number;          // Sudah dibayar berapa
  remaining: number;     // Sisa yang belum dibayar
  dueDate: string;       // Tanggal jatuh tempo
  description: string;
  notes: string;
  status: 'unpaid'|'partial'|'paid'; // Status pembayaran
}
```

### ✅ Kapan Digunakan?
- ✅ Utang ke supplier (belum dibayar lunas)
- ✅ Piutang dari klien (invoice belum dibayar)
- ✅ Tracking cicilan utang/piutang

---

## 📊 TABEL PERBANDINGAN

| Fitur | Income/Expense | Cash Transaction | Advance/Reimburse | Debt |
|-------|----------------|------------------|-------------------|------|
| **Tujuan** | Transaksi bisnis utama | Pergerakan kas langsung | Transfer ke karyawan + laporan | Tracking hutang/piutang |
| **Database** | `income_entries`, `expense_entries` | `cash_transactions` | `advance_payments` | `debt_entries` |
| **Tab** | Transaksi | Advance (bagian bawah) | Advance (form) | Utang/Piutang |
| **Update Saldo** | ✅ Ya (otomatis) | ✅ Ya (langsung) | ✅ Ya (saat transfer & settlement) | ❌ Tidak langsung |
| **Bukti Transaksi** | Opsional | Opsional | **Wajib per item** | Opsional |
| **Kategori** | ✅ Ya | ❌ Tidak | ✅ Ya (per item) | ❌ Tidak |
| **Detail Items** | ❌ Single item | ❌ Single item | ✅ Multiple items | ❌ Single item |
| **Settlement** | ❌ Tidak | ❌ Tidak | ✅ Ya | ⚠️ Cicilan |
| **Export Excel** | ✅ Ya | ✅ Ya | ✅ Ya (5 sheets) | ✅ Ya |

---

## 🎯 KAPAN PAKAI YANG MANA?

### Scenario 1: Klien Bayar Invoice Rp 10.000.000
```
✅ PAKAI: Income Entry
   - Source: Penjualan Jasa
   - Received From: Klien A
   - Cash Type: Kas Besar
```

### Scenario 2: Bayar Gaji Karyawan Rp 5.000.000 (Langsung)
```
✅ PAKAI: Expense Entry
   - Category: Gaji Karyawan
   - Paid To: Karyawan A
   - Cash Type: Kas Besar
```

### Scenario 3: Transfer Modal Operasional Mingguan Rp 3.000.000 ke Kas Kecil
```
✅ PAKAI: Inter-Cash Transfer (Cash Transaction)
   - From: Kas Besar
   - To: Kas Kecil
   - Description: Modal operasional minggu ini
```

### Scenario 4: Kasir Setor Tunai Rp 500.000 ke Kas Kecil
```
✅ PAKAI: Cash Transaction
   - Type: in (Pemasukan)
   - Cash Type: Kas Kecil
   - Description: Setor tunai dari kasir
```

### Scenario 5: Karyawan Perlu Uang Rp 2.000.000 untuk Belanja Bahan Baku
```
✅ PAKAI: Advance Payment
   - Transfer: Rp 2.000.000 ke Karyawan B
   - Nanti karyawan lapor pengeluaran detail dengan bukti
   - Sistem hitung selisih otomatis
```

### Scenario 6: Beli Barang dari Supplier Tapi Belum Bayar
```
✅ PAKAI: Debt Entry
   - Type: Utang
   - Counterparty: Supplier X
   - Amount: Rp 15.000.000
   - Due Date: [tanggal jatuh tempo]
```

---

## ⚠️ PENTING: Jangan Double Entry!

### ❌ SALAH:
```
1. Catat di Income Entry: Klien bayar Rp 10jt
2. Catat lagi di Cash Transaction: Masuk Rp 10jt

→ SALDO JADI DOBEL! (Kas Besar +20jt)
```

### ✅ BENAR:
```
1. Catat HANYA di Income Entry: Klien bayar Rp 10jt
   → Saldo otomatis update +10jt

ATAU

2. Catat HANYA di Cash Transaction: Setor tunai Rp 10jt
   → Saldo otomatis update +10jt
```

---

## 💡 Tips Penggunaan

### Income/Expense Entry
- Gunakan untuk **semua transaksi bisnis reguler**
- Upload foto bukti untuk audit trail
- Isi "Received From" / "Paid To" untuk tracking

### Cash Transaction
- Gunakan untuk **adjustment kas langsung**
- Transfer antar kas otomatis (tidak perlu manual 2x)
- Cocok untuk setor/tarik tunai dadakan

### Advance/Reimburse
- Gunakan jika **butuh laporan detail** dari karyawan
- Wajib ada bukti per item pengeluaran
- Sistem track pengembalian dana otomatis

### Debt/Credit
- Gunakan untuk **tracking utang/piutang jangka panjang**
- Update manual saat ada cicilan
- Set reminder untuk due date

---

## 📈 Dampak ke Saldo Kas

### ✅ Yang Update Saldo Otomatis:
1. **Income Entry** → Saldo Kas naik (sesuai cashType)
2. **Expense Entry** → Saldo Kas turun (sesuai cashType)
3. **Cash Transaction** → Saldo naik/turun langsung
4. **Advance Transfer** → Saldo turun saat transfer
5. **Advance Settlement** → Saldo naik jika ada pengembalian

### ❌ Yang TIDAK Update Saldo:
1. **Debt Entry** → Hanya tracking, bukan transaksi kas

---

## 🔄 Relasi Antar Transaksi

```
Income/Expense ──┐
                 ├──> Saldo Kas Besar/Kecil
Cash Transaction ┘

Advance Transfer ──> Saldo Kas Turun
                     ↓
Expense Details ──> Laporan Pengeluaran
                     ↓
Settlement ──────> Saldo Kas Naik/Turun (adjustment)

Debt Entry ──────> Tracking Terpisah (bukan kas langsung)
```

---

## 📞 Pertanyaan Umum

**Q: Kenapa ada 2 sistem transaksi (Income/Expense vs Cash Transaction)?**
A: 
- **Income/Expense**: Untuk transaksi bisnis utama dengan detail lengkap (kategori, pihak terkait, dll)
- **Cash Transaction**: Untuk pergerakan kas sederhana dan cepat (adjustment, transfer internal)

**Q: Kapan pakai Expense Entry vs Advance Payment?**
A:
- **Expense Entry**: Jika Anda langsung bayar ke vendor/supplier (tidak perlu laporan)
- **Advance Payment**: Jika transfer dulu ke karyawan, nanti karyawan yang bayar dan lapor detail

**Q: Apakah Cash Transaction sama dengan Transaksi Kas di sheet lain?**
A: 
- **Cash Transaction**: Sistem yang mencatat pergerakan kas di tabel `cash_transactions`
- **Transaksi di Tab "Transaksi"**: Income/Expense entries yang juga update saldo kas

**Q: Bagaimana cara tracking kas dengan benar?**
A: Gunakan **Dashboard** tab untuk melihat:
- Saldo Kas Besar & Kas Kecil real-time
- Total Pemasukan & Pengeluaran
- Saldo Batas Rendah warning

---

**Last Updated:** 15 Desember 2024  
**Version:** 1.0.0
