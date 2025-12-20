-- ============================================
-- SEED: Default Chart of Accounts
-- ============================================
-- Untuk: Babadolan (Aplikasi Akuntansi PT)
-- Deskripsi: Chart of Accounts default untuk user baru
-- ============================================

-- NOTE: Ganti {USER_ID} dengan UUID user yang login
-- Atau jalankan lewat function create_default_accounts(user_id)

-- ============================================
-- ASET (Asset) - Normal Balance: DEBIT
-- ============================================

-- 1100 - Kas & Bank
INSERT INTO accounts (user_id, code, name, type, sub_type, normal_balance, is_cash_account, is_system_account, description) VALUES
('{USER_ID}', '1101', 'Kas Kecil', 'asset', 'cash', 'debit', TRUE, TRUE, 'Kas kecil untuk pengeluaran operasional sehari-hari'),
('{USER_ID}', '1102', 'Kas Besar', 'asset', 'cash', 'debit', TRUE, TRUE, 'Kas besar untuk transaksi besar'),
('{USER_ID}', '1111', 'Bank BCA', 'asset', 'bank', 'debit', TRUE, FALSE, 'Rekening Bank BCA'),
('{USER_ID}', '1112', 'Bank Mandiri', 'asset', 'bank', 'debit', TRUE, FALSE, 'Rekening Bank Mandiri');

-- 1200 - Piutang
INSERT INTO accounts (user_id, code, name, type, sub_type, normal_balance, is_cash_account, is_system_account, description) VALUES
('{USER_ID}', '1201', 'Piutang Usaha', 'asset', 'receivable', 'debit', FALSE, TRUE, 'Piutang dari penjualan/jasa');

-- 1300 - Persediaan
INSERT INTO accounts (user_id, code, name, type, sub_type, normal_balance, is_cash_account, is_system_account, description) VALUES
('{USER_ID}', '1301', 'Persediaan Barang', 'asset', 'inventory', 'debit', FALSE, FALSE, 'Persediaan barang dagangan');

-- ============================================
-- KEWAJIBAN (Liability) - Normal Balance: CREDIT
-- ============================================

-- 2100 - Utang Lancar
INSERT INTO accounts (user_id, code, name, type, sub_type, normal_balance, is_cash_account, is_system_account, description) VALUES
('{USER_ID}', '2101', 'Utang Usaha', 'liability', 'payable', 'credit', FALSE, TRUE, 'Utang pembelian/jasa'),
('{USER_ID}', '2102', 'Utang Gaji', 'liability', 'salary_payable', 'credit', FALSE, TRUE, 'Utang gaji karyawan yang belum dibayar');

-- ============================================
-- MODAL (Equity) - Normal Balance: CREDIT
-- ============================================

-- 3100 - Modal
INSERT INTO accounts (user_id, code, name, type, sub_type, normal_balance, is_cash_account, is_system_account, description) VALUES
('{USER_ID}', '3101', 'Modal Pemilik', 'equity', 'capital', 'credit', FALSE, TRUE, 'Modal awal pemilik'),
('{USER_ID}', '3201', 'Laba Ditahan', 'equity', 'retained_earnings', 'credit', FALSE, TRUE, 'Akumulasi laba/rugi'),
('{USER_ID}', '3301', 'Prive', 'equity', 'drawings', 'debit', FALSE, FALSE, 'Pengambilan pribadi pemilik');

-- ============================================
-- PENDAPATAN (Revenue) - Normal Balance: CREDIT
-- ============================================

-- 4100 - Pendapatan Usaha
INSERT INTO accounts (user_id, code, name, type, sub_type, normal_balance, is_cash_account, is_system_account, description) VALUES
('{USER_ID}', '4101', 'Pendapatan Jasa', 'revenue', 'service_revenue', 'credit', FALSE, FALSE, 'Pendapatan dari jasa'),
('{USER_ID}', '4102', 'Pendapatan Penjualan', 'revenue', 'sales_revenue', 'credit', FALSE, FALSE, 'Pendapatan dari penjualan barang'),
('{USER_ID}', '4201', 'Pendapatan Lain-lain', 'revenue', 'other_revenue', 'credit', FALSE, FALSE, 'Pendapatan di luar usaha utama');

