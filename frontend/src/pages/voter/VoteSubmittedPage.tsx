import React, { useState } from 'react';
import { CheckCircle2, Copy, Check, ArrowRight, ShieldCheck, Search, Lock } from 'lucide-react';

interface VoteSubmittedPageProps {
  voteId: string;
  electionTitle?: string;
  timestamp?: string;
  merkleIndex?: number;
  onNavigate: (view: string) => void;
}

export const VoteSubmittedPage: React.FC<VoteSubmittedPageProps> = ({
  voteId,
  electionTitle = 'Institutional Election',
  timestamp,
  merkleIndex,
  onNavigate
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(voteId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-left">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Vote Cryptographically Recorded!
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-md mx-auto">
            Your ballot has been sealed with XCS-256, hashed with BLAKE2s, signed with Ed25519, and permanently stored.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Vote ID Box */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
              Your Official Cryptographic Vote ID:
            </div>
            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between gap-2">
              <span className="font-mono text-base sm:text-lg font-black text-sky-800 tracking-wider truncate">
                {voteId}
              </span>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-semibold shadow-xs transition flex items-center space-x-1 cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Details Table */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Election:</span>
              <span className="font-semibold text-slate-900">{electionTitle}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Timestamp (UTC):</span>
              <span className="font-mono text-slate-700">
                {timestamp ? new Date(timestamp).toUTCString() : new Date().toUTCString()}
              </span>
            </div>
            {merkleIndex !== undefined && (
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Merkle Leaf Position:</span>
                <span className="font-mono text-slate-700">Leaf Index #{merkleIndex}</span>
              </div>
            )}
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Security Verification:</span>
              <span className="font-bold text-emerald-700">Signed &bull; Merkle Anchored</span>
            </div>
          </div>

          {/* Privacy Explanation Note */}
          <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs leading-relaxed flex items-start space-x-2.5">
            <Lock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong>Why save your Vote ID?</strong> This unpredictable, non-sequential identifier lets you audit
              that your ballot is recorded without allowing anyone—including officials—to link it back to your
              selected candidate choice.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => onNavigate('verify')}
              className="flex-1 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Verify My Vote Now</span>
            </button>
            <button
              onClick={() => onNavigate('voter-dashboard')}
              className="flex-1 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center justify-center space-x-1 cursor-pointer"
            >
              <span>Back to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
