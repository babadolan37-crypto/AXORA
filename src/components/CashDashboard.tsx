import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, AlertTriangle, DollarSign, Calendar, ArrowUpRight, ArrowDownRight, Eye, EyeOff } from 'lucide-react';
import { useCashManagement } from '../hooks/useCashManagement';
import { supabase } from '../lib/supabase';

interface DashboardStats {
  todayIncome: number;
  todayExpense: number;
  weekIncome: number;
  weekExpense: number;
  monthIncome: number;
  monthExpense: number;
}

interface BalanceSettings {
  minBalanceBig: number;
  minBalanceSmall: number;
  warningThreshold: number; // percentage (e.g., 20 = 20%)
}

export function CashDashboard() {
  const { balances, transactions } = useCashManagement();
  const [stats, setStats] = useState<DashboardStats>({
    todayIncome: 0,
    todayExpense: 0,
    weekIncome: 0,
    weekExpense: 0,
    monthIncome: 0,
    monthExpense: 0
  });
  const [settings, setSettings] = useState<BalanceSettings>({
    minBalanceBig: 1000000,
    minBalanceSmall: 500000,
    warningThreshold: 20
  });
  const [showSettings, setShowSettings] = useState(false);

  const bigCashBalance = balances.find(b => b.cashType === 'big')?.balance || 0;
  const smallCashBalance = balances.find(b => b.cashType === 'small')?.balance || 0;

  const HiddenValue = ({ value, prefix = 'Rp', className = '' }: { value: number, prefix?: string, className?: string }) => {
    const [isVisible, setIsVisible] = useState(false);
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span>
          {isVisible ? `Rp ${value.toLocaleString('id-ID')}` : `${prefix} ••••••••`}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(!isVisible);
          }}
          className="text-white/70 hover:text-white transition-colors"
          title={isVisible ? "Sembunyikan" : "Tampilkan"}
        >
          {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    );
  };

  const HiddenValueDark = ({ value, prefix = 'Rp', className = '' }: { value: number, prefix?: string, className?: string }) => {
    const [isVisible, setIsVisible] = useState(false);
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span>
          {isVisible ? `Rp ${value.toLocaleString('id-ID')}` : `${prefix} ••••••••`}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(!isVisible);
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title={isVisible ? "Sembunyikan" : "Tampilkan"}
        >
          {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    );
  };

  // Load settings from Supabase
  useEffect(() => {
    loadSettings();
  }, []);

  // Calculate statistics
  useEffect(() => {
    calculateStats();
  }, [transactions]);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('cash_balance_settings')
        .eq('user_id', user.id)
        .single();

      if (!error && data?.cash_balance_settings) {
        setSettings(data.cash_balance_settings);
      }
    } catch (error) {
      console.log('Settings not found, using defaults');
    }
  };

  const saveSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          cash_balance_settings: settings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      alert('✅ Pengaturan berhasil disimpan!');
      setShowSettings(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('❌ Gagal menyimpan pengaturan');
    }
  };

  const calculateStats = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Get start of week (Monday)
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // Get start of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayIncome = 0, todayExpense = 0;
    let weekIncome = 0, weekExpense = 0;
    let monthIncome = 0, monthExpense = 0;

    transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      const amount = tx.amount;

      // Today
      if (tx.date === today) {
        if (tx.transactionType === 'income') todayIncome += amount;
        else todayExpense += amount;
      }

      // This week
      if (txDate >= startOfWeek) {
        if (tx.transactionType === 'income') weekIncome += amount;
        else weekExpense += amount;
      }

      // This month
      if (txDate >= startOfMonth) {
        if (tx.transactionType === 'income') monthIncome += amount;
        else monthExpense += amount;
      }
    });

    setStats({
      todayIncome,
      todayExpense,
      weekIncome,
      weekExpense,
      monthIncome,
      monthExpense
    });
  };

  // Check if balance is low
  const isBigCashLow = bigCashBalance < settings.minBalanceBig;
  const isSmallCashLow = smallCashBalance < settings.minBalanceSmall;
  
  const bigCashWarningLevel = (bigCashBalance / settings.minBalanceBig) * 100;
  const smallCashWarningLevel = (smallCashBalance / settings.minBalanceSmall) * 100;

  const getBigCashStatus = () => {
    if (bigCashBalance < settings.minBalanceBig * 0.5) return 'critical';
    if (bigCashBalance < settings.minBalanceBig) return 'warning';
    return 'good';
  };

  const getSmallCashStatus = () => {
    if (smallCashBalance < settings.minBalanceSmall * 0.5) return 'critical';
    if (smallCashBalance < settings.minBalanceSmall) return 'warning';
    return 'good';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Ringkasan Kas</h3>
      </div>

      {/* Warning Alerts */}
      {(isBigCashLow || isSmallCashLow) && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="font-medium text-amber-900 mb-1">⚠️ Peringatan Saldo Rendah!</h4>
              <div className="text-sm text-amber-800 space-y-1">
                {isBigCashLow && (
                  <div className="flex items-center gap-1">• Kas Besar: <HiddenValueDark value={bigCashBalance} /> (di bawah minimum Rp {settings.minBalanceBig.toLocaleString('id-ID')})</div>
                )}
                {isSmallCashLow && (
                  <div className="flex items-center gap-1">• Kas Kecil: <HiddenValueDark value={smallCashBalance} /> (di bawah minimum Rp {settings.minBalanceSmall.toLocaleString('id-ID')})</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kas Besar */}
        <div className={`bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 text-white shadow-lg border-2 ${
          getBigCashStatus() === 'critical' ? 'border-red-500 animate-pulse' :
          getBigCashStatus() === 'warning' ? 'border-yellow-500' :
          'border-transparent'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-purple-100 text-sm mb-1">Kas Besar</p>
              <h3 className="text-2xl font-bold">
                <HiddenValue value={bigCashBalance} />
              </h3>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Wallet size={24} />
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-purple-100">Minimum: Rp {settings.minBalanceBig.toLocaleString('id-ID')}</span>
              <span className={`font-medium ${
                getBigCashStatus() === 'critical' ? 'text-red-300' :
                getBigCashStatus() === 'warning' ? 'text-yellow-300' :
                'text-green-300'
              }`}>
                {bigCashWarningLevel.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  getBigCashStatus() === 'critical' ? 'bg-red-400' :
                  getBigCashStatus() === 'warning' ? 'bg-yellow-400' :
                  'bg-green-400'
                }`}
                style={{ width: `${Math.min(bigCashWarningLevel, 100)}%` }}
              />
            </div>
          </div>

          {getBigCashStatus() !== 'good' && (
            <div className="mt-3 text-xs bg-white/10 rounded-lg px-3 py-2">
              {getBigCashStatus() === 'critical' ? '🚨 Saldo kritis!' : '⚠️ Saldo rendah'} Pertimbangkan untuk menambah saldo.
            </div>
          )}
        </div>

        {/* Kas Kecil */}
        <div className={`bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-6 text-white shadow-lg border-2 ${
          getSmallCashStatus() === 'critical' ? 'border-red-500 animate-pulse' :
          getSmallCashStatus() === 'warning' ? 'border-yellow-500' :
          'border-transparent'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-amber-100 text-sm mb-1">Kas Kecil</p>
              <h3 className="text-2xl font-bold">
                <HiddenValue value={smallCashBalance} />
              </h3>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <DollarSign size={24} />
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-amber-100">Minimum: Rp {settings.minBalanceSmall.toLocaleString('id-ID')}</span>
              <span className={`font-medium ${
                getSmallCashStatus() === 'critical' ? 'text-red-300' :
                getSmallCashStatus() === 'warning' ? 'text-yellow-300' :
                'text-green-300'
              }`}>
                {smallCashWarningLevel.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  getSmallCashStatus() === 'critical' ? 'bg-red-400' :
                  getSmallCashStatus() === 'warning' ? 'bg-yellow-400' :
                  'bg-green-400'
                }`}
                style={{ width: `${Math.min(smallCashWarningLevel, 100)}%` }}
              />
            </div>
          </div>

          {getSmallCashStatus() !== 'good' && (
            <div className="mt-3 text-xs bg-white/10 rounded-lg px-3 py-2">
              {getSmallCashStatus() === 'critical' ? '🚨 Saldo kritis!' : '⚠️ Saldo rendah'} Pertimbangkan transfer dari Kas Besar.
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={18} className="text-blue-600" />
            <h4 className="font-medium text-gray-700">Hari Ini</h4>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <ArrowUpRight size={14} className="text-green-600" />
                Pemasukan
              </span>
              <div className="font-medium text-green-600 flex items-center gap-1">
                +<HiddenValueDark value={stats.todayIncome} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <ArrowDownRight size={14} className="text-red-600" />
                Pengeluaran
              </span>
              <div className="font-medium text-red-600 flex items-center gap-1">
                -<HiddenValueDark value={stats.todayExpense} />
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Selisih</span>
                <div className={`font-bold flex items-center gap-1 ${stats.todayIncome - stats.todayExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.todayIncome - stats.todayExpense >= 0 ? '+' : ''}
                  <HiddenValueDark value={Math.abs(stats.todayIncome - stats.todayExpense)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* This Week */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-indigo-600" />
            <h4 className="font-medium text-gray-700">Minggu Ini</h4>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <ArrowUpRight size={14} className="text-green-600" />
                Pemasukan
              </span>
              <div className="font-medium text-green-600 flex items-center gap-1">
                +<HiddenValueDark value={stats.weekIncome} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <ArrowDownRight size={14} className="text-red-600" />
                Pengeluaran
              </span>
              <div className="font-medium text-red-600 flex items-center gap-1">
                -<HiddenValueDark value={stats.weekExpense} />
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Selisih</span>
                <div className={`font-bold flex items-center gap-1 ${stats.weekIncome - stats.weekExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.weekIncome - stats.weekExpense >= 0 ? '+' : ''}
                  <HiddenValueDark value={Math.abs(stats.weekIncome - stats.weekExpense)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={18} className="text-purple-600" />
            <h4 className="font-medium text-gray-700">Bulan Ini</h4>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <ArrowUpRight size={14} className="text-green-600" />
                Pemasukan
              </span>
              <div className="font-medium text-green-600 flex items-center gap-1">
                +<HiddenValueDark value={stats.monthIncome} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <ArrowDownRight size={14} className="text-red-600" />
                Pengeluaran
              </span>
              <div className="font-medium text-red-600 flex items-center gap-1">
                -<HiddenValueDark value={stats.monthExpense} />
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Selisih</span>
                <div className={`font-bold flex items-center gap-1 ${stats.monthIncome - stats.monthExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.monthIncome - stats.monthExpense >= 0 ? '+' : ''}
                  <HiddenValueDark value={Math.abs(stats.monthIncome - stats.monthExpense)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Button */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl px-4 py-3 transition-colors flex items-center justify-center gap-2"
      >
        <span>⚙️ Pengaturan Saldo Minimum</span>
      </button>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white border-2 border-blue-200 rounded-xl p-6 space-y-4">
          <h3 className="font-bold text-gray-800 mb-4">⚙️ Pengaturan Saldo Minimum</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Saldo Kas Besar
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
              <input
                type="number"
                value={settings.minBalanceBig}
                onChange={(e) => setSettings({ ...settings, minBalanceBig: parseFloat(e.target.value) || 0 })}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="100000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Saldo Kas Kecil
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
              <input
                type="number"
                value={settings.minBalanceSmall}
                onChange={(e) => setSettings({ ...settings, minBalanceSmall: parseFloat(e.target.value) || 0 })}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="100000"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowSettings(false)}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={saveSettings}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Simpan Pengaturan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
