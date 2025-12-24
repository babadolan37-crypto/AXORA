import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Invoice, InvoiceStatus, Customer } from '../types/invoice';

export function useInvoice() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('userId', user.id)
        .order('date', { ascending: false });

      if (error) {
        // If table doesn't exist, just return empty array silently
        if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
          // Silent mode - no console warnings
          setInvoices([]);
          setLoading(false);
          return;
        }
        throw error;
      }
      setInvoices(data || []);
    } catch (error) {
      // Silent error handling
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('userId', user.id)
        .order('name', { ascending: true });

      if (error) {
        // If table doesn't exist, just return empty array silently
        if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
          // Silent mode - no console warnings
          setCustomers([]);
          return;
        }
        throw error;
      }
      setCustomers(data || []);
    } catch (error) {
      // Silent error handling
      setCustomers([]);
    }
  };

  const generateInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const count = invoices.length + 1;
    return `INV/${year}/${month}/${String(count).padStart(4, '0')}`;
  };

  const addInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('invoices')
        .insert([{
          ...invoice,
          userId: user.id,
          createdAt: now,
          updatedAt: now,
        }])
        .select()
        .single();

      if (error) throw error;
      setInvoices([data, ...invoices]);
      return data;
    } catch (error) {
      console.error('Error adding invoice:', error);
      throw error;
    }
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      setInvoices(invoices.map(inv => inv.id === id ? { ...inv, ...updates } : inv));
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setInvoices(invoices.filter(inv => inv.id !== id));
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  };

  const markInvoicePaid = async (
    id: string,
    paidDate: string,
    paidAmount: number,
    paymentProofUrl?: string
  ) => {
    await updateInvoice(id, {
      status: 'paid',
      paidDate,
      paidAmount,
      paymentProofUrl,
    });
  };

  const addCustomer = async (customer: Omit<Customer, 'id' | 'createdAt' | 'userId'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('customers')
        .insert([{
          ...customer,
          userId: user.id,
          createdAt: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      setCustomers([...customers, data]);
      return data;
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setCustomers(customers.map(c => c.id === id ? { ...c, ...updates } : c));
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCustomers(customers.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  };

  const checkOverdueInvoices = () => {
    const today = new Date().toISOString().split('T')[0];
    return invoices.filter(
      inv => inv.status === 'sent' && inv.dueDate < today
    );
  };

  return {
    invoices,
    customers,
    loading,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    markInvoicePaid,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    generateInvoiceNumber,
    checkOverdueInvoices,
    refetch: fetchInvoices,
  };
}