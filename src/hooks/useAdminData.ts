import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, AuditLog, ScheduledTransfer } from '../types';

export function useAdminData() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [scheduledTransfers, setScheduledTransfers] = useState<ScheduledTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCompanyId(null);
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();
      setCompanyId(profile?.company_id || null);
      await fetchAdminData();
    };
    init();
  }, []);

  async function fetchAdminData() {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUsers([]);
        setAuditLogs([]);
        return;
      }

      // Resolve company_id if not already set
      let cid = companyId;
      if (!cid) {
        const { data: myProfile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .maybeSingle();
        cid = myProfile?.company_id || null;
        setCompanyId(cid);
      }

      // Fetch Users (company members) using profiles table
      let usersData: any[] | null = null;
      let usersError: any = null;
      if (cid) {
        const res = await supabase
          .from('profiles')
          .select('*')
          .eq('company_id', cid)
          .order('created_at', { ascending: false });
        usersData = res.data || [];
        usersError = res.error || null;
      } else {
        // No company: show only current user profile
        const res = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        usersData = res.data ? [res.data] : [];
        usersError = res.error || null;
      }

      if (usersError) throw usersError;

      // Fetch Audit Logs (Limit 100 recent)
      let logsData: any[] = [];
      let logsError: any = null;
      if (cid) {
        const res = await supabase
          .from('audit_logs')
          .select('*')
          .eq('company_id', cid)
          .order('created_at', { ascending: false })
          .limit(100);
        logsData = res.data || [];
        logsError = res.error || null;
        // Fallback if audit_logs doesn't have company_id
        if (logsError && logsError.code === 'PGRST204') {
          const ownRes = await supabase
            .from('audit_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(100);
          logsData = ownRes.data || [];
          logsError = ownRes.error || null;
        }
      } else {
        const ownRes = await supabase
          .from('audit_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);
        logsData = ownRes.data || [];
        logsError = ownRes.error || null;
      }

      if (logsError) throw logsError;

      const mappedUsers = (usersData || []).map((u: any) => ({
        id: u.id,
        user_id: u.id,
        role: u.role,
        status: u.status, // Add status mapping
        full_name: u.full_name || u.name || null,
        email: u.email || null,
        phone: u.phone || null,
        created_at: u.created_at,
        updated_at: u.updated_at
      })) as UserProfile[];

      setUsers(mappedUsers);
      setAuditLogs((logsData || []) as AuditLog[]);

    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateUserRole(userId: string, newRole: string) {
    try {
      const { data, error } = await supabase.rpc('update_member_role', {
        target_user_id: userId,
        new_role: newRole
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message);
      
      // Refresh local state
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, role: newRole as any } : u));
      
      return { success: true };
    } catch (err: any) {
      console.error('Update role failed:', err);
      // Fallback to direct update if RPC fails (for backward compatibility during migration)
      if (err.message?.includes('function update_member_role') || err.code === '42883') {
         const { error: directError } = await supabase
          .from('profiles')
          .update({ role: newRole, updated_at: new Date().toISOString() })
          .eq('id', userId);
          
         if (!directError) {
             setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, role: newRole as any } : u));
             return { success: true };
         }
      }
      return { success: false, error: err.message };
    }
  }

  async function toggleMemberStatus(targetUserId: string, newStatus: string) {
    try {
      const { data, error } = await supabase.rpc('toggle_member_status', {
        target_user_id: targetUserId,
        new_status: newStatus
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message);

      // Refresh
      setUsers(prev => prev.map(u => u.user_id === targetUserId ? { ...u, status: newStatus as any } : u));
      return { success: true };
    } catch (err: any) {
      console.error('Status change failed:', err);
      return { success: false, error: err.message };
    }
  }

  async function logAction(action: string, entityType: string, entityId: string | null, details: any = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, role, full_name')
        .eq('id', user.id)
        .maybeSingle();

      await supabase.from('audit_logs').insert({
        user_id: user.id,
        company_id: profile?.company_id || null,
        user_name: profile?.full_name || user.email,
        user_role: profile?.role || null,
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

  async function approveMember(targetUserId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('approve_member', {
        target_user_id: targetUserId,
        actor_user_id: user.id
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message);

      // Refresh
      setUsers(prev => prev.map(u => u.user_id === targetUserId ? { ...u, status: 'active' } : u));
      return { success: true };
    } catch (err: any) {
      console.error('Approval failed:', err);
      return { success: false, error: err.message };
    }
  }

  async function rejectMember(targetUserId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('reject_member', {
        target_user_id: targetUserId,
        actor_user_id: user.id
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message);

      // Refresh
      setUsers(prev => prev.map(u => u.user_id === targetUserId ? { ...u, status: 'rejected' } : u));
      return { success: true };
    } catch (err: any) {
      console.error('Rejection failed:', err);
      return { success: false, error: err.message };
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
    approveMember,
    rejectMember,
    toggleMemberStatus,
    logAction
  };
}
