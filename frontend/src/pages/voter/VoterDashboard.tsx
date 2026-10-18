import React, { useEffect, useState } from 'react';
import {
  Vote,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Search,
  Calendar,
  Layers,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Election, MyVoteSummary } from '../../types';

interface VoterDashboardProps {
  onNavigate: (view: string, data?: any) => void;
}

export const VoterDashboard: React.FC<VoterDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [myVotes, setMyVotes] = useState<MyVoteSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [elecList, votesList] = await Promise.all([
          api.elections.list('open'),
          api.voting.getMyVotes(),
        ]);
        setElections(elecList);
        setMyVotes(votesList);
      } catch (err) {
        console.error('Failed to load voter dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const votedElectionIds = new Set(myVotes.map((v) => v.election_id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Authenticated Voter Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-sky-100 max-w-xl">
            You are authenticated to participate in official institutional elections. Every vote you cast is sealed with our
            hybrid Feistel cipher and anchored in the election Merkle root.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onNavigate('elections')}
            className="px-5 py-2.5 rounded-xl bg-white text-sky-800 font-bold text-xs shadow-md hover:bg-sky-50 transition cursor-pointer flex items-center space-x-1.5"
          >
            <Vote className="w-4 h-4" />
            <span>Active Ballots</span>
          </button>
          <button
            onClick={() => onNavigate('verify')}
            className="px-5 py-2.5 rounded-xl bg-sky-800/80 hover:bg-sky-800 text-white font-semibold text-xs border border-white/20 transition cursor-pointer flex items-center space-x-1.5"
          >
            <Search className="w-4 h-4" />
            <span>Verify a Vote ID</span>
          </button>
        </div>
      </div>

      {/* Email Verification Warning if Unverified */}
      {user && !user.email_verified && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-amber-900">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">Email Verification Pending</div>
              <p className="text-xs text-amber-700 mt-0.5">
                Your email address (<strong>{user.email}</strong>) has not yet been verified. Unverified accounts cannot cast votes.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('verify-email')}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition cursor-pointer shrink-0"
          >
            Verify Email Now
          </button>
        </div>
      )}

      {/* Main Grid: Active Elections & Recent Voting Records */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Active Elections (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Vote className="w-5 h-5 text-sky-600" />
              <span>Active Elections Currently Open</span>
            </h2>
            <button
              onClick={() => onNavigate('elections')}
              className="text-xs font-semibold text-sky-600 hover:underline cursor-pointer"
            >
              View all &rarr;
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Loading elections...
            </div>
          ) : elections.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 space-y-2">
              <Clock className="w-8 h-8 mx-auto text-slate-400" />
              <div className="font-bold text-sm">No Active Elections</div>
              <p className="text-xs text-slate-400">There are currently no elections open for voting.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {elections.map((elec) => {
                const hasVoted = votedElectionIds.has(elec.id);
                return (
                  <div
                    key={elec.id}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition space-y-3"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                          <span>OPEN FOR VOTING</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-1">{elec.title}</h3>
                        <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                          {elec.description}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        {hasVoted ? (
                          <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Voted</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => onNavigate('ballot', { electionId: elec.id })}
                            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
                          >
                            <span>Cast Ballot</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-slate-400 pt-2 border-t border-slate-100">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Closes {new Date(elec.end_at).toLocaleDateString()}</span>
                      </span>
                      <span>&bull;</span>
                      <span>{elec.candidate_count || 0} Candidates</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Voter Receipts & Status (1 Col) */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>My Voting Receipts</span>
            </h2>
            <button
              onClick={() => onNavigate('my-votes')}
              className="text-xs font-semibold text-sky-600 hover:underline cursor-pointer"
            >
              All &rarr;
            </button>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            {myVotes.length === 0 ? (
              <div className="text-center py-6 text-slate-500 space-y-2">
                <Vote className="w-8 h-8 mx-auto text-slate-300" />
                <div className="text-xs font-semibold">No Ballots Cast Yet</div>
                <p className="text-[11px] text-slate-400">
                  When you participate in an election, your tamper-evident Vote ID will be saved here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {myVotes.map((v, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="text-xs font-bold text-slate-900 truncate">{v.election_title}</div>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-bold text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded">
                        {v.public_vote_id}
                      </span>
                      <button
                        onClick={() => onNavigate('verify')}
                        className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center space-x-0.5 cursor-pointer"
                      >
                        <span>Verify</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Cast on {new Date(v.voted_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 text-center">
              <button
                onClick={() => onNavigate('my-votes')}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                View Complete Voting Ledger
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
