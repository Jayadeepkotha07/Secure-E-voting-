import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, XCircle, ShieldCheck, RefreshCw, AlertTriangle, Network, Key } from 'lucide-react';
import { api } from '../../services/api';
import { SystemIntegrityReport } from '../../types';

export const AdminSecurityIntegrityPage: React.FC = () => {
  const [report, setReport] = useState<SystemIntegrityReport | null>(null);
  const [loading, setLoading] = useState(false);

  const runAudit = async () => {
    setLoading(true);
    try {
      const data = await api.admin.runIntegrityAudit();
      setReport(data);
    } catch (err: any) {
      alert(err.message || 'Audit execution failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAudit();
  }, []);

  return (
    <div className="space-y-8 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">System-Wide Cryptographic Audit</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Exhaustive database integrity scan: recomputes all BLAKE2s digests, verifies Ed25519 signatures, and checks Merkle roots.
          </p>
        </div>

        <button
          onClick={runAudit}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Executing Audit...' : 'Re-run Integrity Scan'}</span>
        </button>
      </div>

      {report && (
        <div className="space-y-6">
          {/* Health Summary Banner */}
          <div
            className={`p-6 rounded-3xl border shadow-md flex items-center justify-between ${
              report.overall_system_healthy
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  report.overall_system_healthy ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
                }`}
              >
                {report.overall_system_healthy ? <CheckCircle2 className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
              </div>
              <div>
                <h3 className="text-lg font-black">
                  {report.overall_system_healthy
                    ? 'Election Database Fully Certified & Intact'
                    : 'System Integrity Warning: Anomalies Detected'}
                </h3>
                <p className="text-xs opacity-80 mt-0.5">
                  Audit scan completed at {new Date(report.timestamp).toLocaleString()} &bull;{' '}
                  {report.total_records_checked} total vote records audited.
                </p>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                report.overall_system_healthy ? 'bg-emerald-200/60 text-emerald-900' : 'bg-rose-200 text-rose-900'
              }`}
            >
              {report.overall_system_healthy ? 'HEALTHY' : 'CORRUPTED'}
            </span>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Audited Records</div>
              <div className="text-xl font-black text-slate-900 mt-1">{report.total_records_checked}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Valid &amp; Authentic</div>
              <div className="text-xl font-black text-emerald-600 mt-1">{report.valid_records_count}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Tampered Records</div>
              <div className="text-xl font-black text-rose-600 mt-1">{report.tampered_records_count}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Total Elections</div>
              <div className="text-xl font-black text-sky-700 mt-1">{report.total_elections}</div>
            </div>
          </div>

          {/* Per-Election Ledger Breakdowns */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Per-Election Merkle Root &amp; Ledger Audits:
            </h3>

            <div className="space-y-3">
              {report.elections_audit.map((ea) => (
                <div
                  key={ea.election_id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-sm text-slate-900">{ea.title}</span>
                      <span className="text-slate-400 text-xs ml-2">(ID #{ea.election_id} &bull; {ea.status})</span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        ea.merkle_consistent
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {ea.merkle_consistent ? 'MERKLE ROOT CONSISTENT' : 'ROOT DISCREPANCY'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 truncate">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Stored Merkle Root:</span>
                      <span className="text-slate-700">{ea.stored_merkle_root || 'None'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 truncate">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Recomputed Merkle Root:</span>
                      <span className="text-slate-700">{ea.calculated_merkle_root || 'None'}</span>
                    </div>
                  </div>

                  {ea.anomalies.length > 0 && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                      <div className="font-bold flex items-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Detected Anomalies:</span>
                      </div>
                      <ul className="list-disc pl-5">
                        {ea.anomalies.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
