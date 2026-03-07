# Module 04 — Feeding Log (Tala ng Pagpapakain / 喂食记录)

## Screens / Components
1. Feeding Log List Screen (history view)
2. Add / Edit Feed Modal (bottom sheet)
3. Feeding Reminder Settings Screen

---

## Screen 1: Feeding Log List

### Layout
- Header: "Feeding Log 🍼" with "Add Feed" button (+ icon, top right)
- Date filter: Today / This Week / This Month / Custom range
- Summary bar at top:
  - Today's total feeds (count)
  - Today's total volume (ml)
  - Last feed: X hours ago
- List of feed entries (newest first), grouped by date

### Feed Entry Row
- Left: colored icon by feed type (🤱 breastfeed = pink, 🍼 bottle = blue, 🥄 solids = orange)
- Center: feed type label + volume or duration + food name (if solids)
- Right: time of feed + edit icon

---

## Screen 2: Add / Edit Feed Modal (Bottom Sheet)

### Feed Type Selector (tabs at top)
Three tabs: **Breastfeed** | **Bottle** | **Solids**

---

### Tab A: Breastfeed
| Field | Type | Notes |
|---|---|---|
| Breast Side | Toggle buttons | Left 👈 / Right 👉 / Both 👐 |
| Duration | Timer OR manual | Start/Stop timer button (moon animation) OR manual time entry |
| Started At | Date + Time picker | Auto-fills current time; editable |
| Notes | Text input | Optional, e.g. "baby seemed gassy" |

---

### Tab B: Bottle
| Field | Type | Notes |
|---|---|---|
| Milk Type | Radio | Breast Milk (Pumped) / Formula (Pormula) |
| Formula Brand | Quick-select chips | NAN, Similac, Enfamil, Promil, Nido, S-26, Other (text input) — only shown if Formula selected |
| Volume (ml) | Number stepper + input | Stepper: +10ml / −10ml buttons. Range: 5–500ml |
| Unit toggle | ml / oz | User can toggle; stored internally as ml |
| Started At | Date + Time picker | Auto-fills current time |
| Notes | Text input | Optional |

**DOH Milk Code note**: Display formula brand chips for LOGGING only. No brand logos, no promotional language anywhere in the app.

---

### Tab C: Solids (enabled only when baby ≥ 4 months old)
| Field | Type | Notes |
|---|---|---|
| Food Item | Text input + quick-select | Quick-select chips for common PH foods: Lugaw, Kamote, Kalabasa, Saging, Malunggay, Itlog, Manok, Isda |
| Amount | Text input | Free text, e.g. "3 tbsp", "half a bowl" |
| Texture | Radio | Puree / Mashed / Soft Lumps / Finger Food |
| Reaction | Radio | No reaction 😊 / Mild reaction 😐 / Allergic reaction 😨 |
| Started At | Date + Time picker | |
| Notes | Text input | Optional |

If baby has known allergies (from profile), show a warning banner when a common allergen food is typed.

---

## Screen 3: Feeding Reminder Settings

| Setting | Type | Notes |
|---|---|---|
| Enable Reminders | Toggle | On/Off |
| Reminder Type | Radio | Every X hours from last feed / Fixed times daily |
| Interval (if interval type) | Stepper | Every 1h / 1.5h / 2h / 2.5h / 3h / 4h |
| Fixed Times (if fixed type) | Time picker list | Add up to 8 times per day |
| Reminder Message | Text input | Default: "🍼 Time to feed [nickname]!" — editable |

Smart reminder logic: if no feed logged within the set interval, send push notification.

---

## AI Tip (shown on Feeding Log screen)
Pulled from Claude API based on baby's age. Examples:
- 0–6 months: "Exclusive breastfeeding for 6 months is recommended by DOH Philippines and WHO. 🤱"
- 4–6 months: "Ready to start solids? Begin with single-ingredient purees like kamote or kalabasa! 🥕"
- 6–12 months: "Lugaw with malunggay is a great iron-rich meal for [nickname] at this stage! 🌿"

---

## Data Stored (feeding_logs table)
See CLAUDE.md database schema. Key fields:
- feed_type: 'breastfeed' | 'bottle' | 'solids'
- breast_side: 'left' | 'right' | 'both' | null
- volume_ml: number | null
- formula_brand: string | null
- food_item: string | null
- started_at: timestamp
- ended_at: timestamp | null
- notes: string | null
