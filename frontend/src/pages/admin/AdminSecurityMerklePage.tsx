import React, { useEffect, useState } from 'react';
import { Network, CheckCircle2, ShieldCheck, Layers, GitBranch, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Election } from '../../types';

export const AdminSecurityMerklePage: React.FC = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.elections.list().then((elecs) => {
      setElections(elecs);
      if (elecs.length > 0) {
        setSelectedElection(elecs[0]);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedElection) {
      api.admin.getElectionRecords(selectedElection.id).then(setRecords).catch(console.error);
    }
  }, [selectedElection]);

  return (
    <div className="space-y-8 text-left">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Merkle Tree Ledger &amp; Inclusion Proofs</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Cryptographic binary hash trees organizing canonical vote records with domain-separated prefixes.
        </p>
      </div>

      {/* Specification Banner */}
      <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2 text-teal-400 font-bold text-sm">
          <Network className="w-5 h-5" />
          <span>Domain-Separated Merkle Tree Construction</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <div className="text-emerald-400 font-bold mb-1">Leaf Node Hashing</div>
            <div className="text-slate-300">BLAKE2s(0x00 || Record_Hash)</div>
            <div className="text-slate-400 text-[10px] mt-1">Single 0x00 prefix prevents second-preimage attacks.</div>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <div className="text-sky-400 font-bold mb-1">Internal Node Hashing</div>
            <div className="text-slate-300">BLAKE2s(0x01 || Left || Right)</div>
            <div className="text-slate-400 text-[10px] mt-1">0x01 prefix guarantees strict domain separation.</div>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <div className="text-indigo-400 font-bold mb-1">Inclusion Proof Size</div>
            <div className="text-slate-300">O(log N) Sibling Hashes</div>
            <div className="text-slate-400 text-[10px] mt-1">Lightweight verification without revealing other ballots.</div>
          </div>
        </div>
      </div>

      {/* Election Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Election Ledger:</div>
        <select
          value={selectedElection?.id || ''}
          onChange={(e) => {
            const el = elections.find((x) => x.id === Number(e.target.value));
            if (el) setSelectedElection(el);
          }}
          className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-800 font-medium"
        >
          {elections.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </select>
      </div>

      {/* Merkle Root Card */}
      {selectedElection && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Certified Merkle Root</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{selectedElection.title}</div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
              {records.length} Leaves in Tree
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-sky-800 font-bold break-all">
            {selectedElection.merkle_root || 'Empty tree root (no ballots cast yet)'}
          </div>

          {/* Leaf List Visualizer */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tree Leaves (BLAKE2s Record Hashes):
            </div>

            {records.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No vote records cast for this election yet.
              </div>
            ) : (
              <div className="space-y-2">
                {records.map((r, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs font-mono">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="font-bold text-slate-500">Leaf #{i}:</span>
                      <span className="text-sky-700 font-bold">{r.public_vote_id}</span>
                      <span className="text-slate-400 truncate text-[11px]">({r.record_hash})</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-sans font-bold">
                      Anchored
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
