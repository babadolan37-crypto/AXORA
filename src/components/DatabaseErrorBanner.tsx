import { useState } from 'react';
import { AlertCircle, Database, Copy, Check, ExternalLink } from 'lucide-react';

interface DatabaseErrorBannerProps {
  onShowSetupGuide: () => void;
}

export function DatabaseErrorBanner({ onShowSetupGuide }: DatabaseErrorBannerProps) {
  const [copied, setCopied] = useState(false);

  const quickFixSQL = `-- Quick Fix: Create advance_payments table
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS advance_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  employee_name TEXT NOT NULL,
  advance_amount NUMERIC NOT NULL,
  advance_date DATE NOT NULL,
  cash_type TEXT NOT NULL CHECK (cash_type IN ('big', 'small')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'settled', 'returned')),
  actual_expenses NUMERIC DEFAULT 0,
  expense_items JSONB DEFAULT '[]'::jsonb,
  settlement_date DATE,
  difference NUMERIC DEFAULT 0,
  return_date DATE,
  return_amount NUMERIC,
  return_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advance_payments_user_id ON advance_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_advance_payments_status ON advance_payments(status);
CREATE INDEX IF NOT EXISTS idx_advance_payments_employee ON advance_payments(employee_name);

ALTER TABLE advance_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own advance payments" ON advance_payments;
CREATE POLICY "Users can view their own advance payments"
  ON advance_payments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own advance payments" ON advance_payments;
CREATE POLICY "Users can insert their own advance payments"
  ON advance_payments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own advance payments" ON advance_payments;
CREATE POLICY "Users can update their own advance payments"
  ON advance_payments FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own advance payments" ON advance_payments;
CREATE POLICY "Users can delete their own advance payments"
  ON advance_payments FOR DELETE USING (auth.uid() = user_id);`;

  const handleCopySQL = async () => {
    try {
      await navigator.clipboard.writeText(quickFixSQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Gagal copy. Silakan copy manual dari panduan setup.');
    }
  };

  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-xl p-6 shadow-lg">
      <div className="flex items-start gap-4">
        <div className="bg-red-100 p-3 rounded-lg flex-shrink-0">
          <AlertCircle className="text-red-600" size={32} />
        </div>

        <div className="flex-1">
          <h3 className="text-xl text-red-900 mb-2">⚠️ Database Belum Di-Setup!</h3>
          
          <p className="text-red-800 mb-4">
            Tabel <code className="bg-red-200 px-2 py-1 rounded">advance_payments</code> belum dibuat di Supabase. 
            Fitur Advance & Reimbursement tidak bisa digunakan sampai tabel dibuat.
          </p>

          <div className="bg-white border border-red-200 rounded-lg p-4 mb-4">
            <h4 className="text-sm text-red-900 mb-3 flex items-center gap-2">
              <Database size={18} />
              Quick Setup (30 Detik):
            </h4>
            
            <ol className="text-sm text-gray-800 space-y-2 list-decimal list-inside mb-4">
              <li>
                Buka{' '}
                <a 
                  href="https://app.supabase.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
                >
                  Supabase Dashboard
                  <ExternalLink size={14} />
                </a>
              </li>
              <li>Klik <strong>"SQL Editor"</strong> → <strong>"New Query"</strong></li>
              <li>Copy SQL script (klik tombol di bawah)</li>
              <li>Paste ke SQL Editor & klik <strong>"Run"</strong></li>
              <li><strong>Refresh halaman ini</strong> (Ctrl+Shift+R)</li>
            </ol>

            <div className="flex gap-2">
              <button
                onClick={handleCopySQL}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm shadow-md"
              >
                {copied ? (
                  <>
                    <Check size={18} />
                    SQL Copied!
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    Copy SQL Script
                  </>
                )}
              </button>

              <button
                onClick={onShowSetupGuide}
                className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm"
              >
                <Database size={18} />
                Panduan Lengkap
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
            <p className="text-xs text-yellow-900">
              💡 <strong>Tip:</strong> Setelah run SQL, jangan lupa <strong>Hard Refresh</strong> halaman ini 
              (Windows: Ctrl+Shift+R, Mac: Cmd+Shift+R) agar aplikasi mendeteksi tabel baru.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
