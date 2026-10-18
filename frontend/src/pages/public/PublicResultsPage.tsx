import React, { useEffect, useState } from 'react';
import { BarChart3, CheckCircle2, ShieldCheck, AlertCircle, ArrowLeft, Network } from 'lucide-react';
import { api } from '../../services/api';
import { ElectionResults } from '../../types';

interface PublicResultsPageProps {
  electionId: number;
  onBack: () => void;
}

export const PublicResultsPage: React.FC<PublicResultsPageProps> = ({ electionId, onBack }) => {
  const [results, setResults] = useState<ElectionResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await api.results.getPublic(electionId);
        setResults(data);
      } catch (err: any) {
        setError(err.message || 'Official results have not yet been published for this election.');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [electionId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <div>Loading certified results...</div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Results Not Yet Available</h2>
        <p className="text-sm text-slate-600">{error}</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs transition cursor-pointer"
        >
          &larr; Back to Elections
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-left">
      <button
        onClick={onBack}
        className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Elections</span>
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-sky-600 to-teal-600 p-6 sm:p-8 text-white space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Certified Official Election Results</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{results.election_title}</h1>
          <p className="text-xs text-sky-100">
            Published on: {results.results_published_at ? new Date(results.results_published_at).toLocaleString() : 'Recent'} &bull;
            Total Valid Cast Ballots: <strong>{results.total_valid_votes}</strong>
          </p>
        </div>

        {/* Tallies */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate Vote Share:</div>
            {results.tallies.map((tally, idx) => (
              <div key={tally.candidate_id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-bold text-slate-900">{tally.display_name}</span>
                    {tally.party && <span className="text-xs text-slate-500 ml-2">({tally.party})</span>}
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{tally.count} votes</span>
                    <span className="text-xs font-semibold text-sky-700 ml-2">({tally.percentage}%)</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      idx === 0 ? 'bg-gradient-to-r from-sky-500 to-teal-500' : 'bg-slate-400'
                    }`}
                    style={{ width: `${Math.max(tally.percentage, 2)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Merkle Root Verification Proof Box */}
          {results.merkle_root && (
            <div className="p-4 rounded-xl bg-slate-900 text-slate-300 space-y-2 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold text-sky-400">
                <div className="flex items-center space-x-1.5">
                  <Network className="w-4 h-4" />
                  <span>Certified Merkle Root Digest (BLAKE2s)</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">MATHEMATICALLY ANCHORED</span>
              </div>
              <div className="font-mono text-xs text-white break-all bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                {results.merkle_root}
              </div>
              <div className="text-[11px] text-slate-400">
                All certified ballots in this election combine into this single 256-bit Merkle root.
                Any voter can verify their ballot's mathematical inclusion path using their private Vote ID.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
