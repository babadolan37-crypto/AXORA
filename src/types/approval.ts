// Types for Approval Workflow Module

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type ApprovalLevel = 'manager' | 'director' | 'ceo';

export interface ApprovalRule {
  id: string;
  name: string;
  transactionType: 'income' | 'expense' | 'both';
  minAmount: number;
  maxAmount?: number;
  requiresApproval: boolean;
  approvalLevels: ApprovalLevel[];
  categoryFilter?: string[]; // If empty, applies to all categories
  active: boolean;
  createdAt: string;
  userId: string;
}

export interface ApprovalRequest {
  id: string;
  transactionType: 'income' | 'expense';
  transactionData: any; // The pending transaction data
  amount: number;
  category: string;
  description: string;
  requestedBy: string; // User ID or name
  requestedAt: string;
  currentLevel: ApprovalLevel;
  status: ApprovalStatus;
  approvalHistory: ApprovalAction[];
  finalApprovedAt?: string;
  linkedTransactionId?: string; // Created after approval
  userId: string;
}

export interface ApprovalAction {
  level: ApprovalLevel;
  approver: string; // User ID or name
  action: 'approved' | 'rejected';
  actionAt: string;
  notes?: string;
}

export interface Approver {
  id: string;
  name: string;
  email: string;
  level: ApprovalLevel;
  active: boolean;
  userId: string;
}
