# 🔧 Setup Guide: Inter-Cash Transfer Migration

## Error yang Mungkin Terjadi

Jika Anda melihat error berikut:
```
TypeError: Failed to fetch
AuthRetryableFetchError: Failed to fetch
```

Ini berarti **migration database belum dijalankan**. Ikuti langkah berikut:

---

## 📋 Langkah-langkah Setup

### Step 1: Login ke Supabase Dashboard

1. Buka [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Pilih project **Babadolan** Anda
3. Di sidebar kiri, klik **SQL Editor**

### Step 2: Run Migration Script

1. Klik tombol **"New Query"** di SQL Editor
2. Copy **SEMUA** kode SQL berikut:

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

3. **Paste** kode tersebut ke SQL Editor
4. Klik tombol **"Run"** (atau tekan `Ctrl+Enter` / `Cmd+Enter`)
5. Tunggu hingga muncul pesan: **"Success. No rows returned"**

### Step 3: Verify Migration

Jalankan query berikut untuk verifikasi:

```sql
-- Cek apakah kolom sudah ditambahkan
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cash_transactions' 
  AND column_name IN ('is_inter_cash_transfer', 'linked_transaction_id');
```

**Expected Result:**
```
column_name              | data_type
-------------------------|-----------
is_inter_cash_transfer   | boolean
linked_transaction_id    | uuid
```

Jika muncul 2 rows seperti di atas, **migration berhasil!** ✅

### Step 4: Refresh Aplikasi

1. Kembali ke aplikasi Babadolan
2. Tekan `Ctrl+Shift+R` (Windows) atau `Cmd+Shift+R` (Mac) untuk hard refresh
3. Error seharusnya sudah hilang
4. Tombol **"Transfer Kas"** di Dashboard sudah bisa digunakan

---

## ✅ Checklist Setup

- [ ] Login ke Supabase Dashboard
- [ ] Buka SQL Editor
- [ ] Copy & paste migration script
- [ ] Run migration (klik "Run")
- [ ] Verifikasi dengan query check columns
- [ ] Refresh aplikasi (hard refresh)
- [ ] Test fitur Transfer Kas

---

## 🔍 Troubleshooting

### Error: "relation 'cash_transactions' does not exist"

**Penyebab:** Tabel `cash_transactions` belum dibuat.

**Solusi:**
1. Pastikan Anda sudah menjalankan migration untuk Cash Management System terlebih dahulu
2. Lihat file `CASH_MANAGEMENT_SETUP_GUIDE.md` atau dokumentasi sebelumnya
3. Setup tabel cash_transactions dan cash_balances dulu

### Error: "column already exists"

**Penyebab:** Migration sudah pernah dijalankan sebelumnya.

**Solusi:** 
- Ini **bukan error**, migration script sudah di-design untuk handle ini
- Skip saja dan lanjut ke langkah berikutnya

### Error: "permission denied"

**Penyebab:** User tidak punya permission untuk ALTER TABLE.

**Solusi:**
1. Pastikan Anda login sebagai owner/admin project
2. Jangan pakai service role key untuk testing di browser
3. Re-login ke Supabase Dashboard

### Migration Berhasil tapi Masih Error "Failed to fetch"

**Kemungkinan Penyebab:**
1. Browser cache belum clear
2. Service Worker masih aktif (PWA)

**Solusi:**
1. Hard refresh: `Ctrl+Shift+R` (Windows) atau `Cmd+Shift+R` (Mac)
2. Clear browser cache:
   - Chrome: Settings → Privacy → Clear browsing data → Cached images and files
3. Restart browser
4. Jika masih error, coba mode Incognito/Private

---

## 📊 Schema Changes Summary

### New Columns in `cash_transactions`

| Column Name | Type | Description |
|-------------|------|-------------|
| `is_inter_cash_transfer` | BOOLEAN | Flag untuk inter-cash transfer (default: false) |
| `linked_transaction_id` | UUID | ID transaksi pasangan (debit-credit pair) |

### New Indexes

- `idx_cash_transactions_inter_cash` - Index untuk query inter-cash transfer
- `idx_cash_transactions_linked` - Index untuk lookup linked transactions

### Updated RLS Policies

Semua policies di-recreate untuk support kolom baru:
- `Users can insert their own cash transactions`
- `Users can view their own cash transactions`
- `Users can update their own cash transactions`
- `Users can delete their own cash transactions`

---

## 🎯 What's Next?

Setelah migration berhasil, Anda bisa:

1. **Transfer dari Kas Besar ke Kas Kecil** (alokasi modal operasional)
2. **Transfer dari Kas Kecil ke Kas Besar** (pengembalian sisa)
3. **Track linked transactions** untuk audit trail
4. **Export Excel** dengan data transfer antar kas

Baca dokumentasi lengkap di: `/INTER_CASH_TRANSFER_GUIDE.md`

---

## 📞 Need Help?

Jika masih mengalami masalah:
1. Check console browser (F12) untuk error detail
2. Screenshot error message
3. Check Supabase logs: Dashboard → Logs → Database

**Common Issues:**
- Migration belum dijalankan → Jalankan migration script
- Cache browser → Hard refresh
- Wrong project → Pastikan connect ke project yang benar
