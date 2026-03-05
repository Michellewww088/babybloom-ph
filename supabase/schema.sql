-- ══════════════════════════════════════════════════════════════
--  BabyBloom PH — Supabase Database Schema
--  Run this in: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── USER PROFILES ───────────────────────────────────────────────────────
-- Extends Supabase Auth (auth.users) with app-specific fields
CREATE TABLE public.user_profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone                 TEXT,
  email                 TEXT,
  name                  TEXT,
  language              TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'fil', 'zh')),
  onboarding_completed  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create user_profile on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, phone, email)
  VALUES (
    NEW.id,
    NEW.phone,
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── CHILD PROFILES ──────────────────────────────────────────────────────
CREATE TABLE public.children (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name              TEXT NOT NULL,
  middle_name             TEXT,
  last_name               TEXT NOT NULL,
  nickname                TEXT,
  gender                  TEXT NOT NULL DEFAULT 'unknown' CHECK (gender IN ('male', 'female', 'unknown')),
  birthday                DATE,
  birth_time              TEXT,                     -- HH:MM 12hr format
  blood_type              TEXT DEFAULT 'unknown',
  birth_type              TEXT DEFAULT 'vaginal' CHECK (birth_type IN ('vaginal', 'csection')),
  baby_type               TEXT DEFAULT 'normal'  CHECK (baby_type IN ('normal', 'premature', 'twins')),
  birth_weight_kg         NUMERIC(4, 2),
  birth_height_cm         NUMERIC(4, 1),
  gestational_age_weeks   INT,
  weeks_premature         INT DEFAULT 0,
  allergies               TEXT[],
  pediatrician_name       TEXT,
  pediatrician_clinic     TEXT,
  philhealth_number       TEXT,
  mch_booklet_number      TEXT,
  photo_url               TEXT,
  is_pregnant             BOOLEAN NOT NULL DEFAULT FALSE,
  due_date                DATE,                     -- for pregnancy mode
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_children_user_id ON public.children(user_id);


-- ── FEEDING LOGS ────────────────────────────────────────────────────────
CREATE TABLE public.feeding_logs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id         UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feed_type        TEXT NOT NULL CHECK (feed_type IN ('breastfeed', 'bottle', 'solids')),
  -- Breastfeed
  breast_side      TEXT CHECK (breast_side IN ('left', 'right', 'both')),
  duration_minutes INT,
  -- Bottle
  bottle_type      TEXT CHECK (bottle_type IN ('formula', 'pumped_milk')),
  formula_brand    TEXT,
  volume_ml        NUMERIC(6, 1),
  -- Solids
  food_name        TEXT,
  food_texture     TEXT,
  food_amount_g    NUMERIC(5, 1),
  -- Common
  notes            TEXT,
  fed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feeding_logs_child_id ON public.feeding_logs(child_id);
CREATE INDEX idx_feeding_logs_fed_at   ON public.feeding_logs(fed_at DESC);


-- ── SLEEP LOGS ──────────────────────────────────────────────────────────
CREATE TABLE public.sleep_logs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id          UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sleep_type        TEXT NOT NULL DEFAULT 'nap' CHECK (sleep_type IN ('night', 'nap')),
  started_at        TIMESTAMPTZ NOT NULL,
  ended_at          TIMESTAMPTZ,                    -- NULL = currently sleeping
  duration_minutes  INT,                            -- computed on ended_at insert
  quality           TEXT CHECK (quality IN ('restful', 'restless', 'frequent_wakeups')),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-compute duration when ended_at is set
CREATE OR REPLACE FUNCTION public.compute_sleep_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_sleep_duration
  BEFORE INSERT OR UPDATE ON public.sleep_logs
  FOR EACH ROW EXECUTE FUNCTION public.compute_sleep_duration();

CREATE INDEX idx_sleep_logs_child_id   ON public.sleep_logs(child_id);
CREATE INDEX idx_sleep_logs_started_at ON public.sleep_logs(started_at DESC);


-- ── GROWTH LOGS ─────────────────────────────────────────────────────────
CREATE TABLE public.growth_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id        UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric          TEXT NOT NULL CHECK (metric IN ('weight', 'height', 'head_circumference')),
  value           NUMERIC(6, 2) NOT NULL,
  unit            TEXT NOT NULL,                    -- 'kg' or 'cm'
  age_months      NUMERIC(5, 1),                    -- age at time of measurement
  who_percentile  NUMERIC(5, 2),                    -- WHO percentile (computed)
  logged_at       DATE NOT NULL DEFAULT CURRENT_DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_growth_logs_child_id  ON public.growth_logs(child_id);
CREATE INDEX idx_growth_logs_logged_at ON public.growth_logs(logged_at DESC);


-- ── VACCINATION RECORDS ─────────────────────────────────────────────────
CREATE TABLE public.vaccination_records (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id            UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vaccine_code        TEXT NOT NULL,                -- e.g. 'BCG', 'DPTHEPBHIB_1'
  vaccine_name        TEXT NOT NULL,
  dose_number         INT NOT NULL DEFAULT 1,
  scheduled_date      DATE NOT NULL,
  given_date          DATE,                         -- NULL = not yet given
  given_at_facility   TEXT,                         -- BHS / RHU / clinic name
  is_epi_free         BOOLEAN NOT NULL DEFAULT TRUE,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vaccination_child_id ON public.vaccination_records(child_id);


-- ── REMINDERS ───────────────────────────────────────────────────────────
CREATE TABLE public.reminders (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id       UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category       TEXT NOT NULL CHECK (category IN ('vaccine', 'checkup', 'feeding', 'sleep', 'medication', 'custom')),
  title          TEXT NOT NULL,
  notes          TEXT,
  scheduled_at   TIMESTAMPTZ NOT NULL,
  repeat         TEXT DEFAULT 'none' CHECK (repeat IN ('none', 'daily', 'weekly', 'monthly')),
  is_completed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reminders_child_id    ON public.reminders(child_id);
CREATE INDEX idx_reminders_scheduled   ON public.reminders(scheduled_at ASC);


-- ── MILESTONES ──────────────────────────────────────────────────────────
CREATE TABLE public.milestones (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id             UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title_en             TEXT NOT NULL,
  title_fil            TEXT NOT NULL,
  title_zh             TEXT NOT NULL,
  category             TEXT NOT NULL DEFAULT 'custom'
                         CHECK (category IN ('motor', 'language', 'social', 'cognitive', 'first_time', 'custom')),
  expected_age_months  INT,
  achieved_at          DATE,                        -- NULL = not yet achieved
  photo_url            TEXT,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_milestones_child_id ON public.milestones(child_id);


-- ── ROW-LEVEL SECURITY (RLS) ────────────────────────────────────────────
-- Users can only read/write their own data

ALTER TABLE public.user_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feeding_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccination_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones           ENABLE ROW LEVEL SECURITY;

-- user_profiles
CREATE POLICY "Users can manage own profile"
  ON public.user_profiles FOR ALL
  USING (auth.uid() = id);

-- children
CREATE POLICY "Users can manage own children"
  ON public.children FOR ALL
  USING (auth.uid() = user_id);

-- feeding_logs
CREATE POLICY "Users can manage own feeding logs"
  ON public.feeding_logs FOR ALL
  USING (auth.uid() = user_id);

-- sleep_logs
CREATE POLICY "Users can manage own sleep logs"
  ON public.sleep_logs FOR ALL
  USING (auth.uid() = user_id);

-- growth_logs
CREATE POLICY "Users can manage own growth logs"
  ON public.growth_logs FOR ALL
  USING (auth.uid() = user_id);

-- vaccination_records
CREATE POLICY "Users can manage own vaccination records"
  ON public.vaccination_records FOR ALL
  USING (auth.uid() = user_id);

-- reminders
CREATE POLICY "Users can manage own reminders"
  ON public.reminders FOR ALL
  USING (auth.uid() = user_id);

-- milestones
CREATE POLICY "Users can manage own milestones"
  ON public.milestones FOR ALL
  USING (auth.uid() = user_id);
