export type UserRole = 'admin' | 'manager' | 'employee' | 'viewer';

export interface UserProfile {
  id: string;
  user_id: string;
  role: UserRole;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  user_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: any | null;
  new_value: any | null;
  description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface ScheduledTransfer {
  id: string;
  user_id: string;
  from_cash: 'big' | 'small';
  to_cash: 'big' | 'small';
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  day_of_week: number | null;
  day_of_month: number | null;
  next_run_date: string;
  last_run_date: string | null;
  status: 'active' | 'paused' | 'completed';
  description: string;
  auto_approve: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}
