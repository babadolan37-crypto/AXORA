# 🔧 FIX: Error "Could not find the 'cash_type' column"

## ❌ ERROR MESSAGE:
```
Gagal menambahkan pengeluaran: Could not find the 'cash_type' column of 'expense_entries' in the schema cache
```

## 🔍 ROOT CAUSE:
Tabel `expense_entries` dan `income_entries` belum memiliki kolom `cash_type` yang diperlukan untuk fitur **Kas Besar & Kas Kecil**.

## ✅ SOLUSI:

### **Langkah 1: Login ke Supabase**
1. Buka https://supabase.com/dashboard
2. Pilih project Babadolan Anda
3. Klik **"SQL Editor"** di sidebar kiri

### **Langkah 2: Run SQL Fix**
Copy & paste SQL di bawah ini ke SQL Editor, lalu klik **"Run"**:

```sql
-- ============================================
-- FIX: Add cash_type column to expense_entries & income_entries
-- ============================================

-- Add cash_type column to expense_entries
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expense_entries' 
    AND column_name = 'cash_type'
  ) THEN
    ALTER TABLE expense_entries 
    ADD COLUMN cash_type TEXT CHECK (cash_type IN ('big', 'small'));
    
    -- Set default value for existing rows to 'big' (Kas Besar)
    UPDATE expense_entries SET cash_type = 'big' WHERE cash_type IS NULL;
    
    RAISE NOTICE 'Column cash_type added to expense_entries';
  ELSE
    RAISE NOTICE 'Column cash_type already exists in expense_entries';
  END IF;
END $$;

-- Add cash_type column to income_entries
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'income_entries' 
    AND column_name = 'cash_type'
  ) THEN
    ALTER TABLE income_entries 
    ADD COLUMN cash_type TEXT CHECK (cash_type IN ('big', 'small'));
    
    -- Set default value for existing rows to 'big' (Kas Besar)
    UPDATE income_entries SET cash_type = 'big' WHERE cash_type IS NULL;
    
    RAISE NOTICE 'Column cash_type added to income_entries';
  ELSE
    RAISE NOTICE 'Column cash_type already exists in income_entries';
  END IF;
END $$;

-- Verify the columns were added
SELECT 
  table_name, 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('expense_entries', 'income_entries')
  AND column_name = 'cash_type'
ORDER BY table_name;
```

### **Langkah 3: Verifikasi**
Setelah run SQL di atas, Anda akan melihat output seperti ini:

```
table_name       | column_name | data_type | is_nullable
-----------------+-------------+-----------+------------
expense_entries  | cash_type   | text      | YES
income_entries   | cash_type   | text      | YES
```

### **Langkah 4: Test Aplikasi**
1. Refresh aplikasi Babadolan (Ctrl+Shift+R / Cmd+Shift+R)
2. Coba tambah transaksi baru
3. Pilih "Kas Besar" atau "Kas Kecil"
4. Klik "Simpan"
5. ✅ **Seharusnya berhasil tanpa error!**

## 📝 PENJELASAN:

### **Apa itu cash_type?**
- Kolom untuk membedakan transaksi masuk ke **Kas Besar** atau **Kas Kecil**
- Value: `'big'` (Kas Besar) atau `'small'` (Kas Kecil)
- Default: `'big'` untuk semua data lama

### **Kenapa Error Ini Terjadi?**
- Fitur Kas Besar/Kecil sudah ada di aplikasi
- Tapi kolom `cash_type` belum ada di database
- Saat aplikasi coba save data dengan `cash_type`, database menolak karena kolom tidak ditemukan

### **Apakah Data Lama Aman?**
✅ **YA!** SQL ini hanya **menambahkan kolom baru**, tidak menghapus atau mengubah data yang sudah ada.

Semua data lama akan otomatis dapat nilai `cash_type = 'big'` (Kas Besar).

## 🎯 AFTER FIX:

Setelah fix ini, Anda bisa:
- ✅ Tambah pemasukan dengan pilihan Kas Besar/Kecil
- ✅ Tambah pengeluaran dengan pilihan Kas Besar/Kecil
- ✅ Filter transaksi berdasarkan jenis kas
- ✅ Lihat saldo terpisah untuk Kas Besar & Kas Kecil di Dashboard
- ✅ Transfer antar Kas Besar ↔ Kas Kecil

## ⚠️ NOTES:

### **Jika Masih Error Setelah Run SQL:**

1. **Clear Browser Cache:**
   - Chrome/Edge: Ctrl+Shift+Delete
   - Safari: Cmd+Option+E
   - Pilih "Cached images and files"
   - Klik "Clear data"

2. **Hard Refresh:**
   - Windows: Ctrl+Shift+R
   - Mac: Cmd+Shift+R

3. **Check Console:**
   - Buka Developer Tools (F12)
   - Klik tab "Console"
   - Cari error lainnya

4. **Verify Supabase:**
   - Buka Supabase Dashboard → Table Editor
   - Pilih tabel `expense_entries`
   - Check apakah kolom `cash_type` sudah ada

### **Jika Tabel Tidak Ditemukan:**

Jika Anda mendapat error `table "expense_entries" does not exist`, berarti tabel utama belum dibuat. Jalankan setup awal dulu:

```sql
-- Create income_entries table
CREATE TABLE IF NOT EXISTS income_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  source TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  notes TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  received_from TEXT,
  cash_type TEXT CHECK (cash_type IN ('big', 'small')) DEFAULT 'big',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expense_entries table
CREATE TABLE IF NOT EXISTS expense_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  notes TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  paid_to TEXT,
  cash_type TEXT CHECK (cash_type IN ('big', 'small')) DEFAULT 'big',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_income_user_date ON income_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expense_user_date ON expense_entries(user_id, date DESC);
```

## ✅ DONE!

Setelah menjalankan SQL fix di atas, aplikasi Babadolan seharusnya berfungsi normal tanpa error `cash_type` lagi! 🎉

---

**Last Updated:** December 15, 2024  
**Issue:** Missing `cash_type` column in `expense_entries` and `income_entries` tables  
**Status:** ✅ RESOLVED
