import React, { useState } from 'react';
import { MailCheck, Mail, KeyRound, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface VerifyEmailPageProps {
  initialEmail?: string;
  onNavigate: (view: string) => void;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ initialEmail = '', onNavigate }) => {
  const { user, refreshUser } = useAuth();
  const [email, setEmail] = useState(user?.email || initialEmail || '');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(user?.email_verified || false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !token) return;

    setLoading(true);
    setError(null);
    try {
      await api.auth.verifyEmail(email.trim(), token.trim());
      setVerified(true);
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Verification failed. Invalid or expired confirmation code.');
    } finally {
      setLoading(false);
    }
  };

  const fillDaveHelper = () => {
    setEmail('dave@university.edu');
    setToken('123456');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-left">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto shadow-sm">
            <MailCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Email Verification</h1>
          <p className="text-xs text-slate-500">Unverified accounts are restricted from casting ballots</p>
        </div>

        {verified ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-4 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-base">Account Successfully Verified!</div>
              <p className="text-xs text-emerald-700 mt-1">
                Your email is confirmed and your account is now eligible to cast verifiable ballots in active elections.
              </p>
            </div>
            <button
              onClick={() => onNavigate(user ? 'voter-dashboard' : 'login')}
              className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              Continue to {user ? 'Voter Dashboard' : 'Login'}
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="voter@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Verification Code</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="6-digit verification code"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !token.trim() || !email.trim()}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition flex items-center justify-center space-x-2 cursor-pointer mt-2"
              >
                <span>{loading ? 'Verifying Code...' : 'Confirm Email Verification'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Helper for Test Voter Dave */}
            <div className="pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={fillDaveHelper}
                className="text-xs text-sky-600 hover:text-sky-700 font-semibold cursor-pointer underline"
              >
                Demo: Fill unverified test voter (Dave: code 123456)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
