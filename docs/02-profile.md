# Module 02 — Child Profile

## Screens in this module
1. Create Child Profile Screen
2. Edit Child Profile Screen
3. Child Switcher (component used in Dashboard top bar)

---

## Screen 1 & 2: Create / Edit Child Profile

### When it appears
- First time: right after Onboarding is completed
- After that: accessible from Dashboard top bar → tap child avatar → "Edit Profile" or "Add Child"

### Layout
- Scroll view with sections grouped by category
- Save button fixed at bottom
- For Edit mode: pre-fill all fields with existing data

---

## All Fields

### Photo
- Circular avatar (120px diameter)
- Tap to open: camera or gallery picker
- Default avatars: 4 cute illustrated options (boy/girl × light/dark skin tone)
- Stored in Supabase Storage, URL saved to children table

### Basic Info
| Field | Type | Required | Notes |
|---|---|---|---|
| First Name (Pangalan) | Text input | Yes | |
| Middle Name | Text input | No | Important in PH for legal names |
| Last Name (Apelyido) | Text input | Yes | |
| Nickname (Pangalan sa Bahay) | Text input | No | Used in AI messages and notifications |

### Personal Details
| Field | Type | Required | Notes |
|---|---|---|---|
| Sex (Kasarian) | Toggle | Yes | Boy 💙 / Girl 💗 / Prefer not to say |
| Birthday (Kaarawan) | Date picker | Yes | Calendar format, max = today |
| Birth Time | Time picker | No | 12-hour format (AM/PM) |
| Blood Type (Grupo ng Dugo) | Dropdown | No | A+, A−, B+, B−, AB+, AB−, O+, O−, Unknown |

### Birth Details
| Field | Type | Required | Notes |
|---|---|---|---|
| Birth Type (Uri ng Panganganak) | Radio | No | Normal (Vaginal) / Cesarean (CS) |
| Birth Weight (kg) | Number input | No | Decimal, e.g. 3.25 |
| Birth Height (cm) | Number input | No | Decimal, e.g. 50.5 |
| Gestational Age at Birth | Number input | No | Weeks — used for corrected age in growth charts. If < 37 weeks = preterm |

### Health Info
| Field | Type | Required | Notes |
|---|---|---|---|
| Known Allergies | Tag input | No | Multi-select tags: nuts, dairy, eggs, shellfish, wheat, soy, fish + custom |
| Pediatrician Name | Text input | No | Used in appointment reminders |
| Clinic / Hospital | Text input | No | |

### Government Records (Philippines-specific)
| Field | Type | Required | Notes |
|---|---|---|---|
| PhilHealth Member Number | Text input | No | For future PhilHealth integration |
| MCH Booklet Number | Text input | No | Mother and Child Health Booklet from BHS |

---

## Computed Fields (not stored, calculated on the fly)
- **Age**: calculated from birthday → show as "X months Y days" (under 2 years) or "X years Y months" (2 years+)
- **Corrected Age**: if gestational age < 37 weeks → corrected age = actual age minus (40 - gestational_age) weeks
- **Age in months**: used for WHO growth chart lookups and vaccine schedule

---

## Child Switcher Component
- Shown in Dashboard top bar (left side)
- If only 1 child: shows child avatar + name
- If 2+ children: horizontal scroll of circular avatars, tap to switch active child
- "Add Child" button at the end of the row (+ icon)
- Max children per account: 5

---

## Validation Rules
- First name and last name: required, min 1 character, max 50 characters
- Birthday: cannot be in the future
- Birth weight: 0.5 kg to 8.0 kg (reasonable range for newborns)
- Birth height: 25 cm to 65 cm
- Gestational age: 22 to 42 weeks
