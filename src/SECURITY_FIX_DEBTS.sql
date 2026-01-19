-- ==========================================
-- SECURITY FIX & SCHEMA UPDATE FOR DEBTS
-- ==========================================

-- 1. FIX RLS ON public.debts (Jika tabel ini ada)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'debts') THEN
        ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view own debts" ON public.debts;
        CREATE POLICY "Users can view own debts" ON public.debts FOR SELECT USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can insert own debts" ON public.debts;
        CREATE POLICY "Users can insert own debts" ON public.debts FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can update own debts" ON public.debts;
        CREATE POLICY "Users can update own debts" ON public.debts FOR UPDATE USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can delete own debts" ON public.debts;
        CREATE POLICY "Users can delete own debts" ON public.debts FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 2. FIX RLS ON public.debt_entries (Tabel Utama Aplikasi)
-- Memastikan tabel debt_entries aman
ALTER TABLE IF EXISTS public.debt_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own debt_entries" ON public.debt_entries;
CREATE POLICY "Users can view own debt_entries" ON public.debt_entries FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own debt_entries" ON public.debt_entries;
CREATE POLICY "Users can insert own debt_entries" ON public.debt_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own debt_entries" ON public.debt_entries;
CREATE POLICY "Users can update own debt_entries" ON public.debt_entries FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own debt_entries" ON public.debt_entries;
CREATE POLICY "Users can delete own debt_entries" ON public.debt_entries FOR DELETE USING (auth.uid() = user_id);

-- 3. ADD MISSING COLUMN client_phone
-- Menambahkan kolom nomor HP client yang hilang di database tapi ada di aplikasi
ALTER TABLE IF EXISTS public.debt_entries ADD COLUMN IF NOT EXISTS client_phone TEXT;

-- 4. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_debt_entries_user_id ON public.debt_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_debt_entries_status ON public.debt_entries(status);
