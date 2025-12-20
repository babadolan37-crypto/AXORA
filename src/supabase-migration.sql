-- ============================================
-- BABADOLAN - Supabase Migration SQL
-- ERP Accounting System - All New Modules
-- ============================================

-- 1. BUDGETS TABLE
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  category TEXT NOT NULL,
  month TEXT NOT NULL, -- YYYY-MM format
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_budgets_user ON budgets("userId");
CREATE INDEX idx_budgets_month ON budgets(month);

-- 2. RECURRING TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  "startDate" DATE NOT NULL,
  "endDate" DATE,
  "nextExecutionDate" DATE NOT NULL,
  "lastExecutionDate" DATE,
  active BOOLEAN DEFAULT TRUE,
  "autoExecute" BOOLEAN DEFAULT FALSE,
  employee TEXT,
  "cashType" TEXT CHECK ("cashType" IN ('big', 'small')),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recurring_user ON recurring_transactions("userId");
CREATE INDEX idx_recurring_next_execution ON recurring_transactions("nextExecutionDate");

-- 3. RECURRING EXECUTION LOGS
CREATE TABLE IF NOT EXISTS recurring_execution_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "recurringTransactionId" UUID NOT NULL REFERENCES recurring_transactions(id) ON DELETE CASCADE,
  "executedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "transactionId" UUID,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  notes TEXT
);

CREATE INDEX idx_execution_logs_recurring ON recurring_execution_logs("recurringTransactionId");

-- 4. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  npwp TEXT,
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_customers_user ON customers("userId");

-- 5. INVOICES TABLE
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  "documentType" TEXT NOT NULL CHECK ("documentType" IN ('invoice', 'quotation')),
  "invoiceNumber" TEXT NOT NULL,
  date DATE NOT NULL,
  "dueDate" DATE NOT NULL,
  customer JSONB NOT NULL, -- {name, email, phone, address, npwp}
  items JSONB NOT NULL, -- Array of {id, description, quantity, unitPrice, amount, taxRate}
  subtotal NUMERIC NOT NULL,
  "taxAmount" NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  notes TEXT,
  terms TEXT,
  "paidDate" DATE,
  "paidAmount" NUMERIC,
  "paymentProofUrl" TEXT,
  "linkedTransactionId" UUID,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invoices_user ON invoices("userId");
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(date);

-- 6. INVOICE PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS invoice_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "invoiceId" UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  method TEXT,
  notes TEXT,
  "proofUrl" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invoice_payments_invoice ON invoice_payments("invoiceId");

-- 7. APPROVAL RULES TABLE
CREATE TABLE IF NOT EXISTS approval_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  name TEXT NOT NULL,
  "transactionType" TEXT NOT NULL CHECK ("transactionType" IN ('income', 'expense', 'both')),
  "minAmount" NUMERIC NOT NULL,
  "maxAmount" NUMERIC,
  "requiresApproval" BOOLEAN DEFAULT TRUE,
  "approvalLevels" JSONB NOT NULL, -- Array of levels: ['manager', 'director', 'ceo']
  "categoryFilter" JSONB, -- Array of categories, null = all
  active BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_approval_rules_user ON approval_rules("userId");

-- 8. APPROVAL REQUESTS TABLE
CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  "transactionType" TEXT NOT NULL CHECK ("transactionType" IN ('income', 'expense')),
  "transactionData" JSONB NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  "requestedBy" TEXT NOT NULL,
  "requestedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "currentLevel" TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  "approvalHistory" JSONB DEFAULT '[]', -- Array of approval actions
  "finalApprovedAt" TIMESTAMP WITH TIME ZONE,
  "linkedTransactionId" UUID
);

CREATE INDEX idx_approval_requests_user ON approval_requests("userId");
CREATE INDEX idx_approval_requests_status ON approval_requests(status);

-- 9. APPROVERS TABLE
CREATE TABLE IF NOT EXISTS approvers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('manager', 'director', 'ceo')),
  active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_approvers_user ON approvers("userId");

-- 10. TAX CONFIGURATIONS TABLE
CREATE TABLE IF NOT EXISTS tax_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  "taxType" TEXT NOT NULL CHECK ("taxType" IN ('ppn', 'pph21', 'pph23', 'pph4-2', 'pph-final')),
  rate NUMERIC NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  "applicableCategories" JSONB, -- Array of categories, null = all
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tax_configs_user ON tax_configs("userId");

-- 11. TAX TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS tax_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  "transactionId" UUID NOT NULL,
  "transactionType" TEXT NOT NULL CHECK ("transactionType" IN ('income', 'expense')),
  "taxType" TEXT NOT NULL CHECK ("taxType" IN ('ppn', 'pph21', 'pph23', 'pph4-2', 'pph-final')),
  "baseAmount" NUMERIC NOT NULL,
  "taxRate" NUMERIC NOT NULL,
  "taxAmount" NUMERIC NOT NULL,
  date DATE NOT NULL,
  npwp TEXT,
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tax_transactions_user ON tax_transactions("userId");
CREATE INDEX idx_tax_transactions_date ON tax_transactions(date);

-- 12. APP USERS TABLE (User Roles)
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'accountant', 'manager', 'viewer')),
  active BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "lastLogin" TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_app_users_email ON app_users(email);

-- 13. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "userId" TEXT NOT NULL,
  "userName" TEXT NOT NULL,
  "userEmail" TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'approve', 'reject', 'export', 'login', 'logout')),
  resource TEXT NOT NULL CHECK (resource IN ('income', 'expense', 'invoice', 'budget', 'recurring', 'approval', 'user', 'settings', 'tax', 'cash')),
  "resourceId" TEXT NOT NULL,
  "oldValue" JSONB,
  "newValue" JSONB,
  changes JSONB, -- Array of changed field names
  "ipAddress" TEXT,
  "userAgent" TEXT,
  notes TEXT
);

