import { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Settings,
  Calendar,
  Download,
  BarChart3,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { IncomeEntry, ExpenseEntry } from '../types/accounting';
import { useCashManagement } from '../hooks/useCashManagement';
import { useAdvancePayment } from '../hooks/useAdvancePayment';
import { SetBalanceModal } from './SetBalanceModal';
import { CashType } from '../types/cash-management';
import { exportToExcel as exportToExcelUtil } from '../utils/excelExport';
import { FinancialHealth } from './FinancialHealth';

interface DashboardSheetProps {
  incomeEntries: IncomeEntry[];
  expenseEntries: ExpenseEntry[];
  expenseCategories: string[];
  employees: string[];
}

export function DashboardSheet({
  incomeEntries,
  expenseEntries,
  expenseCategories,
}: DashboardSheetProps) {
  const cashManagement = useCashManagement();
  const {
    transactions: cashTransactions,
    balances,
    setBalance,
  } = cashManagement;

  const { advances } = useAdvancePayment();

  const [periodFilter, setPeriodFilter] = useState('week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showBalanceModal, setShowBalanceModal] = useState<CashType | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'detail'>('overview');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const HiddenValue = ({ value, prefix = 'Rp', className = '' }: { value: number, prefix?: string, className?: string }) => {
    const [isVisible, setIsVisible] = useState(false);
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span>
          {isVisible ? formatCurrency(value) : `${prefix} ••••••••`}
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
          {isVisible ? formatCurrency(value) : `${prefix} ••••••••`}
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

  const filterByPeriod = (date: string) => {
    const entryDate = new Date(date);
    const now = new Date();

    if (periodFilter === 'custom') {
      if (startDate && endDate) {
        return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
      }
      return true;
    }

    if (periodFilter === 'day') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      return entryDate >= todayStart && entryDate <= todayEnd;
    }

    if (periodFilter === '3days') {
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(now.getDate() - 2);
      threeDaysAgo.setHours(0, 0, 0, 0);
      return entryDate >= threeDaysAgo;
    }

    if (periodFilter === 'week') {
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 6);
      oneWeekAgo.setHours(0, 0, 0, 0);
      return entryDate >= oneWeekAgo;
    }

    if (periodFilter === 'month') {
      return (
        entryDate.getMonth() === now.getMonth() &&
        entryDate.getFullYear() === now.getFullYear()
      );
    }

    if (periodFilter === 'year') {
      return entryDate.getFullYear() === now.getFullYear();
    }

    return true;
  };

  const filteredIncomes = useMemo(() => {
    return incomeEntries.filter((entry) => filterByPeriod(entry.date));
  }, [incomeEntries, periodFilter, startDate, endDate]);

  const filteredExpenses = useMemo(() => {
    return expenseEntries.filter((entry) => filterByPeriod(entry.date));
  }, [expenseEntries, periodFilter, startDate, endDate]);

  const filteredCashTransactions = useMemo(() => {
    return cashTransactions.filter((t) => filterByPeriod(t.date));
  }, [cashTransactions, periodFilter, startDate, endDate]);

  const filteredAdvances = useMemo(() => {
    return advances.filter((a) => filterByPeriod(a.advance_date));
  }, [advances, periodFilter, startDate, endDate]);

  const totalIncome = useMemo(() => {
    return filteredIncomes.reduce((sum, entry) => sum + entry.amount, 0);
  }, [filteredIncomes]);

  const totalExpense = useMemo(() => {
    return filteredExpenses.reduce((sum, entry) => sum + entry.amount, 0);
  }, [filteredExpenses]);

  const netProfit = totalIncome - totalExpense;

  // Cash balances
  const bigCashBalance = balances.find((b) => b.cashType === 'big')?.balance || 0;
  const smallCashBalance = balances.find((b) => b.cashType === 'small')?.balance || 0;
  const totalCash = bigCashBalance + smallCashBalance;

  // Low balance thresholds
  // TODO: Get from user settings
  const lowBalanceThresholdBig = 0;
  const lowBalanceThresholdSmall = 0;

  // Cash transactions summary
  const cashIncome = useMemo(() => {
    return cashTransactions
      .filter((t) => t.transactionType === 'in')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [cashTransactions]);

  const cashExpense = useMemo(() => {
    return cashTransactions
      .filter((t) => t.transactionType === 'out')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [cashTransactions]);

  const getStartDateForFilter = () => {
    const now = new Date();
    if (periodFilter === 'custom' && startDate) {
        return new Date(startDate);
    }
    if (periodFilter === 'day') {
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    if (periodFilter === '3days') {
        const d = new Date(now);
        d.setDate(now.getDate() - 2);
        d.setHours(0, 0, 0, 0);
        return d;
    }
    if (periodFilter === 'week') {
        const d = new Date(now);
        d.setDate(now.getDate() - 6);
        d.setHours(0, 0, 0, 0);
        return d;
    }
    if (periodFilter === 'month') {
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    if (periodFilter === 'year') {
        return new Date(now.getFullYear(), 0, 1);
    }
    // Default (e.g. if 'all' or undefined) - return very old date or null
    return new Date(0); 
  };

  const calculateOpeningBalances = () => {
      const start = getStartDateForFilter();
      if (start.getTime() === 0) return { big: 0, small: 0 }; // Assume 0 if all time

      // We need to sum up all transactions BEFORE 'start'
      // Note: This relies on loaded 'incomeEntries', 'expenseEntries', etc. being ALL history.
      // If they are paginated, this will be wrong. Assuming they are all loaded as per current hooks.
      
      // But wait, the balances from 'useCashManagement' are the CURRENT balances.
      // So Opening Balance = Current Balance - (Sum of transactions >= start)
      // Actually: Opening Balance = Current Balance - (Incomes >= start) + (Expenses >= start) ...
      // This approach is safer if we trust the current balance is correct.
      
      const bigCurrent = balances.find((b) => b.cashType === 'big')?.balance || 0;
      const smallCurrent = balances.find((b) => b.cashType === 'small')?.balance || 0;

      // Calculate net change during the filtered period
      let netChangeBig = 0;
      let netChangeSmall = 0;

      // Incomes during period
      filteredIncomes.forEach(i => {
          if (i.cashType === 'big') netChangeBig += i.amount;
          else netChangeSmall += i.amount;
      });

      // Expenses during period
      filteredExpenses.forEach(e => {
          if (e.cashType === 'big') netChangeBig -= e.amount;
          else netChangeSmall -= e.amount;
      });

      // Cash Transfers during period
      filteredCashTransactions.forEach(t => {
          if (t.transactionType === 'in') {
              if (t.cashType === 'big') netChangeBig += t.amount;
              else netChangeSmall += t.amount;
          } else {
              if (t.cashType === 'big') netChangeBig -= t.amount;
              else netChangeSmall -= t.amount;
          }
      });

      // Advances during period (treated as expense/credit)
      filteredAdvances.forEach(a => {
          if (a.cash_type === 'big') netChangeBig -= a.advance_amount;
          else netChangeSmall -= a.advance_amount;
      });

      // Opening = Current - NetChange
      return {
          big: bigCurrent - netChangeBig,
          small: smallCurrent - netChangeSmall
      };
  };

  const exportToExcel = () => {
    const { big, small } = calculateOpeningBalances();
    exportToExcelUtil(
      filteredIncomes,
      filteredExpenses,
      filteredCashTransactions,
      filteredAdvances,
      big,
      small
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl text-gray-900">Dashboard Keuangan</h2>
          <p className="text-sm text-gray-600 mt-1">
            Rekapitulasi transaksi dan manajemen kas
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveView('overview')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeView === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BarChart3 size={18} className="inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveView('detail')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeView === 'detail'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Receipt size={18} className="inline mr-2" />
            Detail
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Period Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
          <Calendar size={20} className="text-gray-600 hidden md:block" />
          <div className="flex flex-wrap gap-2 flex-1">
            {['day', '3days', 'week', 'month', 'year', 'custom'].map((period) => (
              <button
                key={period}
                onClick={() => setPeriodFilter(period)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  periodFilter === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period === 'day' && 'Hari Ini'}
                {period === '3days' && '3 Hari'}
                {period === 'week' && 'Minggu Ini'}
                {period === 'month' && 'Bulan Ini'}
                {period === 'year' && 'Tahun Ini'}
                {period === 'custom' && 'Custom'}
              </button>
            ))}
          </div>

          {periodFilter === 'custom' && (
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
              <span className="py-1.5 text-gray-500">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {activeView === 'overview' ? (
        <>
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Pemasukan */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-green-100 text-sm mb-1">Total Pemasukan</p>
                  <h3 className="text-2xl"><HiddenValue value={totalIncome} /></h3>
                  <p className="text-xs text-green-100 mt-1">{filteredIncomes.length} transaksi</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <ArrowUpRight size={24} />
                </div>
              </div>
            </div>

            {/* Total Pengeluaran */}
            <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-6 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-red-100 text-sm mb-1">Total Pengeluaran</p>
                  <h3 className="text-2xl"><HiddenValue value={totalExpense} /></h3>
                  <p className="text-xs text-red-100 mt-1">{filteredExpenses.length} transaksi</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <ArrowDownRight size={24} />
                </div>
              </div>
            </div>

            {/* Laba/Rugi */}
            <div className={`bg-gradient-to-br ${netProfit >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} text-white rounded-xl p-6 shadow-lg`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white/80 text-sm mb-1">
                    {netProfit >= 0 ? 'Laba Bersih' : 'Rugi'}
                  </p>
                  <h3 className="text-2xl"><HiddenValue value={Math.abs(netProfit)} /></h3>
                  <p className="text-xs text-white/80 mt-1">
                    {netProfit >= 0 ? 'Profit' : 'Loss'} {((Math.abs(netProfit) / (totalIncome || 1)) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  {netProfit >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                </div>
              </div>
            </div>

            {/* Total Kas */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-purple-100 text-sm mb-1">Total Kas</p>
                  <h3 className="text-2xl"><HiddenValue value={totalCash} /></h3>
                  <p className="text-xs text-purple-100 mt-1">{cashTransactions.length} transaksi kas</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <Wallet size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Financial Health Analysis */}
          <FinancialHealth 
            incomeEntries={filteredIncomes}
            expenseEntries={filteredExpenses}
            balances={balances}
            periodFilter={periodFilter}
          />

          {/* Kas Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kas Besar */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Wallet size={20} className="text-blue-600" />
                    </div>
                    <h3 className="text-gray-900">Kas Besar</h3>
                  </div>
                  <div className="text-3xl text-gray-900 mb-1"><HiddenValueDark value={bigCashBalance} /></div>
                  {bigCashBalance < lowBalanceThresholdBig && lowBalanceThresholdBig > 0 && (
                    <div className="flex items-center gap-1 text-amber-600 text-xs mt-2">
                      <span>⚠️ Saldo rendah (batas: {formatCurrency(lowBalanceThresholdBig)})</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowBalanceModal('big')}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Atur Saldo Awal & Batas Rendah"
                >
                  <Settings size={20} />
                </button>
              </div>
            </div>

            {/* Kas Kecil */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-amber-100 p-2 rounded-lg">
                      <Wallet size={20} className="text-amber-600" />
                    </div>
                    <h3 className="text-gray-900">Kas Kecil</h3>
                  </div>
                  <div className="text-3xl text-gray-900 mb-1"><HiddenValueDark value={smallCashBalance} /></div>
                  {smallCashBalance < lowBalanceThresholdSmall && lowBalanceThresholdSmall > 0 && (
                    <div className="flex items-center gap-1 text-amber-600 text-xs mt-2">
                      <span>⚠️ Saldo rendah (batas: {formatCurrency(lowBalanceThresholdSmall)})</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowBalanceModal('small')}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Atur Saldo Awal & Batas Rendah"
                >
                  <Settings size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Cash Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <TrendingUp size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Kas Masuk</p>
                  <div className="text-2xl text-gray-900"><HiddenValueDark value={cashIncome} /></div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-3 rounded-lg">
                  <TrendingDown size={24} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Kas Keluar</p>
                  <div className="text-2xl text-gray-900"><HiddenValueDark value={cashExpense} /></div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Detail View - Breakdown by Category */}
          <div className="space-y-6">
            {/* Expense by Category */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-gray-900">Pengeluaran per Kategori</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {expenseCategories.map((category) => {
                    const categoryExpenses = filteredExpenses.filter(
                      (e) => e.category === category
                    );
                    const categoryTotal = categoryExpenses.reduce(
                      (sum, e) => sum + e.amount,
                      0
                    );
                    const percentage =
                      totalExpense > 0 ? (categoryTotal / totalExpense) * 100 : 0;

                    if (categoryTotal === 0) return null;

                    return (
                      <div key={category}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-700">{category}</span>
                          <div className="text-sm text-gray-900">
                            <HiddenValueDark value={categoryTotal} />
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {percentage.toFixed(1)}% dari total pengeluaran
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-gray-900">Transaksi Terbaru (Pemasukan & Pengeluaran)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm text-gray-700">Tanggal</th>
                      <th className="text-left px-6 py-3 text-sm text-gray-700">Tipe</th>
                      <th className="text-left px-6 py-3 text-sm text-gray-700">Kategori</th>
                      <th className="text-left px-6 py-3 text-sm text-gray-700">Deskripsi</th>
                      <th className="text-right px-6 py-3 text-sm text-gray-700">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[
                      ...filteredIncomes.map((e) => ({ ...e, type: 'income' })),
                      ...filteredExpenses.map((e) => ({ ...e, type: 'expense' })),
                    ]
                      .sort(
                        (a, b) =>
                          new Date(b.date).getTime() - new Date(a.date).getTime()
                      )
                      .slice(0, 10)
                      .map((entry, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {new Date(entry.date).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                                entry.type === 'income'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {entry.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {entry.type === 'income' ? (entry as any).source : (entry as any).category || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                            {entry.description}
                          </td>
                          <td className="px-6 py-4 text-sm text-right">
                            <span
                              className={
                                entry.type === 'income'
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }
                            >
                              {entry.type === 'income' ? '+' : '-'}
                              {formatCurrency(entry.amount)}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      {showBalanceModal && (
        <SetBalanceModal
          cashType={showBalanceModal}
          currentBalance={balances.find(b => b.cashType === showBalanceModal)?.balance || 0}
          onSubmit={setBalance}
          onCancel={() => setShowBalanceModal(null)}
        />
      )}
    </div>
  );
}