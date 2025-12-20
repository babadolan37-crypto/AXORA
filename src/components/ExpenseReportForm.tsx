import { useState } from 'react';
import { X, Plus, Trash2, Camera, FileText, AlertTriangle } from 'lucide-react';
import { CashTransfer, ExpenseDetail, DEFAULT_CASH_EXPENSE_CATEGORIES } from '../types/cash-management';
import { compressImage } from '../utils/imageCompression';

interface ExpenseReportFormProps {
  transfer: CashTransfer;
  onSubmit: (data: { expenseDetails: ExpenseDetail[]; notes: string }) => Promise<void>;
  onCancel: () => void;
}

export function ExpenseReportForm({ transfer, onSubmit, onCancel }: ExpenseReportFormProps) {
  const [expenseDetails, setExpenseDetails] = useState<Omit<ExpenseDetail, 'id'>[]>([
    {
      date: new Date().toISOString().split('T')[0],
      category: DEFAULT_CASH_EXPENSE_CATEGORIES[0],
      description: '',
      amount: 0,
      proof: '',
      vendor: ''
    }
  ]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const totalExpense = expenseDetails.reduce((sum, detail) => sum + (detail.amount || 0), 0);
  const difference = totalExpense - transfer.transferAmount;

  const handleAddDetail = () => {
    setExpenseDetails([
      ...expenseDetails,
      {
        date: new Date().toISOString().split('T')[0],
        category: DEFAULT_CASH_EXPENSE_CATEGORIES[0],
        description: '',
        amount: 0,
        proof: '',
        vendor: ''
      }
    ]);
  };

  const handleRemoveDetail = (index: number) => {
    if (expenseDetails.length === 1) {
      alert('Minimal harus ada 1 detail pengeluaran');
      return;
    }
    setExpenseDetails(expenseDetails.filter((_, i) => i !== index));
  };

  const handleDetailChange = (index: number, field: keyof Omit<ExpenseDetail, 'id'>, value: any) => {
    const newDetails = [...expenseDetails];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setExpenseDetails(newDetails);
  };

  const handleProofUpload = async (index: number, file: File) => {
    try {
      const compressed = await compressImage(file);
      handleDetailChange(index, 'proof', compressed);
    } catch (error) {
      console.error('Error uploading proof:', error);
      alert('Gagal mengupload bukti transaksi');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi: semua detail harus punya bukti
    const missingProof = expenseDetails.some(detail => !detail.proof);
    if (missingProof) {
      alert('⚠️ Semua pengeluaran harus memiliki bukti transaksi (foto)!');
      return;
    }

    setLoading(true);

    try {
      const detailsWithId: ExpenseDetail[] = expenseDetails.map((detail, index) => ({
        ...detail,
        id: `${Date.now()}-${index}`
      }));

      await onSubmit({
        expenseDetails: detailsWithId,
        notes
      });
    } catch (error) {
      console.error('Error submitting expense report:', error);
      alert('Terjadi kesalahan saat menyimpan laporan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full my-8">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div>
            <h3 className="text-gray-900">Laporan Pengeluaran</h3>
            <p className="text-sm text-gray-600 mt-1">
              Transfer: Rp {transfer.transferAmount.toLocaleString('id-ID')} - {transfer.employeeName}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Info Banner */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-yellow-600 flex-shrink-0" size={20} />
              <div className="text-sm text-yellow-800">
                <p className="mb-2">
                  <strong>Wajib Upload Bukti:</strong> Setiap pengeluaran HARUS memiliki bukti transaksi (foto struk/nota).
                </p>
                <p>
                  Transfer: <strong>Rp {transfer.transferAmount.toLocaleString('id-ID')}</strong> → 
                  {difference === 0 && <span className="text-green-700"> Pas (tidak ada selisih)</span>}
                  {difference > 0 && <span className="text-red-700"> Kurang Rp {Math.abs(difference).toLocaleString('id-ID')} (perlu tambahan)</span>}
                  {difference < 0 && <span className="text-blue-700"> Lebih Rp {Math.abs(difference).toLocaleString('id-ID')} (perlu pengembalian)</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className={`rounded-lg p-4 border-2 ${
            difference === 0 ? 'bg-green-50 border-green-300' :
            difference > 0 ? 'bg-red-50 border-red-300' :
            'bg-blue-50 border-blue-300'
          }`}>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">Transfer</p>
                <p className="text-xl">Rp {transfer.transferAmount.toLocaleString('id-ID')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Pengeluaran</p>
                <p className="text-xl">Rp {totalExpense.toLocaleString('id-ID')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Selisih</p>
                <p className={`text-xl ${
                  difference === 0 ? 'text-green-600' :
                  difference > 0 ? 'text-red-600' :
                  'text-blue-600'
                }`}>
                  {difference === 0 ? 'Pas' : (difference > 0 ? '+' : '') + 'Rp ' + difference.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>

          {/* Expense Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-gray-900">Detail Pengeluaran</h4>
              <button
                type="button"
                onClick={handleAddDetail}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                <Plus size={16} />
                Tambah Item
              </button>
            </div>

            {expenseDetails.map((detail, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700">Item #{index + 1}</span>
                  {expenseDetails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDetail(index)}
                      className="text-red-600 hover:text-red-700 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Tanggal */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Tanggal</label>
                    <input
                      type="date"
                      value={detail.date}
                      onChange={(e) => handleDetailChange(index, 'date', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Kategori */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Kategori</label>
                    <select
                      value={detail.category}
                      onChange={(e) => handleDetailChange(index, 'category', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      {DEFAULT_CASH_EXPENSE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Deskripsi */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Deskripsi</label>
                    <input
                      type="text"
                      value={detail.description}
                      onChange={(e) => handleDetailChange(index, 'description', e.target.value)}
                      required
                      placeholder="Contoh: Makan siang tim"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Vendor */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Vendor/Toko</label>
                    <input
                      type="text"
                      value={detail.vendor}
                      onChange={(e) => handleDetailChange(index, 'vendor', e.target.value)}
                      placeholder="Contoh: Warteg Bahari"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Jumlah */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Jumlah (Rp)</label>
                    <input
                      type="number"
                      value={detail.amount || ''}
                      onChange={(e) => handleDetailChange(index, 'amount', parseFloat(e.target.value) || 0)}
                      required
                      min="0"
                      step="100"
                      placeholder="50000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Bukti Transaksi */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Bukti Transaksi <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        detail.proof 
                          ? 'border-green-300 bg-green-50 text-green-700' 
                          : 'border-gray-300 hover:border-blue-400 text-gray-600'
                      }`}>
                        <Camera size={16} />
                        <span className="text-sm">
                          {detail.proof ? '✓ Sudah Upload' : 'Upload Foto'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleProofUpload(index, file);
                          }}
                          className="hidden"
                        />
                      </label>
                      {detail.proof && (
                        <button
                          type="button"
                          onClick={() => window.open(detail.proof, '_blank')}
                          className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                        >
                          <FileText size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="block text-gray-700 mb-2">
              Catatan Tambahan (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Keterangan tambahan tentang pengeluaran ini..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <FileText size={18} />
                  Submit Laporan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
