import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  User,
  Activity,
  UserX,
  UserCheck,
  RefreshCw,
  Clock,
  FileText,
  Lock,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Toast } from '../components/common/Toast';

export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { isAdmin } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uList, logs] = await Promise.all([api.getUsers(), api.getAuditLogs()]);
      setUsers(uList);
      setAuditLogs(logs);
    } catch (err) {
      setError(err.message || 'Failed to load user administration data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const handleToggleStatus = async (user) => {
    try {
      await api.toggleUserStatus(user.user_id);
      setSuccess(`User ${user.email} status updated.`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to update user status.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-2xl">
        Access Restricted: You must have an Administrator account to view this section.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Role-Based Security & Audit Log</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Admin oversight: Manage role authorizations, active user states, and system-wide operational audit trails.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-600 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Notifications */}
      {error && <Toast type="error" message={error} onClose={() => setError('')} />}
      {success && <Toast type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Registered System Accounts ({users.length})
          </h3>
          <span className="text-xs text-slate-500">BCrypt Password Hash Protected</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading accounts...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">System Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Created At</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {users.map((u) => (
                  <tr key={u.user_id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3 px-4 text-slate-600">{u.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : u.role === 'LOGISTICS_MANAGER'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          u.is_active
                            ? 'text-rose-600 hover:bg-rose-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Log Stream */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            System Operations Audit Log ({auditLogs.length})
          </h3>
          <span className="text-xs text-slate-400">Security & Operational Compliance</span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold sticky top-0">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Operator</th>
                <th className="py-2.5 px-4">Action Event</th>
                <th className="py-2.5 px-4">Target Entity</th>
                <th className="py-2.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {auditLogs.map((log) => (
                <tr key={log.audit_id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{log.user}</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 text-slate-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">
                    {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 max-w-xs truncate" title={log.details}>
                    {log.details || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
