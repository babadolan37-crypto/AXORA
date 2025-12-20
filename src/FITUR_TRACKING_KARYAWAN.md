# 📊 FITUR TRACKING KARYAWAN & ANALYTICS

## 🎯 OVERVIEW

Fitur baru untuk **tracking siapa yang nerima (pemasukan)** dan **pengeluaran dibayarkan ke siapa**, dengan fokus khusus pada **manajemen karyawan** dan **analytics pengeluaran**.

---

## ✨ FITUR UTAMA

### 1️⃣ **Tracking "Diterima dari" (Pemasukan)**
- Field baru: **"Diterima dari"** (opsional)
- Untuk mencatat siapa yang membayar/memberikan pemasukan
- Contoh: "PT. Maju Jaya", "Klien ABC", "Customer XYZ"

### 2️⃣ **Tracking "Dibayarkan kepada" (Pengeluaran)**
- Field baru: **"Dibayarkan kepada"** (opsional)
- Untuk mencatat ke siapa/untuk apa pengeluaran
- Contoh: "Supplier A", "Vendor B", "Toko C"

### 3️⃣ **Manajemen Karyawan**
- Daftar karyawan bisa di-manage di menu **Pengaturan**
- Tambah/hapus nama karyawan dengan mudah
- Data tersimpan di Supabase dan localStorage

### 4️⃣ **Smart Input untuk Gaji Karyawan**
- Jika kategori pengeluaran = **"Gaji Karyawan"**, field "Dibayarkan kepada" berubah jadi **"Nama Karyawan"**
- Tampilkan **dropdown** dengan daftar karyawan yang sudah didaftarkan
- Jika belum ada karyawan, tampilkan input manual + tip untuk mendaftar karyawan

### 5️⃣ **Analytics Dashboard**
- 🔥 **Top 5 Kategori Pengeluaran Terbanyak**
  - Ranking kategori dengan nominal terbesar
  - Persentase dari total pengeluaran
  - Visual card dengan badge ranking

- 👨‍💼 **Top 5 Karyawan dengan Gaji Terbanyak**
  - Ranking karyawan berdasarkan total gaji yang diterima
  - Persentase dari total gaji keseluruhan
  - Visual card dengan badge ranking
  - Auto-calculated dari transaksi kategori "Gaji Karyawan"

---

## 🗄️ DATABASE SCHEMA

