-- ══════════════════════════════════════════════════════════════
--  BabyBloom PH — Seed: EPI Philippines Vaccine Schedule
--  Source: DOH Philippines Expanded Program on Immunization (EPI)
--  Run in: Supabase Dashboard → SQL Editor
--  Safe to re-run — uses ON CONFLICT DO NOTHING
-- ══════════════════════════════════════════════════════════════

-- Clear existing rows first to avoid duplicates on re-seed
TRUNCATE TABLE vaccines_schedule RESTART IDENTITY CASCADE;

INSERT INTO vaccines_schedule
  (vaccine_name, age_weeks_min, age_weeks_max, dose_number, is_required, notes)
VALUES

  -- ── At Birth ────────────────────────────────────────────────────────────
  ('BCG',                               0,    0,    1, true,  'At birth'),
  ('Hepatitis B',                       0,    0,    1, true,  'At birth — within 24 hours'),

  -- ── 6 Weeks ─────────────────────────────────────────────────────────────
  ('Hepatitis B',                       6,    6,    2, true,  '6 weeks'),
  ('Pentavalent (DPT-HepB-Hib)',        6,    6,    1, true,  '6 weeks'),
  ('Oral Polio Vaccine (OPV)',          6,    6,    1, true,  '6 weeks'),
  ('Pneumococcal (PCV)',                6,    6,    1, true,  '6 weeks'),
  ('Rotavirus',                         6,    6,    1, true,  '6 weeks'),

  -- ── 10 Weeks ────────────────────────────────────────────────────────────
  ('Hepatitis B',                       10,   10,   3, true,  '10 weeks'),
  ('Pentavalent (DPT-HepB-Hib)',        10,   10,   2, true,  '10 weeks'),
  ('Oral Polio Vaccine (OPV)',          10,   10,   2, true,  '10 weeks'),
  ('Pneumococcal (PCV)',                10,   10,   2, true,  '10 weeks'),
  ('Rotavirus',                         10,   10,   2, true,  '10 weeks'),

  -- ── 14 Weeks ────────────────────────────────────────────────────────────
  ('Hepatitis B',                       14,   14,   4, true,  '14 weeks'),
  ('Pentavalent (DPT-HepB-Hib)',        14,   14,   3, true,  '14 weeks'),
  ('Oral Polio Vaccine (OPV)',          14,   14,   3, true,  '14 weeks'),
  ('Inactivated Polio Vaccine (IPV)',   14,   14,   1, true,  '14 weeks'),
  ('Pneumococcal (PCV)',                14,   14,   3, true,  '14 weeks'),

  -- ── 12–15 Months ────────────────────────────────────────────────────────
  ('MMR',                               52,   65,   1, true,  '12–15 months'),
  ('Varicella',                         52,   65,   1, true,  '12–15 months'),
  ('Hepatitis A',                       52,   104,  1, false, '12–23 months'),

  -- ── 18 Months ───────────────────────────────────────────────────────────
  ('Hepatitis A',                       78,   78,   2, false, '18 months (6 months after first dose)'),

  -- ── 2 Years ─────────────────────────────────────────────────────────────
  ('Typhoid',                           104,  104,  1, false, '2 years — repeat every 3 years'),

  -- ── 4–6 Years ───────────────────────────────────────────────────────────
  ('MMR',                               208,  312,  2, true,  '4–6 years booster'),
  ('Varicella',                         208,  312,  2, true,  '4–6 years booster'),

  -- ── 9–14 Years ──────────────────────────────────────────────────────────
  ('HPV (Gardasil 9)',                  468,  728,  1, false, '9–14 years — dose 1'),
  ('HPV (Gardasil 9)',                  494,  754,  2, false, '6 months after dose 1'),

  -- ── 11–12 Years ─────────────────────────────────────────────────────────
  ('Tdap',                              572,  624,  1, false, '11–12 years'),

  -- ── Annual (from 6 months) ───────────────────────────────────────────────
  ('Influenza',                         26,   9999, 1, false, 'Annual from 6 months — give every year');
