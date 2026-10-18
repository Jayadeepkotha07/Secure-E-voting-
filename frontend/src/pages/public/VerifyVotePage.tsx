import React, { useState } from 'react';
import { Search, CheckCircle2, XCircle, ShieldCheck, FileCheck, Network, Lock, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { PublicVerificationResult } from '../../types';

export const VerifyVotePage: React.FC = () => {
  const [voteId, setVoteId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublicVerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!voteId.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.verification.verifyPublic(voteId.trim());
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Vote ID not found or invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Title & Introduction */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Independent Cryptographic Ballot Verification</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Verify My Vote
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Enter your unique Vote ID to confirm that your ballot has been recorded in the official election
          ledger and that its cryptographic integrity remains completely untampered.
        </p>
      </div>

      {/* Verification Input Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-md">
        <form onSubmit={handleVerify} className="space-y-4">
          <label className="block text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
            Enter Cryptographic Vote ID
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="e.g. VOTE-A7F9-82CD-93B4"
                value={voteId}
                onChange={(e) => setVoteId(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !voteId.trim()}
              className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Verifying...' : 'Verify Record'}</span>
            </button>
          </div>

          <div className="text-left text-xs text-slate-500 flex items-center space-x-1 pt-1">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Ballot secrecy guarantee: Your candidate choice is never revealed on this page.</span>
          </div>
        </form>

        {/* Quick Demo Helper */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-left">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Demo Helper (Sample Seed Vote IDs):
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setVoteId('VOTE-VV2I-V58R-IBWP');
              }}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs transition cursor-pointer"
            >
              Paste Alice's Vote ID
            </button>
            <button
              onClick={() => {
                setVoteId('VOTE-IIL4-G0H3-4JC2');
              }}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs transition cursor-pointer"
            >
              Paste Bob's Vote ID
            </button>
          </div>
        </div>
      </div>

      {/* Error Feedback */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-left flex items-start space-x-3 text-rose-800 text-sm">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">Verification Failed</div>
            <div>{error}</div>
            <div className="text-xs text-rose-600">Please double check that you entered the exact Vote ID as issued on your ballot confirmation.</div>
          </div>
        </div>
      )}

      {/* Success Result Card */}
      {result && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden text-left transition">
          {/* Header */}
          <div className={`p-6 text-white ${result.is_valid ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-rose-600'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {result.is_valid ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-200" />
                ) : (
                  <XCircle className="w-8 h-8 text-rose-200" />
                )}
                <div>
                  <h3 className="text-xl font-bold">
                    {result.is_valid ? 'Vote Record Cryptographically Verified' : 'Cryptographic Integrity Warning'}
                  </h3>
                  <p className="text-xs text-emerald-100 mt-0.5">{result.message}</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-white/20 px-3 py-1 rounded-full uppercase">
                {result.is_valid ? 'CONFIRMED VALID' : 'AUDIT FAILED'}
              </span>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Summary Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="text-xs text-slate-500 font-semibold uppercase">Election</div>
                <div className="text-sm font-bold text-slate-900 mt-1">{result.election_title}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="text-xs text-slate-500 font-semibold uppercase">Vote ID</div>
                <div className="text-sm font-mono font-bold text-sky-700 mt-1">{result.public_vote_id}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="text-xs text-slate-500 font-semibold uppercase">Recorded Timestamp</div>
                <div className="text-sm font-medium text-slate-700 mt-1">
                  {new Date(result.recorded_at).toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="text-xs text-slate-500 font-semibold uppercase">Recording Status</div>
                <div className="text-sm font-bold text-emerald-700 mt-1 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Recorded on Official Ledger</span>
                </div>
              </div>
            </div>

            {/* Cryptographic Checks Checklist */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Cryptographic Security Verification Checks:
              </div>

              <div className="space-y-2">
                {/* Check 1: BLAKE2s Hash */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <FileCheck className="w-4 h-4 text-sky-600" />
                    <div>
                      <div className="font-bold text-slate-800">BLAKE2s Canonical Record Hash</div>
                      <div className="text-slate-500 text-[11px]">Exact byte digest match; zero unauthorized changes.</div>
                    </div>
                  </div>
                  {result.hash_integrity_verified ? (
                    <span className="font-bold text-emerald-600 flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>MATCH</span>
                    </span>
                  ) : (
                    <span className="font-bold text-rose-600 flex items-center space-x-1">
                      <XCircle className="w-4 h-4" />
                      <span>MISMATCH</span>
                    </span>
                  )}
                </div>

                {/* Check 2: Ed25519 Signature */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div className="font-bold text-slate-800">Ed25519 Authority Digital Signature</div>
                      <div className="text-slate-500 text-[11px]">Signed by official Election Commission private key.</div>
                    </div>
                  </div>
                  {result.signature_verified ? (
                    <span className="font-bold text-emerald-600 flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>AUTHENTIC</span>
                    </span>
                  ) : (
                    <span className="font-bold text-rose-600 flex items-center space-x-1">
                      <XCircle className="w-4 h-4" />
                      <span>INVALID</span>
                    </span>
                  )}
                </div>

                {/* Check 3: Merkle Tree Inclusion */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <Network className="w-4 h-4 text-teal-600" />
                    <div>
                      <div className="font-bold text-slate-800">Merkle Tree Ledger Inclusion</div>
                      <div className="text-slate-500 text-[11px]">Cryptographic inclusion path confirms vote is in election root.</div>
                    </div>
                  </div>
                  {result.merkle_inclusion_verified ? (
                    <span className="font-bold text-emerald-600 flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>VERIFIED</span>
                    </span>
                  ) : (
                    <span className="font-bold text-rose-600 flex items-center space-x-1">
                      <XCircle className="w-4 h-4" />
                      <span>NOT FOUND</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Privacy Confirmation Banner */}
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs leading-relaxed flex items-start space-x-2.5">
              <Lock className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <strong>Ballot Secrecy Confirmed:</strong> Your selection is protected inside the encrypted payload using
                our 4-round hybrid Feistel cipher (XCS-256). Neither public observers nor network eavesdroppers can inspect
                or decipher your candidate choice from this verification proof.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
