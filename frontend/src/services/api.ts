import {
  User,
  Election,
  CastVoteResponse,
  VoterStatus,
  MyVoteSummary,
  PublicVerificationResult,
  AdminMetrics,
  VoterAdminItem,
  AdminVoteDetail,
  SystemIntegrityReport,
  TamperSimulationResult,
  AuditLogItem,
  ElectionResults,
} from '../types';

const API_BASE = '/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('evoting_token');
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Authentication
  auth: {
    register: (name: string, email: string, password: string): Promise<User> =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      }),

    verifyEmail: (email: string, token: string): Promise<User> =>
      request('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email, token }),
      }),

    login: (email: string, password: string): Promise<{ access_token: string; user: User }> =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    adminLogin: (email: string, password: string): Promise<{ access_token: string; user: User }> =>
      request('/auth/admin-login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    getMe: (): Promise<User> => request('/auth/me'),
  },

  // Elections
  elections: {
    list: (status?: string): Promise<Election[]> =>
      request(status ? `/elections?status=${encodeURIComponent(status)}` : '/elections'),

    getDetail: (id: number): Promise<Election> => request(`/elections/${id}`),
  },

  // Voter Operations
  voting: {
    castVote: (electionId: number, candidateId: number): Promise<CastVoteResponse> =>
      request('/voting/cast', {
        method: 'POST',
        body: JSON.stringify({ election_id: electionId, candidate_id: candidateId }),
      }),

    getStatus: (electionId: number): Promise<VoterStatus> =>
      request(`/voting/status/${electionId}`),

    getMyVotes: (): Promise<MyVoteSummary[]> => request('/voting/my-votes'),
  },

  // Public Verification
  verification: {
    verifyPublic: (publicVoteId: string): Promise<PublicVerificationResult> =>
      request('/verification/verify', {
        method: 'POST',
        body: JSON.stringify({ public_vote_id: publicVoteId }),
      }),
  },

  // Results
  results: {
    getPublic: (electionId: number): Promise<ElectionResults> =>
      request(`/results/public/${electionId}`),
  },

  // Admin APIs
  admin: {
    getMetrics: (): Promise<AdminMetrics> => request('/admin/metrics'),

    listVoters: (search?: string, statusFilter?: string): Promise<VoterAdminItem[]> => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status_filter', statusFilter);
      return request(`/admin/voters?${params.toString()}`);
    },

    updateVoterStatus: (
      voterId: number,
      data: { account_status?: string; email_verified?: boolean }
    ): Promise<{ message: string }> =>
      request(`/admin/voters/${voterId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    createElection: (electionData: any): Promise<Election> =>
      request('/admin/elections', {
        method: 'POST',
        body: JSON.stringify(electionData),
      }),

    changeElectionStatus: (electionId: number, newStatus: string): Promise<Election> =>
      request(`/admin/elections/${electionId}/status?new_status=${encodeURIComponent(newStatus)}`, {
        method: 'PATCH',
      }),

    addCandidate: (electionId: number, candidateData: any): Promise<any> =>
      request(`/admin/elections/${electionId}/candidates`, {
        method: 'POST',
        body: JSON.stringify(candidateData),
      }),

    getElectionRecords: (electionId: number): Promise<any[]> =>
      request(`/admin/records/election/${electionId}`),

    inspectRecord: (internalId: number): Promise<AdminVoteDetail> =>
      request(`/admin/records/${internalId}`),

    runIntegrityAudit: (): Promise<SystemIntegrityReport> =>
      request('/admin/integrity-audit', { method: 'POST' }),

    inspectXCS256Live: (payload: string): Promise<any> =>
      request(`/admin/crypto/xcs256/inspect?payload=${encodeURIComponent(payload)}`, {
        method: 'POST',
      }),

    seedTamperRecord: (): Promise<any> =>
      request('/admin/tamper-demo/seed-test-record', { method: 'POST' }),

    simulateTamper: (mutationType: string): Promise<TamperSimulationResult> =>
      request('/admin/tamper-demo/simulate', {
        method: 'POST',
        body: JSON.stringify({ mutation_type: mutationType }),
      }),

    resetTamperRecord: (): Promise<any> =>
      request('/admin/tamper-demo/reset', { method: 'POST' }),

    getAuditLogs: (action?: string): Promise<AuditLogItem[]> => {
      const p = action ? `?action=${encodeURIComponent(action)}` : '';
      return request(`/audit/logs${p}`);
    },

    calculateResults: (electionId: number): Promise<ElectionResults> =>
      request(`/results/admin/${electionId}/calculate`, { method: 'POST' }),

    publishResults: (electionId: number): Promise<ElectionResults> =>
      request(`/results/admin/${electionId}/publish`, { method: 'POST' }),
  },
};
