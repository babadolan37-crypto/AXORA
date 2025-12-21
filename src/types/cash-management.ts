// Jenis Kas
export type CashType = 'big' | 'small';
export type TransactionType = 'income' | 'expense';

// Saldo Kas
export interface CashBalance {
  id: string;
  cashType: CashType;
  balance: number;
  lastUpdated: string;
}

// Riwayat Transaksi Kas
export interface CashTransaction {
  id: string;
  date: string;
  cashType: CashType;
  transactionType: TransactionType;
  amount: number;
  description: string;
  proof?: string;
  // Inter-cash transfer fields
  isInterCashTransfer?: boolean;
  linkedTransactionId?: string; // ID of the paired transaction
  createdAt: string;
  updatedAt: string;
}

// Transfer Kas ke Karyawan
export interface CashTransfer {
  id: string;
  date: string;
  cashType: CashType;
  employeeName: string;
  transferAmount: number;
  actualExpense: number;
  difference: number;
  status: 'pending' | 'reported' | 'settled' | 'need_return' | 'need_payment';
  description: string;
  expenseDetails: ExpenseDetail[];
  notes?: string;
  returnAmount?: number;
  returnDate?: string;
  returnProof?: string;
  additionalPayment?: number;
  additionalPaymentDate?: string;
  additionalPaymentProof?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Detail Pengeluaran per Item
export interface ExpenseDetail {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  proof: string; // Base64 image or URL
  vendor?: string;
}

// Kategori Pengeluaran Kas
export const DEFAULT_CASH_EXPENSE_CATEGORIES = [
  'Transportasi',
  'Makanan',
  'ATK (Alat Tulis Kantor)',
  'Operasional',
  'Komunikasi',
  'Utilitas',
  'Lain-lain'
];

// Options untuk Dropdown
export const CASH_TYPE_OPTIONS = [
  { value: 'big' as CashType, label: 'Kas Besar' },
  { value: 'small' as CashType, label: 'Kas Kecil' }
];