import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, FileText, Image as ImageIcon, Calendar } from 'lucide-react';
import { CashTransfer } from '../types/cash-management';

interface SimpleCashExpenseTableProps {
  transfers: CashTransfer[];
  onDelete: (id: string) => Promise<void>;
}

export function SimpleCashExpenseTable({ transfers, onDelete }: SimpleCashExpenseTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);

  const handleDelete = async (id: string, employeeName: string) => {
    if (window.confirm(`Hapus transaksi untuk ${employeeName}?\n\nData ini akan dihapus permanen.`)) {
      await onDelete(id);
    }
  };

  if (transfers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="text-gray-400 mb-4">
          <FileText size={48} className="mx-auto" />
        </div>
        <p className="text-gray-600 mb-2">Belum ada data pengeluaran</p>
        <p className="text-sm text-gray-500">Klik tombol "Pengeluaran Langsung" untuk memulai</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                Tanggal
              </th>
              <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                Deskripsi
              </th>
              <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                Penerima
              </th>
              <th className="px-4 py-3 text-right text-xs text-gray-600 uppercase tracking-wider">
                Total Transfer
              </th>
              <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                Pengeluaran
              </th>
              <th className="px-4 py-3 text-right text-xs text-gray-600 uppercase tracking-wider">
                Saldo Akhir
              </th>
              <th className="px-4 py-3 text-center text-xs text-gray-600 uppercase tracking-wider w-20">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transfers.map((transfer) => {
              const isExpanded = expandedId === transfer.id;
              const hasDetails = transfer.expenseDetails && transfer.expenseDetails.length > 0;

              return (
                <tr key={transfer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      {new Date(transfer.date).toLocaleDateString('id-ID', { 
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="text-gray-900">{transfer.description}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        transfer.cashType === 'big' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {transfer.cashType === 'big' ? 'Kas Besar' : 'Kas Kecil'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {transfer.employeeName}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                    Rp {transfer.transferAmount.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {hasDetails ? (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : transfer.id)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        <span>{transfer.expenseDetails.length} item</span>
                      </button>
                    ) : (
                      <span className="text-gray-500 text-xs">Belum ada detail</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className={`${
                      transfer.difference === 0 ? 'text-green-600' :
                      transfer.difference > 0 ? 'text-red-600' :
                      'text-blue-600'
                    }`}>
                      Rp {(transfer.transferAmount - transfer.actualExpense).toLocaleString('id-ID')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(transfer.id, transfer.employeeName)}
                      className="text-red-600 hover:text-red-700 transition-colors p-1"
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Expanded Details */}
        {transfers.map((transfer) => {
          if (expandedId !== transfer.id || !transfer.expenseDetails || transfer.expenseDetails.length === 0) {
            return null;
          }

          return (
            <div key={`detail-${transfer.id}`} className="border-t-4 border-blue-100 bg-blue-50 p-4">
              <h4 className="text-sm text-gray-700 mb-3">Detail Pengeluaran - {transfer.employeeName}:</h4>
              <div className="bg-white rounded-lg border border-blue-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs text-blue-800 uppercase">Kategori</th>
                      <th className="px-4 py-2 text-left text-xs text-blue-800 uppercase">Deskripsi</th>
                      <th className="px-4 py-2 text-right text-xs text-blue-800 uppercase">Jumlah</th>
                      <th className="px-4 py-2 text-center text-xs text-blue-800 uppercase w-20">Bukti</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transfer.expenseDetails.map((detail, idx) => (
                      <tr key={detail.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            {detail.category}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">{detail.description}</td>
                        <td className="px-4 py-2 text-sm text-right text-gray-900">
                          Rp {detail.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {detail.proof ? (
                            <button
                              onClick={() => setViewProofUrl(detail.proof)}
                              className="text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              <ImageIcon size={16} />
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-green-50 border-t-2 border-green-200">
                      <td colSpan={2} className="px-4 py-2 text-sm text-green-900">
                        <strong>Total Pengeluaran</strong>
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-green-900">
                        <strong>Rp {transfer.actualExpense.toLocaleString('id-ID')}</strong>
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-gray-200">
        {transfers.map((transfer) => {
          const isExpanded = expandedId === transfer.id;
          const hasDetails = transfer.expenseDetails && transfer.expenseDetails.length > 0;

          return (
            <div key={transfer.id} className="p-4">
              {/* Header Info */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-gray-900">{transfer.employeeName}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded ${
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
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(transfer.id, transfer.employeeName)}
                  className="text-red-600 hover:text-red-700 transition-colors p-1"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Amount Info */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Total Transfer</p>
                  <p className="text-sm text-gray-900">
                    Rp {transfer.transferAmount.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Saldo Akhir</p>
                  <p className={`text-sm ${
                    transfer.difference === 0 ? 'text-green-600' :
                    transfer.difference > 0 ? 'text-red-600' :
                    'text-blue-600'
                  }`}>
                    Rp {(transfer.transferAmount - transfer.actualExpense).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {/* Expense Details Button */}
              {hasDetails && (
                <>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : transfer.id)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm"
                  >
                    <span>Detail Pengeluaran ({transfer.expenseDetails.length} item)</span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-3 space-y-2">
                      {transfer.expenseDetails.map((detail) => (
                        <div key={detail.id} className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                  {detail.category}
                                </span>
                              </div>
                              <p className="text-sm text-gray-900">{detail.description}</p>
                            </div>
                            <div className="text-right ml-3">
                              <p className="text-sm text-gray-900 mb-1">
                                Rp {detail.amount.toLocaleString('id-ID')}
                              </p>
                              {detail.proof && (
                                <button
                                  onClick={() => setViewProofUrl(detail.proof)}
                                  className="text-xs text-blue-600 flex items-center gap-1"
                                >
                                  <ImageIcon size={12} />
                                  Bukti
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-900">Total Pengeluaran</span>
                          <span className="text-sm text-green-900">
                            Rp {transfer.actualExpense.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

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
