# SQL Setup - Advanced Features (User Roles, Audit Logs, Scheduled Transfers)

Jalankan SQL berikut di Supabase SQL Editor untuk mengaktifkan fitur-fitur advanced:

## 1. User Profiles Table (User Roles)

```sql
-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'employee')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create index
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
```

## 2. Expense Assignments Table

```sql
-- Create expense_assignments table
CREATE TABLE IF NOT EXISTS expense_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expense_id UUID NOT NULL,
  assigned_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
  due_date TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE expense_assignments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own assignments"
  ON expense_assignments FOR SELECT
  USING (auth.uid() = assigned_to OR auth.uid() = assigned_by OR auth.uid() = user_id);

CREATE POLICY "Admins can manage assignments"
  ON expense_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX idx_expense_assignments_user_id ON expense_assignments(user_id);
CREATE INDEX idx_expense_assignments_assigned_to ON expense_assignments(assigned_to);
CREATE INDEX idx_expense_assignments_status ON expense_assignments(status);
```

## 3. Audit Logs Table

```sql
-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'transfer', 'approve', 'reject', 'assign', 'submit')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('income', 'expense', 'debt', 'cash_transaction', 'cash_transfer', 'expense_assignment', 'scheduled_transfer')),
  entity_id TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  description TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies (admins can view all, users can view their own)
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

## 4. Scheduled Transfers Table

```sql
-- Create scheduled_transfers table
CREATE TABLE IF NOT EXISTS scheduled_transfers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_cash TEXT NOT NULL CHECK (from_cash IN ('big', 'small')),
  to_cash TEXT NOT NULL CHECK (to_cash IN ('big', 'small')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),
  next_run_date TIMESTAMPTZ NOT NULL,
  last_run_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  description TEXT NOT NULL,
  auto_approve BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE scheduled_transfers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own scheduled transfers"
  ON scheduled_transfers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own scheduled transfers"
  ON scheduled_transfers FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_scheduled_transfers_user_id ON scheduled_transfers(user_id);
CREATE INDEX idx_scheduled_transfers_status ON scheduled_transfers(status);
CREATE INDEX idx_scheduled_transfers_next_run ON scheduled_transfers(next_run_date);
```

## 5. Scheduled Transfer Execution Logs

```sql
-- Create scheduled_transfer_executions table
CREATE TABLE IF NOT EXISTS scheduled_transfer_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_transfer_id UUID NOT NULL REFERENCES scheduled_transfers(id) ON DELETE CASCADE,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  amount NUMERIC(15, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  transaction_id UUID,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE scheduled_transfer_executions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own execution logs"
  ON scheduled_transfer_executions FOR SELECT
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_scheduled_transfer_executions_user_id ON scheduled_transfer_executions(user_id);
CREATE INDEX idx_scheduled_transfer_executions_scheduled_id ON scheduled_transfer_executions(scheduled_transfer_id);
```

## 6. Automatic Trigger for Updated_At

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_assignments_updated_at BEFORE UPDATE ON expense_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_transfers_updated_at BEFORE UPDATE ON scheduled_transfers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 7. Auto-create Admin Profile for Existing Users

```sql
-- Function to auto-create user profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, role, full_name, email)
  VALUES (
    NEW.id,
    'admin', -- Default role for first user
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## 8. Initialize Current Users

```sql
-- Create profile for existing users (run this once)
INSERT INTO user_profiles (user_id, role, full_name, email)
SELECT 
  id,
  'admin' as role,
  COALESCE(raw_user_meta_data->>'full_name', SPLIT_PART(email, '@', 1)) as full_name,
  email
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
```

## ✅ Verification

Setelah menjalankan semua SQL di atas, verifikasi dengan:

```sql
-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'user_profiles',
  'expense_assignments',
  'audit_logs',
  'scheduled_transfers',
  'scheduled_transfer_executions'
);

-- Check your profile
SELECT * FROM user_profiles WHERE user_id = auth.uid();
```

## 🎉 Done!

Semua fitur advanced sudah siap digunakan:
- ✅ User Roles (Admin & Employee)
- ✅ Expense Assignments
- ✅ Audit Logs
- ✅ Scheduled Transfers
- ✅ Auto-create profiles untuk user baru
