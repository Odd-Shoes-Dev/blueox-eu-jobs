-- Reverse-engineered from the `Payment` interface in blueox/src/lib/supabase.ts and
-- the insert/update payloads in blueox-admin/src/App.tsx (addPayment/updatePayment).
CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  application_id  UUID REFERENCES applications(id) ON DELETE SET NULL,
  phase           INTEGER NOT NULL,
  amount          NUMERIC(10, 2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'EUR',
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'paid', 'verified', 'refunded')),
  payment_date    TIMESTAMPTZ,
  verified_by     UUID REFERENCES clients(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_client_id_idx ON payments (client_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments (status);
