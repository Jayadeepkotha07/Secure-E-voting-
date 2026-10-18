import React, { useEffect, useState } from 'react';
import { PenTool, ShieldCheck, Key, Copy, Check, Lock, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

export const AdminSecuritySignaturesPage: React.FC = () => {
  const [pubKeyHex, setPubKeyHex] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.admin.getMetrics().then((m) => {
      setPubKeyHex(m.authority_public_key_hex);
    }).catch(console.error);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(pubKeyHex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 text-left">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Ed25519 Digital Signatures</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          RFC 8032 Edwards-curve Digital Signature Algorithm. Provides non-repudiation and proof of official authority origin.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Specification */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 text-xs">
          <div className="flex items-center space-x-2 text-indigo-700 font-bold text-sm">
            <PenTool className="w-5 h-5" />
            <span>Asymmetric Signing Protocol</span>
          </div>

          <p className="text-slate-600 leading-relaxed">
            The Election Authority holds an Ed25519 private key securely on the backend server.
            When a vote record is generated, its BLAKE2s digest is signed to produce a 64-byte signature.
            Anyone holding the public key can verify that the record was authorized by the official Election Commission.
          </p>

          <div className="space-y-2">
            <div className="font-bold text-slate-700 uppercase tracking-wider">Properties:</div>
            <ul className="list-disc pl-5 text-slate-600 space-y-1">
              <li>Curve: Edwards25519 (Twisted Edwards curve).</li>
              <li>Signature Size: Exactly 64 bytes (128 hex characters).</li>
              <li>Immunity to side-channel timing attacks (constant-time arithmetic).</li>
            </ul>
          </div>
        </div>

        {/* Public Key Card */}
        <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 space-y-4 text-xs">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 text-sky-400 font-bold text-sm">
              <Key className="w-5 h-5" />
              <span>Authority Verification Key</span>
            </div>
            <button
              onClick={handleCopy}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer flex items-center space-x-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Key'}</span>
            </button>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Raw 32-Byte Public Key (Hex):</span>
            <div className="p-3 bg-slate-950 font-mono text-xs rounded-xl border border-slate-800 text-slate-300 break-all">
              {pubKeyHex || 'Loading...'}
            </div>
          </div>

          <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-[11px] leading-relaxed flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong>Audit Safety:</strong> This public key can be freely embedded in voter proof receipts or exported to
              neutral election observers. The private key never leaves the trusted server memory.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
