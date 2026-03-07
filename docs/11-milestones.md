# Module 11 — Milestones, Records & Stage Checklist (Mga Milestone at Checklist / 里程碑与成长档案)

## This is Page 5 of the bottom tab navigation.

## Screens
1. Milestones Home (tabs)
2. Memory Book / Photo Diary
3. Developmental Milestones Tracker
4. Stage Checklist

---

## Screen 1: Milestones Home

### Layout
- Header: "Baby Records 🌟" / "Mga Alaala ng Sanggol 🌟" / "宝宝成长档案 🌟"
- 3 tabs: **Memory Book** | **Milestones** | **Checklist**

---

## Tab 1: Memory Book (Talaarawan ng Sanggol / 宝宝相册)

### Layout
- Grid of month sections (e.g., "Month 1", "Month 2")
- Each section shows photo thumbnails from that month
- "Add Memory" button (floating, bottom right)

### Add Memory Modal
| Field | Type | Notes |
|---|---|---|
| Photo | Image picker | Camera or gallery; can add multiple |
| Caption | Text input | Optional |
| Date | Date picker | Auto-fills today's date |
| Tag | Chips | First Smile / First Bath / First Laugh / First Step / First Word / First Tooth / First Solid Food / Custom |

### First Times Log
Dedicated section showing special "firsts" in a timeline:
- Unang Ngiti 😊 (First Smile) — date + optional photo
- Unang Tawa (First Laugh)
- Unang Hakbang 👣 (First Steps)
- Unang Salita 🗣️ (First Word) + what the word was
- Unang Ngipin 🦷 (First Tooth)
- Unang Solid na Pagkain 🥣 (First Solid Food) + what food it was
- Tap any to add date + photo

### Shareable Milestone Card
When a milestone is logged: auto-generate a cute shareable card:
- Baby's photo (circular, centered)
- Milestone text (e.g., "Mia's First Steps! 👣")
- Date + age at milestone
- BabyBloom PH watermark (small, bottom right)
- Share button: WhatsApp, Messenger, Instagram, Save to Camera Roll

---

## Tab 2: Developmental Milestones Tracker

### Layout
- Age stage selector at top (scrollable chips): 2M | 4M | 6M | 9M | 12M | 18M | 24M | 3Y | 4Y | 5Y
- For selected age: list of milestones grouped by domain
- Each milestone: checkbox (Achieved ✅ / Not Yet ⬜) + date achieved (shown if checked)
- Progress bar: X of Y milestones achieved for this age

### Milestone Domains (per CDC/WHO)
Each age has milestones in these 4 domains:
- 🧠 **Cognitive** (Pag-iisip / 认知)
- 💬 **Language & Communication** (Wika at Komunikasyon / 语言与沟通)
- 🤸 **Motor Skills** (Kilos / 运动)
- ❤️ **Social & Emotional** (Sosyal at Emosyonal / 社交与情感)

