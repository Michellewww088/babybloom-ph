# BabyBloom PH — Claude Code Development Guide

## Project Overview
BabyBloom PH is a trilingual (English / Filipino / 中文) mother and baby health tracking app for the Philippines market. Built with React Native (Expo) + Supabase + Claude API.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | React Native with Expo SDK 51+ |
| Navigation | Expo Router (file-based routing) |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| AI / LLM | Claude API (Anthropic) — claude-haiku for speed |
| SMS OTP | Semaphore PH (https://semaphore.co) — fallback Twilio |
| Auth | Supabase Auth — Email, Facebook OAuth, Google, Apple |
| i18n | react-i18next — language files: en.json / fil.json / zh.json |
| Charts | Victory Native (React Native SVG) |
| Push Notifications | Expo Notifications + FCM + APNs |
| Payment | PayMongo (PH-local: https://paymongo.com) |
| Storage | Supabase Storage (child photos, MCH booklet images) |
| State Management | Zustand |
| Forms | React Hook Form + Zod validation |

---

## Design System

### Colors
```
Primary Pink:    #E63B6F  — main CTA buttons, brand
Soft Pink:       #FFE4EE  — backgrounds, cards
Gold:            #F5A623  — PH sun accent, warnings
Soft Gold:       #FFF8E8  — info boxes
Blue:            #1A73C8  — secondary actions, links
Soft Blue:       #E8F2FF  — info backgrounds
Mint:            #27AE7A  — success states, health good
Soft Mint:       #E0F7EF  — success backgrounds
Dark:            #1C1C3A  — headings
Mid Gray:        #4A4A6A  — body text
Background:      #FAFAFA  — app background
```

### Typography
- Font family: Nunito (round, friendly, multilingual-safe)
- Body: 14sp
- Subheading: 16sp
- Heading: 20–24sp
- Caption: 12sp

### UI Style
- Rounded corners: borderRadius 16–24 for cards, 12 for buttons
- Cards: white with subtle shadow (elevation 2–4)
- Icons: rounded filled style, consistent 2px stroke
- Empty states: always include a cute illustration + encouraging message
- Avoid sharp edges — everything should feel soft and approachable

---

## Project Structure

```
babybloom-ph/
├── app/                        # Expo Router pages
│   ├── (auth)/
│   │   ├── login.tsx           # OTP / Email / Facebook / Google / Apple
│   │   ├── otp-verify.tsx      # 6-digit OTP entry
│   │   └── onboarding.tsx      # Post-login questions (5 steps)
│   ├── (tabs)/
│   │   ├── index.tsx           # Page 1: Dashboard (Home)
│   │   ├── calendar.tsx        # Page 2: Calendar & Reminders
│   │   ├── vaccines.tsx        # Page 3: Vaccine Knowledge Base
│   │   ├── encyclopedia.tsx    # Page 4: Parenting Encyclopedia
│   │   └── milestones.tsx      # Page 5: Records & Milestones
│   └── _layout.tsx
├── components/
│   ├── dashboard/
│   │   ├── GrowthSnapshot.tsx
│   │   ├── QuickStats.tsx
│   │   ├── FeatureIconGrid.tsx
│   │   └── InsightsCard.tsx
│   ├── trackers/
│   │   ├── FeedingLog.tsx
│   │   ├── SleepTracker.tsx
│   │   ├── VaccinationLog.tsx
│   │   ├── VitaminsLog.tsx
│   │   ├── FeedingGuide.tsx
│   │   └── InsightsReports.tsx
│   ├── ai/
│   │   └── AteAI.tsx           # AI Assistant chat component
│   ├── profile/
│   │   └── ChildProfile.tsx
│   └── ui/                     # Shared UI components
├── lib/
│   ├── supabase.ts             # Supabase client
│   ├── claude.ts               # Claude API wrapper
│   ├── semaphore.ts            # Semaphore SMS OTP
│   └── who-growth.ts           # WHO growth chart data + percentile calculator
├── i18n/
│   ├── index.ts                # i18next setup
│   ├── en.json                 # English strings
│   ├── fil.json                # Filipino / Tagalog strings
│   └── zh.json                 # Simplified Chinese strings
├── store/
│   ├── authStore.ts            # Auth state (Zustand)
│   ├── childStore.ts           # Child profile(s) state
│   └── settingsStore.ts        # Language preference, notifications
├── constants/
│   ├── vaccines-doh-epi.ts     # DOH Philippines EPI schedule
│   ├── vitamins-guide.ts       # DOH IYCF vitamin recommendations
│   ├── milestones.ts           # CDC/WHO developmental milestones
│   ├── feeding-guide.ts        # Complementary food timeline
│   └── colors.ts               # Design system colors
└── CLAUDE.md                   # This file
```

---

## Database Schema (Supabase)

```sql
-- Users (handled by Supabase Auth)

-- Child profiles
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  nickname TEXT,
  sex TEXT CHECK (sex IN ('male', 'female', 'unspecified')),
  birthday DATE NOT NULL,
  birth_time TIME,
  blood_type TEXT,
  birth_type TEXT CHECK (birth_type IN ('vaginal', 'cesarean')),
  birth_weight_kg NUMERIC(4,2),
  birth_height_cm NUMERIC(4,1),
  gestational_age_weeks INT,
  allergies TEXT[],
  photo_url TEXT,
  pediatrician_name TEXT,
  philhealth_number TEXT,
  mch_booklet_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Growth measurements
CREATE TABLE growth_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id),
  measured_at DATE NOT NULL,
  weight_kg NUMERIC(4,2),
  height_cm NUMERIC(4,1),
  head_circumference_cm NUMERIC(4,1),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Feeding logs
CREATE TABLE feeding_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  feed_type TEXT CHECK (feed_type IN ('breastfeed', 'bottle', 'solids')),
  breast_side TEXT CHECK (breast_side IN ('left', 'right', 'both')),
  volume_ml NUMERIC(5,1),
  formula_brand TEXT,
  food_item TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sleep logs
CREATE TABLE sleep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  sleep_type TEXT CHECK (sleep_type IN ('night', 'nap')),
  quality TEXT CHECK (quality IN ('restful', 'restless', 'frequent_waking')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vaccination records
CREATE TABLE vaccination_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id),
  vaccine_name TEXT NOT NULL,
  vaccine_code TEXT,
  given_at DATE,
  clinic_name TEXT,
  lot_number TEXT,
  reaction_notes TEXT,
  status TEXT CHECK (status IN ('given', 'upcoming', 'overdue', 'skipped')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vitamin / medication logs
CREATE TABLE medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('vitamin', 'medication', 'supplement')),
  dose TEXT,
  frequency TEXT,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reminders / calendar events
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  category TEXT CHECK (category IN ('vaccine','checkup','feeding','sleep','medication','vitamins','gp','custom')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  repeat_type TEXT CHECK (repeat_type IN ('none','hourly','daily','weekly','monthly','custom')),
  repeat_interval_hours INT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Milestones
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id),
  milestone_key TEXT NOT NULL,
  achieved_at DATE,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## i18n — Key String Conventions

Always add new UI strings to ALL THREE language files simultaneously.

```json
// en.json example
{
  "greeting": "Good morning, Mommy! 🌞",
  "feed_now": "Time to feed baby 🍼",
  "next_vaccine": "Next vaccine: {{name}} in {{days}} days 💉"
}

// fil.json example
{
  "greeting": "Magandang umaga, Nanay! 🌞",
  "feed_now": "Oras na para pakainin ang sanggol 🍼",
  "next_vaccine": "Susunod na bakuna: {{name}} sa loob ng {{days}} araw 💉"
}

// zh.json example
{
  "greeting": "早上好，妈妈！🌞",
  "feed_now": "喂奶时间到啦 🍼",
  "next_vaccine": "下次疫苗：{{name}}还有{{days}}天 💉"
}
```

Usage in components:
```typescript
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
<Text>{t('greeting')}</Text>
```

---

## AI Assistant — "Ate AI"

- Model: `claude-haiku-4-5-20251001` (fast, cost-efficient for chat)
- Persona: Warm, older-sister figure. Friendly, non-clinical tone.
- System prompt must include:
  - Child's current profile (name, age, birth details)
  - Last 7 days of feeding + sleep summaries
  - Latest growth measurement + WHO percentile
  - Known allergies
  - Upcoming vaccines
- Knowledge base references: WHO, DOH Philippines, Philippine Pediatric Society (PPS), AAP
- ALWAYS end medical responses with disclaimer in the user's chosen language
- NEVER provide specific medication dosages
- ALWAYS escalate red-flag symptoms (fever in newborn <3mo, difficulty breathing, seizure, etc.)

```typescript
// lib/claude.ts — system prompt template
export const buildSystemPrompt = (child: Child, summary: WeeklySummary) => `
You are Ate AI, a warm and knowledgeable baby health assistant for BabyBloom PH.
You are like a trusted older sister (Ate) to Filipino parents.

Child Profile:
- Name: ${child.nickname || child.first_name}, Age: ${child.ageInMonths} months
- Weight: ${summary.latestWeight}kg (${summary.weightPercentile}th percentile, WHO)
- Known allergies: ${child.allergies.join(', ') || 'none recorded'}

Last 7 days summary:
- Total feeds: ${summary.totalFeeds}, Avg volume: ${summary.avgVolumeMl}ml
- Total sleep: ${summary.totalSleepHours}h, Avg per day: ${summary.avgSleepPerDay}h

Upcoming vaccines: ${summary.upcomingVaccines.join(', ') || 'none in next 30 days'}

Guidelines: Follow WHO, DOH Philippines EPI, and Philippine Pediatric Society (PPS) standards.
Language: Respond in ${child.preferredLanguage} (en/fil/zh).
Always end with: "[This is general information. Please consult your Pedia for medical concerns.]"
`;
```

---

## Vaccination Data — DOH Philippines EPI

Always use `constants/vaccines-doh-epi.ts` as the source of truth. Never hardcode vaccine names inline.

Key rule: every vaccine entry must have:
- `isFreeEPI: boolean` — whether it's free at BHS/RHU
- `recommendedAgeWeeks: number` — for schedule calculation
- `nameEN`, `nameFIL`, `nameZH` — trilingual names

---

## Growth Analysis — WHO Standards

- WHO Multicentre Growth Reference Study data is in `lib/who-growth.ts`
- Always use **corrected age** for preterm babies (born before 37 weeks)
- Percentile color coding:
  - 🟢 Green: 15th–85th percentile (Normal)
  - 🟡 Yellow: 5th–15th or 85th–97th (Watch, follow up)
  - 🔴 Red: below 5th or above 97th (Consult Pedia)
- Growth data updates: ONLY when parent manually saves a new measurement. No real-time polling.
- Dashboard: show mini spark-line (last 5 points). Full interactive chart on Analysis page only.

---

## Philippines-Specific Rules

1. **DOH Milk Code compliance**: Do not display formula brand logos or promotional content. Logging a brand name for personal records is allowed; promoting it is not.
2. **Breastfeeding**: Always align with DOH recommendation of exclusive breastfeeding for 6 months.
3. **Co-sleeping**: Provide safe co-sleeping guidelines (UNICEF PH) rather than blanket prohibition — culturally sensitive.
4. **Garantisadong Pambata**: Remind every January and July to visit BHS for free Vitamin A + deworming.
5. **PSA birth registration**: Remind parents to register within 30 days of birth.
6. **PhilHealth newborn package**: Remind parents to enroll newborn within 30 days.
7. **MCH Booklet**: App is the "digital MCH Booklet" — use this framing in onboarding.
8. **BHS/RHU**: Always mention free government health services alongside private options.

---

## Development Rules

- Never hardcode strings — always use i18n keys
- Never hardcode vaccine schedules — always reference `constants/vaccines-doh-epi.ts`
- All dates displayed in PH format: Month DD, YYYY (e.g., March 5, 2026)
- All times in 12-hour format (Filipinos prefer AM/PM)
- Default country code: +63 (Philippines)
- Currency: Philippine Peso (₱) for any pricing display
- When in doubt about medical content, cite DOH Philippines or WHO as source
- Every new screen must have a loading state, error state, and empty state

---

## Build Order (MVP First)

Do these in order. Do NOT jump ahead.

1. Project init + Supabase setup + i18n config
2. Auth flow (OTP login + onboarding questions)
3. Child profile (create + edit)
4. Bottom tab navigation (5 tabs)
5. Dashboard shell (layout only, no data yet)
6. Feeding Log (full feature)
7. Sleep Tracker (full feature)
8. Growth Snapshot + WHO chart
9. Vaccination Log + DOH EPI schedule
10. Calendar & Reminders
11. Ate AI assistant
12. Vitamins & Medications
13. Insights & Reports (PDF export)
14. Vaccine Knowledge Base (Page 3)
15. Parenting Encyclopedia (Page 4)
16. Milestones & Stage Checklist (Page 5)
17. Find nearest BHS/RHU map
18. PayMongo premium subscription

---

*BabyBloom PH — Built with love for Filipino families 🇵🇭🍼*

---

## STEP-BY-STEP PROMPTS FOR CLAUDE CODE

Copy and paste these prompts ONE AT A TIME into Claude Code. Wait for each step to finish and test it before moving to the next.

---

### STEP 1 — Project Setup
```
Read CLAUDE.md and docs/01-auth.md. Then:
1. Initialize a new Expo project called "babybloom-ph" using TypeScript template
2. Install all dependencies from the Tech Stack in CLAUDE.md
3. Set up Expo Router with a (auth) group and (tabs) group
4. Create the i18n folder with en.json, fil.json, zh.json — add 10 starter strings from CLAUDE.md as examples
5. Set up the Supabase client in lib/supabase.ts
6. Create the colors.ts constants file with all colors from CLAUDE.md
Tell me when done and what to test.
```

---

### STEP 2 — Database Setup
```
Read CLAUDE.md. Using the database schema in CLAUDE.md:
1. Generate the complete SQL migration file (supabase/migrations/001_initial.sql) with all tables: children, growth_records, feeding_logs, sleep_logs, vaccination_records, medication_logs, reminders, milestones
2. Add Row Level Security (RLS) policies so users can only access their own data
3. Create a seed file with 1 sample child + sample data for testing
Tell me the SQL so I can run it in Supabase dashboard.
```

---

### STEP 3 — Authentication Flow
```
Read CLAUDE.md and docs/01-auth.md. Build the complete authentication flow:
1. Login screen (app/(auth)/login.tsx) — mobile OTP (+63), Email, Facebook, Google, Apple Sign-In buttons. Use the design system colors from CLAUDE.md.
2. OTP Verify screen (app/(auth)/otp-verify.tsx) — 6 digit boxes, countdown timer, resend button
3. Onboarding screen (app/(auth)/onboarding.tsx) — 5-step card stepper exactly as described in docs/01-auth.md
4. Auth state management in store/authStore.ts using Zustand
5. Route protection: redirect to login if not authenticated, redirect to dashboard if authenticated
For OTP, use Semaphore API. Add a placeholder function if API key not configured yet.
Tell me when done and what to test.
```

---

### STEP 4 — Child Profile
```
Read CLAUDE.md and docs/02-profile.md. Build the child profile screens:
1. Create/Edit Child Profile screen with ALL fields from docs/02-profile.md
2. Photo upload (circular avatar) with camera/gallery picker and 4 default illustrated avatar options
3. Save to Supabase children table
4. Child switcher component (for Dashboard top bar) — supports multiple children
5. Child store in store/childStore.ts — active child state, list of children
6. After first profile created → navigate to Dashboard
Tell me when done and what to test.
```

---

### STEP 5 — Bottom Navigation & Dashboard Shell
```
Read CLAUDE.md and docs/03-dashboard.md. Build:
1. Bottom tab navigation (app/(tabs)/_layout.tsx) with 5 tabs:
   - Tab 1: Home (Dashboard) icon: house
   - Tab 2: Calendar icon: calendar
   - Tab 3: Vaccines icon: syringe
   - Tab 4: Encyclopedia icon: book
   - Tab 5: Milestones icon: star
   Use the brand pink color #E63B6F for active tab
2. Dashboard shell (app/(tabs)/index.tsx):
   - Top navigation bar (child switcher left, name+age center, AI button + bell right)
   - Quick Stats strip (4 chips — hardcode placeholder data for now)
   - Feature Icon Grid (6 icons from docs/03-dashboard.md — no functionality yet, just layout)
   - Empty state if no child profile
3. Placeholder screens for tabs 2–5 (just a header for now)
Tell me when done and what to test.
```

---

### STEP 6 — Feeding Log
```
Read CLAUDE.md and docs/04-feeding.md. Build the complete Feeding Log feature:
1. Feeding Log screen (list view with date filter, summary bar, feed entries)
2. Add Feed modal (bottom sheet) with 3 tabs: Breastfeed / Bottle / Solids — all fields from docs/04-feeding.md
3. Bottle tab: quick-select formula brand chips (NAN, Similac, Enfamil, Promil, Nido, S-26)
4. Solids tab: quick-select PH food chips (Lugaw, Kamote, Kalabasa, Saging, Malunggay, Itlog, Manok, Isda)
5. Save/update/delete to Supabase feeding_logs table
6. Connect feeding data to Dashboard Quick Stats (last fed time, today's total)
7. Feeding reminder settings screen
All text must use i18n keys — add EN/FIL/ZH strings to language files.
Tell me when done and what to test.
```

---

### STEP 7 — Sleep Tracker
```
Read CLAUDE.md and docs/05-sleep.md. Build the complete Sleep Tracker:
1. Sleep Tracker screen with Active Sleep Timer card (if sleep in progress) + sleep history list
2. Start/Stop timer button with moon animation for start, sun animation for end
3. Manual entry option with start/end time pickers
4. Sleep type (Night/Nap) and quality rating fields
5. Background timer — keeps running even if app is closed (Expo Background Task)
6. Save to Supabase sleep_logs table
7. Basic weekly bar chart using Victory Native showing total sleep per day
8. Connect sleep data to Dashboard Quick Stats (sleep today)
All text must use i18n keys.
Tell me when done and what to test.
```

---

### STEP 8 — Growth Snapshot + WHO Charts
```
Read CLAUDE.md and docs/08-insights.md. Build:
1. Create lib/who-growth.ts:
   - Load WHO growth reference data (weight-for-age and height-for-age for boys and girls)
   - Implement getWHOPercentile(gender, metric, ageInMonths, value) function
   - Include the WHO 3rd, 15th, 50th, 85th, 97th percentile data points
2. Add Growth Measurement modal: fields for weight (kg), height (cm), head circumference (cm), date
3. Growth Snapshot card on Dashboard:
   - Latest stats + WHO percentile badges (color-coded: green/yellow/red)
   - Mini spark-line chart (last 5 weight points) using Victory Native
   - 2-sentence AI summary placeholder (call Claude API with child data + latest growth)
   - "View Full Analysis" button
4. Full Growth Analysis screen:
   - Interactive WHO Growth Chart (weight-for-age) with child's data points plotted
   - Child's dots in pink, WHO percentile curves in gray
   - Tap a dot to see exact value + date
Tell me when done and what to test.
```

---

### STEP 9 — Vaccination Log + DOH EPI Schedule
```
Read CLAUDE.md and docs/06-vaccines.md. Build:
1. Create constants/vaccines-doh-epi.ts with the COMPLETE DOH_EPI_SCHEDULE data from docs/06-vaccines.md
2. Vaccination Log screen:
   - Auto-populate upcoming vaccines on child profile creation (based on birthday + EPI schedule)
   - Status filter tabs: All / Given / Upcoming / Overdue
   - Each vaccine row shows EPI Free badge OR Private badge
3. Add/Edit Vaccine Record modal — all fields from docs/06-vaccines.md
4. Auto-generate reminders 7 days before each scheduled vaccine
5. Connect to Calendar (reminders table)
All text must use i18n keys (EN/FIL/ZH vaccine names from the schedule data).
Tell me when done and what to test.
```

---

### STEP 10 — Calendar & Reminders
```
Read CLAUDE.md and docs/09-calendar.md. Build Page 2 (Calendar tab):
1. Monthly calendar view with colored event dots (7 category colors from docs/09-calendar.md)
2. Upcoming events list below calendar
3. Add/Edit Reminder modal — all fields from docs/09-calendar.md
4. Auto-generated reminders:
   - Well-baby checkup reminders (PPS schedule based on child birthday)
   - Garantisadong Pambata reminders (December 15 and June 15 every year)
5. Notification settings screen
6. Wire up Expo Notifications to send push notifications at scheduled times
Tell me when done and what to test.
```

---

### STEP 11 — Ate AI Assistant
```
Read CLAUDE.md. Build the AI Assistant "Ate AI":
1. Floating Ate AI button (🤖) in Dashboard top bar → opens a chat bottom sheet
2. Chat UI: message bubbles (user = right, pink; Ate AI = left, white), text input + send button
3. lib/claude.ts: Claude API wrapper using claude-haiku-4-5-20251001
   - buildSystemPrompt() function from CLAUDE.md that injects child data + weekly summary
   - Streaming responses (show typing indicator while waiting)
4. Conversation history: save last 20 messages to Supabase (ai_conversations table)
5. Language detection: send in user's preferred language, respond in same language
6. Always append the disclaimer at end of each response in chosen language
Add claude API key to environment variables.
Tell me when done and what to test.
```

---

### STEP 12 — Vitamins & Medications
```
Read CLAUDE.md and docs/07-vitamins.md. Build:
1. Create constants/vitamins-guide.ts with the VITAMIN_RECOMMENDATIONS data from docs/07-vitamins.md
2. Vitamins & Medications screen:
   - Two tabs: Vitamins/Supplements | Medications
   - "Recommended for [nickname]" section showing age-appropriate vitamins
   - Active entries list + past entries list
3. Add/Edit entry modal for vitamins AND medications (separate form variants)
4. Garantisadong Pambata tracker sub-screen
5. Daily reminder notifications for logged vitamins
Tell me when done and what to test.
```

---

### STEP 13 — Insights & Reports + PDF Export
```
Read CLAUDE.md and docs/08-insights.md. Build the full Reports page:
1. Insights screen (accessible from Dashboard icon grid):
   - Date range selector
   - 4 tabs: Feeding | Sleep | Growth | Vaccination
   - All charts and summaries from docs/08-insights.md using Victory Native
   - AI Weekly Summary (Claude API)
2. PDF Export:
   - Use react-native-html-to-pdf to generate a report PDF
   - Include child info, date range, all stats, growth chart image
   - Share via WhatsApp/Messenger/Email
Tell me when done and what to test.
```

---

### STEP 14 — Vaccine Knowledge Base (Page 3)
```
Read CLAUDE.md and docs/06-vaccines.md. Build Page 3 (Vaccines tab):
1. Vaccine Knowledge Base screen:
   - Search bar
   - Filter chips: All / EPI Free / Optional
   - Accordion list grouped by age milestone
   - Uses the same DOH_EPI_SCHEDULE data from constants/vaccines-doh-epi.ts
2. Vaccine detail view (tapping a vaccine):
   - Full info card: name (trilingual), protects against (trilingual), doses, route, side effects, post-vaccine care, where to get + cost
   - "Mark as Given" button → creates entry in vaccination_logs
Tell me when done and what to test.
```

---

### STEP 15 — Parenting Encyclopedia (Page 4)
```
Read CLAUDE.md and docs/10-encyclopedia.md. Build Page 4 (Encyclopedia tab):
1. Encyclopedia home screen:
   - Search bar (Supabase full-text search)
   - "Recommended for You" horizontal scroll
   - Age stage accordion sections
   - Topic chip filter
2. Article detail screen:
   - Key Takeaways box at top
   - Body content (render Markdown)
   - Bookmark + Share buttons
3. My Saved Articles screen
4. Seed the database with the 14 priority PH articles listed in docs/10-encyclopedia.md
   (Write the article content in EN, FIL, and ZH for at least the first 3 articles as examples)
Tell me when done and what to test.
```

---

### STEP 16 — Milestones, Records & Checklist (Page 5)
```
Read CLAUDE.md and docs/11-milestones.md. Build Page 5 (Milestones tab):
1. Memory Book tab:
   - Photo diary grid organized by month
   - "First Times" log (first smile, first steps, first word, etc.)
   - Shareable milestone card generator (baby photo + milestone text + BabyBloom PH watermark)
2. Developmental Milestones tab:
   - Create constants/milestones.ts with MILESTONES data from docs/11-milestones.md
   - Age stage selector chips
   - Milestone checklist grouped by domain (Cognitive / Language / Motor / Social)
   - Progress bar + gentle AI alert if many milestones unchecked
3. Stage Checklist tab:
   - Stage selector
   - Checkable to-do list with progress bar
   - Checklist data from docs/11-milestones.md (Philippines-specific items)
Tell me when done and what to test.
```

---

### STEP 17 — Feeding Guide (PH Superfoods)
```
Read CLAUDE.md and docs/04-feeding.md. Build the Feeding Guide screen (accessible from Dashboard icon grid):
1. Complementary food introduction timeline by age stage
2. Philippine Superfoods section: Malunggay, Kamote, Saging na Saba, Kalabasa, Lugaw — with preparation tips
3. Allergen introduction guide (evidence-based early introduction)
4. If child has known allergies (from profile), show warning flags next to relevant foods
All content must be in trilingual (EN/FIL/ZH).
Tell me when done and what to test.
```

---

### STEP 18 — Final Polish & Testing
```
Read CLAUDE.md. Do a final review pass:
1. Check ALL screens have proper loading states, error states, and empty states
2. Check ALL user-visible text is using i18n keys (no hardcoded English strings)
3. Verify all date displays use PH format (Month DD, YYYY) and times use 12-hour AM/PM
4. Check the default country code in the OTP screen is +63
5. Verify DOH Milk Code compliance: no formula brand logos or promotional language anywhere
6. Test pull-to-refresh on Dashboard
7. Check that Growth Snapshot only updates when new measurement is saved (no polling)
8. Verify the AI disclaimer appears at end of every Ate AI response
List any issues found and fix them.
```
