# ⚡ INSTRUKSI SETUP CEPAT - SYNC DATA LAPTOP ↔ HP

## 🎯 **PROBLEM YANG DISELESAIKAN:**
- ❌ Data di laptop tidak muncul di HP
- ❌ Login dengan email/password tidak menyimpan data
- ✅ **SOLUSI**: Setup database Supabase untuk sync antar device

---

## 📝 **STEP 1: RUN SQL DI SUPABASE** (5 menit)

### **1.1 Buka Supabase Dashboard**
- Login ke: https://supabase.com/dashboard
- Pilih project: **tpemoqesoasfsvutjral**

### **1.2 Buka SQL Editor**
- Klik **SQL Editor** (sidebar kiri)
- Klik **+ New Query**

### **1.3 Copy & Run SQL Schema**
Copy **SEMUA** SQL di file `SUPABASE_SETUP.md` (section "Step 2"), lalu:
1. Paste di SQL Editor
2. Klik **Run** (atau tekan Ctrl+Enter)
3. Tunggu sampai muncul "Success"

### **1.4 Verify Tables Created**
- Klik **Table Editor** (sidebar kiri)
- Pastikan ada 4 tables:
  - ✅ `user_settings`
  - ✅ `income_entries`
  - ✅ `expense_entries`
  - ✅ `debt_entries`

---

## 🔐 **STEP 2: REGISTER AKUN SUPABASE** (3 menit)

### **2.1 Di Laptop**

1. Buka aplikasi Babadolan
2. **MATIKAN toggle "Mode Lokal"** ← PENTING!
3. Klik **Daftar Akun Baru**
4. Isi form:
   ```
   Nama    : [Nama Anda]
   Email   : [email@anda.com]
   Password: [min 6 karakter]
   ```
5. Klik **Daftar**
6. **CEK EMAIL** Anda (termasuk folder Spam/Junk)
7. Klik link verifikasi dari Supabase
8. Kembali ke aplikasi dan **Login** dengan email/password

### **2.2 Di HP** 

1. Buka aplikasi Babadolan di HP (browser: Chrome/Safari)
2. **MATIKAN toggle "Mode Lokal"** ← PENTING!
3. Login dengan **email & password yang SAMA**
4. ✅ Data dari laptop otomatis muncul!

---

## 🔄 **STEP 3: MIGRATE DATA DARI LOCALSTORAGE** (Otomatis)

Saat pertama kali login dengan Mode Supabase, aplikasi akan **otomatis migrate** data dari localStorage ke database Supabase.

**Console Log:**
```
Migrating data from localStorage to Supabase...
✅ Migrated 15 income entries
✅ Migrated 42 expense entries
✅ Migrated 3 debt entries
```

---

## ✅ **CARA PAKAI SETELAH SETUP**

### **Mode Lokal** (localStorage)
- **ON** → Data hanya di device ini (tidak sync)
- **OFF** → Data sync antar device via Supabase

### **Di Laptop:**
```
1. Login dengan email/password (Mode Lokal OFF)
2. Tambah transaksi
3. ✅ Data otomatis tersimpan di cloud
```

### **Di HP:**
```
1. Login dengan email/password yang SAMA (Mode Lokal OFF)
2. ✅ Semua data dari laptop langsung muncul!
3. Edit/tambah data → sync balik ke laptop
```

---

## ⚠️ **TROUBLESHOOTING**

### **"Data tidak muncul di HP"**
**Checklist:**
- [ ] Sudah run SQL di Supabase? (Step 1)
- [ ] Sudah verifikasi email? (cek link di inbox)
- [ ] Mode Lokal **OFF** di kedua device?
- [ ] Login dengan email/password yang **SAMA**?
- [ ] Ada koneksi internet?

**Fix:**
- Logout → Clear browser cache → Login ulang
- Buka Console (F12) → cek error message

### **"Email not verified"**
- Cek folder Spam/Junk di email
- Klik link verifikasi dari Supabase
- Tunggu 1-2 menit, refresh halaman

### **"Invalid credentials"**
- Pastikan email & password benar
- Password min 6 karakter
- Reset password jika lupa (tombol "Lupa Password")

---

## 📊 **PERBANDINGAN MODE**

| Fitur | Mode Lokal | Mode Supabase |
|-------|-----------|---------------|
| Sync antar device | ❌ | ✅ |
| Backup cloud | ❌ | ✅ |
| Perlu internet | ❌ | ✅ |
| Kecepatan | ⚡ Cepat | 🔄 Sedang |
| Authentication | ❌ | ✅ Email/Password |
| Data terisolasi per user | ❌ | ✅ |

---

## 🎉 **DONE!**

Setelah setup, Anda bisa:
- ✅ Akses data dari laptop, HP, atau tablet
- ✅ Data otomatis sync real-time
- ✅ Login dengan email/password yang aman
- ✅ Backup otomatis di cloud

**Happy accounting! 📊💰**
