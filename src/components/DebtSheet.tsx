import { useState } from 'react';
import { Plus, Pencil, Trash2, AlertCircle, Printer, X } from 'lucide-react';
import { DebtEntry } from '../types/accounting';

interface DebtSheetProps {
  entries: DebtEntry[];
  onAddEntry: (entry: Omit<DebtEntry, 'id'>) => void;
  onUpdateEntry: (id: string, entry: Omit<DebtEntry, 'id'>) => void;
  onDeleteEntry: (id: string) => void;
}

export function DebtSheet({ entries, onAddEntry, onUpdateEntry, onDeleteEntry }: DebtSheetProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<DebtEntry | null>(null);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

  const [formData, setFormData] = useState({
    type: 'Utang' as 'Utang' | 'Piutang',
    name: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    paymentStatus: 'Tertunda' as 'Lunas' | 'Tertunda',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: Omit<DebtEntry, 'id'> = {
      type: formData.type,
      name: formData.name,
      description: formData.description || 'Utang/Piutang',
      amount: parseFloat(formData.amount),
      date: formData.date,
      dueDate: formData.dueDate,
      paymentStatus: formData.paymentStatus,
      notes: formData.notes
    };

    if (editingId) {
      onUpdateEntry(editingId, entry);
      setEditingId(null);
    } else {
      onAddEntry(entry);
    }

    setFormData({
      type: 'Utang',
      name: '',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      paymentStatus: 'Tertunda',
      notes: ''
    });
    setIsFormOpen(false);
  };

  const handleEdit = (entry: DebtEntry) => {
    setFormData({
      type: entry.type,
      name: entry.name,
      description: entry.description,
      amount: entry.amount.toString(),
      date: entry.date,
      dueDate: entry.dueDate,
      paymentStatus: entry.paymentStatus,
      notes: entry.notes || ''
    });
    setEditingId(entry.id);
    setIsFormOpen(true);
  };

  const handlePrintInvoice = (entry: DebtEntry) => {
    setSelectedInvoice(entry);
    setShowInvoicePreview(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'Lunas') return false;
    return new Date(dueDate) < new Date();
  };

  const debts = entries.filter(e => e.type === 'Utang');
  const receivables = entries.filter(e => e.type === 'Piutang');

  const totalDebt = debts.reduce((sum, e) => sum + (e.paymentStatus === 'Tertunda' ? e.amount : 0), 0);
  const totalReceivables = receivables.reduce((sum, e) => sum + (e.paymentStatus === 'Tertunda' ? e.amount : 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2>Utang & Piutang</h2>
        <button
          onClick={() => {
            setIsFormOpen(!isFormOpen);
            setEditingId(null);
            setFormData({
              type: 'Utang',
              name: '',
              description: '',
              amount: '',
              date: new Date().toISOString().split('T')[0],
              dueDate: '',
              paymentStatus: 'Tertunda',
              notes: ''
            });
          }}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus size={20} />
          Tambah Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6 shadow-lg">
          <p className="text-orange-100 text-sm mb-1">Total Utang Tertunda</p>
          <p className="text-2xl">{formatCurrency(totalDebt)}</p>
          <p className="text-orange-100 text-sm mt-2">
            {debts.filter(d => d.paymentStatus === 'Tertunda').length} utang belum dibayar
          </p>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-lg p-6 shadow-lg">
          <p className="text-teal-100 text-sm mb-1">Total Piutang Tertunda</p>
          <p className="text-2xl">{formatCurrency(totalReceivables)}</p>
          <p className="text-teal-100 text-sm mt-2">
            {receivables.filter(r => r.paymentStatus === 'Tertunda').length} piutang belum diterima
          </p>
        </div>
      </div>

      {isFormOpen && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="mb-4">{editingId ? 'Edit' : 'Tambah'} Utang/Piutang</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Tipe</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'Utang' | 'Piutang' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Utang">Utang</option>
                <option value="Piutang">Piutang</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Nama {formData.type === 'Utang' ? 'Kreditor' : 'Debitur'}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Nama pihak terkait"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Deskripsi</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Keterangan transaksi"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Jumlah</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="1000000"
                required
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Tanggal</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Tanggal Jatuh Tempo</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Status Pembayaran</label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as 'Lunas' | 'Tertunda' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Tertunda">Tertunda</option>
                <option value="Lunas">Lunas</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Catatan Pembayaran</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Catatan pembayaran (opsional)"
                rows={2}
              />
            </div>

            <div className="md:col-span-2 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {editingId ? 'Update' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Tipe</th>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Nama</th>
                <th className="px-4 py-3 text-right text-sm text-gray-600">Jumlah</th>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Jatuh Tempo</th>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Catatan</th>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Belum ada data utang/piutang. Klik tombol "Tambah Data" untuk menambah data.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const overdue = isOverdue(entry.dueDate, entry.paymentStatus);
                  return (
                    <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-block px-2 py-1 rounded text-xs ${
                          entry.type === 'Utang' 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-teal-100 text-teal-800'
                        }`}>
                          {entry.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{entry.name}</td>
                      <td className={`px-4 py-3 text-sm text-right ${
                        entry.type === 'Utang' ? 'text-orange-600' : 'text-teal-600'
                      }`}>
                        {formatCurrency(entry.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1">
                          {overdue && <AlertCircle size={14} className="text-red-500" />}
                          <span className={overdue ? 'text-red-600' : ''}>
                            {new Date(entry.dueDate).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-block px-2 py-1 rounded text-xs ${
                          entry.paymentStatus === 'Lunas' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {entry.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{entry.notes || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          {entry.type === 'Piutang' && (
                            <button
                              onClick={() => handlePrintInvoice(entry)}
                              className="text-purple-600 hover:text-purple-800"
                              title="Cetak Invoice"
                            >
                              <Printer size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(entry)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => onDeleteEntry(entry.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Preview Modal */}
      {showInvoicePreview && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:bg-white print:p-0">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto print:shadow-none print:w-full print:max-w-none print:h-auto print:overflow-visible">
            {/* Modal Header - Hidden in Print */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 print:hidden">
              <h3 className="text-lg font-semibold text-gray-900">Preview Invoice</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Printer size={18} />
                  Cetak / Simpan PDF
                </button>
                <button
                  onClick={() => setShowInvoicePreview(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Invoice Content */}
            <div className="p-8 print:p-0" id="invoice-content">
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">INVOICE</h1>
                  <p className="text-gray-500">#{selectedInvoice.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold text-gray-800">PT. MANAJEMEN KEUANGAN</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Jl. Jend. Sudirman No. 1<br />
                    Jakarta Selatan, 12190<br />
                    Indonesia<br />
                    support@perusahaan.com
                  </p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Ditagihkan Kepada:</p>
                  <h3 className="text-lg font-bold text-gray-900">{selectedInvoice.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {/* Placeholder address since we don't have it in DB yet */}
                    (Alamat Klien Belum Diisi)
                  </p>
                </div>
                <div className="text-right">
                  <div className="mb-2">
                    <p className="text-sm font-semibold text-gray-500 uppercase">Tanggal Invoice:</p>
                    <p className="text-gray-900 font-medium">
                      {new Date(selectedInvoice.date || new Date()).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase">Jatuh Tempo:</p>
                    <p className="text-gray-900 font-medium">
                      {new Date(selectedInvoice.dueDate).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full mb-8">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-200">
                    <th className="py-3 px-4 text-left font-semibold text-gray-700">Deskripsi</th>
                    <th className="py-3 px-4 text-right font-semibold text-gray-700">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-4 px-4">
                      <p className="font-medium text-gray-900">{selectedInvoice.description || 'Jasa / Layanan'}</p>
                      <p className="text-sm text-gray-500">{selectedInvoice.notes || '-'}</p>
                    </td>
                    <td className="py-4 px-4 text-right font-medium text-gray-900">
                      {formatCurrency(selectedInvoice.amount)}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200">
                    <td className="py-4 px-4 text-right font-bold text-gray-900">Total</td>
                    <td className="py-4 px-4 text-right font-bold text-blue-600 text-xl">
                      {formatCurrency(selectedInvoice.amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Payment Info */}
              <div className="bg-gray-50 p-6 rounded-lg print:bg-white print:border print:border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Info Pembayaran:</h4>
                <p className="text-gray-600 text-sm mb-1">Silakan transfer pembayaran ke:</p>
                <div className="text-sm text-gray-800 font-medium">
                  <p>Bank BCA</p>
                  <p>123-456-7890</p>
                  <p>a.n. PT Manajemen Keuangan</p>
                </div>
                <p className="text-gray-500 text-xs mt-4">
                  * Mohon cantumkan Nomor Invoice saat melakukan pembayaran.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
