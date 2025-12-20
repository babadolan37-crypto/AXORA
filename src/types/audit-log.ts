export type AuditAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'transfer' 
  | 'approve' 
  | 'reject'
  | 'assign'
  | 'submit';

export type AuditEntityType = 
  | 'income' 
  | 'expense' 
  | 'debt'
  | 'cash_transaction'
  | 'cash_transfer'
  | 'expense_assignment'
  | 'scheduled_transfer';

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditLogFilter {
  userId?: string;
  action?: AuditAction;
  entityType?: AuditEntityType;
  startDate?: string;
  endDate?: string;
}
