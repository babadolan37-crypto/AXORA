# 🚀 Setup Fitur Baru Babadolan (10 Modul ERP)

## ⚡ QUICK START (5 Menit!)

Ikuti langkah-langkah ini untuk mengaktifkan **10 fitur baru** yang sudah dibuat:

---

## 📋 STEP-BY-STEP SETUP

### **Step 1: Buka Supabase Dashboard**
1. Buka browser, pergi ke: **https://supabase.com/dashboard**
2. Login dengan akun Supabase Anda
3. Pilih project **Babadolan** Anda dari daftar

### **Step 2: Masuk ke SQL Editor**
1. Di sidebar kiri, klik **"SQL Editor"**
2. Klik tombol **"New Query"** (atau gunakan query kosong yang sudah ada)

### **Step 3: Copy File SQL**
Ada 2 cara:

**Cara A (Recommended):**
1. Di project folder, buka file: `/supabase-migration.sql`
2. Tekan `Ctrl+A` (select all) → `Ctrl+C` (copy)

**Cara B (Alternatif):**
1. Buka file `/supabase-migration.sql` di code editor
2. Copy seluruh isinya (total ~427 baris)

### **Step 4: Paste & Run**
1. Paste di SQL Editor Supabase (`Ctrl+V`)
2. Klik tombol **"Run"** (atau tekan `Ctrl+Enter`)
3. Tunggu proses selesai (biasanya 5-10 detik)

### **Step 5: Verify Success**
Setelah run berhasil, Anda akan melihat:
```
Success. No rows returned
```

Atau bisa juga:
```
Success. Rows: 0
```

**Cek Tabel Baru:**
1. Klik menu **"Table Editor"** di sidebar
2. Scroll ke bawah, pastikan tabel-tabel ini sudah ada:
   - ✅ `budgets`
   - ✅ `recurring_transactions`
   - ✅ `invoices`
   - ✅ `customers`
   - ✅ `notifications`
   - ✅ `approval_rules`
   - ✅ `tax_configs`
   - ✅ `bank_accounts`
   - ✅ `audit_logs`
   - dan 10 tabel lainnya (total 19 tabel)

### **Step 6: Refresh Aplikasi**
1. Kembali ke aplikasi Babadolan
2. **Hard refresh** browser:
   - **Windows/Linux:** `Ctrl + Shift + R`
   - **Mac:** `Cmd + Shift + R`
3. Atau clear cache browser dan reload

### **Step 7: Dismiss Banner & Enjoy!**
1. Di bagian atas aplikasi, akan ada banner biru/ungu
2. Klik tombol **"Sudah Setup"** atau **"X"** untuk menutup banner
3. Explore fitur-fitur baru! 🎉

---

## ✅ VERIFICATION CHECKLIST

Pastikan semua ini DONE:

- [ ] ✅ SQL migration berhasil run tanpa error
- [ ] ✅ 19 tabel baru muncul di Table Editor Supabase
- [ ] ✅ Aplikasi sudah di-refresh (hard refresh)
- [ ] ✅ Banner setup sudah di-dismiss
- [ ] ✅ Console browser tidak ada error merah
- [ ] ✅ Tab-tab baru muncul di navigation bar:
  - Budget
  - Invoice
  - Recurring
  - Approval
  - Pajak
  - Rekonsiliasi
  - User Roles
  - Audit Log
  - Notifikasi (bell icon di header)
- [ ] ✅ Klik tiap tab baru tidak ada error (boleh kosong/empty state)
- [ ] ✅ Fitur lama masih berfungsi normal:
  - Dashboard
  - Transaksi
  - Utang & Piutang
  - Advance & Reimbursement
  - Settings

---

## 🎯 APA YANG BARU?

Setelah setup berhasil, Anda akan punya:

### **1. 💰 BUDGETING**
- Set budget per kategori per bulan
- Budget vs Actual tracking real-time
- Alert otomatis over budget
- Visual progress bar

### **2. 🧾 INVOICE & QUOTATION**
- Buat invoice profesional
- Customer database dengan NPWP
- Track status: Draft/Sent/Paid/Overdue
- Auto-calculate PPN 11%

### **3. 🔄 RECURRING TRANSACTIONS**
- Auto-create transaksi berulang (gaji, sewa, dll)
- Interval: Daily/Weekly/Monthly/Quarterly/Yearly
- Auto-execute atau manual

### **4. ✅ APPROVAL WORKFLOW**
- Multi-level approval (Manager/Director/CEO)
- Set threshold per amount
- Notification untuk approver

### **5. 🏛️ TAX MANAGEMENT**
- PPN, PPh 21, PPh 23, PPh 4-2, PPh Final
- Auto-calculate tax
- Tax report per periode

### **6. 🏦 BANK RECONCILIATION**
- Upload mutasi bank
- Auto-match dengan transaksi sistem
- Highlight discrepancies

### **7. 👥 USER ROLES & PERMISSIONS**
- 4 role levels: Admin/Accountant/Manager/Viewer
- Permission matrix lengkap

### **8. 📝 AUDIT LOG**
- Track semua perubahan data
- Before/After values
- Filter by user/action/date

### **9. 🔔 NOTIFICATION SYSTEM**
- Real-time notifications
- Unread count badge
- Priority levels

