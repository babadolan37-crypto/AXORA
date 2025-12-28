import { useState, useEffect } from 'react';
import { Plus, Trash2, Settings as SettingsIcon, DollarSign, TrendingUp, TrendingDown, Users, Wallet, Shield, History, Lock, Building, Copy, AlertCircle, RefreshCw } from 'lucide-react';
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
  const [role, setRole] = useState<string | null>(null);
  const [company, setCompany] = useState<{id: string, name: string, code: string} | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [createCompanyLoading, setCreateCompanyLoading] = useState(false);
  
  // Change Code State
  const [showChangeCodeModal, setShowChangeCodeModal] = useState(false);
  const [newCompanyCode, setNewCompanyCode] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const canEditSettings = role === null || role === 'owner' || role === 'admin';

  useEffect(() => {
    fetchCompany();
    fetchRole();
  }, []);

  const fetchRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setRole(null);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (error) {
      setRole(null);
      return;
    }
    setRole(data?.role || null);
  };

  const fetchCompany = async () => {
    setLoadingCompany(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();
        
      if (profile?.company_id) {
        const { data: comp } = await supabase
          .from('companies')
          .select('id, name, code')
          .eq('id', profile.company_id)
          .maybeSingle();
        setCompany(comp);
      } else {
        setCompany(null);
      }
    } catch (error) {
      console.error('Error fetching company:', error);
    } finally {
      setLoadingCompany(false);
    }
  };

  const handleCreateDefaultCompany = async () => {
    if (!confirm('Perusahaan tidak ditemukan. Buat perusahaan baru secara otomatis?')) return;
    
    setCreateCompanyLoading(true);
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not found');

        // Create company with unique name
        const code = Math.random().toString(36).slice(2, 8).toUpperCase();
        // Use email username to make it unique, e.g. "Perusahaan budi"
        const username = user.email?.split('@')[0] || 'User';
        const name = `Perusahaan ${username.charAt(0).toUpperCase() + username.slice(1)}`; 
        
        const { data: newCompany, error: createError } = await supabase
            .from('companies')
            .insert({ name, code })
            .select()
            .maybeSingle();
            
        if (createError) throw createError;
        if (!newCompany) throw new Error('Gagal membuat perusahaan: Tidak ada data dikembalikan');
        
        // Link to profile
        await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                company_id: newCompany.id,
                role: 'owner',
                full_name: user.email?.split('@')[0] || 'Admin',
                email: user.email
            });
            
        // Init settings
        await supabase
            .from('company_settings')
            .upsert({ company_id: newCompany.id });
            
        alert('Perusahaan berhasil dibuat!');
        fetchCompany();
        // Reload page to ensure all hooks pick up the new company
        window.location.reload();
        
    } catch (e: any) {
        alert('Gagal membuat perusahaan: ' + e.message);
    } finally {
        setCreateCompanyLoading(false);
    }
  };

  const copyCode = () => {
    if (company?.code) {
        navigator.clipboard.writeText(company.code);
        alert('Kode perusahaan disalin!');
    }
  };

  // Cash balance settings
  const { balances, setBalance, setLowBalanceThreshold: saveLowBalanceThreshold } = useCashManagement();
  const [bigCashBalance, setBigCashBalance] = useState('');
  const [smallCashBalance, setSmallCashBalance] = useState('');
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState('1000000');
  const [isSavingBalance, setIsSavingBalance] = useState(false);

  // Load current balances and threshold
  useEffect(() => {
    const bigBalance = balances.find(b => b.cashType === 'big')?.balance || 0;
    const smallBalance = balances.find(b => b.cashType === 'small')?.balance || 0;
    
    // Get max threshold from either balance (assuming they are synced)
    const bigThreshold = balances.find(b => b.cashType === 'big')?.lowBalanceThreshold || 0;
    const smallThreshold = balances.find(b => b.cashType === 'small')?.lowBalanceThreshold || 0;
    const threshold = Math.max(bigThreshold, smallThreshold);

    setBigCashBalance(bigBalance.toString());
    setSmallCashBalance(smallBalance.toString());
    
    if (threshold > 0) {
      setLowBalanceThreshold(threshold.toString());
    }
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

  const handleChangeCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    if (!newCompanyCode.trim()) return alert('Kode baru wajib diisi');
    if (!passwordConfirm) return alert('Password konfirmasi wajib diisi');
    
    if (!confirm('PERINGATAN: Mengubah kode perusahaan akan mempengaruhi cara login seluruh karyawan. Lanjutkan?')) return;

    setLoadingCompany(true);
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) throw new Error('User info missing');

        // Verify password
        const { error: authError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: passwordConfirm
        });
        
        if (authError) throw new Error('Password salah. Verifikasi gagal.');

        // Check uniqueness
        const { data: existing } = await supabase
            .from('companies')
            .select('id')
            .eq('code', newCompanyCode.trim().toUpperCase())
            .maybeSingle();
            
        if (existing) throw new Error('Kode perusahaan sudah digunakan. Pilih kode lain.');

        // Update
        const { error: updateError } = await supabase
            .from('companies')
            .update({ code: newCompanyCode.trim().toUpperCase() })
            .eq('id', company.id);
            
        if (updateError) throw updateError;
        
        // Audit Log (Optional/Best Effort)
        const { error: auditError } = await supabase.from('audit_logs').insert({
            company_id: company.id,
            actor_user_id: user.id,
            action: 'COMPANY_CODE_CHANGED',
            metadata: { old_code: company.code, new_code: newCompanyCode.trim().toUpperCase() }
        });
        
        if (auditError) console.error('Audit log failed:', auditError);

        alert('Kode perusahaan berhasil diubah!');
        setShowChangeCodeModal(false);
        setPasswordConfirm('');
        setNewCompanyCode('');
        fetchCompany();
        
    } catch (err: any) {
        alert('Gagal mengubah kode: ' + err.message);
    } finally {
        setLoadingCompany(false);
    }
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

      {/* Company Profile - NEW SECTION */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Building className="text-indigo-600" size={20} />
          <h3>Profil Perusahaan</h3>
        </div>

        {loadingCompany ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        ) : company ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Perusahaan</label>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 font-medium">
                {company.name}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kode Akses Karyawan</label>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-gray-50 rounded-lg border border-gray-200 font-mono font-bold tracking-wider text-center">
                  {company.code}
                </div>
                <button 
                  onClick={copyCode}
                  className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-2"
                  title="Salin Kode"
                >
                  <Copy size={18} />
                  <span className="hidden sm:inline">Salin</span>
                </button>
                {canEditSettings && (
                  <button 
                    onClick={() => setShowChangeCodeModal(true)}
                    className="px-4 py-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-2"
                    title="Ubah Kode"
                  >
                    <RefreshCw size={18} />
                    <span className="hidden sm:inline">Ubah</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                <AlertCircle size={12} className="inline mr-1" />
                Bagikan kode ini kepada karyawan agar mereka dapat bergabung ke perusahaan Anda.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <Building className="mx-auto text-gray-400 mb-2" size={32} />
            <h4 className="font-medium text-gray-900 mb-1">Belum Ada Perusahaan</h4>
            <p className="text-sm text-gray-500 mb-4">Anda belum terhubung dengan perusahaan manapun.</p>
            
            <button
              onClick={handleCreateDefaultCompany}
              disabled={createCompanyLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto disabled:opacity-70"
            >
              {createCompanyLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Plus size={18} />
              )}
              Buat Perusahaan Baru
            </button>
          </div>
        )}
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
          {!canEditSettings && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <p className="text-xs text-yellow-800">
                <Lock size={12} className="inline mr-1" />
                Hanya Owner/Admin yang dapat mengubah saldo awal dan pengaturan.
              </p>
            </div>
          )}
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
                disabled={!canEditSettings}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
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
                disabled={!canEditSettings}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
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
                disabled={!canEditSettings}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
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
            disabled={isSavingBalance || !canEditSettings}
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
              placeholder={canEditSettings ? "Tambah sumber pemasukan baru..." : "Hanya Admin dapat menambah"}
              disabled={!canEditSettings}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
            <button
              type="submit"
              disabled={!canEditSettings}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
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
              {canEditSettings && (
                <button
                  onClick={() => handleDeleteIncomeSource(source)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Hapus"
                >
                  <Trash2 size={18} />
                </button>
              )}
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
              placeholder={canEditSettings ? "Tambah kategori pengeluaran baru..." : "Hanya Admin dapat menambah"}
              disabled={!canEditSettings}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
            <button
              type="submit"
              disabled={!canEditSettings}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
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
              {canEditSettings && (
                <button
                  onClick={() => handleDeleteExpenseCategory(category)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Hapus"
                >
                  <Trash2 size={18} />
                </button>
              )}
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
              placeholder={canEditSettings ? "Tambah metode pembayaran baru..." : "Hanya Admin dapat menambah"}
              disabled={!canEditSettings}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
            <button
              type="submit"
              disabled={!canEditSettings}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
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
              {canEditSettings && (
                <button
                  onClick={() => handleDeletePaymentMethod(method)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Hapus"
                >
                  <Trash2 size={18} />
                </button>
              )}
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
              placeholder={canEditSettings ? "Tambah karyawan baru..." : "Hanya Admin dapat menambah"}
              disabled={!canEditSettings}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
            <button
              type="submit"
              disabled={!canEditSettings}
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400"
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
              {canEditSettings && (
                <button
                  onClick={() => handleDeleteEmployee(employee)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Hapus"
                >
                  <Trash2 size={18} />
                </button>
              )}
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
      {/* Change Code Modal */}
      {showChangeCodeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ubah Kode Perusahaan</h3>
            <p className="text-sm text-gray-600 mb-6">
              Mengubah kode perusahaan akan mempengaruhi cara login seluruh karyawan. Pastikan Anda memberitahu tim Anda setelah perubahan.
            </p>
            
            <form onSubmit={handleChangeCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kode Baru</label>
                <input
                  type="text"
                  value={newCompanyCode}
                  onChange={(e) => setNewCompanyCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: NEWCODE2025"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Anda</label>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Masukkan password login Anda"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Untuk keamanan, verifikasi identitas diperlukan.</p>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangeCodeModal(false);
                    setPasswordConfirm('');
                    setNewCompanyCode('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={loadingCompany}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center gap-2"
                  disabled={loadingCompany}
                >
                  {loadingCompany && <RefreshCw size={16} className="animate-spin" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
