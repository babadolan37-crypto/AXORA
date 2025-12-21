import { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, Target, AlertCircle, Calendar, Trash2, Edit2, X } from 'lucide-react';
import { useBudget } from '../hooks/useBudget';
import { Budget, BudgetActual } from '../types/budget';
import { IncomeEntry, ExpenseEntry } from '../types/accounting';
import { toast } from 'sonner';

interface BudgetSheetProps {
  incomeEntries: IncomeEntry[];
  expenseEntries: ExpenseEntry[];
  expenseCategories: string[];
  incomeSources: string[];
}

export function BudgetSheet({
  incomeEntries,
  expenseEntries,
  expenseCategories,
  incomeSources,
}: BudgetSheetProps) {
  const budgetHook = useBudget(incomeEntries, expenseEntries);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    category: '',
    amount: '',
    notes: '',
  });

  const summary = budgetHook.getBudgetSummary(selectedMonth);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: BudgetActual['status']) => {
    switch (status) {
      case 'under':
        return 'text-amber-600 bg-amber-100';
      case 'on-track':
        return 'text-green-600 bg-green-100';
      case 'over':
        return 'text-red-600 bg-red-100';
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      type: 'expense',
      category: '',
      amount: '',
      notes: '',
    });
    setEditingBudget(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (budget: Budget) => {
    setFormData({
      type: budget.type,
      category: budget.category,
      amount: budget.amount.toString(),
      notes: budget.notes || '',
    });
    setEditingBudget(budget);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category || !formData.amount) {
      toast.error('Kategori dan nominal wajib diisi!');
      return;
    }

    try {
      if (editingBudget) {
        await budgetHook.updateBudget(editingBudget.id, {
          category: formData.category,
          amount: parseFloat(formData.amount),
          notes: formData.notes,
        });
        toast.success('Budget berhasil diupdate!');
      } else {
        await budgetHook.addBudget({
          type: formData.type,
          category: formData.category,
          month: selectedMonth,
          amount: parseFloat(formData.amount),
          notes: formData.notes,
        });
        toast.success('Budget berhasil ditambahkan!');
      }
      setShowAddModal(false);
      setFormData({ type: 'expense', category: '', amount: '', notes: '' });
    } catch (error) {
      toast.error('Gagal menyimpan budget');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus budget ini?')) return;

    try {
      await budgetHook.deleteBudget(id);
      toast.success('Budget berhasil dihapus!');
    } catch (error) {
      toast.error('Gagal menghapus budget');
    }
  };

  const categories = formData.type === 'income' ? incomeSources : expenseCategories;
  const monthBudgets = budgetHook.budgets.filter((b) => b.month === selectedMonth);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl text-gray-900">Budgeting & Anggaran</h2>
          <p className="text-sm text-gray-600 mt-1">
            Kelola anggaran dan tracking budget vs actual
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Tambah Budget
        </button>
      </div>

      {/* Month Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Calendar size={20} className="text-gray-600" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Income Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Pemasukan</p>
              <p className="text-2xl text-gray-900">{formatCurrency(summary.totalActualIncome)}</p>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Target</span>
              <span className="text-gray-900">{formatCurrency(summary.totalBudgetIncome)}</span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    (summary.totalActualIncome / (summary.totalBudgetIncome || 1)) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Expense Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-100 p-3 rounded-lg">
              <TrendingDown size={24} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Pengeluaran</p>
              <p className="text-2xl text-gray-900">{formatCurrency(summary.totalActualExpense)}</p>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Budget</span>
              <span className="text-gray-900">{formatCurrency(summary.totalBudgetExpense)}</span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  summary.totalActualExpense > summary.totalBudgetExpense
                    ? 'bg-red-600'
                    : 'bg-blue-600'
                }`}
                style={{
                  width: `${Math.min(
                    (summary.totalActualExpense / (summary.totalBudgetExpense || 1)) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Budget vs Actual by Category */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-gray-900">Budget vs Actual per Kategori</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm text-gray-700">Kategori</th>
                <th className="text-right px-6 py-3 text-sm text-gray-700">Budget</th>
                <th className="text-right px-6 py-3 text-sm text-gray-700">Actual</th>
                <th className="text-right px-6 py-3 text-sm text-gray-700">Variance</th>
                <th className="text-center px-6 py-3 text-sm text-gray-700">Status</th>
                <th className="text-center px-6 py-3 text-sm text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {summary.categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Belum ada budget untuk bulan ini
                  </td>
                </tr>
              ) : (
                summary.categories.map((item) => {
                  const budget = monthBudgets.find((b) => b.category === item.category);
                  return (
                    <tr key={item.category} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{item.category}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">
                        {formatCurrency(item.budgeted)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">
                        {formatCurrency(item.actual)}
                      </td>
                      <td
                        className={`px-6 py-4 text-sm text-right ${
                          item.variance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {item.variance >= 0 ? '+' : ''}
                        {formatCurrency(item.variance)} ({item.variancePercent.toFixed(1)}%)
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {item.status === 'under' && 'Under Budget'}
                          {item.status === 'on-track' && 'On Track'}
                          {item.status === 'over' && 'Over Budget'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {budget && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(budget)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(budget.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warning for over budget */}
      {summary.categories.some((c) => c.status === 'over') && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm text-amber-900">
              Ada {summary.categories.filter((c) => c.status === 'over').length} kategori yang
              melebihi budget!
            </p>
          </div>
        </div>
      )}

      {/* Add/Edit Budget Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl text-gray-900">
                {editingBudget ? 'Edit Budget' : 'Tambah Budget'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type */}
              {!editingBudget && (
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Tipe</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="expense">Pengeluaran</option>
                    <option value="income">Pemasukan</option>
                  </select>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Kategori *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Pilih kategori</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Nominal Budget *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0"
                  required
                  min="0"
                  step="1000"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Catatan</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Catatan tambahan (opsional)"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingBudget ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}