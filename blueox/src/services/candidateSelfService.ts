// Candidate self-service — the token travels as an explicit function argument /
// query param, never through apiClient's header-injection path (there is no
// login, no session; the access_token itself IS the access). Calls the same
// /api/clients?resource=partner-candidates and /api/documents endpoints the
// partner side uses, just authenticated differently.
import { apiFetch } from './apiClient';
import type { PartnerCandidate } from './partnerCandidatesService';
import type { PartnerCandidateDocument } from './partnerCandidatesService';

const BASE = '/api/clients?resource=partner-candidates';

export async function getCandidateByToken(token: string): Promise<Omit<PartnerCandidate, 'access_token'>> {
  return apiFetch(`${BASE}&token=${encodeURIComponent(token)}`);
}

export async function updateCandidateByToken(
  token: string,
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
): Promise<Omit<PartnerCandidate, 'access_token'>> {
  return apiFetch(`${BASE}&token=${encodeURIComponent(token)}`, {
    method: 'PATCH',
    body: JSON.stringify(fields),
  });
}

export async function submitCandidateByToken(token: string): Promise<Omit<PartnerCandidate, 'access_token'>> {
  return apiFetch(`${BASE}&token=${encodeURIComponent(token)}&action=submit`, { method: 'PATCH' });
}

export async function listDocumentsByToken(token: string): Promise<PartnerCandidateDocument[]> {
  return apiFetch(`/api/documents?token=${encodeURIComponent(token)}`);
}

export async function insertDocumentByToken(
  token: string,
  payload: { file_name: string; file_path: string; document_type: string; file_size: number; mime_type: string }
): Promise<PartnerCandidateDocument> {
  return apiFetch('/api/documents', { method: 'POST', body: JSON.stringify({ ...payload, token }) });
}

export async function deleteDocumentByToken(token: string, id: string): Promise<void> {
  await apiFetch(`/api/documents?id=${id}&token=${encodeURIComponent(token)}`, { method: 'DELETE' });
}
