export type UserRole = 'admin' | 'employee';

export interface UserProfile {
  id: string;
  userId: string;
  role: UserRole;
  fullName: string;
  email: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseAssignment {
  id: string;
  expenseId: string;
  assignedTo: string; // employee user_id
  assignedBy: string; // admin user_id
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  dueDate?: string;
  submittedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Role permissions structure
export interface Permission {
  resource: string;
  actions: string[];
}

export interface RolePermission {
  role: UserRole;
  description: string;
  permissions: Permission[];
}

// Default role permissions
export const DEFAULT_ROLE_PERMISSIONS: RolePermission[] = [
  {
    role: 'admin',
    description: 'Full access to all features',
    permissions: [
      { resource: 'income', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'expense', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'debt', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'cash', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'settings', actions: ['read', 'update'] },
      { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'audit_logs', actions: ['read'] }
    ]
  },
  {
    role: 'employee',
    description: 'Limited access for employees',
    permissions: [
      { resource: 'expense', actions: ['read'] },
      { resource: 'assignments', actions: ['read', 'update'] }
    ]
  }
];