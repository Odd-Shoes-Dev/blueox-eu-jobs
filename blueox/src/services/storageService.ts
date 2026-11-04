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
  return apiFetch<ImageKitAuthParams>('/api/imagekit-auth');
}

// Client-side only — a real attacker can bypass this (it's just JS), but it stops
// accidental misuse (huge files, wrong file types) before anything is sent to
// ImageKit. See blueox-api/AUTH.md-adjacent note: real server-side enforcement
// would mean routing uploads through our own backend instead of direct-to-ImageKit.
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
  file: File,
  _options?: { upsert?: boolean }
): Promise<{ error: Error | null; fileId?: string; path?: string }> {
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

    // The real, full path the file actually landed at (relative to the ImageKit
    // root folder) — includes the `${kind}-documents/` segment the `folder` above
    // added, which the caller's own `path` input does NOT include. Callers must
    // store/use THIS path for later download/delete/preview, not their input path,
    // or lookups will target a location that was never actually written to.
    const storedPath = `${kind}-documents/${path}`.replace(/\/+/g, '/');

    return { error: null, fileId: result.fileId, path: storedPath };
  } catch (error) {
    return { error: error as Error };
  }
}

// Returns the short-lived signed URL itself (no blob fetch) — for opening a file in
// a new tab so the browser renders it inline (PDFs/images) instead of forcing a
// download. Word docs still download, since no browser previews those natively.
export async function getDocumentUrl(path: string): Promise<string | null> {
  try {
    const { url } = await apiFetch<{ url: string }>(`/api/files?path=${encodeURIComponent(path)}`);
    return url;
  } catch {
    return null;
  }
}

export async function downloadDocument(_kind: StorageKind, path: string): Promise<Blob | null> {
  try {
    const { url } = await apiFetch<{ url: string }>(`/api/files?path=${encodeURIComponent(path)}`);
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
    await apiFetch('/api/files', { method: 'POST', body: JSON.stringify({ path }) });
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}
