# ⚠️ Error PGRST204/PGRST205: Database Errors

## ✅ SOLUSI CEPAT (5 MENIT)

Error ini **NORMAL** untuk user baru atau setelah update fitur. Artinya **database Supabase belum lengkap**.

### 🔍 Identifikasi Error:

#### **Error PGRST205: "Could not find table"**
- ❌ Tabel database belum dibuat sama sekali
- 👉 **Solusi:** Run `/COMPLETE_DATABASE_MIGRATION.sql`

#### **Error PGRST204: "Could not find column"**
- ❌ Tabel ada, tapi kolom tertentu belum ditambahkan
- 👉 **Solusi:** Run migration SQL untuk kolom yang hilang

**Contoh:**
```
"Could not find 'is_inter_cash_transfer' column"
→ Run /QUICK_FIX_INTER_CASH_TRANSFER.sql
```

### 🚀 2 Cara Fix:

---

## **CARA 1: Pakai Popup Guide (TERMUDAH!)** ⭐

1. **Popup sudah muncul otomatis** dengan judul "⚠️ Database Belum Di-Setup!"
2. **Klik tombol "Copy SQL"** di popup (atau manual Ctrl+A → Ctrl+C di kotak SQL)
3. **Klik "Buka Supabase Sekarang"** di popup
4. Di Supabase: **SQL Editor** → **+ New Query**
5. **Paste SQL** (Ctrl+V) → **Klik RUN**
6. **Refresh aplikasi** (tekan F5)
7. ✅ **SELESAI!** Error hilang, data bisa tersimpan!

---

## **CARA 2: Manual dari File**

Jika popup tidak muncul, ikuti langkah ini:

### **Langkah 1: Copy SQL Migration**

**Pilih SQL yang sesuai dengan error:**

- ❌ **Error PGRST205** ("table not found") → Copy `/COMPLETE_DATABASE_MIGRATION.sql`
- ❌ **Error PGRST204** ("column not found: is_inter_cash_transfer") → Copy `/QUICK_FIX_INTER_CASH_TRANSFER.sql`
- ❌ **Error PGRST204** ("column not found: cash_type") → Copy `/MIGRATION_ADD_CASH_TYPE.sql`
- ❌ **Error PGRST204** ("column not found: advance_payments") → Copy `/COMPLETE_DATABASE_MIGRATION.sql`

### **Langkah 2: Buka Supabase Dashboard**
- Kunjungi: https://supabase.com/dashboard
- Login → Pilih project Anda

### **Langkah 3: Run SQL**
- Di sidebar kiri, klik **"SQL Editor"** (icon petir ⚡)
- Klik **"+ New Query"**
- **Paste SQL** yang sudah di-copy (Ctrl+V)
- Klik tombol **"RUN"** di pojok kanan bawah
- Tunggu 2-3 detik sampai selesai (muncul pesan sukses)

### **Langkah 4: Verify Tabel Dibuat**
- Klik **"Table Editor"** di sidebar kiri
- Pastikan 4 tabel muncul:
  - ✅ `user_settings`
  - ✅ `income_entries`
  - ✅ `expense_entries`
  - ✅ `debt_entries`

### **Langkah 5: Refresh & Test**
- Kembali ke aplikasi Babadolan
- Tekan **F5** untuk refresh browser
- Coba tambah pemasukan/pengeluaran
- ✅ **BERHASIL!** Data tersimpan!

---

## 🎯 Kenapa Error Ini Muncul?

### Error PGRST205 - "Table Not Found"
Artinya: **"Tabel tidak ditemukan di database"**

Ini terjadi karena:
1. ✅ Supabase sudah terconnect dengan benar
2. ❌ Tapi tabel database belum dibuat
3. ✅ Aplikasi mencoba akses tabel yang belum ada
4. ❌ Error muncul

**Solusi:** Jalankan SQL migration sekali untuk create tabel.

### Error PGRST204 - "Column Not Found"
Artinya: **"Kolom tidak ditemukan di tabel"**

Ini terjadi karena:
1. ✅ Tabel database sudah ada
2. ✅ Aplikasi sudah update dengan fitur baru
3. ❌ Tapi kolom baru belum ditambahkan ke database
4. ❌ Error muncul

