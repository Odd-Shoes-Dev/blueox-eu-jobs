import { supabase } from '../lib/supabaseClient';
import type { Client } from './types';

// TODO(clerk-migration): the one-off hardcoded admin-fallback object (for
// auth_user_id '5a236bf5-65e1-4a4c-bed4-df065c093e13') lives in
// contexts/AuthContext.tsx's fetchClient, not here — this function just does the
// plain DB lookup. Remove that fallback entirely once Clerk/Neon replace this path.
export async function getClientByAuthUserId(authUserId: string): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();
  if (error) throw error;
  return data;
}

export async function listClients(): Promise<Client[]> {
  const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
  if (error) console.log('Clients fetch error:', error.message);
  return data ?? [];
}

export async function testClientsConnection(): Promise<{ data: unknown; error: Error | null }> {
  const { data, error } = await supabase.from('clients').select('id, email, role').limit(1);
  return { data, error };
}
