import React from 'react';
import { Info, ShieldAlert, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AdminDocsAboutPage: React.FC = () => {
  return (
    <div className="space-y-8 text-left max-w-4xl">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">About the System &amp; Viva Reference Guide</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Project details, threat model summary, and critical academic limitations for college evaluation.
        </p>
      </div>

      {/* Project Meta Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3 text-xs">
        <div className="font-bold text-slate-900 text-sm">Academic Project Summary</div>
        <div className="grid grid-cols-2 gap-3 text-slate-600">
          <div><strong>Title:</strong> A Secure E-Voting System with Enhanced Vote Verification and Tamper-Evident Auditing</div>
          <div><strong>Domain:</strong> Cryptography and Network Security</div>
          <div><strong>Primitives:</strong> XChaCha20, Serpent, HKDF-SHA256, BLAKE2s, Ed25519</div>
          <div><strong>Architecture:</strong> Python FastAPI, SQLite, React TypeScript, Tailwind CSS</div>
        </div>
      </div>

      {/* Important Cryptographic Disclosures & Limitations */}
      <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 space-y-4 text-xs text-amber-950">
        <div className="flex items-center space-x-2 font-bold text-sm text-amber-900">
          <ShieldAlert className="w-5 h-5 text-amber-700" />
          <span>Honest Cryptographic Limitations (College Viva Defense)</span>
        </div>

        <ul className="list-disc pl-5 space-y-2 leading-relaxed">
          <li>
            <strong>Demo-Grade Secrecy vs. Cryptographic Anonymity:</strong> In this system, ballot privacy relies on symmetric
            encryption (XCS-256) keyed by the Election Authority. A compromised authority master key can decrypt all ballots.
            This demonstrates tamper-evident auditability, but does <em>not</em> provide cryptographic coercion resistance
            or mixnet-based unlinkability like standard Helios or Civitas systems.
          </li>
          <li>
            <strong>End-to-End Verifiability (E2E-V):</strong> While a voter can verify that their individual record is included
            in the Merkle tree ("cast-as-intended" and "recorded-as-cast"), full E2E-V requires homomorphic tallying or zero-knowledge
            shuffles to prove that all recorded votes were counted without decrypting individual ballots.
          </li>
          <li>
            <strong>XCS-256 Experimental Status:</strong> XCS-256 is an educational research cipher. It combines proven primitives
            (XChaCha20 and Serpent) into a 4-round Feistel structure, but lacks a peer-reviewed formal reduction or multi-year
            cryptanalysis. It is explicitly labeled experimental throughout.
          </li>
        </ul>
      </div>

      {/* Viva Q&A Guide */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 text-xs">
        <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-sky-600" />
          <span>Examiner Viva Q&amp;A Cheat Sheet</span>
        </div>

        <div className="space-y-4 divide-y divide-slate-100">
          <div className="pt-2 space-y-1">
            <div className="font-bold text-slate-900">Q1: Why use both XChaCha20 and Serpent in the Feistel network?</div>
            <p className="text-slate-600 leading-relaxed">
              <strong>Answer:</strong> This demonstrates a hybrid ARX (Addition-Rotation-XOR stream cipher) and SPN
              (Substitution-Permutation Network block cipher) design. Serpent provides deep bit-level non-linear S-box diffusion,
              while XChaCha20 provides high-entropy pseudorandom keystream mixing.
            </p>
          </div>

          <div className="pt-2 space-y-1">
            <div className="font-bold text-slate-900">Q2: How does the system prevent double-voting?</div>
            <p className="text-slate-600 leading-relaxed">
              <strong>Answer:</strong> Double-voting is prevented at two levels: (1) Application service layer check verifying
              if the voter ID has already cast a ballot in this election, and (2) Database engine level with a <code>UniqueConstraint("voter_id", "election_id")</code>
              executed inside an atomic transaction.
            </p>
          </div>

          <div className="pt-2 space-y-1">
            <div className="font-bold text-slate-900">Q3: Why is Encrypt-then-MAC necessary before Feistel decryption?</div>
            <p className="text-slate-600 leading-relaxed">
              <strong>Answer:</strong> Decrypting unauthenticated ciphertext exposes systems to padding oracle and chosen-ciphertext
              attacks. By verifying HMAC-SHA256 before attempting decryption, corrupted or tampered inputs are rejected in constant time.
            </p>
          </div>

          <div className="pt-2 space-y-1">
            <div className="font-bold text-slate-900">Q4: How does Merkle tree inclusion proof work in O(log N)?</div>
            <p className="text-slate-600 leading-relaxed">
              <strong>Answer:</strong> An auditor only needs the leaf hash and the sibling hashes at each level of the binary tree
              to reconstruct the root. For 1,000,000 votes, verification takes only ~20 hash operations rather than hashing all million records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
