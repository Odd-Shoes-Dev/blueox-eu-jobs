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
  // Assigned once at creation, sequential within this partner (1, 2, 3, ...) —
  // combined with the partner's own code for a human reference like "AAA3".
  // Read-only; never sent in an update.
  candidate_number: number;
  full_name: string | null;
  gender: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  country_of_birth: string | null;
  place_of_birth: string | null;
  marital_status: string | null;
  father_name: string | null;
  mother_name: string | null;
  phone: string | null;
  email: string | null;
  country_of_residence: string | null;
  residence_city: string | null;
  residence_municipality: string | null;
  residence_street: string | null;
  residence_house_number: string | null;
  eu_citizenship: boolean | null;
  passport_number: string | null;
  passport_place_of_issue: string | null;
  passport_issue_date: string | null;
  passport_expiry_date: string | null;
  highest_education: string | null;
  work_experience: string | null;
  travel_visa_history: string | null;
  target_country: string | null;
  job_category: string | null;
  driving_licence: boolean | null;
  driving_licence_conversion_status: string | null;
  intro_video_url: string | null;
  video_url: string | null;
  placement_status: 'not_placed' | 'matched' | 'placed' | 'invoiced';
  placed_job_id: string | null;
  placed_at: string | null;
  created_at: string;
  updated_at: string;
}

const BASE = '/api/clients?resource=partner-candidates';

// The ten document types a candidate can upload, shared across Dashboard.tsx,
// CandidateDetail.tsx, and CandidateSelfService.tsx so the completion
// calculation below and each page's upload grid never drift out of sync.
export const CANDIDATE_DOC_TYPES = [
  'passport', 'cv', 'education_certificate', 'work_reference', 'medical_certificate', 'police_clearance',
  'photo', 'visa', 'signature', 'professional_certificate',
] as const;

export const CANDIDATE_DOC_TYPE_LABELS: Record<typeof CANDIDATE_DOC_TYPES[number], string> = {
  passport: 'Passport',
  cv: 'CV / Resume',
  education_certificate: 'Education Certificate',
  work_reference: 'Work Reference',
  medical_certificate: 'Medical Certificate',
  police_clearance: 'Police Clearance',
  photo: 'Passport-size Photo (white background)',
  visa: 'Last Visa Sticker (if applicable)',
  signature: 'Signature on White Paper',
  professional_certificate: 'Professional Certificate (if available)',
};

// A short, unambiguous human reference for a candidate (e.g. "AAA3") — the
// owning partner's sequential code plus the candidate's sequential number
// within that partner. Purely a display label, never used for lookup or
// access (that's still the UUID id / access_token).
export function formatCandidateRef(partnerCode: string, candidateNumber: number): string {
  return `${partnerCode}${candidateNumber}`;
}

// The editable fields of a candidate record, grouped and ordered the way
// both candidate forms (the partner's and the candidate's own self-service
// view) render them. A single shared list so the two pages can't drift out
// of sync as the checklist grows; each page just loops this array.
export type CandidateFieldType = 'date' | 'email' | 'select' | 'textarea';

export interface CandidateField {
  key: keyof PartnerCandidate;
  label: string;
  type?: CandidateFieldType;
  options?: string[];
  // Enforced both here (so the input/textarea can't be typed past it, and a
  // textarea can show a live "characters left" count) and again server-side
  // in blueox-api/api/clients.ts (MAX_LENGTHS there must be kept in sync) —
  // maxLength alone is only a client-side HTML attribute, not a real limit.
  maxLength?: number;
  group: string;
}

