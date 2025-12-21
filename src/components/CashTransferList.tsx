import { useState } from 'react';
import { FileText, Trash2, CheckCircle, DollarSign, Eye, Image as ImageIcon, Upload } from 'lucide-react';
import { CashTransfer } from '../types/cash-management';
import { compressImage } from '../utils/imageCompression';

interface CashTransferListProps {
  transfers: CashTransfer[];
  onReportExpense: (transfer: CashTransfer) => void;
  onUpdate: (id: string, data: Partial<CashTransfer>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CashTransferList({ transfers, onReportExpense, onUpdate, onDelete }: CashTransferListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);
  const [settlementProof, setSettlementProof] = useState<{ [key: string]: string }>({});
  const [uploadingSettlement, setUploadingSettlement] = useState<string | null>(null);

  const getStatusBadge = (status: CashTransfer['status']) => {
    const statusConfig = {
      pending: { label: '⏳ Menunggu Laporan', class: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
      reported: { label: '📋 Sudah Dilaporkan', class: 'bg-blue-100 text-blue-700 border-blue-300' },
      settled: { label: '✅ Selesai', class: 'bg-green-100 text-green-700 border-green-300' },
      need_return: { label: '🔄 Perlu Pengembalian', class: 'bg-orange-100 text-orange-700 border-orange-300' },
      need_payment: { label: '💰 Perlu Pembayaran', class: 'bg-red-100 text-red-700 border-red-300' }
    };
    const config = statusConfig[status];
    return <span className={`px-3 py-1 rounded-full text-xs border ${config.class}`}>{config.label}</span>;
  };

  const handleSettlementProofUpload = async (transferId: string, file: File) => {
    setUploadingSettlement(transferId);
    try {
      const compressed = await compressImage(file);
      setSettlementProof({ ...settlementProof, [transferId]: compressed });
    } catch (error) {
      console.error('Error uploading settlement proof:', error);
      alert('Gagal mengupload bukti pengembalian/pembayaran');
    } finally {
      setUploadingSettlement(null);
    }
  };

  const handleProcessReturn = async (transfer: CashTransfer) => {
    const returnAmount = Math.abs(transfer.difference);
    
    // Validasi: wajib upload bukti
    if (!settlementProof[transfer.id]) {
      alert('⚠️ Wajib upload bukti transfer pengembalian dari karyawan!');
      return;
    }

    const confirm = window.confirm(
      `Konfirmasi Pengembalian\n\n${transfer.employeeName} akan mengembalikan Rp ${returnAmount.toLocaleString('id-ID')}.\n\nLanjutkan?`
    );

    if (!confirm) return;

    await onUpdate(transfer.id, {
      returnAmount,
      returnDate: new Date().toISOString(),
      returnProof: settlementProof[transfer.id],
      status: 'settled'
    });

    // Clear the proof after successful update
    const newProofs = { ...settlementProof };
    delete newProofs[transfer.id];
    setSettlementProof(newProofs);

    alert('✅ Pengembalian berhasil dicatat!');
  };

  const handleProcessPayment = async (transfer: CashTransfer) => {
    const additionalAmount = Math.abs(transfer.difference);
    
    // Validasi: wajib upload bukti
    if (!settlementProof[transfer.id]) {
      alert('⚠️ Wajib upload bukti transfer pembayaran tambahan ke karyawan!');
      return;
    }

    const confirm = window.confirm(
      `Konfirmasi Pembayaran Tambahan\n\nFinance akan membayar tambahan Rp ${additionalAmount.toLocaleString('id-ID')} ke ${transfer.employeeName}.\n\nLanjutkan?`
    );

    if (!confirm) return;

    await onUpdate(transfer.id, {
      additionalPayment: additionalAmount,
      additionalPaymentDate: new Date().toISOString(),
      additionalPaymentProof: settlementProof[transfer.id],
      status: 'settled'
    });

    // Clear the proof after successful update
    const newProofs = { ...settlementProof };
    delete newProofs[transfer.id];
    setSettlementProof(newProofs);

    alert('✅ Pembayaran tambahan berhasil dicatat!');
  };

  const handleDelete = async (id: string, employeeName: string) => {
    if (window.confirm(`Hapus transfer ke ${employeeName}?\n\nData ini akan dihapus permanen.`)) {
      await onDelete(id);
    }
  };

  if (transfers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="text-gray-400 mb-4">
          <FileText size={48} className="mx-auto" />
        </div>
        <p className="text-gray-600 mb-2">Belum ada transfer kas</p>
        <p className="text-sm text-gray-500">Klik tombol "Transfer Baru" untuk memulai</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transfers.map((transfer) => (
        <div key={transfer.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-gray-900">{transfer.employeeName}</h4>
                  {getStatusBadge(transfer.status)}
                  <span className={`text-xs px-2 py-1 rounded ${
                    transfer.cashType === 'big' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {transfer.cashType === 'big' ? 'Kas Besar' : 'Kas Kecil'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{transfer.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(transfer.date).toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Transfer</p>
                <p className="text-xl text-gray-900">
                  Rp {transfer.transferAmount.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-white">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Transfer</p>
                <p className="text-sm text-gray-900">Rp {transfer.transferAmount.toLocaleString('id-ID')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Pengeluaran Aktual</p>
                <p className="text-sm text-gray-900">
                  {transfer.actualExpense > 0 
                    ? `Rp ${transfer.actualExpense.toLocaleString('id-ID')}`
                    : '-'
                  }
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Selisih</p>
                <p className={`text-sm ${
                  transfer.difference === 0 ? 'text-green-600' :
                  transfer.difference > 0 ? 'text-red-600' :
                  'text-blue-600'
                }`}>
                  {transfer.difference === 0 ? 'Pas' :
                   transfer.difference > 0 ? `+Rp ${transfer.difference.toLocaleString('id-ID')}` :
                   `Rp ${transfer.difference.toLocaleString('id-ID')}`
                  }
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {transfer.status === 'pending' && (
                <button
                  onClick={() => onReportExpense(transfer)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                >
                  <FileText size={16} />
                  Lapor Pengeluaran
                </button>
              )}

              {transfer.status === 'need_return' && (
                <div className="space-y-2">
                  <div className="w-full bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-sm text-orange-800 mb-2">
                      💰 Karyawan harus mengembalikan <strong>Rp {Math.abs(transfer.difference).toLocaleString('id-ID')}</strong>
                    </p>
                    <div className="flex gap-2">
                      <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        settlementProof[transfer.id]
                          ? 'border-green-300 bg-green-50 text-green-700'
                          : 'border-orange-300 hover:border-orange-400 text-orange-700'
                      }`}>
                        {uploadingSettlement === transfer.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                        ) : (
                          <>
                            <Upload size={16} />
                            <span className="text-sm">
                              {settlementProof[transfer.id] ? '✓ Bukti Terupload' : 'Upload Bukti Transfer *'}
                            </span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleSettlementProofUpload(transfer.id, file);
                          }}
                          className="hidden"
                          disabled={uploadingSettlement === transfer.id}
                        />
                      </label>
                      {settlementProof[transfer.id] && (
                        <button
                          type="button"
                          onClick={() => setViewProofUrl(settlementProof[transfer.id])}
                          className="px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleProcessReturn(transfer)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <DollarSign size={16} />
                    Konfirmasi Pengembalian
                  </button>
                </div>
              )}

              {transfer.status === 'need_payment' && (
                <div className="space-y-2">
                  <div className="w-full bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800 mb-2">
                      💸 Finance harus bayar tambahan <strong>Rp {Math.abs(transfer.difference).toLocaleString('id-ID')}</strong> ke karyawan
                    </p>
                    <div className="flex gap-2">
                      <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        settlementProof[transfer.id]
                          ? 'border-green-300 bg-green-50 text-green-700'
                          : 'border-red-300 hover:border-red-400 text-red-700'
                      }`}>
                        {uploadingSettlement === transfer.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <>
                            <Upload size={16} />
                            <span className="text-sm">
                              {settlementProof[transfer.id] ? '✓ Bukti Terupload' : 'Upload Bukti Transfer *'}
                            </span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleSettlementProofUpload(transfer.id, file);
                          }}
                          className="hidden"
                          disabled={uploadingSettlement === transfer.id}
                        />
                      </label>
                      {settlementProof[transfer.id] && (
                        <button
                          type="button"
                          onClick={() => setViewProofUrl(settlementProof[transfer.id])}
                          className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleProcessPayment(transfer)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <DollarSign size={16} />
                    Konfirmasi Pembayaran
                  </button>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {transfer.expenseDetails.length > 0 && (
                  <button
                    onClick={() => setExpandedId(expandedId === transfer.id ? null : transfer.id)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Eye size={16} />
                    {expandedId === transfer.id ? 'Sembunyikan' : 'Lihat'} Detail ({transfer.expenseDetails.length})
                  </button>
                )}

                <button
                  onClick={() => handleDelete(transfer.id, transfer.employeeName)}
                  className="ml-auto flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                >
                  <Trash2 size={16} />
                  Hapus
                </button>
              </div>
            </div>

            {/* Expense Details (Expanded) */}
            {expandedId === transfer.id && transfer.expenseDetails.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h5 className="text-sm text-gray-700 mb-3">Detail Pengeluaran:</h5>
                <div className="space-y-3">
                  {transfer.expenseDetails.map((detail) => (
                    <div key={detail.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {detail.category}
                            </span>
                            {detail.vendor && (
                              <span className="text-xs text-gray-500">@ {detail.vendor}</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-900 mb-1">{detail.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(detail.date).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-900 mb-2">
                            Rp {detail.amount.toLocaleString('id-ID')}
                          </p>
                          {detail.proof && (
                            <button
                              onClick={() => setViewProofUrl(detail.proof)}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                            >
                              <ImageIcon size={14} />
                              Lihat Bukti
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {transfer.notes && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-600 mb-1">Catatan:</p>
                    <p className="text-sm text-blue-900">{transfer.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Settlement Info */}
            {transfer.status === 'settled' && (transfer.returnAmount || transfer.additionalPayment) && (
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                {transfer.returnAmount && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">
                          <strong className="text-green-700">Pengembalian:</strong> Rp {transfer.returnAmount.toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(transfer.returnDate!).toLocaleDateString('id-ID', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      {transfer.returnProof && (
                        <button
                          onClick={() => setViewProofUrl(transfer.returnProof!)}
                          className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {transfer.additionalPayment && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">
                          <strong className="text-blue-700">Pembayaran Tambahan:</strong> Rp {transfer.additionalPayment.toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(transfer.additionalPaymentDate!).toLocaleDateString('id-ID', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      {transfer.additionalPaymentProof && (
                        <button
                          onClick={() => setViewProofUrl(transfer.additionalPaymentProof!)}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Proof Viewer Modal */}
      {viewProofUrl && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setViewProofUrl(null)}
        >
          <div className="max-w-4xl w-full">
            <img 
              src={viewProofUrl} 
              alt="Bukti Transaksi" 
              className="w-full h-auto rounded-lg shadow-xl"
            />
            <button
              onClick={() => setViewProofUrl(null)}
              className="mt-4 w-full bg-white/20 hover:bg-white/30 text-white py-3 rounded-lg transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
