import React from 'react';
import { AlertTriangle, Database, ExternalLink, CheckCircle, Copy } from 'lucide-react';

interface SupabaseSetupGuideProps {
  onDismiss?: () => void;
}

export function SupabaseSetupGuide({ onDismiss }: SupabaseSetupGuideProps) {
  const [copiedStep, setCopiedStep] = React.useState<number | null>(null);
  const sqlTextareaRef = React.useRef<HTMLTextAreaElement>(null);

  const sqlCode = `-- BABADOLAN Database Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABEL 1: user_settings
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  income_sources JSONB DEFAULT '["Penjualan Produk", "Penjualan Jasa", "Pemasukan Investasi", "Pembayaran Piutang", "Lainnya"]'::jsonb,
  expense_categories JSONB DEFAULT '["Gaji Karyawan", "Sewa", "Bahan Baku", "Listrik", "Air", "Internet & Telekomunikasi", "Transportasi", "Peralatan Kantor", "Marketing", "Pajak", "Lainnya"]'::jsonb,
  payment_methods JSONB DEFAULT '["Tunai", "Transfer Bank", "Cek", "Kartu Kredit", "E-Wallet"]'::jsonb,
  employees JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABEL 2: income_entries
CREATE TABLE IF NOT EXISTS income_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  source TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount NUMERIC(20, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  notes TEXT DEFAULT '',
  photos JSONB DEFAULT '[]'::jsonb,
  received_from TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABEL 3: expense_entries
CREATE TABLE IF NOT EXISTS expense_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount NUMERIC(20, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  notes TEXT DEFAULT '',
  photos JSONB DEFAULT '[]'::jsonb,
  paid_to TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABEL 4: debt_entries
CREATE TABLE IF NOT EXISTS debt_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('piutang', 'hutang')),
  date DATE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount NUMERIC(20, 2) NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'belum lunas' CHECK (status IN ('belum lunas', 'lunas')),
  payment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can view own income" ON income_entries;
DROP POLICY IF EXISTS "Users can insert own income" ON income_entries;
DROP POLICY IF EXISTS "Users can update own income" ON income_entries;
DROP POLICY IF EXISTS "Users can delete own income" ON income_entries;
DROP POLICY IF EXISTS "Users can view own expenses" ON expense_entries;
DROP POLICY IF EXISTS "Users can insert own expenses" ON expense_entries;
DROP POLICY IF EXISTS "Users can update own expenses" ON expense_entries;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expense_entries;
DROP POLICY IF EXISTS "Users can view own debts" ON debt_entries;
DROP POLICY IF EXISTS "Users can insert own debts" ON debt_entries;
DROP POLICY IF EXISTS "Users can update own debts" ON debt_entries;
DROP POLICY IF EXISTS "Users can delete own debts" ON debt_entries;

-- Policies: user_settings
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own settings" ON user_settings FOR DELETE USING (auth.uid() = user_id);

-- Policies: income_entries
CREATE POLICY "Users can view own income" ON income_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own income" ON income_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own income" ON income_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own income" ON income_entries FOR DELETE USING (auth.uid() = user_id);

-- Policies: expense_entries
CREATE POLICY "Users can view own expenses" ON expense_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON expense_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON expense_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON expense_entries FOR DELETE USING (auth.uid() = user_id);

-- Policies: debt_entries
CREATE POLICY "Users can view own debts" ON debt_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own debts" ON debt_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own debts" ON debt_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own debts" ON debt_entries FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_income_user_date ON income_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expense_user_date ON expense_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_debt_user_type ON debt_entries(user_id, type);
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);`;

  const copyToClipboard = (text: string, step: number) => {
    // Fallback copy method yang tidak butuh Clipboard API permissions
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    
    try {
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
      const successful = document.execCommand('copy');
      
      if (successful) {
        setCopiedStep(step);
        setTimeout(() => setCopiedStep(null), 2000);
      } else {
        // Jika gagal, select text agar user bisa copy manual
        selectSqlText();
      }
    } catch (err) {
      console.error('Copy failed:', err);
      // Jika gagal, select text agar user bisa copy manual
      selectSqlText();
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const selectSqlText = () => {
    if (sqlTextareaRef.current) {
      sqlTextareaRef.current.select();
      sqlTextareaRef.current.setSelectionRange(0, sqlTextareaRef.current.value.length);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6 rounded-t-xl">
          <div className="flex items-start gap-4">
            <AlertTriangle size={32} className="flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl mb-2">⚠️ Database Belum Di-Setup!</h2>
              <p className="text-red-100">
                Tabel Supabase belum dibuat. Ikuti 4 langkah mudah di bawah untuk setup (5 menit).
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Step 1 */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="flex items-center gap-2 text-lg mb-2">
              <span className="bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">1</span>
              Buka Supabase Dashboard
            </h3>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <ExternalLink size={18} />
              Buka Supabase Dashboard
            </a>
          </div>

          {/* Step 2 */}
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="flex items-center gap-2 text-lg mb-2">
              <span className="bg-green-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">2</span>
              Buka SQL Editor
            </h3>
            <p className="text-gray-600 text-sm mb-2">
              Di sidebar kiri, klik <strong>"SQL Editor"</strong> → klik <strong>"+ New Query"</strong>
            </p>
            <div className="bg-gray-100 p-3 rounded-lg text-sm">
              <code>Sidebar → ⚡ SQL Editor → + New Query</code>
            </div>
          </div>

          {/* Step 3 */}
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="flex items-center gap-2 text-lg mb-2">
              <span className="bg-purple-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">3</span>
              Copy & Paste SQL
            </h3>
            <p className="text-gray-600 text-sm mb-2">
              Klik tombol "Copy SQL" di bawah, atau klik di dalam kotak SQL dan tekan Ctrl+A → Ctrl+C
            </p>
            <div className="relative">
              <textarea
                ref={sqlTextareaRef}
                value={sqlCode}
                readOnly
                onClick={selectSqlText}
                className="w-full bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs h-64 font-mono resize-none"
              />
              <button
                onClick={() => copyToClipboard(sqlCode, 3)}
                className="absolute top-2 right-2 bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm shadow-lg"
              >
                {copiedStep === 3 ? (
                  <>
                    <CheckCircle size={16} />
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
            <p className="text-xs text-gray-500 mt-2">
              💡 Tips: Jika tombol Copy tidak bekerja, klik di kotak SQL → tekan Ctrl+A (pilih semua) → Ctrl+C (copy)
            </p>
          </div>

          {/* Step 4 */}
          <div className="border-l-4 border-orange-500 pl-4">
            <h3 className="flex items-center gap-2 text-lg mb-2">
              <span className="bg-orange-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">4</span>
              Run SQL & Verify
            </h3>
            <ol className="text-gray-600 text-sm space-y-2 list-decimal list-inside">
              <li>Paste SQL di editor Supabase</li>
              <li>Klik tombol <strong>"RUN"</strong> di pojok kanan bawah</li>
              <li>Tunggu 2-3 detik sampai selesai</li>
              <li>Klik <strong>"Table Editor"</strong> → verify 4 tabel muncul:
                <ul className="ml-6 mt-1 space-y-1">
                  <li className="flex items-center gap-2">
                    <Database size={14} className="text-green-600" />
                    <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">user_settings</code>
                  </li>
                  <li className="flex items-center gap-2">
                    <Database size={14} className="text-green-600" />
                    <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">income_entries</code>
                  </li>
                  <li className="flex items-center gap-2">
                    <Database size={14} className="text-green-600" />
                    <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">expense_entries</code>
                  </li>
                  <li className="flex items-center gap-2">
                    <Database size={14} className="text-green-600" />
                    <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">debt_entries</code>
                  </li>
                </ul>
              </li>
              <li><strong>Refresh aplikasi ini</strong> (tekan F5)</li>
              <li>Coba tambah pemasukan/pengeluaran → <strong>Berhasil!</strong> ✅</li>
            </ol>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="flex items-center gap-2 mb-2 text-blue-900">
              <Database size={18} />
              Apa yang dibuat?
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✅ 4 tabel database untuk menyimpan data</li>
              <li>✅ Row Level Security (RLS) - data terpisah per user</li>
              <li>✅ Indexes untuk query cepat</li>
              <li>✅ Policies untuk keamanan data</li>
            </ul>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>PENTING:</strong> Setup ini hanya perlu dilakukan <strong>1 kali saja</strong>. 
              Setelah tabel dibuat, aplikasi akan langsung bisa menyimpan data ke Supabase.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 rounded-b-xl flex justify-end gap-3">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <ExternalLink size={18} />
            Buka Supabase Sekarang
          </a>
        </div>
      </div>
    </div>
  );
}