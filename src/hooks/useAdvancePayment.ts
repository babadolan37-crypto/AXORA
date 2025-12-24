import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface AdvanceExpenseItem {
  id: string;
  description: string;
  amount: number;
  receipt_url?: string;
  notes?: string;
}

export interface AdvancePayment {
  id: string;
  user_id: string;
  employee_name: string;
  advance_amount: number;
  advance_date: string;
  cash_type: 'big' | 'small';
  status: 'pending' | 'settled' | 'returned';
  actual_expenses: number;
  expense_items: AdvanceExpenseItem[];
  settlement_date?: string;
  difference: number; // positive = lebih bayar (harus dikembalikan), negative = kurang bayar (harus dibayar)
  return_date?: string;
  return_amount?: number;
  return_method?: string;
  notes?: string;
  created_at: string;
}

export function useAdvancePayment() {
  const [advances, setAdvances] = useState<AdvancePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAdvances();
  }, []);

  const loadAdvances = async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error: fetchError } = await supabase
        .from('advance_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        // Check if table doesn't exist (PGRST205 or relation does not exist)
        if (
          fetchError.code === 'PGRST205' || 
          fetchError.message.includes('relation "public.advance_payments" does not exist') ||
          fetchError.message.includes('Could not find the table')
        ) {
          setError('TABLE_NOT_EXIST');
        } else {
          console.error('Error loading advances:', fetchError);
          setError('UNKNOWN_ERROR');
        }
        return;
      }

      setAdvances(data || []);
    } catch (error: any) {
      console.error('Error loading advances:', error);
      setError(error?.code === 'PGRST205' ? 'TABLE_NOT_EXIST' : 'UNKNOWN_ERROR');
    } finally {
      setLoading(false);
    }
  };

  const createAdvance = async (
    employeeName: string,
    advanceAmount: number,
    advanceDate: string,
    cashType: 'big' | 'small',
    notes?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const newAdvance = {
        user_id: user.id,
        employee_name: employeeName,
        advance_amount: advanceAmount,
        advance_date: advanceDate,
        cash_type: cashType,
        status: 'pending',
        actual_expenses: 0,
        expense_items: [],
        difference: 0,
        notes: notes || '',
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('advance_payments')
        .insert([newAdvance])
        .select()
        .maybeSingle();

      if (error) throw error;

      await loadAdvances();
      return data;
    } catch (error) {
      console.error('Error creating advance:', error);
      throw error;
    }
  };

  const settleAdvance = async (
    advanceId: string,
    expenseItems: AdvanceExpenseItem[],
    settlementDate: string
  ) => {
    try {
      const advance = advances.find(a => a.id === advanceId);
      if (!advance) throw new Error('Advance not found');

      const actualExpenses = expenseItems.reduce((sum, item) => sum + item.amount, 0);
      const difference = advance.advance_amount - actualExpenses;

      const { error } = await supabase
        .from('advance_payments')
        .update({
          actual_expenses: actualExpenses,
          expense_items: expenseItems,
          difference: difference,
          settlement_date: settlementDate,
          status: difference === 0 ? 'settled' : 'pending',
        })
        .eq('id', advanceId);

      if (error) throw error;

      await loadAdvances();
    } catch (error) {
      console.error('Error settling advance:', error);
      throw error;
    }
  };

  const recordReturn = async (
    advanceId: string,
    returnAmount: number,
    returnDate: string,
    returnMethod: string
  ) => {
    try {
      const { error } = await supabase
        .from('advance_payments')
        .update({
          return_amount: returnAmount,
          return_date: returnDate,
          return_method: returnMethod,
          status: 'returned',
        })
        .eq('id', advanceId);

      if (error) throw error;

      await loadAdvances();
    } catch (error) {
      console.error('Error recording return:', error);
      throw error;
    }
  };

  const deleteAdvance = async (advanceId: string) => {
    try {
      const { error } = await supabase
        .from('advance_payments')
        .delete()
        .eq('id', advanceId);

      if (error) throw error;

      await loadAdvances();
    } catch (error) {
      console.error('Error deleting advance:', error);
      throw error;
    }
  };

  return {
    advances,
    loading,
    error,
    createAdvance,
    settleAdvance,
    recordReturn,
    deleteAdvance,
    refreshAdvances: loadAdvances,
  };
}