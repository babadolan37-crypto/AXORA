import { useState } from 'react';
import { X, Plus, Trash2, Save, ArrowLeftRight, Info } from 'lucide-react';

interface ExpenseItem {
  description: string;
  amount: string;
  category: string;
}

type TransactionType = 'transfer' | 'reimburse' | 'expense' | 'income';

interface UniversalTransactionFormProps {
  onSubmit: (data: {
    date: string;
    cashType: 'big' | 'small';
    description: string;
    transactionType: TransactionType;
    receiverName: string;
    debitAmount: number; // Masuk/Pemasukan
    creditAmount: number; // Keluar/Pengeluaran
    transferToSmallCash: boolean;
    expenseDetails: ExpenseItem[];
    notes: string;
  }) => Promise<void>;
  onCancel: () => void;
  expenseCategories: string[];
}

const TRANSACTION_TYPES = [
  { value: 'transfer', label: 'Transfer' },
  { value: 'reimburse', label: 'Reimburse' },
  { value: 'expense', label: 'Pengeluaran Lain' },
  { value: 'income', label: 'Pemasukan' },
];

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

const parseFormattedNumber = (value: string) => {
  return parseFloat(value.replace(/\./g, '')) || 0;
};

export function UniversalTransactionForm({ onSubmit, onCancel, expenseCategories }: UniversalTransactionFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    cashType: 'big' as 'big' | 'small',
    description: '',
    transactionType: 'transfer' as TransactionType,
    receiverName: '',
    debitAmount: '', // Nominal Debit (Masuk)
    creditAmount: '', // Nominal Kredit (Keluar)
    transferToSmallCash: false,
    notes: ''
  });

  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([
    { description: '', amount: '', category: expenseCategories[0] || '' }
  ]);

  const [loading, setLoading] = useState(false);

  // Check if we should show expense details section
  const shouldShowExpenseDetails = formData.transactionType === 'transfer' || formData.transactionType === 'reimburse';

  // Calculate total expense from items
  const totalExpenseFromItems = expenseItems.reduce((sum, item) => {
    return sum + parseFormattedNumber(item.amount);
  }, 0);

  const debitAmountNum = parseFormattedNumber(formData.debitAmount);
  const creditAmountNum = parseFormattedNumber(formData.creditAmount);

  // Validation for expense details
  const isExpenseDetailsValid = !shouldShowExpenseDetails || (
    totalExpenseFromItems > 0 && 
    totalExpenseFromItems === creditAmountNum
  );

  const handleAddExpenseItem = () => {
    setExpenseItems([
      ...expenseItems,
      { description: '', amount: '', category: expenseCategories[0] || '' }
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

    // Validasi dasar
    if (!formData.description.trim()) {
      alert('⚠️ Deskripsi transaksi harus diisi!');
      return;
    }

    // Validasi nominal (harus ada salah satu: debit atau kredit)
    if (debitAmountNum === 0 && creditAmountNum === 0) {
      alert('⚠️ Nominal Debit atau Kredit harus diisi!');
      return;
    }

    // Validasi tidak boleh isi keduanya
    if (debitAmountNum > 0 && creditAmountNum > 0) {
      alert('⚠️ Hanya boleh isi Nominal Debit ATAU Kredit, tidak boleh keduanya!');
      return;
    }

    // Validasi penerima untuk transaksi kredit
    if (creditAmountNum > 0 && !formData.receiverName.trim()) {
      alert('⚠️ Nama penerima harus diisi untuk transaksi pengeluaran!');
      return;
    }

    // Validasi expense details jika perlu
    if (shouldShowExpenseDetails) {
      const hasEmptyItems = expenseItems.some(item => 
        !item.description.trim() || !item.category || parseFormattedNumber(item.amount) <= 0
      );

      if (hasEmptyItems) {
        alert('⚠️ Semua detail pengeluaran harus diisi dengan lengkap!');
        return;
      }

      if (totalExpenseFromItems !== creditAmountNum) {
        alert(`⚠️ Total detail pengeluaran (${formatCurrency(totalExpenseFromItems)}) harus sama dengan Nominal Kredit (${formatCurrency(creditAmountNum)})!`);
        return;
      }
    }

    setLoading(true);

    try {
      await onSubmit({
        date: formData.date,
        cashType: formData.cashType,
        description: formData.description,
        transactionType: formData.transactionType,
        receiverName: formData.receiverName,
        debitAmount: debitAmountNum,
        creditAmount: creditAmountNum,
        transferToSmallCash: formData.transferToSmallCash,
        expenseDetails: shouldShowExpenseDetails ? expenseItems : [],
        notes: formData.notes
      });
      
      alert('✅ Transaksi berhasil disimpan!');
      onCancel();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('❌ Gagal menyimpan transaksi. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-swap untuk transfer button
  const handleSwapAmounts = () => {
    setFormData({
      ...formData,
      debitAmount: formData.creditAmount,
      creditAmount: formData.debitAmount
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Tambah Transaksi Baru</h2>
              <p className="text-sm text-blue-100 mt-1">
                Formulir transaksi dengan detail pengeluaran
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
          {/* Row 1: Tanggal & Jenis Kas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tanggal Transaksi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Transaksi <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Jenis Kas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Kas <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.cashType}
                onChange={(e) => setFormData({ ...formData, cashType: e.target.value as 'big' | 'small' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="big">Kas Besar</option>
                <option value="small">Kas Kecil</option>
              </select>
            </div>
          </div>

          {/* Deskripsi Transaksi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi Transaksi <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Contoh: Transfer kas kecil untuk operasional"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Row 2: Jenis Transaksi & Penerima */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Jenis Transaksi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Transaksi <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.transactionType}
                onChange={(e) => setFormData({ ...formData, transactionType: e.target.value as TransactionType })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {TRANSACTION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Penerima */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Penerima {creditAmountNum > 0 && <span className="text-red-600">*</span>}
              </label>
              <input
                type="text"
                value={formData.receiverName}
                onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                placeholder="Nama penerima"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={creditAmountNum > 0}
              />
            </div>
          </div>

          {/* Row 3: Nominal Debit & Kredit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nominal Debit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nominal Debit (Masuk)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  Rp
                </span>
                <input
                  type="text"
                  value={formData.debitAmount}
                  onChange={(e) => setFormData({ ...formData, debitAmount: formatNumber(e.target.value) })}
                  placeholder="0"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={creditAmountNum > 0}
                />
              </div>
              {debitAmountNum > 0 && (
                <p className="text-sm text-green-600 mt-1">
                  = {formatCurrency(debitAmountNum)}
                </p>
              )}
            </div>

            {/* Nominal Kredit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nominal Kredit (Keluar)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  Rp
                </span>
                <input
                  type="text"
                  value={formData.creditAmount}
                  onChange={(e) => setFormData({ ...formData, creditAmount: formatNumber(e.target.value) })}
                  placeholder="0"
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  disabled={debitAmountNum > 0}
                />
                <button
                  type="button"
                  onClick={handleSwapAmounts}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Tukar Debit ⇄ Kredit"
                >
                  <ArrowLeftRight size={18} />
                </button>
              </div>
              {creditAmountNum > 0 && (
                <p className="text-sm text-red-600 mt-1">
                  = {formatCurrency(creditAmountNum)}
                </p>
              )}
            </div>
          </div>

          {/* Transfer ke Kas Kecil Checkbox (only for Kas Besar with Credit) */}
          {formData.cashType === 'big' && creditAmountNum > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.transferToSmallCash}
                  onChange={(e) => setFormData({ ...formData, transferToSmallCash: e.target.checked })}
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-blue-900">Transfer ke Kas Kecil</span>
                    <Info size={16} className="text-blue-600" />
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Centang ini jika transfer dari Kas Besar ke Kas Kecil. Sistem akan otomatis menambahkan saldo ke Kas Kecil tanpa perlu detail pengeluaran.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Detail Pengeluaran Penerima (Conditional) */}
          {shouldShowExpenseDetails && creditAmountNum > 0 && !formData.transferToSmallCash && (
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  Detail Pengeluaran Penerima
                </h3>
                <button
                  type="button"
                  onClick={handleAddExpenseItem}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus size={18} />
                  <span>Tambah Item Pengeluaran</span>
                </button>
              </div>

              <div className="space-y-3">
                {expenseItems.map((item, index) => (
                  <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Deskripsi */}
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Deskripsi pengeluaran
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleExpenseItemChange(index, 'description', e.target.value)}
                            placeholder="contoh: Bensin"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            required={shouldShowExpenseDetails}
                          />
                        </div>

                        {/* Jumlah */}
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Jumlah
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                              Rp
                            </span>
                            <input
                              type="text"
                              value={item.amount}
                              onChange={(e) => handleExpenseItemChange(index, 'amount', e.target.value)}
                              placeholder="0"
                              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              required={shouldShowExpenseDetails}
                            />
                          </div>
                        </div>

                        {/* Kategori */}
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Kategori
                          </label>
                          <select
                            value={item.category}
                            onChange={(e) => handleExpenseItemChange(index, 'category', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            required={shouldShowExpenseDetails}
                          >
                            {expenseCategories.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
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

              {/* Summary untuk expense details */}
              {shouldShowExpenseDetails && (
                <div className="bg-white rounded-lg border-2 border-gray-300 p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Total Detail Pengeluaran:</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(totalExpenseFromItems)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Nominal Kredit:</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(creditAmountNum)}
                      </span>
                    </div>
                    <div className="border-t-2 border-gray-300 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Selisih:</span>
                        <span className={`font-bold ${
                          totalExpenseFromItems === creditAmountNum ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(Math.abs(creditAmountNum - totalExpenseFromItems))}
                        </span>
                      </div>
                    </div>
                    
                    {totalExpenseFromItems === creditAmountNum ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2 mt-2">
                        <p className="text-sm text-green-800 text-center font-medium">
                          ✅ Balanced! Total detail sama dengan nominal kredit
                        </p>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2">
                        <p className="text-sm text-red-800 text-center">
                          ❌ Total detail harus sama dengan nominal kredit!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Catatan Tambahan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catatan Tambahan (Opsional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Tambahkan catatan jika diperlukan"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
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
              disabled={loading || (shouldShowExpenseDetails && !formData.transferToSmallCash && !isExpenseDetailsValid)}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                (loading || (shouldShowExpenseDetails && !formData.transferToSmallCash && !isExpenseDetailsValid))
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Simpan Transaksi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
