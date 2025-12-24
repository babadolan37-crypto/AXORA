import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AuditLog, AuditAction, AuditEntityType, AuditLogFilter } from '../types/audit-log';

export function useAuditLog() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Log an action
  const logAction = async (
    action: AuditAction,
    entityType: AuditEntityType,
    entityId: string,
    description: string,
    oldValue?: any,
    newValue?: any
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile for name, role, and company
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role, company_id')
        .eq('id', user.id)
        .maybeSingle();

      const { error } = await supabase
        .from('audit_logs')
        .insert([{
          user_id: user.id,
          company_id: profile?.company_id || null,
          user_name: profile?.full_name || user.email || 'Unknown',
          user_role: profile?.role || 'unknown',
          action,
          entity_type: entityType,
          entity_id: entityId,
          old_value: oldValue ? JSON.stringify(oldValue) : null,
          new_value: newValue ? JSON.stringify(newValue) : null,
          description,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        // Silent fail for missing table
        if (error.code === 'PGRST205' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
           // Do nothing
        } else {
           console.error('Error logging action:', error);
        }
      }
    } catch (error: any) {
      // Silent fail for missing table
      if (error.code !== 'PGRST205' && !error.message?.includes('relation') && !error.message?.includes('does not exist')) {
        console.error('Error in logAction:', error);
      }
      // Don't throw - audit logging should not break main functionality
    }
  };

  // Load audit logs with filters
  const loadLogs = async (filter?: AuditLogFilter, page: number = 0, pageSize: number = 50) => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filter?.userId) {
        query = query.eq('user_id', filter.userId);
      }
      if (filter?.action) {
        query = query.eq('action', filter.action);
      }
      if (filter?.entityType) {
        query = query.eq('entity_type', filter.entityType);
      }
      if (filter?.startDate) {
        query = query.gte('created_at', filter.startDate);
      }
      if (filter?.endDate) {
        query = query.lte('created_at', filter.endDate);
      }

      const { data, error, count } = await query
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;

      setLogs((data || []).map(mapLogFromDb));
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error('Error loading audit logs:', error);
      if (!error.message?.includes('relation') && !error.message?.includes('does not exist')) {
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  // Get logs for specific entity
  const getEntityLogs = async (entityType: AuditEntityType, entityId: string) => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(mapLogFromDb);
    } catch (error) {
      console.error('Error getting entity logs:', error);
      return [];
    }
  };

  // Helper function to map DB to type
  const mapLogFromDb = (dbLog: any): AuditLog => ({
    id: dbLog.id,
    userId: dbLog.user_id,
    userName: dbLog.user_name,
    userRole: dbLog.user_role,
    action: dbLog.action,
    entityType: dbLog.entity_type,
    entityId: dbLog.entity_id,
    oldValue: dbLog.old_value ? JSON.parse(dbLog.old_value) : undefined,
    newValue: dbLog.new_value ? JSON.parse(dbLog.new_value) : undefined,
    description: dbLog.description,
    ipAddress: dbLog.ip_address,
    userAgent: dbLog.user_agent,
    createdAt: dbLog.created_at
  });

  return {
    loading,
    logs,
    totalCount,
    logAction,
    loadLogs,
    getEntityLogs
  };
}