-- ============================================
-- BEBAN (Expense) - Normal Balance: DEBIT
-- ============================================

-- 5100 - Beban Operasional
INSERT INTO accounts (user_id, code, name, type, sub_type, normal_balance, is_cash_account, is_system_account, description) VALUES
('{USER_ID}', '5101', 'Beban Gaji', 'expense', 'salary_expense', 'debit', FALSE, TRUE, 'Beban gaji karyawan'),
('{USER_ID}', '5102', 'Beban Transport', 'expense', 'transport_expense', 'debit', FALSE, FALSE, 'Beban transportasi dan bensin'),
('{USER_ID}', '5103', 'Beban ATK', 'expense', 'supplies_expense', 'debit', FALSE, FALSE, 'Beban alat tulis kantor'),
('{USER_ID}', '5104', 'Beban Listrik', 'expense', 'utility_expense', 'debit', FALSE, FALSE, 'Beban listrik'),
('{USER_ID}', '5105', 'Beban Air', 'expense', 'utility_expense', 'debit', FALSE, FALSE, 'Beban air'),
('{USER_ID}', '5106', 'Beban Internet', 'expense', 'utility_expense', 'debit', FALSE, FALSE, 'Beban internet dan telekomunikasi'),
('{USER_ID}', '5107', 'Beban Sewa', 'expense', 'rent_expense', 'debit', FALSE, FALSE, 'Beban sewa kantor/tempat usaha'),
('{USER_ID}', '5108', 'Beban Makan & Minum', 'expense', 'meal_expense', 'debit', FALSE, FALSE, 'Beban konsumsi'),
('{USER_ID}', '5109', 'Beban Parkir', 'expense', 'parking_expense', 'debit', FALSE, FALSE, 'Beban parkir'),
('{USER_ID}', '5110', 'Beban Perawatan Kendaraan', 'expense', 'maintenance_expense', 'debit', FALSE, FALSE, 'Beban service dan perbaikan kendaraan'),
('{USER_ID}', '5201', 'Beban Lain-lain', 'expense', 'other_expense', 'debit', FALSE, FALSE, 'Beban operasional lain-lain');

