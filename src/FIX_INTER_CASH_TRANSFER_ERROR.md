# 🔧 FIX: Error "Could not find 'is_inter_cash_transfer' column"

## ❌ Error yang Muncul
```
Error adding transaction: {
  "code": "PGRST204",
  "details": null,
  "hint": null,
  "message": "Could not find the 'is_inter_cash_transfer' column of 'cash_transactions' in the schema cache"
}
```

## ✅ Solusi: Jalankan Migration SQL

Kolom `is_inter_cash_transfer` dan `linked_transaction_id` belum ada di database Supabase Anda. 

### Langkah-langkah:

#### 1. Buka Supabase Dashboard
Buka: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new

#### 2. Copy SQL Migration
Buka file `/MIGRATION_ADD_INTER_CASH_TRANSFER.sql` di project ini, atau copy SQL berikut:

```sql
-- Migration: Add Inter-Cash Transfer Support
-- Date: 2024-12-15
-- Description: Menambahkan field untuk support transfer antar kas (Kas Besar ↔ Kas Kecil)

-- Add columns to cash_transactions table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_transactions' 
        AND column_name = 'is_inter_cash_transfer'
    ) THEN
        ALTER TABLE cash_transactions
        ADD COLUMN is_inter_cash_transfer BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_transactions' 
        AND column_name = 'linked_transaction_id'
    ) THEN
        ALTER TABLE cash_transactions
        ADD COLUMN linked_transaction_id UUID REFERENCES cash_transactions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for better performance on inter-cash transfer queries
CREATE INDEX IF NOT EXISTS idx_cash_transactions_inter_cash 
ON cash_transactions(is_inter_cash_transfer) 
WHERE is_inter_cash_transfer = TRUE;

CREATE INDEX IF NOT EXISTS idx_cash_transactions_linked 
ON cash_transactions(linked_transaction_id) 
WHERE linked_transaction_id IS NOT NULL;

-- Update existing transactions to mark them as non-inter-cash transfers
UPDATE cash_transactions 
SET is_inter_cash_transfer = FALSE 
WHERE is_inter_cash_transfer IS NULL;

-- Update RLS policies if needed
-- Drop and recreate the INSERT policy to include new columns
DROP POLICY IF EXISTS "Users can insert their own cash transactions" ON cash_transactions;
CREATE POLICY "Users can insert their own cash transactions"
ON cash_transactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Drop and recreate the SELECT policy
DROP POLICY IF EXISTS "Users can view their own cash transactions" ON cash_transactions;
CREATE POLICY "Users can view their own cash transactions"
ON cash_transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Drop and recreate the UPDATE policy to include new columns
DROP POLICY IF EXISTS "Users can update their own cash transactions" ON cash_transactions;
CREATE POLICY "Users can update their own cash transactions"
ON cash_transactions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Drop and recreate the DELETE policy
DROP POLICY IF EXISTS "Users can delete their own cash transactions" ON cash_transactions;
CREATE POLICY "Users can delete their own cash transactions"
ON cash_transactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

COMMENT ON COLUMN cash_transactions.is_inter_cash_transfer IS 'Flag untuk menandai transaksi sebagai transfer antar kas internal';
COMMENT ON COLUMN cash_transactions.linked_transaction_id IS 'ID transaksi pasangan untuk inter-cash transfer (debit-credit pair)';
```

#### 3. Paste & Run
1. Paste SQL di atas ke SQL Editor di Supabase
2. Klik tombol **"Run"** atau tekan `Ctrl+Enter`
3. Tunggu sampai muncul **"Success. No rows returned"**

#### 4. Refresh Aplikasi
Setelah SQL berhasil dijalankan:
1. Kembali ke aplikasi Babadolan
2. **Hard refresh** browser:
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
   - iOS Safari: Tutup tab, buka lagi
3. Login kembali jika diminta

#### 5. Test Transfer Antar Kas
Coba fitur **Transfer Kas** (tombol ⇄ di Dashboard):
- Transfer dari Kas Besar ke Kas Kecil
- Transfer dari Kas Kecil ke Kas Besar
- Cek saldo update otomatis

## ✨ Apa yang Ditambahkan?

### Field Baru di Tabel `cash_transactions`:
1. **`is_inter_cash_transfer`** (BOOLEAN)
   - Menandai transaksi sebagai transfer internal antar kas
   - Default: `FALSE`

2. **`linked_transaction_id`** (UUID)
   - Menghubungkan 2 transaksi (debit & credit) yang saling berpasangan
   - Setiap transfer antar kas = 2 transaksi linked

### Index untuk Performance:
- Index pada `is_inter_cash_transfer` untuk query cepat
- Index pada `linked_transaction_id` untuk traceability

### RLS Policies:
- Update policies untuk support kolom baru
- Tetap maintain user-level security

## 📖 Dokumentasi Lengkap

Setelah migration berhasil, baca dokumentasi lengkap di:
- **`/INTER_CASH_TRANSFER_GUIDE.md`** - Panduan lengkap fitur Transfer Antar Kas
- **`/MIGRATION_ADD_INTER_CASH_TRANSFER.sql`** - File migration SQL

## ⚠️ Troubleshooting

### Error: "relation 'cash_transactions' does not exist"
**Solusi:** Tabel `cash_transactions` belum dibuat. Jalankan setup database lengkap:
1. Buka `/COMPLETE_DATABASE_MIGRATION.sql`
2. Jalankan semua SQL di Supabase SQL Editor

### Error setelah migration masih muncul
**Solusi:** Clear cache browser dan reload:
```bash
# Browser Console
localStorage.clear()
location.reload(true)
```

### Tombol "Transfer Kas" tidak muncul
**Solusi:** 
1. Pastikan sudah hard refresh browser
2. Cek console browser untuk error
3. Pastikan komponen `InterCashTransferForm` tersedia

## 📝 Checklist Setup

- [ ] Buka Supabase SQL Editor
- [ ] Copy & paste migration SQL
- [ ] Run SQL (Success. No rows returned)
- [ ] Hard refresh aplikasi (Ctrl+Shift+R)
- [ ] Test transfer Kas Besar → Kas Kecil
- [ ] Test transfer Kas Kecil → Kas Besar
- [ ] Cek riwayat transaksi muncul dengan label

## 🎯 Selesai!

Setelah migration berhasil:
✅ Error "is_inter_cash_transfer column not found" hilang
✅ Fitur Transfer Antar Kas siap digunakan
✅ Saldo update otomatis setelah transfer
✅ Linked transactions tercatat di database

---

**Update:** 15 Desember 2024
**Versi:** 1.0.0
