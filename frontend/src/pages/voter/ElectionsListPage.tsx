import React, { useEffect, useState } from 'react';
import { Vote, Calendar, CheckCircle2, ArrowRight, BarChart3, Clock, Filter } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Election, MyVoteSummary } from '../../types';

interface ElectionsListPageProps {
  onNavigate: (view: string, data?: any) => void;
}

export const ElectionsListPage: React.FC<ElectionsListPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [myVotes, setMyVotes] = useState<MyVoteSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const filter = statusFilter === 'all' ? undefined : statusFilter;
        const [elecList, votesList] = await Promise.all([
          api.elections.list(filter),
          user ? api.voting.getMyVotes().catch(() => []) : Promise.resolve([]),
        ]);
        setElections(elecList);
        setMyVotes(votesList);
      } catch (err) {
        console.error('Failed to load elections:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [statusFilter, user]);

  const votedElectionIds = new Set(myVotes.map((v) => v.election_id));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Institutional Elections</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse active democratic ballots, closed elections, and verified certified tallies.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-200/80 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('open')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              statusFilter === 'open' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Open Now
          </button>
          <button
            onClick={() => setStatusFilter('closed')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              statusFilter === 'closed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Closed
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              statusFilter === 'published' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Results Published
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading elections...</div>
      ) : elections.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 space-y-2">
          <Vote className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="font-bold text-base">No Elections Found</div>
          <p className="text-xs text-slate-400">No elections match the selected status filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {elections.map((elec) => {
            const hasVoted = votedElectionIds.has(elec.id);
            const isOpen = elec.status === 'open';
            const isPublished = elec.status === 'published';

            return (
              <div
                key={elec.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                        isOpen
                          ? 'bg-emerald-100 text-emerald-800'
                          : isPublished
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {elec.status}
                    </span>

                    <span className="text-xs text-slate-400 flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Closes {new Date(elec.end_at).toLocaleDateString()}</span>
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-slate-900 leading-snug">{elec.title}</h2>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {elec.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500 font-medium">
                    <span>{elec.candidate_count || 0} Candidates</span>
                    <span className="mx-2">&bull;</span>
                    <span>{elec.vote_count || 0} Votes</span>
                  </div>

                  <div>
                    {isOpen ? (
                      hasVoted ? (
                        <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Ballot Cast</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            if (!user) {
                              onNavigate('login');
                            } else {
                              onNavigate('ballot', { electionId: elec.id });
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
                        >
                          <span>Cast Vote</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )
                    ) : isPublished ? (
                      <button
                        onClick={() => onNavigate('public-results', { electionId: elec.id })}
                        className="px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>View Results</span>
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">Voting Closed</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
