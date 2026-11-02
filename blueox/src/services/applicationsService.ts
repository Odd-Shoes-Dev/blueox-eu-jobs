import { supabase } from '../lib/supabaseClient';
import type { Application } from './types';

export async function listApplications(): Promise<Application[]> {
  const { data } = await supabase.from('applications').select('*').order('created_at', { ascending: false });
  return data ?? [];
}

export async function listApplicationsForClient(clientId: string): Promise<Application[]> {
  const { data } = await supabase.from('applications').select('*').eq('client_id', clientId);
  return data ?? [];
}

export async function createApplication(
  payload: Record<string, unknown>
): Promise<{ data: Application[] | null; error: Error | null }> {
  const { data, error } = await supabase.from('applications').insert(payload).select();
  return { data, error };
}

export async function updateApplicationStatus(id: string, status: string): Promise<void> {
  await supabase
    .from('applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
}

export async function updateApplication(
  id: string,
  updates: Record<string, unknown>
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('applications').update(updates).eq('id', id);
  return { error };
}

export async function deleteApplication(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('applications').delete().eq('id', id);
  return { error };
}
