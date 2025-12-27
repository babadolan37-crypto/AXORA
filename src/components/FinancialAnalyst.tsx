import React, { useState } from 'react';
import { Sparkles, X, Loader2, TrendingUp, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface FinancialAnalystProps {
  summary: {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    expenseCount: number;
    topExpenseCategory?: string;
  };
}

export function FinancialAnalyst({ summary }: FinancialAnalystProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze');
      }

      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menganalisis');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button 
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-full shadow-xl hover:bg-indigo-700 transition-all hover:scale-105"
        >
          <Sparkles size={20} className="animate-pulse" />
          <span className="font-semibold">AI Analyst</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-indigo-700">
            <Sparkles size={24} />
            Analisis Keuangan Cerdas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
              <p className="text-xs text-green-600 uppercase font-bold">Pemasukan</p>
              <p className="text-lg font-bold text-green-700">Rp {summary.totalIncome.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg border border-red-100">
              <p className="text-xs text-red-600 uppercase font-bold">Pengeluaran</p>
              <p className="text-lg font-bold text-red-700">Rp {summary.totalExpense.toLocaleString('id-ID')}</p>
            </div>
          </div>

          {!analysis && !isLoading && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                AI akan menganalisis data keuangan Anda dan memberikan rekomendasi strategis untuk meningkatkan profit.
              </p>
              <button
                onClick={handleAnalyze}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Mulai Analisis Sekarang
              </button>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-indigo-600">
              <Loader2 size={40} className="animate-spin mb-4" />
              <p className="animate-pulse font-medium">Sedang berpikir...</p>
              <p className="text-xs text-gray-400 mt-2">Menganalisis tren pemasukan & pengeluaran</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
              <AlertTriangle size={20} />
              <p>{error}</p>
            </div>
          )}

          {analysis && (
            <div className="bg-white rounded-xl border border-indigo-100 p-5 shadow-sm">
              <div className="prose prose-indigo max-w-none text-gray-700">
                {analysis.split('\n').map((line, i) => {
                  // Simple formatting for markdown-like output
                  if (line.startsWith('**')) return <h4 key={i} className="font-bold text-gray-900 mt-4 mb-2">{line.replace(/\*\*/g, '')}</h4>;
                  if (line.startsWith('-')) return <li key={i} className="ml-4 list-disc">{line.replace('-', '')}</li>;
                  return <p key={i} className="mb-2 leading-relaxed">{line}</p>;
                })}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={handleAnalyze} 
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                >
                  <TrendingUp size={16} />
                  Analisis Ulang
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
