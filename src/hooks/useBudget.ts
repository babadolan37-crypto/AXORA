import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Budget, BudgetSummary, BudgetActual } from '../types/budget';
import { IncomeEntry, ExpenseEntry } from '../types/accounting';

export function useBudget(incomeEntries: IncomeEntry[], expenseEntries: ExpenseEntry[]) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('userId', user.id)
        .order('month', { ascending: false });

      if (error) {
        // If table doesn't exist, just return empty array silently
        if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
          // Silent mode - no console warnings
          setBudgets([]);
          setLoading(false);
          return;
        }
        throw error;
      }
      setBudgets(data || []);
    } catch (error) {
      // Silent error handling
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  };

  const addBudget = async (budget: Omit<Budget, 'id' | 'createdAt' | 'userId'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('budgets')
        .insert([{
          ...budget,
          userId: user.id,
          createdAt: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      setBudgets([data, ...budgets]);
      return data;
    } catch (error) {
      console.error('Error adding budget:', error);
      throw error;
    }
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setBudgets(budgets.map(b => b.id === id ? { ...b, ...updates } : b));
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setBudgets(budgets.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  };

  const getBudgetSummary = (month: string): BudgetSummary => {
    const monthBudgets = budgets.filter(b => b.month === month);
    
    // Get actual transactions for the month
    const [year, monthNum] = month.split('-');
    const actualIncomes = incomeEntries.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === parseInt(year) && (d.getMonth() + 1) === parseInt(monthNum);
    });
    const actualExpenses = expenseEntries.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === parseInt(year) && (d.getMonth() + 1) === parseInt(monthNum);
    });

    // Calculate by category
    const categories: BudgetActual[] = [];
    
    // Income categories
    const incomeBudgets = monthBudgets.filter(b => b.type === 'income');
    incomeBudgets.forEach(budget => {
      const actual = actualIncomes
        .filter(i => i.category === budget.category)
        .reduce((sum, i) => sum + i.amount, 0);
      const variance = actual - budget.amount;
      const variancePercent = budget.amount > 0 ? (variance / budget.amount) * 100 : 0;
      
      categories.push({
        category: budget.category,
        budgeted: budget.amount,
        actual,
        variance,
        variancePercent,
        status: variance < -budget.amount * 0.1 ? 'under' : variance > budget.amount * 0.1 ? 'over' : 'on-track',
      });
    });

    // Expense categories
    const expenseBudgets = monthBudgets.filter(b => b.type === 'expense');
    expenseBudgets.forEach(budget => {
      const actual = actualExpenses
        .filter(e => e.category === budget.category)
        .reduce((sum, e) => sum + e.amount, 0);
      const variance = budget.amount - actual; // For expenses, positive variance is good (under budget)
      const variancePercent = budget.amount > 0 ? (variance / budget.amount) * 100 : 0;
      
      categories.push({
        category: budget.category,
        budgeted: budget.amount,
        actual,
        variance,
        variancePercent,
        status: actual > budget.amount * 1.1 ? 'over' : actual < budget.amount * 0.9 ? 'under' : 'on-track',
      });
    });

    return {
      month,
      totalBudgetIncome: incomeBudgets.reduce((sum, b) => sum + b.amount, 0),
      totalActualIncome: actualIncomes.reduce((sum, i) => sum + i.amount, 0),
      totalBudgetExpense: expenseBudgets.reduce((sum, b) => sum + b.amount, 0),
      totalActualExpense: actualExpenses.reduce((sum, e) => sum + e.amount, 0),
      categories,
    };
  };

  return {
    budgets,
    loading,
    addBudget,
    updateBudget,
    deleteBudget,
    getBudgetSummary,
    refetch: fetchBudgets,
  };
}