-- Partner Portal: B2B recruitment agencies/companies that submit candidates for
-- Blue Ox to process/place. A partner is a company, not a person — kept as its
-- own table rather than reusing `clients` (which represents individual people:
-- admins, students, workforce applicants). Mirrors `clients`' custom-auth columns
-- (see 0011_add_custom_auth_columns_to_clients.sql) plus company-specific fields.
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_person_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  email TEXT NOT NULL,
  password_hash TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  verification_token TEXT,
  verification_token_expires TIMESTAMPTZ,
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  -- Informational only — does not gate login (a partner can sign up and start
  -- working immediately; admin can suspend bad actors later via this field).
  registration_status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (registration_status IN ('pending_review', 'approved', 'rejected', 'suspended')),
  registration_number TEXT,
  tax_id TEXT,
  business_activity_notes TEXT,
  billing_contact_name TEXT,
  billing_email TEXT,
  billing_address TEXT,
  invoicing_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS partners_email_key ON partners (email);
