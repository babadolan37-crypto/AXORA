# 🚀 Setup Database Babadolan (5 Menit)

## ✅ Langkah-Langkah Setup

### 1️⃣ Buka Supabase Dashboard
- Kunjungi: https://supabase.com/dashboard
- Login ke akun Supabase Anda
- Pilih project yang sudah Anda connect ke aplikasi

### 2️⃣ Buka SQL Editor
- Di sidebar kiri, klik **"SQL Editor"** (icon petir ⚡)
- Klik tombol **"+ New Query"** di pojok kanan atas

### 3️⃣ Copy & Paste SQL
- Buka file `/SUPABASE_CREATE_TABLES.sql` di project ini
- Copy SEMUA isi file (Ctrl+A → Ctrl+C)
- Paste ke SQL Editor di Supabase (Ctrl+V)

**ATAU** gunakan popup guide di aplikasi:
- Coba tambah pemasukan/pengeluaran
- Popup setup guide akan muncul otomatis
- Klik tombol "Copy SQL"
- Paste ke Supabase

### 4️⃣ Run SQL
- Klik tombol **"RUN"** di pojok kanan bawah SQL Editor
- Tunggu 2-3 detik sampai selesai (akan muncul pesan sukses)

### 5️⃣ Verify Tabel Berhasil Dibuat
- Klik **"Table Editor"** di sidebar kiri
- Pastikan 4 tabel berikut muncul:
  - ✅ `user_settings`
  - ✅ `income_entries`
  - ✅ `expense_entries`
  - ✅ `debt_entries`

### 6️⃣ Refresh Aplikasi
- Kembali ke aplikasi Babadolan
- Tekan **F5** untuk refresh
- Coba tambah pemasukan/pengeluaran
- ✅ **BERHASIL!** Data sekarang tersimpan di Supabase

---

## 📋 Apa yang Dibuat?

SQL migration akan membuat:

1. **4 Tabel Database:**
   - `user_settings` - Menyimpan pengaturan user (sumber pemasukan, kategori pengeluaran, dll)
   - `income_entries` - Menyimpan data pemasukan
   - `expense_entries` - Menyimpan data pengeluaran
   - `debt_entries` - Menyimpan data utang & piutang

2. **Row Level Security (RLS):**
   - Setiap user hanya bisa lihat/edit data mereka sendiri
   - Keamanan data terjamin

3. **Indexes:**
   - Query cepat untuk load data
   - Performa optimal

4. **Policies:**
   - 16 policies untuk mengatur akses data
   - Users bisa SELECT, INSERT, UPDATE, DELETE data mereka sendiri

---

## ❓ Troubleshooting

### Error: "Could not find the table in the schema cache" (PGRST205)
**Penyebab:** Tabel belum dibuat di Supabase  
**Solusi:** Ikuti langkah 1-6 di atas untuk membuat tabel

### Error: "relation already exists"
**Penyebab:** Tabel sudah pernah dibuat sebelumnya  
**Solusi:** Tidak masalah! SQL menggunakan `CREATE TABLE IF NOT EXISTS`, jadi aman di-run berkali-kali. Langsung refresh aplikasi saja.

### Tombol "Copy SQL" tidak bekerja
**Penyebab:** Browser blocking Clipboard API  
**Solusi:** 
1. Klik di dalam kotak SQL di popup
2. Tekan **Ctrl+A** (pilih semua)
3. Tekan **Ctrl+C** (copy)
4. Paste di Supabase dengan **Ctrl+V**

### Data tidak tersimpan setelah setup
**Penyebab:** Aplikasi belum di-refresh  
**Solusi:** Tekan **F5** untuk refresh browser

---

## 🎯 Setup Hanya 1x!

Setup database ini **hanya perlu dilakukan 1 kali saja**. Setelah tabel dibuat:
- ✅ Data otomatis sync antar device
- ✅ Data tersimpan permanen di Supabase
- ✅ Tidak perlu setup ulang lagi

---

## 📞 Bantuan Lebih Lanjut

Jika masih ada masalah:
1. Baca file `/FIX_TABEL_TIDAK_DITEMUKAN.md` untuk panduan lengkap
2. Check di Supabase Dashboard → Table Editor apakah 4 tabel sudah muncul
3. Check di browser console (F12) apakah ada error lain

**Selamat menggunakan Babadolan! 🎉**
