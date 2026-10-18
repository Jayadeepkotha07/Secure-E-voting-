import React, { useState } from 'react';
import { FileCode2, Hash, FileCheck, CheckCircle2, ShieldAlert } from 'lucide-react';

export const AdminSecurityHashesPage: React.FC = () => {
  const sampleJson = {
    election_id: 1,
    public_vote_id: "VOTE-A7F9-82CD-93B4",
    version: "01",
    salt: "3f82b793a1029cde882b...",
    ciphertext: "e721a9c402...",
    tag: "9910ab3c4...",
    created_at: "2026-10-18T14:00:00Z"
  };

  return (
    <div className="space-y-8 text-left">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">BLAKE2s Canonical Record Hashing</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Standardized in RFC 7693. Used to compute unique, collision-resistant 256-bit cryptographic fingerprints for vote records.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Specification Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center space-x-2 text-sky-700 font-bold text-sm">
            <Hash className="w-5 h-5" />
            <span>Why BLAKE2s for Vote Fingerprinting?</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            BLAKE2s is optimized for 8-to-32-bit platforms, produces a high-performance 256-bit digest, and is immune
            to length-extension attacks (unlike SHA-256). In our voting pipeline, it serves as the canonical record digest
            which is then digitally signed by the Election Authority.
          </p>

          <div className="space-y-2 text-xs">
            <div className="font-bold text-slate-700 uppercase tracking-wider">Digest Properties:</div>
            <ul className="list-disc pl-5 text-slate-600 space-y-1">
              <li>Digest Length: Exactly 32 bytes (256 bits).</li>
              <li>Collision Resistance: &gt; 2<sup>128</sup> operations.</li>
              <li>Preimage Resistance: &gt; 2<sup>256</sup> operations.</li>
            </ul>
          </div>
        </div>

        {/* Canonical Serialization Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center space-x-2 text-teal-700 font-bold text-sm">
            <FileCode2 className="w-5 h-5" />
            <span>Deterministic Canonical Byte Serialization</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Cryptographic signatures and hashes fail if dictionary keys change order or whitespace varies.
            We enforce deterministic canonical JSON serialization: keys are strictly sorted alphabetically,
            separators are compact <code>(`,`, `:`)</code>, and encoding is strict UTF-8.
          </p>

          <div className="p-4 bg-slate-900 text-slate-300 rounded-xl font-mono text-xs overflow-x-auto">
            <pre>{JSON.stringify(sampleJson, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
