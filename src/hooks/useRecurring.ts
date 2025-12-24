import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { RecurringTransaction, RecurringInterval } from '../types/recurring';

export function useRecurring() {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecurring();
  }, []);

  const fetchRecurring = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*')
        .eq('userId', user.id)
        .order('nextExecutionDate', { ascending: true });

      if (error) {
        // If table doesn't exist, just return empty array silently
        if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
          // Silent mode - no console warnings
          setRecurring([]);
          setLoading(false);
          return;
        }
        throw error;
      }
      setRecurring(data || []);
    } catch (error) {
      // Silent error handling
      setRecurring([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateNextExecutionDate = (
    startDate: string,
    interval: RecurringInterval,
    lastExecution?: string
  ): string => {
    const base = lastExecution ? new Date(lastExecution) : new Date(startDate);
    const next = new Date(base);

    switch (interval) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'biweekly':
        next.setDate(next.getDate() + 14);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + 3);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }

    return next.toISOString().split('T')[0];
  };

  const addRecurring = async (
    transaction: Omit<RecurringTransaction, 'id' | 'createdAt' | 'userId' | 'nextExecutionDate'>
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const nextExecutionDate = calculateNextExecutionDate(
        transaction.startDate,
        transaction.interval
      );

      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert([{
          ...transaction,
          nextExecutionDate,
          userId: user.id,
          createdAt: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      setRecurring([...recurring, data]);
      return data;
    } catch (error) {
      console.error('Error adding recurring:', error);
      throw error;
    }
  };

  const updateRecurring = async (id: string, updates: Partial<RecurringTransaction>) => {
    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setRecurring(recurring.map(r => r.id === id ? { ...r, ...updates } : r));
    } catch (error) {
      console.error('Error updating recurring:', error);
      throw error;
    }
  };

  const deleteRecurring = async (id: string) => {
    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRecurring(recurring.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting recurring:', error);
      throw error;
    }
  };

  const executeRecurring = async (id: string, createTransaction: (data: any) => Promise<any>) => {
    try {
      const transaction = recurring.find(r => r.id === id);
      if (!transaction) throw new Error('Transaction not found');

      // Create the actual transaction
      const result = await createTransaction({
        type: transaction.type,
        category: transaction.category,
        description: transaction.description,
        amount: transaction.amount,
        date: new Date().toISOString().split('T')[0],
        employee: transaction.employee,
        cashType: transaction.cashType,
      });

      // Update next execution date
      const nextExecutionDate = calculateNextExecutionDate(
        transaction.startDate,
        transaction.interval,
        new Date().toISOString().split('T')[0]
      );

      await updateRecurring(id, {
        lastExecutionDate: new Date().toISOString().split('T')[0],
        nextExecutionDate,
      });

      // Log execution
      await supabase.from('recurring_execution_logs').insert([{
        recurringTransactionId: id,
        executedAt: new Date().toISOString(),
        transactionId: result.id,
        status: 'success',
      }]);

      return result;
    } catch (error) {
      console.error('Error executing recurring:', error);
      
      // Log failed execution
      await supabase.from('recurring_execution_logs').insert([{
        recurringTransactionId: id,
        executedAt: new Date().toISOString(),
        status: 'failed',
        notes: error instanceof Error ? error.message : 'Unknown error',
      }]);
      
      throw error;
    }
  };

  const checkDueRecurring = () => {
    const today = new Date().toISOString().split('T')[0];
    return recurring.filter(
      r => r.active && r.nextExecutionDate <= today && (!r.endDate || r.endDate >= today)
    );
  };

  return {
    recurring,
    loading,
    addRecurring,
    updateRecurring,
    deleteRecurring,
    executeRecurring,
    checkDueRecurring,
    refetch: fetchRecurring,
  };
}