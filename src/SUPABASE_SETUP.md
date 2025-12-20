# 🚀 PANDUAN SETUP SUPABASE - BABADOLAN

## 🚨 PENTING: BACA INI DULU!

Jika Anda mendapat error:
```
❌ "Could not find the table 'public.income_entries' in the schema cache"
❌ "Could not find the table 'public.expense_entries' in the schema cache"
```

**👉 Buka file `/FIX_TABEL_TIDAK_DITEMUKAN.md` untuk panduan lengkap!**

---

## ✅ Status: Credentials Sudah Terpasang!

Supabase URL dan API Key sudah terkonfigurasi di `/lib/supabase.ts`

---

## 📋 QUICK START - 3 LANGKAH MUDAH

### **LANGKAH 1: Buka Supabase Dashboard**

1. Login ke https://supabase.com/dashboard
2. Pilih project Anda: `tpemoqesoasfsvutjral`
3. Klik **SQL Editor** di sidebar kiri
4. Klik **+ New Query**

---

### **LANGKAH 2: Copy & Paste SQL**

1. **Buka file:** `/SUPABASE_CREATE_TABLES.sql` (ada di project ini)
2. **Copy semua isinya** (Ctrl+A → Ctrl+C)
3. **Paste ke SQL Editor** di Supabase (Ctrl+V)
4. **Klik tombol "RUN"**
5. **Tunggu sampai selesai** (2-3 detik)

**✅ Berhasil jika muncul pesan sukses tanpa error merah**

---

### **LANGKAH 3: Verify & Test**

1. **Klik "Table Editor"** di Supabase Dashboard
2. **Pastikan 4 tabel ini muncul:**
   - ✅ `user_settings`
   - ✅ `income_entries`
   - ✅ `expense_entries`
   - ✅ `debt_entries`

3. **Kembali ke aplikasi Babadolan**
4. **Refresh browser** (F5)
5. **Login** dengan akun Anda
6. **Test tambah pemasukan/pengeluaran**

---

## 📝 APA YANG DIBUAT SQL?

### **4 Tabel Utama:**

1. **`user_settings`** - Pengaturan user
   - Sumber pemasukan (Penjualan Produk, Jasa, dll)
   - Kategori pengeluaran (Gaji, Sewa, dll)
   - Metode pembayaran (Tunai, Transfer, dll)
   - Daftar karyawan

2. **`income_entries`** - Data Pemasukan
   - Tanggal, sumber, jumlah
   - Metode pembayaran
   - Deskripsi, catatan
   - Foto bukti
   - Siapa yang bayar (receivedFrom)

3. **`expense_entries`** - Data Pengeluaran
   - Tanggal, kategori, jumlah
   - Metode pembayaran
   - Deskripsi, catatan
   - Foto bukti
   - Dibayar ke siapa (paidTo)

4. **`debt_entries`** - Data Piutang & Hutang
   - Tipe (piutang/hutang)
   - Tanggal, nama, jumlah
   - Jatuh tempo, status
   - Tanggal pembayaran

### **Security (RLS Policies):**

✅ **Row Level Security AKTIF** - setiap user hanya bisa akses data mereka sendiri
✅ **Policies dibuat otomatis** - SELECT, INSERT, UPDATE, DELETE
✅ **Data terpisah per user** - User A tidak bisa lihat data User B

### **Indexes untuk Performance:**

✅ **Query cepat** - index pada user_id dan date
✅ **Sorting otomatis** - data terbaru muncul duluan

---

## 🔐 CARA PAKAI SETELAH SETUP

### **1. Register Akun Baru (Mode Supabase)**

1. Buka aplikasi Babadolan
2. Di halaman login, **matikan toggle "Mode Lokal"** (switch ke Mode Supabase)
3. Klik **Daftar Akun Baru**
4. Isi:
   - Nama lengkap
   - Email
   - Password (min 6 karakter)
5. Klik **Daftar**
6. **CEK EMAIL** untuk verifikasi (klik link konfirmasi)
7. Setelah verifikasi, login dengan email & password

### **2. Login di HP**

1. Buka aplikasi Babadolan di HP
2. **Matikan toggle "Mode Lokal"**
3. Login dengan **email & password yang sama**
4. Data otomatis sync dari laptop! ✅

### **3. Auto-Migrate Data dari localStorage**

Aplikasi akan **otomatis migrate** data dari localStorage ke Supabase saat pertama kali login dengan Mode Supabase.

---

## 📊 KEUNTUNGAN MODE SUPABASE

✅ **Multi-device sync** - Data sync otomatis antara laptop, HP, tablet  
✅ **Cloud backup** - Data aman tersimpan di cloud  
✅ **Real-time sync** - Perubahan langsung muncul di semua device  
✅ **Authentication** - Login aman dengan email/password  
✅ **Data isolation** - Setiap user hanya bisa akses data mereka sendiri (RLS)  

---

## ⚙️ MODE LOKAL vs MODE SUPABASE

### **Mode Lokal (localStorage)**
- ✅ Tidak perlu internet
- ✅ Cepat (data di browser)
- ❌ Data hanya di 1 device
- ❌ Tidak ada backup cloud
- ❌ Tidak bisa sync antar device

### **Mode Supabase (Cloud)**
- ✅ Sync antar device (laptop ↔ HP)
- ✅ Backup otomatis di cloud
- ✅ Login dengan email/password
- ⚠️ Perlu internet untuk sync
- ⚠️ Sedikit lebih lambat (API request)

---

## 🔧 TROUBLESHOOTING

### **"Email tidak terverifikasi"**
- Cek inbox email (termasuk folder Spam)
- Klik link verifikasi dari Supabase
- Refresh aplikasi setelah verifikasi

### **"Data tidak muncul di HP"**
- Pastikan login dengan **email & password yang sama**
- Pastikan **Mode Lokal dimatikan** (switch ke Mode Supabase)
- Pastikan ada koneksi internet

### **"Migration tidak jalan"**
- Buka Console Browser (F12)
- Lihat error message
- Pastikan sudah login dengan Mode Supabase

---

## 📞 SUPPORT

Jika ada masalah:
1. Cek Console Browser (F12) untuk error message
2. Screenshot error dan kirim ke developer
3. Pastikan SQL schema sudah di-run dengan benar

---

**✅ Setup selesai! Sekarang aplikasi Babadolan bisa sync antar device!** 🎉