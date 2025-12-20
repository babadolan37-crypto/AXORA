import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, AuditLog, ScheduledTransfer } from '../types';

export function useAdminData() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [scheduledTransfers, setScheduledTransfers] = useState<ScheduledTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function fetchAdminData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch Users
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch Audit Logs (Limit 100 recent)
      const { data: logsData, error: logsError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      setUsers(usersData || []);
      setAuditLogs(logsData || []);

    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateUserRole(userId: string, newRole: string) {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;
      
      // Refresh local state
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, role: newRole as any } : u));
      
      // Log this action
      await logAction('UPDATE_ROLE', 'user_profiles', userId, { role: newRole });
      
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async function logAction(action: string, entityType: string, entityId: string | null, details: any = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('audit_logs').insert({
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email,
        action,
        entity_type: entityType,
        entity_id: entityId,
        new_value: details,
        description: `User performed ${action} on ${entityType}`
      });
    } catch (err) {
      console.error('Failed to create audit log:', err);
    }
  }

  return {
    users,
    auditLogs,
    scheduledTransfers,
    loading,
    error,
    refresh: fetchAdminData,
    updateUserRole,
    logAction
  };
}
