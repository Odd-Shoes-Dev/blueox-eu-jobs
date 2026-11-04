import ImageKit from 'imagekit';

if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
  throw new Error('IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT must be set');
}

export const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// The ImageKit media library holds many other projects' folders too, so every
// path/folder this backend touches is scoped under one root — set once here, not
// duplicated into either frontend. Defaults to "/blueox" if unset.
export const IMAGEKIT_ROOT_FOLDER = (process.env.IMAGEKIT_ROOT_FOLDER || '/blueox').replace(/\/+$/, '');

/** Prefixes a relative path (as stored in the DB / sent by the frontend, e.g.
 * "client-documents/userId/file.pdf") with the configured root folder. */
export function toRootScopedPath(relativePath: string): string {
  return `${IMAGEKIT_ROOT_FOLDER}/${relativePath}`.replace(/\/+/g, '/');
}

/** Resolves a file's ImageKit fileId from its (root-relative) path, for files we
 * only ever stored the path of (application attachments inside applications.data
 * JSON, which predates this backend and isn't a documents table row). Returns null
 * if not found. */
export async function findFileIdByPath(relativePath: string): Promise<string | null> {
  const fullPath = toRootScopedPath(relativePath);
  const folder = fullPath.split('/').slice(0, -1).join('/') || '/';
  const fileName = fullPath.split('/').pop() ?? '';
  const files = await imagekit.listFiles({ path: folder, searchQuery: `name="${fileName}"` });
  const match = files.find((f) => 'filePath' in f && f.filePath === fullPath);
  return match && 'fileId' in match ? match.fileId : null;
}
