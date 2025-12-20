# 📊 PANDUAN EXPORT EXCEL - BABADOLAN

## ✅ FITUR EXPORT BARU

Export Excel sekarang menghasilkan **3 Sheet terpisah** dengan format yang jelas, terstruktur, dan mudah dipahami sesuai standar akuntansi PT.

---

## 📋 ISI FILE EXCEL

### **Sheet 1: Laporan Keuangan** (Detail Transaksi)

Berisi **detail semua transaksi** (pemasukan dan pengeluaran) dengan perhitungan saldo otomatis.

| Kolom | Keterangan | Contoh |
|-------|-----------|--------|
| **Tanggal** | Tanggal transaksi (dd/mm/yyyy) | 01/12/2025 |
| **Keterangan Transaksi** | Deskripsi singkat transaksi | Pembayaran dari klien A |
| **Kategori** | Sumber pemasukan atau kategori pengeluaran | Penjualan Produk |
| **Pemasukan** | Jumlah uang masuk (Rp) | Rp 500.000 |
| **Pengeluaran** | Jumlah uang keluar (Rp) | Rp 0 |
| **Saldo** | Saldo kumulatif (Pemasukan - Pengeluaran) | Rp 500.000 |
| **Metode Pembayaran** | Cara pembayaran | Transfer Bank |
| **Keterangan Tambahan** | Status atau catatan | Diterima / Dibayar |