### Full Milestone Data (constants/milestones.ts)
```typescript
export const MILESTONES = [
  {
    ageMonths: 2,
    milestones: [
      { id: "2m_soc_1", domain: "social", en: "Smiles at people", fil: "Ngumingiti sa mga tao", zh: "对人微笑" },
      { id: "2m_soc_2", domain: "social", en: "Tries to look at parent", fil: "Sinusubukang tumingin sa magulang", zh: "尝试注视父母" },
      { id: "2m_cog_1", domain: "cognitive", en: "Pays attention to faces", fil: "Napapansin ang mga mukha", zh: "注意观察面孔" },
      { id: "2m_lang_1", domain: "language", en: "Makes cooing sounds", fil: "Gumagawa ng mga tunog (cooing)", zh: "发出咕咕声" },
      { id: "2m_motor_1", domain: "motor", en: "Can briefly hold head up when on tummy", fil: "Kaya itaas ang ulo nang sandali kapag nakahiga sa tiyan", zh: "俯卧时可短暂抬头" },
      { id: "2m_motor_2", domain: "motor", en: "Makes smooth movements with arms and legs", fil: "Maayos na pagkilos ng mga braso at binti", zh: "手臂和腿部动作协调" },
    ]
  },
  {
    ageMonths: 4,
    milestones: [
      { id: "4m_soc_1", domain: "social", en: "Smiles spontaneously, especially at people", fil: "Kusang ngumingiti, lalo na sa mga tao", zh: "自发微笑，尤其对人" },
      { id: "4m_soc_2", domain: "social", en: "Likes to play with people and might cry when playing stops", fil: "Gusto maglaro at maaaring umiyak kapag natapos na", zh: "喜欢和人互动，停止玩耍时可能哭泣" },
      { id: "4m_cog_1", domain: "cognitive", en: "Follows moving things with eyes from side to side", fil: "Sinusundan ng mata ang gumagalaw na bagay", zh: "眼睛能左右追踪移动物体" },
      { id: "4m_lang_1", domain: "language", en: "Babbles with expression", fil: "Nagbabable nang may ekspresyon", zh: "有表情地咿呀学语" },
      { id: "4m_motor_1", domain: "motor", en: "Holds head steady without support", fil: "Hawak ang ulo nang tuwid nang walang tulong", zh: "头部可无支撑稳定保持" },
      { id: "4m_motor_2", domain: "motor", en: "Pushes down on legs when feet placed on firm surface", fil: "Nagtutulak ng pababa kapag nakalagay ang paa sa patag na ibabaw", zh: "脚触及硬面时会用力向下蹬" },
      { id: "4m_motor_3", domain: "motor", en: "May be able to roll from tummy to back", fil: "Maaaring makalikot mula sa tiyan patungo sa likod", zh: "可能会从俯卧翻身至仰卧" },
    ]
  },
  {
    ageMonths: 6,
    milestones: [
      { id: "6m_soc_1", domain: "social", en: "Knows familiar faces; begins to know strangers", fil: "Nakikilala ang mga pamilyar na mukha; nagsisimulang makilala ang mga hindi pamilyar", zh: "认识熟悉的面孔，开始认生" },
      { id: "6m_cog_1", domain: "cognitive", en: "Looks around at nearby things with curiosity", fil: "Nagmamasid sa paligid nang may pagkamausisa", zh: "好奇地观察周围事物" },
      { id: "6m_lang_1", domain: "language", en: "Responds to sounds by making sounds", fil: "Tumutugon sa mga tunog sa pamamagitan ng paggawa ng tunog", zh: "听到声音后会发出声音回应" },
      { id: "6m_lang_2", domain: "language", en: "Strings vowels together when babbling", fil: "Nagsasama-sama ng mga patinig sa pag-babble", zh: "咿呀学语时能连续发出元音" },
      { id: "6m_motor_1", domain: "motor", en: "Rolls over in both directions", fil: "Nakaka-likot sa magkabilang direksyon", zh: "能向两个方向翻身" },
      { id: "6m_motor_2", domain: "motor", en: "Begins to sit without support", fil: "Nagsisimulang makaupo nang walang tulong", zh: "开始能无支撑独坐" },
      { id: "6m_motor_3", domain: "motor", en: "Rocks back and forth on hands and knees", fil: "Nagpalakpak-palakpak sa mga kamay at tuhod", zh: "用手和膝盖前后摇摆" },
    ]
  },
  {
    ageMonths: 9,
    milestones: [
      { id: "9m_soc_1", domain: "social", en: "May be clingy with familiar adults", fil: "Maaaring mapanatili sa mga pamilyar na matatanda", zh: "可能对熟悉的成人产生依赖" },
      { id: "9m_cog_1", domain: "cognitive", en: "Watches the path of something as it falls", fil: "Sinisundan ang landas ng bagay na nahuhulog", zh: "追踪掉落物体的路径" },
      { id: "9m_cog_2", domain: "cognitive", en: "Looks for things she sees you hide", fil: "Naghahanap ng mga bagay na nakita mong itago", zh: "寻找你藏起来的东西" },
      { id: "9m_lang_1", domain: "language", en: "Makes a lot of different sounds like 'mamamama' and 'babababa'", fil: "Gumagawa ng maraming iba't ibang tunog tulad ng 'mamamama' at 'babababa'", zh: "发出多种不同声音如'妈妈妈'、'爸爸爸'" },
      { id: "9m_motor_1", domain: "motor", en: "Stands holding on", fil: "Nakatayo na may hawak", zh: "扶物站立" },
      { id: "9m_motor_2", domain: "motor", en: "Can get into sitting position", fil: "Kaya umabot sa posisyon ng pag-upo", zh: "能自己坐起来" },
      { id: "9m_motor_3", domain: "motor", en: "Crawls", fil: "Gumagapang", zh: "会爬行" },
    ]
  },
  {
    ageMonths: 12,
    milestones: [
      { id: "12m_soc_1", domain: "social", en: "Cries when mom or dad leaves", fil: "Umiiyak kapag umalis ang nanay o tatay", zh: "妈妈或爸爸离开时会哭" },
      { id: "12m_cog_1", domain: "cognitive", en: "Explores things in different ways like shaking, banging, throwing", fil: "Nag-eeksplora ng mga bagay sa iba't ibang paraan", zh: "通过摇晃、敲打、扔东西等方式探索物体" },
      { id: "12m_lang_1", domain: "language", en: "Says 'mama' and 'dada'", fil: "Nagsasabi ng 'mama' at 'dada'", zh: "能说'妈妈'和'爸爸'" },
      { id: "12m_lang_2", domain: "language", en: "Uses exclamations like 'oh-oh!'", fil: "Gumagamit ng exclamation tulad ng 'ay!'", zh: "使用感叹词如'哦！'" },
      { id: "12m_motor_1", domain: "motor", en: "Gets to sitting position without help", fil: "Nakaupo nang walang tulong", zh: "能独立坐起" },
      { id: "12m_motor_2", domain: "motor", en: "Pulls up to stand", fil: "Nakakatulong na makatayo", zh: "能扶物站起" },
      { id: "12m_motor_3", domain: "motor", en: "May stand alone and take first steps", fil: "Maaaring nakatayo nang walang tulong at gumagawa ng unang hakbang", zh: "可能会独站并迈出第一步" },
    ]
  },
];
```

