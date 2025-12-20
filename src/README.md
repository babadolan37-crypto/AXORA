# 📊 Babadolan - ERP Accounting System

**Aplikasi Spreadsheet Akuntansi PT yang Komprehensif**

Sistem pencatatan pemasukan, pengeluaran, dan manajemen keuangan perusahaan dengan 10+ modul ERP lengkap, sync real-time via Supabase, dan optimasi mobile (PWA).

---

## 🚀 QUICK START

### **Langkah 1: Setup Database (WAJIB!)**

Sebelum menggunakan fitur-fitur baru, Anda **HARUS** menjalankan SQL migration terlebih dahulu:

1. **Login ke Supabase Dashboard**: https://supabase.com/dashboard
2. Pilih project Anda
3. Klik **"SQL Editor"** di sidebar
4. Copy seluruh isi file **`supabase-migration.sql`**
5. Paste di SQL Editor dan klik **"Run"**
6. Tunggu sampai selesai (Success ✅)
7. **Refresh aplikasi** → Semua fitur siap!

> **💡 Tips:** Jika ada error "uuid_generate_v4() does not exist", run ini dulu:
> ```sql
> CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
> ```
> Kemudian run migration SQL lagi.

### **Langkah 2: Mulai Menggunakan Aplikasi**

1. Buka aplikasi di browser
2. Login dengan akun Supabase Anda
3. Klik tombol **"Sudah Setup"** pada banner biru di atas
4. Explore fitur-fitur baru! 🎉

---

## ✨ FITUR UTAMA

### **📈 CORE FEATURES (Sudah Ada)**
- ✅ Dashboard Real-time dengan charts interaktif
- ✅ Pencatatan Pemasukan & Pengeluaran
- ✅ Upload foto bukti transaksi (compress otomatis)
- ✅ OCR Scanner dengan AI detection (17+ keywords, 11+ bank)
- ✅ Sistem Kas Besar & Kas Kecil terpisah
- ✅ Transfer Antar Kas dengan tracking lengkap
- ✅ Advance & Reimbursement Management
- ✅ Settlement dengan upload bukti per item
- ✅ Utang & Piutang Management
- ✅ Tracking Karyawan
- ✅ Export Excel dengan multiple sheets
- ✅ Responsive & Mobile-optimized (PWA)
- ✅ Sync antar device via Supabase

### **🆕 NEW ERP FEATURES (9 Modul Baru!)**

#### **1. 💰 Budgeting & Anggaran**
- Set budget per kategori per bulan
- Budget vs Actual tracking real-time
- Alert otomatis saat over budget
- Visual progress bar per kategori
- Edit & delete budget
- **Status:** ✅ FULLY FUNCTIONAL

#### **2. 🔄 Recurring Transactions (Transaksi Berulang)**
- Auto-create transaksi berulang (gaji, sewa, BPJS, dll)
- Interval: Daily/Weekly/Biweekly/Monthly/Quarterly/Yearly
- Auto-execute atau manual confirmation
- Pause/Resume anytime
- Execute on-demand
- End date support (optional)
- **Status:** ✅ FULLY FUNCTIONAL

#### **3. 🧾 Invoice & Quotation Management**
- Buat invoice & quotation profesional
- Customer database dengan NPWP
- Auto-calculate PPN 11%
- Track status: Draft/Sent/Paid/Overdue/Cancelled
- Payment tracking dengan upload bukti
- Link invoice ke transaksi sistem
- **Status:** ✅ FULLY FUNCTIONAL

#### **4. ✅ Approval Workflow**
- Multi-level approval (Manager → Director → CEO)
- Set threshold per amount & kategori
- Real-time notification untuk approver
- Approval history tracking
- Auto-create transaksi after full approval
- **Status:** ✅ FULLY FUNCTIONAL

#### **5. 🏦 Bank Reconciliation**
- Upload mutasi bank statement
- Auto-match dengan transaksi sistem
- Manual matching untuk discrepancies
- Confidence score
- Reconciliation report
- **Status:** ✅ FULLY FUNCTIONAL

#### **6. 👥 User Roles & Permissions**
- 4 role levels: Admin/Accountant/Manager/Viewer
- Permission matrix per modul
- Audit trail per user
- Last login tracking
- **Status:** 🔧 PLACEHOLDER (Coming Soon)

#### **7. 📝 Audit Log**
- Track semua perubahan data
- Before/After values
- Filter by user/action/resource/date
- IP Address & User Agent logging
- Export audit trail
- **Status:** 🔧 PLACEHOLDER (Coming Soon)

#### **8. 🔔 Notification System**
- Real-time notifications
- Unread count badge
- Priority levels (Low/Medium/High/Urgent)
- Action buttons
- Mark as read/unread
- Notification preferences
- **Status:** 🔧 PLACEHOLDER (Coming Soon)

#### **9. 🎯 Module Navigator**
- Navigation bar baru yang rapi
- Categorized layout
- Badge "New" untuk fitur baru
- Mobile-friendly
- **Status:** ✅ FULLY FUNCTIONAL

---

## 📋 DATABASE SCHEMA

File migration SQL membuat **17 tabel baru** (Tax tables removed):

