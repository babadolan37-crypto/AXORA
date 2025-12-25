import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ScheduledTransfer, TransferFrequency, ScheduledTransferStatus } from '../types/scheduled-transfer';
import { CashType } from '../types/cash-management';

export function useScheduledTransfer() {
  const [loading, setLoading] = useState(true);
  const [scheduledTransfers, setScheduledTransfers] = useState<ScheduledTransfer[]>([]);

  // Load all scheduled transfers
  const loadScheduledTransfers = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('scheduled_transfers')
        .select('*')
        .eq('user_id', user.id)
        .order('next_run_date', { ascending: true });

      if (error) throw error;

      setScheduledTransfers((data || []).map(mapFromDb));
    } catch (error: any) {
      // Ignore "table not found" errors as the feature might not be set up
      if (error.code === 'PGRST205' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        console.warn('Scheduled Transfers feature is not set up (table missing).');
        setScheduledTransfers([]);
      } else {
        console.error('Error loading scheduled transfers:', error);
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  // Create scheduled transfer
  const createScheduledTransfer = async (transfer: {
    fromCash: CashType;
    toCash: CashType;
    amount: number;
    frequency: TransferFrequency;
    dayOfWeek?: number;
    dayOfMonth?: number;
    description: string;
    autoApprove: boolean;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Calculate next run date
      const nextRunDate = calculateNextRunDate(
        transfer.frequency,
        transfer.dayOfWeek,
        transfer.dayOfMonth
      );

      const { data, error } = await supabase
        .from('scheduled_transfers')
        .insert([{
          user_id: user.id,
          from_cash: transfer.fromCash,
          to_cash: transfer.toCash,
          amount: transfer.amount,
          frequency: transfer.frequency,
          day_of_week: transfer.dayOfWeek,
          day_of_month: transfer.dayOfMonth,
          next_run_date: nextRunDate,
          status: 'active',
          description: transfer.description,
          auto_approve: transfer.autoApprove,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .maybeSingle();

      if (error) throw error;

      const mapped = mapFromDb(data);
      setScheduledTransfers(prev => [...prev, mapped]);
      return mapped;
    } catch (error) {
      console.error('Error creating scheduled transfer:', error);
      throw error;
    }
  };

  // Update scheduled transfer
  const updateScheduledTransfer = async (id: string, updates: Partial<ScheduledTransfer>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const dbUpdates: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.autoApprove !== undefined) dbUpdates.auto_approve = updates.autoApprove;

      const { data, error } = await supabase
        .from('scheduled_transfers')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Update failed: Data not returned');

      const mapped = mapFromDb(data);
      setScheduledTransfers(prev => prev.map(t => t.id === id ? mapped : t));
      return mapped;
    } catch (error) {
      console.error('Error updating scheduled transfer:', error);
      throw error;
    }
  };

  // Delete scheduled transfer
  const deleteScheduledTransfer = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('scheduled_transfers')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setScheduledTransfers(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting scheduled transfer:', error);
      throw error;
    }
  };

  // Pause/Resume scheduled transfer
  const toggleScheduledTransfer = async (id: string) => {
    const transfer = scheduledTransfers.find(t => t.id === id);
    if (!transfer) return;

    const newStatus: ScheduledTransferStatus = transfer.status === 'active' ? 'paused' : 'active';
    await updateScheduledTransfer(id, { status: newStatus });
  };

  // Execute scheduled transfer manually
  const executeScheduledTransfer = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const transfer = scheduledTransfers.find(t => t.id === id);
      if (!transfer) throw new Error('Transfer not found');

      // This would call the cash management transfer function
      // For now, just update the last run date
      const nextRunDate = calculateNextRunDate(
        transfer.frequency,
        transfer.dayOfWeek,
        transfer.dayOfMonth
      );

      await supabase
        .from('scheduled_transfers')
        .update({
          last_run_date: new Date().toISOString(),
          next_run_date: nextRunDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      // Reload to get updated data
      await loadScheduledTransfers();

      return true;
    } catch (error) {
      console.error('Error executing scheduled transfer:', error);
      throw error;
    }
  };

  // Calculate next run date based on frequency
  const calculateNextRunDate = (
    frequency: TransferFrequency,
    dayOfWeek?: number,
    dayOfMonth?: number
  ): string => {
    const now = new Date();
    let nextDate = new Date();

    switch (frequency) {
      case 'weekly':
        // Calculate next occurrence of the specified day of week
        const currentDay = now.getDay();
        const targetDay = dayOfWeek ?? 1; // Default to Monday
        let daysUntilTarget = targetDay - currentDay;
        if (daysUntilTarget <= 0) {
          daysUntilTarget += 7;
        }
        nextDate.setDate(now.getDate() + daysUntilTarget);
        break;

      case 'biweekly':
        // Same as weekly but 2 weeks ahead
        const currentDay2 = now.getDay();
        const targetDay2 = dayOfWeek ?? 1;
        let daysUntilTarget2 = targetDay2 - currentDay2;
        if (daysUntilTarget2 <= 0) {
          daysUntilTarget2 += 14;
        } else {
          daysUntilTarget2 += 7;
        }
        nextDate.setDate(now.getDate() + daysUntilTarget2);
        break;

      case 'monthly':
        // Next occurrence of the specified day of month
        const targetDayOfMonth = dayOfMonth ?? 1;
        nextDate.setMonth(now.getMonth() + 1);
        nextDate.setDate(targetDayOfMonth);
        // If we've already passed that day this month, use next month
        if (now.getDate() >= targetDayOfMonth) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        break;
    }

    return nextDate.toISOString();
  };

  // Map from database format to type
  const mapFromDb = (db: any): ScheduledTransfer => ({
    id: db.id,
    fromCash: db.from_cash,
    toCash: db.to_cash,
    amount: db.amount,
    frequency: db.frequency,
    dayOfWeek: db.day_of_week,
    dayOfMonth: db.day_of_month,
    nextRunDate: db.next_run_date,
    lastRunDate: db.last_run_date,
    status: db.status,
    description: db.description,
    autoApprove: db.auto_approve,
    createdBy: db.created_by,
    createdAt: db.created_at,
    updatedAt: db.updated_at
  });

  useEffect(() => {
    loadScheduledTransfers();
  }, []);

  return {
    loading,
    scheduledTransfers,
    loadScheduledTransfers,
    createScheduledTransfer,
    updateScheduledTransfer,
    deleteScheduledTransfer,
    toggleScheduledTransfer,
    executeScheduledTransfer
  };
}
