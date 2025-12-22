import { useState, useEffect } from 'react';
import { Plus, Trash2, Settings as SettingsIcon, DollarSign, TrendingUp, TrendingDown, Users, Wallet, Shield, History, Lock, Building2 } from 'lucide-react';
import { useCashManagement } from '../hooks/useCashManagement';
import { AdvancedFeaturesSection } from './AdvancedFeaturesSection';
import { supabase } from '../lib/supabase';

interface SettingsSheetProps {
  incomeSources: string[];
  expenseCategories: string[];
  paymentMethods: string[];
  employees: string[];
  onUpdateIncomeSources: (sources: string[]) => void;
  onUpdateExpenseCategories: (categories: string[]) => void;
  onUpdatePaymentMethods: (methods: string[]) => void;
  onUpdateEmployees: (employees: string[]) => void;
  onResetAllData?: () => Promise<boolean>;
  onNavigateToRoles?: () => void; // NEW: Navigate to Roles
  onNavigateToAudit?: () => void; // NEW: Navigate to Audit
}

export function SettingsSheet({
  incomeSources,
  expenseCategories,
  paymentMethods,
  employees,
  onUpdateIncomeSources,
  onUpdateExpenseCategories,
  onUpdatePaymentMethods,
  onUpdateEmployees,
  onResetAllData,
  onNavigateToRoles,
  onNavigateToAudit
}: SettingsSheetProps) {
  const [newIncomeSource, setNewIncomeSource] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('');
  const [newEmployee, setNewEmployee] = useState('');
  
  // Company Info State
  const [companyInfo, setCompanyInfo] = useState<{name: string, code: string, role: string} | null>(null);

  // Load Company Info
  useEffect(() => {
    const fetchCompany = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Note: This query depends on the foreign key relationship between profiles and companies
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          role,
          companies (
            name,
            code
          )
        `)
        .eq('id', user.id)
        .single();
      
      if (data && data.companies) {
        // @ts-ignore - Supabase types might not be fully generated yet
        const company = Array.isArray(data.companies) ? data.companies[0] : data.companies;
        setCompanyInfo({
          name: company.name,
          code: company.code,
          role: data.role
        });
      }
    };
    
    fetchCompany();
  }, []);

  // Switch Company Logic
  const [isSwitchingCompany, setIsSwitchingCompany] = useState(false);
  const [switchCompanyCode, setSwitchCompanyCode] = useState('');
  
  const handleSwitchCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!switchCompanyCode.trim()) return;
    
    if (!confirm(`Apakah Anda yakin ingin bergabung ke perusahaan dengan kode "${switchCompanyCode}"? Akses Anda ke perusahaan saat ini akan dicabut.`)) {
      return;
    }

    setIsSwitchingCompany(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Call join_company RPC
      const { data: res, error } = await supabase.rpc('join_company', {
        input_code: switchCompanyCode.trim(),
        user_name: user.user_metadata.name || 'User'
      });

      if (error) throw error;
      if (!res.success) throw new Error(res.message);

      alert('Berhasil bergabung ke perusahaan baru! Halaman akan dimuat ulang.');
      window.location.reload();

    } catch (err: any) {
      console.error('Switch company error:', err);
      alert('Gagal bergabung: ' + (err.message || 'Kode tidak ditemukan atau terjadi kesalahan.'));
    } finally {
      setIsSwitchingCompany(false);
    }
  };

  // Cash balance settings
  const { balances, setBalance } = useCashManagement();
  const [bigCashBalance, setBigCashBalance] = useState('');
  const [smallCashBalance, setSmallCashBalance] = useState('');
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState('1000000');
  const [isSavingBalance, setIsSavingBalance] = useState(false);

  // Load current balances and threshold
  useEffect(() => {
    const bigBalance = balances.find(b => b.cashType === 'big')?.balance || 0;
    const smallBalance = balances.find(b => b.cashType === 'small')?.balance || 0;
    setBigCashBalance(bigBalance.toString());
    setSmallCashBalance(smallBalance.toString());

    // Load threshold from localStorage - REMOVED for Cloud-Only Policy
    // Default is 1000000
  }, [balances]);

  const handleAddIncomeSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (newIncomeSource.trim() && !incomeSources.includes(newIncomeSource.trim())) {
      onUpdateIncomeSources([...incomeSources, newIncomeSource.trim()]);
      setNewIncomeSource('');
    }
  };

  const handleDeleteIncomeSource = (source: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus sumber pemasukan "${source}"?`)) {
      onUpdateIncomeSources(incomeSources.filter(s => s !== source));
    }
  };

  const handleAddExpenseCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExpenseCategory.trim() && !expenseCategories.includes(newExpenseCategory.trim())) {
      onUpdateExpenseCategories([...expenseCategories, newExpenseCategory.trim()]);
      setNewExpenseCategory('');
    }
  };

  const handleDeleteExpenseCategory = (category: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus kategori pengeluaran "${category}"?`)) {
      onUpdateExpenseCategories(expenseCategories.filter(c => c !== category));
    }
  };

  const handleAddPaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPaymentMethod.trim() && !paymentMethods.includes(newPaymentMethod.trim())) {
      onUpdatePaymentMethods([...paymentMethods, newPaymentMethod.trim()]);
      setNewPaymentMethod('');
    }
  };

  const handleDeletePaymentMethod = (method: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus metode pembayaran "${method}"?`)) {
      onUpdatePaymentMethods(paymentMethods.filter(m => m !== method));
    }
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmployee.trim() && !employees.includes(newEmployee.trim())) {
      onUpdateEmployees([...employees, newEmployee.trim()]);
      setNewEmployee('');
    }
  };

  const handleDeleteEmployee = (employee: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus karyawan "${employee}"?`)) {
      onUpdateEmployees(employees.filter(e => e !== employee));
    }
  };

  const handleSaveCashBalances = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBalance(true);

    try {
      // Update Big Cash Balance
      const bigAmount = parseFloat(bigCashBalance) || 0;
      await setBalance('big', bigAmount);

      // Update Small Cash Balance
      const smallAmount = parseFloat(smallCashBalance) || 0;
      await setBalance('small', smallAmount);

      // Save low balance threshold - Memory Only for now (Cloud Schema Update Required for Persistence)
      // localStorage.setItem('lowBalanceThreshold', lowBalanceThreshold);

      alert('Pengaturan saldo berhasil disimpan!');
    } catch (error) {
      console.error('Error saving cash balances:', error);
      alert('Gagal menyimpan pengaturan saldo. Silakan coba lagi.');
    } finally {
      setIsSavingBalance(false);
    }
  };

  const formatNumber = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    return numericValue;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <div className="bg-gray-600 p-3 rounded-lg">
          <SettingsIcon className="text-white" size={24} />
        </div>
        <div>
          <h2>Pengaturan</h2>
          <p className="text-sm text-gray-600">Kelola kategori dan pengaturan kas perusahaan</p>
        </div>
      </div>

      {/* Company Profile Section - NEW */}
      <div className="bg-white border-2 border-indigo-100 rounded-xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Building2 size={120} className="text-indigo-600" />
        </div>
        
        <div className="relative z-10">
           <div className="flex items-center gap-3 mb-6">
             <div className="bg-indigo-100 p-2 rounded-lg">
               <Building2 className="text-indigo-600" size={24} />
             </div>
             <div>
               <h3 className="text-lg font-bold text-gray-900">
                 {companyInfo ? companyInfo.name : 'Memuat Profil Perusahaan...'}
               </h3>
               {companyInfo && (
                 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    companyInfo.role === 'owner' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                 }`}>
                   {companyInfo.role === 'owner' ? 'Pemilik / Owner' : 'Staff / Karyawan'}
                 </span>
               )}
             </div>
           </div>
           
           {companyInfo && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Access Code Display */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Kode Akses Perusahaan</p>
                  <div className="flex items-center gap-3">
                    <code className="text-2xl font-mono font-bold text-gray-900 tracking-widest">{companyInfo.code}</code>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(companyInfo.code);
                        alert('Kode perusahaan disalin!');
                      }}
                      className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                      title="Salin Kode"
                    >
                      <Shield size={16} className="text-gray-600" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Bagikan kode ini kepada karyawan Anda agar mereka dapat bergabung.
                  </p>
                </div>

                {/* Switch Company Form */}
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                  <p className="text-xs text-indigo-800 uppercase tracking-wider mb-2 font-semibold">Pindah / Gabung Perusahaan Lain</p>
                  <form onSubmit={handleSwitchCompany} className="flex gap-2">
                    <input 
                      type="text" 
                      value={switchCompanyCode}
                      onChange={(e) => setSwitchCompanyCode(e.target.value.toUpperCase())}
                      placeholder="Masukkan Kode Baru"
                      className="flex-1 px-3 py-2 text-sm border border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono uppercase"
                    />
                    <button 
                      type="submit"
                      disabled={isSwitchingCompany || !switchCompanyCode}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
                    >
                      {isSwitchingCompany ? '...' : 'Gabung'}
                    </button>
                  </form>
                  <p className="text-[10px] text-indigo-600 mt-2 leading-tight">
                    ⚠️ Pindah perusahaan akan mengubah akses data Anda ke perusahaan baru.
                  </p>
                </div>
             </div>
           )}
        </div>
      </div>

      {/* Cash Balance Settings - NEW SECTION */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center gap-3 text-white">
            <Wallet size={24} />
            <h3 className="text-lg">Pengaturan Saldo Awal</h3>
          </div>
        </div>

        <form onSubmit={handleSaveCashBalances} className="p-6 space-y-6">
          {/* Saldo Awal Kas Besar */}
          <div>
            <label className="block text-gray-900 mb-2">
              Saldo Awal Kas Besar
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                Rp
              </span>
              <input
                type="text"
                value={bigCashBalance}
                onChange={(e) => setBigCashBalance(formatNumber(e.target.value))}
                placeholder="10000000"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Saldo awal yang digunakan untuk perhitungan Kas Besar
            </p>
            {bigCashBalance && (
              <p className="text-xs text-blue-600 mt-1">
                = {formatCurrency(parseFloat(bigCashBalance) || 0)}
              </p>
            )}
          </div>

          {/* Saldo Awal Kas Kecil */}
          <div>
            <label className="block text-gray-900 mb-2">
              Saldo Awal Kas Kecil
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                Rp
              </span>
              <input
                type="text"
                value={smallCashBalance}
                onChange={(e) => setSmallCashBalance(formatNumber(e.target.value))}
                placeholder="2000000"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Saldo awal yang digunakan untuk perhitungan Kas Kecil
            </p>
            {smallCashBalance && (
              <p className="text-xs text-blue-600 mt-1">
                = {formatCurrency(parseFloat(smallCashBalance) || 0)}
              </p>
            )}
          </div>

          {/* Batas Saldo Rendah */}
          <div>
            <label className="block text-gray-900 mb-2">
              Batas Saldo Rendah
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                Rp
              </span>
              <input
                type="text"
                value={lowBalanceThreshold}
                onChange={(e) => setLowBalanceThreshold(formatNumber(e.target.value))}
                placeholder="1000000"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Sistem akan memberikan notifikasi jika saldo di bawah nilai ini
            </p>
            {lowBalanceThreshold && (
              <p className="text-xs text-blue-600 mt-1">
                = {formatCurrency(parseFloat(lowBalanceThreshold) || 0)}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSavingBalance}
            className="w-full bg-gray-900 text-white py-4 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSavingBalance ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Menyimpan...
              </>
            ) : (
              <>
                <Wallet size={20} />
                Simpan Pengaturan
              </>
            )}
          </button>
        </form>
      </div>

      {/* Income Sources */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="text-green-600" size={20} />
          <h3>Sumber Pemasukan</h3>
        </div>
        
        <form onSubmit={handleAddIncomeSource} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newIncomeSource}
              onChange={(e) => setNewIncomeSource(e.target.value)}
              placeholder="Tambah sumber pemasukan baru..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="submit"
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={20} />
              Tambah
            </button>
          </div>
        </form>

        <div className="space-y-2">
          {incomeSources.map((source, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm">{source}</span>
              <button
                onClick={() => handleDeleteIncomeSource(source)}
                className="text-red-600 hover:text-red-800 transition-colors"
                title="Hapus"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {incomeSources.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">Belum ada sumber pemasukan</p>
          )}
        </div>
      </div>

      {/* Expense Categories */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="text-red-600" size={20} />
          <h3>Kategori Pengeluaran</h3>
        </div>
        
        <form onSubmit={handleAddExpenseCategory} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newExpenseCategory}
              onChange={(e) => setNewExpenseCategory(e.target.value)}
              placeholder="Tambah kategori pengeluaran baru..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              type="submit"
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus size={20} />
              Tambah
            </button>
          </div>
        </form>

        <div className="space-y-2">
          {expenseCategories.map((category, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm">{category}</span>
              <button
                onClick={() => handleDeleteExpenseCategory(category)}
                className="text-red-600 hover:text-red-800 transition-colors"
                title="Hapus"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {expenseCategories.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">Belum ada kategori pengeluaran</p>
          )}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="text-blue-600" size={20} />
          <h3>Metode Pembayaran</h3>
        </div>
        
        <form onSubmit={handleAddPaymentMethod} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newPaymentMethod}
              onChange={(e) => setNewPaymentMethod(e.target.value)}
              placeholder="Tambah metode pembayaran baru..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Tambah
            </button>
          </div>
        </form>

        <div className="space-y-2">
          {paymentMethods.map((method, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm">{method}</span>
              <button
                onClick={() => handleDeletePaymentMethod(method)}
                className="text-red-600 hover:text-red-800 transition-colors"
                title="Hapus"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {paymentMethods.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">Belum ada metode pembayaran</p>
          )}
        </div>
      </div>

      {/* Employees */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Users className="text-gray-600" size={20} />
          <h3>Karyawan</h3>
        </div>
        
        <form onSubmit={handleAddEmployee} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newEmployee}
              onChange={(e) => setNewEmployee(e.target.value)}
              placeholder="Tambah karyawan baru..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
            <button
              type="submit"
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Plus size={20} />
              Tambah
            </button>
          </div>
        </form>

        <div className="space-y-2">
          {employees.map((employee, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm">{employee}</span>
              <button
                onClick={() => handleDeleteEmployee(employee)}
                className="text-red-600 hover:text-red-800 transition-colors"
                title="Hapus"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {employees.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">Belum ada karyawan</p>
          )}
        </div>
      </div>

      {onResetAllData && (
        <div className="border border-red-500 rounded-lg p-4">
          <button
            onClick={async () => {
              if (!window.confirm('Anda akan menghapus semua data. Lanjutkan?')) return;
              if (!window.confirm('Konfirmasi terakhir. Data tidak dapat dikembalikan. Hapus sekarang?')) return;
              try {
                const success = await onResetAllData();
                if (success) {
                  alert('Reset berhasil. Halaman akan di-refresh.');
                  setTimeout(() => window.location.reload(), 500);
                } else {
                  alert('Reset gagal. Silakan coba lagi.');
                }
              } catch (error) {
                alert('Gagal mereset data.');
              }
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <Trash2 size={20} />
            Reset Semua Data
          </button>
        </div>
      )}

      {/* Advanced Features Section */}
      <AdvancedFeaturesSection />

      {/* Quick Access to Admin Features */}
      {(onNavigateToRoles || onNavigateToAudit) && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield size={24} className="text-indigo-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Fitur Admin & Keamanan</h3>
              <p className="text-sm text-gray-600">Akses cepat ke fitur administrasi lanjutan</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {onNavigateToRoles && (
              <button
                onClick={onNavigateToRoles}
                className="flex items-center gap-3 p-4 bg-white border-2 border-indigo-200 rounded-lg hover:border-indigo-400 hover:shadow-md transition-all group"
              >
                <div className="bg-indigo-100 p-3 rounded-lg group-hover:bg-indigo-200 transition-colors">
                  <Shield size={20} className="text-indigo-600" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-gray-900">User Roles</h4>
                  <p className="text-xs text-gray-600">Kelola hak akses user</p>
                </div>
              </button>
            )}
            
            {onNavigateToAudit && (
              <button
                onClick={onNavigateToAudit}
                className="flex items-center gap-3 p-4 bg-white border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:shadow-md transition-all group"
              >
                <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <History size={20} className="text-purple-600" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-gray-900">Audit Logs</h4>
                  <p className="text-xs text-gray-600">Riwayat aktivitas sistem</p>
                </div>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
