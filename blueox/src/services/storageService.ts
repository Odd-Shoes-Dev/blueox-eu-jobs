import { upload } from '@imagekit/react';
import { apiFetch } from './apiClient';

// 'client' -> applicant-facing document safe (Portal upload, backed by a documents
// table row). 'admin' -> application attachments tracked only as a path inside
// applications.data JSON (chatbot uploads, pre-login). Both now live in ImageKit as
// private files under a kind-prefixed folder; kept as a parameter for API
// compatibility with Stage 1's call sites even though most of the backend endpoints
// don't need to distinguish them anymore.
export type StorageKind = 'client' | 'admin';

interface ImageKitAuthParams {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint: string;
  // Scopes every upload under one folder in the (shared, multi-project) ImageKit
  // media library. Comes from the backend's IMAGEKIT_ROOT_FOLDER — never
  // configured here, so it only ever needs to change in one place.
  rootFolder: string;
}

async function getImageKitAuthParams(): Promise<ImageKitAuthParams> {
  return apiFetch<ImageKitAuthParams>('/api/imagekit/auth');
}

export async function uploadDocument(
  kind: StorageKind,
  path: string,
  file: File,
  _options?: { upsert?: boolean }
): Promise<{ error: Error | null; fileId?: string }> {
  try {
    const auth = await getImageKitAuthParams();
    const fileName = path.split('/').pop() || file.name;
    const folder = `${auth.rootFolder}/${kind}-documents/${path.split('/').slice(0, -1).join('/')}`.replace(/\/+/g, '/');

    const result = await upload({
      file,
      fileName,
      folder,
      useUniqueFileName: false,
      isPrivateFile: true,
      token: auth.token,
      signature: auth.signature,
      expire: auth.expire,
      publicKey: auth.publicKey,
    });

    return { error: null, fileId: result.fileId };
  } catch (error) {
    return { error: error as Error };
  }
}

export async function downloadDocument(_kind: StorageKind, path: string): Promise<Blob | null> {
  try {
    const { url } = await apiFetch<{ url: string }>(`/api/files/download?path=${encodeURIComponent(path)}`);
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.blob();
  } catch {
    return null;
  }
}

// For 'client' kind, deleting the documents table row (documentsService.deleteDocumentRecord)
// already deletes the underlying ImageKit file server-side, so this is a no-op —
// kept for API compatibility with Stage 1's call sites.
export async function deleteDocument(kind: StorageKind, path: string): Promise<{ error: Error | null }> {
  if (kind === 'client') return { error: null };
  try {
    await apiFetch('/api/files/delete', { method: 'POST', body: JSON.stringify({ path }) });
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}
