import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Notification, NotificationType, NotificationPriority } from '../types/notification';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false })
        .limit(50);

      if (error) {
        // If table doesn't exist, just return empty array silently
        if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
          // Silent mode - no console warnings
          setNotifications([]);
          setLoading(false);
          return;
        }
        throw error;
      }
      setNotifications(data || []);
    } catch (error) {
      // Silent error handling
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const createNotification = async (
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = 'medium',
    metadata?: any
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          type,
          priority,
          title,
          message,
          read: false,
          metadata,
          userId: user.id,
          createdAt: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      setNotifications([data, ...notifications]);
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          readAt: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          readAt: new Date().toISOString(),
        })
        .eq('userId', user.id)
        .eq('read', false);

      if (error) throw error;
      
      const now = new Date().toISOString();
      setNotifications(notifications.map(n => ({ ...n, read: true, readAt: now })));
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  };

  const clearAll = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('userId', user.id);

      if (error) throw error;
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
      throw error;
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refetch: fetchNotifications,
  };
}