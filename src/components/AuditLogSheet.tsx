import { useState, useEffect } from 'react';
import { X, Filter, Calendar, User, FileText } from 'lucide-react';
import { useAuditLog } from '../hooks/useAuditLog';
import { AuditAction, AuditEntityType } from '../types/audit-log';

interface AuditLogSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuditLogSheet({ isOpen, onClose }: AuditLogSheetProps) {
  const { logs, loading, loadLogs } = useAuditLog();
  const [filterAction, setFilterAction] = useState<AuditAction | ''>('');
  const [filterEntityType, setFilterEntityType] = useState<AuditEntityType | ''>('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  const handleFilter = () => {
    const filter: any = {};
    if (filterAction) filter.action = filterAction;
    if (filterEntityType) filter.entityType = filterEntityType;
    if (filterStartDate) filter.startDate = filterStartDate;
    if (filterEndDate) filter.endDate = filterEndDate;
    
    loadLogs(filter);
  };

  const handleClearFilter = () => {
    setFilterAction('');
    setFilterEntityType('');
    setFilterStartDate('');
    setFilterEndDate('');
    loadLogs();
  };

  const getActionLabel = (action: AuditAction) => {
    const labels: Record<AuditAction, string> = {
      create: 'Buat',
      update: 'Update',
      delete: 'Hapus',
      transfer: 'Transfer',
      approve: 'Setujui',
      reject: 'Tolak',
      assign: 'Assign',
      submit: 'Submit'
    };
    return labels[action] || action;
  };

  const getEntityLabel = (entityType: AuditEntityType) => {
    const labels: Record<AuditEntityType, string> = {
      income: 'Pemasukan',
      expense: 'Pengeluaran',
      debt: 'Utang/Piutang',
      cash_transaction: 'Transaksi Kas',
      cash_transfer: 'Transfer Kas',
      expense_assignment: 'Assignment Pengeluaran',
      scheduled_transfer: 'Transfer Terjadwal'
    };
    return labels[entityType] || entityType;
  };

  const getActionColor = (action: AuditAction) => {
    const colors: Record<AuditAction, string> = {
      create: 'bg-green-100 text-green-800',
      update: 'bg-blue-100 text-blue-800',
      delete: 'bg-red-100 text-red-800',
      transfer: 'bg-purple-100 text-purple-800',
      approve: 'bg-emerald-100 text-emerald-800',
      reject: 'bg-orange-100 text-orange-800',
      assign: 'bg-indigo-100 text-indigo-800',
      submit: 'bg-cyan-100 text-cyan-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-3xl sm:rounded-t-2xl">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl">Audit Log</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm mb-2">Action</label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value as AuditAction | '')}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Semua</option>
                <option value="create">Buat</option>
                <option value="update">Update</option>
                <option value="delete">Hapus</option>
                <option value="transfer">Transfer</option>
                <option value="approve">Setujui</option>
                <option value="reject">Tolak</option>
                <option value="assign">Assign</option>
                <option value="submit">Submit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2">Tipe</label>
              <select
                value={filterEntityType}
                onChange={(e) => setFilterEntityType(e.target.value as AuditEntityType | '')}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Semua</option>
                <option value="income">Pemasukan</option>
                <option value="expense">Pengeluaran</option>
                <option value="debt">Utang/Piutang</option>
                <option value="cash_transaction">Transaksi Kas</option>
                <option value="cash_transfer">Transfer Kas</option>
                <option value="expense_assignment">Assignment</option>
                <option value="scheduled_transfer">Transfer Terjadwal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2">Dari Tanggal</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Sampai Tanggal</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleFilter}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button
              onClick={handleClearFilter}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada log</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${getActionColor(log.action)}`}>
                        {getActionLabel(log.action)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {getEntityLabel(log.entityType)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">
                      {log.userName} <span className="text-gray-500">({log.userRole})</span>
                    </span>
                  </div>

                  <p className="text-sm text-gray-700">{log.description}</p>

                  {(log.oldValue || log.newValue) && (
                    <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
                      {log.oldValue && (
                        <div className="mb-2">
                          <span className="text-gray-500">Before:</span>
                          <pre className="mt-1 text-gray-700 overflow-x-auto">
                            {JSON.stringify(log.oldValue, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.newValue && (
                        <div>
                          <span className="text-gray-500">After:</span>
                          <pre className="mt-1 text-gray-700 overflow-x-auto">
                            {JSON.stringify(log.newValue, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
