import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { CashTransfer, CashType, CASH_TYPE_OPTIONS } from '../types/cash-management';

interface CashTransferFormProps {
  onSubmit: (transfer: Omit<CashTransfer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

export function CashTransferForm({ onSubmit, onCancel }: CashTransferFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    cashType: 'small' as CashType,
    employeeName: '',
    transferAmount: '',
    description: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const transferData: Omit<CashTransfer, 'id' | 'createdAt' | 'updatedAt'> = {
        date: formData.date,
        cashType: formData.cashType,
        employeeName: formData.employeeName,
        transferAmount: parseFloat(formData.transferAmount),
        actualExpense: 0,
        difference: 0,
        status: 'pending',
        description: formData.description,
        expenseDetails: [],
        notes: formData.notes
      };

      await onSubmit(transferData);
    } catch (error) {
      console.error('Error submitting transfer:', error);
      alert('Terjadi kesalahan saat menyimpan transfer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full my-8">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 rounded-t-xl">
          <h3 className="text-gray-900">Transfer Kas ke Karyawan</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(90vh-80px)] overflow-y-auto">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Transfer Kas:</strong> Transfer sejumlah uang dari kas ke rekening karyawan untuk keperluan operasional. 
              Karyawan akan melaporkan pengeluaran aktual dan mengembalikan sisa/menerima tambahan sesuai dengan pengeluaran riil.
            </p>
          </div>

          {/* Tanggal */}
          <div>
            <label className="block text-gray-700 mb-2">
              Tanggal Transfer <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Jenis Kas */}
          <div>
            <label className="block text-gray-700 mb-2">
              Jenis Kas <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.cashType}
              onChange={(e) => setFormData({ ...formData, cashType: e.target.value as CashType })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {CASH_TYPE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Nama Karyawan */}
          <div>
            <label className="block text-gray-700 mb-2">
              Nama Karyawan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.employeeName}
              onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
              required
              placeholder="Contoh: Fauzan"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Jumlah Transfer */}
          <div>
            <label className="block text-gray-700 mb-2">
              Jumlah Transfer (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.transferAmount}
              onChange={(e) => setFormData({ ...formData, transferAmount: e.target.value })}
              required
              min="0"
              step="1000"
              placeholder="Contoh: 700000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {formData.transferAmount && (
              <p className="text-sm text-gray-600 mt-1">
                = Rp {parseFloat(formData.transferAmount).toLocaleString('id-ID')}
              </p>
            )}
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-gray-700 mb-2">
              Deskripsi Transfer <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              placeholder="Contoh: Transfer untuk biaya operasional lapangan"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-gray-700 mb-2">
              Catatan Tambahan (Opsional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Catatan internal atau keterangan tambahan..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Transfer Sekarang
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}