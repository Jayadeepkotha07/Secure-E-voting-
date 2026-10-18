import React, { useEffect, useState } from 'react';
import { Vote, CheckCircle2, Search, ArrowLeft, ExternalLink, Calendar, Shield } from 'lucide-react';
import { api } from '../../services/api';
import { MyVoteSummary } from '../../types';

interface MyVotesPageProps {
  onNavigate: (view: string, data?: any) => void;
  onBack: () => void;
}

export const MyVotesPage: React.FC<MyVotesPageProps> = ({ onNavigate, onBack }) => {
  const [votes, setVotes] = useState<MyVoteSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVotes = async () => {
      try {
        const data = await api.voting.getMyVotes();
        setVotes(data);
      } catch (err) {
        console.error('Failed to load user votes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVotes();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      <button
        onClick={onBack}
        className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Voting History</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Complete ledger of elections you participated in. Every ballot generates an unforgeable cryptographic Vote ID.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading your voting records...</div>
      ) : votes.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 space-y-2">
          <Vote className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="font-bold text-base">No Ballots Cast Yet</div>
          <p className="text-xs text-slate-400">You have not participated in any elections yet.</p>
          <button
            onClick={() => onNavigate('elections')}
            className="mt-3 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
          >
            Explore Active Elections
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-3.5">Election Title</th>
                  <th className="px-6 py-3.5">Cryptographic Vote ID</th>
                  <th className="px-6 py-3.5">Date &amp; Time (UTC)</th>
                  <th className="px-6 py-3.5">Integrity Status</th>
                  <th className="px-6 py-3.5 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {votes.map((v, i) => (
                  <tr key={i} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900 max-w-xs truncate">
                      {v.election_title}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-sky-700">
                      <span className="bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                        {v.public_vote_id}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(v.voted_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Valid Recorded</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onNavigate('verify')}
                        className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 transition cursor-pointer inline-flex items-center space-x-1"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Audit Proof</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
