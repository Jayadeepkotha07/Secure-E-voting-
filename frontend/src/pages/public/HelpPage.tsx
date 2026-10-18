import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Shield, Lock, FileCheck, Network, AlertCircle } from 'lucide-react';

export const HelpPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does the Secure E-Voting System protect my vote?',
      a: (
        <div className="space-y-2">
          <p>The system implements an end-to-end cryptographic pipeline:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>XCS-256 Feistel Encryption:</strong> Your ballot is encrypted using a 4-round hybrid Feistel cipher alternating XChaCha20 and Serpent round functions.</li>
            <li><strong>HMAC-SHA256 Authentication:</strong> An Encrypt-then-MAC tag prevents any tampering or bit-flipping attacks.</li>
            <li><strong>BLAKE2s Fingerprinting:</strong> A canonical byte representation is hashed using the ultra-fast, secure BLAKE2s digest algorithm.</li>
            <li><strong>Ed25519 Digital Signature:</strong> The Election Authority signs your canonical record hash with its private key.</li>
            <li><strong>Merkle Tree Ledger:</strong> Your record hash is incorporated into a cryptographic Merkle tree, enabling mathematical inclusion proofs.</li>
          </ul>
        </div>
      )
    },
    {
      q: 'Why can a submitted vote never be changed or recalled?',
      a: (
        <p>
          Once submitted, your vote is recorded in an immutable transaction in the database and anchored into the
          election's cryptographic Merkle tree. Permitting ballots to be changed would open severe vulnerabilities
          such as vote buying, coercion, and replay attacks. The system strictly enforces <strong>one vote per verified voter per election</strong>.
        </p>
      )
    },
    {
      q: 'How is ballot secrecy maintained if anyone can verify a Vote ID?',
      a: (
        <p>
          The public verification portal only checks the <em>integrity</em> of the record (whether the BLAKE2s hash, Ed25519 signature,
          and Merkle tree inclusion proof match). The actual candidate choice is sealed within the encrypted payload and is
          <strong>never returned by the verification API</strong>. Observers can confirm your vote was recorded without learning
          who you voted for.
        </p>
      )
    },
    {
      q: 'What is the Vote ID and what should I do with it?',
      a: (
        <p>
          A Vote ID (e.g. <code>VOTE-A7F9-82CD-93B4</code>) is an unpredictable, non-sequential cryptographic tracking identifier
          generated when you submit your ballot. You should keep this ID safe. You can paste it into the "Verify My Vote" portal
          at any time to confirm that your ballot is part of the certified election ledger.
        </p>
      )
    },
    {
      q: 'What is XCS-256 and why is it labeled experimental?',
      a: (
        <p>
          <strong>XCS-256</strong> is an educational research cipher developed for this college project. It is a four-round Feistel
          network that combines raw XChaCha20 keystream diffusion (rounds 1 & 3) with Serpent 128-bit block encryption (rounds 2 & 4).
          It is explicitly labeled experimental because, while based on reputable underlying primitives, it has not undergone decades
          of formal cryptanalysis by the international cryptographic standards community and is intended strictly for research demonstrations.
        </p>
      )
    },
    {
      q: 'What is the purpose of the Merkle Tree in this system?',
      a: (
        <p>
          A Merkle Tree organizes all record hashes into a cryptographic binary tree where every parent node is the hash
          of its two children. The topmost hash—the <strong>Merkle Root</strong>—summarizes the entire collection of votes in 32 bytes.
          If even a single bit of one ballot is altered, the Merkle root changes completely, instantly alerting election auditors to tampering.
        </p>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-left">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold">
          <HelpCircle className="w-4 h-4 text-sky-600" />
          <span>Voter Security &amp; Documentation</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Help &amp; Frequently Asked Questions
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Everything you need to know about voter authentication, ballot encryption, and cryptographic auditing.
        </p>
      </div>

      {/* Accordion */}
      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-5 text-left flex justify-between items-center space-x-4 cursor-pointer hover:bg-slate-50 transition"
              >
                <span className="font-bold text-slate-900 text-sm sm:text-base">{faq.q}</span>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-sky-600 shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                )}
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-100">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Cryptography Viva Cheat Sheet */}
      <div className="bg-slate-900 text-slate-200 p-8 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2 text-sky-400 font-bold text-sm">
          <Shield className="w-5 h-5" />
          <span>Viva Quick Reference &bull; Cryptographic Specifications</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
            <div className="font-bold text-white mb-1">XCS-256 Feistel Cipher</div>
            <div className="text-slate-400">4-round hybrid (XChaCha20 rounds 1 &amp; 3, Serpent rounds 2 &amp; 4), 256-bit block, CBC mode + PKCS#7.</div>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
            <div className="font-bold text-white mb-1">Key Derivation (HKDF)</div>
            <div className="text-slate-400">HKDF-SHA256 with distinct domain labels for all round keys, nonces, CBC IV, and HMAC MAC key.</div>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
            <div className="font-bold text-white mb-1">Record Hashing (BLAKE2s)</div>
            <div className="text-slate-400">256-bit BLAKE2s digest over deterministic canonical JSON bytes (RFC 7693).</div>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
            <div className="font-bold text-white mb-1">Digital Signatures (Ed25519)</div>
            <div className="text-slate-400">Edwards-curve Digital Signature Algorithm over record hash using Election Authority private key.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
