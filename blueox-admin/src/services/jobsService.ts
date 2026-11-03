import { apiFetch } from './apiClient';
import type { Job } from './types';

export async function listJobs(): Promise<{ data: Job[]; error: Error | null }> {
  try {
    const data = await apiFetch<Job[]>('/api/jobs');
    return { data, error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

interface JobInput {
  title?: string;
  company?: string;
  location?: string;
  country?: string;
  job_type?: string;
  description?: string;
  requirements?: string;
  salary_range?: string;
  is_active?: boolean;
}

export async function createJob(job: JobInput): Promise<void> {
  await apiFetch('/api/jobs', { method: 'POST', body: JSON.stringify(job) });
}

export async function updateJob(id: string, job: JobInput): Promise<void> {
  await apiFetch(`/api/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(job) });
}

export async function deleteJob(id: string): Promise<void> {
  await apiFetch(`/api/jobs/${id}`, { method: 'DELETE' });
}
