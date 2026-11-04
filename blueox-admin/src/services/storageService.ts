import { upload } from '@imagekit/react';
import { apiFetch } from './apiClient';

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
  file: File
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

export async function downloadDocument(
  _kind: StorageKind,
  path: string
): Promise<{ data: Blob | null; error: Error | null }> {
  try {
    const { url } = await apiFetch<{ url: string }>(`/api/files/download?path=${encodeURIComponent(path)}`);
    const res = await fetch(url);
    if (!res.ok) return { data: null, error: new Error('Download failed') };
    return { data: await res.blob(), error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

export async function deleteDocument(kind: StorageKind, path: string): Promise<{ error: Error | null }> {
  if (kind === 'client') return { error: null };
  try {
    await apiFetch('/api/files/delete', { method: 'POST', body: JSON.stringify({ path }) });
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}
