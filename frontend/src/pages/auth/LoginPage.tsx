import React, { useState } from 'react';
import { LogIn, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface LoginPageProps {
  onNavigate: (view: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.login(email.trim(), password);
      login(res.access_token, res.user);
      if (res.user.role === 'admin') {
        onNavigate('admin-overview');
      } else {
        onNavigate('voter-dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAccount = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-left">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mx-auto shadow-sm">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Voter Login</h1>
          <p className="text-xs text-slate-500">Sign in to access your registered voting portal</p>
        </div>

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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition flex items-center justify-center space-x-2 cursor-pointer mt-2"
          >
            <span>{loading ? 'Authenticating with Argon2id...' : 'Sign In as Voter'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast-fill Buttons */}
        <div className="pt-4 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
            Demo Test Accounts (Quick Fill):
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillQuickAccount('alice@university.edu', 'VoterAlice123!')}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-left font-medium transition cursor-pointer"
            >
              <div className="font-bold">Alice Walker</div>
              <div className="text-[10px] text-slate-400">Verified &bull; Has voted</div>
            </button>
            <button
              type="button"
              onClick={() => fillQuickAccount('charlie@university.edu', 'VoterCharlie123!')}
              className="p-2 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-left font-medium transition cursor-pointer"
            >
              <div className="font-bold">Charlie Brown</div>
              <div className="text-[10px] text-sky-600">Verified &bull; Ready to vote</div>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 space-y-2 pt-2">
          <div>
            Don't have an account?{' '}
            <button
              onClick={() => onNavigate('register')}
              className="text-sky-600 font-bold hover:underline cursor-pointer"
            >
              Register here
            </button>
          </div>
          <div>
            Need to confirm email?{' '}
            <button
              onClick={() => onNavigate('verify-email')}
              className="text-teal-600 font-bold hover:underline cursor-pointer"
            >
              Verify email code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
