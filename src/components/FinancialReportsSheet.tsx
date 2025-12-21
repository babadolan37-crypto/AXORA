import { useState } from 'react';
import { 
  Printer,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { IncomeEntry, ExpenseEntry, DebtEntry } from '../types';
import { useCashManagement } from '../hooks/useCashManagement';
import { useAssetData } from '../hooks/useAssetData';

interface FinancialReportsSheetProps {
  incomeEntries: IncomeEntry[];
  expenseEntries: ExpenseEntry[];
  debtEntries: DebtEntry[];
}

type ReportType = 'income-statement' | 'balance-sheet' | 'cash-flow';

export function FinancialReportsSheet({ 
  incomeEntries, 
  expenseEntries, 
  debtEntries 
}: FinancialReportsSheetProps) {
  const [activeTab, setActiveTab] = useState<ReportType>('income-statement');
  const [period, setPeriod] = useState('month'); // month, quarter, year, all
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    revenue: true,
    opex: true,
    assets: true,
    liabilities: true,
    equity: true
  });

  const { balances } = useCashManagement();
  const { assets } = useAssetData();

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // --- Calculations ---

  // 1. Income Statement Data
  const calculateIncomeStatement = () => {
    // Filter by period if needed (skipping for now to show full data structure)
    // Group Income by Source
    const revenueBySource = incomeEntries.reduce((acc, entry) => {
      acc[entry.source] = (acc[entry.source] || 0) + entry.amount;
      return acc;
    }, {} as Record<string, number>);

    const totalRevenue = Object.values(revenueBySource).reduce((sum, val) => sum + val, 0);

    // Group Expenses by Category
    const expensesByCategory = expenseEntries.reduce((acc, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + entry.amount;
      return acc;
    }, {} as Record<string, number>);

    const totalExpenses = Object.values(expensesByCategory).reduce((sum, val) => sum + val, 0);
    const netIncome = totalRevenue - totalExpenses;

    return { revenueBySource, totalRevenue, expensesByCategory, totalExpenses, netIncome };
  };

  // 2. Balance Sheet Data
  const calculateBalanceSheet = () => {
    const totalCash = balances.reduce((sum, b) => sum + b.balance, 0);
    
    // Receivables (Piutang)
    const receivables = debtEntries
      .filter(d => d.type === 'Piutang' && d.paymentStatus === 'Tertunda')
      .reduce((sum, d) => sum + d.amount, 0);

    // Fixed Assets (Real Data)
    const fixedAssets = assets.reduce((sum, asset) => {
      // Use current_value if available (calculated in hook), otherwise purchase_cost
      return sum + (asset.current_value ?? asset.purchase_cost);
    }, 0);

    const totalAssets = totalCash + receivables + fixedAssets;

    // Payables (Utang)
    const payables = debtEntries
      .filter(d => d.type === 'Utang' && d.paymentStatus === 'Tertunda')
      .reduce((sum, d) => sum + d.amount, 0);

    const totalLiabilities = payables;

    // Equity = Assets - Liabilities
    const totalEquity = totalAssets - totalLiabilities;

    return {
      assets: {
        cash: totalCash,
        receivables,
        fixed: fixedAssets,
        total: totalAssets
      },
      liabilities: {
        payables,
        total: totalLiabilities
      },
      equity: {
        total: totalEquity
      }
    };
  };

  const incomeStatement = calculateIncomeStatement();
  const balanceSheet = calculateBalanceSheet();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl text-gray-900">Laporan Keuangan</h2>
          <p className="text-sm text-gray-600 mt-1">
            Laporan standar untuk analisis bisnis dan pelaporan pajak
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          {/* Export Button */}
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
          >
            <Printer size={18} />
            <span className="hidden sm:inline">Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 border-b border-gray-200 print:hidden">
        <button
          onClick={() => setActiveTab('income-statement')}
          className={`px-4 py-2 whitespace-nowrap rounded-t-lg transition-colors border-b-2 ${
            activeTab === 'income-statement'
              ? 'border-blue-600 text-blue-600 bg-blue-50'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Laba Rugi (Income Statement)
        </button>
        <button
          onClick={() => setActiveTab('balance-sheet')}
          className={`px-4 py-2 whitespace-nowrap rounded-t-lg transition-colors border-b-2 ${
            activeTab === 'balance-sheet'
              ? 'border-blue-600 text-blue-600 bg-blue-50'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Neraca (Balance Sheet)
        </button>
        <button
          onClick={() => setActiveTab('cash-flow')}
          className={`px-4 py-2 whitespace-nowrap rounded-t-lg transition-colors border-b-2 ${
            activeTab === 'cash-flow'
              ? 'border-blue-600 text-blue-600 bg-blue-50'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Arus Kas (Cash Flow)
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[500px] p-6">
        
        {/* --- INCOME STATEMENT --- */}
        {activeTab === 'income-statement' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-gray-900">Laporan Laba Rugi</h3>
              <p className="text-sm text-gray-500">Periode: Semua Waktu</p>
            </div>

            {/* Revenue Section */}
            <div className="border-b border-gray-100 pb-4">
              <button 
                onClick={() => toggleSection('revenue')}
                className="flex items-center w-full justify-between mb-2 hover:bg-gray-50 p-1 rounded"
              >
                <h4 className="font-semibold text-gray-800">PENDAPATAN USAHA</h4>
                {expandedSections['revenue'] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              
              {expandedSections['revenue'] && (
                <div className="space-y-2 pl-4 text-sm">
                  {Object.entries(incomeStatement.revenueBySource).map(([source, amount]) => (
                    <div key={source} className="flex justify-between text-gray-600">
                      <span>{source}</span>
                      <span>{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100 font-medium text-gray-900">
                <span>Total Pendapatan</span>
                <span>{formatCurrency(incomeStatement.totalRevenue)}</span>
              </div>
            </div>

            {/* Expenses Section */}
            <div className="border-b border-gray-100 pb-4">
              <button 
                onClick={() => toggleSection('opex')}
                className="flex items-center w-full justify-between mb-2 hover:bg-gray-50 p-1 rounded"
              >
                <h4 className="font-semibold text-gray-800">BEBAN OPERASIONAL</h4>
                {expandedSections['opex'] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {expandedSections['opex'] && (
                <div className="space-y-2 pl-4 text-sm">
                  {Object.entries(incomeStatement.expensesByCategory).map(([category, amount]) => (
                    <div key={category} className="flex justify-between text-gray-600">
                      <span>{category}</span>
                      <span>{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100 font-medium text-gray-900">
                <span>Total Beban</span>
                <span>{formatCurrency(incomeStatement.totalExpenses)}</span>
              </div>
            </div>

            {/* Net Income */}
            <div className="pt-4 mt-4 bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center text-lg font-bold">
                <span className={incomeStatement.netIncome >= 0 ? "text-gray-900" : "text-red-600"}>
                  Laba (Rugi) Bersih
                </span>
                <span className={incomeStatement.netIncome >= 0 ? "text-green-600" : "text-red-600"}>
                  {formatCurrency(incomeStatement.netIncome)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* --- BALANCE SHEET --- */}
        {activeTab === 'balance-sheet' && (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-gray-900">Neraca Keuangan</h3>
              <p className="text-sm text-gray-500">Posisi per Hari Ini</p>
            </div>

            {/* ASSETS */}
            <div>
              <div className="bg-blue-50 p-2 rounded mb-4">
                <h4 className="font-bold text-blue-800">ASET (ACTIVA)</h4>
              </div>
              
              <div className="space-y-4 pl-2">
                <div>
                  <h5 className="font-semibold text-gray-700 mb-2">Aset Lancar</h5>
                  <div className="space-y-2 pl-4 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Kas & Setara Kas</span>
                      <span>{formatCurrency(balanceSheet.assets.cash)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Piutang Usaha (Account Receivable)</span>
                      <span>{formatCurrency(balanceSheet.assets.receivables)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-700 mb-2">Aset Tetap</h5>
                  <div className="space-y-2 pl-4 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Peralatan & Inventaris</span>
                      <span>{formatCurrency(balanceSheet.assets.fixed)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-200 font-bold text-gray-900">
                  <span>TOTAL ASET</span>
                  <span>{formatCurrency(balanceSheet.assets.total)}</span>
                </div>
              </div>
            </div>

            {/* LIABILITIES & EQUITY */}
            <div>
              <div className="bg-red-50 p-2 rounded mb-4">
                <h4 className="font-bold text-red-800">KEWAJIBAN & EKUITAS (PASIVA)</h4>
              </div>

              <div className="space-y-4 pl-2">
                <div>
                  <h5 className="font-semibold text-gray-700 mb-2">Kewajiban (Liabilitas)</h5>
                  <div className="space-y-2 pl-4 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Utang Usaha (Account Payable)</span>
                      <span>{formatCurrency(balanceSheet.liabilities.payables)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2 pl-4 text-sm font-medium text-gray-800">
                    <span>Total Kewajiban</span>
                    <span>{formatCurrency(balanceSheet.liabilities.total)}</span>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-700 mb-2">Ekuitas (Modal)</h5>
                  <div className="space-y-2 pl-4 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Modal Bersih (Net Equity)</span>
                      <span>{formatCurrency(balanceSheet.equity.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-200 font-bold text-gray-900">
                  <span>TOTAL KEWAJIBAN & EKUITAS</span>
                  <span>{formatCurrency(balanceSheet.liabilities.total + balanceSheet.equity.total)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- CASH FLOW --- */}
        {activeTab === 'cash-flow' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-gray-900">Laporan Arus Kas</h3>
              <p className="text-sm text-gray-500">Metode Langsung (Direct Method)</p>
            </div>

            <div className="space-y-6">
              {/* Operating Activities */}
              <div>
                <h4 className="font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">Aktivitas Operasional</h4>
                <div className="space-y-2 pl-4 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Penerimaan Kas dari Pelanggan</span>
                    <span className="text-green-600">+{formatCurrency(incomeStatement.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Pembayaran Kas untuk Beban</span>
                    <span className="text-red-600">-{formatCurrency(incomeStatement.totalExpenses)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100 font-medium text-gray-900 pl-4">
                  <span>Arus Kas Bersih dari Operasional</span>
                  <span className={incomeStatement.netIncome >= 0 ? "text-green-600" : "text-red-600"}>
                    {formatCurrency(incomeStatement.netIncome)}
                  </span>
                </div>
              </div>

              {/* Investing Activities */}
              <div>
                <h4 className="font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">Aktivitas Investasi</h4>
                <div className="space-y-2 pl-4 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Pembelian Aset Tetap</span>
                    <span>Rp 0</span>
                  </div>
                </div>
              </div>

              {/* Financing Activities */}
              <div>
                <h4 className="font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">Aktivitas Pendanaan</h4>
                <div className="space-y-2 pl-4 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Penyetoran Modal / Penarikan</span>
                    <span>Rp 0</span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-lg mt-6">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Kenaikan (Penurunan) Kas Bersih</span>
                  <span className={incomeStatement.netIncome >= 0 ? "text-green-600" : "text-red-600"}>
                    {formatCurrency(incomeStatement.netIncome)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600 mt-2">
                  <span>Saldo Kas Awal (Estimasi)</span>
                  <span>{formatCurrency(balanceSheet.assets.cash - incomeStatement.netIncome)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-gray-900 mt-1">
                  <span>Saldo Kas Akhir</span>
                  <span>{formatCurrency(balanceSheet.assets.cash)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
