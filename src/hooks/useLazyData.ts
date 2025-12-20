import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { IncomeEntry, ExpenseEntry, DebtEntry } from '../types';

interface LazyDataCache {
  incomeEntries?: { data: IncomeEntry[]; timestamp: number };
  expenseEntries?: { data: ExpenseEntry[]; timestamp: number };
  debtEntries?: { data: DebtEntry[]; timestamp: number };
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useLazyData() {
  const [cache, setCache] = useState<LazyDataCache>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const isCacheValid = (cacheEntry?: { timestamp: number }) => {
    if (!cacheEntry) return false;
    return Date.now() - cacheEntry.timestamp < CACHE_DURATION;
  };

  const setLoading = (key: string, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  // Lazy load income entries with pagination
  const loadIncomeEntries = useCallback(async (limit = 100, offset = 0, forceRefresh = false) => {
    if (!forceRefresh && isCacheValid(cache.incomeEntries)) {
      return cache.incomeEntries!.data;
    }

    setLoading('income', true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('income_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const entries = (data || []) as IncomeEntry[];
      setCache(prev => ({
        ...prev,
        incomeEntries: { data: entries, timestamp: Date.now() }
      }));

      return entries;
    } catch (error) {
      console.error('Error loading income entries:', error);
      return [];
    } finally {
      setLoading('income', false);
    }
  }, [cache.incomeEntries]);

  // Lazy load expense entries with pagination
  const loadExpenseEntries = useCallback(async (limit = 100, offset = 0, forceRefresh = false) => {
    if (!forceRefresh && isCacheValid(cache.expenseEntries)) {
      return cache.expenseEntries!.data;
    }

    setLoading('expense', true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('expense_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const entries = (data || []) as ExpenseEntry[];
      setCache(prev => ({
        ...prev,
        expenseEntries: { data: entries, timestamp: Date.now() }
      }));

      return entries;
    } catch (error) {
      console.error('Error loading expense entries:', error);
      return [];
    } finally {
      setLoading('expense', false);
    }
  }, [cache.expenseEntries]);

  // Lazy load debt entries
  const loadDebtEntries = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && isCacheValid(cache.debtEntries)) {
      return cache.debtEntries!.data;
    }

    setLoading('debt', true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('debt_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      const entries = (data || []) as DebtEntry[];
      setCache(prev => ({
        ...prev,
        debtEntries: { data: entries, timestamp: Date.now() }
      }));

      return entries;
    } catch (error) {
      console.error('Error loading debt entries:', error);
      return [];
    } finally {
      setLoading('debt', false);
    }
  }, [cache.debtEntries]);

  // Clear cache for specific data type
  const clearCache = useCallback((type?: keyof LazyDataCache) => {
    if (type) {
      setCache(prev => {
        const newCache = { ...prev };
        delete newCache[type];
        return newCache;
      });
    } else {
      setCache({});
    }
  }, []);

  return {
    loadIncomeEntries,
    loadExpenseEntries,
    loadDebtEntries,
    clearCache,
    loadingStates,
    isLoading: Object.values(loadingStates).some(Boolean)
  };
}
