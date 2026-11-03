import { apiFetch } from './apiClient';

export type StorageKind = 'client' | 'admin';

interface ImageKitAuthParams {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint: string;
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
    const folder = `/${kind}-documents/${path.split('/').slice(0, -1).join('/')}`.replace(/\/+/g, '/');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', fileName);
    formData.append('folder', folder);
    formData.append('useUniqueFileName', 'false');
    formData.append('isPrivateFile', 'true');
    formData.append('publicKey', auth.publicKey);
    formData.append('signature', auth.signature);
    formData.append('expire', String(auth.expire));
    formData.append('token', auth.token);

    const res = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) {
      return { error: new Error(json?.message || 'Upload failed') };
    }
    return { error: null, fileId: json.fileId };
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
