// Types for Bank Reconciliation Module

export type ReconciliationStatus = 'unmatched' | 'matched' | 'reviewed' | 'discrepancy';

export interface BankStatement {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  uploadDate: string;
  statementDate: string;
  fileName: string;
  fileUrl?: string;
  transactions: BankTransaction[];
  reconciled: boolean;
  reconciledAt?: string;
  reconciledBy?: string;
  userId: string;
}

export interface BankTransaction {
  id: string;
  statementId: string;
  date: string;
  description: string;
  reference?: string;
  debit: number; // Money out
  credit: number; // Money in
  balance: number;
  status: ReconciliationStatus;
  matchedTransactionId?: string; // Link to income/expense entry
  matchScore?: number; // 0-100, confidence of auto-match
  notes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface ReconciliationMatch {
  bankTransactionId: string;
  systemTransactionId: string;
  matchType: 'auto' | 'manual' | 'suggested';
  confidence: number; // 0-100
  matchedAt: string;
  matchedBy: string;
}

export interface ReconciliationSummary {
  statementId: string;
  period: {
    start: string;
    end: string;
  };
  bankBalance: {
    opening: number;
    closing: number;
  };
  systemBalance: {
    opening: number;
    closing: number;
  };
  transactions: {
    total: number;
    matched: number;
    unmatched: number;
    discrepancies: number;
  };
  variance: number; // Difference between bank and system
  reconciled: boolean;
}

export interface BankAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  accountType: 'checking' | 'savings' | 'credit';
  currency: string;
  active: boolean;
  openingBalance: number;
  currentBalance: number;
  lastReconciled?: string;
  userId: string;
}
