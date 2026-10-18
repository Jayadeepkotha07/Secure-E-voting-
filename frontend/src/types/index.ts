export interface User {
  id: number;
  name: string;
  email: string;
  role: 'voter' | 'admin';
  email_verified: boolean;
  account_status: 'active' | 'deactivated';
  created_at: string;
}

export interface Candidate {
  id: number;
  election_id: number;
  display_name: string;
  party?: string;
  description: string;
  image_reference?: string;
  display_order: number;
}

export interface Election {
  id: number;
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  status: 'draft' | 'open' | 'closed' | 'published';
  merkle_root?: string;
  results_published_at?: string;
  created_at: string;
  candidate_count?: number;
  vote_count?: number;
  candidates?: Candidate[];
}

export interface CastVoteResponse {
  public_vote_id: string;
  election_id: number;
  message: string;
  verification_status: string;
  merkle_index?: number;
  created_at: string;
}

export interface VoterStatus {
  election_id: number;
  election_title: string;
  has_voted: boolean;
  public_vote_id?: string;
  voted_at?: string;
}

export interface MyVoteSummary {
  election_id: number;
  election_title: string;
  public_vote_id: string;
  verification_status: string;
  voted_at: string;
}

export interface PublicVerificationResult {
  public_vote_id: string;
  election_id: number;
  election_title: string;
  is_recorded: boolean;
  is_valid: boolean;
  merkle_inclusion_verified: boolean;
  signature_verified: boolean;
  hash_integrity_verified: boolean;
  recorded_at: string;
  message: string;
}

export interface AdminMetrics {
  total_elections: number;
  active_elections: number;
  registered_voters: number;
  votes_cast: number;
  verified_records: number;
  invalid_records: number;
  current_merkle_root?: string;
  last_integrity_check?: string;
  authority_public_key_hex: string;
}

export interface VoterAdminItem {
  id: number;
  name: string;
  email: string;
  role: string;
  email_verified: boolean;
  account_status: string;
  created_at: string;
  votes_cast_count: number;
}

export interface InclusionProofStep {
  sibling: string;
  position: 'left' | 'right';
}

export interface AdminVoteDetail {
  internal_id: number;
  public_vote_id: string;
  election_id: number;
  election_title: string;
  version: string;
  salt: string;
  ciphertext: string;
  authentication_tag: string;
  record_hash: string;
  signature: string;
  is_test_record: boolean;
  created_at: string;
  hash_verified: boolean;
  signature_verified: boolean;
  mac_authenticated: boolean;
  merkle_root?: string;
  merkle_index?: number;
  merkle_proof: InclusionProofStep[];
  merkle_inclusion_verified: boolean;
  overall_status: string;
  failure_reasons: string[];
}

export interface SystemIntegrityReport {
  total_elections: number;
  total_records_checked: number;
  valid_records_count: number;
  tampered_records_count: number;
  authority_public_key_hex: string;
  overall_system_healthy: boolean;
  timestamp: string;
  elections_audit: Array<{
    election_id: number;
    title: string;
    status: string;
    total_records: number;
    stored_merkle_root?: string;
    calculated_merkle_root?: string;
    merkle_consistent: boolean;
    anomalies: string[];
  }>;
  anomalies: string[];
}

export interface TamperSimulationResult {
  test_record_id: string;
  mutation_applied: string;
  original_state: Record<string, any>;
  mutated_state: Record<string, any>;
  verification_check_failed: string;
  failure_details: string;
  is_tampered_flag_set: boolean;
  restored: boolean;
}

export interface AuditLogItem {
  id: number;
  timestamp: string;
  actor: string;
  action: string;
  target_reference: string;
  status: string;
  safe_metadata?: string;
}

export interface CandidateTally {
  candidate_id: number;
  display_name: string;
  party?: string;
  count: number;
  percentage: number;
}

export interface ElectionResults {
  election_id: number;
  election_title: string;
  status: string;
  total_valid_votes: number;
  tallies: CandidateTally[];
  merkle_root?: string;
  results_published_at?: string;
  is_published: boolean;
}