-- ============================================
-- FUNCTION: Create Default Accounts untuk User Baru
-- ============================================
CREATE OR REPLACE FUNCTION create_default_accounts_for_user(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Cek apakah user sudah punya accounts
  IF EXISTS (SELECT 1 FROM accounts WHERE user_id = p_user_id) THEN
    RETURN; -- Sudah ada, skip
  END IF;
  
  -- Insert default accounts
  -- ASET
  INSERT INTO accounts (user_id, code, name, type, sub_type, normal_balance, is_cash_account, is_system_account, description) VALUES
  (p_user_id, '1101', 'Kas Kecil', 'asset', 'cash', 'debit', TRUE, TRUE, 'Kas kecil untuk pengeluaran operasional sehari-hari'),
  (p_user_id, '1102', 'Kas Besar', 'asset', 'cash', 'debit', TRUE, TRUE, 'Kas besar untuk transaksi besar'),
  (p_user_id, '1111', 'Bank BCA', 'asset', 'bank', 'debit', TRUE, FALSE, 'Rekening Bank BCA'),
  (p_user_id, '1112', 'Bank Mandiri', 'asset', 'bank', 'debit', TRUE, FALSE, 'Rekening Bank Mandiri'),
  (p_user_id, '1201', 'Piutang Usaha', 'asset', 'receivable', 'debit', FALSE, TRUE, 'Piutang dari penjualan/jasa'),
  (p_user_id, '1301', 'Persediaan Barang', 'asset', 'inventory', 'debit', FALSE, FALSE, 'Persediaan barang dagangan');
  
  -- KEWAJIBAN
  INSERT INTO accounts (user_id, code, name, type, sub_type, normal_balance, is_cash_account, is_system_account, description) VALUES
  (p_user_id, '2101', 'Utang Usaha', 'liability', 'payable', 'credit', FALSE, TRUE, 'Utang pembelian/jasa'),
  (p_user_id, '2102', 'Utang Gaji', 'liability', 'salary_payable', 'credit', FALSE, TRUE, 'Utang gaji karyawan yang belum dibayar');
  
  -- MODAL
  INSERT INTO accounts (user_id, code, name, type, sub_type, normal_balance, is_cash_account, is_system_account, description) VALUES
  (p_user_id, '3101', 'Modal Pemilik', 'equity', 'capital', 'credit', FALSE, TRUE, 'Modal awal pemilik'),
  (p_user_id, '3201', 'Laba Ditahan', 'equity', 'retained_earnings', 'credit', FALSE, TRUE, 'Akumulasi laba/rugi'),
  (p_user_id, '3301', 'Prive', 'equity', 'drawings', 'debit', FALSE, FALSE, 'Pengambilan pribadi pemilik');
  
  -- PENDAPATAN
  INSERT INTO accounts (user_id, code, name, type, sub_type, normal_balance, is_cash_account, is_system_account, description) VALUES
  (p_user_id, '4101', 'Pendapatan Jasa', 'revenue', 'service_revenue', 'credit', FALSE, FALSE, 'Pendapatan dari jasa'),
  (p_user_id, '4102', 'Pendapatan Penjualan', 'revenue', 'sales_revenue', 'credit', FALSE, FALSE, 'Pendapatan dari penjualan barang'),
  (p_user_id, '4201', 'Pendapatan Lain-lain', 'revenue', 'other_revenue', 'credit', FALSE, FALSE, 'Pendapatan di luar usaha utama');
  
  -- BEBAN
  INSERT INTO accounts (user_id, code, name, type, sub_type, normal_balance, is_cash_account, is_system_account, description) VALUES
  (p_user_id, '5101', 'Beban Gaji', 'expense', 'salary_expense', 'debit', FALSE, TRUE, 'Beban gaji karyawan'),
  (p_user_id, '5102', 'Beban Transport', 'expense', 'transport_expense', 'debit', FALSE, FALSE, 'Beban transportasi dan bensin'),
  (p_user_id, '5103', 'Beban ATK', 'expense', 'supplies_expense', 'debit', FALSE, FALSE, 'Beban alat tulis kantor'),
  (p_user_id, '5104', 'Beban Listrik', 'expense', 'utility_expense', 'debit', FALSE, FALSE, 'Beban listrik'),
  (p_user_id, '5105', 'Beban Air', 'expense', 'utility_expense', 'debit', FALSE, FALSE, 'Beban air'),
  (p_user_id, '5106', 'Beban Internet', 'expense', 'utility_expense', 'debit', FALSE, FALSE, 'Beban internet dan telekomunikasi'),
  (p_user_id, '5107', 'Beban Sewa', 'expense', 'rent_expense', 'debit', FALSE, FALSE, 'Beban sewa kantor/tempat usaha'),
  (p_user_id, '5108', 'Beban Makan & Minum', 'expense', 'meal_expense', 'debit', FALSE, FALSE, 'Beban konsumsi'),
  (p_user_id, '5109', 'Beban Parkir', 'expense', 'parking_expense', 'debit', FALSE, FALSE, 'Beban parkir'),
  (p_user_id, '5110', 'Beban Perawatan Kendaraan', 'expense', 'maintenance_expense', 'debit', FALSE, FALSE, 'Beban service dan perbaikan kendaraan'),
  (p_user_id, '5201', 'Beban Lain-lain', 'expense', 'other_expense', 'debit', FALSE, FALSE, 'Beban operasional lain-lain');
  
  RAISE NOTICE 'Default accounts created for user %', p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- AUTO-CREATE: Trigger saat user pertama kali login
-- ============================================
-- NOTE: Ini bisa dipanggil dari aplikasi saat user pertama kali akses
-- Atau bisa dibuat trigger otomatis saat insert ke user_settings