### AI Alert Logic
If baby is past an age and has fewer than 50% of milestones checked:
Show a gentle message: "It looks like [nickname] hasn't reached some milestones yet for this age. Every baby develops at their own pace — but it might be worth mentioning to your Pedia at the next checkup. 💙"
Do NOT use alarming language. Never say "delayed" or "abnormal" directly.

---

## Tab 3: Stage Checklist (Listahan ng Gagawin / 阶段清单)

### Layout
- Stage selector at top
- Checklist items for selected stage
- Progress bar: X of Y completed
- Each item: checkbox + title + optional detail/note

### Checklist Data by Stage

#### 0–1 Month (Bagong Silang)
- [ ] Schedule 1st well-baby checkup within 1 week of hospital discharge
- [ ] Register birth at LCR (Local Civil Registry) — within 30 days (PSA Philippines)
- [ ] Apply for PSA Birth Certificate
- [ ] Enroll newborn in PhilHealth — within 30 days for Newborn Care Package
- [ ] Get MCH Booklet from Barangay Health Station (BHS)
- [ ] Confirm BCG + Hepatitis B dose 1 given (at hospital — check discharge papers)
- [ ] Schedule Newborn Screening if not done at hospital (required under RA 9288)
- [ ] Set up safe sleep environment (firm mattress, no soft bedding, clear of toys)
- [ ] Learn breastfeeding latch — visit BHS or lactation consultant if having difficulty
- [ ] Check for postpartum blues — Nanay's mental health matters too 💙
- [ ] Identify nearest BHS/RHU for future vaccines + checkups

#### 1–3 Months
- [ ] 6-week vaccines at BHS: Pentavalent (1), OPV (1), PCV (1), Rotavirus (1)
- [ ] 10-week vaccines: Pentavalent (2), OPV (2), PCV (2), Rotavirus (2)
- [ ] 1-month well-baby checkup
- [ ] 2-month well-baby checkup
- [ ] Tummy time: 2–3 times daily (strengthens neck and core muscles)
- [ ] Start reading and talking to baby daily — language development begins now!

#### 3–6 Months
- [ ] 14-week vaccines: Pentavalent (3), OPV (3), IPV (1), PCV (3)
- [ ] 4-month well-baby checkup
- [ ] Begin watching for signs of solid food readiness (head control, sitting with support, interest in food)
- [ ] Baby-proof the home — baby will start rolling and grabbing soon!
- [ ] If Garantisadong Pambata month (Jan or Jul): visit BHS for free Vitamin A

#### 6–9 Months
- [ ] 6-month well-baby checkup
- [ ] Start solid foods (single-ingredient purees: kamote, kalabasa, saging)
- [ ] Introduce iron-rich foods (chicken, fish, malunggay fortified lugaw)
- [ ] Introduce a sippy cup with water alongside solid meals
- [ ] Begin exposing to multiple languages at home (EN/FIL/ZH)
- [ ] Schedule Influenza vaccine (private, optional but recommended)

#### 9–12 Months
- [ ] 9-month vaccines: MMR (1), Hepatitis A (1) — check with Pedia
- [ ] 9-month well-baby checkup
- [ ] Transition to soft finger foods
- [ ] Install cabinet/drawer locks and outlet covers (baby is mobile now!)
- [ ] Forward-facing car seat check (if using car)

#### 12–18 Months
- [ ] 12-month well-baby checkup
- [ ] Vaccines at 12M: Varicella (1), Hep A (2), Typhoid (discuss with Pedia)
- [ ] MMR (2) at 12–15 months
- [ ] DPT Booster + OPV Booster at 15–18 months
- [ ] Transition from formula/bottle to cow's milk in cup (after 12 months)
- [ ] Dental checkup — first tooth means first dental visit!
- [ ] Toddler-proof home (stair gates, secure heavy furniture)
