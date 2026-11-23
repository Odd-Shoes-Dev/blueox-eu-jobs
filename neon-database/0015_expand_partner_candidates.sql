-- Expands partner_candidates with the extra personal, address, passport, and
-- background fields the candidate-submission checklist requires. All added as
-- plain nullable TEXT/DATE columns, no CHECK constraints, matching the style
-- already used for job_category/driving_licence_conversion_status (validated
-- only by the UI, not the DB). intro_video_url is a second, separate video
-- link alongside the existing video_url (kept, now labeled "skills
-- demonstration video" in the UI).
ALTER TABLE partner_candidates
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS country_of_birth TEXT,
  ADD COLUMN IF NOT EXISTS place_of_birth TEXT,
  ADD COLUMN IF NOT EXISTS father_name TEXT,
  ADD COLUMN IF NOT EXISTS mother_name TEXT,
  ADD COLUMN IF NOT EXISTS marital_status TEXT,
  ADD COLUMN IF NOT EXISTS residence_city TEXT,
  ADD COLUMN IF NOT EXISTS residence_municipality TEXT,
  ADD COLUMN IF NOT EXISTS residence_street TEXT,
  ADD COLUMN IF NOT EXISTS residence_house_number TEXT,
  ADD COLUMN IF NOT EXISTS passport_number TEXT,
  ADD COLUMN IF NOT EXISTS passport_place_of_issue TEXT,
  ADD COLUMN IF NOT EXISTS passport_issue_date DATE,
  ADD COLUMN IF NOT EXISTS passport_expiry_date DATE,
  ADD COLUMN IF NOT EXISTS highest_education TEXT,
  ADD COLUMN IF NOT EXISTS work_experience TEXT,
  ADD COLUMN IF NOT EXISTS travel_visa_history TEXT,
  ADD COLUMN IF NOT EXISTS intro_video_url TEXT;
