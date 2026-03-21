-- ============================================================
-- Migration: 20260321000000_pregnancy_tables.sql
-- Description: Pregnancy Hub — all tables for tracking
--   pregnancy profiles, weekly logs, prenatal appointments,
--   kick counts, contraction timing, and week-by-week content.
-- Source: CLAUDE 2.md — Phase 3 New Features
-- ============================================================

-- ── Pregnancy profile ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pregnancy_profiles (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lmp_date    DATE NOT NULL,
  due_date    DATE NOT NULL,
  ob_name     TEXT,
  clinic      TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── Weekly pregnancy logs ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS pregnancy_logs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pregnancy_id    UUID REFERENCES pregnancy_profiles(id) ON DELETE CASCADE,
  week            INTEGER NOT NULL,
  weight_kg       DECIMAL(5,2),
  bp_systolic     INTEGER,
  bp_diastolic    INTEGER,
  symptoms        JSONB DEFAULT '[]',
  notes           TEXT,
  logged_at       TIMESTAMPTZ DEFAULT now()
);

-- ── Prenatal appointments ─────────────────────────────────────
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

-- ── Kick counts ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kick_counts (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pregnancy_id     UUID REFERENCES pregnancy_profiles(id) ON DELETE CASCADE,
  logged_at        TIMESTAMPTZ DEFAULT now(),
  kicks_count      INTEGER NOT NULL,
  duration_minutes INTEGER
);

-- ── Contraction timing ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contractions (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pregnancy_id     UUID REFERENCES pregnancy_profiles(id) ON DELETE CASCADE,
  started_at       TIMESTAMPTZ NOT NULL,
  ended_at         TIMESTAMPTZ,
  duration_seconds INTEGER,
  interval_seconds INTEGER
);

-- ── Week-by-week educational content (weeks 1–40) ────────────
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

-- ── Enable Row Level Security on all new tables ───────────────
ALTER TABLE pregnancy_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pregnancy_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE prenatal_appointments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE kick_counts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE pregnancy_weeks        ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies ──────────────────────────────────────────────

-- pregnancy_profiles: user owns their own pregnancy record
CREATE POLICY "Own pregnancy only"
  ON pregnancy_profiles
  FOR ALL
  USING (auth.uid() = user_id);

-- pregnancy_logs: access only if the pregnancy belongs to the user
CREATE POLICY "Own pregnancy logs"
  ON pregnancy_logs
  FOR ALL
  USING (
    pregnancy_id IN (
      SELECT id FROM pregnancy_profiles WHERE user_id = auth.uid()
    )
  );

-- prenatal_appointments: same pattern — access via pregnancy ownership
CREATE POLICY "Own appointments"
  ON prenatal_appointments
  FOR ALL
  USING (
    pregnancy_id IN (
      SELECT id FROM pregnancy_profiles WHERE user_id = auth.uid()
    )
  );

-- kick_counts: access via pregnancy ownership
CREATE POLICY "Own kick counts"
  ON kick_counts
  FOR ALL
  USING (
    pregnancy_id IN (
      SELECT id FROM pregnancy_profiles WHERE user_id = auth.uid()
    )
  );

-- contractions: access via pregnancy ownership
CREATE POLICY "Own contractions"
  ON contractions
  FOR ALL
  USING (
    pregnancy_id IN (
      SELECT id FROM pregnancy_profiles WHERE user_id = auth.uid()
    )
  );

-- pregnancy_weeks: public read for all authenticated users
--   (educational content — not user-specific)
CREATE POLICY "Public read pregnancy_weeks"
  ON pregnancy_weeks
  FOR SELECT
  TO authenticated
  USING (true);
