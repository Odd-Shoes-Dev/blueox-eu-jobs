import { apiFetch } from './apiClient';
import type { Document } from './types';

// clientId is unused server-side now — see applicationsService for why.
export async function listDocumentsForClient(_clientId: string): Promise<Document[]> {
  return apiFetch('/api/documents');
}

export async function listAllDocuments(): Promise<Document[]> {
  return apiFetch('/api/documents');
}

export async function insertDocumentRecord(payload: {
  file_name: string;
  file_path: string;
  document_type: string;
  file_size: number;
  mime_type: string;
  imagekit_file_id?: string;
}): Promise<{ error: Error | null }> {
  try {
    await apiFetch('/api/documents', { method: 'POST', body: JSON.stringify(payload) });
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

// Deleting the documents row also deletes the underlying ImageKit file server-side
// (via its stored imagekit_file_id) — see blueox-api/api/documents.ts.
export async function deleteDocumentRecord(id: string): Promise<{ error: Error | null }> {
  try {
    await apiFetch(`/api/documents?id=${id}`, { method: 'DELETE' });
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

// verifiedBy is unused server-side now — the backend uses the authed admin's own id.
export async function verifyDocument(id: string, _verifiedBy?: string): Promise<void> {
  await apiFetch(`/api/documents?id=${id}`, { method: 'PATCH' });
}
