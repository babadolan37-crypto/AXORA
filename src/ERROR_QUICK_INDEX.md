# 🔍 Quick Error Index - Babadolan

Temukan solusi cepat untuk error yang Anda alami.

---

## 📱 Error Codes

### PGRST204: "Could not find column"

Kolom di database belum ditambahkan. Pilih error yang sesuai:

#### ❌ "Could not find 'is_inter_cash_transfer' column"
```
Error Code: PGRST204
Affected: cash_transactions table
```
**📖 Solusi Lengkap:** `/FIX_INTER_CASH_TRANSFER_ERROR.md`  
**⚡ Quick Fix:** `/QUICK_FIX_INTER_CASH_TRANSFER.sql`

**Ringkasan:**
1. Buka Supabase SQL Editor
2. Copy & run `/QUICK_FIX_INTER_CASH_TRANSFER.sql`
3. Refresh aplikasi (Ctrl+Shift+R)
4. ✅ Selesai!

---

#### ❌ "Could not find 'cash_type' column"
```
Error Code: PGRST204
Affected: income_entries, expense_entries, cash_transactions
```
**📖 Solusi Lengkap:** `/CARA_PISAHKAN_KAS.md`  
**⚡ Quick Fix:** `/MIGRATION_ADD_CASH_TYPE.sql`

**Ringkasan:**
1. Buka Supabase SQL Editor
2. Copy & run `/MIGRATION_ADD_CASH_TYPE.sql`
3. Refresh aplikasi (Ctrl+Shift+R)
4. ✅ Selesai!

---

#### ❌ "Could not find 'paid_to' or 'paid_by' column"
```
Error Code: PGRST204
Affected: income_entries, expense_entries
```
**📖 Solusi Lengkap:** `/COMPLETE_DATABASE_MIGRATION.sql`  
**⚡ Quick Fix:** `/MIGRATION_ADD_PARTY_FIELDS.sql`

**Ringkasan:**
1. Buka Supabase SQL Editor
2. Copy & run `/MIGRATION_ADD_PARTY_FIELDS.sql`
3. Refresh aplikasi (Ctrl+Shift+R)
4. ✅ Selesai!

---

### PGRST205: "Could not find table"

Tabel database belum dibuat sama sekali.

#### ❌ "Could not find 'cash_transactions' table"
#### ❌ "Could not find 'income_entries' table"
#### ❌ "Could not find 'expense_entries' table"
#### ❌ "Could not find 'advance_payments' table"
```
Error Code: PGRST205
Affected: All tables
```
**📖 Solusi Lengkap:** `/ERROR_FIX_INSTRUCTIONS.md`  
**⚡ Complete Fix:** `/COMPLETE_DATABASE_MIGRATION.sql`

**Ringkasan:**
1. Buka Supabase SQL Editor
2. Copy & run `/COMPLETE_DATABASE_MIGRATION.sql`
3. Refresh aplikasi (Ctrl+Shift+R)
4. ✅ Selesai!

---

## 🔐 Authentication Errors

### ❌ "Email address is invalid"
```
Error: AuthApiError
Message: Email address is invalid
```
**📖 Solusi:** `/SUPABASE_SETUP.md`

**Ringkasan:**
1. Buka Supabase Dashboard → Authentication → Providers
2. Klik "Email"
3. **Matikan** toggle "Confirm email"
4. Save
5. ✅ Selesai!

---

## 💾 Storage Errors

### ❌ "Storage quota exceeded"
```
Error: QuotaExceededError
```
**Penyebab:** Browser storage penuh

**Solusi:**
1. Buka Console (F12)
2. Ketik: `localStorage.clear()`
3. Refresh aplikasi
4. Login ulang
5. ✅ Selesai!

---

## 🔄 Sync Errors

### ❌ "Data tidak sync antar device"
**Kemungkinan penyebab:**
- Login dengan email berbeda
- Tidak ada koneksi internet
- Cache browser bermasalah

**Solusi:**
1. Pastikan login dengan email yang **sama** di semua device
2. Cek koneksi internet
3. Hard refresh (Ctrl+Shift+R)
4. Clear cache browser
5. Logout & login ulang

---

## 📊 Dashboard/UI Errors

### ❌ "Saldo tidak update setelah transaksi"
**Solusi:**
1. Refresh halaman (F5)
2. Cek tab "Pengaturan" → pastikan saldo awal sudah di-set
3. Cek Console (F12) untuk error lain

