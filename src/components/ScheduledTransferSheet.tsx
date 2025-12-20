import { useState, useEffect } from 'react';
import { X, Plus, Calendar, Pause, Play, Trash2, Clock } from 'lucide-react';
import { useScheduledTransfer } from '../hooks/useScheduledTransfer';
import { TransferFrequency, ScheduledTransfer } from '../types/scheduled-transfer';
import { CashType } from '../types/cash-management';

interface ScheduledTransferSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScheduledTransferSheet({ isOpen, onClose }: ScheduledTransferSheetProps) {
  const {
    loading,
    scheduledTransfers,
    createScheduledTransfer,
    toggleScheduledTransfer,
    deleteScheduledTransfer,
    executeScheduledTransfer
  } = useScheduledTransfer();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fromCash: 'big' as CashType,
    toCash: 'small' as CashType,
    amount: '',
    frequency: 'weekly' as TransferFrequency,
    dayOfWeek: 1, // Monday
    dayOfMonth: 1,
    description: '',
    autoApprove: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Jumlah harus lebih dari 0');
      return;
    }

    try {
      await createScheduledTransfer({
        fromCash: formData.fromCash,
        toCash: formData.toCash,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
        dayOfWeek: formData.frequency === 'weekly' || formData.frequency === 'biweekly' 
          ? formData.dayOfWeek 
          : undefined,
        dayOfMonth: formData.frequency === 'monthly' ? formData.dayOfMonth : undefined,
        description: formData.description,
        autoApprove: formData.autoApprove
      });

      // Reset form
      setFormData({
        fromCash: 'big',
        toCash: 'small',
        amount: '',
        frequency: 'weekly',
        dayOfWeek: 1,
        dayOfMonth: 1,
        description: '',
        autoApprove: true
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error creating scheduled transfer:', error);
      alert('Gagal membuat transfer terjadwal');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus transfer terjadwal ini?')) {
      try {
        await deleteScheduledTransfer(id);
      } catch (error) {
        alert('Gagal menghapus transfer terjadwal');
      }
    }
  };

  const handleExecuteNow = async (id: string) => {
    if (confirm('Jalankan transfer ini sekarang?')) {
      try {
        await executeScheduledTransfer(id);
        alert('Transfer berhasil dijalankan!');
      } catch (error) {
        alert('Gagal menjalankan transfer');
      }
    }
  };

  const getDayName = (day: number) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[day];
  };

  const getFrequencyLabel = (freq: TransferFrequency) => {
    const labels: Record<TransferFrequency, string> = {
      weekly: 'Mingguan',
      biweekly: '2 Minggu',
      monthly: 'Bulanan'
    };
    return labels[freq];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-3xl sm:rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl">Transfer Terjadwal</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!showForm ? (
            <>
              <button
                onClick={() => setShowForm(true)}
                className="w-full mb-6 py-3 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Buat Transfer Terjadwal Baru
              </button>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Loading...</p>
                </div>
              ) : scheduledTransfers.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Belum ada transfer terjadwal</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduledTransfers.map((transfer) => (
                    <div key={transfer.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {transfer.fromCash === 'big' ? 'Kas Besar' : 'Kas Kecil'} →{' '}
                              {transfer.toCash === 'big' ? 'Kas Besar' : 'Kas Kecil'}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              transfer.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {transfer.status === 'active' ? 'Aktif' : 'Paused'}
                            </span>
                          </div>
                          <p className="text-lg mb-1">Rp {transfer.amount.toLocaleString('id-ID')}</p>
                          <p className="text-sm text-gray-600">{transfer.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{getFrequencyLabel(transfer.frequency)}</span>
                        </div>
                        {transfer.dayOfWeek !== undefined && (
                          <span>setiap {getDayName(transfer.dayOfWeek)}</span>
                        )}
                        {transfer.dayOfMonth !== undefined && (
                          <span>tanggal {transfer.dayOfMonth}</span>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 mb-3">
                        Transfer berikutnya: {new Date(transfer.nextRunDate).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleScheduledTransfer(transfer.id)}
                          className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm ${
                            transfer.status === 'active'
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {transfer.status === 'active' ? (
                            <>
                              <Pause className="w-4 h-4" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              Resume
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleExecuteNow(transfer.id)}
                          className="flex-1 px-3 py-2 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-lg text-sm"
                        >
                          Jalankan Sekarang
                        </button>
                        <button
                          onClick={() => handleDelete(transfer.id)}
                          className="px-3 py-2 bg-red-100 text-red-800 hover:bg-red-200 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-lg mb-4">Buat Transfer Terjadwal Baru</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Dari</label>
                  <select
                    value={formData.fromCash}
                    onChange={(e) => setFormData({ ...formData, fromCash: e.target.value as CashType })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="big">Kas Besar</option>
                    <option value="small">Kas Kecil</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2">Ke</label>
                  <select
                    value={formData.toCash}
                    onChange={(e) => setFormData({ ...formData, toCash: e.target.value as CashType })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="big">Kas Besar</option>
                    <option value="small">Kas Kecil</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2">Jumlah</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Frekuensi</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as TransferFrequency })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="weekly">Mingguan</option>
                  <option value="biweekly">2 Minggu Sekali</option>
                  <option value="monthly">Bulanan</option>
                </select>
              </div>

              {(formData.frequency === 'weekly' || formData.frequency === 'biweekly') && (
                <div>
                  <label className="block text-sm mb-2">Hari</label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="0">Minggu</option>
                    <option value="1">Senin</option>
                    <option value="2">Selasa</option>
                    <option value="3">Rabu</option>
                    <option value="4">Kamis</option>
                    <option value="5">Jumat</option>
                    <option value="6">Sabtu</option>
                  </select>
                </div>
              )}

              {formData.frequency === 'monthly' && (
                <div>
                  <label className="block text-sm mb-2">Tanggal</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dayOfMonth}
                    onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm mb-2">Deskripsi</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Transfer mingguan Kas Besar ke Kas Kecil"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoApprove"
                  checked={formData.autoApprove}
                  onChange={(e) => setFormData({ ...formData, autoApprove: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="autoApprove" className="text-sm">
                  Jalankan otomatis tanpa konfirmasi
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg"
                >
                  Simpan
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
