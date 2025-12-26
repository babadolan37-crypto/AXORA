import { useState, useEffect, lazy, Suspense } from 'react';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import { AuthForm } from './components/AuthForm';
import { TransactionSheet } from './components/TransactionSheet';
import { DashboardSheet } from './components/DashboardSheet';
import { DebtSheet } from './components/DebtSheet';
import { SessionTimeout } from './components/SessionTimeout';
import { WaitingApproval } from './components/WaitingApproval';
import { FileSpreadsheet, Settings, LogOut, Bell, WifiOff } from 'lucide-react';
import { AdvanceReimbursementSheet } from './components/AdvanceReimbursementSheet';
import { ModuleNavigator, ModuleType } from './components/ModuleNavigator';
import { BudgetSheet } from './components/BudgetSheet';
import { InvoiceSheet } from './components/InvoiceSheet';
import { RecurringSheet } from './components/RecurringSheet';
import { ApprovalSheet } from './components/ApprovalSheet';
import { NotificationSheet } from './components/NotificationSheet';
import { BankReconSheet } from './components/BankReconSheet';
import { FinancialReportsSheet } from './components/FinancialReportsSheet';
import AdminDashboard from './components/AdminDashboard';
import { FixedAssetsSheet } from './components/FixedAssetsSheet';
import { useSupabaseData } from './hooks/useSupabaseData';
import { useNotifications } from './hooks/useNotifications';

// Lazy load SettingsSheet to prevent startup crashes with error handling
const SettingsSheet = lazy(() => 
  import('./components/SettingsSheet')
    .then(module => ({ default: module.SettingsSheet }))
    .catch(err => {
      console.error("Failed to load SettingsSheet:", err);
      return { default: () => <div className="p-8 text-center text-red-600">Gagal memuat komponen Pengaturan. Silakan refresh halaman.</div> };
    })
);

