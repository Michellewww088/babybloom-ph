-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 20260320000000_pregnancy_tables
-- Pregnancy Hub — DB & Schema
-- Adds all pregnancy tracking tables for BabyBloom PH
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Pregnancy Profile ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pregnancy_profiles (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lmp_date   DATE NOT NULL,
  due_date   DATE NOT NULL,
  ob_name    TEXT,
  clinic     TEXT,
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Weekly Pregnancy Logs ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pregnancy_logs (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pregnancy_id   UUID REFERENCES pregnancy_profiles(id) ON DELETE CASCADE,
  week           INTEGER NOT NULL,
  weight_kg      DECIMAL(5,2),
  bp_systolic    INTEGER,
  bp_diastolic   INTEGER,
  symptoms       JSONB DEFAULT '[]',
  notes          TEXT,
  logged_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Prenatal Appointments ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prenatal_appointments (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pregnancy_id          UUID REFERENCES pregnancy_profiles(id) ON DELETE CASCADE,
  appointment_date      DATE NOT NULL,
  clinic                TEXT,
  ob_name               TEXT,
  purpose               TEXT,
  findings              TEXT,
  next_appointment_date DATE,
  results_url           TEXT,
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- ── Kick Counts ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kick_counts (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pregnancy_id     UUID REFERENCES pregnancy_profiles(id) ON DELETE CASCADE,
  logged_at        TIMESTAMPTZ DEFAULT now(),
  kicks_count      INTEGER NOT NULL,
  duration_minutes INTEGER
);

-- ── Contraction Timing ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contractions (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pregnancy_id     UUID REFERENCES pregnancy_profiles(id) ON DELETE CASCADE,
  started_at       TIMESTAMPTZ NOT NULL,
  ended_at         TIMESTAMPTZ,
  duration_seconds INTEGER,
  interval_seconds INTEGER
);

-- ── Week-by-Week Content (reference table) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS pregnancy_weeks (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week              INTEGER UNIQUE NOT NULL CHECK (week BETWEEN 1 AND 40),
  baby_size_name    TEXT,
  baby_size_cm      DECIMAL(5,1),
  baby_weight_g     INTEGER,
  baby_development  TEXT,
  mama_symptoms     TEXT,
  mama_tips         TEXT,
  trimester         TEXT CHECK (trimester IN ('first', 'second', 'third'))
);

-- ── Enable RLS ────────────────────────────────────────────────────────────────
ALTER TABLE pregnancy_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pregnancy_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE prenatal_appointments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE kick_counts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE pregnancy_weeks        ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies ──────────────────────────────────────────────────────────────

-- pregnancy_profiles: owner only
CREATE POLICY "Own pregnancy only"
  ON pregnancy_profiles
  FOR ALL
  USING (auth.uid() = user_id);

-- pregnancy_logs: owner only via pregnancy_profiles
CREATE POLICY "Own pregnancy logs"
  ON pregnancy_logs
  FOR ALL
  USING (
    pregnancy_id IN (
      SELECT id FROM pregnancy_profiles WHERE user_id = auth.uid()
    )
  );

-- prenatal_appointments: owner only via pregnancy_profiles
CREATE POLICY "Own appointments"
  ON prenatal_appointments
  FOR ALL
  USING (
    pregnancy_id IN (
      SELECT id FROM pregnancy_profiles WHERE user_id = auth.uid()
    )
  );

-- kick_counts: owner only via pregnancy_profiles
CREATE POLICY "Own kick counts"
  ON kick_counts
  FOR ALL
  USING (
    pregnancy_id IN (
      SELECT id FROM pregnancy_profiles WHERE user_id = auth.uid()
    )
  );

-- contractions: owner only via pregnancy_profiles
CREATE POLICY "Own contractions"
  ON contractions
  FOR ALL
  USING (
    pregnancy_id IN (
      SELECT id FROM pregnancy_profiles WHERE user_id = auth.uid()
    )
  );

-- pregnancy_weeks: public read for all authenticated users (reference data)
CREATE POLICY "Public read pregnancy_weeks"
  ON pregnancy_weeks
  FOR SELECT
  TO authenticated
  USING (true);
