// Types for Budgeting Module

export interface Budget {
  id: string;
  category: string;
  month: string; // YYYY-MM
  amount: number;
  type: 'income' | 'expense';
  notes?: string;
  createdAt: string;
  userId: string;
}

export interface BudgetActual {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
  status: 'under' | 'on-track' | 'over';
}

export interface BudgetSummary {
  month: string;
  totalBudgetIncome: number;
  totalActualIncome: number;
  totalBudgetExpense: number;
  totalActualExpense: number;
  categories: BudgetActual[];
}
