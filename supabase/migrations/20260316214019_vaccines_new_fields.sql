-- ══════════════════════════════════════════════════════════════
--  BabyBloom PH — Migration: Vaccine New Fields + Schedule Table
--  Created: 2026-03-16
--  Run in: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════

-- ── 1. Add new columns to the vaccines table ───────────────────────────
--       All additions are idempotent (IF NOT EXISTS)

ALTER TABLE vaccines
  ADD COLUMN IF NOT EXISTS brand             TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_date    DATE,
  ADD COLUMN IF NOT EXISTS administered_by   TEXT,
  ADD COLUMN IF NOT EXISTS administered_role TEXT
    CHECK (administered_role IN ('pediatrician', 'nurse', 'midwife')),
  ADD COLUMN IF NOT EXISTS clinic            TEXT,
  ADD COLUMN IF NOT EXISTS lot_number        TEXT,
  ADD COLUMN IF NOT EXISTS expiry_date       DATE,
  ADD COLUMN IF NOT EXISTS dose_number       INTEGER,
  ADD COLUMN IF NOT EXISTS site              TEXT
    CHECK (site IN ('left_thigh', 'right_thigh', 'left_arm', 'right_arm', 'oral')),
  ADD COLUMN IF NOT EXISTS reactions         TEXT,
  ADD COLUMN IF NOT EXISTS next_due_date     DATE,
  ADD COLUMN IF NOT EXISTS certificate_url   TEXT;

-- ── 2. Create vaccines_schedule reference table ────────────────────────
--       Holds the DOH EPI Philippines schedule reference data.
--       Public read (authenticated), no user writes.

CREATE TABLE IF NOT EXISTS vaccines_schedule (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  vaccine_name    TEXT        NOT NULL,
  age_weeks_min   INTEGER,
  age_weeks_max   INTEGER,
  dose_number     INTEGER,
  is_required     BOOLEAN     DEFAULT true,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── 3. Row Level Security ──────────────────────────────────────────────

ALTER TABLE vaccines_schedule ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all schedule reference data (public reference table)
CREATE POLICY "Public read"
  ON vaccines_schedule
  FOR SELECT
  TO authenticated
  USING (true);

-- ── 4. Seed: DOH EPI Philippines schedule reference rows ──────────────
--       Covers the standard Expanded Program on Immunization schedule.
--       age_weeks values: birth=0, 6wk=6, 10wk=10, 14wk=14, 9mo=39, 12mo=52, etc.

INSERT INTO vaccines_schedule (vaccine_name, age_weeks_min, age_weeks_max, dose_number, is_required, notes)
VALUES
  ('BCG',                     0,   0,   1, true,  'At birth. Given once.'),
  ('Hepatitis B',             0,   0,   1, true,  'At birth (within 24 hours).'),
  ('Hepatitis B',             6,   10,  2, true,  'Part of Pentavalent series.'),
  ('Hepatitis B',             10,  14,  3, true,  'Part of Pentavalent series.'),
  ('Hepatitis B',             14,  18,  4, true,  'Part of Pentavalent series.'),
  ('Pentavalent (DPT-HepB-Hib)', 6, 10, 1, true, 'DPT + Hepatitis B + Hib combined. Given at 6 weeks.'),
  ('Pentavalent (DPT-HepB-Hib)', 10, 14, 2, true,'Given at 10 weeks.'),
  ('Pentavalent (DPT-HepB-Hib)', 14, 18, 3, true,'Given at 14 weeks.'),
  ('OPV (Oral Polio)',        6,   10,  1, true,  'Given at 6 weeks alongside Pentavalent.'),
  ('OPV (Oral Polio)',        10,  14,  2, true,  'Given at 10 weeks.'),
  ('OPV (Oral Polio)',        14,  18,  3, true,  'Given at 14 weeks.'),
  ('IPV (Inactivated Polio)', 14,  18,  1, true,  'Given at 14 weeks alongside OPV dose 3.'),
  ('PCV (Pneumococcal)',      6,   10,  1, true,  'Given at 6 weeks.'),
  ('PCV (Pneumococcal)',      10,  14,  2, true,  'Given at 10 weeks.'),
  ('PCV (Pneumococcal)',      14,  18,  3, true,  'Given at 14 weeks.'),
  ('MMR (Measles-Mumps-Rubella)', 39, 43, 1, true,'Given at 9 months.'),
  ('MMR (Measles-Mumps-Rubella)', 52, 56, 2, true,'Booster at 12–15 months.'),
  ('Flu (Influenza)',         26,  30,  1, true,  'First dose at 6 months. Annual thereafter.'),
  ('Varicella (Chickenpox)',  52,  56,  1, false, 'Optional. Recommended at 12–15 months.'),
  ('Hepatitis A',             52,  56,  1, false, 'Optional. Two doses 6 months apart.'),
  ('Typhoid',                 104, 108, 1, false, 'Optional. From 2 years old.')
ON CONFLICT DO NOTHING;
