import { apiFetch } from './apiClient';
import type { Document } from './types';

export async function listAllDocuments(): Promise<{ data: Document[]; error: Error | null }> {
  try {
    const data = await apiFetch<Document[]>('/api/documents');
    return { data, error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

// verifiedBy is unused server-side now — the backend uses the authed admin's own id.
export async function verifyDocument(id: string, _verifiedBy?: string): Promise<void> {
  await apiFetch(`/api/documents?id=${id}`, { method: 'PATCH' });
}
