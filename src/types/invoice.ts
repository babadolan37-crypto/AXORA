// Types for Invoice & Quotation Module

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type DocumentType = 'invoice' | 'quotation';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number; // PPN percentage
}

export interface Invoice {
  id: string;
  documentType: DocumentType;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customer: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    npwp?: string; // Tax ID
  };
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number; // Total PPN
  total: number;
  status: InvoiceStatus;
  notes?: string;
  terms?: string;
  paidDate?: string;
  paidAmount?: number;
  paymentProofUrl?: string;
  linkedTransactionId?: string; // Link to income entry when paid
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  date: string;
  amount: number;
  method: string;
  notes?: string;
  proofUrl?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  npwp?: string;
  notes?: string;
  createdAt: string;
  userId: string;
}
