import { useState } from 'react';
import { X, Plus, Trash2, Send } from 'lucide-react';
import { CashTransfer, CashType, CASH_TYPE_OPTIONS, ExpenseDetail, DEFAULT_CASH_EXPENSE_CATEGORIES } from '../types/cash-management';

interface DirectCashExpenseFormProps {
  onSubmit: (transfer: Omit<CashTransfer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

interface ExpenseItem {
  category: string;
  description: string;
  amount: string;
}

export function DirectCashExpenseForm({ onSubmit, onCancel }: DirectCashExpenseFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    cashType: 'small' as CashType,
    employeeName: '',
    description: '',
    notes: ''
  });

  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([
    { category: DEFAULT_CASH_EXPENSE_CATEGORIES[0], description: '', amount: '' }
  ]);

  const [loading, setLoading] = useState(false);

  // Hitung total pengeluaran
  const totalExpense = expenseItems.reduce((sum, item) => {
    const amount = parseFloat(item.amount) || 0;
    return sum + amount;
  }, 0);

  const handleAddExpenseItem = () => {
    setExpenseItems([
      ...expenseItems,
      { category: DEFAULT_CASH_EXPENSE_CATEGORIES[0], description: '', amount: '' }
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
    newItems[index] = { ...newItems[index], [field]: value };
    setExpenseItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi: semua item harus diisi
    const hasEmptyItems = expenseItems.some(item => 
      !item.description || !item.amount || parseFloat(item.amount) <= 0
    );

    if (hasEmptyItems) {
      alert('⚠️ Semua item pengeluaran harus diisi dengan lengkap!');
      return;
    }

    setLoading(true);

    try {
      // Convert expense items to ExpenseDetail format
      const expenseDetails: ExpenseDetail[] = expenseItems.map((item, index) => ({
        id: `${Date.now()}-${index}`,
        date: formData.date,
        category: item.category,
        description: item.description,
        amount: parseFloat(item.amount),
        proof: '', // Tidak wajib untuk direct input
        vendor: ''
      }));

      const actualExpense = totalExpense;
      const transferAmount = totalExpense; // Transfer amount = total pengeluaran
      const difference = 0; // Selalu 0 karena sudah sesuai

      const transferData: Omit<CashTransfer, 'id' | 'createdAt' | 'updatedAt'> = {
        date: formData.date,
        cashType: formData.cashType,
        employeeName: formData.employeeName,
        transferAmount,
        actualExpense,
        difference,
        status: 'settled', // Langsung selesai karena sudah sesuai
        description: formData.description || `Transfer Kas untuk ${formData.employeeName}`,
        expenseDetails,
        notes: formData.notes
      };

      await onSubmit(transferData);
    } catch (error) {
      console.error('Error submitting transfer:', error);
      alert('Terjadi kesalahan saat menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full my-8">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
          <div>
            <h3 className="text-gray-900">Pengeluaran Kas Langsung</h3>
            <p className="text-sm text-gray-600 mt-1">
              Catat pengeluaran kas dengan detail lengkap
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Pengeluaran Langsung:</strong> Catat transfer kas beserta detail pengeluaran dalam satu form. 
              Total transfer akan otomatis dihitung dari total pengeluaran.
            </p>
          </div>

          {/* Informasi Dasar */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
            <h4 className="text-gray-900 text-sm">Informasi Transaksi</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tanggal */}
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Tanggal Transaksi <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Jenis Kas */}
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Jenis Kas <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.cashType}
                  onChange={(e) => setFormData({ ...formData, cashType: e.target.value as CashType })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CASH_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Penerima Transfer */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Penerima Transfer <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.employeeName}
                onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                required
                placeholder="Contoh: Kinnan"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Deskripsi (Opsional)
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Contoh: Pengeluaran operasional harian"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Detail Pengeluaran */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-gray-900">Detail Pengeluaran</h4>
              <button
                type="button"
                onClick={handleAddExpenseItem}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                <Plus size={16} />
                Tambah Item
              </button>
            </div>

            {/* Expense Items */}
            <div className="space-y-3">
              {expenseItems.map((item, index) => (
                <div key={index} className="bg-white border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-700">Pengeluaran #{index + 1}</span>
                    {expenseItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveExpenseItem(index)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Kategori */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Kategori</label>
                      <select
                        value={item.category}
                        onChange={(e) => handleExpenseItemChange(index, 'category', e.target.value)}
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
                      <label className="block text-xs text-gray-600 mb-1">Deskripsi</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleExpenseItemChange(index, 'description', e.target.value)}
                        required
                        placeholder="Contoh: Bensin"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>

                    {/* Jumlah */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Jumlah (Rp)</label>
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => handleExpenseItemChange(index, 'amount', e.target.value)}
                        required
                        min="0"
                        step="100"
                        placeholder="40000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Pengeluaran */}
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 mb-1">Total Transfer</p>
                  <p className="text-2xl text-green-900">
                    Rp {totalExpense.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <Send className="text-green-700" size={24} />
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2">
                Jumlah yang akan ditransfer sesuai dengan total pengeluaran
              </p>
            </div>
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Catatan Tambahan (Opsional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Keterangan tambahan jika diperlukan..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
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
              disabled={loading || totalExpense <= 0}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Simpan Pengeluaran (Rp {totalExpense.toLocaleString('id-ID')})
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
