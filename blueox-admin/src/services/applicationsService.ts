import { supabase } from '../lib/supabaseClient';
import type { Application } from './types';

export async function listApplications(): Promise<{ data: Application[]; error: Error | null }> {
  const { data, error } = await supabase.from('applications').select('*').order('created_at', { ascending: false });
  return { data: data ?? [], error: error ?? null };
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
