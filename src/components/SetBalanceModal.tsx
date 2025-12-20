import { useState } from 'react';
import { X, Wallet } from 'lucide-react';
import { CashType } from '../types/cash-management';

interface SetBalanceModalProps {
  cashType: CashType;
  currentBalance: number;
  onSubmit: (cashType: CashType, newBalance: number) => Promise<void>;
  onCancel: () => void;
}

export function SetBalanceModal({ cashType, currentBalance, onSubmit, onCancel }: SetBalanceModalProps) {
  const [balance, setBalance] = useState(currentBalance.toString());
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const balanceNum = parseFloat(balance);
    if (isNaN(balanceNum) || balanceNum < 0) {
      alert('Saldo harus 0 atau lebih');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(cashType, balanceNum);
      onCancel();
    } catch (error: any) {
      alert('Gagal mengatur saldo: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const cashLabel = cashType === 'big' ? 'Kas Besar' : 'Kas Kecil';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Wallet size={24} />
            </div>
            <h2 className="text-xl">Atur Saldo {cashLabel}</h2>
          </div>
          <button onClick={onCancel} className="text-white/80 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ Fitur ini untuk mengatur <strong>saldo awal</strong> atau melakukan <strong>koreksi saldo</strong>. 
              Untuk transaksi harian, gunakan tombol "Tambah Transaksi".
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Saldo Saat Ini</label>
            <div className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
              Rp {currentBalance.toLocaleString('id-ID')}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Saldo Baru</label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              min="0"
              step="1"
            />
          </div>

          {balance && !isNaN(parseFloat(balance)) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Saldo akan diubah menjadi: <strong>Rp {parseFloat(balance).toLocaleString('id-ID')}</strong>
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Menyimpan...' : 'Simpan Saldo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
