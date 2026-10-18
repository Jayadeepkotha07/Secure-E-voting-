import React from 'react';
import { ShieldCheck, Vote, CheckCircle2, HelpCircle, LogIn, UserPlus, LogOut, LayoutDashboard, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface PublicNavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({ currentView, onNavigate }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner */}
      <div className="bg-slate-900 text-slate-300 px-4 py-1.5 text-xs font-medium flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Official Cryptographic Voting Ledger Active &bull; BLAKE2s &amp; Merkle Tree Audited</span>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onNavigate('admin-login')}
            className="text-slate-400 hover:text-white transition flex items-center space-x-1 cursor-pointer"
          >
            <Lock className="w-3 h-3 text-sky-400" />
            <span>Admin? Sign in here</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Portal Title */}
          <div
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 tracking-tight text-lg flex items-center space-x-1.5">
                <span>SECURE E-VOTING</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 uppercase tracking-wider">v1.0</span>
              </div>
              <div className="text-xs text-slate-500 font-medium">Official Election Portal</div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                currentView === 'home' ? 'text-sky-600 bg-sky-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('elections')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                currentView === 'elections' ? 'text-sky-600 bg-sky-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Vote className="w-4 h-4" />
              <span>Elections</span>
            </button>
            <button
              onClick={() => onNavigate('verify')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                currentView === 'verify' ? 'text-sky-600 bg-sky-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Verify My Vote</span>
            </button>
            <button
              onClick={() => onNavigate('help')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                currentView === 'help' ? 'text-sky-600 bg-sky-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Help &amp; FAQ</span>
            </button>
          </nav>

          {/* User Auth Action Buttons */}
          <div className="flex items-center space-x-2">
            {user ? (
              <div className="flex items-center space-x-2">
                {user.role === 'admin' ? (
                  <button
                    onClick={() => onNavigate('admin-overview')}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  >
                    <Lock className="w-3.5 h-3.5 text-sky-400" />
                    <span>Admin Console</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate('voter-dashboard')}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 transition flex items-center space-x-1.5 cursor-pointer border border-sky-200"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>{user.name.split(' ')[0]}'s Portal</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    logout();
                    onNavigate('home');
                  }}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onNavigate('login')}
                  className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-sky-600 hover:bg-slate-50 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Voter Login</span>
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-xs shadow-sky-600/30 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
