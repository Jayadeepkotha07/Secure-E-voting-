import React, { useEffect, useState } from 'react';
import { History, Search, RefreshCw, FileText } from 'lucide-react';
import { api } from '../../services/api';
import { AuditLogItem } from '../../types';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getAuditLogs(actionFilter || undefined);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Immutable System Audit Trail</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographic ledger tracking all administrative actions, vote submissions, verification checks, and tamper events.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Trail</span>
        </button>
      </div>

      {/* Action Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Filter by Event Type:</div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-700 font-medium cursor-pointer"
        >
          <option value="">All Security Events</option>
          <option value="VOTE_CAST">VOTE_CAST</option>
          <option value="INTEGRITY_AUDIT_RUN">INTEGRITY_AUDIT_RUN</option>
          <option value="TAMPER_SIMULATION_EXECUTED">TAMPER_SIMULATION_EXECUTED</option>
          <option value="ELECTION_CREATED">ELECTION_CREATED</option>
          <option value="RESULTS_PUBLISHED">RESULTS_PUBLISHED</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading audit trail entries...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-1">
            <History className="w-8 h-8 mx-auto text-slate-300" />
            <div className="font-bold text-sm">No Audit Entries Found</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-3.5">ID</th>
                  <th className="px-6 py-3.5">Timestamp (UTC)</th>
                  <th className="px-6 py-3.5">Security Action</th>
                  <th className="px-6 py-3.5">Actor</th>
                  <th className="px-6 py-3.5">Target Reference</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Safe Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition font-mono text-[11px]">
                    <td className="px-6 py-3.5 text-slate-400">#{log.id}</td>
                    <td className="px-6 py-3.5 text-slate-600 font-sans">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">{log.action}</td>
                    <td className="px-6 py-3.5 text-slate-600">{log.actor}</td>
                    <td className="px-6 py-3.5 text-sky-700 font-semibold">{log.target_reference}</td>
                    <td className="px-6 py-3.5 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 max-w-xs truncate" title={log.safe_metadata || ''}>
                      {log.safe_metadata || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
