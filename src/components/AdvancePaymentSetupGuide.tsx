import { useState } from 'react';
import { Copy, Check, X, Database } from 'lucide-react';

interface SetupStep {
  title: string;
  description: string;
  sql: string;
}

interface AdvancePaymentSetupGuideProps {
  onDismiss: () => void;
}

export function AdvancePaymentSetupGuide({ onDismiss }: AdvancePaymentSetupGuideProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const setupSteps: SetupStep[] = [
    {
      title: 'Step 1: Buat Tabel advance_payments',
      description: 'Tabel untuk menyimpan data advance payment dan settlement karyawan',
      sql: `-- Table: advance_payments
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

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_advance_payments_user_id ON advance_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_advance_payments_status ON advance_payments(status);
CREATE INDEX IF NOT EXISTS idx_advance_payments_employee ON advance_payments(employee_name);

-- RLS Policies
ALTER TABLE advance_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own advance payments"
  ON advance_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own advance payments"
  ON advance_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own advance payments"
  ON advance_payments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own advance payments"
  ON advance_payments FOR DELETE
  USING (auth.uid() = user_id);`
    },
  ];

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="text-purple-600" size={24} />
            <div>
              <h2 className="text-xl">Setup Database Advance Payment</h2>
              <p className="text-sm text-gray-600">Jalankan SQL script berikut di Supabase SQL Editor</p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-blue-900 mb-2">📋 Cara Setup:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Buka <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="underline">Supabase Dashboard</a></li>
              <li>Pilih project Babadolan Anda</li>
              <li>Klik <strong>"SQL Editor"</strong> di sidebar kiri</li>
              <li>Klik <strong>"New Query"</strong></li>
              <li>Copy & paste SQL script di bawah</li>
              <li>Klik <strong>"Run"</strong> untuk execute</li>
              <li>Refresh aplikasi Babadolan setelah selesai</li>
            </ol>
          </div>

          {/* SQL Steps */}
          {setupSteps.map((step, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-gray-900">{step.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{step.description}</p>
              </div>
              
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 overflow-x-auto text-sm">
                  <code>{step.sql}</code>
                </pre>
                <button
                  onClick={() => handleCopy(step.sql, index)}
                  className="absolute top-2 right-2 flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-sm transition-colors"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check size={16} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy SQL
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}

          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-green-900 mb-2">✅ Setelah Setup Selesai:</h3>
            <p className="text-sm text-green-800">
              Refresh halaman ini untuk mulai menggunakan fitur <strong>Advance & Reimbursement</strong>.
              Anda dapat melacak uang muka karyawan, settlement pengeluaran dengan bukti transaksi, 
              dan pengembalian dana dengan lengkap!
            </p>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={onDismiss}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