type TabType = 'transaction' | 'dashboard' | 'debt' | 'advance' | 'settings' | 'roles' | 'audit' | 'notifications' | ModuleType;

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [userStatus, setUserStatus] = useState<string>('active'); // Add status state
  const [authLoading, setAuthLoading] = useState(true);

  const {
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
    resetAllData,
    isOffline,
  } = useSupabaseData();

  // Notifications hook
  const { unreadCount } = useNotifications();

  // Check auth state and status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        const { data } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', currentUser.id)
          .maybeSingle();
        if (data) setUserStatus(data.status || 'active');
      }
      
      setAuthLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
         const { data } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', currentUser.id)
          .maybeSingle();
        if (data) setUserStatus(data.status || 'active');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin logout?')) {
      // Logout dari Supabase
      await supabase.auth.signOut();
      
      // Reset state
      setUser(null);
    }
  };

  const handleAuthSuccess = () => {
    // Refresh auth state from Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  };

  // Income handlers
  const handleAddIncome = async (entry: Omit<any, 'id'>) => {
    await addIncomeEntry(entry);
  };

  const handleUpdateIncome = async (id: string, entry: Omit<any, 'id'>) => {
    await updateIncomeEntry(id, entry);
  };

  const handleDeleteIncome = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      await deleteIncomeEntry(id);
    }
  };

  // Expense handlers
  const handleAddExpense = async (entry: Omit<any, 'id'>) => {
    await addExpenseEntry(entry);
  };

  const handleUpdateExpense = async (id: string, entry: Omit<any, 'id'>) => {
    await updateExpenseEntry(id, entry);
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      await deleteExpenseEntry(id);
    }
  };

  // Debt handlers
  const handleAddDebt = async (entry: Omit<any, 'id'>) => {
    await addDebtEntry(entry);
  };

  const handleUpdateDebt = async (id: string, entry: Omit<any, 'id'>) => {
    await updateDebtEntry(id, entry);
  };

  const handleDeleteDebt = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      await deleteDebtEntry(id);
    }
  };

  // Settings handlers
  const handleUpdateIncomeSources = async (sources: string[]) => {
    await saveIncomeSources(sources);
  };

  const handleUpdateExpenseCategories = async (categories: string[]) => {
    await saveExpenseCategories(categories);
  };

  const handleUpdatePaymentMethods = async (methods: string[]) => {
    await savePaymentMethods(methods);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  // CHECK STATUS: If not active, show waiting screen
  if (userStatus !== 'active') {
    return <WaitingApproval status={userStatus} onLogout={handleLogout} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SessionTimeout /> {/* Add Session Timeout Monitor */}
      {/* Module Navigator - Sidebar */}

      <ModuleNavigator
        activeModule={activeTab as ModuleType}
        onChange={(module) => setActiveTab(module as TabType)}
      />


      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ml-20 lg:ml-64 print:ml-0">
        
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-yellow-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium animate-in slide-in-from-top">
          <WifiOff size={16} />
          <span>Koneksi terputus. Menggunakan mode offline.</span>
        </div>
      )}
        
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 sm:p-3 rounded-lg">
                  <FileSpreadsheet className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-gray-900 text-xl sm:text-2xl">Babadolan</h1>
                  <p className="text-xs sm:text-sm text-gray-600">Pencatatan Keuangan Perusahaan</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Notification Bell */}
                <button
                  onClick={() => setActiveTab('notifications')}
                  className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={18} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6 w-full">
          {activeTab === 'transaction' && (
            <TransactionSheet
              incomeEntries={incomeEntries}
              expenseEntries={expenseEntries}
              incomeSources={incomeSources}
              expenseCategories={expenseCategories}
              paymentMethods={paymentMethods}
              employees={employees}
              onAddIncome={handleAddIncome}
              onUpdateIncome={handleUpdateIncome}
              onDeleteIncome={handleDeleteIncome}
              onAddExpense={handleAddExpense}
              onUpdateExpense={handleUpdateExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}
          {activeTab === 'dashboard' && (
            <DashboardSheet
              incomeEntries={incomeEntries}
              expenseEntries={expenseEntries}
              expenseCategories={expenseCategories}
              employees={employees}
            />
          )}
          {activeTab === 'budget' && (
            <BudgetSheet
              incomeEntries={incomeEntries}
              expenseEntries={expenseEntries}
              expenseCategories={expenseCategories}
              incomeSources={incomeSources}
            />
          )}
          {activeTab === 'invoice' && <InvoiceSheet />}
          {activeTab === 'recurring' && (
            <RecurringSheet
              expenseCategories={expenseCategories}
              incomeSources={incomeSources}
              employees={employees}
            />
          )}
          {activeTab === 'approval' && <ApprovalSheet />}
          {activeTab === 'bank-recon' && <BankReconSheet />}
          {activeTab === 'financial-reports' && (
            <FinancialReportsSheet
              incomeEntries={incomeEntries}
              expenseEntries={expenseEntries}
              debtEntries={debtEntries}
            />
          )}
          {activeTab === 'fixed-assets' && <FixedAssetsSheet />}
          {activeTab === 'debt' && (
            <DebtSheet
              entries={debtEntries}
              onAddEntry={handleAddDebt}
              onUpdateEntry={handleUpdateDebt}
              onDeleteEntry={handleDeleteDebt}
            />
          )}
          {activeTab === 'advance' && (
            <AdvanceReimbursementSheet
              employees={employees}
            />
          )}
          {activeTab === 'admin' && <AdminDashboard />}
          {activeTab === 'roles' && <AdminDashboard initialTab="users" />}
          {activeTab === 'audit' && <AdminDashboard initialTab="logs" />}
          {activeTab === 'notifications' && <NotificationSheet />}
          {activeTab === 'settings' && (
            <Suspense fallback={<div className="p-8 text-center flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>}>
              <SettingsSheet
                incomeSources={incomeSources}
                expenseCategories={expenseCategories}
                paymentMethods={paymentMethods}
                employees={employees}
                onUpdateIncomeSources={handleUpdateIncomeSources}
                onUpdateExpenseCategories={handleUpdateExpenseCategories}
                onUpdatePaymentMethods={handleUpdatePaymentMethods}
                onUpdateEmployees={saveEmployees}
                onResetAllData={resetAllData}
                onNavigateToRoles={() => setActiveTab('roles')}
                onNavigateToAudit={() => setActiveTab('audit')}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;