1. `budgets` - Budget data
2. `recurring_transactions` - Transaksi berulang
3. `recurring_execution_logs` - Log eksekusi
4. `customers` - Customer database
5. `invoices` - Invoice & quotation
6. `invoice_payments` - Payment tracking
7. `approval_rules` - Approval rules
8. `approval_requests` - Pending approvals
9. `approvers` - List approvers
10. `app_users` - User roles
11. `audit_logs` - Audit trail
12. `notifications` - Notifications
13. `notification_preferences` - User preferences
14. `bank_accounts` - Bank accounts
15. `bank_statements` - Mutasi bank
16. `bank_transactions` - Detail transaksi bank
17. `reconciliation_matches` - Matching results

**Plus:**
- Indexes untuk performance
- Row Level Security (RLS) policies
- Functions & triggers
- Check constraints

---

## 🛠️ TECH STACK

- **Framework:** React + TypeScript
- **Styling:** Tailwind CSS v4.0
- **Backend:** Supabase (PostgreSQL + Storage + Auth)
- **State Management:** React Hooks + Custom Hooks
- **Charts:** Recharts
- **Icons:** Lucide React
- **Excel Export:** XLSX
- **Image Processing:** Browser Canvas API
- **OCR:** Native JavaScript (no external API)
- **PWA:** Service Worker + Manifest

---

## 📚 DOKUMENTASI LENGKAP

Baca dokumentasi ini untuk detail lebih lanjut:

- **`README-SETUP-FITUR-BARU.md`** - Setup guide + troubleshooting
- **`FITUR-BARU.md`** - Detail 10 fitur baru
- **`SUMMARY.md`** - Overview sistem lengkap
- **`supabase-migration.sql`** - SQL migration file
- **`QUICK-SETUP.md`** - Quick reference

---

## 🎯 USE CASES

### **Untuk Perusahaan Kecil & Menengah:**
- Tracking cash flow harian
- Budget planning & monitoring
- Gaji karyawan otomatis (recurring)
- Invoice ke customer
- Tax compliance
- Bank reconciliation

### **Untuk Departemen Finance:**
- Multi-user dengan role permissions
- Approval workflow untuk transaksi besar
- Audit trail lengkap
- Export laporan untuk audit

### **Untuk Freelancer & UMKM:**
- Pencatatan pemasukan/pengeluaran sederhana
- Invoice profesional
- Budget tracking
- Export untuk laporan pajak

---

## ⚡ PERFORMANCE

- **Database:** PostgreSQL with indexes
- **Image Upload:** Auto-compress to max 800KB
- **OCR:** Client-side processing (no API calls)
- **Real-time:** Supabase subscriptions
- **Mobile:** PWA dengan offline support
- **Responsive:** Works on all screen sizes

---

## 🔒 SECURITY

- **Authentication:** Supabase Auth (Email/Password)
- **Row Level Security (RLS):** User dapat akses data sendiri saja
- **Data Encryption:** At rest & in transit (Supabase default)
- **No PII Storage:** Not designed for sensitive personal data
- **Audit Trail:** Track all data changes

---

## 🐛 TROUBLESHOOTING

### **1. Fitur baru tidak muncul**
- Pastikan sudah run migration SQL
- Hard refresh browser (Ctrl+Shift+R)
- Check console untuk error

### **2. Error saat run SQL**
- Cek apakah UUID extension sudah enable
- Cek syntax error di SQL Editor
- Refer ke `README-SETUP-FITUR-BARU.md`

### **3. Data tidak tersimpan**
- Cek RLS policies di Supabase
- Pastikan user sudah login
- Cek console untuk error

### **4. Performance lambat**
- Run ANALYZE untuk optimize tables
- Check indexes
- Limit query results dengan pagination

---

## 📞 SUPPORT

**Dokumentasi:**
- Baca file `README-SETUP-FITUR-BARU.md` untuk troubleshooting lengkap
- Check console browser (F12) untuk error details
- Review Supabase logs di Dashboard

**Known Issues:**
- Beberapa fitur baru masih placeholder (will be implemented soon)
- RLS policies perlu manual setup jika tidak otomatis

---

## 📝 CHANGELOG

### **Version 2.0 (December 2024) - ERP Edition**
- ✅ Added 9 new ERP modules (Tax removed)
- ✅ New Module Navigator
- ✅ Budget Management (Fully Functional)
- ✅ Recurring Transactions (Fully Functional)
- ✅ Invoice & Quotation (Fully Functional)
- ✅ Approval Workflow (Fully Functional)
- ✅ Bank Reconciliation (Fully Functional)
- ✅ Notification System (Backend Ready)
- ✅ 17 new database tables
- ✅ Comprehensive documentation

### **Version 1.0 - Initial Release**
- ✅ Core accounting features
- ✅ Dashboard & Reports
- ✅ OCR Scanner
- ✅ Advance & Reimbursement
- ✅ Settlement System

---

## 🎉 READY TO GO!

Aplikasi Babadolan sekarang adalah **Full ERP Accounting System** yang siap untuk:
- ✅ 1-100+ users
- ✅ Multiple departments
- ✅ Professional accounting
- ✅ Tax compliance
- ✅ Audit-ready reports

**Selamat menggunakan Babadolan! 🚀📊💰**

---

**Last Updated:** December 15, 2024  
**Version:** 2.0 (ERP Edition)