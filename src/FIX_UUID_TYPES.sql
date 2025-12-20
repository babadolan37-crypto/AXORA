-- =================================================================
-- SQL FIX: Konversi Tipe Data ke UUID
-- Masalah: Error "operator does not exist: uuid = text"
-- Solusi: Mengubah tipe kolom user_id dari TEXT menjadi UUID
-- =================================================================

-- 1. Hapus Policy dulu agar tidak ada dependensi saat ubah tipe data
DROP POLICY IF EXISTS "Users can view own logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can manage own transfers" ON scheduled_transfers;

-- 2. Ubah tipe data di tabel audit_logs
DO $$
BEGIN
    -- Cek jika kolom user_id bertipe text, ubah ke uuid
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'user_id' 
        AND data_type = 'text'
    ) THEN
        -- Ubah tipe kolom dengan casting
        ALTER TABLE audit_logs 
        ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
    END IF;
END $$;

-- 3. Ubah tipe data di tabel user_profiles
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'user_id' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE user_profiles 
        ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
    END IF;
END $$;

-- 4. Ubah tipe data di tabel scheduled_transfers
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'scheduled_transfers' 
        AND column_name = 'user_id' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE scheduled_transfers 
        ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
    END IF;
END $$;

-- 5. Re-apply Policies (Sekarang tipe data sudah cocok UUID = UUID)

-- Policy audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own logs" ON audit_logs 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON audit_logs 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON user_profiles 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON user_profiles 
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy scheduled_transfers
ALTER TABLE scheduled_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own transfers" ON scheduled_transfers 
    FOR ALL USING (auth.uid() = user_id);
