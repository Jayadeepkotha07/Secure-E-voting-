import React, { useState } from 'react';
import { Lock, Mail, ShieldAlert, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface AdminLoginPageProps {
  onNavigate: (view: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onNavigate }) => {
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
      const res = await api.auth.adminLogin(email.trim(), password);
      login(res.access_token, res.user);
      onNavigate('admin-overview');
    } catch (err: any) {
      setError(err.message || 'Administrative authentication failed. Access denied.');
    } finally {
      setLoading(false);
    }
  };

  const fillAdminAccount = () => {
    setEmail('admin@evoting.gov');
    setPassword('AdminSecurePass123!');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-left">
      <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl p-8 space-y-6">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Public Portal</span>
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Election Authority Console</h1>
          <p className="text-xs text-slate-400">Restricted portal for certified election officials and system auditors</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Authority Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="admin@evoting.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Security Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-sm shadow-md transition flex items-center justify-center space-x-2 cursor-pointer mt-2"
          >
            <span>{loading ? 'Verifying Credentials...' : 'Authenticate Official Access'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast-fill for Admin */}
        <div className="pt-4 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={fillAdminAccount}
            className="w-full p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-sky-400 text-xs font-semibold transition cursor-pointer flex items-center justify-center space-x-2"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Fill Seed Administrator Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
