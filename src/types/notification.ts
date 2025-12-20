// Types for Notification System Module

export type NotificationType =
  | 'low_balance'
  | 'budget_warning'
  | 'budget_exceeded'
  | 'invoice_overdue'
  | 'invoice_paid'
  | 'approval_pending'
  | 'approval_approved'
  | 'approval_rejected'
  | 'recurring_execution'
  | 'system';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string; // Link to relevant page
  actionLabel?: string; // e.g., "View Invoice", "Approve Now"
  metadata?: any; // Additional data (invoice ID, amount, etc.)
  createdAt: string;
  readAt?: string;
  userId: string;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  preferences: {
    [key in NotificationType]?: {
      enabled: boolean;
      email: boolean;
      push: boolean;
    };
  };
  updatedAt: string;
}

export interface NotificationTrigger {
  id: string;
  type: NotificationType;
  condition: {
    field: string;
    operator: '>' | '<' | '=' | '>=' | '<=';
    value: any;
  };
  active: boolean;
  userId: string;
}

// Default notification preferences
export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<
  NotificationPreferences,
  'id' | 'userId' | 'updatedAt'
> = {
  emailNotifications: true,
  pushNotifications: true,
  preferences: {
    low_balance: { enabled: true, email: true, push: true },
    budget_warning: { enabled: true, email: true, push: true },
    budget_exceeded: { enabled: true, email: true, push: true },
    invoice_overdue: { enabled: true, email: true, push: true },
    invoice_paid: { enabled: true, email: false, push: true },
    approval_pending: { enabled: true, email: true, push: true },
    approval_approved: { enabled: true, email: false, push: true },
    approval_rejected: { enabled: true, email: true, push: true },
    recurring_execution: { enabled: true, email: false, push: false },
    system: { enabled: true, email: true, push: true },
  },
};
