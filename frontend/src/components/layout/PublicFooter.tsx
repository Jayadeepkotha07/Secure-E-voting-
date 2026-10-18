import React from 'react';
import { Shield, Lock, FileCheck, Cpu } from 'lucide-react';

interface PublicFooterProps {
  onNavigate: (view: string) => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Project Identity */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center space-x-2 text-white font-bold text-lg">
              <Shield className="w-5 h-5 text-sky-400" />
              <span>SECURE E-VOTING</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              A Secure Online Voting System with Enhanced Vote Verification and Tamper-Evident Auditing.
            </p>
            <div className="text-xs font-semibold text-sky-400 pt-1">
              Domain: Cryptography and Network Security
            </div>
          </div>

          {/* Column 2: Public Navigation */}
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider mb-3">Voter Resources</div>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-white transition cursor-pointer">
                  Official Portal Home
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('elections')} className="hover:text-white transition cursor-pointer">
                  Active &amp; Upcoming Elections
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('verify')} className="hover:text-white transition cursor-pointer">
                  Verify My Vote Record
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('help')} className="hover:text-white transition cursor-pointer">
                  Voter Security FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Cryptographic Primitives */}
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider mb-3">Cryptographic Stack</div>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-teal-400" />
                <span>XCS-256: 4-Round Feistel (Research)</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-sky-400" />
                <span>HMAC-SHA256 Encrypt-then-MAC</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>BLAKE2s Deterministic Canonical Hashing</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ed25519 Signatures &amp; Merkle Root Auditing</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Institutional Disclaimer */}
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider mb-3">Academic Demonstration</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Developed as a demonstration of applied cryptography in electronic democracy.
              Ballot choices are encrypted and never stored in plaintext. Candidate selections are strictly decoupled
              from public verification outputs.
            </p>
            <div className="mt-3">
              <button
                onClick={() => onNavigate('admin-login')}
                className="text-xs text-slate-400 hover:text-sky-300 transition flex items-center space-x-1 cursor-pointer"
              >
                <span>Authorized Official Access &rarr;</span>
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
          <div>&copy; {new Date().getFullYear()} Secure E-Voting Portal &bull; Department of Computer Science &amp; Engineering</div>
          <div className="mt-2 sm:mt-0 flex space-x-4">
            <span>Argon2id Authentication</span>
            <span>&bull;</span>
            <span>Zero Unverified Votes</span>
            <span>&bull;</span>
            <span>Immutable Audit Trail</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
