-- Reverse-engineered from the `ClientPaymentPhases` interface in
-- blueox/src/lib/supabase.ts and the togglePaymentPhase update payloads in
-- blueox-admin/src/App.tsx (phase_1_down_payment, phase_2_embassy_fee,
-- phase_3_after_visa_fee booleans + matching amount/date columns).
CREATE TABLE IF NOT EXISTS client_payment_phases (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  phase_1_down_payment        BOOLEAN NOT NULL DEFAULT false,
  phase_1_amount              NUMERIC(10, 2) NOT NULL DEFAULT 0,
  phase_1_date                TIMESTAMPTZ,
  phase_2_embassy_fee         BOOLEAN NOT NULL DEFAULT false,
  phase_2_amount              NUMERIC(10, 2) NOT NULL DEFAULT 0,
  phase_2_date                TIMESTAMPTZ,
  phase_3_after_visa_fee      BOOLEAN NOT NULL DEFAULT false,
  phase_3_amount              NUMERIC(10, 2) NOT NULL DEFAULT 0,
  phase_3_date                TIMESTAMPTZ,
  notes                       TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS client_payment_phases_client_id_key
  ON client_payment_phases (client_id);
