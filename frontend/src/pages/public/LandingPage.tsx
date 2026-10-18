import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Vote,
  FileCheck,
  Search,
  Key,
  Fingerprint,
  Cpu,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LandingPageProps {
  onNavigate: (view: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/80 via-white to-slate-50 border-b border-slate-200 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headline and Actions */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-sky-100/80 border border-sky-200 text-sky-800 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>Next-Generation Cryptographic Democracy</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Secure and Simple <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-teal-600">
                  Online Voting.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                Cast your ballot with absolute confidence. Every vote is cryptographically encrypted using our
                experimental <strong>XCS-256 Feistel cipher</strong>, verified with <strong>BLAKE2s digests</strong>,
                digitally signed with <strong>Ed25519</strong>, and sealed within a tamper-evident <strong>Merkle Tree</strong>.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
                <button
                  onClick={() => onNavigate(user ? 'elections' : 'login')}
                  className="px-6 py-3.5 rounded-xl text-base font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-600/25 transition flex items-center justify-center space-x-2 cursor-pointer group"
                >
                  <span>Vote Now</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </button>

                <button
                  onClick={() => onNavigate('help')}
                  className="px-6 py-3.5 rounded-xl text-base font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Learn How It Works</span>
                </button>

                <button
                  onClick={() => onNavigate('verify')}
                  className="px-6 py-3.5 rounded-xl text-base font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 shadow-xs transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Search className="w-4 h-4 text-teal-600" />
                  <span>Verify a Vote</span>
                </button>
              </div>

              <div className="flex items-center space-x-6 pt-4 text-xs font-medium text-slate-500">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>One Vote Per Citizen</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Lock className="w-4 h-4 text-sky-500" />
                  <span>Zero-Knowledge Verification</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Fingerprint className="w-4 h-4 text-indigo-500" />
                  <span>Tamper-Evident</span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Architecture / Portal Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden">
                {/* Header of Simulated Ballot Receipt */}
                <div className="bg-gradient-to-r from-sky-600 to-teal-600 px-6 py-4 text-white">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Vote className="w-5 h-5 text-sky-200" />
                      <span className="font-bold text-sm tracking-wide">BALLOT VERIFICATION PASS</span>
                    </div>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-mono font-semibold">SECURE SEAL</span>
                  </div>
                </div>

                <div className="p-6 space-y-5 text-left text-xs">
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Cryptographic Vote ID</div>
                    <div className="font-mono text-sm font-black text-sky-700 bg-sky-50 p-2.5 rounded-lg border border-sky-100 flex items-center justify-between">
                      <span>VOTE-A7F9-82CD-93B4</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-slate-600">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Encryption</div>
                      <div className="font-semibold text-slate-900 mt-0.5">XCS-256 Hybrid</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Record Hash</div>
                      <div className="font-semibold text-slate-900 mt-0.5">BLAKE2s (256-bit)</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Signature</div>
                      <div className="font-semibold text-slate-900 mt-0.5">Ed25519 Authority</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Ledger Proof</div>
                      <div className="font-semibold text-emerald-700 mt-0.5">Merkle Included</div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 text-emerald-900 p-3 rounded-xl border border-emerald-200 text-[11px] leading-relaxed flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Your vote is private and sealed:</strong> Anyone holding this Vote ID can verify that the ballot
                      has not been modified, without ever revealing which candidate you voted for.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Built on Rigorous Cryptographic Foundations
          </h2>
          <p className="text-slate-600 mt-3 text-sm sm:text-base">
            Every layer of the voting lifecycle is engineered to guarantee individual voter privacy and collective election integrity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition text-left space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center group-hover:scale-105 transition">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Secure Voting</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Ballots are encrypted with XCS-256, an experimental 4-round hybrid Feistel construction alternating
              raw XChaCha20 and Serpent round functions, authenticated with keyed HMAC-SHA256 Encrypt-then-MAC.
            </p>
            <div className="pt-2 text-xs font-semibold text-sky-600 flex items-center space-x-1">
              <span>Encrypted at rest &amp; in transit</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition text-left space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center group-hover:scale-105 transition">
              <Fingerprint className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Easy to Use</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Straightforward and approachable for ordinary voters. Register in moments, confirm your email, review candidate
              profiles, review your ballot with clear warnings, and vote in seconds from any device.
            </p>
            <div className="pt-2 text-xs font-semibold text-teal-600 flex items-center space-x-1">
              <span>Universal accessibility</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition text-left space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Verify Your Vote</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Every voter receives a non-sequential, unpredictable Vote ID to verify that their vote record is securely
              recorded and anchored in the election Merkle root, without exposing candidate choices to anyone.
            </p>
            <div className="pt-2 text-xs font-semibold text-indigo-600 flex items-center space-x-1">
              <span>Independent voter auditing</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Workflow Section */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-xs font-bold text-sky-400 uppercase tracking-widest mb-2">Simplicity &bull; Integrity &bull; Trust</div>
            <h2 className="text-3xl font-extrabold tracking-tight">Four-Step Voting Workflow</h2>
            <p className="text-slate-400 text-sm mt-2">
              From authentication to public cryptographic verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
            {/* Step 1 */}
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-sm border border-sky-500/40">
                1
              </div>
              <h3 className="text-base font-bold text-white">Login &amp; Authenticate</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Log into your verified student or voter account using Argon2id-secured credentials.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center text-sm border border-teal-500/40">
                2
              </div>
              <h3 className="text-base font-bold text-white">Choose Candidate</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inspect candidate backgrounds, agendas, and manifestos before making your selection.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-sm border border-indigo-500/40">
                3
              </div>
              <h3 className="text-base font-bold text-white">Submit Vote</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Review your selection and seal your vote. An irreversible transaction saves your encrypted record.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm border border-emerald-500/40">
                4
              </div>
              <h3 className="text-base font-bold text-white">Receive Vote ID</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Save your unique non-sequential Vote ID to verify your vote status on the public ledger anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-sky-600 to-teal-600 rounded-3xl p-8 sm:p-12 text-white shadow-xl text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to participate in the democratic process?
          </h2>
          <p className="text-sm sm:text-base text-sky-100 max-w-2xl mx-auto leading-relaxed">
            Register your account, explore open ballots, or audit existing votes using our cryptographic verification engine.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => onNavigate(user ? 'elections' : 'login')}
              className="px-6 py-3 rounded-xl bg-white text-sky-700 font-bold hover:bg-sky-50 transition shadow-md cursor-pointer"
            >
              Get Started Now
            </button>
            <button
              onClick={() => onNavigate('verify')}
              className="px-6 py-3 rounded-xl bg-sky-700/60 hover:bg-sky-700 text-white font-semibold transition border border-white/20 cursor-pointer"
            >
              Verify Existing Vote ID
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
