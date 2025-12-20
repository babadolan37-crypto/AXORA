-- =================================================================
-- SQL FIX: Perbaikan Skema Tabel (CamelCase -> Snake_case)
-- Jalankan ini sebelum script sebelumnya
-- =================================================================

-- 1. Perbaiki tabel audit_logs jika sudah ada dengan nama kolom yang salah
DO $$
BEGIN
    -- Cek dan rename kolom userId -> user_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'userId') THEN
        ALTER TABLE audit_logs RENAME COLUMN "userId" TO user_id;
    END IF;

    -- Cek dan rename kolom createdAt -> created_at
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'createdAt') THEN
        ALTER TABLE audit_logs RENAME COLUMN "createdAt" TO created_at;
    END IF;

     -- Cek dan rename kolom entityType -> entity_type
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'entityType') THEN
        ALTER TABLE audit_logs RENAME COLUMN "entityType" TO entity_type;
    END IF;

    -- Cek dan rename kolom entityId -> entity_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'entityId') THEN
        ALTER TABLE audit_logs RENAME COLUMN "entityId" TO entity_id;
    END IF;
    
    -- Cek dan rename kolom userAgent -> user_agent
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'userAgent') THEN
        ALTER TABLE audit_logs RENAME COLUMN "userAgent" TO user_agent;
    END IF;
    
    -- Cek dan rename kolom ipAddress -> ip_address
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'ipAddress') THEN
        ALTER TABLE audit_logs RENAME COLUMN "ipAddress" TO ip_address;
    END IF;
END $$;

-- 2. Hapus policy lama yang mungkin error
DROP POLICY IF EXISTS "Users can view own logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON audit_logs;

-- 3. Pastikan kolom yang dibutuhkan ada (Add column if not exists workaround)
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_role TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS old_value JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS new_value JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS description TEXT;

-- 4. Buat ulang Policy dengan nama kolom yang benar
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs" ON audit_logs 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON audit_logs 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
