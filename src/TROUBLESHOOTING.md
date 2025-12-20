# Troubleshooting: Error "Cash transactions table not found"

## 🔍 Diagnosa Masalah

Error ini terjadi karena **tabel `cash_transactions` belum dibuat di database Supabase Anda**.

---

## ✅ Solusi (Pilih Salah Satu)

### **Opsi 1: Lewat Modal di Aplikasi (RECOMMENDED)**

1. **Refresh browser** (F5) → Modal otomatis muncul
2. Pilih tab **"1. Verify (Cek Status)"**
3. Klik **"Copy SQL Script"**
4. Klik **"Buka Supabase SQL Editor"**
5. Paste script di SQL Editor → **Run**
6. Lihat hasilnya:
   - **Jika `table_exists = FALSE`** → Lanjut ke langkah 7
   - **Jika `table_exists = TRUE`** → Tabel sudah ada, refresh browser
7. Kembali ke modal, pilih tab **"2. Create (Buat Tabel)"**
8. Klik **"Copy SQL Script"**
9. Paste di SQL Editor → **Run**
10. Klik **"Sudah Selesai, Refresh"**

---

### **Opsi 2: Langsung Buat Tabel (Quick Fix)**

1. Buka file **`/CREATE_CASH_TABLES_SIMPLE.sql`**
2. Copy **semua isinya**
3. Buka **Supabase Dashboard** → SQL Editor
4. Paste & **Run** (Ctrl+Enter)
5. Tunggu sampai muncul hasil:
   ```
   table_name          | row_count
   --------------------|----------
   cash_transactions   | 0
   cash_balances       | 0
   ```
6. **Refresh browser** (F5)

---

### **Opsi 3: Manual Setup via Settings**

1. Buka aplikasi
2. Klik tab **"Pengaturan"**
3. Lihat box merah di atas: **"Setup Database Kas"**
4. Klik tombol **"Setup Database Kas"**
5. Ikuti instruksi di modal

---

## 📋 Cek Apakah Sudah Berhasil

Setelah menjalankan SQL, lakukan pengecekan:

### **1. Cek di Supabase Dashboard**
```
Table Editor → Cari tabel:
✅ cash_transactions
✅ cash_balances
```

### **2. Cek di Aplikasi**
```
✅ Error "Cash transactions table not found" HILANG
✅ Saldo Kas Besar & Kas Kecil muncul di Dashboard
✅ Dropdown "Kas Besar/Kecil" muncul di form transaksi
```

### **3. Test Transaksi**
```
1. Buka tab "Transaksi"
2. Tambah pengeluaran Rp 50,000 dari Kas Kecil
3. Kembali ke Dashboard
4. Saldo Kas Kecil harus berkurang Rp 50,000
```

---

## ❌ Jika Masih Error

### **Kemungkinan 1: SQL Script Tidak Berhasil Dijalankan**

**Cek error message di Supabase SQL Editor**

Kemungkinan error:
- **Permission denied** → RLS policy bermasalah
- **Syntax error** → Copy-paste tidak lengkap
- **Constraint violation** → Tabel sudah ada tapi struktur berbeda

**Solusi:**
1. Buka **`/CREATE_CASH_TABLES_SIMPLE.sql`**
2. Uncomment baris 8-9:
   ```sql
   DROP TABLE IF EXISTS cash_transactions CASCADE;
   DROP TABLE IF EXISTS cash_balances CASCADE;
   ```
3. Run ulang SQL script (ini akan **HAPUS DATA LAMA**)
4. Refresh browser

---

### **Kemungkinan 2: Browser Cache**

**Solusi:**
1. Hard refresh: **Ctrl+Shift+R** (Windows/Linux) atau **Cmd+Shift+R** (Mac)
2. Atau clear browser cache & reload

---

### **Kemungkinan 3: Supabase Project Salah**

**Pastikan:**
1. Anda login ke **project Supabase yang benar**
2. `.env` atau environment variables sudah benar:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Project Supabase tidak dalam status paused

---

## 📞 Butuh Bantuan Lebih Lanjut?

Jika masih error setelah mencoba semua langkah di atas:

1. **Screenshot error message** di Supabase SQL Editor
2. **Screenshot console log** di browser (F12 → Console)
3. **Kirim info:**
   - Error message lengkap
   - Langkah yang sudah dicoba
   - Screenshot hasil query `/VERIFY_TABLES.sql`

---

## ✅ Checklist Lengkap

- [ ] SQL script sudah di-copy dengan benar (tidak terpotong)
- [ ] SQL Editor di Supabase sudah dibuka
- [ ] Script sudah di-paste dan di-run (Ctrl+Enter)
- [ ] Tidak ada error message di SQL Editor
- [ ] Tabel `cash_transactions` dan `cash_balances` sudah ada di Table Editor
- [ ] Browser sudah di-refresh (F5 atau Ctrl+R)
- [ ] Error "Cash transactions table not found" sudah hilang
- [ ] Saldo kas sudah muncul di Dashboard
- [ ] Test transaksi berhasil (saldo berubah)

**Jika semua checklist ✅, setup berhasil!** 🎉