### **Tabel: income_entries**
```sql
CREATE TABLE income_entries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  date DATE NOT NULL,
  source TEXT NOT NULL,
  description TEXT,
  amount BIGINT NOT NULL,
  payment_method TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  received_from TEXT,  -- 👈 FIELD BARU
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Tabel: expense_entries**
```sql
CREATE TABLE expense_entries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  amount BIGINT NOT NULL,
  payment_method TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  paid_to TEXT,  -- 👈 FIELD BARU
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Tabel: user_settings**
```sql
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  income_sources JSONB DEFAULT '[...]'::jsonb,
  expense_categories JSONB DEFAULT '[...]'::jsonb,
  payment_methods JSONB DEFAULT '[...]'::jsonb,
  employees JSONB DEFAULT '[]'::jsonb,  -- 👈 FIELD BARU
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 📂 FILES MODIFIED/CREATED

### **1. Types & Interfaces**
- ✅ `/types/accounting.ts` - Added `receivedFrom` and `paidTo` fields
- ✅ `/types/index.ts` - Updated for Supabase compatibility

### **2. Database**
- ✅ `/SUPABASE_SETUP.md` - Updated schema dengan field baru
- ✅ `/MIGRATION_ADD_PARTY_FIELDS.sql` - Migration SQL untuk database existing

### **3. Components**
- ✅ `/components/TransactionSheet.tsx` 
  - Added "Diterima dari" input field (income)
  - Added "Dibayarkan kepada" / "Nama Karyawan" input field (expense)
  - Smart dropdown untuk kategori "Gaji Karyawan"
  - Tip notification jika belum ada karyawan terdaftar

- ✅ `/components/SettingsSheet.tsx`
  - Added **Karyawan** management section
  - Tambah/hapus karyawan dengan form sederhana
  - Icon Users dari lucide-react

- ✅ `/components/SummarySheet.tsx`
  - Added analytics section dengan 2 cards:
    - Top 5 Kategori Pengeluaran Terbanyak
    - Top 5 Karyawan dengan Gaji Terbanyak
  - Auto-calculate dari filtered expense entries
  - Responsive grid layout (2 columns on desktop, 1 column on mobile)

### **4. Hooks**
- ✅ `/hooks/useSupabaseData.ts`
  - Added `employees` state
  - Added `loadEmployees()` function
  - Added `saveEmployees()` function
  - Updated CRUD operations untuk include `receivedFrom` dan `paidTo`
  - Support localStorage dan Supabase

### **5. App**
- ✅ `/App.tsx`
  - Pass `employees` dan `saveEmployees` props ke components
  - Pass `expenseCategories` dan `employees` ke SummarySheet

### **6. Documentation**
- ✅ `/FITUR_TRACKING_KARYAWAN.md` (this file)

---

## 🚀 CARA PAKAI

### **Setup Database Baru**
1. Jalankan SQL dari `/SUPABASE_SETUP.md` 
2. Field `employees`, `received_from`, dan `paid_to` sudah ter-include otomatis

### **Migrasi Database Existing**
1. Buka **Supabase SQL Editor**
2. Copy-paste SQL dari `/MIGRATION_ADD_PARTY_FIELDS.sql`
3. Execute SQL
4. Done! Field baru sudah ditambahkan

### **Mendaftarkan Karyawan**
1. Buka menu **Pengaturan**
2. Scroll ke section **"Karyawan"**
3. Input nama karyawan di form
4. Klik tombol **"Tambah"**
5. Karyawan tersimpan dan bisa langsung digunakan

### **Input Gaji Karyawan**
1. Buka menu **Transaksi**
2. Pilih tab **"Pengeluaran"**
3. Klik **"Tambah Pengeluaran"**
4. Pilih kategori: **"Gaji Karyawan"**
5. Field "Dibayarkan kepada" otomatis berubah jadi **"Nama Karyawan"**
6. Pilih karyawan dari dropdown
7. Isi jumlah gaji dan detail lainnya
8. Klik **"Tambah"**

### **Melihat Analytics**
1. Buka menu **Rekapitulasi**
2. Scroll ke bawah
3. Lihat 2 card analytics:
   - **🔥 Top 5 Kategori Pengeluaran Terbanyak**
   - **👨‍💼 Top 5 Karyawan dengan Gaji Terbanyak**
4. Data auto-update berdasarkan filter periode yang dipilih

---

## 💡 USE CASES

### **Use Case 1: Tracking Klien/Customer**
```
PEMASUKAN:
- Tanggal: 06/12/2025
- Sumber: Penjualan Produk
- Keterangan: Invoice #12345
- Diterima dari: PT. Maju Jaya 👈
- Jumlah: Rp 10.000.000
```

### **Use Case 2: Tracking Supplier**
```
PENGELUARAN:
- Tanggal: 06/12/2025
- Kategori: Bahan Baku
- Keterangan: Pembelian material
- Dibayarkan kepada: Supplier ABC 👈
- Jumlah: Rp 5.000.000
```

### **Use Case 3: Gaji Karyawan**
```
PENGELUARAN:
- Tanggal: 06/12/2025
- Kategori: Gaji Karyawan 
- Keterangan: Gaji bulan Desember 2025
- Nama Karyawan: [Dropdown] Budi Santoso 👈
- Jumlah: Rp 7.500.000
```

---

## 📊 ANALYTICS FEATURES

### **Top 5 Kategori Pengeluaran**
- Automatic ranking berdasarkan total nominal
- Persentase dari total pengeluaran periode
- Color-coded: Red theme
- Badge ranking 1-5
- Responsive card layout

**Contoh Output:**
```
1️⃣ Gaji Karyawan       Rp 45.000.000  (42.3% dari total)
2️⃣ Bahan Baku          Rp 25.000.000  (23.5% dari total)
3️⃣ Sewa                Rp 15.000.000  (14.1% dari total)
4️⃣ Listrik             Rp  8.000.000  (7.5% dari total)
5️⃣ Marketing           Rp  7.000.000  (6.6% dari total)
```

### **Top 5 Karyawan dengan Gaji Terbanyak**
- Automatic ranking berdasarkan akumulasi gaji
- Persentase dari total gaji periode
- Color-coded: Blue theme
- Badge ranking 1-5
- Data diambil dari expense kategori "Gaji Karyawan"

**Contoh Output:**
```
1️⃣ Budi Santoso        Rp 12.000.000  (26.7% dari total gaji)
2️⃣ Siti Rahayu         Rp  9.500.000  (21.1% dari total gaji)
3️⃣ Ahmad Fauzi         Rp  8.000.000  (17.8% dari total gaji)
4️⃣ Dewi Lestari        Rp  7.500.000  (16.7% dari total gaji)
5️⃣ Eko Prasetyo        Rp  6.000.000  (13.3% dari total gaji)
```

---

## 🔄 DATA FLOW

### **Employee Management Flow**
```
User Input → SettingsSheet 
           → onUpdateEmployees(employees[])
           → saveEmployees() in useSupabaseData
           → Supabase user_settings table (employees JSONB)
           → localStorage (fallback mode)
```

### **Salary Entry Flow**
```
User selects "Gaji Karyawan" 
  → TransactionSheet detects category
  → Shows employee dropdown (if employees exist)
  → User selects employee from dropdown
  → Form submits with paidTo = selected employee
  → Saves to expense_entries.paid_to
