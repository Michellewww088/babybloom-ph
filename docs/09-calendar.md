# Module 09 — Calendar & Reminders (Kalendaryo at Paalala / 日历与提醒)

## This is Page 2 of the bottom tab navigation.

## Screens
1. Calendar Main Screen
2. Add / Edit Reminder Modal
3. Notification Settings

---

## Screen 1: Calendar Main Screen

### Layout
- Header: "Calendar 📅" / "Kalendaryo 📅" / "日历 📅"
- View toggle: Month | Week | Day (default = Month)
- Month view: calendar grid with colored dots on dates that have events
- Below calendar: list of upcoming events (next 7 days)

### Event Dot Colors (color legend shown at bottom)
| Category | Color | Icon |
|---|---|---|
| Vaccine (Bakuna) | #E63B6F (Red-Pink) | 💉 |
| Doctor Checkup (Konsultasyon) | #1A73C8 (Blue) | 🏥 |
| Feeding Reminder (Pagpapakain) | #F5A623 (Gold) | 🍼 |
| Sleep Schedule (Tulog) | #8B5CF6 (Purple) | 😴 |
| Vitamins / Medication (Gamot) | #27AE7A (Mint) | 💊 |
| Garantisadong Pambata | #F5A623 (Gold + star) | 🌟 |
| Custom (Iba pa) | #9CA3AF (Gray) | 📝 |

### Upcoming Events List (below calendar)
Each row shows:
- Colored category icon (left)
- Event title (bold)
- Date + time
- Child name (if multiple children)
- Tap to view/edit

---

## Screen 2: Add / Edit Reminder Modal

### Fields
| Field | Type | Notes |
|---|---|---|
| Title | Text input | Required |
| Category | Dropdown | From category list above |
| Child | Selector | If multiple children |
| Date | Date picker | |
| Time | Time picker | 12-hour AM/PM format |
| All Day | Toggle | Hides time picker if on |
| Repeat | Dropdown | Does not repeat / Every X hours / Daily / Every X days / Weekly / Monthly |
| Repeat interval | Number input | Shown only if "Every X hours" or "Every X days" |
| End repeat | Date picker | Optional — when to stop repeating |
| Notify me | Dropdown | At time of event / 15 min before / 30 min before / 1 hour before / 1 day before |
| Notes | Text input | Optional |

---

## Auto-Generated Reminders

These are created automatically when a child profile is set up. Parents can edit or delete them.

### Vaccination Reminders
Generated from DOH EPI schedule based on child's birthday:
- Created 7 days before each scheduled vaccine
- Title: "💉 [Vaccine Name] due for [Child Nickname]"
- Category: Vaccine

### Well-Baby Checkup Reminders
Standard PPS (Philippine Pediatric Society) well-baby visit schedule:
- 1 week, 1 month, 2 months, 4 months, 6 months, 9 months, 12 months, 15 months, 18 months, 24 months, 3 years, 4 years, 5 years
- Created 3 days before scheduled date
- Title: "🏥 [X]-month well-baby checkup for [Child Nickname]"
- Category: Doctor Checkup

### Garantisadong Pambata Reminders
- Created December 15: "🌟 Garantisadong Pambata coming in January! Visit your BHS for free Vitamin A."
- Created June 15: "🌟 Garantisadong Pambata coming in July! Visit your BHS for free Vitamin A."
- Category: Garantisadong Pambata

---

## Screen 3: Notification Settings

| Setting | Type |
|---|---|
| Enable all notifications | Toggle (master) |
| Vaccine reminders | Toggle |
| Checkup reminders | Toggle |
| Feeding reminders | Toggle |
| Medication/Vitamin reminders | Toggle |
| Custom reminders | Toggle |
| Quiet hours (Do Not Disturb) | Time range picker (e.g., 10 PM – 6 AM) |

---

## Technical Notes
- Use Expo Notifications for all push notifications
- Schedule local notifications for recurring reminders (do not rely on server-side push for time-sensitive reminders)
- Request notification permissions on first reminder creation
- Handle permission denial gracefully: show in-app banner reminders if push not permitted
