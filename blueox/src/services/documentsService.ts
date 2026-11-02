import { supabase } from '../lib/supabaseClient';
import type { Document } from './types';

export async function listDocumentsForClient(clientId: string): Promise<Document[]> {
  const { data } = await supabase.from('documents').select('*').eq('client_id', clientId);
  return data ?? [];
}

export async function listAllDocuments(): Promise<Document[]> {
  const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
  return data ?? [];
}

export async function insertDocumentRecord(payload: {
  client_id: string;
  file_name: string;
  file_path: string;
  document_type: string;
  file_size: number;
  mime_type: string;
}): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('documents').insert(payload);
  return { error };
}

export async function deleteDocumentRecord(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('documents').delete().eq('id', id);
  return { error };
}

export async function verifyDocument(id: string, verifiedBy?: string): Promise<void> {
  await supabase
    .from('documents')
    .update({ is_verified: true, verified_by: verifiedBy, verified_at: new Date().toISOString() })
    .eq('id', id);
}
