export type FileKind = 'image' | 'pdf' | 'other';

// Browsers can render images and PDFs inline (img/iframe); nothing else (Word
// docs, etc.) previews natively, so those fall back to a download-only message.
export function getFileKind(path: string): FileKind {
  const ext = path.split('.').pop()?.toLowerCase();
  if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  return 'other';
}
