-- ==============================================================================
-- FIX RLS PERFORMANCE ISSUES (REVISION 2)
-- Description: Optimizes Row Level Security policies by wrapping auth.uid() 
-- in a subquery (select auth.uid()) to prevent re-evaluation for every row.
-- FIXED: Corrected column names for 'budgets' table ("userId" instead of user_id).
-- ==============================================================================

-- 1. Table: advance_payments
DROP POLICY IF EXISTS "Users can view their own advance payments" ON advance_payments;
CREATE POLICY "Users can view their own advance payments"
  ON advance_payments FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own advance payments" ON advance_payments;
CREATE POLICY "Users can insert their own advance payments"
  ON advance_payments FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own advance payments" ON advance_payments;
CREATE POLICY "Users can update their own advance payments"
  ON advance_payments FOR UPDATE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own advance payments" ON advance_payments;
CREATE POLICY "Users can delete their own advance payments"
  ON advance_payments FOR DELETE
  USING ((select auth.uid()) = user_id);

-- 2. Table: cash_transfers
DROP POLICY IF EXISTS "Users can view own cash transfers" ON cash_transfers;
CREATE POLICY "Users can view own cash transfers"
  ON cash_transfers FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own cash transfers" ON cash_transfers;
CREATE POLICY "Users can insert own cash transfers"
  ON cash_transfers FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own cash transfers" ON cash_transfers;
CREATE POLICY "Users can update own cash transfers"
  ON cash_transfers FOR UPDATE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own cash transfers" ON cash_transfers;
CREATE POLICY "Users can delete own cash transfers"
  ON cash_transfers FOR DELETE
  USING ((select auth.uid()) = user_id);

-- 3. Table: budgets (USES camelCase "userId" and TEXT type)
DROP POLICY IF EXISTS "Users can view their own budgets" ON budgets;
CREATE POLICY "Users can view their own budgets"
  ON budgets FOR SELECT
  USING ((select auth.uid()::text) = "userId");

DROP POLICY IF EXISTS "Users can insert their own budgets" ON budgets;
CREATE POLICY "Users can insert their own budgets"
  ON budgets FOR INSERT
  WITH CHECK ((select auth.uid()::text) = "userId");

DROP POLICY IF EXISTS "Users can update their own budgets" ON budgets;
CREATE POLICY "Users can update their own budgets"
  ON budgets FOR UPDATE
  USING ((select auth.uid()::text) = "userId");

DROP POLICY IF EXISTS "Users can delete their own budgets" ON budgets;
CREATE POLICY "Users can delete their own budgets"
  ON budgets FOR DELETE
  USING ((select auth.uid()::text) = "userId");

-- 4. Table: cash_balances
DROP POLICY IF EXISTS "Users can view their own balances" ON cash_balances;
CREATE POLICY "Users can view their own balances"
  ON cash_balances FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own balances" ON cash_balances;
CREATE POLICY "Users can insert their own balances"
  ON cash_balances FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own balances" ON cash_balances;
CREATE POLICY "Users can update their own balances"
  ON cash_balances FOR UPDATE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own balances" ON cash_balances;
CREATE POLICY "Users can delete their own balances"
  ON cash_balances FOR DELETE
  USING ((select auth.uid()) = user_id);

-- 5. Table: income_entries
DROP POLICY IF EXISTS "Users can view own income" ON income_entries;
CREATE POLICY "Users can view own income"
  ON income_entries FOR SELECT
  USING ((select auth.uid()) = user_id);
  
DROP POLICY IF EXISTS "Users can insert own income" ON income_entries;
CREATE POLICY "Users can insert own income"
  ON income_entries FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);
  
DROP POLICY IF EXISTS "Users can update own income" ON income_entries;
CREATE POLICY "Users can update own income"
  ON income_entries FOR UPDATE
  USING ((select auth.uid()) = user_id);
  
DROP POLICY IF EXISTS "Users can delete own income" ON income_entries;
CREATE POLICY "Users can delete own income"
  ON income_entries FOR DELETE
  USING ((select auth.uid()) = user_id);

-- 6. Table: expense_entries
DROP POLICY IF EXISTS "Users can view own expenses" ON expense_entries;
CREATE POLICY "Users can view own expenses"
  ON expense_entries FOR SELECT
  USING ((select auth.uid()) = user_id);
  
DROP POLICY IF EXISTS "Users can insert own expenses" ON expense_entries;
CREATE POLICY "Users can insert own expenses"
  ON expense_entries FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);
  
DROP POLICY IF EXISTS "Users can update own expenses" ON expense_entries;
CREATE POLICY "Users can update own expenses"
  ON expense_entries FOR UPDATE
  USING ((select auth.uid()) = user_id);
  
DROP POLICY IF EXISTS "Users can delete own expenses" ON expense_entries;
CREATE POLICY "Users can delete own expenses"
  ON expense_entries FOR DELETE
  USING ((select auth.uid()) = user_id);

-- 7. Table: debt_entries
DROP POLICY IF EXISTS "Users can view own debts" ON debt_entries;
CREATE POLICY "Users can view own debts"
  ON debt_entries FOR SELECT
  USING ((select auth.uid()) = user_id);
  
DROP POLICY IF EXISTS "Users can insert own debts" ON debt_entries;
CREATE POLICY "Users can insert own debts"
  ON debt_entries FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);
  
DROP POLICY IF EXISTS "Users can update own debts" ON debt_entries;
CREATE POLICY "Users can update own debts"
  ON debt_entries FOR UPDATE
  USING ((select auth.uid()) = user_id);
  
DROP POLICY IF EXISTS "Users can delete own debts" ON debt_entries;
CREATE POLICY "Users can delete own debts"
  ON debt_entries FOR DELETE
  USING ((select auth.uid()) = user_id);

-- 8. Table: user_settings
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING ((select auth.uid()) = user_id);
  
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);
  
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING ((select auth.uid()) = user_id);
  
DROP POLICY IF EXISTS "Users can delete own settings" ON user_settings;
CREATE POLICY "Users can delete own settings"
  ON user_settings FOR DELETE
  USING ((select auth.uid()) = user_id);

-- 9. Table: cash_transactions (if exists)
DROP POLICY IF EXISTS "Users can insert their own transactions" ON cash_transactions;
CREATE POLICY "Users can insert their own transactions"
  ON cash_transactions FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own transactions" ON cash_transactions;
CREATE POLICY "Users can update their own transactions"
  ON cash_transactions FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own transactions" ON cash_transactions;
CREATE POLICY "Users can delete their own transactions"
  ON cash_transactions FOR DELETE USING ((select auth.uid()) = user_id);

-- 10. Table: fixed_assets
DROP POLICY IF EXISTS "Users can view own assets" ON fixed_assets;
CREATE POLICY "Users can view own assets"
  ON fixed_assets FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own assets" ON fixed_assets;
CREATE POLICY "Users can insert own assets"
  ON fixed_assets FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own assets" ON fixed_assets;
CREATE POLICY "Users can update own assets"
  ON fixed_assets FOR UPDATE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own assets" ON fixed_assets;
CREATE POLICY "Users can delete own assets"
  ON fixed_assets FOR DELETE
  USING ((select auth.uid()) = user_id);

-- 11. Table: asset_depreciation_history
DROP POLICY IF EXISTS "Users can view own depreciation" ON asset_depreciation_history;
CREATE POLICY "Users can view own depreciation"
  ON asset_depreciation_history FOR SELECT
  USING ((select auth.uid()) = user_id);
