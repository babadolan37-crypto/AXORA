import { useState } from 'react';
import { X, ArrowRightLeft, ArrowRight } from 'lucide-react';
import { useCashManagement } from '../hooks/useCashManagement';
import { CashType } from '../types/cash-management';
import { supabase } from '../lib/supabase';

interface QuickCashTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddIncome?: (entry: any) => Promise<void>;
  onAddExpense?: (entry: any) => Promise<void>;
}

export function QuickCashTransferModal({ isOpen, onClose, onAddIncome, onAddExpense }: QuickCashTransferModalProps) {
  const { transferCash, balances } = useCashManagement();
  const [fromCash, setFromCash] = useState<CashType>('big');
  const [toCash, setToCash] = useState<CashType>('small');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bigCashBalance = balances.find(b => b.cashType === 'big')?.balance || 0;
  const smallCashBalance = balances.find(b => b.cashType === 'small')?.balance || 0;

  const handleSwitch = () => {
    setFromCash(fromCash === 'big' ? 'small' : 'big');
    setToCash(toCash === 'big' ? 'small' : 'big');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const transferAmount = parseFloat(amount);
    if (!transferAmount || transferAmount <= 0) {
      alert('Jumlah harus lebih dari 0');
      return;
    }

    const fromBalance = fromCash === 'big' ? bigCashBalance : smallCashBalance;
    if (transferAmount > fromBalance) {
      alert(`Saldo ${fromCash === 'big' ? 'Kas Besar' : 'Kas Kecil'} tidak cukup! Saldo: Rp ${fromBalance.toLocaleString('id-ID')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const transferDate = new Date().toISOString().split('T')[0];
      const transferDesc = description || `Transfer dari ${fromCash === 'big' ? 'Kas Besar' : 'Kas Kecil'} ke ${toCash === 'big' ? 'Kas Besar' : 'Kas Kecil'}`;
      
      // 1. Create transfer in cash_transactions (this updates balances)
      await transferCash({
        fromCash,
        toCash,
        amount: transferAmount,
        description: transferDesc,
        date: transferDate
      });

      // 2. Create expense entry WITHOUT updating balance (just record keeping)
      const expenseData = {
        user_id: user.id,
        date: transferDate,
        category: 'Transfer Kas',
        description: `${transferDesc} (Pengeluaran)`,
        amount: transferAmount,
        payment_method: 'Tunai',
        notes: `Transfer ke ${toCash === 'big' ? 'Kas Besar' : 'Kas Kecil'}`,
        photos: [],
        paid_to: `Transfer Internal - ${toCash === 'big' ? 'Kas Besar' : 'Kas Kecil'}`,
        cash_type: fromCash,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await supabase.from('expense_entries').insert([expenseData]);

      // 3. Create income entry WITHOUT updating balance (just record keeping)
      const incomeData = {
        user_id: user.id,
        date: transferDate,
        source: 'Transfer Kas',
        description: `${transferDesc} (Pemasukan)`,
        amount: transferAmount,
        payment_method: 'Tunai',
        notes: `Transfer dari ${fromCash === 'big' ? 'Kas Besar' : 'Kas Kecil'}`,
        photos: [],
        received_from: `Transfer Internal - ${fromCash === 'big' ? 'Kas Besar' : 'Kas Kecil'}`,
        cash_type: toCash,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await supabase.from('income_entries').insert([incomeData]);

      // Trigger refresh of transaction list
      window.dispatchEvent(new Event('cashBalanceUpdated'));

      alert('✅ Transfer berhasil! Transaksi tercatat di riwayat pemasukan dan pengeluaran.');
      setAmount('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Transfer failed:', error);
      alert('❌ Transfer gagal. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <ArrowRightLeft size={24} />
              <h3 className="text-lg">Transfer Kas</h3>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Transfer Direction */}
          <div className="space-y-4">
            {/* From */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">Dari</label>
              <div className={`border-2 rounded-lg p-4 ${
                fromCash === 'big' ? 'border-purple-300 bg-purple-50' : 'border-amber-300 bg-amber-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {fromCash === 'big' ? 'Kas Besar' : 'Kas Kecil'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Saldo: Rp {(fromCash === 'big' ? bigCashBalance : smallCashBalance).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Switch Button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleSwitch}
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                title="Tukar arah transfer"
              >
                <ArrowRightLeft size={20} className="text-gray-600" />
              </button>
            </div>

            {/* To */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">Ke</label>
              <div className={`border-2 rounded-lg p-4 ${
                toCash === 'big' ? 'border-purple-300 bg-purple-50' : 'border-amber-300 bg-amber-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {toCash === 'big' ? 'Kas Besar' : 'Kas Kecil'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Saldo: Rp {(toCash === 'big' ? bigCashBalance : smallCashBalance).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Jumlah Transfer <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                required
                min="1"
                step="1"
              />
            </div>
            {amount && parseFloat(amount) > 0 && (
              <p className="text-sm text-blue-600 mt-2">
                = {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0
                }).format(parseFloat(amount))}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Keterangan <span className="text-gray-500">(Opsional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Contoh: Pengisian kas kecil untuk operasional"
              rows={3}
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>ℹ️ Info:</strong> Transfer akan tercatat otomatis di riwayat transaksi kas. 
              Saldo akan langsung diupdate.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <ArrowRight size={20} />
                  <span>Transfer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}