export const CANDIDATE_FIELDS: CandidateField[] = [
  // Identity
  { key: 'full_name', label: 'Full name (as on passport)', maxLength: 200, group: 'Identity' },
  { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], group: 'Identity' },
  { key: 'date_of_birth', label: 'Date of birth', type: 'date', group: 'Identity' },
  { key: 'nationality', label: 'Nationality', maxLength: 150, group: 'Identity' },
  { key: 'country_of_birth', label: 'Country of birth', maxLength: 150, group: 'Identity' },
  { key: 'place_of_birth', label: 'Place of birth (city/town)', maxLength: 150, group: 'Identity' },
  {
    key: 'marital_status', label: 'Marital status', type: 'select',
    options: ['Single', 'Married', 'Divorced', 'Widowed'], group: 'Identity',
  },
  { key: 'father_name', label: "Father's full name", maxLength: 200, group: 'Identity' },
  { key: 'mother_name', label: "Mother's full name", maxLength: 200, group: 'Identity' },
  // Contact
  { key: 'phone', label: 'Phone / WhatsApp', maxLength: 30, group: 'Contact' },
  { key: 'email', label: 'Email', type: 'email', maxLength: 150, group: 'Contact' },
  // Address
  { key: 'country_of_residence', label: 'Country of residence', maxLength: 150, group: 'Address' },
  { key: 'residence_city', label: 'City', maxLength: 150, group: 'Address' },
  { key: 'residence_municipality', label: 'Municipality', maxLength: 150, group: 'Address' },
  { key: 'residence_street', label: 'Street', maxLength: 150, group: 'Address' },
  { key: 'residence_house_number', label: 'House number', maxLength: 50, group: 'Address' },
  // Passport
  { key: 'passport_number', label: 'Passport number', maxLength: 50, group: 'Passport' },
  { key: 'passport_place_of_issue', label: 'Passport place of issue', maxLength: 150, group: 'Passport' },
  { key: 'passport_issue_date', label: 'Passport issue date', type: 'date', group: 'Passport' },
  { key: 'passport_expiry_date', label: 'Passport expiry date', type: 'date', group: 'Passport' },
  // Background
  { key: 'highest_education', label: 'Highest education qualification', maxLength: 150, group: 'Background' },
  { key: 'work_experience', label: 'Previous work experience', type: 'textarea', maxLength: 2000, group: 'Background' },
  {
    key: 'travel_visa_history', label: 'Previous travel and visa history', type: 'textarea',
    maxLength: 2000, group: 'Background',
  },
  // Work preferences
  { key: 'target_country', label: 'Target country', maxLength: 150, group: 'Work preferences' },
  { key: 'job_category', label: 'Job category', maxLength: 150, group: 'Work preferences' },
  {
    key: 'driving_licence_conversion_status', label: 'Driving licence conversion status',
    maxLength: 150, group: 'Work preferences',
  },
  // Videos
  { key: 'intro_video_url', label: 'Introduction video link', maxLength: 500, group: 'Videos' },
  { key: 'video_url', label: 'Skills demonstration video link', maxLength: 500, group: 'Videos' },
];

type CompletionFields = Pick<
  PartnerCandidate,
  | 'full_name' | 'gender' | 'date_of_birth' | 'nationality' | 'country_of_birth' | 'place_of_birth'
  | 'marital_status' | 'father_name' | 'mother_name' | 'phone' | 'email'
  | 'country_of_residence' | 'residence_city' | 'residence_municipality' | 'residence_street'
  | 'residence_house_number'
  | 'passport_number' | 'passport_place_of_issue' | 'passport_issue_date' | 'passport_expiry_date'
  | 'highest_education' | 'work_experience' | 'travel_visa_history'
  | 'target_country' | 'job_category' | 'driving_licence_conversion_status'
  | 'intro_video_url' | 'video_url'
>;

const COMPLETION_FIELDS: (keyof CompletionFields)[] = CANDIDATE_FIELDS.map(
  (f) => f.key as keyof CompletionFields
);

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
      | 'full_name' | 'gender' | 'date_of_birth' | 'nationality' | 'country_of_birth' | 'place_of_birth'
      | 'marital_status' | 'father_name' | 'mother_name' | 'phone' | 'email'
      | 'country_of_residence' | 'residence_city' | 'residence_municipality' | 'residence_street'
      | 'residence_house_number' | 'eu_citizenship'
      | 'passport_number' | 'passport_place_of_issue' | 'passport_issue_date' | 'passport_expiry_date'
      | 'highest_education' | 'work_experience' | 'travel_visa_history'
      | 'target_country' | 'job_category'
      | 'driving_licence' | 'driving_licence_conversion_status' | 'intro_video_url' | 'video_url'
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