### ❌ "Tombol tidak bisa di-klik"
**Solusi:**
1. Hard refresh (Ctrl+Shift+R)
2. Clear cache browser
3. Cek Console (F12) untuk JavaScript errors

### ❌ "Upload foto gagal"
**Solusi:**
1. Pastikan ukuran foto < 5MB
2. Pastikan format foto: JPG, PNG, atau WEBP
3. Coba compress foto dulu

---

## 🚀 Quick Setup Checklist

Untuk user baru yang baru setup:

- [ ] **Step 1:** Buat project di Supabase
- [ ] **Step 2:** Copy Supabase URL & Anon Key ke aplikasi
- [ ] **Step 3:** Matikan "Confirm email" di Authentication
- [ ] **Step 4:** Run `/COMPLETE_DATABASE_MIGRATION.sql`
- [ ] **Step 5:** Refresh aplikasi
- [ ] **Step 6:** Set saldo awal di tab Pengaturan
- [ ] **Step 7:** Test tambah transaksi

**📖 Panduan Lengkap:** `/CHECKLIST_SETUP.md`

---

## 📚 Dokumentasi Lengkap

### Setup & Configuration
- `/CHECKLIST_SETUP.md` - Checklist setup lengkap
- `/SUPABASE_SETUP.md` - Setup Supabase step-by-step
- `/DATABASE_SETUP_GUIDE.md` - Panduan setup database
- `/COMPLETE_DATABASE_MIGRATION.sql` - SQL migration lengkap

### Fitur-Fitur
- `/INTER_CASH_TRANSFER_GUIDE.md` - Transfer Antar Kas
- `/CARA_PISAHKAN_KAS.md` - Pemisahan Kas Besar & Kecil
- `/SETTLEMENT_SYSTEM_GUIDE.md` - Settlement & Pengembalian Dana
- `/OCR_FEATURE_DOCS.md` - OCR Scanner
- `/EXPORT_EXCEL_GUIDE.md` - Export to Excel
- `/FITUR_TRACKING_KARYAWAN.md` - Tracking Karyawan

### Migrations
- `/MIGRATION_ADD_INTER_CASH_TRANSFER.sql` - Add inter-cash transfer columns
- `/MIGRATION_ADD_CASH_TYPE.sql` - Add cash type columns
- `/MIGRATION_ADD_PARTY_FIELDS.sql` - Add paid_to/paid_by columns
- `/QUICK_FIX_INTER_CASH_TRANSFER.sql` - Quick fix for PGRST204 (inter-cash)

### Troubleshooting
- `/FIX_INTER_CASH_TRANSFER_ERROR.md` - Fix kolom is_inter_cash_transfer
- `/ERROR_FIX_INSTRUCTIONS.md` - Fix database errors
- `/FIX_TABEL_TIDAK_DITEMUKAN.md` - Fix table not found
- `/CARA_FIX_CEPAT.md` - Quick fixes

---

## 🆘 Masih Butuh Bantuan?

### 1. Cek Console Browser
```
Tekan F12 → Tab "Console"
Screenshot error yang muncul
Cari error code (PGRST204, PGRST205, dll)
```

### 2. Identifikasi Error
```
Lihat error message lengkap
Catat nama tabel atau kolom yang error
Match dengan daftar di atas
```

### 3. Follow Solusi
```
Buka file dokumentasi yang sesuai
Ikuti step-by-step
Jangan skip langkah
```

### 4. Verify Fix
```
Refresh aplikasi (Ctrl+Shift+R)
Test fitur yang error
Cek Console lagi (tidak ada error merah)
```

---

## ✨ Tips Umum

### Setelah Run Migration SQL:
1. **Selalu** hard refresh (Ctrl+Shift+R)
2. **Logout & login ulang** jika perlu
3. **Clear cache** jika masih error

### Sebelum Tanya:
1. Cek Console (F12) untuk error lengkap
2. Coba solusi di dokumentasi dulu
3. Screenshot error + langkah yang sudah dilakukan

### Best Practices:
1. **Backup data** sebelum run migration (export Excel)
2. **Test di satu device** dulu sebelum sync ke semua device
3. **Catat** perubahan yang Anda buat

---

**Last Updated:** 15 Desember 2024  
**Version:** 2.0.0 - Added Inter-Cash Transfer error fixes
