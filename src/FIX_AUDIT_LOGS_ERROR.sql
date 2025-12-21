-- Fix for "column audit_logs.created_at does not exist" error

-- 1. Check and rename 'createdAt' (camelCase) to 'created_at' (snake_case) if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'createdAt') THEN
        ALTER TABLE audit_logs RENAME COLUMN "createdAt" TO created_at;
    END IF;
END $$;

-- 2. Add 'created_at' column if it still doesn't exist
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Ensure other columns exist (just in case)
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS description TEXT;

-- 4. Re-enable RLS just to be sure
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Refresh policies
DROP POLICY IF EXISTS "Users can view own logs" ON audit_logs;
CREATE POLICY "Users can view own logs" ON audit_logs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own logs" ON audit_logs;
CREATE POLICY "Users can insert own logs" ON audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
