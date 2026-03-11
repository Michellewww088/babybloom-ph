// BabyBloom PH — Design System Colors
// Source: CLAUDE.md

export const Colors = {
  // ── Primary brand ─────────────────────────────────────────────────────
  primary:       '#E8527A',   // main CTA buttons, brand
  primaryLight:  '#F472A0',
  primaryBg:     '#FFF0F5',
  primarySoft:   '#FFD6E4',
  primaryPink:   '#E63B6F',   // legacy alias — prefer primary for new code
  softPink:      '#FFE4EE',   // legacy backgrounds, cards

  // ── Secondary (pregnancy / lavender) ──────────────────────────────────
  secondary:     '#C9A7E8',
  secondaryBg:   '#F0E6FF',

  // ── Accent (milestones / gold) ─────────────────────────────────────────
  accent:        '#D4A843',
  accentBg:      '#FFF8E1',
  gold:          '#F5A623',   // PH sun accent, warnings
  softGold:      '#FFF8E8',   // info boxes

  // ── Health / growth (mint green) ──────────────────────────────────────
  health:        '#5BBFA3',
  healthBg:      '#E4F7F2',
  mint:          '#27AE7A',   // success states, health good
  softMint:      '#E0F7EF',   // success backgrounds

  // ── Sleep (soft blue) ─────────────────────────────────────────────────
  sleep:         '#7DB8E8',
  sleepBg:       '#E3F2FF',
  blue:          '#1A73C8',   // secondary actions, links
  softBlue:      '#E8F2FF',   // info backgrounds

  // ── Warning (upcoming vaccines, missed logs) ───────────────────────────
  warning:       '#F59E0B',
  warningBg:     '#FFFBEB',

  // ── Danger (overdue, allergy alerts) ──────────────────────────────────
  danger:        '#EF4444',
  dangerBg:      '#FEF2F2',

  // ── Text ──────────────────────────────────────────────────────────────
  textDark:      '#2D2D3A',
  textMid:       '#6B7280',
  textLight:     '#9CA3AF',
  dark:          '#1C1C3A',   // headings (legacy)
  midGray:       '#4A4A6A',   // body text (legacy)
  lightGray:     '#9CA3AF',   // placeholders, captions (legacy)

  // ── Surfaces & borders ────────────────────────────────────────────────
  border:        '#F3E8EE',
  borderActive:  '#E8527A',
  surface:       '#FFFFFF',
  background:    '#FAFAFA',
  divider:       '#F3F4F6',
  white:         '#FFFFFF',   // legacy

  // ── Card shadow helper ─────────────────────────────────────────────────
  shadowColor:   '#E8527A',

  // ── WHO Percentile badges ──────────────────────────────────────────────
  percentileGreen:  '#27AE7A',  // 15th–85th — Normal
  percentileYellow: '#F5A623',  // 5th–15th or 85th–97th — Watch
  percentileRed:    '#E63B6F',  // <5th or >97th — Consult Pedia
} as const;

export default Colors;
