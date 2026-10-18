import React, { useEffect, useState } from 'react';
import {
  Vote,
  AlertTriangle,
  Lock,
  CheckCircle2,
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  User,
  Info
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Election, Candidate } from '../../types';

interface BallotPageProps {
  electionId: number;
  onNavigate: (view: string, data?: any) => void;
  onBack: () => void;
}

export const BallotPage: React.FC<BallotPageProps> = ({ electionId, onNavigate, onBack }) => {
  const { user } = useAuth();
  const [election, setElection] = useState<Election | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchElection = async () => {
      try {
        const data = await api.elections.getDetail(electionId);
        setElection(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load ballot details.');
      } finally {
        setLoading(false);
      }
    };
    fetchElection();
  }, [electionId]);

  const handleConfirmSubmit = async () => {
    if (!selectedCandidateId) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.voting.castVote(electionId, selectedCandidateId);
      setShowConfirmModal(false);
      // Navigate to Vote Submitted receipt page
      onNavigate('vote-submitted', {
        voteId: res.public_vote_id,
        electionTitle: election?.title,
        timestamp: res.created_at,
        merkleIndex: res.merkle_index
      });
    } catch (err: any) {
      setError(err.message || 'Ballot submission failed. You may have already cast a vote.');
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCandidate = election?.candidates?.find((c) => c.id === selectedCandidateId);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <div>Loading official ballot...</div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <div className="text-rose-600 font-bold">Election not found</div>
        <button onClick={onBack} className="text-xs text-sky-600 underline">
          &larr; Back to Elections
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Elections</span>
      </button>

      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-3">
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            Official Ballot
          </span>
          <span className="text-xs text-slate-400">Election ID: #{election.id}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {election.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
          {election.description}
        </p>

        {/* Warning Banner */}
        <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">CRITICAL VOTER NOTICE — SINGLE IRREVERSIBLE SUBMISSION</div>
            <div>
              Each verified voter may submit exactly <strong>one ballot</strong>. Once submitted, your vote is cryptographically
              sealed with our XCS-256 Feistel cipher and signed with Ed25519. <strong>It cannot be altered, recast, or recalled.</strong>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Candidate Selection List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider text-xs">
            Select Exactly One Candidate:
          </h2>
          <span className="text-xs text-slate-400">
            {election.candidates?.length || 0} Certified Candidates
          </span>
        </div>

        <div className="space-y-3">
          {election.candidates?.map((candidate) => {
            const isSelected = selectedCandidateId === candidate.id;
            return (
              <div
                key={candidate.id}
                onClick={() => setSelectedCandidateId(candidate.id)}
                className={`p-5 rounded-2xl border transition cursor-pointer flex items-start space-x-4 ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/60 ring-2 ring-sky-500/20 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                {/* Radio button styling */}
                <div className="mt-1">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                      isSelected ? 'border-sky-600 bg-sky-600' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                  </div>
                </div>

                {/* Candidate Information */}
                <div className="flex-1 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="font-bold text-slate-900 text-base">{candidate.display_name}</span>
                    {candidate.party && (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 w-fit">
                        {candidate.party}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    {candidate.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submission Action Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-xs text-slate-500 flex items-center space-x-2">
          <Lock className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            {selectedCandidate
              ? `Selected: ${selectedCandidate.display_name}`
              : 'Please make a selection to enable ballot submission'}
          </span>
        </div>

        <button
          onClick={() => setShowConfirmModal(true)}
          disabled={!selectedCandidateId || submitting}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white font-bold text-sm shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Vote className="w-4 h-4" />
          <span>Review &amp; Cast Vote</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Confirm Your Final Vote</h3>
              <p className="text-xs text-slate-600">
                You are about to cryptographically seal your vote for:
              </p>
              <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-sky-900 font-bold text-base mt-2">
                {selectedCandidate.display_name}
                {selectedCandidate.party && (
                  <div className="text-xs text-sky-600 font-normal">{selectedCandidate.party}</div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs leading-relaxed space-y-1">
              <div className="font-bold flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Irreversible Action Warning:</span>
              </div>
              <div>
                This vote will be cryptographically bound to the election ledger. You cannot change, cancel, or re-cast this ballot.
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>{submitting ? 'Sealing Ballot...' : 'Confirm & Cast Vote'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
