import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, FileCheck, CheckCircle2, XCircle, Network, Lock, Key } from 'lucide-react';
import { api } from '../../services/api';
import { AdminVoteDetail } from '../../types';

export const AdminSecurityVerificationPage: React.FC = () => {
  const [internalId, setInternalId] = useState('1');
  const [recordDetail, setRecordDetail] = useState<AdminVoteDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!internalId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.inspectRecord(Number(internalId));
      setRecordDetail(data);
    } catch (err: any) {
      setError(err.message || 'Record not found.');
      setRecordDetail(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, []);

  return (
    <div className="space-y-8 text-left">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Vote Record Security Deep Inspector</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Detailed cryptographic analysis of stored vote packages: MAC authentication, canonical BLAKE2s digest, and Ed25519 signature.
        </p>
      </div>

      {/* Record ID Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Internal Record ID:</label>
          <input
            type="number"
            min="1"
            value={internalId}
            onChange={(e) => setInternalId(e.target.value)}
            className="w-24 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-bold"
          />
          <button
            onClick={fetchDetail}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
          >
            {loading ? 'Inspecting...' : 'Inspect Record'}
          </button>
        </div>

        <div className="text-xs text-slate-400">
          Inspects real database rows and verifies all mathematical proofs live.
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl">
          {error}
        </div>
      )}

      {recordDetail && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                INTERNAL ID #{recordDetail.internal_id} &bull; {recordDetail.election_title}
              </span>
              <h3 className="text-xl font-mono font-bold text-sky-700 mt-1">{recordDetail.public_vote_id}</h3>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                recordDetail.overall_status === 'VALID'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}
            >
              {recordDetail.overall_status}
            </span>
          </div>

          {/* Cryptographic Values Breakdown */}
          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase font-sans">Public Salt (32B):</span>
              <div className="text-slate-700 break-all">{recordDetail.salt}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase font-sans">Encrypted Payload (XCS-256 Ciphertext):</span>
              <div className="text-slate-700 break-all">{recordDetail.ciphertext}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] text-sky-600 font-bold uppercase font-sans">HMAC-SHA256 Encrypt-then-MAC Tag:</span>
              <div className="text-sky-800 font-bold break-all">{recordDetail.authentication_tag}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between items-center font-sans">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Canonical Record Digest (BLAKE2s):</span>
                {recordDetail.hash_verified ? (
                  <span className="text-emerald-600 font-bold text-[10px]">VERIFIED HASH</span>
                ) : (
                  <span className="text-rose-600 font-bold text-[10px]">HASH MISMATCH</span>
                )}
              </div>
              <div className="text-slate-700 break-all">{recordDetail.record_hash}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between items-center font-sans">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Ed25519 Authority Digital Signature (64B):</span>
                {recordDetail.signature_verified ? (
                  <span className="text-emerald-600 font-bold text-[10px]">AUTHENTIC SIGNATURE</span>
                ) : (
                  <span className="text-rose-600 font-bold text-[10px]">SIGNATURE INVALID</span>
                )}
              </div>
              <div className="text-slate-700 break-all">{recordDetail.signature}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
