import { supabase } from '../lib/supabaseClient';

// 'client' -> applicant-facing document safe (Portal/Admin download), currently the
// 'client-documents' bucket. 'admin' -> admin-managed application attachments,
// currently the 'documents' bucket. Centralizing the bucket names here means a future
// storage-provider swap (or bucket consolidation) only touches this one file.
export type StorageKind = 'client' | 'admin';

function bucketFor(kind: StorageKind): string {
  return kind === 'client' ? 'client-documents' : 'documents';
}

export async function uploadDocument(
  kind: StorageKind,
  path: string,
  file: File,
  options?: { upsert?: boolean }
): Promise<{ error: Error | null }> {
  const { error } = await supabase.storage.from(bucketFor(kind)).upload(path, file, options);
  return { error };
}

export async function downloadDocument(kind: StorageKind, path: string): Promise<Blob | null> {
  const { data } = await supabase.storage.from(bucketFor(kind)).download(path);
  return data ?? null;
}

export async function deleteDocument(kind: StorageKind, path: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.storage.from(bucketFor(kind)).remove([path]);
  return { error };
}
