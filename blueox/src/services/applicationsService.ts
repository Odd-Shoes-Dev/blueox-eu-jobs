import { apiFetch } from './apiClient';
import type { Application } from './types';

export async function listApplications(): Promise<Application[]> {
  return apiFetch('/api/applications');
}

// clientId is unused server-side now — the backend derives "which client" from the
// caller's own auth token, so this always returns the caller's own applications.
// Kept as a parameter so Portal.tsx didn't need to change.
export async function listApplicationsForClient(_clientId: string): Promise<Application[]> {
  return apiFetch('/api/applications');
}

export async function createApplication(
  payload: Record<string, unknown>
): Promise<{ data: Application[] | null; error: Error | null }> {
  try {
    const data = await apiFetch<Application[]>('/api/applications', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

export async function updateApplicationStatus(id: string, status: string): Promise<void> {
  await apiFetch(`/api/applications?id=${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

export async function updateApplication(
  id: string,
  updates: Record<string, unknown>
): Promise<{ error: Error | null }> {
  try {
    await apiFetch(`/api/applications?id=${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

export async function deleteApplication(id: string): Promise<{ error: Error | null }> {
  try {
    await apiFetch(`/api/applications?id=${id}`, { method: 'DELETE' });
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}
