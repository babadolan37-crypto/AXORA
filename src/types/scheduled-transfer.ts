import { CashType } from './cash-management';

export type TransferFrequency = 'weekly' | 'biweekly' | 'monthly';
export type ScheduledTransferStatus = 'active' | 'paused' | 'completed';

export interface ScheduledTransfer {
  id: string;
  fromCash: CashType;
  toCash: CashType;
  amount: number;
  frequency: TransferFrequency;
  dayOfWeek?: number; // 0-6 for weekly (0 = Sunday)
  dayOfMonth?: number; // 1-31 for monthly
  nextRunDate: string;
  lastRunDate?: string;
  status: ScheduledTransferStatus;
  description: string;
  autoApprove: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledTransferExecution {
  id: string;
  scheduledTransferId: string;
  executedAt: string;
  amount: number;
  status: 'success' | 'failed';
  transactionId?: string;
  errorMessage?: string;
}