**Solusi:** Jalankan migration SQL untuk menambahkan kolom yang hilang.

---

## 📋 Apa yang Dibuat oleh SQL Migration?

### Complete Database Migration (`/COMPLETE_DATABASE_MIGRATION.sql`)
SQL migration akan membuat:

1. **6+ Tabel Database:**
   - `user_settings` - Pengaturan user
   - `income_entries` - Data pemasukan
   - `expense_entries` - Data pengeluaran  
   - `debt_entries` - Data utang & piutang
   - `cash_transactions` - Transaksi kas
   - `advance_payments` - Advance & reimbursement

2. **Row Level Security (RLS):**
   - Setiap user hanya bisa akses data mereka sendiri
   - Data aman & terpisah per user

3. **20+ Policies:**
   - Users bisa SELECT, INSERT, UPDATE, DELETE data sendiri
   - Tidak bisa akses data user lain

4. **Indexes:**
   - Query cepat untuk performa optimal

### Inter-Cash Transfer Migration (`/QUICK_FIX_INTER_CASH_TRANSFER.sql`)
Menambahkan:
- Kolom `is_inter_cash_transfer` (BOOLEAN)
- Kolom `linked_transaction_id` (UUID)
- Index untuk performa
- Comments untuk dokumentasi

### Cash Type Migration (`/MIGRATION_ADD_CASH_TYPE.sql`)
Menambahkan:
- Kolom `cash_type` di `income_entries`
- Kolom `cash_type` di `expense_entries`
- Kolom `cash_type` di `cash_transactions`

---

## ❓ Troubleshooting

### Error PGRST204: "Could not find 'is_inter_cash_transfer' column"?
**Solusi:** 
1. Buka `/FIX_INTER_CASH_TRANSFER_ERROR.md`
2. Copy SQL dari `/QUICK_FIX_INTER_CASH_TRANSFER.sql`
3. Run di Supabase SQL Editor
4. Refresh aplikasi (Ctrl+Shift+R)

### Error masih muncul setelah run SQL?
**Solusi:** Refresh browser dengan **Ctrl+Shift+R** (hard refresh)

### Tombol "Copy SQL" tidak bekerja?
**Solusi:** 
- Klik di kotak SQL di popup
- Tekan **Ctrl+A** (pilih semua)
- Tekan **Ctrl+C** (copy)

### SQL sudah di-run tapi tabel tidak muncul di Table Editor?
**Solusi:** 
- Refresh Supabase Dashboard (F5)
- Pastikan Anda run SQL di **project yang benar** (cek nama project di header)

### Popup setup guide tidak muncul?
**Solusi:** 
- Coba tambah pemasukan/pengeluaran sekali lagi
- Atau buka console browser (F12) dan lihat error message
- Atau langsung ikuti Cara 2 (manual)

---

## 🎉 Setup Hanya 1x!

**PENTING:** Setup ini **hanya perlu dilakukan 1 kali saja**. 

Setelah tabel dibuat:
- ✅ Data otomatis sync antar device
- ✅ Data tersimpan permanen di Supabase
- ✅ Tidak perlu setup ulang lagi
- ✅ Error PGRST205 tidak akan muncul lagi

---

## 📞 Masih Butuh Bantuan?

Jika masih ada masalah:
1. Baca file `/SETUP_DATABASE.md` untuk panduan lengkap
2. Baca file `/FIX_TABEL_TIDAK_DITEMUKAN.md` untuk troubleshooting detail
3. Check console browser (F12) untuk error message lengkap

**Selamat menggunakan Babadolan! 🎉**

---

## 📊 Status Check

Untuk memastikan setup berhasil:

```
✅ Supabase connected (tidak ada error connection)
✅ Login berhasil (muncul halaman utama)
✅ Popup/Banner setup muncul (normal untuk user baru)
✅ SQL migration di-run di Supabase
✅ 4 tabel muncul di Table Editor
✅ Aplikasi di-refresh (F5)
✅ Coba tambah data → BERHASIL!
```

Jika semua step di atas completed, error PGRST205 akan hilang selamanya! 🎊