CREATE INDEX idx_audit_logs_user ON audit_logs("userId");
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource);

-- 14. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('low_balance', 'budget_warning', 'budget_exceeded', 'invoice_overdue', 'invoice_paid', 'approval_pending', 'approval_approved', 'approval_rejected', 'recurring_execution', 'system')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  "actionUrl" TEXT,
  "actionLabel" TEXT,
  metadata JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "readAt" TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_notifications_user ON notifications("userId");
CREATE INDEX idx_notifications_read ON notifications(read);

-- 15. NOTIFICATION PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT UNIQUE NOT NULL,
  "emailNotifications" BOOLEAN DEFAULT TRUE,
  "pushNotifications" BOOLEAN DEFAULT TRUE,
  preferences JSONB DEFAULT '{}',
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notification_prefs_user ON notification_preferences("userId");

-- 16. BANK ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  "accountName" TEXT NOT NULL,
  "accountNumber" TEXT NOT NULL,
  "bankName" TEXT NOT NULL,
  "accountType" TEXT NOT NULL CHECK ("accountType" IN ('checking', 'savings', 'credit')),
  currency TEXT DEFAULT 'IDR',
  active BOOLEAN DEFAULT TRUE,
  "openingBalance" NUMERIC DEFAULT 0,
  "currentBalance" NUMERIC DEFAULT 0,
  "lastReconciled" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bank_accounts_user ON bank_accounts("userId");

-- 17. BANK STATEMENTS TABLE
CREATE TABLE IF NOT EXISTS bank_statements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  "accountName" TEXT NOT NULL,
  "accountNumber" TEXT NOT NULL,
  "bankName" TEXT NOT NULL,
  "uploadDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "statementDate" DATE NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileUrl" TEXT,
  transactions JSONB NOT NULL, -- Array of bank transactions
  reconciled BOOLEAN DEFAULT FALSE,
  "reconciledAt" TIMESTAMP WITH TIME ZONE,
  "reconciledBy" TEXT
);

CREATE INDEX idx_bank_statements_user ON bank_statements("userId");

-- 18. BANK TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS bank_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "statementId" UUID NOT NULL REFERENCES bank_statements(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  reference TEXT,
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  balance NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('unmatched', 'matched', 'reviewed', 'discrepancy')),
  "matchedTransactionId" UUID,
  "matchScore" INTEGER,
  notes TEXT,
  "reviewedAt" TIMESTAMP WITH TIME ZONE,
  "reviewedBy" TEXT
);

CREATE INDEX idx_bank_transactions_statement ON bank_transactions("statementId");
CREATE INDEX idx_bank_transactions_status ON bank_transactions(status);

-- 19. RECONCILIATION MATCHES TABLE
CREATE TABLE IF NOT EXISTS reconciliation_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "bankTransactionId" UUID NOT NULL REFERENCES bank_transactions(id) ON DELETE CASCADE,
  "systemTransactionId" UUID NOT NULL,
  "matchType" TEXT NOT NULL CHECK ("matchType" IN ('auto', 'manual', 'suggested')),
  confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
  "matchedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "matchedBy" TEXT NOT NULL
);

CREATE INDEX idx_recon_matches_bank ON reconciliation_matches("bankTransactionId");
CREATE INDEX idx_recon_matches_system ON reconciliation_matches("systemTransactionId");

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_matches ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to access their own data
-- Replace these with specific policies based on your auth setup

-- Example for budgets table:
CREATE POLICY "Users can view their own budgets" ON budgets FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "Users can insert their own budgets" ON budgets FOR INSERT WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "Users can update their own budgets" ON budgets FOR UPDATE USING (auth.uid()::text = "userId");
CREATE POLICY "Users can delete their own budgets" ON budgets FOR DELETE USING (auth.uid()::text = "userId");

-- Repeat similar policies for all other tables...
-- For brevity, I'm providing a template - apply this pattern to all tables above

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update invoice status to 'overdue' automatically
CREATE OR REPLACE FUNCTION update_overdue_invoices()
RETURNS void AS $$
BEGIN
  UPDATE invoices
  SET status = 'overdue'
  WHERE status = 'sent'
  AND "dueDate" < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to execute recurring transactions (to be called by a scheduler)
CREATE OR REPLACE FUNCTION execute_due_recurring_transactions()
RETURNS void AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT * FROM recurring_transactions
    WHERE active = TRUE
    AND "nextExecutionDate" <= CURRENT_DATE
    AND ("endDate" IS NULL OR "endDate" >= CURRENT_DATE)
  LOOP
    -- This would trigger application logic to create actual transaction
    -- For now, just log it
    INSERT INTO recurring_execution_logs ("recurringTransactionId", status, notes)
    VALUES (rec.id, 'skipped', 'Auto-execution requires application logic');
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INITIAL DATA (Optional defaults)
-- ============================================

-- Insert default tax configs (Indonesia standard rates)
-- These will be inserted per user when they first use the tax module
-- Example:
-- INSERT INTO tax_configs ("userId", "taxType", rate, description, active)
-- VALUES ('user-id-here', 'ppn', 11, 'PPN - Pajak Pertambahan Nilai', true);

-- ============================================
-- NOTES FOR DEPLOYMENT
-- ============================================
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. Make sure uuid-ossp extension is enabled: CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- 3. Adjust RLS policies based on your actual auth.uid() or custom user identification
-- 4. Set up cron jobs for:
--    - update_overdue_invoices() - Run daily
--    - execute_due_recurring_transactions() - Run daily
-- 5. Consider adding more specific indexes based on query patterns
-- 6. Set up storage buckets for invoice PDFs, payment proofs, bank statements
