-- Enable RLS
ALTER TABLE IF EXISTS public.salary_slips ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.salary_slips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    company_id UUID,
    employee_name TEXT NOT NULL,
    period TEXT NOT NULL, -- "YYYY-MM"
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Income
    basic_salary NUMERIC(15,2) DEFAULT 0,
    allowance_position NUMERIC(15,2) DEFAULT 0,
    allowance_transport NUMERIC(15,2) DEFAULT 0,
    allowance_meal NUMERIC(15,2) DEFAULT 0,
    bonus NUMERIC(15,2) DEFAULT 0,
    overtime NUMERIC(15,2) DEFAULT 0,
    
    -- Deductions
    deduction_loan NUMERIC(15,2) DEFAULT 0, -- Kasbon
    deduction_bpjs NUMERIC(15,2) DEFAULT 0,
    deduction_tax NUMERIC(15,2) DEFAULT 0,
    deduction_other NUMERIC(15,2) DEFAULT 0,
    
    -- Totals (Computed columns supported in Postgres 12+)
    -- For compatibility, we can calculate them in application or triggers, 
    -- but generated columns are better if supported.
    -- We will store them as regular columns for maximum compatibility if generated is tricky with Supabase UI sometimes
    total_income NUMERIC(15,2) DEFAULT 0,
    total_deduction NUMERIC(15,2) DEFAULT 0,
    net_salary NUMERIC(15,2) DEFAULT 0,
    
    status TEXT DEFAULT 'draft', -- draft, paid
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
CREATE POLICY "Users can view own salary slips" ON public.salary_slips
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own salary slips" ON public.salary_slips
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own salary slips" ON public.salary_slips
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own salary slips" ON public.salary_slips
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_salary_slips_user_id ON public.salary_slips(user_id);
CREATE INDEX IF NOT EXISTS idx_salary_slips_period ON public.salary_slips(period);
CREATE INDEX IF NOT EXISTS idx_salary_slips_employee ON public.salary_slips(employee_name);
