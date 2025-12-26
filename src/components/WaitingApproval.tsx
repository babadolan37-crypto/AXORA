import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Clock, AlertTriangle, LogOut } from 'lucide-react';

interface WaitingApprovalProps {
  onLogout: () => void;
  status?: string;
}

export function WaitingApproval({ onLogout, status = 'pending' }: WaitingApprovalProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
          {status === 'rejected' ? (
            <AlertTriangle className="text-red-600 w-10 h-10" />
          ) : (
            <Clock className="text-yellow-600 w-10 h-10 animate-pulse" />
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {status === 'rejected' ? 'Akses Ditolak' : 'Menunggu Persetujuan'}
        </h2>
        
        <p className="text-gray-600 mb-8">
          {status === 'rejected' 
            ? 'Maaf, permintaan bergabung Anda telah ditolak oleh Admin perusahaan.' 
            : `Akun Anda sedang ditinjau oleh Admin/Owner perusahaan. Anda akan mendapatkan akses penuh setelah disetujui${dots}`}
        </p>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-8 text-sm text-blue-800 text-left">
          <strong>Apa yang harus dilakukan?</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Hubungi Owner/Admin perusahaan Anda</li>
            <li>Minta mereka untuk menyetujui akun Anda di menu <strong>Admin & Security</strong></li>
            <li>Refresh halaman ini setelah disetujui</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Refresh Status
          </button>
          <button
            onClick={onLogout}
            className="flex-1 py-2 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
