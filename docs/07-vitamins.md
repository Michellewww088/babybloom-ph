# Module 07 — Vitamins & Medications (Bitamina at Gamot / 维生素与药物)

## Screens
1. Vitamins & Medications Main Screen
2. Add / Edit Entry Modal
3. Garantisadong Pambata (GP) Tracker

---

## Screen 1: Main Screen

### Layout
- Header: "Vitamins & Meds 💊"
- Two tabs: **Vitamins & Supplements** | **Medications**
- "Recommended for [nickname]" section at top — AI-suggested vitamins for baby's current age
- Active entries list (currently taking)
- Past entries list (completed/stopped)
- "Add" button (+ icon)

---

## Recommended Vitamins by Age (constants/vitamins-guide.ts)

```typescript
export const VITAMIN_RECOMMENDATIONS = [
  {
    ageRangeMonths: [0, 6],
    recommendations: [
      {
        name: "Vitamin D",
        dose: "400 IU per day",
        reason: { en: "Breastfed babies need Vitamin D supplementation as breast milk contains very little. Sunlight in PH is available but not always sufficient.", fil: "Ang mga sanggol na breastfed ay kailangan ng Vitamin D dahil mababa ang nilalaman nito sa gatas ng ina.", zh: "母乳中维生素D含量极低，纯母乳喂养的宝宝需要额外补充。" },
        form: "Liquid drops (e.g., D-Vi-Sol, TheraTears Baby)",
        source: "AAP, DOH Philippines",
        priority: "high"
      },
      {
        name: "Iron Supplement",
        dose: "1 mg/kg/day",
        reason: { en: "For preterm babies or exclusively breastfed babies from 4 months — breast milk is low in iron.", fil: "Para sa mga premature o exclusively breastfed na sanggol mula 4 na buwan.", zh: "早产儿或纯母乳喂养4个月以上的婴儿需要补铁。" },
        form: "Liquid iron drops",
        source: "AAP, DOH Philippines",
        priority: "medium",
        condition: "preterm OR exclusively_breastfed_after_4_months"
      }
    ]
  },
  {
    ageRangeMonths: [6, 12],
    recommendations: [
      {
        name: "Vitamin D",
        dose: "400 IU per day",
        reason: { en: "Continue Vitamin D even after solids start, especially if breastfeeding continues.", fil: "Ituloy ang Vitamin D kahit nagsimula na ng solid foods.", zh: "即使开始添加辅食后，仍建议继续补充维生素D。" },
        form: "Liquid drops",
        source: "AAP",
        priority: "high"
      },
      {
        name: "Vitamin A (via Garantisadong Pambata)",
        dose: "100,000 IU (free from DOH)",
        reason: { en: "DOH's Garantisadong Pambata program provides free Vitamin A every 6 months at BHS. Visit every January and July.", fil: "Ang Garantisadong Pambata ng DOH ay nagbibigay ng libreng Vitamin A tuwing Enero at Hulyo sa BHS.", zh: "菲律宾卫生部Garantisadong Pambata项目每年1月和7月在社区卫生站提供免费维生素A。" },
        form: "Capsule (administered at BHS)",
        source: "DOH Philippines Garantisadong Pambata Program",
        priority: "high",
        isFreeGovProgram: true
      }
    ]
  },
  {
    ageRangeMonths: [12, 36],
    recommendations: [
      {
        name: "Vitamin D",
        dose: "600 IU per day",
        reason: { en: "Continue if limited sun exposure or primarily drinking non-fortified milk.", fil: "Ituloy kung limitado ang araw o umiinom ng hindi fortified na gatas.", zh: "如果日晒不足或主要喝非强化奶，继续补充维生素D。" },
        form: "Drops or chewable",
        source: "AAP",
        priority: "medium"
      },
      {
        name: "Vitamin A (via Garantisadong Pambata)",
        dose: "200,000 IU (free from DOH)",
        reason: { en: "Higher dose after age 1. Visit BHS every January and July.", fil: "Mas mataas na dosis pagkatapos ng 1 taon. Pumunta sa BHS tuwing Enero at Hulyo.", zh: "1岁后剂量增加。每年1月和7月前往社区卫生站领取。" },
        form: "Capsule (administered at BHS)",
        source: "DOH Philippines",
        priority: "high",
        isFreeGovProgram: true
      },
      {
        name: "Multivitamin (optional)",
        dose: "As per product label",
        reason: { en: "If child is a picky eater, a children's multivitamin can help fill nutritional gaps.", fil: "Kung mahilig pumili ng pagkain ang bata, maaaring makatulong ang multivitamin.", zh: "如果孩子挑食，儿童复合维生素有助于补充营养缺口。" },
        form: "Liquid or chewable",
        source: "AAP",
        priority: "low"
      }
    ]
  }
];
```

---

## Screen 2: Add / Edit Entry Modal

### For Vitamins / Supplements
| Field | Type | Notes |
|---|---|---|
| Name | Text + quick-select | Pre-filled options from recommendations; free text allowed |
| Type | Radio | Vitamin / Supplement / Mineral |
| Dose | Text input | e.g., "400 IU", "5ml", "1 chewable" |
| Frequency | Dropdown | Once daily / Twice daily / Every other day / Weekly / As needed |
| Time of Day | Time picker(s) | e.g., 8:00 AM (can add multiple) |
| Start Date | Date picker | |
| End Date | Date picker | Optional — leave blank for ongoing |
| Notes | Text input | e.g., "give with food" |
| Set Reminder | Toggle | Sends daily notification at set time |

### For Medications (doctor-prescribed)
Same fields as above, plus:
| Field | Type | Notes |
|---|---|---|
| Prescribed By | Text input | Doctor's name |
| Diagnosis / Reason | Text input | e.g., "for fever", "antibiotic for ear infection" |
| Duration | Number + unit | e.g., "7 days" |
| Important: Complete Full Course | Banner | Show for antibiotics: "Always complete the full course even if baby feels better!" |

---

## Screen 3: Garantisadong Pambata (GP) Tracker

### Layout
- Header: "Garantisadong Pambata 🌟"
- Explanation card: "Free Vitamin A + Deworming from DOH every January and July"
- Log of past GP visits (date + barangay/BHS location)
- "Log GP Visit" button

### GP Visit Entry
| Field | Type |
|---|---|
| Date | Date picker |
| BHS / Health Center | Text input |
| Vitamins received | Checkboxes: Vitamin A ✓ / Deworming tablet ✓ |
| Notes | Text input |

### Auto-Reminder
- Every December 15: "Garantisadong Pambata is coming in January! Plan to visit your BHS."
- Every June 15: "Garantisadong Pambata is coming in July! Plan to visit your BHS."
