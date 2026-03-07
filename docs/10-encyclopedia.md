# Module 10 — Parenting Encyclopedia (Gabay sa Pagpapalaki / 育儿百科)

## This is Page 4 of the bottom tab navigation.

## Screens
1. Encyclopedia Home (browse)
2. Article Detail Screen
3. My Saved Articles (bookmarks)

---

## Screen 1: Encyclopedia Home

### Layout
- Header: "Parenting Guide 📚" / "Gabay sa Pagpapalaki 📚" / "育儿百科 📚"
- Search bar (searches article titles and content)
- "Recommended for You" horizontal scroll — articles matching baby's current age
- Browse by Age Stage (vertical list of sections)
- Browse by Topic (horizontal chip filter)

### Age Stage Sections
Each section is an expandable accordion or tappable category card:

| Stage | EN | Filipino | 中文 |
|---|---|---|---|
| Pregnancy | Pregnancy | Pagbubuntis | 孕期 |
| 0–1 Month | Newborn | Bagong Silang | 新生儿（0–1个月）|
| 1–3 Months | 1–3 Months | 1–3 Buwan | 1–3个月 |
| 3–6 Months | 3–6 Months | 3–6 Buwan | 3–6个月 |
| 6–9 Months | 6–9 Months | 6–9 Buwan | 6–9个月 |
| 9–12 Months | 9–12 Months | 9–12 Buwan | 9–12个月 |
| 1–2 Years | 1–2 Years | 1–2 Taon | 1–2岁 |
| 2–3 Years | 2–3 Years | 2–3 Taon | 2–3岁 |
| 3–6 Years | 3–6 Years | 3–6 Taon | 3–6岁 |

### Topic Chips (horizontal filter)
🍼 Feeding | 😴 Sleep | 📏 Development | 🩺 Health & Illness | 🛡️ Safety | 💆 Mental Health | 🌿 Filipino Traditions

---

## Screen 2: Article Detail Screen

### Article Layout
- Back button (top left)
- Article header image (illustration)
- Title (bold, 22sp)
- Metadata row: estimated read time + source (e.g., "5 min read • Source: DOH Philippines, WHO")
- Key Takeaways box (colored card, 3–5 bullet points at top)
- Article body (prose with sub-headings every 2–3 paragraphs)
- Source references at bottom
- Bookmark button (top right — saves to My Library)
- Share button: WhatsApp / Messenger / Copy link

---

## Priority Articles — Philippines-Specific (must build first)

### Newborn / 0–1 Month
1. **"Breastfeeding 101 para sa Bagong Nanay"**
   - Topics: Benefits, correct latch, common problems, how to know baby is getting enough, DOH Milk Code basics
   - Source: DOH Philippines, WHO, UNICEF

2. **"Ligtas na Co-Sleeping: Ang Tamang Paraan"**
   - Topics: Safe co-sleeping surface, bedding rules, when NOT to co-sleep (alcohol, smoking, medication), SIDS risk reduction
   - Source: UNICEF Philippines, AAP Safe Sleep Guidelines (culturally adapted)

3. **"Ano ang MCH Booklet at Paano Gamitin?"**
   - Topics: What is the MCH booklet, where to get it, what to bring to checkups, how BabyBloom PH is the digital version
   - Source: DOH Philippines

4. **"PSA Birth Registration: Gawin Mo Ito Sa Loob ng 30 Araw"**
   - Topics: Requirements, LCR process, PSA birth certificate, penalties for late registration
   - Source: PSA Philippines

5. **"PhilHealth Para sa Iyong Sanggol"**
   - Topics: Enrolling newborn, newborn care package (NCP) benefits, how to claim
   - Source: PhilHealth Philippines

### Feeding
6. **"Kailan Magsimula ng Solid Foods?"**
   - Topics: Signs of readiness, 4–6 month guide, first foods for Filipino babies (kamote, kalabasa, lugaw)
   - Source: DOH IYCF, WHO

7. **"Malunggay at Kamote: Superfoods para sa Iyong Sanggol"**
   - Topics: Nutritional benefits, how to prepare, age-appropriate serving ideas
   - Source: FNRI Philippines, DOH

8. **"Ano ang Dapat Iwasan sa Pagkain ng Sanggol?"**
   - Topics: Honey (botulism risk under 1), whole nuts (choking), salt/sugar, cow's milk as main drink under 1, uncooked eggs
   - Source: AAP, WHO

### Sleep
9. **"Bakit Kailangang Matulog ng Matagal ang Sanggol?"**
   - Topics: Why sleep matters for brain development, sleep cycles in infants, WHO sleep guidelines
   - Source: WHO, NSF

### Development
10. **"Mga Unang Salita ng Iyong Sanggol: Language Development Guide"**
    - Topics: How language develops, bilingual/trilingual babies, when to be concerned
    - Source: AAP

### Health & Illness
11. **"Lagnat ng Sanggol: Kailan Dapat Pumunta sa Doktor?"**
    - Topics: Temperature guide, what is a fever in PH context, paracetamol dosing by weight, red flags
    - Source: Philippine Pediatric Society (PPS), DOH

12. **"Diarrhea sa Sanggol: ORS at Pag-aalaga sa Bahay"**
    - Topics: Oral rehydration solution (ORS), signs of dehydration, when to go to hospital — very relevant in PH
    - Source: DOH Philippines, WHO

### Mental Health
13. **"Postpartum Depression: Hindi Ka Nag-iisa, Nanay"**
    - Topics: Symptoms, baby blues vs PPD, seeking help, support resources in PH, partner's role
    - Source: Philippine Obstetrical and Gynecological Society (POGS)

### Filipino Traditions
14. **"Pamahiin o Katotohanan? Science vs. Filipino Baby Beliefs"**
    - Topics: Common Filipino baby beliefs examined (hilot, usog, binding the umbilical cord, keeping baby indoors for 40 days)
    - Tone: Respectful, not dismissive — validate cultural context while clarifying safety
    - Source: PPS, AAP

---

## Article Data Structure (for database)
```typescript
interface Article {
  id: string;
  titleEN: string;
  titleFIL: string;
  titleZH: string;
  bodyEN: string;     // Markdown content
  bodyFIL: string;
  bodyZH: string;
  ageStages: string[];   // e.g., ['0-1m', '1-3m']
  topics: string[];      // e.g., ['feeding', 'sleep']
  readTimeMinutes: number;
  sources: string[];
  isPHSpecific: boolean;
  publishedAt: Date;
  imageUrl: string;
}
```

Store articles in Supabase `articles` table. Use Supabase full-text search for the search bar.
