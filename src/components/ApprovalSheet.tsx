import { CheckSquare, Clock, CheckCircle, XCircle, Plus, X, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface ApprovalRequest {
  id: string;
  userId: string;
  transactionType: 'income' | 'expense';
  transactionData: any;
  amount: number;
  category: string;
  description: string;
  requestedBy: string;
  requestedAt: string;
  currentLevel: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvalHistory: Array<{
    level: string;
    approver: string;
    action: 'approved' | 'rejected';
    timestamp: string;
    notes: string;
  }>;
}

interface ApprovalRule {
  id: string;
  name: string;
  transactionType: 'income' | 'expense' | 'both';
  minAmount: number;
  maxAmount: number | null;
  requiresApproval: boolean;
  approvalLevels: string[];
  categoryFilter: string[] | null;
  active: boolean;
}

export function ApprovalSheet() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [rules, setRules] = useState<ApprovalRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const [ruleForm, setRuleForm] = useState({
    name: '',
    transactionType: 'both' as 'income' | 'expense' | 'both',
    minAmount: '',
    maxAmount: '',
    approvalLevels: ['manager'] as string[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch approval requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('userId', user.id)
        .order('requestedAt', { ascending: false });

      if (requestsError) {
        if (requestsError.code === 'PGRST205' || requestsError.message.includes('Could not find the table')) {
          setRequests([]);
        } else {
          throw requestsError;
        }
      } else {
        setRequests(requestsData || []);
      }

      // Fetch approval rules
      const { data: rulesData, error: rulesError } = await supabase
        .from('approval_rules')
        .select('*')
        .eq('userId', user.id)
        .eq('active', true);

      if (rulesError) {
        if (rulesError.code === 'PGRST205' || rulesError.message.includes('Could not find the table')) {
          setRules([]);
        } else {
          throw rulesError;
        }
      } else {
        setRules(rulesData || []);
      }
    } catch (error) {
      console.error('Error fetching approval data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ruleForm.name || !ruleForm.minAmount) {
      toast.error('Nama rule dan minimal amount wajib diisi!');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('approval_rules').insert({
        userId: user.id,
        name: ruleForm.name,
        transactionType: ruleForm.transactionType,
        minAmount: parseFloat(ruleForm.minAmount),
        maxAmount: ruleForm.maxAmount ? parseFloat(ruleForm.maxAmount) : null,
        requiresApproval: true,
        approvalLevels: ruleForm.approvalLevels,
        categoryFilter: null,
        active: true,
      });

      if (error) throw error;

      toast.success('Approval rule berhasil dibuat!');
      setShowRuleModal(false);
      setRuleForm({
        name: '',
        transactionType: 'both',
        minAmount: '',
        maxAmount: '',
        approvalLevels: ['manager'],
      });
      fetchData();
    } catch (error) {
      toast.error('Gagal membuat approval rule');
    }
  };

  const handleApprove = async (request: ApprovalRequest) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newHistory = [
        ...request.approvalHistory,
        {
          level: request.currentLevel,
          approver: user.email || 'Unknown',
          action: 'approved' as const,
          timestamp: new Date().toISOString(),
          notes: 'Approved',
        },
      ];

      // Simple approval - just mark as approved
      const { error } = await supabase
        .from('approval_requests')
        .update({
          status: 'approved',
          approvalHistory: newHistory,
          finalApprovedAt: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (error) throw error;

      toast.success('Request berhasil di-approve!');
      fetchData();
    } catch (error) {
      toast.error('Gagal approve request');
    }
  };

  const handleReject = async (request: ApprovalRequest) => {
    const notes = prompt('Alasan reject (opsional):');
    if (notes === null) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newHistory = [
        ...request.approvalHistory,
        {
          level: request.currentLevel,
          approver: user.email || 'Unknown',
          action: 'rejected' as const,
          timestamp: new Date().toISOString(),
          notes: notes || 'Rejected',
        },
      ];

      const { error } = await supabase
        .from('approval_requests')
        .update({
          status: 'rejected',
          approvalHistory: newHistory,
        })
        .eq('id', request.id);

      if (error) throw error;

      toast.success('Request berhasil di-reject!');
      fetchData();
    } catch (error) {
      toast.error('Gagal reject request');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const stats = {
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
    total: requests.length,
  };

  const toggleLevel = (level: string) => {
    if (ruleForm.approvalLevels.includes(level)) {
      setRuleForm({
        ...ruleForm,
        approvalLevels: ruleForm.approvalLevels.filter((l) => l !== level),
      });
    } else {
      setRuleForm({
        ...ruleForm,
        approvalLevels: [...ruleForm.approvalLevels, level],
      });
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl text-gray-900">Approval Workflow</h2>
          <p className="text-sm text-gray-600 mt-1">Multi-level approval untuk transaksi besar</p>
        </div>
        <button
          onClick={() => setShowRuleModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Tambah Rule
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={20} className="text-amber-600" />
            <span className="text-sm text-gray-600">Pending</span>
          </div>
          <p className="text-2xl text-gray-900">{stats.pending}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={20} className="text-green-600" />
            <span className="text-sm text-gray-600">Approved</span>
          </div>
          <p className="text-2xl text-gray-900">{stats.approved}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle size={20} className="text-red-600" />
            <span className="text-sm text-gray-600">Rejected</span>
          </div>
          <p className="text-2xl text-gray-900">{stats.rejected}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckSquare size={20} className="text-blue-600" />
            <span className="text-sm text-gray-600">Total</span>
          </div>
          <p className="text-2xl text-gray-900">{stats.total}</p>
        </div>
      </div>

      {/* Active Rules */}
      {rules.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-gray-900 mb-4">Approval Rules Aktif ({rules.length})</h3>
          <div className="space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-900">{rule.name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatCurrency(rule.minAmount)} {rule.maxAmount && `- ${formatCurrency(rule.maxAmount)}`}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {rule.approvalLevels.map((level) => (
                        <span
                          key={level}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                        >
                          {level}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    {rule.transactionType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' && 'Semua'}
              {status === 'pending' && 'Pending'}
              {status === 'approved' && 'Approved'}
              {status === 'rejected' && 'Rejected'}
            </button>
          ))}
        </div>
      </div>

      {/* Approval Requests */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm text-gray-700">Tanggal</th>
                <th className="text-left px-6 py-3 text-sm text-gray-700">Tipe</th>
                <th className="text-left px-6 py-3 text-sm text-gray-700">Kategori</th>
                <th className="text-left px-6 py-3 text-sm text-gray-700">Deskripsi</th>
                <th className="text-right px-6 py-3 text-sm text-gray-700">Jumlah</th>
                <th className="text-center px-6 py-3 text-sm text-gray-700">Status</th>
                <th className="text-center px-6 py-3 text-sm text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {filter === 'pending'
                      ? 'Tidak ada request pending'
                      : filter === 'all'
                      ? 'Belum ada approval request'
                      : `Tidak ada request ${filter}`}
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(request.requestedAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs ${
                          request.transactionType === 'income'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {request.transactionType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{request.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{request.description}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">
                      {formatCurrency(request.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs ${
                          request.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : request.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : request.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {request.status === 'pending' && (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleApprove(request)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Approve"
                          >
                            <ThumbsUp size={16} />
                          </button>
                          <button
                            onClick={() => handleReject(request)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Reject"
                          >
                            <ThumbsDown size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl text-gray-900">Tambah Approval Rule</h3>
              <button onClick={() => setShowRuleModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Nama Rule *</label>
                <input
                  type="text"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Contoh: Transaksi > 5 Juta"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Tipe Transaksi</label>
                <select
                  value={ruleForm.transactionType}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, transactionType: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="both">Income & Expense</option>
                  <option value="income">Income Only</option>
                  <option value="expense">Expense Only</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Min Amount *</label>
                  <input
                    type="number"
                    value={ruleForm.minAmount}
                    onChange={(e) => setRuleForm({ ...ruleForm, minAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="5000000"
                    required
                    min="0"
                    step="100000"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Max Amount</label>
                  <input
                    type="number"
                    value={ruleForm.maxAmount}
                    onChange={(e) => setRuleForm({ ...ruleForm, maxAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Optional"
                    min="0"
                    step="100000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Approval Levels *</label>
                <div className="space-y-2">
                  {['manager', 'director', 'ceo'].map((level) => (
                    <label key={level} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={ruleForm.approvalLevels.includes(level)}
                        onChange={() => toggleLevel(level)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700 capitalize">{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={ruleForm.approvalLevels.length === 0}
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
