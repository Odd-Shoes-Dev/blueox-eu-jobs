// Partner-side CRUD for their candidates — all calls go through
// /api/clients?resource=partner-candidates (folded into clients.ts rather than
// a new endpoint, since blueox-api was already at its 12-function Vercel
// Hobby-plan cap — see blueox-api/api/clients.ts).
import { partnerApiFetch } from './partnerAuthService';

export interface PartnerCandidate {
  id: string;
  partner_id: string;
  access_token: string;
  status: 'draft' | 'submitted' | 'locked' | 'changes_requested';
  changes_requested_note: string | null;
  full_name: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  phone: string | null;
  email: string | null;
  country_of_residence: string | null;
  eu_citizenship: boolean | null;
  target_country: string | null;
  job_category: string | null;
  driving_licence: boolean | null;
  driving_licence_conversion_status: string | null;
  video_url: string | null;
  placement_status: 'not_placed' | 'matched' | 'placed' | 'invoiced';
  placed_job_id: string | null;
  placed_at: string | null;
  created_at: string;
  updated_at: string;
}

const BASE = '/api/clients?resource=partner-candidates';

// The six document types a candidate can upload, shared across Dashboard.tsx,
// CandidateDetail.tsx, and CandidateSelfService.tsx so the completion
// calculation below and each page's upload grid never drift out of sync.
export const CANDIDATE_DOC_TYPES = [
  'passport', 'cv', 'education_certificate', 'work_reference', 'medical_certificate', 'police_clearance',
] as const;

type CompletionFields = Pick<
  PartnerCandidate,
  | 'full_name' | 'date_of_birth' | 'nationality' | 'phone' | 'email'
  | 'country_of_residence' | 'target_country' | 'job_category'
  | 'driving_licence_conversion_status' | 'video_url'
>;

const COMPLETION_FIELDS: (keyof CompletionFields)[] = [
  'full_name', 'date_of_birth', 'nationality', 'phone', 'email',
  'country_of_residence', 'target_country', 'job_category',
  'driving_licence_conversion_status', 'video_url',
];

// A purely visual progress indicator (how much of the form and documents is
// filled in) for a partner or candidate working on a record. Never affects
// submit eligibility, which is its own, separate check on the backend
// (REQUIRED_TO_SUBMIT in clients.ts), or anything else. Takes just the
// fields it needs (not the full PartnerCandidate) so it also accepts the
// candidate self-service page's Omit<PartnerCandidate, 'access_token'> view.
export function getCompletionPercent(candidate: CompletionFields, uploadedDocCount: number): number {
  const filledFields = COMPLETION_FIELDS.filter((f) => !!candidate[f]).length;
  const totalItems = COMPLETION_FIELDS.length + CANDIDATE_DOC_TYPES.length;
  const completedItems = filledFields + Math.min(uploadedDocCount, CANDIDATE_DOC_TYPES.length);
  return Math.round((completedItems / totalItems) * 100);
}

export async function listCandidates(): Promise<PartnerCandidate[]> {
  return partnerApiFetch(BASE);
}

export async function createCandidate(): Promise<PartnerCandidate> {
  return partnerApiFetch(BASE, { method: 'POST' });
}

export async function getCandidate(id: string): Promise<PartnerCandidate> {
  return partnerApiFetch(`${BASE}&id=${id}`);
}

export async function updateCandidate(
  id: string,
  fields: Partial<
    Pick<
      PartnerCandidate,
      | 'full_name' | 'date_of_birth' | 'nationality' | 'phone' | 'email'
      | 'country_of_residence' | 'eu_citizenship' | 'target_country' | 'job_category'
      | 'driving_licence' | 'driving_licence_conversion_status' | 'video_url'
    >
  >
): Promise<PartnerCandidate> {
  return partnerApiFetch(`${BASE}&id=${id}`, { method: 'PATCH', body: JSON.stringify(fields) });
}

export async function lockCandidate(id: string): Promise<PartnerCandidate> {
  return partnerApiFetch(`${BASE}&id=${id}&action=lock`, { method: 'PATCH' });
}

// Submitting requires full_name/date_of_birth/nationality/email to already be
// filled in (enforced server-side) — for a partner who has everything and
// doesn't need the candidate to visit their self-service link at all.
export async function submitCandidate(id: string): Promise<PartnerCandidate> {
  return partnerApiFetch(`${BASE}&id=${id}&action=submit`, { method: 'PATCH' });
}

export async function revertToDraft(id: string): Promise<PartnerCandidate> {
  return partnerApiFetch(`${BASE}&id=${id}&action=revert-to-draft`, { method: 'PATCH' });
}

export async function requestChanges(id: string, note: string): Promise<PartnerCandidate> {
  return partnerApiFetch(`${BASE}&id=${id}&action=request-changes`, {
    method: 'PATCH',
    body: JSON.stringify({ note }),
  });
}

export async function deleteCandidate(id: string): Promise<void> {
  await partnerApiFetch(`${BASE}&id=${id}`, { method: 'DELETE' });
}

// Documents (passport, CV, etc.) for candidates under this partner — /api/documents
// already understands a partner Bearer token (see blueox-api/api/documents.ts) and
// returns everything owned by this partner's candidates with no extra filtering.
export interface PartnerCandidateDocument {
  id: string;
  partner_candidate_id: string;
  file_name: string;
  file_path: string;
  document_type: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

export async function listPartnerDocuments(): Promise<PartnerCandidateDocument[]> {
  return partnerApiFetch('/api/documents');
}

export async function insertPartnerDocument(payload: {
  partner_candidate_id: string;
  file_name: string;
  file_path: string;
  document_type: string;
  file_size: number;
  mime_type: string;
}): Promise<PartnerCandidateDocument> {
  return partnerApiFetch('/api/documents', { method: 'POST', body: JSON.stringify(payload) });
}

export async function deletePartnerDocument(id: string): Promise<void> {
  await partnerApiFetch(`/api/documents?id=${id}`, { method: 'DELETE' });
}
