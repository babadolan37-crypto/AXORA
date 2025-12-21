import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { TrendingDown, Activity, AlertTriangle, Wallet } from 'lucide-react';
import { IncomeEntry, ExpenseEntry } from '../types/accounting';
import { CashBalance } from '../types/cash-management';

interface FinancialHealthProps {
  incomeEntries: IncomeEntry[];
  expenseEntries: ExpenseEntry[];
  balances: CashBalance[];
  periodFilter: string;
}

export function FinancialHealth({ incomeEntries, expenseEntries, balances, periodFilter }: FinancialHealthProps) {
  // Calculate metrics based on filtered data (assumed passed in is already filtered or full data?)
  // Ideally, we should receive *filtered* data for the period analysis, 
  // but *current* balances for Runway.
  
  // Let's assume incomeEntries and expenseEntries are FILTERED for the period (e.g. this month).
  // balances are always CURRENT.

  const totalIncome = incomeEntries.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = expenseEntries.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalIncome - totalExpense;
  
  const totalCash = balances.reduce((sum, b) => sum + b.balance, 0);

  // 1. Net Profit Margin
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
  
  // 2. Burn Rate (Avg Daily Expense in this period)
  // We need to know the number of days in the period.
  // For simplicity, if period is 'month', use 30. If 'week', use 7.
  const getDaysInPeriod = () => {
    if (periodFilter === 'week') return 7;
    if (periodFilter === 'month') return 30;
    if (periodFilter === 'year') return 365;
    if (periodFilter === 'day') return 1;
    return 30; // Default fallback
  };
  
  const days = getDaysInPeriod();
  const burnRate = totalExpense / days; // Daily burn rate
  
  // 3. Runway (Days left of cash)
  // If burnRate is 0, runway is infinite.
  const runwayDays = burnRate > 0 ? totalCash / burnRate : 999;

  // 4. Savings Rate (same as profit margin but conceptualized differently)
  // Let's use Expense to Income Ratio
  const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {/* Profit Margin Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {profitMargin.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {profitMargin >= 20 ? 'Sehat (>20%)' : profitMargin > 0 ? 'Positif' : 'Perlu Perhatian'}
          </p>
          <Progress value={Math.max(0, Math.min(100, profitMargin))} className="mt-3 h-2" />
        </CardContent>
      </Card>

      {/* Burn Rate Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Burn Rate (Harian)</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(burnRate)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Rata-rata pengeluaran per hari
          </p>
        </CardContent>
      </Card>

      {/* Runway Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cash Runway</CardTitle>
          <Wallet className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {runwayDays > 365 ? '> 1 Tahun' : `${Math.floor(runwayDays)} Hari`}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Estimasi sisa nafas kas
          </p>
          <Progress 
            value={Math.min(100, (runwayDays / 90) * 100)} // Scale based on 3 months (90 days)
            className={`mt-3 h-2 ${runwayDays < 30 ? 'bg-red-100' : 'bg-green-100'}`} 
            // Note: color customization for Progress component depends on implementation
          />
        </CardContent>
      </Card>

      {/* Expense Ratio Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rasio Biaya</CardTitle>
          <AlertTriangle className={`h-4 w-4 ${expenseRatio > 80 ? 'text-red-500' : 'text-yellow-500'}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {expenseRatio.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            dari Total Pemasukan
          </p>
          <Progress value={expenseRatio} className="mt-3 h-2" />
        </CardContent>
      </Card>
    </div>
  );
}
