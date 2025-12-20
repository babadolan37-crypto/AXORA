import { RefreshCcw, Plus, Play, Pause, X, Trash2, Edit2, CheckCircle } from 'lucide-react';
import { useRecurring } from '../hooks/useRecurring';
import { useState } from 'react';
import { RecurringTransaction } from '../types/recurring';
import { toast } from 'sonner';

interface RecurringSheetProps {
  expenseCategories: string[];
  incomeSources: string[];
  employees: string[];
}

export function RecurringSheet({ expenseCategories, incomeSources, employees }: RecurringSheetProps) {
  const recurringHook = useRecurring();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
  
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    category: '',
    description: '',
    amount: '',
    interval: 'monthly' as 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    employee: '',
    cashType: 'big' as 'big' | 'small',
    autoExecute: false,
  });

  const dueTransactions = recurringHook.checkDueRecurring();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleOpenAdd = () => {
    setFormData({
      type: 'expense',
      category: '',
      description: '',
      amount: '',
      interval: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      employee: '',
      cashType: 'big',
      autoExecute: false,
    });
    setEditingRecurring(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (recurring: RecurringTransaction) => {
    setFormData({
      type: recurring.type,
      category: recurring.category,
      description: recurring.description,
      amount: recurring.amount.toString(),
      interval: recurring.interval,
      startDate: recurring.startDate,
      endDate: recurring.endDate || '',
      employee: recurring.employee || '',
      cashType: recurring.cashType || 'big',
      autoExecute: recurring.autoExecute || false,
    });
    setEditingRecurring(recurring);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category || !formData.description || !formData.amount) {
      toast.error('Kategori, deskripsi, dan nominal wajib diisi!');
      return;
    }

    try {
      if (editingRecurring) {
        await recurringHook.updateRecurring(editingRecurring.id, {
          category: formData.category,
          description: formData.description,
          amount: parseFloat(formData.amount),
          interval: formData.interval,
          startDate: formData.startDate,
          endDate: formData.endDate || null,
          employee: formData.employee || null,
          cashType: formData.cashType,
          autoExecute: formData.autoExecute,
        });
        toast.success('Transaksi berulang berhasil diupdate!');
      } else {
        await recurringHook.createRecurring({
          type: formData.type,
          category: formData.category,
          description: formData.description,
          amount: parseFloat(formData.amount),
          interval: formData.interval,
          startDate: formData.startDate,
          endDate: formData.endDate || null,
          employee: formData.employee || null,
          cashType: formData.cashType,
          autoExecute: formData.autoExecute,
        });
        toast.success('Transaksi berulang berhasil ditambahkan!');
      }
      setShowAddModal(false);
    } catch (error) {
      toast.error('Gagal menyimpan transaksi berulang');
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await recurringHook.toggleRecurring(id, !currentStatus);
      toast.success(currentStatus ? 'Transaksi dijeda' : 'Transaksi diaktifkan');
    } catch (error) {
      toast.error('Gagal mengubah status');
    }
  };

  const handleExecute = async (id: string) => {
    try {
      await recurringHook.executeRecurring(id);
      toast.success('Transaksi berhasil dieksekusi!');
    } catch (error) {
      toast.error('Gagal mengeksekusi transaksi');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus transaksi berulang ini?')) return;

    try {
      await recurringHook.deleteRecurring(id);
      toast.success('Transaksi berulang berhasil dihapus!');
    } catch (error) {
      toast.error('Gagal menghapus transaksi');
    }
  };

  const categories = formData.type === 'income' ? incomeSources : expenseCategories;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl text-gray-900">Transaksi Berulang</h2>
          <p className="text-sm text-gray-600 mt-1">Otomatis transaksi gaji, sewa, BPJS, dll</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          Tambah Recurring
        </button>
      </div>

      {dueTransactions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-900">
            <strong>{dueTransactions.length} transaksi</strong> siap dieksekusi hari ini!
          </p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm text-gray-700">Deskripsi</th>
                <th className="text-left px-6 py-3 text-sm text-gray-700">Kategori</th>
                <th className="text-left px-6 py-3 text-sm text-gray-700">Interval</th>
                <th className="text-right px-6 py-3 text-sm text-gray-700">Jumlah</th>
                <th className="text-left px-6 py-3 text-sm text-gray-700">Next</th>
                <th className="text-center px-6 py-3 text-sm text-gray-700">Status</th>
                <th className="text-center px-6 py-3 text-sm text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recurringHook.loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : recurringHook.recurring.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Belum ada transaksi berulang
                  </td>
                </tr>
              ) : (
                recurringHook.recurring.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      <div className="text-gray-900">{r.description}</div>
                      {r.employee && (
                        <div className="text-xs text-gray-500 mt-1">Karyawan: {r.employee}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{r.interval}</td>
                    <td className="px-6 py-4 text-sm text-right">
                      <span className={r.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(r.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(r.nextExecutionDate).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {r.active ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                          <Play size={12} className="mr-1" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                          <Pause size={12} className="mr-1" />
                          Pause
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleExecute(r.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Eksekusi sekarang"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => handleToggle(r.id, r.active)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title={r.active ? 'Pause' : 'Aktifkan'}
                        >
                          {r.active ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
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

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl text-gray-900">
                {editingRecurring ? 'Edit Transaksi Berulang' : 'Tambah Transaksi Berulang'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Type */}
                {!editingRecurring && (
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Tipe *</label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="expense">Pengeluaran</option>
                      <option value="income">Pemasukan</option>
                    </select>
                  </div>
                )}

                {/* Category */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Kategori *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Pilih kategori</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Deskripsi *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Contoh: Gaji Karyawan Bulanan"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Amount */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Nominal *</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="0"
                    required
                    min="0"
                    step="1000"
                  />
                </div>

                {/* Interval */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Interval *</label>
                  <select
                    value={formData.interval}
                    onChange={(e) => setFormData({ ...formData, interval: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="daily">Harian</option>
                    <option value="weekly">Mingguan</option>
                    <option value="biweekly">Dua Minggu</option>
                    <option value="monthly">Bulanan</option>
                    <option value="quarterly">Triwulan</option>
                    <option value="yearly">Tahunan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Date */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Tanggal Mulai *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Tanggal Selesai (Opsional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Employee */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Karyawan (Opsional)</label>
                  <select
                    value={formData.employee}
                    onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Tidak ada</option>
                    {employees.map((emp) => (
                      <option key={emp} value={emp}>
                        {emp}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cash Type */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Jenis Kas</label>
                  <select
                    value={formData.cashType}
                    onChange={(e) => setFormData({ ...formData, cashType: e.target.value as 'big' | 'small' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="big">Kas Besar</option>
                    <option value="small">Kas Kecil</option>
                  </select>
                </div>
              </div>

              {/* Auto Execute */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="autoExecute"
                  checked={formData.autoExecute}
                  onChange={(e) => setFormData({ ...formData, autoExecute: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="autoExecute" className="text-sm text-gray-700">
                  Eksekusi otomatis (tanpa konfirmasi manual)
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingRecurring ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}