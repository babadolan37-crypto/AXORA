import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CashTransaction, CashBalance, CashType } from '../types/cash-management';

// Helper functions to map between camelCase (TypeScript) and snake_case (Database)
const mapBalanceFromDb = (dbBalance: any): CashBalance => ({
  id: dbBalance.id,
  cashType: dbBalance.cash_type,
  balance: dbBalance.balance,
  lastUpdated: dbBalance.last_updated
});

const mapTransactionFromDb = (dbTransaction: any): CashTransaction => ({
  id: dbTransaction.id,
  date: dbTransaction.date,
  cashType: dbTransaction.cash_type,
  transactionType: dbTransaction.transaction_type,
  amount: dbTransaction.amount,
  description: dbTransaction.description,
  proof: dbTransaction.proof,
  isInterCashTransfer: dbTransaction.is_inter_cash_transfer || false,
  linkedTransactionId: dbTransaction.linked_transaction_id,
  createdAt: dbTransaction.created_at,
  updatedAt: dbTransaction.updated_at
});

export function useCashManagement() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [balances, setBalances] = useState<CashBalance[]>([]);

  // Check if tables exist
  const checkTables = async () => {
    try {
      const { error: transactionsError } = await supabase
        .from('cash_transactions')
        .select('id')
        .limit(1);

      const { error: balancesError } = await supabase
        .from('cash_balances')
        .select('id')
        .limit(1);

      if (transactionsError || balancesError) {
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking tables:', error);
      return false;
    }
  };

  // Load transactions
  const loadTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('cash_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        // Check if it's a table doesn't exist error
        const errorMessage = error.message || '';
        if (errorMessage.includes('relation') || 
            errorMessage.includes('does not exist') ||
            errorMessage.includes('PGRST') ||
            errorMessage.includes('Failed to fetch')) {
          console.log('⚠️ Cash transactions table does not exist yet');
          return;
        }
        throw error;
      }

      const mappedTransactions = (data || []).map(mapTransactionFromDb);
      setTransactions(mappedTransactions);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      // Any error means table might not exist
    }
  };

  // Load balances
  const loadBalances = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('cash_balances')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        // Check if it's a table doesn't exist error
        const errorMessage = error.message || '';
        if (errorMessage.includes('relation') || 
            errorMessage.includes('does not exist') || 
            errorMessage.includes('PGRST') ||
            errorMessage.includes('Failed to fetch')) {
          console.log('⚠️ Cash balances table does not exist yet');
          return;
        }
        throw error;
      }

      console.log('📊 Balance data from DB:', data);

      // Initialize balances if not exists
      if (!data || data.length === 0) {
        await initializeBalances();
        return;
      }

      const mappedBalances = data.map(mapBalanceFromDb);
      setBalances(mappedBalances);
    } catch (error: any) {
      console.error('Error loading balances:', error);
      // Any error means table might not exist
    }
  };

  // Initialize balances for new user
  const initializeBalances = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const initialBalances = [
        {
          user_id: user.id,
          cash_type: 'big',
          balance: 0,
          last_updated: new Date().toISOString()
        },
        {
          user_id: user.id,
          cash_type: 'small',
          balance: 0,
          last_updated: new Date().toISOString()
        }
      ];

      const { data, error } = await supabase
        .from('cash_balances')
        .insert(initialBalances)
        .select();

      if (error) throw error;

      const mappedData: CashBalance[] = (data || []).map(mapBalanceFromDb);
      setBalances(mappedData);
    } catch (error) {
      console.error('Error initializing balances:', error);
    }
  };

  // Load all data
  const loadData = async () => {
    setLoading(true);
    const tablesExist = await checkTables();
    if (tablesExist) {
      await Promise.all([loadTransactions(), loadBalances()]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    // Listen for balance updates from external sources (e.g., TransactionSheet)
    const handleBalanceUpdate = () => {
      console.log('🔄 Balance update event received, reloading...');
      loadBalances();
    };

    // Listen for data reset event
    const handleDataReset = () => {
      console.log('🔄 Data reset event received, reloading all data...');
      loadData();
    };

    window.addEventListener('cashBalanceUpdated', handleBalanceUpdate);
    window.addEventListener('dataReset', handleDataReset);

    return () => {
      window.removeEventListener('cashBalanceUpdated', handleBalanceUpdate);
      window.removeEventListener('dataReset', handleDataReset);
    };
  }, []);

  // Add transaction
  const addTransaction = async (transaction: Omit<CashTransaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('cash_transactions')
        .insert([{
          user_id: user.id,
          date: transaction.date,
          cash_type: transaction.cashType,
          transaction_type: transaction.transactionType,
          amount: transaction.amount,
          description: transaction.description,
          proof: transaction.proof || '',
          is_inter_cash_transfer: transaction.isInterCashTransfer || false,
          linked_transaction_id: transaction.linkedTransactionId,
          created_at: now,
          updated_at: now
        }])
        .select()
        .maybeSingle();

      if (error) throw error;

      const mappedTransaction = mapTransactionFromDb(data);
      setTransactions((prev: CashTransaction[]) => [mappedTransaction, ...prev]);

      // Update balance
      const currentBalance = balances.find((b: CashBalance) => b.cashType === transaction.cashType)?.balance || 0;
      const newBalance = transaction.transactionType === 'income' 
        ? currentBalance + transaction.amount 
        : currentBalance - transaction.amount;
      
      await updateBalance(transaction.cashType, newBalance);
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  // Delete transaction
  const deleteTransaction = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get transaction to restore balance
      const transaction = transactions.find((t: CashTransaction) => t.id === id);
      if (!transaction) return;

      const { error } = await supabase
        .from('cash_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTransactions((prev: CashTransaction[]) => prev.filter((t: CashTransaction) => t.id !== id));

      // Restore balance (reverse the transaction)
      const currentBalance = balances.find((b: CashBalance) => b.cashType === transaction.cashType)?.balance || 0;
      const newBalance = transaction.transactionType === 'income'
        ? currentBalance - transaction.amount
        : currentBalance + transaction.amount;
      
      await updateBalance(transaction.cashType, newBalance);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  };

  // Set balance (for initial balance setup)
  const setBalance = async (cashType: CashType, newBalance: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const balance = balances.find((b: CashBalance) => b.cashType === cashType);
      if (!balance) return;

      const { data, error } = await supabase
        .from('cash_balances')
        .update({
          balance: newBalance,
          last_updated: new Date().toISOString()
        })
        .eq('id', balance.id)
        .eq('user_id', user.id)
        .select()
        .maybeSingle();

      if (error) throw error;

      setBalances((prev: CashBalance[]) => prev.map((b: CashBalance) => b.id === balance.id ? mapBalanceFromDb(data) : b));
    } catch (error) {
      console.error('Error setting balance:', error);
      throw error;
    }
  };

  // Update balance (internal function)
  const updateBalance = async (cashType: CashType, newBalance: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const balance = balances.find(b => b.cashType === cashType);
      if (!balance) return;

      const { data, error } = await supabase
        .from('cash_balances')
        .update({
          balance: newBalance,
          last_updated: new Date().toISOString()
        })
        .eq('id', balance.id)
        .eq('user_id', user.id)
        .select()
        .maybeSingle();

      if (error) throw error;

      setBalances(prev => prev.map(b => b.id === balance.id ? mapBalanceFromDb(data) : b));
    } catch (error) {
      console.error('Error updating balance:', error);
      throw error;
    }
  };

  // Add inter-cash transfer (creates 2 linked transactions)
  const addInterCashTransfer = async (transfer: {
    date: string;
    fromCash: CashType;
    toCash: CashType;
    amount: number;
    description: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const now = new Date().toISOString();

      // Create first transaction (debit from source)
      const { data: debitTransaction, error: debitError } = await supabase
        .from('cash_transactions')
        .insert([{
          user_id: user.id,
          date: transfer.date,
          cash_type: transfer.fromCash, // Ensure this is not null
          transaction_type: 'expense', // Fixed: 'out' -> 'expense' to match check constraint
          amount: transfer.amount,
          description: `${transfer.description} [Transfer ke ${transfer.toCash === 'big' ? 'Kas Besar' : 'Kas Kecil'}]`,
          proof: [],
          is_inter_cash_transfer: true,
          linked_transaction_id: null, // Will update after second transaction
          created_at: now,
          updated_at: now
        }])
        .select()
        .maybeSingle();

      if (debitError) {
        console.error('Error creating debit transaction:', debitError);
        throw new Error(`Gagal membuat transaksi debit: ${debitError.message}`);
      }

      // Create second transaction (credit to destination)
      const { data: creditTransaction, error: creditError } = await supabase
        .from('cash_transactions')
        .insert([{
          user_id: user.id,
          date: transfer.date,
          cash_type: transfer.toCash,
          transaction_type: 'income', // Fixed: 'in' -> 'income' to match check constraint
          amount: transfer.amount,
          description: `${transfer.description} [Transfer dari ${transfer.fromCash === 'big' ? 'Kas Besar' : 'Kas Kecil'}]`,
          proof: [],
          is_inter_cash_transfer: true,
          linked_transaction_id: debitTransaction.id,
          created_at: now,
          updated_at: now
        }])
        .select()
        .maybeSingle();

      if (creditError) {
        console.error('Error creating credit transaction:', creditError);
        // Rollback: delete the first transaction
        await supabase
          .from('cash_transactions')
          .delete()
          .eq('id', debitTransaction.id);
        throw new Error(`Gagal membuat transaksi kredit: ${creditError.message}`);
      }

      // Update debit transaction with linked ID
      const { error: updateError } = await supabase
        .from('cash_transactions')
        .update({ linked_transaction_id: creditTransaction.id })
        .eq('id', debitTransaction.id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating linked transaction:', updateError);
        // Continue anyway, the transactions are created
      }

      // Map transactions
      const mappedDebit = mapTransactionFromDb({ ...debitTransaction, linked_transaction_id: creditTransaction.id });
      const mappedCredit = mapTransactionFromDb(creditTransaction);

      // Add to state
      setTransactions((prev: CashTransaction[]) => [mappedDebit, mappedCredit, ...prev]);

      // Update both balances
      const fromBalance = balances.find((b: CashBalance) => b.cashType === transfer.fromCash)?.balance || 0;
      const toBalance = balances.find((b: CashBalance) => b.cashType === transfer.toCash)?.balance || 0;

      await updateBalance(transfer.fromCash, fromBalance - transfer.amount);
      await updateBalance(transfer.toCash, toBalance + transfer.amount);
    } catch (error: any) {
      console.error('Error adding inter-cash transfer:', error);
      throw error;
    }
  };

  return {
    loading,
    transactions,
    balances,
    addTransaction,
    deleteTransaction,
    setBalance,
    addInterCashTransfer,
    transferCash: addInterCashTransfer, // Alias untuk QuickCashTransferModal
    refreshData: loadData
  };
}