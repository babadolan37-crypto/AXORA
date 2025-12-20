import { History, Search } from 'lucide-react';

export function AuditSheet() {
  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-2xl text-gray-900">Audit Log</h2>
        <p className="text-sm text-gray-600 mt-1">Track semua perubahan data dan aktivitas user</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari audit log..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-sm text-gray-700">Timestamp</th>
              <th className="text-left px-6 py-3 text-sm text-gray-700">User</th>
              <th className="text-left px-6 py-3 text-sm text-gray-700">Action</th>
              <th className="text-left px-6 py-3 text-sm text-gray-700">Resource</th>
              <th className="text-left px-6 py-3 text-sm text-gray-700">Changes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center">
                <History size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500">Audit log akan muncul di sini</p>
                <p className="text-xs text-gray-400 mt-1">
                  Tracking: Create, Update, Delete, Approve, Export
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          💡 <strong>Fitur:</strong> Siapa edit/hapus transaksi apa kapan, Export audit trail, Filter by user/action/date
        </p>
      </div>
    </div>
  );
}
