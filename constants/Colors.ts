// BabyBloom PH — Design System Colors
// Source: CLAUDE.md

const Colors = {
  // ── Brand ────────────────────────────────────────────────────────────
  primaryPink:   '#E63B6F',   // main CTA buttons, brand
  softPink:      '#FFE4EE',   // backgrounds, cards

  // ── Accent ───────────────────────────────────────────────────────────
  gold:          '#F5A623',   // PH sun accent, warnings
  softGold:      '#FFF8E8',   // info boxes

  // ── Secondary ────────────────────────────────────────────────────────
  blue:          '#1A73C8',   // secondary actions, links
  softBlue:      '#E8F2FF',   // info backgrounds

  // ── Health states ─────────────────────────────────────────────────────
  mint:          '#27AE7A',   // success, health good
  softMint:      '#E0F7EF',   // success backgrounds

  // ── Text ─────────────────────────────────────────────────────────────
  dark:          '#1C1C3A',   // headings
  midGray:       '#4A4A6A',   // body text
  lightGray:     '#9CA3AF',   // placeholders, captions

  // ── Backgrounds ───────────────────────────────────────────────────────
  background:    '#FAFAFA',   // app background
  white:         '#FFFFFF',
  border:        '#F3F4F6',

  // ── WHO Percentile badges ─────────────────────────────────────────────
  percentileGreen:  '#27AE7A',  // 15th–85th — Normal
  percentileYellow: '#F5A623',  // 5th–15th or 85th–97th — Watch
  percentileRed:    '#E63B6F',  // <5th or >97th — Consult Pedia
} as const;

export default Colors;
