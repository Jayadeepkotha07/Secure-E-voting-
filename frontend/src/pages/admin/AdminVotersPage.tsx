import React, { useEffect, useState } from 'react';
import { Users, Search, CheckCircle2, XCircle, ShieldCheck, UserX, UserCheck, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { VoterAdminItem } from '../../types';

export const AdminVotersPage: React.FC = () => {
  const [voters, setVoters] = useState<VoterAdminItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchVoters = async () => {
    setLoading(true);
    try {
      const data = await api.admin.listVoters(search || undefined, statusFilter || undefined);
      setVoters(data);
    } catch (err) {
      console.error('Failed to load voters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoters();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVoters();
  };

  const handleToggleStatus = async (voter: VoterAdminItem) => {
    const newStatus = voter.account_status === 'active' ? 'deactivated' : 'active';
    try {
      await api.admin.updateVoterStatus(voter.id, { account_status: newStatus });
      fetchVoters();
    } catch (err: any) {
      alert(err.message || 'Failed to update voter status');
    }
  };

  const handleToggleVerify = async (voter: VoterAdminItem) => {
    try {
      await api.admin.updateVoterStatus(voter.id, { email_verified: !voter.email_verified });
      fetchVoters();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle email verification');
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Registered Voter Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit citizen status, toggle verification, and enforce access controls. Passwords and hashes are strictly withheld.
          </p>
        </div>

        <button
          onClick={fetchVoters}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search voters by name or email address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </form>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-700 font-medium cursor-pointer"
          >
            <option value="">All Account Statuses</option>
            <option value="active">Active Only</option>
            <option value="deactivated">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Voters Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading voter directory...</div>
        ) : voters.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-1">
            <Users className="w-8 h-8 mx-auto text-slate-300" />
            <div className="font-bold text-sm">No Voters Found</div>
            <div className="text-xs text-slate-400">Try adjusting your search criteria.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-3.5">Voter Name</th>
                  <th className="px-6 py-3.5">Email Address</th>
                  <th className="px-6 py-3.5">Email Verified</th>
                  <th className="px-6 py-3.5">Account Status</th>
                  <th className="px-6 py-3.5">Ballots Cast</th>
                  <th className="px-6 py-3.5 text-right">Administrative Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {voters.map((voter) => (
                  <tr key={voter.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-bold text-slate-900">{voter.name}</td>
                    <td className="px-6 py-4 text-slate-600 font-mono">{voter.email}</td>
                    <td className="px-6 py-4">
                      {voter.email_verified ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Unverified</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                          voter.account_status === 'active'
                            ? 'bg-slate-100 text-slate-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {voter.account_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">{voter.votes_cast_count}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleToggleVerify(voter)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-[11px] transition cursor-pointer"
                      >
                        {voter.email_verified ? 'Revoke Verify' : 'Manual Verify'}
                      </button>

                      <button
                        onClick={() => handleToggleStatus(voter)}
                        className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition cursor-pointer ${
                          voter.account_status === 'active'
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {voter.account_status === 'active' ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