### **10. 🎯 MODULE NAVIGATOR**
- Navigation bar baru yang rapi
- Badge "New" untuk fitur baru
- Categorized layout

---

## ❓ TROUBLESHOOTING

### **1. Error saat Run SQL: "uuid_generate_v4() does not exist"**

**Solusi:**
```sql
-- Run ini DULU sebelum migration:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

Kemudian run migration SQL seperti biasa.

---

### **2. Error: "relation already exists"**

**Solusi:**
Tabel sudah ada sebelumnya. Ada 2 pilihan:

**A. Skip error (aman):**
- Error ini normal jika Anda run SQL lebih dari 1x
- Tabel yang sudah ada akan di-skip
- Lanjutkan saja, fitur tetap jalan

**B. Drop & recreate (hati-hati!):**
```sql
-- HATI-HATI: Ini akan HAPUS semua data di tabel baru!
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS recurring_transactions CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
-- ... (drop semua 19 tabel)

-- Lalu run migration SQL lagi
```

---

### **3. Console warning: "Notifications table not found"**

**Status:** Warning ini NORMAL sebelum setup!

**Solusi:**
- Ini bukan error, hanya warning
- Akan hilang otomatis setelah Anda run migration SQL
- Fitur lama tetap berfungsi normal

**Jika warning masih muncul setelah setup:**
1. Pastikan migration SQL benar-benar berhasil (cek di Table Editor)
2. Hard refresh browser (Ctrl+Shift+R)
3. Clear browser cache
4. Logout dan login ulang

---

### **4. Banner setup tidak muncul**

**Solusi:**
- Banner hanya muncul 1x (sampai user dismiss)
- Jika sudah di-dismiss, tidak akan muncul lagi
- Untuk show lagi: Buka DevTools Console (F12), ketik:
```javascript
localStorage.removeItem('newFeaturesNoticeDismissed');
location.reload();
```

---

### **5. Fitur baru tidak muncul di navigation bar**

**Solusi:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear cache:
   - Chrome: Ctrl+Shift+Delete → Clear browsing data
   - Firefox: Ctrl+Shift+Delete → Clear recent history
3. Cek console browser (F12) untuk error messages
4. Pastikan tidak ada JavaScript errors

---

### **6. Tabel sudah ada tapi data tidak bisa di-create**

**Penyebab:** RLS (Row Level Security) policies belum benar

**Solusi:**
1. Buka Supabase Dashboard → **Authentication** → **Policies**
2. Pilih salah satu tabel baru (misal: `budgets`)
3. Pastikan ada 4 policies:
   - ✅ SELECT (Users can view their own)
   - ✅ INSERT (Users can insert their own)
   - ✅ UPDATE (Users can update their own)
   - ✅ DELETE (Users can delete their own)

**Jika policies belum ada, run SQL ini:**
```sql
-- Contoh untuk tabel budgets
CREATE POLICY "Users can view their own budgets" 
  ON budgets FOR SELECT 
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert their own budgets" 
  ON budgets FOR INSERT 
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update their own budgets" 
  ON budgets FOR UPDATE 
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete their own budgets" 
  ON budgets FOR DELETE 
  USING (auth.uid()::text = "userId");
```

Ulangi untuk 18 tabel lainnya (ganti `budgets` dengan nama tabel lain).

---

### **7. Error 403: "new row violates row-level security policy"**

**Penyebab:** RLS policies terlalu ketat atau tidak match dengan userId

**Solusi:**
1. Check apakah `auth.uid()` sesuai dengan `userId` di data
2. Pastikan user sudah login (ada session)
3. Temporary disable RLS untuk testing:
```sql
-- HATI-HATI: Hanya untuk testing!
ALTER TABLE budgets DISABLE ROW LEVEL SECURITY;
-- ... disable untuk tabel lain juga
```

Setelah testing selesai, ENABLE kembali:
```sql
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
```

---

### **8. Performance lambat setelah migration**

**Solusi:**
Migration SQL sudah include indexes, tapi jika tetap lambat:

```sql
-- Analyze tables untuk optimize
ANALYZE budgets;
ANALYZE recurring_transactions;
ANALYZE invoices;
-- ... analyze semua tabel baru
```

---

## 📚 DOKUMENTASI LENGKAP

Setelah setup berhasil, baca dokumentasi ini:

1. **`FITUR-BARU.md`** - Penjelasan lengkap tiap fitur + cara pakai
2. **`SUMMARY.md`** - Overview sistem & use cases
3. **`QUICK-SETUP.md`** - Panduan setup (file ini)
4. **`supabase-migration.sql`** - SQL migration file

---

## 🎉 SELESAI!

Jika semua langkah sudah selesai, Babadolan Anda sekarang adalah:

✅ **Full ERP Accounting System**
✅ **10+ Modul Baru**
✅ **19 Tabel Database**
✅ **Production Ready**
✅ **Siap untuk 1-100+ users**

**Selamat! Enjoy your powerful accounting system!** 💪📊💰

---

## 💬 NEED HELP?

**Masih stuck?**
1. Cek console browser (F12) untuk error details
2. Cek Supabase logs: Dashboard → Logs → Postgres
3. Refer ke dokumentasi lengkap di folder `/`
4. Contact developer

---

**Last Updated:** December 2024
**Version:** 2.0 (ERP Edition)
