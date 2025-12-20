import { useState } from 'react';
import { X, Upload, DollarSign } from 'lucide-react';
import { CashType, TransactionType } from '../types/cash-management';
import { supabase } from '../lib/supabase';

interface CashTransactionFormProps {
  onSubmit: (transaction: {
    date: string;
    cashType: CashType;
    transactionType: TransactionType;
    amount: number;
    description: string;
    proof?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export function CashTransactionForm({ onSubmit, onCancel }: CashTransactionFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [cashType, setCashType] = useState<CashType>('big');
  const [transactionType, setTransactionType] = useState<TransactionType>('out');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [proof, setProof] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Hanya file gambar yang diperbolehkan');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB');
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('transaction-proofs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('transaction-proofs')
        .getPublicUrl(fileName);

      setProof(publicUrl);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      alert('Gagal upload bukti: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Jumlah harus lebih dari 0');
      return;
    }

    if (!description.trim()) {
      alert('Keterangan wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        date,
        cashType,
        transactionType,
        amount: amountNum,
        description: description.trim(),
        proof
      });

      // Reset form
      setDate(new Date().toISOString().split('T')[0]);
      setCashType('big');
      setTransactionType('out');
      setAmount('');
      setDescription('');
      setProof('');
    } catch (error: any) {
      alert('Gagal menyimpan transaksi: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <DollarSign size={24} />
            </div>
            <h2 className="text-xl">Tambah Transaksi Kas</h2>
          </div>
          <button onClick={onCancel} className="text-white/80 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Date & Cash Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Jenis Kas</label>
              <select
                value={cashType}
                onChange={(e) => setCashType(e.target.value as CashType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="big">Kas Besar</option>
                <option value="small">Kas Kecil</option>
              </select>
            </div>
          </div>

          {/* Transaction Type & Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Tipe Transaksi</label>
              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value as TransactionType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="in">Pemasukan</option>
                <option value="out">Pengeluaran</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Jumlah (Rp)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                min="0"
                step="1"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Keterangan</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Bayar listrik kantor bulan Desember"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              required
            />
          </div>

          {/* Proof Upload */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Bukti Transaksi (Opsional)</label>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <Upload size={20} className="text-gray-500" />
                <span className="text-sm text-gray-600">
                  {uploading ? 'Uploading...' : proof ? 'Bukti terupload' : 'Upload foto bukti'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              {proof && (
                <a
                  href={proof}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg"
                >
                  Lihat
                </a>
              )}
            </div>
          </div>

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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={submitting || uploading}
            >
              {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
