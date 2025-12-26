import { useState, useRef } from 'react';
import { useChat } from 'ai/react';
import { Sparkles, Send, X, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface AIAnalystProps {
  incomeEntries: any[];
  expenseEntries: any[];
}

export function AIAnalyst({ incomeEntries, expenseEntries }: AIAnalystProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Calculate summary for context
  const totalIncome = incomeEntries.reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = expenseEntries.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalIncome - totalExpense;
  const expenseCount = expenseEntries.length;
  
  // Prepare initial context message
  const contextMessage = `Saya adalah asisten keuangan AI Axora. 
  Data saat ini:
  - Total Pemasukan: Rp ${totalIncome.toLocaleString('id-ID')}
  - Total Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}
  - Laba Bersih: Rp ${netProfit.toLocaleString('id-ID')}
  - Jumlah Transaksi Pengeluaran: ${expenseCount}
  
  Analisa tren pengeluaran dan berikan saran penghematan.`;

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: '1',
        role: 'system',
        content: `Anda adalah analis keuangan profesional untuk Axora. Tugas Anda adalah memberikan insight singkat, padat, dan actionable berdasarkan data keuangan. 
        Gunakan bahasa Indonesia yang formal namun ramah. 
        Fokus pada: 
        1. Anomali pengeluaran 
        2. Peluang penghematan 
        3. Prediksi arus kas jangka pendek.`
      },
      {
        id: '2',
        role: 'user',
        content: contextMessage
      }
    ]
  });

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-105"
      >
        <Sparkles size={20} />
        <span className="font-medium">AI Analyst</span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in">
          {/* Header */}
          <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <h3 className="font-semibold">Axora AI Analyst</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-500 p-1 rounded">
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.filter(m => m.role !== 'system').map(m => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 text-sm ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  {m.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1 text-indigo-600 font-medium text-xs">
                      <Sparkles size={12} />
                      AI Insight
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75" />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Tanya tentang keuangan Anda..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
