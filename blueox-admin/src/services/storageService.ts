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

// Client-side only — a real attacker can bypass this (it's just JS), but it stops
// accidental misuse (huge files, wrong file types) before anything is sent to
// ImageKit. Real server-side enforcement would mean routing uploads through our
// own backend instead of direct-to-ImageKit.
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function validateFile(file: File): Error | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return new Error(`File is too large (max ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB)`);
  }
  // Some browsers/OSes leave file.type empty for files they don't recognize —
  // only reject when it's set and not allowed, to avoid false rejections.
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return new Error('Unsupported file type. Allowed: PDF, JPG, PNG, DOC, DOCX');
  }
  return null;
}

export async function uploadDocument(
  kind: StorageKind,
  path: string,
  file: File
): Promise<{ error: Error | null; fileId?: string }> {
  const validationError = validateFile(file);
  if (validationError) return { error: validationError };

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
