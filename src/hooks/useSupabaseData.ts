import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { IncomeEntry, ExpenseEntry, DebtEntry } from '../types';
import { DEFAULT_INCOME_SOURCES, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_PAYMENT_METHODS } from '../types/accounting';
import type { User } from '@supabase/gotrue-js';
import { useAuditLog } from './useAuditLog';

export function useSupabaseData() {
  const [user, setUser] = useState<User | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  const [incomeSources, setIncomeSources] = useState<string[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [employees, setEmployees] = useState<string[]>([]);
  
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([]);
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([]);
  const [debtEntries, setDebtEntries] = useState<DebtEntry[]>([]);
  
  // Audit log hook
  const { logAction } = useAuditLog();

  // Get current user and company from Supabase
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user || null);
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .maybeSingle();
        setCompanyId(profile?.company_id || null);
      } else {
        setCompanyId(null);
        // Clear data on logout
        setIncomeEntries([]);
        setExpenseEntries([]);
        setDebtEntries([]);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', currentUser.id)
          .maybeSingle();
        setCompanyId(profile?.company_id || null);
      } else {
        setCompanyId(null);
        // Clear data on logout
        setIncomeEntries([]);
        setExpenseEntries([]);
        setDebtEntries([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load all data
  useEffect(() => {
    if (!user) return;
    loadAllData();
  }, [user, companyId]);

  // Listen for cashBalanceUpdated event to reload entries
  useEffect(() => {
    const handleCashBalanceUpdate = () => {
      loadIncomeEntries();
      loadExpenseEntries();
    };

    window.addEventListener('cashBalanceUpdated', handleCashBalanceUpdate);

    return () => {
      window.removeEventListener('cashBalanceUpdated', handleCashBalanceUpdate);
    };
  }, [user]);

  const loadAllData = async () => {
    if (!user) return;
    
    // Check connectivity first
    if (!navigator.onLine) {
      console.log('📴 Offline: Skipping data fetch');
      setIsOffline(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // PHASE 1: Load CRITICAL data first (settings only)
      await Promise.all([
        loadIncomeSources(),
        loadExpenseCategories(),
        loadPaymentMethods(),
        loadEmployees(),
      ]);

      // Set loading to false immediately after settings loaded
      // User can now interact with the app
      setLoading(false);

      // PHASE 2: Load HEAVY data in background (non-blocking)
      // This happens after user sees the interface
      setTimeout(async () => {
        await Promise.all([
          loadIncomeEntries(),
          loadExpenseEntries(),
          loadDebtEntries(),
        ]);
      }, 100); // Small delay to let UI render first

    } catch (error) {
      console.error('Error loading data:', error);
      
      // Check if it's a table not found error
      if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST205') {
        console.warn('⚠️ SUPABASE TABLES NOT FOUND - Setup required!');
      }
      setLoading(false);
    }
  };

  // Income Sources
  const loadIncomeSources = async () => {
    let data, error;
    if (companyId) {
      const result = await supabase
        .from('company_settings')
        .select('income_sources')
        .eq('company_id', companyId)
        .single();
      data = result.data;
      error = result.error;
    } else {
      const result = await supabase
        .from('user_settings')
        .select('income_sources')
        .eq('user_id', user?.id)
        .single();
      data = result.data;
      error = result.error;
    }
    if (!error && data && data.income_sources) {
      setIncomeSources(data.income_sources);
    } else {
      setIncomeSources(DEFAULT_INCOME_SOURCES);
    }
  };

  const saveIncomeSources = async (sources: string[]) => {
    if (companyId) {
      const { error } = await supabase
        .from('company_settings')
        .upsert({
          company_id: companyId,
          income_sources: sources,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'company_id'
        });
      if (error) {
        console.error('Error saving company income sources:', error);
        alert('Gagal menyimpan pengaturan perusahaan. Pastikan Anda memiliki akses Admin/Owner.');
        return;
      }
      setIncomeSources(sources);
    } else {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          income_sources: sources,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      if (!error) {
        setIncomeSources(sources);
      }
    }
  };

  // Expense Categories
  const loadExpenseCategories = async () => {
    let data, error;
    if (companyId) {
      const result = await supabase
        .from('company_settings')
        .select('expense_categories')
        .eq('company_id', companyId)
        .single();
      data = result.data;
      error = result.error;
    } else {
      const result = await supabase
        .from('user_settings')
        .select('expense_categories')
        .eq('user_id', user?.id)
        .single();
      data = result.data;
      error = result.error;
    }
    if (!error && data && data.expense_categories) {
      setExpenseCategories(data.expense_categories);
    } else {
      setExpenseCategories(DEFAULT_EXPENSE_CATEGORIES);
    }
  };

  const saveExpenseCategories = async (categories: string[]) => {
    if (companyId) {
      const { error } = await supabase
        .from('company_settings')
        .upsert({
          company_id: companyId,
          expense_categories: categories,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'company_id'
        });
      if (error) {
        console.error('Error saving company expense categories:', error);
        alert('Gagal menyimpan pengaturan perusahaan. Pastikan Anda memiliki akses Admin/Owner.');
        return;
      }
      setExpenseCategories(categories);
    } else {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          expense_categories: categories,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      if (!error) {
        setExpenseCategories(categories);
      }
    }
  };

  // Payment Methods
  const loadPaymentMethods = async () => {
    let data, error;
    if (companyId) {
      const result = await supabase
        .from('company_settings')
        .select('payment_methods')
        .eq('company_id', companyId)
        .single();
      data = result.data;
      error = result.error;
    } else {
      const result = await supabase
        .from('user_settings')
        .select('payment_methods')
        .eq('user_id', user?.id)
        .single();
      data = result.data;
      error = result.error;
    }
    if (!error && data && data.payment_methods) {
      setPaymentMethods(data.payment_methods);
    } else {
      setPaymentMethods(DEFAULT_PAYMENT_METHODS);
    }
  };

  const savePaymentMethods = async (methods: string[]) => {
    if (companyId) {
      const { error } = await supabase
        .from('company_settings')
        .upsert({
          company_id: companyId,
          payment_methods: methods,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'company_id'
        });
      if (error) {
        console.error('Error saving company payment methods:', error);
        alert('Gagal menyimpan pengaturan perusahaan. Pastikan Anda memiliki akses Admin/Owner.');
        return;
      }
      setPaymentMethods(methods);
    } else {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          payment_methods: methods,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      if (!error) {
        setPaymentMethods(methods);
      }
    }
  };

  // Employees
  const loadEmployees = async () => {
    let data, error;
    if (companyId) {
      const result = await supabase
        .from('company_settings')
        .select('employees')
        .eq('company_id', companyId)
        .single();
      data = result.data;
      error = result.error;
      if (error && error.code === 'PGRST204') {
        const userRes = await supabase
          .from('user_settings')
          .select('employees')
          .eq('user_id', user?.id)
          .single();
        data = userRes.data;
        error = userRes.error;
      }
    } else {
      const result = await supabase
        .from('user_settings')
        .select('employees')
        .eq('user_id', user?.id)
        .single();
      data = result.data;
      error = result.error;
    }
    if (!error && data && data.employees) {
      setEmployees(data.employees);
    } else {
      setEmployees([]);
    }
  };

  const saveEmployees = async (employeeList: string[]) => {
    if (companyId) {
      const { error } = await supabase
        .from('company_settings')
        .upsert({
          company_id: companyId,
          employees: employeeList,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'company_id'
        });
      if (error) {
        if (error.code === 'PGRST204') {
          const { error: userError } = await supabase
            .from('user_settings')
            .upsert({
              user_id: user?.id,
              employees: employeeList,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            });
          if (userError) {
            console.error('Error saving fallback employees:', userError);
            alert('Gagal menyimpan daftar karyawan.');
            return;
          }
          setEmployees(employeeList);
          return;
        }
        console.error('Error saving company employees:', error);
        alert('Gagal menyimpan pengaturan perusahaan. Pastikan Anda memiliki akses Admin/Owner.');
        return;
      }
      setEmployees(employeeList);
    } else {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          employees: employeeList,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      if (!error) {
        setEmployees(employeeList);
      }
    }
  };

  // Income Entries
  const loadIncomeEntries = async () => {
    const { data, error } = await supabase
      .from('income_entries')
      .select('*')
      .eq('user_id', user?.id)
      .order('date', { ascending: false })
      .limit(200); // LIMIT: Load only last 200 entries for faster loading
    
    if (!error && data) {
      setIncomeEntries(data.map(item => ({
        id: item.id,
        date: item.date,
        source: item.source,
        description: item.description || '',
        amount: parseFloat(item.amount),
        paymentMethod: item.payment_method,
        notes: item.notes || '',
        photos: item.photos || [],
        receivedFrom: item.received_from || '',
        cashType: item.cash_type || 'big' // Default ke Kas Besar jika tidak ada
      })));
    }
  };

  const addIncomeEntry = async (entry: Omit<IncomeEntry, 'id'>) => {
    // Prepare data object
    const dataToInsert: any = {
      user_id: user?.id,
      date: entry.date,
      source: entry.source,
      description: entry.description,
      amount: entry.amount,
      payment_method: entry.paymentMethod,
      notes: entry.notes,
      photos: entry.photos,
      received_from: entry.receivedFrom,
    };
    
    // Try with cash_type first
    const { data, error } = await supabase
      .from('income_entries')
      .insert({
        ...dataToInsert,
        cash_type: entry.cashType || 'big' // Default ke Kas Besar
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding income entry:', error);
      
      // Check if it's a "column not found" error (PGRST204) - cash_type doesn't exist yet
      if (error.code === 'PGRST204' && error.message.includes('cash_type')) {
        console.warn('⚠️ cash_type column not found, retrying without it...');
        
        try {
          // Retry without cash_type for backward compatibility
          const { data: retryData, error: retryError } = await supabase
            .from('income_entries')
            .insert(dataToInsert)
            .select()
            .single();
          
          if (retryError) {
            console.error('❌ Retry error:', retryError);
            alert(`Gagal menambahkan pemasukan: ${retryError.message}\n\n⚠️ Mohon jalankan SQL migration untuk menambahkan kolom cash_type.`);
            return;
          }
          
          if (retryData) {
            console.log('✅ Retry SUCCESS! Data saved:', retryData);
            await loadIncomeEntries();
            
            // IMPORTANT: Update cash balance (even without cash_type, default to 'big')
            await updateCashBalance(entry.cashType || 'big', entry.amount, entry.date, entry.description || entry.source, true);
            
            alert('✅ Pemasukan berhasil ditambahkan!\n\n⚠️ Catatan: Fitur Kas Besar/Kecil belum aktif. Jalankan SQL migration untuk mengaktifkannya.');
            return;
          }
          
          // If we got here, something unexpected happened
          console.error('❌ Unexpected: No data returned from retry');
          alert('⚠️ Terjadi kesalahan tidak terduga saat menyimpan data.');
          return;
          
        } catch (retryException) {
          console.error('❌ Exception during retry:', retryException);
          alert(`Gagal menambahkan pemasukan: ${retryException}`);
          return;
        }
      }
      
      // Check if it's a "table not found" error (PGRST205)
      if (error.code === 'PGRST205') {
        return;
      }
      
      alert(`Gagal menambahkan pemasukan: ${error.message}`);
      return;
    }
    
    if (data) {
      await loadIncomeEntries();
      
      // IMPORTANT: Update cash balance
      await updateCashBalance(entry.cashType || 'big', entry.amount, entry.date, entry.description || entry.source, true);
      
      alert('✅ Pemasukan berhasil ditambahkan!');
    }
  };

  const updateIncomeEntry = async (id: string, entry: Omit<IncomeEntry, 'id'>) => {
    console.log('🔄 Starting updateIncomeEntry for ID:', id);
    
    // Prepare update data
    const dataToUpdate: any = {
      date: entry.date,
      source: entry.source,
      description: entry.description,
      amount: entry.amount,
      payment_method: entry.paymentMethod,
      notes: entry.notes,
      photos: entry.photos,
      received_from: entry.receivedFrom,
      updated_at: new Date().toISOString()
    };
    
    console.log('📦 Update data:', dataToUpdate);
    
    // Try with cash_type first
    const { error } = await supabase
      .from('income_entries')
      .update({
        ...dataToUpdate,
        cash_type: entry.cashType || 'big',
      })
      .eq('id', id)
      .eq('user_id', user?.id);
    
    // If cash_type column doesn't exist, retry without it
    if (error && error.code === 'PGRST204' && error.message.includes('cash_type')) {
      console.warn('⚠️ cash_type column not found in update, retrying without it...');
      
      try {
        const { error: retryError } = await supabase
          .from('income_entries')
          .update(dataToUpdate)
          .eq('id', id)
          .eq('user_id', user?.id);
        
        if (retryError) {
          console.error('❌ Retry UPDATE failed:', retryError);
          alert(`Gagal mengupdate pemasukan: ${retryError.message}`);
          return;
        }
        
        console.log('✅ Retry UPDATE SUCCESS!');
        await loadIncomeEntries();
        return;
        
      } catch (retryException) {
        console.error('❌ Exception during retry update:', retryException);
        alert(`Gagal mengupdate pemasukan: ${retryException}`);
        return;
      }
    }
    
    if (error) {
      console.error('❌ Update error:', error);
      alert(`Gagal mengupdate pemasukan: ${error.message}`);
      return;
    }
    
    console.log('✅ Update SUCCESS (with cash_type)!');
    await loadIncomeEntries();
  };

  const deleteIncomeEntry = async (id: string) => {
    // 1. Get the entry data first before deleting
    const { data: entryToDelete, error: fetchError } = await supabase
      .from('income_entries')
      .select('*')
      .eq('id', id)
      .eq('user_id', user?.id)
      .single();
    
    if (fetchError || !entryToDelete) {
      console.error('❌ Error fetching income entry to delete:', fetchError);
      alert('Gagal menghapus: Data tidak ditemukan');
      return;
    }

    // 2. Delete the entry
    const { error: deleteError } = await supabase
      .from('income_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user?.id);
    
    if (deleteError) {
      console.error('❌ Error deleting income entry:', deleteError);
      alert(`Gagal menghapus: ${deleteError.message}`);
      return;
    }

    // 3. Reverse the cash balance (subtract income amount)
    const cashType = entryToDelete.cash_type || 'big';
    const amount = entryToDelete.amount || 0;
    
    const { data: currentBalance } = await supabase
      .from('cash_balances')
      .select('balance')
      .eq('user_id', user?.id)
      .eq('cash_type', cashType)
      .single();
    
    const newBalance = (currentBalance?.balance || 0) - amount;
    
    await supabase
      .from('cash_balances')
      .upsert({
        user_id: user?.id,
        cash_type: cashType,
        balance: newBalance,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,cash_type'
      });

    // 4. Log audit trail
    await logAction(
      'delete',
      'income',
      id,
      `Hapus pemasukan: ${entryToDelete.description || entryToDelete.source} - Rp ${amount.toLocaleString('id-ID')} (${cashType === 'big' ? 'Kas Besar' : 'Kas Kecil'}). Saldo dikembalikan.`
    );

    console.log(`✅ Income deleted & balance reversed: -Rp ${amount.toLocaleString('id-ID')} from ${cashType === 'big' ? 'Kas Besar' : 'Kas Kecil'}`);
    
    await loadIncomeEntries();
  };

  // Expense Entries
  const loadExpenseEntries = async () => {
    const { data, error } = await supabase
      .from('expense_entries')
      .select('*')
      .eq('user_id', user?.id)
      .order('date', { ascending: false })
      .limit(200); // LIMIT: Load only last 200 entries for faster loading
    
    if (!error && data) {
      setExpenseEntries(data.map(item => ({
        id: item.id,
        date: item.date,
        category: item.category,
        description: item.description || '',
        amount: parseFloat(item.amount),
        paymentMethod: item.payment_method,
        notes: item.notes || '',
        photos: item.photos || [],
        paidTo: item.paid_to || '',
        cashType: item.cash_type || 'big' // Default ke Kas Besar jika tidak ada
      })));
    }
  };

  const addExpenseEntry = async (entry: Omit<ExpenseEntry, 'id'>) => {
    // Prepare data object
    const dataToInsert: any = {
      user_id: user?.id,
      date: entry.date,
      category: entry.category,
      description: entry.description,
      amount: entry.amount,
      payment_method: entry.paymentMethod,
      notes: entry.notes,
      photos: entry.photos,
      paid_to: entry.paidTo,
    };
    
    // Try with cash_type first
    const { error } = await supabase
      .from('expense_entries')
      .insert({
        ...dataToInsert,
        cash_type: entry.cashType || 'big' // Default ke Kas Besar
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding expense entry:', error);
      
      // Check if it's a "column not found" error (PGRST204) - cash_type doesn't exist yet
      if (error.code === 'PGRST204' && error.message.includes('cash_type')) {
        console.warn('⚠️ cash_type column not found, retrying without it...');
        
        try {
          // Retry without cash_type for backward compatibility
          const { error: retryError } = await supabase
            .from('expense_entries')
            .insert(dataToInsert)
            .select()
            .single();
          
          if (retryError) {
            console.error('❌ Retry error:', retryError);
            alert(`Gagal menambahkan pengeluaran: ${retryError.message}\n\n⚠️ Mohon jalankan SQL migration untuk menambahkan kolom cash_type.`);
            return;
          }
          
          // Success with retry
          console.log('✅ Expense saved without cash_type field');
          await loadExpenseEntries();
          
          // IMPORTANT: Update cash balance (even without cash_type, default to 'big')
          await updateCashBalance(entry.cashType || 'big', entry.amount, entry.date, entry.description, false);
          return;
          
        } catch (retryError) {
          console.error('❌ Fatal error:', retryError);
          alert('Gagal menambahkan pengeluaran. Silakan coba lagi.');
          return;
        }
      } else {
        // Other errors
        alert(`Gagal menambahkan pengeluaran: ${error.message}`);
        return;
      }
    }
    
    // Success! Reload entries
    await loadExpenseEntries();
    
    // IMPORTANT: Update cash balance
    await updateCashBalance(entry.cashType || 'big', entry.amount, entry.date, entry.description, false);
  };

  const updateExpenseEntry = async (id: string, entry: Omit<ExpenseEntry, 'id'>) => {
    console.log('🔄 Starting updateExpenseEntry for ID:', id);
    
    // Prepare update data
    const dataToUpdate: any = {
      date: entry.date,
      category: entry.category,
      description: entry.description,
      amount: entry.amount,
      payment_method: entry.paymentMethod,
      notes: entry.notes,
      photos: entry.photos,
      paid_to: entry.paidTo,
      updated_at: new Date().toISOString()
    };
    
    console.log('📦 Update data:', dataToUpdate);
    
    // Try with cash_type first
    const { error } = await supabase
      .from('expense_entries')
      .update({
        ...dataToUpdate,
        cash_type: entry.cashType || 'big',
      })
      .eq('id', id)
      .eq('user_id', user?.id);
    
    // If cash_type column doesn't exist, retry without it
    if (error && error.code === 'PGRST204' && error.message.includes('cash_type')) {
      console.warn('⚠️ cash_type column not found in update, retrying without it...');
      
      try {
        const { error: retryError } = await supabase
          .from('expense_entries')
          .update(dataToUpdate)
          .eq('id', id)
          .eq('user_id', user?.id);
        
        if (retryError) {
          console.error('❌ Retry UPDATE failed:', retryError);
          alert(`Gagal mengupdate pengeluaran: ${retryError.message}`);
          return;
        }
        
        console.log('✅ Retry UPDATE SUCCESS!');
        await loadExpenseEntries();
        return;
        
      } catch (retryException) {
        console.error('❌ Exception during retry update:', retryException);
        alert(`Gagal mengupdate pengeluaran: ${retryException}`);
        return;
      }
    }
    
    if (error) {
      console.error('❌ Update error:', error);
      alert(`Gagal mengupdate pengeluaran: ${error.message}`);
      return;
    }
    
    console.log('✅ Update SUCCESS (with cash_type)!');
    await loadExpenseEntries();
  };

  const deleteExpenseEntry = async (id: string) => {
    // 1. Get the entry data first before deleting
    const { data: entryToDelete, error: fetchError } = await supabase
      .from('expense_entries')
      .select('*')
      .eq('id', id)
      .eq('user_id', user?.id)
      .single();
    
    if (fetchError || !entryToDelete) {
      console.error('❌ Error fetching expense entry to delete:', fetchError);
      alert('Gagal menghapus: Data tidak ditemukan');
      return;
    }

    // 2. Delete the entry
    const { error: deleteError } = await supabase
      .from('expense_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user?.id);
    
    if (deleteError) {
      console.error('❌ Error deleting expense entry:', deleteError);
      alert(`Gagal menghapus: ${deleteError.message}`);
      return;
    }

    // 3. Reverse the cash balance (add back expense amount)
    const cashType = entryToDelete.cash_type || 'big';
    const amount = entryToDelete.amount || 0;
    
    const { data: currentBalance } = await supabase
      .from('cash_balances')
      .select('balance')
      .eq('user_id', user?.id)
      .eq('cash_type', cashType)
      .single();
    
    const newBalance = (currentBalance?.balance || 0) + amount;
    
    await supabase
      .from('cash_balances')
      .upsert({
        user_id: user?.id,
        cash_type: cashType,
        balance: newBalance,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,cash_type'
      });

    // 4. Log audit trail
    await logAction(
      'delete',
      'expense',
      id,
      `Hapus pengeluaran: ${entryToDelete.description || entryToDelete.category} - Rp ${amount.toLocaleString('id-ID')} (${cashType === 'big' ? 'Kas Besar' : 'Kas Kecil'}). Saldo dikembalikan.`
    );

    console.log(`✅ Expense deleted & balance reversed: +Rp ${amount.toLocaleString('id-ID')} to ${cashType === 'big' ? 'Kas Besar' : 'Kas Kecil'}`);
    
    await loadExpenseEntries();
  };

  // Debt Entries
  const loadDebtEntries = async () => {
    const { data, error } = await supabase
      .from('debt_entries')
      .select('*')
      .eq('user_id', user?.id)
      .order('date', { ascending: false });
    
    if (!error && data) {
      setDebtEntries(data.map(item => ({
        id: item.id,
        type: (item.type === 'hutang' ? 'Utang' : 'Piutang') as 'Utang' | 'Piutang',
        date: item.date,
        name: item.name,
        description: item.description || '',
        amount: parseFloat(item.amount),
        dueDate: item.due_date,
        paymentStatus: (item.status === 'lunas' ? 'Lunas' : 'Tertunda') as 'Lunas' | 'Tertunda',
        notes: item.notes || '',
        paymentDate: item.payment_date
      })));
    }
  };

  const addDebtEntry = async (entry: Omit<DebtEntry, 'id'>) => {
    const { data, error } = await supabase
      .from('debt_entries')
      .insert({
        user_id: user?.id,
        type: entry.type === 'Utang' ? 'hutang' : 'piutang',
        date: entry.date,
        name: entry.name,
        description: entry.description,
        amount: entry.amount,
        due_date: entry.dueDate,
        status: entry.paymentStatus === 'Lunas' ? 'lunas' : 'belum lunas',
        notes: entry.notes,
        payment_date: entry.paymentDate
      })
      .select()
      .single();
    
    if (!error && data) {
      await loadDebtEntries();
    }
  };

  const updateDebtEntry = async (id: string, entry: Omit<DebtEntry, 'id'>) => {
    await supabase
      .from('debt_entries')
      .update({
        type: entry.type === 'Utang' ? 'hutang' : 'piutang',
        date: entry.date,
        name: entry.name,
        description: entry.description,
        amount: entry.amount,
        due_date: entry.dueDate,
        status: entry.paymentStatus === 'Lunas' ? 'lunas' : 'belum lunas',
        notes: entry.notes,
        payment_date: entry.paymentDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user?.id);
    
    await loadDebtEntries();
  };

  // DELETE Debt Entry
  const deleteDebtEntry = async (id: string) => {
    const { error } = await supabase
      .from('debt_entries')
      .delete()
      .eq('id', id);
    
    if (!error) {
      setDebtEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  // Helper function to update cash balance
  const updateCashBalance = async (cashType: 'big' | 'small', amount: number, date: string, description: string, isIncome: boolean = true) => {
    console.log('💵 updateCashBalance called:', { cashType, amount, date, description, isIncome });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No user found in updateCashBalance');
        return;
      }

      console.log('👤 User found:', user.id);

      // 1. Add transaction to cash_transactions
      const transactionType = isIncome ? 'income' : 'expense';
      console.log('📝 Inserting transaction:', { transactionType, amount });
      
      const { data: transactionData, error: transactionError } = await supabase.from('cash_transactions').insert({
        user_id: user.id,
        cash_type: cashType,
        transaction_type: transactionType,
        amount: amount,
        date: date,
        description: description,
        created_at: new Date().toISOString()
      }).select();

      if (transactionError) {
        console.error('❌ Error inserting transaction:', transactionError);
      } else {
        console.log('✅ Transaction inserted:', transactionData);
      }

      // 2. Get or create balance record
      console.log('🔍 Fetching balance for cashType:', cashType);
      let { data: balanceData } = await supabase
        .from('cash_balances')
        .select('*')
        .eq('user_id', user.id)
        .eq('cash_type', cashType)
        .single();

      console.log('📊 Current balance data:', balanceData);

      if (!balanceData) {
        // Create balance record if doesn't exist (e.g., after reset)
        console.log(`📝 Creating new balance record for ${cashType}`);
        const { data: newBalance, error: createError } = await supabase
          .from('cash_balances')
          .insert({
            user_id: user.id,
            cash_type: cashType,
            balance: 0,
            low_balance_threshold: 0,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (createError) {
          console.error('❌ Error creating balance:', createError);
        } else {
          console.log('✅ Balance created:', newBalance);
          balanceData = newBalance;
        }
      }

      if (balanceData) {
        const currentBalance = parseFloat(balanceData.balance) || 0;
        const newBalance = isIncome ? currentBalance + amount : currentBalance - amount;

        console.log(`🔢 Calculating new balance: ${currentBalance} ${isIncome ? '+' : '-'} ${amount} = ${newBalance}`);

        const { data: updatedData, error: updateError } = await supabase
          .from('cash_balances')
          .update({ 
            balance: newBalance
          })
          .eq('user_id', user.id)
          .eq('cash_type', cashType)
          .select();

        if (updateError) {
          console.error('❌ Error updating balance:', updateError);
        } else {
          console.log('✅ Balance updated in DB:', updatedData);
          console.log(`💰 Saldo ${cashType === 'big' ? 'Kas Besar' : 'Kas Kecil'} updated: ${currentBalance} → ${newBalance}`);
        }
        
        // Dispatch event to notify useCashManagement to reload
        console.log('📡 Dispatching cashBalanceUpdated event...');
        window.dispatchEvent(new Event('cashBalanceUpdated'));
        console.log('✅ Event dispatched!');
      }
    } catch (error) {
      // Silently fail if table doesn't exist (backward compatibility)
      console.log('⚠️ Cash balance update skipped (table may not exist):', error);
    }
  };

  // RESET ALL DATA - Factory Reset
  const resetAllData = async () => {
    console.log('🔵 resetAllData called, user:', user);
    
    if (!user) {
      console.error('🔵 No user found!');
      alert('❌ User tidak ditemukan!');
      return false;
    }

    try {
      console.log('🔵 Starting delete operations...');
      
      // Delete all data from Supabase
      const deletePromises = [
        // Delete all transactions
        supabase.from('income_entries').delete().eq('user_id', user.id),
        supabase.from('expense_entries').delete().eq('user_id', user.id),
        supabase.from('debt_entries').delete().eq('user_id', user.id),
        
        // Delete settings
        supabase.from('user_settings').delete().eq('user_id', user.id),
        
        // Delete advance/reimbursement if exists
        supabase.from('advance_entries').delete().eq('user_id', user.id),
        supabase.from('reimbursement_entries').delete().eq('user_id', user.id),
        
        // Delete cash management data if exists
        supabase.from('cash_transactions').delete().eq('user_id', user.id),
        supabase.from('cash_balances').delete().eq('user_id', user.id),
        supabase.from('cash_transfers').delete().eq('user_id', user.id),
        
        // Delete budget, invoice, recurring, notifications if exists
        supabase.from('budgets').delete().eq('user_id', user.id),
        supabase.from('invoices').delete().eq('user_id', user.id),
        supabase.from('recurring_transactions').delete().eq('user_id', user.id),
        supabase.from('recurring_execution_logs').delete().eq('user_id', user.id),
        supabase.from('notifications').delete().eq('user_id', user.id),
      ];

      const results = await Promise.allSettled(deletePromises);
      console.log('🔵 Delete results:', results);

      // Reset local state to defaults
      console.log('🔵 Resetting local state...');
      setIncomeSources(DEFAULT_INCOME_SOURCES);
      setExpenseCategories(DEFAULT_EXPENSE_CATEGORIES);
      setPaymentMethods(DEFAULT_PAYMENT_METHODS);
      setEmployees([]);
      setIncomeEntries([]);
      setExpenseEntries([]);
      setDebtEntries([]);

      // Clear any localStorage data
      console.log('🔵 Clearing localStorage...');
      const keysToRemove = [
        'cashSetupModalDismissed',
        'newFeaturesNoticeDismissed',
        'migrationNoticeDismissed',
        'setupWarningDismissed'
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Dispatch event to notify all components to reload
      console.log('🔵 Dispatching dataReset event...');
      window.dispatchEvent(new Event('dataReset'));

      console.log('🔵 Reset completed successfully!');
      return true;
    } catch (error) {
      console.error('🔵 Error resetting data:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    incomeSources,
    expenseCategories,
    paymentMethods,
    employees,
    incomeEntries,
    expenseEntries,
    debtEntries,
    saveIncomeSources,
    saveExpenseCategories,
    savePaymentMethods,
    saveEmployees,
    addIncomeEntry,
    updateIncomeEntry,
    deleteIncomeEntry,
    addExpenseEntry,
    updateExpenseEntry,
    deleteExpenseEntry,
    addDebtEntry,
    updateDebtEntry,
    deleteDebtEntry,
    resetAllData, // New function
    isOffline // Expose offline status
  };
}
