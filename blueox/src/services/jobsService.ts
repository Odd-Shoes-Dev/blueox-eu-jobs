import { supabase } from '../lib/supabaseClient';
import type { Job } from './types';

export async function listJobs(): Promise<Job[]> {
  const { data } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
  return data ?? [];
}

export async function listActiveJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data;
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
  await supabase.from('jobs').insert({
    title: job.title,
    company: job.company,
    location: job.location,
    country: job.country,
    job_type: job.job_type,
    description: job.description,
    requirements: job.requirements,
    salary_range: job.salary_range,
    is_active: true,
  });
}

export async function updateJob(id: string, job: JobInput): Promise<void> {
  await supabase
    .from('jobs')
    .update({
      title: job.title,
      company: job.company,
      location: job.location,
      country: job.country,
      job_type: job.job_type,
      description: job.description,
      requirements: job.requirements,
      salary_range: job.salary_range,
      is_active: job.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
}

export async function deleteJob(id: string): Promise<void> {
  await supabase.from('jobs').delete().eq('id', id);
}
