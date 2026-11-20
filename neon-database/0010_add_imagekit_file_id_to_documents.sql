-- Stage 2 (ImageKit storage): deleting a file via ImageKit's API needs its fileId,
-- not just the path/URL we already store in documents.file_path. Add a column to
-- hold it; nullable since rows created before this migration won't have one.
ALTER TABLE documents ADD COLUMN IF NOT EXISTS imagekit_file_id TEXT;
