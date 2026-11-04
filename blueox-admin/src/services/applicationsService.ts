import { apiFetch } from './apiClient';
import type { Application } from './types';

export async function listApplications(): Promise<{ data: Application[]; error: Error | null }> {
  try {
    const data = await apiFetch<Application[]>('/api/applications');
    return { data, error: null };
  } catch (error) {
    return { data: [], error: error as Error };
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
