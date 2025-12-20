# 📝 Fitur Pengeluaran Kas Langsung

## Overview
Fitur **Pengeluaran Kas Langsung** memungkinkan Anda mencatat transfer kas beserta detail pengeluaran dalam **satu form sekaligus**. Berbeda dengan "Transfer Baru" yang memerlukan laporan pengeluaran terpisah, fitur ini cocok untuk pengeluaran yang sudah diketahui detail lengkapnya di awal.

---

## 🎯 Kapan Menggunakan Fitur Ini?

### ✅ Gunakan "Pengeluaran Langsung" Jika:
- Detail pengeluaran sudah diketahui di awal
- Transfer dan pengeluaran dilakukan bersamaan
- Tidak perlu menunggu laporan dari penerima
- Ingin input data lebih cepat dan efisien
- Pengeluaran sudah pasti dan tidak akan berubah

**Contoh Use Case:**
- Transfer Rp 91.000 ke Kinnan untuk:
  - Bensin: Rp 40.000
  - Makan: Rp 30.000
  - Print: Rp 15.000
- Semua detail sudah diketahui, langsung input sekaligus

### 🔄 Gunakan "Transfer Baru" (Report Later) Jika:
- Transfer diberikan dulu, detail pengeluaran akan dilaporkan kemudian
- Karyawan akan menggunakan uang sesuai kebutuhan di lapangan
- Memerlukan sistem approval dan verifikasi
- Ada kemungkinan selisih antara transfer dan pengeluaran aktual

**Contoh Use Case:**
- Transfer Rp 700.000 ke karyawan untuk pengeluaran operasional
- Karyawan akan lapor detail pengeluaran setelah selesai
- Sistem akan hitung selisih dan proses pengembalian/pembayaran

---

## 📋 Cara Menggunakan

### 1. Buka Form Pengeluaran Langsung
- Klik tombol **"Pengeluaran Langsung"** (warna ungu) di header
- Form akan terbuka dengan field-field yang perlu diisi

### 2. Isi Informasi Transaksi
- **Tanggal Transaksi**: Pilih tanggal pengeluaran
- **Jenis Kas**: Pilih Kas Besar atau Kas Kecil
- **Penerima Transfer**: Nama orang yang menerima (contoh: Kinnan)
- **Deskripsi**: Keterangan umum (opsional, akan auto-generate jika kosong)

### 3. Input Detail Pengeluaran
- Minimal harus ada 1 item pengeluaran
- Untuk setiap item, isi:
  - **Kategori**: Pilih dari dropdown (Makanan, Transportasi, dll)
  - **Deskripsi**: Jelaskan pengeluaran (contoh: "Bensin")
  - **Jumlah**: Masukkan nominal dalam Rupiah

### 4. Tambah Item Jika Perlu
- Klik tombol **"+ Tambah Item"** untuk menambah pengeluaran
- Klik ikon **Trash** untuk menghapus item (minimal harus ada 1)

### 5. Periksa Total
- Total transfer akan **otomatis dihitung** dari semua item pengeluaran
- Ditampilkan di kotak hijau di bagian bawah

### 6. Tambah Catatan (Opsional)
- Isi field catatan jika ada keterangan tambahan

### 7. Simpan
- Klik tombol **"Simpan Pengeluaran"**
- Data akan langsung masuk ke database dengan status **"Selesai"**

---

## 📊 Tampilan Data

### Mode Tabel (Default)
Tampilan tabel sederhana dengan kolom:
- **Tanggal**: Tanggal transaksi
- **Deskripsi**: Keterangan transaksi
- **Penerima**: Nama penerima transfer
- **Total Transfer**: Jumlah yang ditransfer
- **Pengeluaran**: Tombol untuk expand/collapse detail (menampilkan jumlah item)
- **Saldo Akhir**: Sisa setelah pengeluaran
- **Aksi**: Tombol hapus

#### Expand Detail
- Klik tombol dengan icon ▼ di kolom "Pengeluaran"
- Akan menampilkan tabel detail breakdown:
  - Kategori setiap pengeluaran
  - Deskripsi item
  - Jumlah per item
  - Bukti (jika ada)
  - Total di baris terakhir

### Mode Cards
Tampilan kartu detail dengan informasi lengkap:
- Header dengan nama penerima dan jenis kas
- Ringkasan jumlah transfer dan saldo
- Status transaksi
- Tombol untuk expand detail pengeluaran
- Aksi lengkap (lapor, proses pengembalian/pembayaran, dll)

### Toggle View Mode
- Di bagian filter, ada pilihan **"Tampilan"**
- Pilih antara:
  - **🗂️ Tabel**: View sederhana, cocok untuk melihat banyak data
  - **📋 Cards**: View detail, cocok untuk analisis mendalam

---

