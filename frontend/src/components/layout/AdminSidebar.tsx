import React from 'react';
import {
  LayoutDashboard,
  Vote,
  Users,
  SlidersHorizontal,
  KeyRound,
  FileCode2,
  PenTool,
  Network,
  ShieldCheck,
  Activity,
  AlertTriangle,
  History,
  BarChart3,
  GitBranch,
  Info,
  LogOut,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminSidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentView, onNavigate }) => {
  const { user, logout } = useAuth();

  const sections = [
    {
      title: 'Dashboard',
      items: [
        { id: 'admin-overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'admin-elections', label: 'Election Management', icon: Vote },
        { id: 'admin-voters', label: 'Voter Management', icon: Users },
        { id: 'admin-elections-status', label: 'Election Status', icon: SlidersHorizontal },
      ]
    },
    {
      title: 'Security',
      items: [
        { id: 'admin-sec-xcs256', label: 'XCS-256 Encryption', icon: KeyRound },
        { id: 'admin-sec-blake2s', label: 'BLAKE2s Hashes', icon: FileCode2 },
        { id: 'admin-sec-signatures', label: 'Ed25519 Signatures', icon: PenTool },
        { id: 'admin-sec-merkle', label: 'Merkle Tree', icon: Network },
        { id: 'admin-sec-verification', label: 'Vote Verification', icon: ShieldCheck },
        { id: 'admin-sec-integrity', label: 'System Integrity', icon: Activity },
      ]
    },
    {
      title: 'Monitoring',
      items: [
        { id: 'admin-mon-tamper', label: 'Tamper Detection Demo', icon: AlertTriangle, badge: 'SANDBOX' },
        { id: 'admin-mon-audit', label: 'Audit Logs', icon: History },
      ]
    },
    {
      title: 'Results',
      items: [
        { id: 'admin-results', label: 'Results Management', icon: BarChart3 },
      ]
    },
    {
      title: 'Documentation',
      items: [
        { id: 'admin-docs-workflow', label: 'Security Workflow', icon: GitBranch },
        { id: 'admin-docs-about', label: 'About the System', icon: Info },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-slate-950 font-black text-sm">
            AG
          </div>
          <div>
            <div className="font-bold text-white text-sm tracking-tight leading-none">ADMIN CONSOLE</div>
            <div className="text-[10px] text-sky-400 font-medium mt-1">Election Authority Portal</div>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-1.5">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                      active
                        ? 'bg-sky-600 text-white font-semibold shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
        <div className="flex items-center justify-between px-2 text-xs">
          <div className="truncate">
            <div className="font-semibold text-white truncate">{user?.name || 'Administrator'}</div>
            <div className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@evoting.gov'}</div>
          </div>
          <button
            onClick={() => {
              logout();
              onNavigate('home');
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => onNavigate('home')}
          className="w-full flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-sky-300 hover:bg-slate-800 transition cursor-pointer border border-slate-800"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Exit to Public Portal</span>
        </button>
      </div>
    </aside>
  );
};
