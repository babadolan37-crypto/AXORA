-- =====================================================
-- CONTOH DATA KAS - BABADOLAN
-- File ini berisi contoh insert data untuk testing
-- =====================================================

-- 1. Insert Contoh Saldo Kas Awal
-- Pastikan tabel cash_balances sudah dibuat terlebih dahulu

-- Kas Besar - Saldo Awal Rp 10.000.000
INSERT INTO cash_balances (id, cash_type, balance, last_updated)
VALUES (
  gen_random_uuid(),
  'big',
  10000000,
  NOW()
) ON CONFLICT (cash_type) DO UPDATE SET
  balance = 10000000,
  last_updated = NOW();

-- Kas Kecil - Saldo Awal Rp 2.000.000
INSERT INTO cash_balances (id, cash_type, balance, last_updated)
VALUES (
  gen_random_uuid(),
  'small',
  2000000,
  NOW()
) ON CONFLICT (cash_type) DO UPDATE SET
  balance = 2000000,
  last_updated = NOW();

-- =====================================================
-- 2. Contoh Transfer Kas Kecil untuk Kinnan (Pengeluaran Langsung)
-- =====================================================

-- Insert Transfer
INSERT INTO cash_transfers (
  id,
  date,
  cash_type,
  employee_name,
  transfer_amount,
  actual_expense,
  difference,
  status,
  description,
  notes,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '2025-12-03',
  'small',
  'Kinnan',
  91000,
  91000,
  0,
  'settled',
  'Transfer Kas Kecil untuk Kinnan',
  'Pengeluaran operasional harian',
  NOW(),
  NOW()
) RETURNING id;

-- Simpan ID yang di-return untuk step selanjutnya
-- Ganti 'YOUR_TRANSFER_ID' dengan ID yang didapat dari query di atas

-- Insert Detail Pengeluaran Kinnan
INSERT INTO expense_details (
  id,
  transfer_id,
  date,
  category,
  description,
  amount,
  proof,
  vendor
) VALUES
-- Pengeluaran 1: Bensin
(
  gen_random_uuid(),
  'YOUR_TRANSFER_ID', -- Ganti dengan ID transfer yang sebenarnya
  '2025-12-03',
  'Transportasi',
  'Bensin motor',
  40000,
  '', -- Kosong karena pengeluaran langsung tidak wajib bukti
  'SPBU Pertamina'
),
-- Pengeluaran 2: Makan
(
  gen_random_uuid(),
  'YOUR_TRANSFER_ID',
  '2025-12-03',
  'Makanan & Minuman',
  'Makan siang',
  30000,
  '',
  'Warteg Bahari'
),
-- Pengeluaran 3: Print
(
  gen_random_uuid(),
  'YOUR_TRANSFER_ID',
  '2025-12-03',
  'Peralatan Kantor',
  'Print dokumen',
  15000,
  '',
  'Toko Fotocopy Jaya'
);

-- =====================================================
-- 3. Contoh Transfer dengan Laporan Kemudian
-- =====================================================

-- Transfer Rp 700.000 ke Ahmad (Menunggu Laporan)
INSERT INTO cash_transfers (
  id,
  date,
  cash_type,
  employee_name,
  transfer_amount,
  actual_expense,
  difference,
  status,
  description,
  notes,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '2025-12-05',
  'small',
  'Ahmad',
  700000,
  0, -- Belum dilaporkan
  0,
  'pending', -- Status menunggu laporan
  'Transfer untuk biaya operasional lapangan',
  'Untuk perjalanan dinas 3 hari',
  NOW(),
  NOW()
);

-- =====================================================
-- 4. Contoh Transfer yang Sudah Dilaporkan (Ada Selisih)
-- =====================================================

-- Insert Transfer yang sudah selesai dengan pengembalian
INSERT INTO cash_transfers (
  id,
  date,
  cash_type,
  employee_name,
  transfer_amount,
  actual_expense,
  difference,
  status,
  description,
  return_amount,
  return_date,
  notes,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '2025-12-01',
  'small',
  'Budi',
  500000,
  450000, -- Pengeluaran aktual
  -50000, -- Selisih (negatif = lebih bayar, perlu pengembalian)
  'settled',
  'Transfer untuk belanja supplies',
  50000, -- Jumlah yang dikembalikan
  '2025-12-04',
  'Sudah dikembalikan tunai',
  NOW(),
  NOW()
) RETURNING id;

