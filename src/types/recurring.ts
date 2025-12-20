// Types for Recurring Transactions Module

export type RecurringInterval = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  interval: RecurringInterval;
  startDate: string;
  endDate?: string; // Optional, null means indefinite
  nextExecutionDate: string;
  lastExecutionDate?: string;
  active: boolean;
  autoExecute: boolean; // If false, requires manual confirmation
  employee?: string; // For expenses
  cashType?: 'big' | 'small'; // For cash transactions
  createdAt: string;
  userId: string;
}

export interface RecurringExecutionLog {
  id: string;
  recurringTransactionId: string;
  executedAt: string;
  transactionId: string; // Link to actual income/expense entry
  status: 'success' | 'failed' | 'skipped';
  notes?: string;
}
