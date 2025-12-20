// Types for Financial Reports Module

export interface BalanceSheetData {
  date: string;
  assets: {
    current: {
      cash: number;
      accountsReceivable: number;
      inventory: number;
      prepaidExpenses: number;
    };
    fixed: {
      equipment: number;
      accumulatedDepreciation: number;
    };
  };
  liabilities: {
    current: {
      accountsPayable: number;
      accruedExpenses: number;
      shortTermDebt: number;
    };
    longTerm: {
      longTermDebt: number;
    };
  };
  equity: {
    capital: number;
    retainedEarnings: number;
  };
}

export interface IncomeStatementData {
  period: {
    start: string;
    end: string;
  };
  revenue: {
    sales: number;
    otherIncome: number;
  };
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: {
    [category: string]: number;
  };
  operatingIncome: number;
  otherExpenses: number;
  netIncome: number;
}

export interface CashFlowData {
  period: {
    start: string;
    end: string;
  };
  operating: {
    netIncome: number;
    adjustments: {
      depreciation: number;
      accountsReceivableChange: number;
      accountsPayableChange: number;
    };
    total: number;
  };
  investing: {
    equipmentPurchase: number;
    assetSales: number;
    total: number;
  };
  financing: {
    loanProceeds: number;
    loanRepayments: number;
    ownerContributions: number;
    dividends: number;
    total: number;
  };
  netChange: number;
  beginningCash: number;
  endingCash: number;
}
