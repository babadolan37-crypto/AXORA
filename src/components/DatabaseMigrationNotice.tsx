import React, { useState } from 'react';
import { AlertTriangle, Database, Copy, CheckCircle } from 'lucide-react';

interface DatabaseMigrationNoticeProps {
  onDismiss: () => void;
}

export function DatabaseMigrationNotice({ onDismiss }: DatabaseMigrationNoticeProps) {
  const [copied, setCopied] = useState(false);

  const migrationSQL = `-- Tambah kolom cash_type ke tabel income_entries dan expense_entries
-- Jalankan di Supabase SQL Editor

ALTER TABLE income_entries 
ADD COLUMN IF NOT EXISTS cash_type TEXT DEFAULT 'big' CHECK (cash_type IN ('big', 'small'));

ALTER TABLE expense_entries 
ADD COLUMN IF NOT EXISTS cash_type TEXT DEFAULT 'big' CHECK (cash_type IN ('big', 'small'));`;

  const copyToClipboard = () => {
    const textarea = document.createElement('textarea');
    textarea.value = migrationSQL;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    
    try {
      textarea.select();
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    } finally {
      document.body.removeChild(textarea);
    }
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-2xl p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle size={32} className="flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-xl mb-2">🔧 Database Update Required!</h3>
            <p className="text-sm text-orange-100 mb-4">
              Fitur <strong>Jenis Kas (Kas Besar/Kecil)</strong> membutuhkan update database. 
              Jalankan SQL di bawah untuk menambahkan kolom <code className="bg-white/20 px-1 rounded">cash_type</code>.
            </p>

            <div className="bg-black/20 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-orange-100">Migration SQL</span>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle size={14} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copy SQL
                    </>
                  )}
                </button>
              </div>
              <pre className="text-xs text-white overflow-x-auto whitespace-pre-wrap">
                {migrationSQL}
              </pre>
            </div>

            <div className="space-y-2 text-sm">
              <p className="font-semibold">📋 Langkah-langkah:</p>
              <ol className="list-decimal list-inside space-y-1 text-orange-100">
                <li>Klik "Copy SQL" di atas</li>
                <li>Buka <strong>Supabase Dashboard → SQL Editor</strong></li>
                <li>Paste SQL dan klik <strong>RUN</strong></li>
                <li>Refresh aplikasi ini (F5)</li>
              </ol>
            </div>

            <div className="flex gap-2 mt-4">
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-white text-orange-600 px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors text-center font-medium text-sm"
              >
                <Database size={16} className="inline mr-2" />
                Buka Supabase
              </a>
              <button
                onClick={onDismiss}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
