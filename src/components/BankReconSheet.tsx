import { Building2, Upload, CheckCircle, AlertCircle, X, Plus, Link } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface BankAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  accountType: 'checking' | 'savings' | 'credit';
  currentBalance: number;
  lastReconciled: string | null;
}

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
  status: 'unmatched' | 'matched' | 'reviewed' | 'discrepancy';
  matchedTransactionId: string | null;
  matchScore: number | null;
}

export function BankReconSheet() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('');

  const [accountForm, setAccountForm] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    accountType: 'checking' as 'checking' | 'savings' | 'credit',
    openingBalance: '',
  });

  const [transactionForm, setTransactionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    debit: '',
    credit: '',
  });

  useEffect(() => {
    fetchData();
  }, [selectedAccount]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch bank accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('userId', user.id)
        .eq('active', true);

      if (accountsError) {
        if (accountsError.code === 'PGRST205' || accountsError.message.includes('Could not find the table')) {
          setAccounts([]);
        } else {
          throw accountsError;
        }
      } else {
        setAccounts(accountsData || []);
      }

      // Fetch bank transactions if account selected
      if (selectedAccount) {
        const { data: statementsData } = await supabase
          .from('bank_statements')
          .select('id')
          .eq('accountNumber', selectedAccount)
          .maybeSingle();

        if (statementsData) {
          const { data: transData } = await supabase
            .from('bank_transactions')
            .select('*')
            .eq('statementId', statementsData.id)
            .order('date', { ascending: false });

          setTransactions(transData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching bank recon data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountForm.accountName || !accountForm.accountNumber || !accountForm.bankName) {
      toast.error('Semua field wajib diisi!');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('bank_accounts').insert({
        userId: user.id,
        accountName: accountForm.accountName,
        accountNumber: accountForm.accountNumber,
        bankName: accountForm.bankName,
        accountType: accountForm.accountType,
        currency: 'IDR',
        active: true,
        openingBalance: parseFloat(accountForm.openingBalance) || 0,
        currentBalance: parseFloat(accountForm.openingBalance) || 0,
      });

      if (error) throw error;

      toast.success('Bank account berhasil ditambahkan!');
      setShowAccountModal(false);
      setAccountForm({
        accountName: '',
        accountNumber: '',
        bankName: '',
        accountType: 'checking',
        openingBalance: '',
      });
      fetchData();
    } catch (error) {
      toast.error('Gagal menambahkan bank account');
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccount) {
      toast.error('Pilih bank account terlebih dahulu!');
      return;
    }

    if (!transactionForm.description || (!transactionForm.debit && !transactionForm.credit)) {
      toast.error('Deskripsi dan nominal wajib diisi!');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get or create statement for this account
      const account = accounts.find((a) => a.accountNumber === selectedAccount);
      if (!account) return;

      let statementId;
      const { data: existingStatement } = await supabase
        .from('bank_statements')
        .select('id')
        .eq('accountNumber', selectedAccount)
        .eq('statementDate', transactionForm.date)
        .maybeSingle();

      if (existingStatement) {
        statementId = existingStatement.id;
      } else {
        const { data: newStatement } = await supabase
          .from('bank_statements')
          .insert({
            userId: user.id,
            accountName: account.accountName,
            accountNumber: account.accountNumber,
            bankName: account.bankName,
            statementDate: transactionForm.date,
            fileName: 'Manual Entry',
            transactions: [],
            reconciled: false,
          })
          .select()
          .single();

        statementId = newStatement?.id;
      }

      if (!statementId) {
        toast.error('Gagal membuat statement');
        return;
      }

      const debit = parseFloat(transactionForm.debit) || 0;
      const credit = parseFloat(transactionForm.credit) || 0;
      const newBalance = account.currentBalance - debit + credit;

      const { error } = await supabase.from('bank_transactions').insert({
        statementId,
        date: transactionForm.date,
        description: transactionForm.description,
        reference: transactionForm.reference || '',
        debit,
        credit,
        balance: newBalance,
        status: 'unmatched',
      });

      if (error) throw error;

      // Update account balance
      await supabase
        .from('bank_accounts')
        .update({ currentBalance: newBalance })
        .eq('id', account.id);

      toast.success('Transaksi bank berhasil ditambahkan!');
      setShowTransactionModal(false);
      setTransactionForm({
        date: new Date().toISOString().split('T')[0],
        description: '',
        reference: '',
        debit: '',
        credit: '',
      });
      fetchData();
    } catch (error) {
      toast.error('Gagal menambahkan transaksi');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const stats = {
    total: transactions.length,
    matched: transactions.filter((t) => t.status === 'matched').length,
    unmatched: transactions.filter((t) => t.status === 'unmatched').length,
  };

  const selectedAccountData = accounts.find((a) => a.accountNumber === selectedAccount);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl text-gray-900">Rekonsiliasi Bank</h2>
          <p className="text-sm text-gray-600 mt-1">Match mutasi bank dengan transaksi sistem</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAccountModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Plus size={18} />
            Bank Account
          </button>
          {selectedAccount && (
            <button
              onClick={() => setShowTransactionModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload size={18} />
              Add Transaction
            </button>
          )}
        </div>
      </div>

      {/* Bank Account Selector */}
      {accounts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <label className="block text-sm text-gray-700 mb-2">Pilih Bank Account</label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Pilih account</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.accountNumber}>
                {acc.bankName} - {acc.accountName} ({acc.accountNumber})
              </option>
            ))}
          </select>
          {selectedAccountData && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-700">Current Balance</p>
                  <p className="text-lg text-gray-900">{formatCurrency(selectedAccountData.currentBalance)}</p>
                </div>
                {selectedAccountData.lastReconciled && (
                  <div className="text-right">
                    <p className="text-sm text-gray-700">Last Reconciled</p>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedAccountData.lastReconciled).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 size={20} className="text-blue-600" />
            <span className="text-sm text-gray-600">Total Transaksi</span>
          </div>
          <p className="text-2xl text-gray-900">{stats.total}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={20} className="text-green-600" />
            <span className="text-sm text-gray-600">Matched</span>
          </div>
          <p className="text-2xl text-gray-900">{stats.matched}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={20} className="text-amber-600" />
            <span className="text-sm text-gray-600">Unmatched</span>
          </div>
          <p className="text-2xl text-gray-900">{stats.unmatched}</p>
        </div>
      </div>

      {/* Bank Accounts List */}
      {accounts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <Building2 size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg text-gray-900 mb-2">Belum Ada Bank Account</h3>
          <p className="text-sm text-gray-600 mb-4">
            Tambahkan bank account terlebih dahulu untuk mulai rekonsiliasi
          </p>
          <button
            onClick={() => setShowAccountModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            Tambah Bank Account
          </button>
        </div>
      ) : !selectedAccount ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <Building2 size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg text-gray-900 mb-2">Pilih Bank Account</h3>
          <p className="text-sm text-gray-600">Pilih bank account di atas untuk melihat transaksi</p>
        </div>
      ) : (
        /* Transactions Table */
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm text-gray-700">Tanggal</th>
                  <th className="text-left px-6 py-3 text-sm text-gray-700">Deskripsi</th>
                  <th className="text-left px-6 py-3 text-sm text-gray-700">Ref</th>
                  <th className="text-right px-6 py-3 text-sm text-gray-700">Debit</th>
                  <th className="text-right px-6 py-3 text-sm text-gray-700">Credit</th>
                  <th className="text-right px-6 py-3 text-sm text-gray-700">Balance</th>
                  <th className="text-center px-6 py-3 text-sm text-gray-700">Status</th>
                  <th className="text-center px-6 py-3 text-sm text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      Belum ada transaksi bank. Klik "Add Transaction" untuk menambahkan.
                    </td>
                  </tr>
                ) : (
                  transactions.map((trans) => (
                    <tr key={trans.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(trans.date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{trans.description}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{trans.reference}</td>
                      <td className="px-6 py-4 text-sm text-right text-red-600">
                        {trans.debit > 0 && formatCurrency(trans.debit)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-green-600">
                        {trans.credit > 0 && formatCurrency(trans.credit)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">
                        {formatCurrency(trans.balance)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex px-2 py-1 rounded text-xs ${
                            trans.status === 'matched'
                              ? 'bg-green-100 text-green-700'
                              : trans.status === 'reviewed'
                              ? 'bg-blue-100 text-blue-700'
                              : trans.status === 'discrepancy'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {trans.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {trans.status === 'unmatched' && (
                          <button
                            onClick={() => toast.info('Manual matching feature coming soon!')}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Manual match"
                          >
                            <Link size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl text-gray-900">Tambah Bank Account</h3>
              <button onClick={() => setShowAccountModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Nama Account *</label>
                <input
                  type="text"
                  value={accountForm.accountName}
                  onChange={(e) => setAccountForm({ ...accountForm, accountName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Rekening Operasional"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Nama Bank *</label>
                <select
                  value={accountForm.bankName}
                  onChange={(e) => setAccountForm({ ...accountForm, bankName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Pilih bank</option>
                  <option value="BCA">BCA</option>
                  <option value="Mandiri">Mandiri</option>
                  <option value="BRI">BRI</option>
                  <option value="BNI">BNI</option>
                  <option value="CIMB Niaga">CIMB Niaga</option>
                  <option value="Permata">Permata</option>
                  <option value="GoPay">GoPay</option>
                  <option value="OVO">OVO</option>
                  <option value="Dana">Dana</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">No. Rekening *</label>
                <input
                  type="text"
                  value={accountForm.accountNumber}
                  onChange={(e) => setAccountForm({ ...accountForm, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="1234567890"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Tipe Account</label>
                <select
                  value={accountForm.accountType}
                  onChange={(e) => setAccountForm({ ...accountForm, accountType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="checking">Checking (Giro)</option>
                  <option value="savings">Savings (Tabungan)</option>
                  <option value="credit">Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Saldo Awal</label>
                <input
                  type="number"
                  value={accountForm.openingBalance}
                  onChange={(e) => setAccountForm({ ...accountForm, openingBalance: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0"
                  min="0"
                  step="1000"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl text-gray-900">Tambah Transaksi Bank</h3>
              <button onClick={() => setShowTransactionModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Tanggal *</label>
                <input
                  type="date"
                  value={transactionForm.date}
                  onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Deskripsi *</label>
                <input
                  type="text"
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Transfer dari customer"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">No. Referensi</label>
                <input
                  type="text"
                  value={transactionForm.reference}
                  onChange={(e) => setTransactionForm({ ...transactionForm, reference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="TRX123456 (opsional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Debit (Keluar)</label>
                  <input
                    type="number"
                    value={transactionForm.debit}
                    onChange={(e) => setTransactionForm({ ...transactionForm, debit: e.target.value, credit: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="0"
                    min="0"
                    step="1000"
                    disabled={!!transactionForm.credit}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Credit (Masuk)</label>
                  <input
                    type="number"
                    value={transactionForm.credit}
                    onChange={(e) => setTransactionForm({ ...transactionForm, credit: e.target.value, debit: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="0"
                    min="0"
                    step="1000"
                    disabled={!!transactionForm.debit}
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg text-sm text-gray-700">
                <strong>Note:</strong> Isi salah satu antara Debit atau Credit
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransactionModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
