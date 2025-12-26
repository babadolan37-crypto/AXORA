import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAdminData } from '../hooks/useAdminData';
import { Users, Activity, RefreshCw, UserCheck, UserX, Clock } from 'lucide-react';

export default function AdminDashboard({ initialTab = 'users' }: { initialTab?: 'users' | 'requests' | 'logs' }) {
  const { users, auditLogs, loading, error, refresh, updateUserRole, approveMember, rejectMember } = useAdminData();
  const [activeTab, setActiveTab] = useState<'users' | 'requests' | 'logs'>(initialTab);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyCode, setCompanyCode] = useState<string | null>(null);

  // Filter lists
  const activeUsers = users.filter(u => u.status === 'active');
  const pendingUsers = users.filter(u => u.status === 'pending');

  useEffect(() => {
    // ... loadCompany logic ...
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
        .select('name, code')
        .eq('id', profile.company_id)
        .maybeSingle();
      if (company) {
        setCompanyName(company.name || null);
        setCompanyCode(company.code || null);
      }
    };
    loadCompany();
  }, []);

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
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-blue-900">
            <span className="font-medium">Perusahaan:</span> {companyName}
          </div>
          {companyCode && (
            <div className="text-sm text-blue-900">
              <span className="font-medium">Kode:</span> {companyCode}
            </div>
          )}
        </div>
      )}

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
          Active Users ({activeUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-2 px-4 flex items-center gap-2 ${
            activeTab === 'requests' 
              ? 'border-b-2 border-blue-600 text-blue-600 font-medium' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Requests
          {pendingUsers.length > 0 && (
            <span className="ml-1 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
              {pendingUsers.length}
            </span>
          )}
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
        
        {/* REQUESTS TAB */}
        {activeTab === 'requests' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested At</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingUsers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <CheckCircle2 className="w-12 h-12 text-green-100 mb-2" />
                        <p>Tidak ada permintaan bergabung saat ini.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pendingUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold">
                            <Clock size={20} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.full_name || 'No Name'}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => approveMember && approveMember(user.user_id)}
                            className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md text-sm transition-colors flex items-center gap-1"
                          >
                            <UserCheck size={16} />
                            Approve
                          </button>
                          <button
                            onClick={() => rejectMember && rejectMember(user.user_id)}
                            className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md text-sm transition-colors flex items-center gap-1"
                          >
                            <UserX size={16} />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* USERS TAB (Active Only) */}
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
                {activeUsers.map((user) => (
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

// Helper icon component if missing
function CheckCircle2(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
}
