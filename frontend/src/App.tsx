import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PublicNavbar } from './components/layout/PublicNavbar';
import { PublicFooter } from './components/layout/PublicFooter';
import { AdminSidebar } from './components/layout/AdminSidebar';
import { AdminNavbar } from './components/layout/AdminNavbar';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { VerifyVotePage } from './pages/public/VerifyVotePage';
import { HelpPage } from './pages/public/HelpPage';
import { PublicResultsPage } from './pages/public/PublicResultsPage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { AdminLoginPage } from './pages/auth/AdminLoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';

// Voter Pages
import { VoterDashboard } from './pages/voter/VoterDashboard';
import { ElectionsListPage } from './pages/voter/ElectionsListPage';
import { BallotPage } from './pages/voter/BallotPage';
import { VoteSubmittedPage } from './pages/voter/VoteSubmittedPage';
import { MyVotesPage } from './pages/voter/MyVotesPage';
import { VoterProfilePage } from './pages/voter/VoterProfilePage';

// Admin Pages
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminElectionsPage } from './pages/admin/AdminElectionsPage';
import { AdminVotersPage } from './pages/admin/AdminVotersPage';
import { AdminSecurityXCS256Page } from './pages/admin/AdminSecurityXCS256Page';
import { AdminSecurityHashesPage } from './pages/admin/AdminSecurityHashesPage';
import { AdminSecuritySignaturesPage } from './pages/admin/AdminSecuritySignaturesPage';
import { AdminSecurityMerklePage } from './pages/admin/AdminSecurityMerklePage';
import { AdminSecurityVerificationPage } from './pages/admin/AdminSecurityVerificationPage';
import { AdminSecurityIntegrityPage } from './pages/admin/AdminSecurityIntegrityPage';
import { AdminTamperDemoPage } from './pages/admin/AdminTamperDemoPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminResultsPage } from './pages/admin/AdminResultsPage';
import { AdminDocsSecurityWorkflowPage } from './pages/admin/AdminDocsSecurityWorkflowPage';
import { AdminDocsAboutPage } from './pages/admin/AdminDocsAboutPage';

function AppContent() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<string>('home');
  const [navData, setNavData] = useState<any>(null);

  const handleNavigate = (view: string, data?: any) => {
    setCurrentView(view);
    if (data !== undefined) setNavData(data);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAdminView = currentView.startsWith('admin-') && currentView !== 'admin-login';

  // Render Admin Experience
  if (isAdminView) {
    if (user?.role !== 'admin') {
      return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
            <p className="text-xs text-slate-600">
              Administrative credentials required. Please sign in through the official authority portal.
            </p>
            <button
              onClick={() => handleNavigate('admin-login')}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              Go to Admin Login
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-100 flex text-slate-900 antialiased font-sans">
        <AdminSidebar currentView={currentView} onNavigate={handleNavigate} />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminNavbar
            title={
              currentView === 'admin-overview' ? 'Authority Overview' :
              currentView === 'admin-elections' ? 'Election Management' :
              currentView === 'admin-voters' ? 'Voter Directory' :
              currentView === 'admin-elections-status' ? 'Election Lifecycle' :
              currentView === 'admin-sec-xcs256' ? 'XCS-256 Feistel Inspector' :
              currentView === 'admin-sec-blake2s' ? 'BLAKE2s Hashes' :
              currentView === 'admin-sec-signatures' ? 'Ed25519 Signatures' :
              currentView === 'admin-sec-merkle' ? 'Merkle Tree Ledger' :
              currentView === 'admin-sec-verification' ? 'Record Inspector' :
              currentView === 'admin-sec-integrity' ? 'System Integrity' :
              currentView === 'admin-mon-tamper' ? 'Tamper Detection Demo' :
              currentView === 'admin-mon-audit' ? 'Audit Trail' :
              currentView === 'admin-results' ? 'Results Management' :
              currentView === 'admin-docs-workflow' ? 'Security Workflow' :
              currentView === 'admin-docs-about' ? 'About & Viva Reference' : 'Admin Console'
            }
          />
          <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
            {currentView === 'admin-overview' && <AdminOverviewPage onNavigate={handleNavigate} />}
            {currentView === 'admin-elections' && <AdminElectionsPage onNavigate={handleNavigate} />}
            {currentView === 'admin-elections-status' && <AdminElectionsPage onNavigate={handleNavigate} />}
            {currentView === 'admin-voters' && <AdminVotersPage />}
            {currentView === 'admin-sec-xcs256' && <AdminSecurityXCS256Page />}
            {currentView === 'admin-sec-blake2s' && <AdminSecurityHashesPage />}
            {currentView === 'admin-sec-signatures' && <AdminSecuritySignaturesPage />}
            {currentView === 'admin-sec-merkle' && <AdminSecurityMerklePage />}
            {currentView === 'admin-sec-verification' && <AdminSecurityVerificationPage />}
            {currentView === 'admin-sec-integrity' && <AdminSecurityIntegrityPage />}
            {currentView === 'admin-mon-tamper' && <AdminTamperDemoPage />}
            {currentView === 'admin-mon-audit' && <AdminAuditLogsPage />}
            {currentView === 'admin-results' && <AdminResultsPage />}
            {currentView === 'admin-docs-workflow' && <AdminDocsSecurityWorkflowPage />}
            {currentView === 'admin-docs-about' && <AdminDocsAboutPage />}
          </main>
        </div>
      </div>
    );
  }

  // Render Public / Voter Experience
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 antialiased font-sans">
      <PublicNavbar currentView={currentView} onNavigate={handleNavigate} />
      <main className="flex-1">
        {currentView === 'home' && <LandingPage onNavigate={handleNavigate} />}
        {currentView === 'elections' && <ElectionsListPage onNavigate={handleNavigate} />}
        {currentView === 'verify' && <VerifyVotePage />}
        {currentView === 'help' && <HelpPage />}
        {currentView === 'public-results' && (
          <PublicResultsPage
            electionId={navData?.electionId || 1}
            onBack={() => handleNavigate('elections')}
          />
        )}
        {currentView === 'login' && <LoginPage onNavigate={handleNavigate} />}
        {currentView === 'admin-login' && <AdminLoginPage onNavigate={handleNavigate} />}
        {currentView === 'register' && (
          <RegisterPage
            onNavigate={handleNavigate}
            onSetPendingEmail={(e) => setNavData({ pendingEmail: e })}
          />
        )}
        {currentView === 'verify-email' && (
          <VerifyEmailPage
            initialEmail={navData?.pendingEmail || ''}
            onNavigate={handleNavigate}
          />
        )}
        {currentView === 'voter-dashboard' && <VoterDashboard onNavigate={handleNavigate} />}
        {currentView === 'ballot' && (
          <BallotPage
            electionId={navData?.electionId || 1}
            onNavigate={handleNavigate}
            onBack={() => handleNavigate('elections')}
          />
        )}
        {currentView === 'vote-submitted' && (
          <VoteSubmittedPage
            voteId={navData?.voteId || 'VOTE-UNKNOWN'}
            electionTitle={navData?.electionTitle}
            timestamp={navData?.timestamp}
            merkleIndex={navData?.merkleIndex}
            onNavigate={handleNavigate}
          />
        )}
        {currentView === 'my-votes' && (
          <MyVotesPage
            onNavigate={handleNavigate}
            onBack={() => handleNavigate('voter-dashboard')}
          />
        )}
        {currentView === 'profile' && (
          <VoterProfilePage
            onBack={() => handleNavigate('voter-dashboard')}
            onNavigate={handleNavigate}
          />
        )}
      </main>
      <PublicFooter onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
