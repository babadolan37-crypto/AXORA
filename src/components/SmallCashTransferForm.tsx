import { useState } from 'react';
import { X, Plus, Trash2, Send, DollarSign, ArrowRight } from 'lucide-react';

interface ExpenseItem {
  category: string;
  description: string;
  amount: string;
}

interface SmallCashTransferFormProps {
  onSubmit: (data: {
    date: string;
    description: string;
    receiverName: string;
    totalTransfer: number;
    expenseItems: ExpenseItem[];
  }) => Promise<void>;
  onCancel: () => void;
  expenseCategories: string[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: string) => {
  const num = value.replace(/\D/g, '');
  return num ? parseInt(num).toLocaleString('id-ID') : '';
};

export function SmallCashTransferForm({ onSubmit, onCancel, expenseCategories }: SmallCashTransferFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    receiverName: '',
    totalTransfer: ''
  });

  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([
    { category: expenseCategories[0] || 'Bensin', description: '', amount: '' }
  ]);

  const [loading, setLoading] = useState(false);

  // Hitung total pengeluaran
  const totalExpense = expenseItems.reduce((sum, item) => {
    const amount = parseFloat(item.amount.replace(/\./g, '')) || 0;
    return sum + amount;
  }, 0);

  const totalTransferNum = parseFloat(formData.totalTransfer.replace(/\./g, '')) || 0;

  // Check if balanced
  const isBalanced = totalExpense === totalTransferNum && totalExpense > 0;
  const difference = totalTransferNum - totalExpense;

  const handleAddExpenseItem = () => {
    setExpenseItems([
      ...expenseItems,
      { category: expenseCategories[0] || 'Bensin', description: '', amount: '' }
    ]);
  };

  const handleRemoveExpenseItem = (index: number) => {
    if (expenseItems.length === 1) {
      alert('Minimal harus ada 1 item pengeluaran');
      return;
    }
    setExpenseItems(expenseItems.filter((_, i) => i !== index));
  };

  const handleExpenseItemChange = (index: number, field: keyof ExpenseItem, value: string) => {
    const newItems = [...expenseItems];
    if (field === 'amount') {
      newItems[index] = { ...newItems[index], [field]: formatNumber(value) };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setExpenseItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi
    if (!formData.receiverName.trim()) {
      alert('⚠️ Nama penerima transfer harus diisi!');
      return;
    }

    if (!formData.totalTransfer || totalTransferNum <= 0) {
      alert('⚠️ Total transfer harus diisi dengan nilai lebih dari 0!');
      return;
    }

    const hasEmptyItems = expenseItems.some(item => 
      !item.category || !item.description.trim() || !item.amount || parseFloat(item.amount.replace(/\./g, '')) <= 0
    );

    if (hasEmptyItems) {
      alert('⚠️ Semua item pengeluaran harus diisi dengan lengkap!');
      return;
    }

    if (!isBalanced) {
      alert(`⚠️ Total transfer (${formatCurrency(totalTransferNum)}) harus sama dengan total pengeluaran (${formatCurrency(totalExpense)})!`);
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        date: formData.date,
        description: formData.description || `Transfer Kas Kecil untuk ${formData.receiverName}`,
        receiverName: formData.receiverName,
        totalTransfer: totalTransferNum,
        expenseItems: expenseItems.map(item => ({
          ...item,
          amount: item.amount // Keep formatted
        }))
      });
      
      alert('✅ Pengeluaran kas kecil berhasil dicatat!');
      onCancel();
    } catch (error) {
      console.error('Error saving small cash transfer:', error);
      alert('❌ Gagal menyimpan data. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-orange-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Pengeluaran Kas Kecil via Transfer</h2>
              <p className="text-sm text-orange-100 mt-1">
                Catat transfer kas kecil dengan detail pengeluaran penerima
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <ArrowRight size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Cara Penggunaan</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Masukkan nama penerima transfer dan total transfer</li>
                  <li>• Tambahkan detail pengeluaran yang dilakukan penerima</li>
                  <li>• Total pengeluaran harus sama dengan total transfer</li>
                  <li>• Sistem akan otomatis validasi keseimbangan</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Transfer Information */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign size={20} className="text-orange-600" />
              Informasi Transfer
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tanggal */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Tanggal Transaksi <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              {/* Penerima Transfer */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Penerima Transfer <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.receiverName}
                  onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                  placeholder="Masukkan nama penerima (contoh: Kinnan)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Deskripsi Transaksi (Opsional)
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Otomatis terisi jika kosong: Transfer Kas Kecil untuk [Nama]"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Total Transfer */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Total Transfer (Debit) <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  Rp
                </span>
                <input
                  type="text"
                  value={formData.totalTransfer}
                  onChange={(e) => setFormData({ ...formData, totalTransfer: formatNumber(e.target.value) })}
                  placeholder="91.000"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              {totalTransferNum > 0 && (
                <p className="text-sm text-blue-600 mt-1">
                  = {formatCurrency(totalTransferNum)}
                </p>
              )}
            </div>
          </div>

          {/* Expense Items */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Daftar Pengeluaran Penerima
              </h3>
              <button
                type="button"
                onClick={handleAddExpenseItem}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Plus size={18} />
                <span className="text-sm">Tambah Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {expenseItems.map((item, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                          Pengeluaran {index + 1}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Kategori */}
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Kategori
                          </label>
                          <select
                            value={item.category}
                            onChange={(e) => handleExpenseItemChange(index, 'category', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                            required
                          >
                            {expenseCategories.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>

                        {/* Deskripsi */}
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Deskripsi
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleExpenseItemChange(index, 'description', e.target.value)}
                            placeholder="Rincian pengeluaran"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                            required
                          />
                        </div>

                        {/* Nominal */}
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Nominal
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                              Rp
                            </span>
                            <input
                              type="text"
                              value={item.amount}
                              onChange={(e) => handleExpenseItemChange(index, 'amount', e.target.value)}
                              placeholder="40.000"
                              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveExpenseItem(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 border-2 border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Ringkasan</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Total Transfer:</span>
                <span className="font-semibold text-lg text-gray-900">
                  {formatCurrency(totalTransferNum)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-700">Total Pengeluaran:</span>
                <span className="font-semibold text-lg text-gray-900">
                  {formatCurrency(totalExpense)}
                </span>
              </div>

              <div className="border-t-2 border-gray-300 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Selisih:</span>
                  <span className={`font-bold text-xl ${
                    isBalanced ? 'text-green-600' : 
                    difference > 0 ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(Math.abs(difference))}
                  </span>
                </div>
                
                {isBalanced ? (
                  <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800 text-center font-medium">
                      ✅ Balanced! Transfer dan pengeluaran sudah sesuai
                    </p>
                  </div>
                ) : difference > 0 ? (
                  <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-sm text-orange-800 text-center">
                      ⚠️ Transfer lebih besar {formatCurrency(difference)} dari pengeluaran
                    </p>
                  </div>
                ) : (
                  <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800 text-center">
                      ❌ Pengeluaran lebih besar {formatCurrency(Math.abs(difference))} dari transfer
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!isBalanced || loading}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                isBalanced && !loading
                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Simpan Pengeluaran</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
