# ⚡ QUICK SETUP - Babadolan Fitur Baru

## 🎯 Tujuan
Mengaktifkan **10 fitur baru** Babadolan (Budget, Invoice, Recurring, Approval, Tax, Bank Recon, User Roles, Audit, Notification, dll).

---

## 📋 LANGKAH SETUP (5 Menit!)

### **Step 1: Buka Supabase Dashboard**
1. Login ke https://supabase.com/dashboard
2. Pilih project Babadolan Anda
3. Klik menu **"SQL Editor"** di sidebar kiri

### **Step 2: Copy SQL Migration**
1. Buka file `supabase-migration.sql` (di root project)
2. Copy **SEMUA** isi file (Ctrl+A → Ctrl+C)

### **Step 3: Run SQL**
1. Paste di SQL Editor Supabase (Ctrl+V)
2. Click tombol **"Run"** (atau tekan Ctrl+Enter)
3. Tunggu sampai muncul: **"Success. Rows: 0"**

### **Step 4: Verify**
Check apakah tabel baru sudah dibuat:
1. Klik menu **"Table Editor"** di sidebar
2. Scroll ke bawah, cari tabel baru:
   - ✅ `budgets`
   - ✅ `invoices`
   - ✅ `customers`
   - ✅ `recurring_transactions`
   - ✅ `notifications`
   - ✅ `approval_rules`
   - ✅ `tax_configs`
   - ✅ `bank_accounts`
   - ✅ `audit_logs`
   - dan 10 tabel lainnya...

### **Step 5: Refresh Aplikasi**
1. Kembali ke aplikasi Babadolan
2. **Hard refresh** browser:
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
3. Login kembali jika perlu

### **Step 6: Explore Fitur Baru! 🎉**
Klik tab-tab baru di navigation bar:
- 💰 **Budget** - Set anggaran per kategori
- 🧾 **Invoice** - Buat invoice profesional
- 🔄 **Recurring** - Auto-transaksi berulang
- ✅ **Approval** - Multi-level approval
- 🏛️ **Pajak** - Tax management PPN/PPh
- 🏦 **Rekonsiliasi** - Bank reconciliation
- 👥 **User Roles** - Permission management
- 📝 **Audit Log** - Track semua perubahan
- 🔔 **Notifikasi** - Real-time alerts

---

## ❓ TROUBLESHOOTING

### **Error: "Could not find the table 'public.notifications'"**
✅ **Solusi:** Anda belum menjalankan migration SQL. Ulangi Step 1-3 di atas.

### **Error saat Run SQL**
✅ **Solusi:**
- Pastikan Anda sudah enable extension UUID: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
- Copy SQL file dengan benar (jangan ada yang kepotong)
- Check Supabase logs untuk detail error

### **Tabel sudah dibuat tapi data tidak muncul**
✅ **Solusi:**
- Hard refresh browser (Ctrl+Shift+R)
- Clear cache browser
- Logout dan login ulang
- Check RLS policies di Supabase (harus allow userId)

### **Fitur lama hilang/error**
✅ **Solusi:**
- Fitur lama tetap berfungsi normal
- Migration SQL tidak mengubah tabel existing
- Jika ada masalah, refresh browser dan coba lagi

---

## 🔒 RLS (Row Level Security)

Migration SQL sudah include basic RLS policies. Jika Anda ingin custom policies:

1. Buka **Authentication** → **Policies** di Supabase
2. Pilih tabel yang ingin di-edit
3. Edit policy sesuai kebutuhan

**Default policy:** User hanya bisa akses data milik sendiri (by `userId`)

---

## 📊 DATABASE SCHEMA

**19 Tabel Baru:**
1. `budgets` - Budget data
2. `recurring_transactions` - Transaksi berulang
3. `recurring_execution_logs` - Log eksekusi
4. `customers` - Customer database
5. `invoices` - Invoice & quotation
6. `invoice_payments` - Payment tracking
7. `approval_rules` - Approval rules
8. `approval_requests` - Pending approvals
9. `approvers` - List approvers
10. `tax_configs` - Tax configuration
11. `tax_transactions` - Tax per transaksi
12. `app_users` - User roles
13. `audit_logs` - Audit trail
14. `notifications` - Notifications
15. `notification_preferences` - User preferences
16. `bank_accounts` - Bank accounts
17. `bank_statements` - Mutasi bank
18. `bank_transactions` - Detail transaksi bank
19. `reconciliation_matches` - Matching results

**Total Columns:** 200+ fields
**Total Indexes:** 40+ indexes untuk performance
**Total Constraints:** 50+ untuk data validation

---

## ✅ VERIFICATION CHECKLIST

Setelah setup, pastikan:

- [x] SQL migration berhasil run tanpa error
- [x] 19 tabel baru muncul di Table Editor
- [x] Aplikasi bisa refresh tanpa error
- [x] Tab-tab baru muncul di navigation bar
- [x] Notification bell muncul di header
- [x] Klik tiap tab baru tidak error (boleh kosong)
- [x] Fitur lama (Dashboard, Transaksi, dll) masih jalan

---

## 🚀 NEXT STEPS

Setelah setup berhasil:

1. **Explore Fitur:**
   - Coba tiap tab baru
   - Baca tooltips dan descriptions
   - Test dengan data dummy

2. **Baca Dokumentasi:**
   - `FITUR-BARU.md` - Penjelasan lengkap tiap fitur
   - `SUMMARY.md` - Overview sistem

3. **Setup Data:**
   - Setup budget untuk bulan ini
   - Add recurring transactions (gaji, sewa, dll)
   - Add customers jika pakai invoice

4. **Customize:**
   - Set approval rules
   - Configure tax rates
   - Setup notification preferences

---

## 💡 TIPS

- **Backup Data:** Export Excel semua transaksi sebelum setup (just in case)
- **Test Mode:** Coba dulu dengan dummy data
- **Gradual Adoption:** Tidak harus pakai semua fitur sekaligus
- **Ask for Help:** Jika stuck, check console errors (F12)

---

## 📞 SUPPORT

**Ada masalah?**
1. Check console browser (F12) untuk error details
2. Check Supabase logs untuk database errors
3. Refer ke dokumentasi lengkap di `FITUR-BARU.md`

---

**🎉 Selamat! Babadolan Anda sekarang Full ERP System!**

Enjoy your new powerful accounting system! 💰📊📈
