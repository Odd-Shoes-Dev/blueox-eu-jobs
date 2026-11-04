import { apiFetch } from './apiClient';
import type { Job } from './types';

export async function listJobs(): Promise<Job[]> {
  return apiFetch('/api/jobs');
}

export async function listActiveJobs(): Promise<Job[]> {
  try {
    return await apiFetch<Job[]>('/api/jobs?active=true');
  } catch {
    return [];
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
  await apiFetch(`/api/jobs?id=${id}`, { method: 'PATCH', body: JSON.stringify(job) });
}

export async function deleteJob(id: string): Promise<void> {
  await apiFetch(`/api/jobs?id=${id}`, { method: 'DELETE' });
}
