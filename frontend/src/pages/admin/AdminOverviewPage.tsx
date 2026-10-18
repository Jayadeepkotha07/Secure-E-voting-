import React, { useEffect, useState } from 'react';
import {
  Vote,
  Users,
  CheckCircle2,
  AlertTriangle,
  Network,
  Activity,
  Key,
  Copy,
  Check,
  ShieldCheck,
  BarChart3,
  RefreshCw,
  Lock
} from 'lucide-react';
import { api } from '../../services/api';
import { AdminMetrics, AuditLogItem } from '../../types';

interface AdminOverviewPageProps {
  onNavigate: (view: string) => void;
}

export const AdminOverviewPage: React.FC<AdminOverviewPageProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const [m, logs] = await Promise.all([
        api.admin.getMetrics(),
        api.admin.getAuditLogs(),
      ]);
      setMetrics(m);
      setRecentLogs(logs.slice(0, 5));
    } catch (err) {
      console.error('Failed to load admin overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const copyAuthorityKey = () => {
    if (metrics?.authority_public_key_hex) {
      navigator.clipboard.writeText(metrics.authority_public_key_hex);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="p-12 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-sky-600 mb-2" />
        <div>Querying live backend metrics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left">
      {/* Top Welcome / Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Authority Dashboard Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time election ledger state directly queried from SQLite database.
          </p>
        </div>

        <button
          onClick={fetchOverview}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* 8 Live Backend Database Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Elections</div>
          <div className="text-2xl font-black text-slate-900">{metrics?.total_elections ?? 0}</div>
          <div className="text-[11px] text-slate-500 font-medium">All registered ballots</div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400">Active Elections</div>
          <div className="text-2xl font-black text-emerald-600">{metrics?.active_elections ?? 0}</div>
          <div className="text-[11px] text-emerald-700 font-medium">Accepting live votes</div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400">Registered Voters</div>
          <div className="text-2xl font-black text-sky-700">{metrics?.registered_voters ?? 0}</div>
          <div className="text-[11px] text-sky-600 font-medium">Citizen voter accounts</div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400">Votes Cast</div>
          <div className="text-2xl font-black text-slate-900">{metrics?.votes_cast ?? 0}</div>
          <div className="text-[11px] text-slate-500 font-medium">Permanent ledger records</div>
        </div>

        {/* Metric 5 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400">Verified Records</div>
          <div className="text-2xl font-black text-emerald-600">{metrics?.verified_records ?? 0}</div>
          <div className="text-[11px] text-emerald-700 font-medium">100% hash &amp; signature valid</div>
        </div>

        {/* Metric 6 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400">Invalid / Tampered</div>
          <div className="text-2xl font-black text-rose-600">{metrics?.invalid_records ?? 0}</div>
          <div className="text-[11px] text-rose-600 font-medium">Discrepancy count</div>
        </div>

        {/* Metric 7 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1 col-span-2 sm:col-span-1">
          <div className="text-[10px] uppercase font-bold text-slate-400">Current Merkle Root</div>
          <div className="text-xs font-mono font-bold text-slate-800 truncate">
            {metrics?.current_merkle_root ? `${metrics.current_merkle_root.slice(0, 14)}...` : 'None generated'}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">BLAKE2s root digest</div>
        </div>

        {/* Metric 8 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1 col-span-2 sm:col-span-1">
          <div className="text-[10px] uppercase font-bold text-slate-400">Last Integrity Check</div>
          <div className="text-xs font-semibold text-slate-800">
            {metrics?.last_integrity_check ? new Date(metrics.last_integrity_check).toLocaleTimeString() : 'Pending'}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Database-wide audit</div>
        </div>
      </div>

      {/* Authority Public Key Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
            <Key className="w-4 h-4" />
            <span>Official Election Authority Ed25519 Public Key</span>
          </div>
          <button
            onClick={copyAuthorityKey}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
          >
            {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey ? 'Copied Key' : 'Copy Hex Key'}</span>
          </button>
        </div>

        <div className="font-mono text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 break-all">
          {metrics?.authority_public_key_hex || 'Generating keypair...'}
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          This 32-byte Ed25519 public key is public information used by voters, candidates, and third-party auditors
          to verify that all record hashes in the election were signed by the authorized backend keypair.
          The private signing key remains strictly protected on the backend.
        </p>
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('admin-sec-xcs256')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-md transition text-left space-y-2 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
            <Key className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-slate-900 group-hover:text-sky-600 transition">
            XCS-256 Feistel Inspector
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Run live four-round Feistel transformations, inspect L &amp; R halves, and observe raw Serpent and XChaCha outputs.
          </p>
        </button>

        <button
          onClick={() => onNavigate('admin-mon-tamper')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 hover:shadow-md transition text-left space-y-2 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-slate-900 group-hover:text-amber-600 transition">
            Tamper Detection Sandbox
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Perform controlled bit-flip mutations on isolated test records to demonstrate live cryptographic rejection.
          </p>
        </button>

        <button
          onClick={() => onNavigate('admin-sec-integrity')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition text-left space-y-2 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition">
            System Integrity Audit
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Recompute BLAKE2s hashes, verify Ed25519 signatures, and check Merkle root consistency across all database records.
          </p>
        </button>
      </div>

      {/* Recent Audit Trail Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="font-bold text-sm text-slate-900 uppercase tracking-wider text-xs">
            Recent Immutable Audit Trail Entries:
          </div>
          <button
            onClick={() => onNavigate('admin-mon-audit')}
            className="text-xs text-sky-600 font-semibold hover:underline cursor-pointer"
          >
            View all audit logs &rarr;
          </button>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {recentLogs.map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-mono font-bold text-slate-800">{log.action}</span>
                <span className="text-slate-400 text-[11px] ml-2">by {log.actor}</span>
                <div className="text-[10px] text-slate-500">{log.target_reference}</div>
              </div>
              <div className="text-right space-y-0.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {log.status}
                </span>
                <div className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
