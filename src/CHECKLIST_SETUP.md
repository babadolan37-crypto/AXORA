# ✅ CHECKLIST SETUP SUPABASE - BABADOLAN

Gunakan checklist ini untuk memastikan setup Supabase sudah benar.

---

## 📋 CHECKLIST SETUP DATABASE

### **1. SQL Sudah Di-Run** ⬜

**Cara cek:**
```
✅ Login ke https://supabase.com/dashboard
✅ Klik "SQL Editor"
✅ Copy SQL dari `/COMPLETE_DATABASE_MIGRATION.sql`
✅ Paste ke editor
✅ Klik "RUN"
✅ Tidak ada error merah muncul
```

**Status:** [ ] Belum / [ ] Sudah

---

### **2. Tabel Sudah Dibuat** ⬜

**Cara cek:**
```
✅ Klik "Table Editor" di Supabase Dashboard
✅ Lihat daftar tabel
```

**Harus ada tabel-tabel ini:**
- [ ] `user_settings` ✅
- [ ] `income_entries` ✅
- [ ] `expense_entries` ✅
- [ ] `debt_entries` ✅
- [ ] `cash_transactions` ✅
- [ ] `advance_payments` ✅

**Status:** [ ] Belum semua / [ ] Sudah semua

---

### **2a. Kolom Inter-Cash Transfer Sudah Ada** ⬜

**Cara cek:**
```
✅ Klik tabel "cash_transactions" di Table Editor
✅ Scroll ke kanan, cari kolom:
   - is_inter_cash_transfer (boolean)
   - linked_transaction_id (uuid)
```

**Jika TIDAK ADA:**
- 👉 Buka `/QUICK_FIX_INTER_CASH_TRANSFER.sql`
- 👉 Copy & paste ke SQL Editor
- 👉 Run SQL
- 👉 Refresh aplikasi (Ctrl+Shift+R)

**Baca:** `/FIX_INTER_CASH_TRANSFER_ERROR.md`

**Status:** [ ] Belum / [ ] Sudah

---

### **3. RLS Policies Aktif** ⬜

**Cara cek:**
```
✅ Klik salah satu tabel (misal: income_entries)
✅ Klik tab "Policies"
✅ Harus ada 4 policies:
   - Users can view own income
   - Users can insert own income
   - Users can update own income
   - Users can delete own income
```

**Status:** [ ] Belum / [ ] Sudah

---

## 📱 CHECKLIST APLIKASI

### **4. Bisa Register Akun** ⬜

**Cara test:**
```
✅ Buka aplikasi Babadolan
✅ Klik "Daftar Akun Baru"
✅ Isi email & password
✅ Klik "Daftar"
✅ Tidak ada error
✅ Cek email untuk verifikasi
```

**Status:** [ ] Error / [ ] Berhasil

---

### **5. Bisa Login** ⬜

**Cara test:**
```
✅ Masukkan email & password
✅ Klik "Login"
✅ Berhasil masuk ke dashboard
✅ Tidak ada error di console (F12)
```

**Status:** [ ] Error / [ ] Berhasil

---

### **6. Bisa Tambah Pemasukan** ⬜

**Cara test:**
```
✅ Klik tab "Transaksi"
✅ Klik "Tambah Pemasukan"
✅ Isi semua field:
   - Tanggal: [pilih tanggal]
   - Sumber: Penjualan Produk
   - Jumlah: 1000000
   - Metode: Tunai
   - Deskripsi: Test pemasukan
   - Siapa yang Bayar: Customer A
✅ Klik "Simpan"
✅ Muncul alert: "✅ Pemasukan berhasil ditambahkan!"
✅ Data muncul di tabel
```

**Status:** [ ] Error / [ ] Berhasil

---

### **7. Bisa Tambah Pengeluaran** ⬜

**Cara test:**
```
✅ Klik "Tambah Pengeluaran"
✅ Isi semua field:
   - Tanggal: [pilih tanggal]
   - Kategori: Gaji Karyawan
   - Jumlah: 5000000
   - Metode: Transfer Bank
   - Deskripsi: Test pengeluaran
   - Dibayar ke Siapa: Karyawan A
✅ Klik "Simpan"
✅ Muncul alert: "✅ Pengeluaran berhasil ditambahkan!"
✅ Data muncul di tabel
```

**Status:** [ ] Error / [ ] Berhasil

---

### **8. Data Tersimpan di Supabase** ⬜

**Cara cek:**
```
✅ Buka Supabase Dashboard
✅ Klik "Table Editor"
✅ Klik tabel "income_entries"
✅ Lihat data yang baru ditambahkan
✅ Data harus muncul di sini
```

**Status:** [ ] Tidak muncul / [ ] Muncul

---

### **9. Data Sync Antar Device** ⬜

**Cara test:**
```
✅ Tambah data di laptop
✅ Buka aplikasi di HP
✅ Login dengan email & password yang sama
✅ Data yang ditambahkan di laptop muncul di HP
```

**Status:** [ ] Tidak sync / [ ] Sync berhasil

---

## 🔧 JIKA ADA YANG GAGAL:

### **Tabel tidak dibuat** ❌
```
👉 Ulangi Langkah 1: Run SQL lagi
👉 Pastikan tidak ada error merah
👉 Refresh halaman Table Editor
```

### **Tidak bisa register** ❌
```
👉 Buka Console Browser (F12)
👉 Lihat error message
👉 Jika "Email confirmation required":
   - Buka Supabase → Authentication → Providers → Email
   - Matikan "Confirm email"
   - Save
```

### **Tidak bisa tambah data** ❌
```
👉 Cek error di Console (F12)
👉 Jika "Could not find table":
   - Tabel belum dibuat
   - Run SQL dari `/SUPABASE_CREATE_TABLES.sql`
👉 Jika "permission denied":
   - RLS policies belum aktif
   - Run SQL lagi (policies akan dibuat ulang)
```

### **Data tidak sync** ❌
```
👉 Pastikan login dengan email yang sama di kedua device
👉 Pastikan ada koneksi internet
👉 Cek Console (F12) untuk error
👉 Refresh browser (F5)
```

---

## ✅ SEMUA SUDAH BERHASIL?

Jika semua checklist di atas ✅, maka setup Supabase **BERHASIL!**

**Sekarang Anda bisa:**
- ✅ Tambah pemasukan & pengeluaran
- ✅ Data tersimpan di cloud
- ✅ Sync otomatis antar device
- ✅ Login dengan email/password
- ✅ Data aman dengan RLS

---

## 📊 RECAP AKHIR:

```
SETUP SUPABASE: [ ] Belum / [ ] Sudah
├── SQL di-run: [ ]
├── 4 tabel dibuat: [ ]
├── RLS policies aktif: [ ]
└── Indexes dibuat: [ ]

TESTING APLIKASI: [ ] Belum / [ ] Sudah
├── Register: [ ]
├── Login: [ ]
├── Tambah pemasukan: [ ]
├── Tambah pengeluaran: [ ]
├── Data tersimpan: [ ]
└── Sync antar device: [ ]
```

---

## 🆘 BUTUH BANTUAN?

**📖 Baca panduan:**
- Quick fix: `/CARA_FIX_CEPAT.md`
- Panduan detail: `/FIX_TABEL_TIDAK_DITEMUKAN.md`
- Setup lengkap: `/SUPABASE_SETUP.md`

**🐛 Debug:**
- Buka Console Browser (F12)
- Screenshot error
- Cek mana step yang gagal di checklist ini

---

**🎉 SELAMAT! Setup Babadolan dengan Supabase berhasil!** ✨