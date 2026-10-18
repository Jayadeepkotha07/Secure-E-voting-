import React, { useEffect, useState } from 'react';
import { BarChart3, CheckCircle2, Lock, RefreshCw, Send, AlertCircle, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import { Election, ElectionResults } from '../../types';

export const AdminResultsPage: React.FC = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<number | null>(null);
  const [results, setResults] = useState<ElectionResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchClosedElections = async () => {
    try {
      const data = await api.elections.list();
      const closedOrPublished = data.filter((e) => e.status === 'closed' || e.status === 'published');
      setElections(closedOrPublished);
      if (closedOrPublished.length > 0 && !selectedElectionId) {
        setSelectedElectionId(closedOrPublished[0].id);
      }
    } catch (err) {
      console.error('Failed to load elections:', err);
    }
  };

  useEffect(() => {
    fetchClosedElections();
  }, []);

  const loadResults = async (id: number) => {
    setLoading(true);
    try {
      // First try to calculate / fetch results
      const data = await api.admin.calculateResults(id);
      setResults(data);
    } catch (err: any) {
      console.error('Results load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedElectionId) {
      loadResults(selectedElectionId);
    }
  }, [selectedElectionId]);

  const handlePublish = async () => {
    if (!selectedElectionId) return;
    setActionLoading(true);
    try {
      const pub = await api.admin.publishResults(selectedElectionId);
      setResults(pub);
      fetchClosedElections();
      alert('Official results certified and published to the public portal!');
    } catch (err: any) {
      alert(err.message || 'Failed to publish results');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 text-left">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Election Results &amp; Certified Tallying</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Tallying decrypts verified ballot payloads in backend authority memory and publishes tamper-evident vote distributions.
        </p>
      </div>

      {/* Election Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Select Closed / Published Election:
          </label>
          <select
            value={selectedElectionId || ''}
            onChange={(e) => setSelectedElectionId(Number(e.target.value))}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800"
          >
            {elections.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} ({e.status.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {results && results.status === 'closed' && (
          <button
            onClick={handlePublish}
            disabled={actionLoading}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{actionLoading ? 'Publishing...' : 'Publish Official Results'}</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Decrypting verified ballots and computing tallies...</div>
      ) : results ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-100 text-sky-800">
                <span>{results.status === 'published' ? 'PUBLISHED & PUBLIC' : 'CALCULATED PREVIEW'}</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">{results.election_title}</h3>
              <p className="text-xs text-slate-500">
                Total Certified Ballots Decrypted: <strong>{results.total_valid_votes}</strong>
              </p>
            </div>
          </div>

          {/* Tallies */}
          <div className="space-y-4 pt-2">
            {results.tallies.map((t, idx) => (
              <div key={t.candidate_id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-bold text-slate-900">{t.display_name}</span>
                    {t.party && <span className="text-xs text-slate-500 ml-2">({t.party})</span>}
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{t.count} votes</span>
                    <span className="text-xs font-bold text-sky-700 ml-2">({t.percentage}%)</span>
                  </div>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      idx === 0 ? 'bg-gradient-to-r from-sky-600 to-teal-500' : 'bg-slate-400'
                    }`}
                    style={{ width: `${Math.max(t.percentage, 2)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Cryptographic Decryption Note */}
          <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-950 text-xs leading-relaxed flex items-start space-x-2.5">
            <Lock className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <strong>Cryptographic Authority Tallying:</strong> Ballots are decrypted in memory using the Election Authority
              Master Key. Before decrypting any ballot, the HMAC-SHA256 Encrypt-then-MAC tag is strictly authenticated.
              Plaintext candidate associations are never written back to disk or linked to voter identities.
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          No closed elections ready for results calculation.
        </div>
      )}
    </div>
  );
};
