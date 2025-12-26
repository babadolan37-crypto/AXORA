-- =================================================================
-- FIX ERROR: RELATION "company_settings" DOES NOT EXIST
-- =================================================================
-- Masalah: Script trigger dijalankan sebelum tabel "company_settings" dibuat.
-- Solusi: Urutkan script agar tabel dibuat terlebih dahulu.

-- 1. Buat Tabel "company_settings" (Jika Belum Ada)
CREATE TABLE IF NOT EXISTS public.company_settings (
  company_id UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  income_sources JSONB DEFAULT '["Penjualan Produk","Penjualan Jasa","Pemasukan Investasi","Pembayaran Piutang","Lainnya"]'::jsonb,
  expense_categories JSONB DEFAULT '["Gaji Karyawan","Sewa","Bahan Baku","Listrik","Air","Internet & Telekomunikasi","Transportasi","Peralatan Kantor","Marketing","Pajak","Lainnya"]'::jsonb,
  payment_methods JSONB DEFAULT '["Tunai","Transfer Bank","Cek","Kartu Kredit","E-Wallet"]'::jsonb,
  employees JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Aktifkan RLS untuk company_settings
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- 3. Hapus Trigger & Function Lama (Reset)
DROP TRIGGER IF EXISTS on_company_created ON companies;
DROP FUNCTION IF EXISTS handle_new_company();

-- 4. Buat Ulang Function Trigger dengan referensi schema yang benar (public.company_settings)
CREATE OR REPLACE FUNCTION handle_new_company()
RETURNS TRIGGER AS $$
BEGIN
  -- Pastikan insert ke public.company_settings
  INSERT INTO public.company_settings (company_id)
  VALUES (new.id)
  ON CONFLICT (company_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Pasang Kembali Trigger
CREATE TRIGGER on_company_created
  AFTER INSERT ON companies
  FOR EACH ROW EXECUTE PROCEDURE handle_new_company();

-- 6. Verifikasi Policy untuk company_settings (Bypass Recursion)
DROP POLICY IF EXISTS "Admins can manage settings" ON public.company_settings;
DROP POLICY IF EXISTS "Company members can view settings" ON public.company_settings;

-- Gunakan fungsi helper yang sudah kita buat sebelumnya (is_admin_of_company)
-- Jika fungsi belum ada, buat dulu:
CREATE OR REPLACE FUNCTION is_admin_of_company(target_company_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND company_id = target_company_id
      AND role IN ('owner', 'admin')
  );
END;
$$;

CREATE POLICY "Admins can manage settings" ON public.company_settings
  FOR ALL USING (
    is_admin_of_company(company_id)
  );

CREATE POLICY "Company members can view settings" ON public.company_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.company_id = company_settings.company_id
    )
  );