-- Insert Detail Pengeluaran Budi
INSERT INTO expense_details (
  id,
  transfer_id,
  date,
  category,
  description,
  amount,
  proof,
  vendor
) VALUES
(
  gen_random_uuid(),
  'YOUR_TRANSFER_ID_BUDI', -- Ganti dengan ID transfer Budi
  '2025-12-01',
  'Supplies',
  'Kertas A4 (3 rim)',
  120000,
  '',
  'Toko ATK Sejahtera'
),
(
  gen_random_uuid(),
  'YOUR_TRANSFER_ID_BUDI',
  '2025-12-01',
  'Peralatan Kantor',
  'Tinta printer + alat tulis',
  180000,
  '',
  'Toko ATK Sejahtera'
),
(
  gen_random_uuid(),
  'YOUR_TRANSFER_ID_BUDI',
  '2025-12-01',
  'Transportasi',
  'Ongkir + parkir',
  50000,
  '',
  '-'
),
(
  gen_random_uuid(),
  'YOUR_TRANSFER_ID_BUDI',
  '2025-12-02',
  'Makanan & Minuman',
  'Makan siang tim',
  100000,
  '',
  'RM Padang Raya'
);

-- =====================================================
-- 5. Contoh Transfer yang Perlu Pembayaran Tambahan
-- =====================================================

INSERT INTO cash_transfers (
  id,
  date,
  cash_type,
  employee_name,
  transfer_amount,
  actual_expense,
  difference,
  status,
  description,
  additional_payment,
  additional_payment_date,
  notes,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '2025-11-28',
  'small',
  'Siti',
  300000,
  350000, -- Pengeluaran aktual lebih besar
  50000, -- Selisih (positif = kurang bayar, perlu pembayaran tambahan)
  'settled',
  'Transfer untuk event kantor',
  50000, -- Pembayaran tambahan
  '2025-12-01',
  'Kekurangan sudah dibayar',
  NOW(),
  NOW()
);

-- =====================================================
-- 6. Cara Menggunakan Contoh Data Ini
-- =====================================================

/*
LANGKAH-LANGKAH:

1. Pastikan tabel sudah dibuat (jalankan SUPABASE_CREATE_TABLES.sql)

2. Copy query di atas ke SQL Editor di Supabase Dashboard

3. PENTING: Ganti 'YOUR_TRANSFER_ID' dengan ID yang sebenarnya
   - Cara 1: Lihat return value dari INSERT transfer
   - Cara 2: Query: SELECT id FROM cash_transfers WHERE employee_name = 'Kinnan' ORDER BY created_at DESC LIMIT 1;

4. Jalankan query satu per satu atau sekaligus

5. Cek hasilnya di aplikasi Babadolan

TIPS:
- Untuk testing, bisa gunakan user_id yang sama dengan auth.uid() Anda
- Sesuaikan tanggal dengan kebutuhan testing
- Jumlah nominal bisa disesuaikan
*/

-- =====================================================
-- 7. Query untuk Verifikasi Data
-- =====================================================

-- Cek Saldo Kas
SELECT 
  cash_type,
  balance,
  last_updated
FROM cash_balances
ORDER BY cash_type;

-- Cek Semua Transfer
SELECT 
  date,
  cash_type,
  employee_name,
  transfer_amount,
  actual_expense,
  difference,
  status,
  description
FROM cash_transfers
ORDER BY date DESC;

-- Cek Detail Pengeluaran dengan Nama Karyawan
SELECT 
  ct.employee_name,
  ed.date,
  ed.category,
  ed.description,
  ed.amount,
  ed.vendor
FROM expense_details ed
JOIN cash_transfers ct ON ed.transfer_id = ct.id
ORDER BY ct.employee_name, ed.date;

-- Analisis Per Kategori
SELECT 
  ed.category,
  COUNT(*) as jumlah_transaksi,
  SUM(ed.amount) as total_pengeluaran
FROM expense_details ed
GROUP BY ed.category
ORDER BY total_pengeluaran DESC;

-- Analisis Per Karyawan
SELECT 
  ct.employee_name,
  COUNT(*) as jumlah_transfer,
  SUM(ct.transfer_amount) as total_transfer,
  SUM(ct.actual_expense) as total_pengeluaran,
  SUM(ct.difference) as total_selisih
FROM cash_transfers ct
GROUP BY ct.employee_name
ORDER BY total_transfer DESC;

-- =====================================================
-- 8. Reset Data (Hati-hati!)
-- =====================================================

/*
Jika ingin reset semua data testing:

-- Hapus semua detail pengeluaran
DELETE FROM expense_details;

-- Hapus semua transfer
DELETE FROM cash_transfers;

-- Reset saldo kas
UPDATE cash_balances SET balance = 0, last_updated = NOW();

PERINGATAN: 
- Command ini akan menghapus SEMUA data
- Pastikan backup dulu jika ada data penting
- Gunakan hanya untuk testing/development
*/
