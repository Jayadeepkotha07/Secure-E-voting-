import React from 'react';
import { GitBranch, ShieldCheck, Key, Lock, FileCode, CheckCircle2, Network, Activity, BarChart3, ArrowDown } from 'lucide-react';

export const AdminDocsSecurityWorkflowPage: React.FC = () => {
  const steps = [
    {
      num: 1,
      title: 'Voter Selection & Ballot Payload Construction',
      icon: Lock,
      color: 'bg-sky-50 text-sky-700 border-sky-200',
      desc: 'The voter selects a candidate. The client transmits ballot data to the trusted backend over TLS. Plaintext is packaged with high-entropy voter randomness into structured JSON.'
    },
    {
      num: 2,
      title: 'HKDF-SHA256 Key & Nonce Derivation',
      icon: Key,
      color: 'bg-teal-50 text-teal-700 border-teal-200',
      desc: 'Using a 32-byte secret Master Authority Key and a fresh 32-byte public per-record salt, HKDF-SHA256 derives cryptographically separated keys and nonces with distinct domain labels for every round and MAC.'
    },
    {
      num: 3,
      title: 'XCS-256 Hybrid 4-Round Feistel Encryption',
      icon: ShieldCheck,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      desc: 'The ballot is padded to 32-byte blocks and processed through 4 alternating Feistel rounds: R1 (XChaCha20), R2 (Serpent), R3 (XChaCha20), R4 (Serpent). Encrypt-then-MAC computes an HMAC-SHA256 authentication tag.'
    },
    {
      num: 4,
      title: 'Canonical Byte Serialization & BLAKE2s Hashing',
      icon: FileCode,
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      desc: 'The encrypted package, public salt, version, and timestamp are deterministically formatted into canonical JSON. BLAKE2s-256 computes a fixed 32-byte collision-resistant fingerprint.'
    },
    {
      num: 5,
      title: 'Ed25519 Digital Signature by Election Authority',
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      desc: 'The Election Authority backend signs the 32-byte BLAKE2s record hash using its private signing key, creating an undeniable 64-byte authenticity seal.'
    },
    {
      num: 6,
      title: 'Merkle Tree Ledger Integration & Root Anchor',
      icon: Network,
      color: 'bg-purple-50 text-purple-800 border-purple-200',
      desc: 'The record hash is added as a leaf node (with 0x00 domain prefix). Internal nodes (0x01 prefix) are combined into a binary tree, updating the 32-byte Merkle root on the election record.'
    },
    {
      num: 7,
      title: 'Tamper-Evident Auditing & Non-Traceable Verification',
      icon: Activity,
      color: 'bg-rose-50 text-rose-800 border-rose-200',
      desc: 'Voters receive an unpredictable Vote ID. Public verification confirms the record is valid and anchored in the Merkle root without ever disclosing the voter choice.'
    },
    {
      num: 8,
      title: 'Closed Election Decryption & Certified Results',
      icon: BarChart3,
      color: 'bg-sky-50 text-sky-800 border-sky-200',
      desc: 'After an election closes, the Authority Master Key authenticates and decrypts all accepted ballots in memory, calculates exact vote counts, and publishes certified results.'
    }
  ];

  return (
    <div className="space-y-8 text-left">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Security Pipeline Architecture</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          End-to-end cryptographic lifecycle from ballot creation to verified election tallying.
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <React.Fragment key={s.num}>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex items-start space-x-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${s.color}`}>
                  {s.num}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4 text-slate-600" />
                    <h3 className="text-sm font-bold text-slate-900">{s.title}</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex justify-center -my-2">
                  <ArrowDown className="w-4 h-4 text-slate-300" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
