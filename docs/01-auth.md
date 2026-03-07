# Module 01 — Authentication & Onboarding

## Screens in this module
1. Login Screen
2. OTP Verify Screen
3. Onboarding Screen (5 steps)

---

## Screen 1: Login Screen

### Layout
- Full screen gradient background: #E63B6F (top) → #F5A623 (bottom)
- Center: BabyBloom PH logo + tagline in 3 languages stacked
- Tagline EN: "Your Baby's Health Companion"
- Tagline FIL: "Ang Kasamahan ng Kalusugan ng Iyong Sanggol"
- Tagline ZH: "您宝宝的健康伴侣"

### Login Buttons (in this order)
1. **Mobile Number (OTP)** — primary pink button
   - Input field: country code fixed at +63, then phone number
   - Validation: PH mobile format — must start with 09, 10 digits total
   - On submit → call Semaphore API to send OTP → navigate to OTP Verify screen
2. **Continue with Facebook** — blue Facebook-branded button
3. **Continue with Google** — white button with Google logo
4. **Continue with Email** — outlined button
5. **Sign in with Apple** — black Apple-branded button (iOS only, hide on Android)

### Notes
- No "Register" vs "Login" distinction — if user doesn't exist, auto-create account
- Language toggle in top-right corner (EN / FIL / ZH)

---

## Screen 2: OTP Verify Screen

### Layout
- Back button (top left)
- Title: "Enter your OTP" / "Ilagay ang iyong OTP" / "输入验证码"
- Subtitle showing masked phone: "Sent to +63 9XX XXX X789"
- 6 individual digit input boxes (auto-advance to next box on input)
- Auto-read OTP from SMS on Android (SMS Retriever API) and iOS
- Timer countdown: "Resend in 0:60"
- Resend OTP button (disabled until timer hits 0)
- Max 3 wrong attempts → show error + lock for 15 minutes

### Logic
- OTP expires in 5 minutes
- On correct OTP → check if user profile exists in Supabase
  - If NEW user → navigate to Onboarding Screen
  - If EXISTING user → navigate to Dashboard

---

## Screen 3: Onboarding Screen

### Layout
- Progress dots at top (5 dots)
- Card-based stepper, can swipe left/right
- Skip button (top right) — skips remaining steps, goes to Dashboard
- Back / Next buttons at bottom

### Step 1 — Current Status
- Question: "What is your current status?" / "Ano ang iyong kasalukuyang katayuan?" / "您目前的状态是？"
- Two large cards to tap:
  - 🤰 Pregnant / Buntis / 怀孕中
  - 👶 Parenting / Magulang na / 育儿中
- Required — cannot proceed without selecting

### Step 2 — Birth Type
- Question: "How was your baby born?" / "Paano ipinanganak ang iyong sanggol?" / "宝宝的出生方式？"
- Two cards:
  - Normal / Vaginal
  - C-Section / Cesarean (CS)
- Show only if Step 1 = Parenting

### Step 3 — Single or Multiple
- Question: "Single or multiple babies?" / "Isa o maraming sanggol?" / "单胎还是多胎？"
- Three cards: 👶 Single / 👶👶 Twins / 👶👶👶 Triplets+

### Step 4 — Baby's Date of Birth / EDD
- Question: "When was your baby born?" (or "When is your due date?" if pregnant)
- Calendar date picker — max date = today (or future if pregnant)
- Format display: Month DD, YYYY

### Step 5 — Language Preference
- Question: "Choose your preferred language" / "Piliin ang iyong wika" / "选择语言"
- Three cards: English / Filipino / 中文
- This sets the default app language immediately on selection

### After Onboarding Completes
- Save all answers to Supabase user profile
- Navigate to Child Profile creation screen (not Dashboard yet — they need to create a child first)
