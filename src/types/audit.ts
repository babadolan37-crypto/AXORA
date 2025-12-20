// Types for Audit Log Module

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'export'
  | 'login'
  | 'logout';

export type AuditResource =
  | 'income'
  | 'expense'
  | 'invoice'
  | 'budget'
  | 'recurring'
  | 'approval'
  | 'user'
  | 'settings'
  | 'tax'
  | 'cash';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId: string;
  oldValue?: any; // Previous state (JSON)
  newValue?: any; // New state (JSON)
  changes?: string[]; // Array of changed fields
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
}

export interface AuditLogFilter {
  startDate?: string;
  endDate?: string;
  userId?: string;
  action?: AuditAction;
  resource?: AuditResource;
  searchTerm?: string;
}

export interface AuditSummary {
  period: {
    start: string;
    end: string;
  };
  totalActions: number;
  actionsByType: Record<AuditAction, number>;
  actionsByResource: Record<AuditResource, number>;
  topUsers: Array<{
    userId: string;
    userName: string;
    actionCount: number;
  }>;
  recentCriticalActions: AuditLog[]; // Deletes, approvals, etc.
}