**Fitur:**
- ✅ Transaksi diurutkan berdasarkan tanggal (terlama → terbaru)
- ✅ Saldo dihitung otomatis dan kumulatif
- ✅ Warna hijau untuk pemasukan, merah untuk pengeluaran
- ✅ Saldo negatif ditampilkan dengan warna merah
- ✅ Header dengan warna abu-abu biru (#4A7C59)
- ✅ Border untuk semua cell
- ✅ Font: Arial, ukuran 12

---

### **Sheet 2: Ringkasan Per Kategori** (Summary by Category)

Berisi **ringkasan total pemasukan dan pengeluaran per kategori**.

| Kolom | Keterangan | Rumus Excel |
|-------|-----------|-------------|
| **Kategori** | Nama kategori (sumber/kategori) | - |
| **Total Pemasukan** | Total pemasukan untuk kategori ini | `=SUMIF(...)` |
| **Total Pengeluaran** | Total pengeluaran untuk kategori ini | `=SUMIF(...)` |
| **Saldo Per Kategori** | Selisih pemasukan - pengeluaran | `=B2-C2` |

**Fitur:**
- ✅ Mengelompokkan transaksi berdasarkan kategori
- ✅ Perhitungan otomatis untuk setiap kategori
- ✅ Warna hijau untuk total pemasukan
- ✅ Warna merah untuk total pengeluaran
- ✅ Saldo per kategori dengan warna sesuai kondisi (hijau/merah)

**Contoh Data:**

| Kategori | Total Pemasukan | Total Pengeluaran | Saldo Per Kategori |
|----------|-----------------|-------------------|-------------------|
| Penjualan Produk | Rp 1.000.000 | Rp 0 | Rp 1.000.000 |
| Bahan Baku | Rp 0 | Rp 500.000 | -Rp 500.000 |
| Gaji Karyawan | Rp 0 | Rp 300.000 | -Rp 300.000 |

---

### **Sheet 3: Ringkasan Bulanan** (Monthly Summary)

Berisi **ringkasan total pemasukan dan pengeluaran per bulan**.

| Kolom | Keterangan | Rumus Excel |
|-------|-----------|-------------|
| **Bulan** | Bulan dan tahun | Januari 2025 |
| **Total Pemasukan** | Total pemasukan bulan tersebut | `=SUMIFS(...)` |
| **Total Pengeluaran** | Total pengeluaran bulan tersebut | `=SUMIFS(...)` |
| **Saldo Akhir Bulan** | Selisih pemasukan - pengeluaran | `=B2-C2` |

**Fitur:**
- ✅ Mengelompokkan transaksi berdasarkan bulan
- ✅ Diurutkan secara kronologis (bulan terlama → terbaru)
- ✅ Format bulan: "Januari 2025", "Februari 2025", dst.
- ✅ Perhitungan saldo akhir bulan otomatis
- ✅ Warna hijau untuk saldo positif, merah untuk negatif

**Contoh Data:**

| Bulan | Total Pemasukan | Total Pengeluaran | Saldo Akhir Bulan |
|-------|-----------------|-------------------|-------------------|
| November 2025 | Rp 2.500.000 | Rp 1.200.000 | Rp 1.300.000 |
| Desember 2025 | Rp 3.000.000 | Rp 1.500.000 | Rp 1.500.000 |

---

## 🎨 DESAIN & STYLING

### **Warna Header:**
- Background: **#4A7C59** (abu-abu hijau)
- Text: **Putih (#FFFFFF)**
- Font: **Arial, Bold, 12pt**

### **Warna Data:**
- Pemasukan: **Hijau (#2E7D32)**
- Pengeluaran: **Merah (#C62828)**
- Saldo positif: **Hijau bold**
- Saldo negatif: **Merah bold**
- Border: **Thin, abu-abu muda (#D0D0D0)**

### **Font:**
- **Nama Font**: Arial
- **Ukuran Header**: 12pt (Bold)
- **Ukuran Data**: 12pt (Regular)

### **Layout:**
- ✅ Semua header di-freeze (baris pertama tetap terlihat saat scroll)
- ✅ Auto-width untuk kolom sesuai konten
- ✅ Text alignment:
  - Tanggal: Center
  - Nominal (Rp): Right
  - Text: Left

---

## 🚀 CARA PAKAI

### **1. Export dari Aplikasi**

1. Buka aplikasi Babadolan
2. Klik tab **"Rekapitulasi"** (ikon grafik)
3. (Opsional) Filter periode:
   - Minggu Ini
   - Bulan Ini
   - Tahun Ini
   - Periode Custom
4. Klik tombol **"Export ke Excel"** (hijau, dengan ikon download)
5. File akan otomatis terdownload dengan nama: `Laporan_Keuangan_Babadolan_DD-MM-YYYY.xlsx`

### **2. Buka File Excel**

1. Buka file `.xlsx` dengan Microsoft Excel, Google Sheets, atau LibreOffice Calc
2. Akan ada **3 tabs/sheets** di bagian bawah:
   - **Laporan Keuangan** (detail)
   - **Ringkasan Per Kategori** (summary kategori)
   - **Ringkasan Bulanan** (summary bulanan)

### **3. Edit & Analisis**

File Excel ini **sudah final dan siap pakai**, tapi Anda bisa:
- ✅ Tambah kolom custom
- ✅ Buat grafik (chart) dari data
- ✅ Filter data dengan Excel filter
- ✅ Sort ulang data
- ✅ Print untuk laporan hardcopy

---

## 📊 KEGUNAAN MASING-MASING SHEET

| Sheet | Kegunaan | Untuk Siapa? |
|-------|----------|--------------|
| **Laporan Keuangan** | Detail semua transaksi, audit trail | Akuntan, auditor, owner |
| **Ringkasan Per Kategori** | Analisis pengeluaran/pemasukan per kategori | Manajer keuangan, owner |
| **Ringkasan Bulanan** | Tren keuangan per bulan, forecast | Owner, investor, CEO |

---

## 💡 TIPS PENGGUNAAN

### **1. Analisis Kategori Pengeluaran Tertinggi**
- Buka sheet **"Ringkasan Per Kategori"**
- Sort kolom **"Total Pengeluaran"** descending (besar → kecil)
- Identifikasi kategori dengan pengeluaran terbesar
- Buat rencana efisiensi biaya

### **2. Tracking Tren Bulanan**
- Buka sheet **"Ringkasan Bulanan"**
- Buat chart (Insert → Chart) dari kolom "Total Pemasukan" dan "Total Pengeluaran"
- Lihat tren naik/turun per bulan
- Forecast untuk bulan berikutnya

### **3. Audit Trail**
- Buka sheet **"Laporan Keuangan"**
- Gunakan Excel filter untuk cari transaksi spesifik
- Filter berdasarkan tanggal, kategori, atau metode pembayaran
- Verifikasi saldo dengan rekening bank

### **4. Print Laporan**
- **Print Sheet 1**: Detail transaksi untuk dokumentasi
- **Print Sheet 2**: Summary kategori untuk rapat manajemen
- **Print Sheet 3**: Tren bulanan untuk presentasi investor

---

## 🔧 TROUBLESHOOTING

### **"File tidak ter-download"**
- Pastikan browser mengizinkan download
- Cek folder "Downloads" di komputer Anda
- Coba browser lain (Chrome/Firefox/Edge)

### **"Excel menampilkan error saat buka file"**
- Pastikan menggunakan Microsoft Excel 2010 atau lebih baru
- Atau gunakan Google Sheets (upload file ke Google Drive)
- Atau gunakan LibreOffice Calc (gratis)

### **"Format angka tidak sesuai"**
- Ini normal jika setting regional Excel bukan Indonesia
- Ubah regional setting Excel ke "Indonesian (Indonesia)"
- Atau edit manual format cell: `Custom → Rp #,##0`

### **"Data tidak lengkap"**
- Pastikan sudah menambah transaksi di aplikasi
- Cek filter periode (ubah ke "Semua Periode")
- Refresh halaman dan export ulang

---

## 📞 SUPPORT

Jika ada pertanyaan atau masalah:
1. Screenshot file Excel yang error
2. Screenshot Console Browser (F12)
3. Kirim ke developer dengan detail masalah

---

## ✅ CHANGELOG

**Versi 2.0 (Desember 2025)**
- ✅ Format baru dengan 3 sheet terpisah
- ✅ Sesuai standar template Excel perusahaan
- ✅ Header dengan warna abu-abu biru
- ✅ Font Arial ukuran 12
- ✅ Border untuk semua cell
- ✅ Saldo kumulatif di Sheet 1
- ✅ Ringkasan per kategori di Sheet 2
- ✅ Ringkasan per bulan di Sheet 3
- ✅ Warna hijau/merah untuk pemasukan/pengeluaran

**Versi 1.0 (November 2025)**
- Format lama dengan 2 sheet
- Warna hijau gelap

---

**📊 Selamat menganalisis keuangan perusahaan Anda!** 💰✨
