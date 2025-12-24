import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAdminData } from '../hooks/useAdminData';
import { Users, Activity, RefreshCw } from 'lucide-react';

export default function AdminDashboard({ initialTab = 'users' }: { initialTab?: 'users' | 'logs' }) {
  const { users, auditLogs, loading, error, refresh, updateUserRole } = useAdminData();
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>(initialTab);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyCode, setCompanyCode] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<{ name: string; code: string } | null>(null);
  const [newCompanyCode, setNewCompanyCode] = useState('');
  const [codeUpdateLoading, setCodeUpdateLoading] = useState(false);
  const [codeUpdateError, setCodeUpdateError] = useState<string | null>(null);
  const [codeUpdateSuccess, setCodeUpdateSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadCompany = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();
      if (!profile?.company_id) return;
      const { data: company } = await supabase
        .from('companies')
        .select('id, name, code')
        .eq('id', profile.company_id)
        .maybeSingle();
      if (company) {
        setCompanyId(company.id || null);
        setCompanyName(company.name || null);
        setCompanyCode(company.code || null);
      }
    };
    loadCompany();
  }, []);

  const randomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  };

  const handleGenerateCode = () => {
    setCodeUpdateError(null);
    setCodeUpdateSuccess(null);
    setNewCompanyCode(randomCode());
  };

  const handleSaveCompanyCode = async () => {
    setCodeUpdateLoading(true);
    setCodeUpdateError(null);
    setCodeUpdateSuccess(null);
    try {
      const code = newCompanyCode.trim().toUpperCase();
      if (!companyId) {
        setCodeUpdateError('Perusahaan belum dimuat');
        return;
      }
      if (!code || !/^[A-Z0-9]{4,12}$/.test(code)) {
        setCodeUpdateError('Kode harus 4-12 karakter huruf/angka');
        return;
      }
      const { data: existing } = await supabase
        .from('companies')
        .select('id')
        .eq('code', code)
        .maybeSingle();
      if (existing && existing.id !== companyId) {
        setCodeUpdateError('Kode sudah dipakai perusahaan lain');
        return;
      }
      const { error: upErr } = await supabase
        .from('companies')
        .update({ code })
        .eq('id', companyId);
      if (upErr) {
        setCodeUpdateError(upErr.message || 'Gagal memperbarui kode');
        return;
      }
      setCompanyCode(code);
      setCodeUpdateSuccess('Kode perusahaan berhasil diperbarui');
      setNewCompanyCode('');
    } finally {
      setCodeUpdateLoading(false);
    }
  };

  const findCompanyByEmail = async () => {
    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);
    try {
      const email = searchEmail.trim().toLowerCase();
      if (!email) {
        setLookupError('Masukkan email terlebih dahulu');
        return;
      }
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('email', email)
        .maybeSingle();
      if (pErr || !profile?.company_id) {
        setLookupError('Profil tidak ditemukan atau belum tergabung perusahaan');
        return;
      }
      const { data: company, error: cErr } = await supabase
        .from('companies')
        .select('name, code')
        .eq('id', profile.company_id)
        .maybeSingle();
      if (cErr || !company) {
        setLookupError('Perusahaan tidak ditemukan atau akses ditolak');
        return;
      }
      setLookupResult({ name: company.name, code: company.code });
    } finally {
      setLookupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
          <p className="text-gray-500">Kelola user role dan pantau aktivitas sistem</p>
        </div>
        <button 
          onClick={() => refresh()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {companyName && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-900">
              <span className="font-medium">Perusahaan:</span> {companyName}
            </div>
            {companyCode && (
              <div className="text-sm text-blue-900">
                <span className="font-medium">Kode:</span> {companyCode}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newCompanyCode}
              onChange={(e) => setNewCompanyCode(e.target.value)}
              placeholder="Masukkan kode baru (4-12 huruf/angka)"
              className="flex-1 px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <button
              onClick={handleGenerateCode}
              className="px-3 py-2 bg-blue-200 text-blue-900 rounded-md"
              disabled={codeUpdateLoading}
            >
              Generate
            </button>
            <button
              onClick={handleSaveCompanyCode}
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
              disabled={codeUpdateLoading || !newCompanyCode}
            >
              {codeUpdateLoading ? 'Menyimpan...' : 'Simpan Kode'}
            </button>
          </div>
          {codeUpdateError && <div className="text-sm text-red-700">{codeUpdateError}</div>}
          {codeUpdateSuccess && <div className="text-sm text-green-700">{codeUpdateSuccess}</div>}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
        <input
          type="email"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          placeholder="Cari kode perusahaan via email (mis. test@gmail.com)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={findCompanyByEmail}
          disabled={lookupLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
        >
          {lookupLoading ? 'Mencari...' : 'Cari'}
        </button>
        {lookupError && <span className="text-sm text-red-600">{lookupError}</span>}
        {lookupResult && (
          <span className="text-sm text-gray-900">
            {lookupResult.name} · Kode: <span className="font-medium">{lookupResult.code}</span>
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-2 px-4 flex items-center gap-2 ${
            activeTab === 'users' 
              ? 'border-b-2 border-blue-600 text-blue-600 font-medium' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          User Management
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-2 px-4 flex items-center gap-2 ${
            activeTab === 'logs' 
              ? 'border-b-2 border-blue-600 text-blue-600 font-medium' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Activity className="w-4 h-4" />
          Audit Logs
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : '?')}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.full_name || 'No Name'}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                          user.role === 'manager' ? 'bg-blue-100 text-blue-800' : 
                          'bg-green-100 text-green-800'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <select 
                        className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={user.role}
                        onChange={(e) => updateUserRole(user.user_id, e.target.value)}
                      >
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="employee">Employee</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      Belum ada aktivitas tercatat.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{log.user_name || 'System'}</div>
                        <div className="text-xs text-gray-500">{log.user_role || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {log.action}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">{log.entity_type}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {log.description || JSON.stringify(log.new_value)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
