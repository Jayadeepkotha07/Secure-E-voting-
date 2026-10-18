import React, { useEffect, useState } from 'react';
import {
  Vote,
  Plus,
  Play,
  Square,
  BarChart3,
  CheckCircle2,
  Calendar,
  AlertCircle,
  X,
  UserPlus
} from 'lucide-react';
import { api } from '../../services/api';
import { Election } from '../../types';

interface AdminElectionsPageProps {
  onNavigate: (view: string, data?: any) => void;
}

export const AdminElectionsPage: React.FC<AdminElectionsPageProps> = ({ onNavigate }) => {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddCandModal, setShowAddCandModal] = useState<number | null>(null);

  // Create form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Candidate form state
  const [candName, setCandName] = useState('');
  const [candParty, setCandParty] = useState('');
  const [candDesc, setCandDesc] = useState('');

  const fetchElections = async () => {
    setLoading(true);
    try {
      const data = await api.elections.list();
      setElections(data);
    } catch (err: any) {
      console.error('Failed to load elections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElections();
  }, []);

  const handleCreateElection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !startAt || !endAt) return;
    setError(null);
    try {
      await api.admin.createElection({
        title,
        description,
        start_at: new Date(startAt).toISOString(),
        end_at: new Date(endAt).toISOString(),
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      fetchElections();
    } catch (err: any) {
      setError(err.message || 'Failed to create election.');
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddCandModal || !candName || !candDesc) return;
    try {
      await api.admin.addCandidate(showAddCandModal, {
        display_name: candName,
        party: candParty || undefined,
        description: candDesc,
      });
      setShowAddCandModal(null);
      setCandName('');
      setCandParty('');
      setCandDesc('');
      fetchElections();
    } catch (err: any) {
      alert(err.message || 'Failed to add candidate.');
    }
  };

  const handleStatusChange = async (electionId: number, newStatus: string) => {
    try {
      await api.admin.changeElectionStatus(electionId, newStatus);
      fetchElections();
    } catch (err: any) {
      alert(err.message || `Cannot transition election to ${newStatus}`);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Election Lifecycle Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure ballots, enforce valid state transitions, and oversee cryptographic tallies.
          </p>
        </div>

        <button
          onClick={() => {
            const now = new Date();
            const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            setStartAt(now.toISOString().slice(0, 16));
            setEndAt(future.toISOString().slice(0, 16));
            setShowCreateModal(true);
          }}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Election</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading elections...</div>
      ) : (
        <div className="space-y-4">
          {elections.map((elec) => (
            <div
              key={elec.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                        elec.status === 'open'
                          ? 'bg-emerald-100 text-emerald-800'
                          : elec.status === 'published'
                          ? 'bg-sky-100 text-sky-800'
                          : elec.status === 'closed'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {elec.status}
                    </span>
                    <span className="text-xs text-slate-400">Election #{elec.id}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{elec.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{elec.description}</p>
                </div>

                {/* State Transition Actions */}
                <div className="flex items-center space-x-2 shrink-0">
                  {elec.status === 'draft' && (
                    <button
                      onClick={() => handleStatusChange(elec.id, 'open')}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Open Election</span>
                    </button>
                  )}

                  {elec.status === 'open' && (
                    <button
                      onClick={() => handleStatusChange(elec.id, 'closed')}
                      className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>Close Voting</span>
                    </button>
                  )}

                  {elec.status === 'closed' && (
                    <button
                      onClick={() => onNavigate('admin-results')}
                      className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Tally &amp; Publish Results</span>
                    </button>
                  )}

                  {elec.status !== 'closed' && elec.status !== 'published' && (
                    <button
                      onClick={() => setShowAddCandModal(elec.id)}
                      className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center space-x-1 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Candidate</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Stats & Metadata Row */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                <div className="flex items-center space-x-4">
                  <span>Candidates: <strong>{elec.candidate_count || 0}</strong></span>
                  <span>&bull;</span>
                  <span>Ballots Cast: <strong>{elec.vote_count || 0}</strong></span>
                  <span>&bull;</span>
                  <span>Closes: {new Date(elec.end_at).toLocaleDateString()}</span>
                </div>

                {elec.merkle_root && (
                  <div className="font-mono text-[11px] text-slate-700 truncate max-w-xs">
                    Root: <span className="bg-slate-100 px-1.5 py-0.5 rounded">{elec.merkle_root.slice(0, 16)}...</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Election Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl text-left">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Create New Election</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateElection} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Election Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026 Faculty Senate Representative"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the objective, scope, and rules for this election."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Start Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">End Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md"
                >
                  Create Election
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {showAddCandModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl text-left">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Add Candidate</h3>
              <button
                onClick={() => setShowAddCandModal(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCandidate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Candidate Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jane Smith"
                  value={candName}
                  onChange={(e) => setCandName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Party / Affiliation</label>
                <input
                  type="text"
                  placeholder="e.g. Independent Student Alliance"
                  value={candParty}
                  onChange={(e) => setCandParty(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Biography &amp; Agenda</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Brief background and campaign statement."
                  value={candDesc}
                  onChange={(e) => setCandDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCandModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md"
                >
                  Add Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
