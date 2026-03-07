# Module 08 — Insights & Reports (Ulat at Pagsusuri / 数据报告)

## Screens
1. Insights Main Screen (tabbed)
2. Growth Analysis Detail Screen
3. PDF Export / Share

---

## Screen 1: Insights Main Screen

### Layout
- Header: "Reports & Insights 📊" / "Ulat at Pagsusuri 📊" / "数据报告 📊"
- Date range selector: Today / This Week / This Month / Last 3 Months / Custom
- 4 tabs: **Feeding** | **Sleep** | **Growth** | **Vaccination**

---

### Tab 1: Feeding Report

#### Summary Row (top)
| Stat | Example value |
|---|---|
| Total Feeds | 42 this week |
| Total Volume (Bottle) | 2,940 ml this week |
| Avg per Feed | 120 ml |
| Breastfeed Sessions | 28 sessions / 14.5 hrs total |

#### Charts
1. **Daily Feed Volume Bar Chart** — bar per day, Y-axis = total ml, color split: breastfeed (pink) vs bottle (blue)
2. **Feed Frequency Line Chart** — number of feeds per day over selected period
3. **Feed Type Pie Chart** — breastfeed % vs bottle % vs solids %

#### AI Feeding Insight
Claude API generated, 2–3 sentences:
- Example (EN): "Mia had 42 feeds this week with an average of 120ml per bottle feed. Her feeding volume has increased by 12% compared to last week — great progress! At 3 months, WHO recommends feeding every 2–3 hours on demand."
- Example (FIL): "Si Mia ay nagpakain ng 42 beses ngayong linggo na may average na 120ml bawat bote. Tumaas ang kanyang volume ng 12% kumpara sa nakaraang linggo — kahanga-hanga! Sa edad na 3 buwan, inirerekomenda ng WHO ang pagpapakain tuwing 2–3 oras."

---

### Tab 2: Sleep Report

#### Summary Row
| Stat | Example value |
|---|---|
| Total Sleep This Week | 98 hours |
| Average per Day | 14.0 hours |
| Night Sleep avg | 8.5 hours |
| Naps avg | 5.5 hours / 4 naps |
| Longest Stretch | 4 hours 20 minutes |

#### Charts
1. **Daily Sleep Hours Bar Chart** — bar per day, split: night sleep (dark purple) vs naps (lavender)
2. **Sleep Pattern Heatmap** — grid: rows = days of week, columns = hours of day (0–23), color intensity = sleeping vs awake
3. **Reference Line** — WHO recommended sleep for baby's age shown on bar chart

#### AI Sleep Insight
Claude API generated. Example: "Mia is sleeping an average of 14.0 hours per day this week, which is within the WHO recommended range of 14–17 hours for newborns. Her longest sleep stretch of 4h 20m is great! As she grows, you may see longer stretches. 😴"

---

### Tab 3: Growth Report

#### Summary Row
| Stat | Example |
|---|---|
| Current Weight | 5.2 kg (65th percentile) |
| Current Height | 58 cm (55th percentile) |
| Head Circumference | 39 cm (50th percentile) |
| Last Measured | March 1, 2026 |
| Weight gain since birth | +1.95 kg |

#### Charts
1. **WHO Growth Chart — Weight-for-Age**
   - X-axis: age in months (0–24 or 0–60)
   - Y-axis: weight in kg
   - Lines: WHO 3rd, 15th, 50th, 85th, 97th percentile curves (different colors)
   - Child's data points: pink dots connected by a line
   - Interactive: tap a dot to see exact measurement + date
2. **WHO Growth Chart — Height-for-Age** (same structure)
3. **Weight Gain Progress Bar** — shows weight gain vs. expected gain for age

#### AI Growth Analysis
Claude API generated, longer narrative (3–5 sentences):
- Example: "Based on Mia's growth data, her weight is at the 65th percentile and her height is at the 55th percentile — both well within the healthy range according to WHO Child Growth Standards. Her weight gain of 1.95kg since birth reflects excellent growth. Her growth trajectory is consistent and trending upward. Keep up the great feeding routine, Nanay! 🌟"

---

### Tab 4: Vaccination Report

#### Summary
- Given: X vaccines ✅
- Upcoming (next 30 days): X vaccines ⏳
- Overdue: X vaccines ⚠️

#### Timeline View
Compact vaccine timeline showing all scheduled vaccines, color-coded by status.

#### AI Vaccination Note
Example: "Mia is up to date on all EPI vaccines! Her next vaccine is MMR at 9 months, due on June 15, 2026. A reminder has been set for June 8."

---

## Screen 2: Growth Analysis Detail Screen

Full-screen, scrollable. Shows all 4 WHO growth charts in full size (interactive Victory Native charts). Includes export button.

---

## Screen 3: PDF Export

"Export Report" button generates a PDF containing:
- Child's basic info (name, age, photo)
- Selected date range
- All 4 report tabs condensed
- Growth charts as images
- AI analysis text
- BabyBloom PH branding + "Powered by WHO Standards" note

PDF is generated client-side (react-native-html-to-pdf) and can be:
- Shared via WhatsApp / Messenger (very common in PH)
- Emailed to Pedia
- Saved to device

---

## WHO Growth Data Source
Load WHO growth reference data from `lib/who-growth.ts`.
Data comes from WHO Multicentre Growth Reference Study (public dataset).
Pre-process the CSV data into a TypeScript lookup table for fast percentile calculations.
Implement a function: `getWHOPercentile(gender, metric, ageInMonths, value)` → returns percentile number.