```

### **Analytics Calculation Flow**
```
SummarySheet loads expense entries
  → Filter by period
  → Group by category → Top 5 Kategori
  → Filter category="Gaji Karyawan"
     → Group by paid_to
     → Sum amounts
     → Top 5 Employees
```

---

## 🎨 UI/UX HIGHLIGHTS

### **Smart Field Labels**
- Pemasukan: "Diterima dari"
- Pengeluaran (normal): "Dibayarkan kepada"
- Pengeluaran (Gaji Karyawan): **"Nama Karyawan"** 👈 Label berubah dinamis!

### **Helpful Tips**
- Jika kategori "Gaji Karyawan" tapi belum ada karyawan:
  ```
  💡 Tip: Tambahkan daftar karyawan di menu Pengaturan 
         untuk input lebih cepat!
  ```

### **Visual Ranking Badges**
- Numbered badges (1-5) dengan warna sesuai theme
- Top 5 Kategori: Red theme (🔥)
- Top 5 Karyawan: Blue theme (👨‍💼)

### **Responsive Design**
- Desktop: 2-column grid for analytics
- Mobile: 1-column stack
- Cards dengan border dan shadow
- Percentage bars dan labels

---

## 🔐 SECURITY & VALIDATION

### **Data Validation**
- ✅ Employee names must be unique (no duplicates)
- ✅ Empty strings are trimmed before save
- ✅ Confirmation dialog before deleting employee
- ✅ Optional fields (receivedFrom, paidTo) - tidak wajib

### **RLS (Row Level Security)**
- ✅ User hanya bisa akses data mereka sendiri
- ✅ Policy: `user_id = auth.uid()`
- ✅ Cascade delete jika user dihapus

---

## 📱 COMPATIBILITY

### **Supabase Mode**
- ✅ Full sync dengan database
- ✅ Real-time update
- ✅ Multi-device support

### **localStorage Mode**
- ✅ Offline-first
- ✅ PWA compatible
- ✅ Auto-migrate to Supabase saat login

### **Browser Support**
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (iOS 12+)
- ✅ Mobile browsers

---

## 🚧 FUTURE ENHANCEMENTS (Optional)

### **Phase 2 Ideas:**
1. **Auto-suggest Parties**
   - Dropdown dengan history "Diterima dari" / "Dibayarkan kepada"
   - Suggest berdasarkan frequency

2. **Filter by Party**
   - Filter transaksi by klien/supplier/karyawan
   - Quick search bar

3. **Detailed Party Report**
   - Laporan detail per klien/supplier
   - Total transaksi, frekuensi, dll

4. **Excel Export Enhanced**
   - Include kolom "Diterima dari" / "Dibayarkan kepada"
   - Sheet terpisah untuk Top Categories & Top Employees
   - Visualisasi chart di Excel

5. **Employee Profile**
   - Detail karyawan (posisi, tanggal join, dll)
   - History gaji per karyawan
   - Trend gaji overtime

6. **Budget Tracking per Category**
   - Set budget limit per kategori
   - Alert jika over-budget
   - Visual progress bars

---

## ❓ FAQ

### **Q: Apakah field "Diterima dari" dan "Dibayarkan kepada" wajib diisi?**
A: Tidak, kedua field bersifat opsional. Aplikasi tetap bisa berjalan normal tanpa mengisi field tersebut.

### **Q: Bagaimana jika saya sudah punya data lama?**
A: Jalankan migration SQL dari `/MIGRATION_ADD_PARTY_FIELDS.sql`. Data lama tidak akan hilang, hanya ditambahkan kolom baru.

### **Q: Apakah dropdown karyawan bisa input manual?**
A: Ya! Ada pilihan "⚙️ Input Manual" di dropdown untuk input nama yang belum terdaftar.

### **Q: Bagaimana cara menghapus karyawan?**
A: Buka menu Pengaturan → Section Karyawan → Klik icon Trash di samping nama karyawan → Konfirmasi.

### **Q: Apakah data karyawan ikut ter-sync ke Supabase?**
A: Ya, jika menggunakan Supabase mode. Jika localStorage mode, data tersimpan lokal di browser.

### **Q: Apakah analytics auto-update saat ada transaksi baru?**
A: Ya! Analytics menggunakan `useMemo` dan auto-recalculate saat ada perubahan data atau filter periode.

---

## 🎉 SUMMARY

Fitur tracking karyawan dan analytics sudah lengkap dengan:
- ✅ Database schema updated
- ✅ Migration SQL ready
- ✅ Employee management UI
- ✅ Smart input for salary
- ✅ Top 5 analytics dashboard
- ✅ Responsive & mobile-friendly
- ✅ Supabase & localStorage support
- ✅ Complete documentation

**Ready to use! 🚀**

---

**Developer Notes:**
- Code fully typed with TypeScript
- Following React best practices
- Optimized with useMemo for performance
- Consistent naming conventions
- Comprehensive error handling
- User-friendly UX with helpful tips
