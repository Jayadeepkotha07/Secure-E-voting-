import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Play,
  FileCode,
  Layers,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';
import { TamperSimulationResult } from '../../types';

export const AdminTamperDemoPage: React.FC = () => {
  const [testRecord, setTestRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mutationType, setMutationType] = useState('ciphertext_byte_flip');
  const [simulationResult, setSimulationResult] = useState<TamperSimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchTestRecord = async () => {
    setLoading(true);
    try {
      const data = await api.admin.seedTamperRecord();
      setTestRecord(data);
    } catch (err) {
      console.error('Failed to load test record:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestRecord();
  }, []);

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const res = await api.admin.simulateTamper(mutationType);
      setSimulationResult(res);
      fetchTestRecord();
    } catch (err: any) {
      alert(err.message || 'Simulation failed.');
    } finally {
      setSimulating(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await api.admin.resetTamperRecord();
      setSimulationResult(null);
      fetchTestRecord();
    } catch (err: any) {
      alert(err.message || 'Reset failed.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-8 text-left">
      {/* Title & DEMO ONLY Banner */}
      <div className="space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>ISOLATED SANDBOX &bull; DEMO / TESTING ONLY</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Tamper Detection &amp; Cryptographic Audit Demonstration
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
          This interactive test chamber operates strictly on a dedicated, isolated test record.
          Trigger controlled bit-level mutations, observe the real backend verification pipeline fail,
          and cleanly restore the sandbox without ever modifying genuine citizen ballots.
        </p>
      </div>

      {/* Warning Box */}
      <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 text-xs border border-slate-800 space-y-1">
        <div className="font-bold text-sky-400 flex items-center space-x-1.5">
          <ShieldAlert className="w-4 h-4" />
          <span>Cryptographic Isolation Guarantee:</span>
        </div>
        <p className="text-slate-400 leading-relaxed">
          Production ballots are protected by database foreign key constraints, backend authorization checks,
          and immutable transaction boundaries. Tamper simulation is restricted to records with <code>is_test_record = True</code>.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading sandbox test record...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Sandbox Record State & Controls */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Sandbox Test Record</h3>
                <span className="font-mono text-xs text-sky-700 font-bold">{testRecord?.public_vote_id}</span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  testRecord?.status === 'valid'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                {testRecord?.status === 'valid' ? 'UNTOUCHED / VALID' : 'TAMPERED / FAILED AUDIT'}
              </span>
            </div>

            {/* Mutation Chooser */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Controlled Mutation Attack:
              </label>

              <div className="space-y-2 text-xs">
                <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="mutation"
                    value="ciphertext_byte_flip"
                    checked={mutationType === 'ciphertext_byte_flip'}
                    onChange={(e) => setMutationType(e.target.value)}
                    className="text-sky-600 focus:ring-sky-500"
                  />
                  <div>
                    <div className="font-bold text-slate-900">1. Ciphertext Bit-Flip (XOR Byte 4)</div>
                    <div className="text-slate-500 text-[11px]">Simulates attacker altering encrypted ballot payload in transit.</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="mutation"
                    value="salt_mutation"
                    checked={mutationType === 'salt_mutation'}
                    onChange={(e) => setMutationType(e.target.value)}
                    className="text-sky-600 focus:ring-sky-500"
                  />
                  <div>
                    <div className="font-bold text-slate-900">2. Public Salt Substitution (Byte 0 Flip)</div>
                    <div className="text-slate-500 text-[11px]">Simulates altering per-record salt, breaking HKDF-SHA256 key derivation.</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="mutation"
                    value="tag_corruption"
                    checked={mutationType === 'tag_corruption'}
                    onChange={(e) => setMutationType(e.target.value)}
                    className="text-sky-600 focus:ring-sky-500"
                  />
                  <div>
                    <div className="font-bold text-slate-900">3. HMAC-SHA256 Authentication Tag Corruption</div>
                    <div className="text-slate-500 text-[11px]">Simulates MAC tampering; constant-time verification will fail.</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="mutation"
                    value="hash_tampering"
                    checked={mutationType === 'hash_tampering'}
                    onChange={(e) => setMutationType(e.target.value)}
                    className="text-sky-600 focus:ring-sky-500"
                  />
                  <div>
                    <div className="font-bold text-slate-900">4. BLAKE2s Record Hash Substitution</div>
                    <div className="text-slate-500 text-[11px]">Simulates modifying the record digest; Ed25519 signature will fail.</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-3">
              <button
                onClick={handleSimulate}
                disabled={simulating}
                className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Play className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
                <span>{simulating ? 'Executing Attack...' : 'Trigger Controlled Mutation'}</span>
              </button>

              <button
                onClick={handleReset}
                disabled={resetting}
                className="py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                <span>Reset Sandbox</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Diagnostic Feedback */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Cryptographic Diagnostic Output
            </h3>

            {simulationResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                  <div className="flex items-center space-x-2 font-black text-rose-700 text-sm">
                    <XCircle className="w-5 h-5 shrink-0" />
                    <span>AUDIT BREACH DETECTED &bull; TAMPERING CAUGHT</span>
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    Failed Security Check:
                  </div>
                  <div className="text-xs font-mono font-bold text-rose-800 bg-white/70 p-2 rounded-lg border border-rose-200">
                    {simulationResult.verification_check_failed}
                  </div>
                  <p className="text-xs text-rose-700 leading-relaxed pt-1">
                    {simulationResult.failure_details}
                  </p>
                </div>

                {/* State Diff comparison */}
                <div className="space-y-2 font-mono text-[11px]">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">
                    Field Mutation Analysis:
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Original Ciphertext:</div>
                    <div className="text-slate-600 break-all">{simulationResult.original_state.ciphertext.slice(0, 48)}...</div>
                    <div className="text-[10px] text-rose-600 font-bold uppercase mt-1">Mutated Ciphertext:</div>
                    <div className="text-rose-700 font-bold break-all">{simulationResult.mutated_state.ciphertext.slice(0, 48)}...</div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                  <span>Isolated sandbox safely contained discrepancy.</span>
                  <button
                    onClick={handleReset}
                    className="font-bold underline hover:text-emerald-900 cursor-pointer"
                  >
                    Restore Test Record
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
                <div className="font-bold text-sm text-slate-700">Sandbox Untampered</div>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Select a mutation attack on the left and click "Trigger Controlled Mutation" to observe live verification failure.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