## 🔄 Perbedaan dengan "Transfer Baru"

| Aspek | Pengeluaran Langsung | Transfer Baru |
|-------|---------------------|---------------|
| **Input Detail** | Langsung di awal | Terpisah, dilaporkan kemudian |
| **Status Awal** | Settled (Selesai) | Pending (Menunggu Laporan) |
| **Workflow** | Single-step | Multi-step |
| **Selisih** | Selalu 0 (pas) | Bisa ada selisih |
| **Pengembalian/Pembayaran** | Tidak perlu | Mungkin perlu |
| **Bukti Foto** | Opsional | Wajib di laporan |
| **Use Case** | Detail sudah pasti | Detail belum pasti |

---

## 💡 Tips & Best Practices

### 1. Kapan Menggunakan Bukti Foto?
- Fitur "Pengeluaran Langsung" tidak mewajibkan bukti foto
- Namun untuk kebutuhan audit, disarankan tetap upload bukti di form "Transfer Baru" + "Laporan Pengeluaran"

### 2. Kategori Pengeluaran
Tersedia kategori default:
- Makanan & Minuman
- Transportasi
- Akomodasi
- Peralatan Kantor
- Komunikasi
- Parkir
- Tol
- Bahan Baku
- Supplies
- Entertainment
- Lainnya

### 3. Validasi
- Semua item harus diisi lengkap (kategori, deskripsi, jumlah)
- Jumlah harus lebih dari 0
- Minimal harus ada 1 item pengeluaran

### 4. Filter & Pencarian
- Gunakan filter status untuk menampilkan transaksi sesuai kebutuhan
- Filter jenis kas untuk memisahkan Kas Besar dan Kas Kecil
- Data yang diinput via "Pengeluaran Langsung" akan memiliki status "✅ Selesai"

---

## 📈 Contoh Praktis

### Contoh 1: Pengeluaran Harian Kinnan
```
Tanggal: 3 Desember 2025
Jenis Kas: Kas Kecil
Penerima: Kinnan
Deskripsi: Pengeluaran operasional harian

Detail Pengeluaran:
1. Transportasi - Bensin: Rp 40.000
2. Makanan & Minuman - Makan siang: Rp 30.000
3. Peralatan Kantor - Print dokumen: Rp 15.000

Total Transfer: Rp 91.000
Status: ✅ Selesai
```

### Contoh 2: Belanja Supplies Kantor
```
Tanggal: 10 Desember 2025
Jenis Kas: Kas Besar
Penerima: Ahmad
Deskripsi: Belanja supplies bulanan

Detail Pengeluaran:
1. Supplies - Kertas A4 (5 rim): Rp 150.000
2. Supplies - Tinta printer: Rp 200.000
3. Peralatan Kantor - Stapler & isi: Rp 50.000
4. Peralatan Kantor - Map & folder: Rp 75.000

Total Transfer: Rp 475.000
Status: ✅ Selesai
```

---

## 🔍 Analisis & Reporting

### Export Excel
- Data "Pengeluaran Langsung" akan masuk dalam export Excel
- Breakdown detail pengeluaran akan muncul di sheet analisis
- Filter berdasarkan kategori, penerima, atau periode

### Saldo Kas
- Setiap transaksi akan mengurangi saldo kas otomatis
- Saldo real-time ditampilkan di card Kas Besar/Kas Kecil
- History transaksi bisa dilihat di export Excel

---

## ⚠️ Catatan Penting

1. **Data Permanen**: Sekali disimpan, data tidak bisa diedit (hanya bisa dihapus)
2. **Status Selesai**: Transaksi langsung berstatus "Selesai", tidak perlu approval
3. **Saldo Otomatis**: Sistem akan langsung mengurangi saldo kas
4. **Tidak Ada Selisih**: Karena transfer = total pengeluaran, selalu pas (tidak ada pengembalian/pembayaran)

---

## 🆚 Perbandingan Workflow

### Workflow "Pengeluaran Langsung":
```
Input Form → Isi Detail Pengeluaran → Simpan → Selesai ✅
```

### Workflow "Transfer Baru":
```
Transfer → Menunggu ⏳ → Laporan Pengeluaran → Verifikasi
         → [Jika Ada Selisih]:
            - Lebih: Pengembalian 🔄
            - Kurang: Pembayaran Tambahan 💰
         → Selesai ✅
```

---

## 📞 Support

Jika ada pertanyaan atau masalah terkait fitur ini, silakan:
1. Cek dokumentasi database di `SUPABASE_CREATE_TABLES.sql`
2. Lihat panduan export Excel di `EXPORT_EXCEL_GUIDE.md`
3. Review setup Supabase di `SUPABASE_SETUP.md`

---

**Update Terakhir**: 10 Desember 2025
**Versi**: 2.0
**Status**: ✅ Production Ready
