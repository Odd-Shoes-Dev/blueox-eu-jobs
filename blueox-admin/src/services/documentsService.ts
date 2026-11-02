import { supabase } from '../lib/supabaseClient';
import type { Document } from './types';

export async function listAllDocuments(): Promise<{ data: Document[]; error: Error | null }> {
  const { data, error } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
  return { data: data ?? [], error: error ?? null };
}

export async function verifyDocument(id: string, verifiedBy?: string): Promise<void> {
  await supabase
    .from('documents')
    .update({ is_verified: true, verified_by: verifiedBy, verified_at: new Date().toISOString() })
    .eq('id', id);
}
