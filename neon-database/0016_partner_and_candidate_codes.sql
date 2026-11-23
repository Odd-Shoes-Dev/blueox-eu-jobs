-- Sequential, content-free partner codes (AAA, AAB, AAC, ...) and the
-- per-partner candidate counter needed to number each partner's candidates
-- (AAA1, AAA2, ...). Both are plain increasing counters, not derived from the
-- company name, so they are always unique by construction and never need a
-- collision check. The sequence/row-lock pattern below is also what keeps
-- concurrent signups/candidate-creates race-free without an explicit
-- transaction.
CREATE SEQUENCE IF NOT EXISTS partner_code_seq;

ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS code TEXT,
  ADD COLUMN IF NOT EXISTS candidate_counter INTEGER NOT NULL DEFAULT 0;

ALTER TABLE partner_candidates
  ADD COLUMN IF NOT EXISTS candidate_number INTEGER;

-- Backfill any partners that existed before this migration, oldest first, and
-- advance the sequence past them so new signups continue right after. 0-indexed
-- n is converted to 3 base-26 letters inline (chr(65) = 'A').
WITH numbered AS (
  -- chr() only accepts integer, not the bigint nextval() returns — cast
  -- explicitly, since Postgres won't narrow bigint to integer implicitly
  -- for a function argument.
  SELECT id, (nextval('partner_code_seq') - 1)::int AS n
  FROM partners WHERE code IS NULL ORDER BY created_at ASC
)
UPDATE partners p
SET code = chr(65 + (n / 676) % 26) || chr(65 + (n / 26) % 26) || chr(65 + n % 26)
FROM numbered WHERE p.id = numbered.id;

ALTER TABLE partners ALTER COLUMN code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS partners_code_key ON partners (code);

-- Backfill candidate_number for any candidates that existed before this
-- migration, oldest first per partner, and leave candidate_counter at the
-- highest number actually assigned so new creates continue right after.
WITH numbered AS (
  SELECT id, partner_id, row_number() OVER (PARTITION BY partner_id ORDER BY created_at ASC) AS n
  FROM partner_candidates WHERE candidate_number IS NULL
)
UPDATE partner_candidates pc SET candidate_number = numbered.n
FROM numbered WHERE pc.id = numbered.id;

UPDATE partners p SET candidate_counter = sub.max_n
FROM (SELECT partner_id, max(candidate_number) AS max_n FROM partner_candidates GROUP BY partner_id) sub
WHERE p.id = sub.partner_id AND sub.max_n > p.candidate_counter;
