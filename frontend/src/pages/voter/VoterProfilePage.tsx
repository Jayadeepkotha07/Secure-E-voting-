import React from 'react';
import { User, Mail, ShieldCheck, AlertTriangle, ArrowLeft, Key, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface VoterProfilePageProps {
  onBack: () => void;
  onNavigate: (view: string) => void;
}

export const VoterProfilePage: React.FC<VoterProfilePageProps> = ({ onBack, onNavigate }) => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 text-center text-slate-500">
        Please log in to view your voter profile.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8 text-left">
      <button
        onClick={onBack}
        className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-sky-600 to-teal-600 p-8 text-white space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center font-black text-2xl text-white shadow-sm">
            {user.name.charAt(0)}
          </div>
          <h1 className="text-2xl font-black">{user.name}</h1>
          <p className="text-xs text-sky-100 flex items-center space-x-1">
            <Mail className="w-3.5 h-3.5" />
            <span>{user.email}</span>
          </p>
        </div>

        {/* Profile Details */}
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 font-semibold uppercase">Account Role</span>
              <div className="font-bold text-slate-900 text-sm mt-0.5 capitalize">{user.role}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 font-semibold uppercase">Account Status</span>
              <div className="font-bold text-emerald-700 text-sm mt-0.5 capitalize flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{user.account_status}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 font-semibold uppercase">Email Verification</span>
              <div className="mt-0.5">
                {user.email_verified ? (
                  <span className="font-bold text-emerald-700 text-sm flex items-center space-x-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Verified Citizen</span>
                  </span>
                ) : (
                  <span className="font-bold text-amber-600 text-sm flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Unverified</span>
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 font-semibold uppercase">Registration Date</span>
              <div className="font-medium text-slate-700 text-xs mt-0.5">
                {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {!user.email_verified && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex justify-between items-center">
              <div>Your account requires email verification before casting ballots.</div>
              <button
                onClick={() => onNavigate('verify-email')}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition cursor-pointer shrink-0"
              >
                Verify Now
              </button>
            </div>
          )}

          <div className="p-4 rounded-xl bg-slate-100 text-slate-600 text-[11px] leading-relaxed">
            <strong>Password &amp; Privacy:</strong> Passwords are cryptographic hashes produced using Argon2id
            with memory-hard parameters. Raw passwords and password hashes are never exposed to clients or public endpoints.
          </div>
        </div>
      </div>
    </div>
  );
};
