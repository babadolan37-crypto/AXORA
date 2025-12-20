import { useState } from 'react';
import { FileText, Calendar, Shield } from 'lucide-react';
import { AuditLogSheet } from './AuditLogSheet';
import { ScheduledTransferSheet } from './ScheduledTransferSheet';

export function AdvancedFeaturesSection() {
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showScheduledTransfer, setShowScheduledTransfer] = useState(false);

  return (
    <>
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center gap-3 text-white">
            <Shield size={24} />
            <h3 className="text-lg">Fitur Advanced</h3>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-700 mb-4">
            Fitur-fitur advanced untuk manajemen keuangan yang lebih professional
          </p>

          {/* Audit Log */}
          <button
            onClick={() => setShowAuditLog(true)}
            className="w-full bg-white border-2 border-purple-200 hover:border-purple-400 rounded-lg p-4 flex items-start gap-4 transition-all hover:shadow-md"
          >
            <div className="bg-purple-100 p-3 rounded-lg flex-shrink-0">
              <FileText className="text-purple-600" size={24} />
            </div>
            <div className="flex-1 text-left">
              <h4 className="text-gray-900 mb-1">Audit Log</h4>
              <p className="text-sm text-gray-600">
                Lihat riwayat lengkap semua aktivitas dan perubahan data yang dilakukan user
              </p>
            </div>
          </button>

          {/* Scheduled Transfers */}
          <button
            onClick={() => setShowScheduledTransfer(true)}
            className="w-full bg-white border-2 border-blue-200 hover:border-blue-400 rounded-lg p-4 flex items-start gap-4 transition-all hover:shadow-md"
          >
            <div className="bg-blue-100 p-3 rounded-lg flex-shrink-0">
              <Calendar className="text-blue-600" size={24} />
            </div>
            <div className="flex-1 text-left">
              <h4 className="text-gray-900 mb-1">Transfer Terjadwal</h4>
              <p className="text-sm text-gray-600">
                Atur transfer otomatis mingguan atau bulanan dari Kas Besar ke Kas Kecil
              </p>
            </div>
          </button>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-blue-800">
              <strong>ℹ️ Info:</strong> Pastikan Anda sudah menjalankan SQL setup untuk fitur-fitur ini. 
              Lihat file <code className="bg-blue-100 px-1 rounded">SQL_SETUP_ADVANCED_FEATURES.md</code> untuk instruksi lengkap.
            </p>
          </div>
        </div>
      </div>

      {/* Sheets */}
      <AuditLogSheet
        isOpen={showAuditLog}
        onClose={() => setShowAuditLog(false)}
      />

      <ScheduledTransferSheet
        isOpen={showScheduledTransfer}
        onClose={() => setShowScheduledTransfer(false)}
      />
    </>
  );
}
