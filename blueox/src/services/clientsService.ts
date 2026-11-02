import { supabase } from '../lib/supabaseClient';
import type { Client } from './types';

export async function getClientByAuthUserId(authUserId: string): Promise<Client | null> {
  const { data } = await supabase
    .from('clients')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();
  return data ?? null;
}

export async function getClientIdByAuthUserId(authUserId: string): Promise<string | null> {
  const { data } = await supabase
    .from('clients')
    .select('id')
    .eq('auth_user_id', authUserId)
    .single();
  return data?.id ?? null;
}

export async function createClientRecord(payload: {
  auth_user_id: string;
  email: string;
  full_name: string;
  role: 'student' | 'workforce';
}): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('clients').insert(payload);
  return { error };
}

export async function updateClientByAuthUserId(
  authUserId: string,
  updates: Record<string, unknown>
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('clients').update(updates).eq('auth_user_id', authUserId);
  return { error };
}

export async function listClients(): Promise<Client[]> {
  const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
  return data ?? [];
}
