import { supabase } from '../lib/supabaseClient';

// 'client' -> applicant-facing document safe, currently the 'client-documents' bucket
// (legacy download path used by this admin app). 'admin' -> admin-managed application
// attachments, currently the 'documents' bucket. Centralizing bucket names here means
// a future storage-provider swap (or bucket consolidation) only touches this file.
export type StorageKind = 'client' | 'admin';

function bucketFor(kind: StorageKind): string {
  return kind === 'client' ? 'client-documents' : 'documents';
}

export async function uploadDocument(
  kind: StorageKind,
  path: string,
  file: File
): Promise<{ error: Error | null }> {
  const { error } = await supabase.storage.from(bucketFor(kind)).upload(path, file);
  return { error };
}

export async function downloadDocument(
  kind: StorageKind,
  path: string
): Promise<{ data: Blob | null; error: Error | null }> {
  const { data, error } = await supabase.storage.from(bucketFor(kind)).download(path);
  return { data: data ?? null, error };
}

export async function deleteDocument(kind: StorageKind, path: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.storage.from(bucketFor(kind)).remove([path]);
  return { error };
}
