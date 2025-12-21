import { useState } from 'react';
import { Plus, FileText, CheckCircle, Clock, AlertCircle, DollarSign, X, Trash2, Edit2, Eye, Users, Send } from 'lucide-react';
import { useInvoice } from '../hooks/useInvoice';
import { Invoice, Customer } from '../types/invoice';
import { toast } from 'sonner';

export function InvoiceSheet() {
  const invoiceHook = useInvoice();
  const [filter, setFilter] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue'>('all');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    npwp: '',
    notes: '',
  });

  const [invoiceForm, setInvoiceForm] = useState({
    documentType: 'invoice' as 'invoice' | 'quotation',
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    customerId: '',
    items: [{ id: '1', description: '', quantity: 1, unitPrice: 0, amount: 0, taxRate: 11 }],
    notes: '',
    terms: 'Pembayaran dalam 30 hari',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredInvoices = invoiceHook.invoices.filter((inv) => {
    if (filter === 'all') return true;
    return inv.status === filter;
  });

  const stats = {
    total: invoiceHook.invoices.length,
    draft: invoiceHook.invoices.filter((i) => i.status === 'draft').length,
    sent: invoiceHook.invoices.filter((i) => i.status === 'sent').length,
    paid: invoiceHook.invoices.filter((i) => i.status === 'paid').length,
    overdue: invoiceHook.invoices.filter((i) => i.status === 'overdue').length,
    totalAmount: invoiceHook.invoices.reduce((sum, i) => sum + i.total, 0),
    paidAmount: invoiceHook.invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
  };

  // Calculate invoice totals
  const calculateInvoice = () => {
    const subtotal = invoiceForm.items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = invoiceForm.items.reduce((sum, item) => {
      return sum + (item.amount * (item.taxRate / 100));
    }, 0);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...invoiceForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto calculate amount
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice;
    }
    
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const addItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [
        ...invoiceForm.items,
        { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, amount: 0, taxRate: 11 },
      ],
    });
  };

  const removeItem = (index: number) => {
    if (invoiceForm.items.length === 1) {
      toast.error('Minimal harus ada 1 item');
      return;
    }
    const newItems = invoiceForm.items.filter((_, i) => i !== index);
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const handleOpenInvoice = () => {
    const nextNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(invoiceHook.invoices.length + 1).padStart(4, '0')}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    
    setInvoiceForm({
      documentType: 'invoice',
      invoiceNumber: nextNumber,
      date: new Date().toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      customerId: '',
      items: [{ id: '1', description: '', quantity: 1, unitPrice: 0, amount: 0, taxRate: 11 }],
      notes: '',
      terms: 'Pembayaran dalam 30 hari',
    });
    setEditingInvoice(null);
    setShowInvoiceModal(true);
  };

  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoiceForm.customerId) {
      toast.error('Pilih customer terlebih dahulu!');
      return;
    }

    if (invoiceForm.items.some(item => !item.description || item.quantity <= 0 || item.unitPrice <= 0)) {
      toast.error('Semua item harus diisi dengan lengkap!');
      return;
    }

    try {
      const customer = invoiceHook.customers.find(c => c.id === invoiceForm.customerId);
      if (!customer) {
        toast.error('Customer tidak ditemukan!');
        return;
      }

      const { subtotal, taxAmount, total } = calculateInvoice();

      const invoiceData = {
        documentType: invoiceForm.documentType,
        invoiceNumber: invoiceForm.invoiceNumber,
        date: invoiceForm.date,
        dueDate: invoiceForm.dueDate,
        customer: {
          name: customer.name,
          email: customer.email || '',
          phone: customer.phone || '',
          address: customer.address || '',
          npwp: customer.npwp || '',
        },
        items: invoiceForm.items,
        subtotal,
        taxAmount,
        total,
        status: 'draft' as const,
        notes: invoiceForm.notes,
        terms: invoiceForm.terms,
      };

      if (editingInvoice) {
        await invoiceHook.updateInvoice(editingInvoice.id, invoiceData);
        toast.success('Invoice berhasil diupdate!');
      } else {
        await invoiceHook.createInvoice(invoiceData);
        toast.success('Invoice berhasil dibuat!');
      }

      setShowInvoiceModal(false);
    } catch (error) {
      toast.error('Gagal menyimpan invoice');
    }
  };

  const handleSubmitCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerForm.name) {
      toast.error('Nama customer wajib diisi!');
      return;
    }

    try {
      await invoiceHook.createCustomer(customerForm);
      toast.success('Customer berhasil ditambahkan!');
      setCustomerForm({ name: '', email: '', phone: '', address: '', npwp: '', notes: '' });
      setShowCustomerModal(false);
    } catch (error) {
      toast.error('Gagal menambah customer');
    }
  };

  const handleUpdateStatus = async (invoice: Invoice, newStatus: Invoice['status']) => {
    try {
      await invoiceHook.updateInvoice(invoice.id, { status: newStatus });
      toast.success(`Status diupdate menjadi ${newStatus}`);
    } catch (error) {
      toast.error('Gagal update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus invoice ini?')) return;

    try {
      await invoiceHook.deleteInvoice(id);
      toast.success('Invoice berhasil dihapus!');
    } catch (error) {
      toast.error('Gagal menghapus invoice');
    }
  };

  const { subtotal, taxAmount, total } = calculateInvoice();

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl text-gray-900">Invoice & Quotation</h2>
          <p className="text-sm text-gray-600 mt-1">
            Kelola invoice, quotation, dan tracking pembayaran
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCustomerModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Users size={18} />
            Customer
          </button>
          <button
            onClick={handleOpenInvoice}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Buat Invoice
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={20} className="text-gray-600" />
            <span className="text-sm text-gray-600">Total Invoice</span>
          </div>
          <p className="text-2xl text-gray-900">{stats.total}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={20} className="text-amber-600" />
            <span className="text-sm text-gray-600">Pending</span>
          </div>
          <p className="text-2xl text-amber-600">{stats.sent}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={20} className="text-green-600" />
            <span className="text-sm text-gray-600">Lunas</span>
          </div>
          <p className="text-2xl text-green-600">{stats.paid}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={20} className="text-red-600" />
            <span className="text-sm text-gray-600">Overdue</span>
          </div>
          <p className="text-2xl text-red-600">{stats.overdue}</p>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={24} />
            <span className="text-sm text-white/80">Total Tagihan</span>
          </div>
          <p className="text-3xl">{formatCurrency(stats.totalAmount)}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={24} />
            <span className="text-sm text-white/80">Sudah Dibayar</span>
          </div>
          <p className="text-3xl">{formatCurrency(stats.paidAmount)}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'draft', 'sent', 'paid', 'overdue'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' && 'Semua'}
              {status === 'draft' && 'Draft'}
              {status === 'sent' && 'Terkirim'}
              {status === 'paid' && 'Lunas'}
              {status === 'overdue' && 'Jatuh Tempo'}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm text-gray-700">No. Invoice</th>
                <th className="text-left px-6 py-3 text-sm text-gray-700">Customer</th>
                <th className="text-left px-6 py-3 text-sm text-gray-700">Tanggal</th>
                <th className="text-left px-6 py-3 text-sm text-gray-700">Jatuh Tempo</th>
                <th className="text-right px-6 py-3 text-sm text-gray-700">Jumlah</th>
                <th className="text-center px-6 py-3 text-sm text-gray-700">Status</th>
                <th className="text-center px-6 py-3 text-sm text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoiceHook.loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Belum ada invoice
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{invoice.customer.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(invoice.date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(invoice.dueDate).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : invoice.status === 'overdue'
                            ? 'bg-red-100 text-red-700'
                            : invoice.status === 'sent'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {invoice.status === 'draft' && 'Draft'}
                        {invoice.status === 'sent' && 'Terkirim'}
                        {invoice.status === 'paid' && 'Lunas'}
                        {invoice.status === 'overdue' && 'Jatuh Tempo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowDetailModal(true);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Lihat detail"
                        >
                          <Eye size={16} />
                        </button>
                        {invoice.status === 'draft' && (
                          <button
                            onClick={() => handleUpdateStatus(invoice, 'sent')}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Kirim"
                          >
                            <Send size={16} />
                          </button>
                        )}
                        {invoice.status === 'sent' && (
                          <button
                            onClick={() => handleUpdateStatus(invoice, 'paid')}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Tandai lunas"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl text-gray-900">Tambah Customer</h3>
              <button onClick={() => setShowCustomerModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitCustomer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Nama Customer *</label>
                  <input
                    type="text"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Telepon</label>
                  <input
                    type="tel"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">NPWP</label>
                  <input
                    type="text"
                    value={customerForm.npwp}
                    onChange={(e) => setCustomerForm({ ...customerForm, npwp: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="00.000.000.0-000.000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Alamat</label>
                <textarea
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Catatan</label>
                <textarea
                  value={customerForm.notes}
                  onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </form>

            {/* Customer List */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h4 className="text-sm text-gray-700 mb-3">Daftar Customer ({invoiceHook.customers.length})</h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {invoiceHook.customers.map((customer) => (
                  <div key={customer.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-900">{customer.name}</p>
                        {customer.email && <p className="text-xs text-gray-600">{customer.email}</p>}
                        {customer.phone && <p className="text-xs text-gray-600">{customer.phone}</p>}
                      </div>
                      {customer.npwp && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          NPWP: {customer.npwp}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Form Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl text-gray-900">Buat Invoice Baru</h3>
              <button onClick={() => setShowInvoiceModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitInvoice} className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Tipe Dokumen</label>
                  <select
                    value={invoiceForm.documentType}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, documentType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="invoice">Invoice</option>
                    <option value="quotation">Quotation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">No. Invoice *</label>
                  <input
                    type="text"
                    value={invoiceForm.invoiceNumber}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Customer *</label>
                  <select
                    value={invoiceForm.customerId}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, customerId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Pilih customer</option>
                    {invoiceHook.customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Tanggal *</label>
                  <input
                    type="date"
                    value={invoiceForm.date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Jatuh Tempo *</label>
                  <input
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm text-gray-700">Item *</label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Tambah Item
                  </button>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {invoiceForm.items.map((item, index) => (
                    <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-12 md:col-span-4">
                          <input
                            type="text"
                            placeholder="Deskripsi"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            required
                          />
                        </div>
                        <div className="col-span-4 md:col-span-2">
                          <input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            min="1"
                            required
                          />
                        </div>
                        <div className="col-span-4 md:col-span-2">
                          <input
                            type="number"
                            placeholder="Harga"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            min="0"
                            required
                          />
                        </div>
                        <div className="col-span-3 md:col-span-2">
                          <input
                            type="number"
                            placeholder="PPN %"
                            value={item.taxRate}
                            onChange={(e) => handleItemChange(index, 'taxRate', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            min="0"
                            max="100"
                          />
                        </div>
                        <div className="col-span-8 md:col-span-2 flex items-center gap-2">
                          <div className="text-sm text-gray-700">
                            {formatCurrency(item.amount)}
                          </div>
                          {invoiceForm.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">PPN:</span>
                  <span className="text-gray-900">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-blue-200">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-xl text-blue-600">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Notes & Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Catatan</label>
                  <textarea
                    value={invoiceForm.notes}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Terms & Conditions</label>
                  <textarea
                    value={invoiceForm.terms}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, terms: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Simpan sebagai Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl text-gray-900">Detail Invoice</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600">Invoice Number</p>
                  <p className="text-lg text-gray-900">{selectedInvoice.invoiceNumber}</p>
                </div>
                <span
                  className={`px-3 py-1.5 rounded text-sm ${
                    selectedInvoice.status === 'paid'
                      ? 'bg-green-100 text-green-700'
                      : selectedInvoice.status === 'overdue'
                      ? 'bg-red-100 text-red-700'
                      : selectedInvoice.status === 'sent'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {selectedInvoice.status.toUpperCase()}
                </span>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Customer</p>
                <p className="text-gray-900">{selectedInvoice.customer.name}</p>
                {selectedInvoice.customer.email && (
                  <p className="text-sm text-gray-600">{selectedInvoice.customer.email}</p>
                )}
                {selectedInvoice.customer.phone && (
                  <p className="text-sm text-gray-600">{selectedInvoice.customer.phone}</p>
                )}
                {selectedInvoice.customer.address && (
                  <p className="text-sm text-gray-600 mt-1">{selectedInvoice.customer.address}</p>
                )}
                {selectedInvoice.customer.npwp && (
                  <p className="text-sm text-gray-600 mt-1">NPWP: {selectedInvoice.customer.npwp}</p>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Tanggal</p>
                  <p className="text-gray-900">{new Date(selectedInvoice.date).toLocaleDateString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Jatuh Tempo</p>
                  <p className="text-gray-900">{new Date(selectedInvoice.dueDate).toLocaleDateString('id-ID')}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-sm text-gray-600 mb-3">Items</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 text-gray-700">Deskripsi</th>
                        <th className="text-right px-4 py-2 text-gray-700">Qty</th>
                        <th className="text-right px-4 py-2 text-gray-700">Harga</th>
                        <th className="text-right px-4 py-2 text-gray-700">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedInvoice.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-gray-900">{item.description}</td>
                          <td className="px-4 py-2 text-right text-gray-600">{item.quantity}</td>
                          <td className="px-4 py-2 text-right text-gray-600">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-4 py-2 text-right text-gray-900">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="text-gray-900">{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">PPN:</span>
                  <span className="text-gray-900">{formatCurrency(selectedInvoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-blue-200">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-xl text-blue-600">{formatCurrency(selectedInvoice.total)}</span>
                </div>
              </div>

              {/* Notes & Terms */}
              {(selectedInvoice.notes || selectedInvoice.terms) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedInvoice.notes && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Catatan</p>
                      <p className="text-sm text-gray-900">{selectedInvoice.notes}</p>
                    </div>
                  )}
                  {selectedInvoice.terms && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Terms</p>
                      <p className="text-sm text-gray-900">{selectedInvoice.terms}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Tutup
                </button>
                {selectedInvoice.status === 'draft' && (
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedInvoice, 'sent');
                      setShowDetailModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Kirim Invoice
                  </button>
                )}
                {selectedInvoice.status === 'sent' && (
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedInvoice, 'paid');
                      setShowDetailModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Tandai Lunas
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
