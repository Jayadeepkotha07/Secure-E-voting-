import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldAlert, Play, Cpu, Layers, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

export const AdminSecurityXCS256Page: React.FC = () => {
  const [testPayload, setTestPayload] = useState('Ballot: Candidate Alice (ID: 101)');
  const [loading, setLoading] = useState(false);
  const [inspectionData, setInspectionData] = useState<any>(null);

  const runLiveInspection = async () => {
    setLoading(true);
    try {
      const data = await api.admin.inspectXCS256Live(testPayload);
      setInspectionData(data);
    } catch (err: any) {
      alert(err.message || 'Failed to execute XCS-256 inspection');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runLiveInspection();
  }, []);

  return (
    <div className="space-y-8 text-left">
      {/* Page Title & Research Prototype Disclaimer */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-black uppercase tracking-wider">
            EXPERIMENTAL RESEARCH PROTOTYPE
          </span>
          <span className="text-xs text-slate-400">Cryptographic Algorithm Specification</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          XCS-256 Hybrid Feistel Construction Inspector
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
          An experimental four-round Feistel cipher combining raw <strong>XChaCha20</strong> stream diffusion with
          the <strong>Serpent</strong> 128-bit block cipher. Authenticated with a separately keyed <strong>HMAC-SHA256</strong> Encrypt-then-MAC wrapper.
        </p>
      </div>

      {/* Warning Box */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start space-x-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>Academic Research Notice:</strong> XCS-256 is an educational prototype developed for this university project.
          It is <em>not</em> standardized by NIST or RFC, and does not inherit a formal security reduction merely by employing XChaCha20 and Serpent.
          Never deploy this experimental cipher for real production elections.
        </div>
      </div>

      {/* Interactive Live Input Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Live Interactive Feistel Execution Test:
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={testPayload}
            onChange={(e) => setTestPayload(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="Type any test plaintext ballot string..."
          />
          <button
            onClick={runLiveInspection}
            disabled={loading || !testPayload}
            className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
          >
            <Play className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Executing Feistel...' : 'Run Feistel Rounds'}</span>
          </button>
        </div>
      </div>

      {/* Feistel Mathematical Architecture Blueprint */}
      <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-sky-400">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4" />
            <span>Mathematical Construction &bull; 4-Round Hybrid Traversal</span>
          </div>
          <span className="text-[10px] text-slate-400">Block Size: 256 bits (32 bytes)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <div className="text-teal-400 font-bold mb-1">Round 1: F1</div>
            <div className="text-slate-300 text-[11px]">XChaCha20 (Raw Stream)</div>
            <div className="text-slate-400 text-[10px] mt-1">L1 = R0<br />R1 = L0 &oplus; F1(R0, K1)</div>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <div className="text-sky-400 font-bold mb-1">Round 2: F2</div>
            <div className="text-slate-300 text-[11px]">Serpent (128-bit Block)</div>
            <div className="text-slate-400 text-[10px] mt-1">L2 = R1<br />R2 = L1 &oplus; F2(R1, K2)</div>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <div className="text-teal-400 font-bold mb-1">Round 3: F3</div>
            <div className="text-slate-300 text-[11px]">XChaCha20 (Raw Stream)</div>
            <div className="text-slate-400 text-[10px] mt-1">L3 = R2<br />R3 = L2 &oplus; F3(R2, K3)</div>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <div className="text-sky-400 font-bold mb-1">Round 4: F4</div>
            <div className="text-slate-300 text-[11px]">Serpent (128-bit Block)</div>
            <div className="text-slate-400 text-[10px] mt-1">L4 = R3<br />R4 = L3 &oplus; F4(R3, K4)</div>
          </div>
        </div>
      </div>

      {/* Live Telemetry Trace Display */}
      {inspectionData && (
        <div className="space-y-6">
          <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider text-xs">
            Live Round Trace Results (Block 1):
          </h3>

          <div className="space-y-3">
            {inspectionData.round_traces?.slice(0, 4).map((trace: any, idx: number) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                      R{trace.round}
                    </span>
                    <span className="font-bold text-slate-900">{trace.function}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">128-bit output diffusion</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 font-mono text-[11px]">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">L_IN (16B):</span>
                    <span className="text-slate-700 break-all">{trace.l_in}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">R_IN (16B):</span>
                    <span className="text-slate-700 break-all">{trace.r_in}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-100">
                    <span className="text-[10px] text-sky-600 block font-bold">F_OUT (16B):</span>
                    <span className="text-sky-800 break-all">{trace.f_out}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                    <span className="text-[10px] text-emerald-600 block font-bold">R_NEXT (L &oplus; F):</span>
                    <span className="text-emerald-800 break-all">{trace.r_out}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Ciphertext & Tag Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs font-mono">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
              Authenticated Ciphertext Package:
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Public Per-Record Salt (32B):</span>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 break-all">
                  {inspectionData.salt_hex}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Final Ciphertext Payload (CBC + PKCS#7):</span>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 break-all">
                  {inspectionData.ciphertext_hex}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-sky-600 font-bold block uppercase">HMAC-SHA256 Encrypt-then-MAC Authentication Tag:</span>
                <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 break-all font-bold">
                  {inspectionData.authentication_tag_hex}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
