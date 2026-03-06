/**
 * LogoBadge — BabyBloom PH illustrated logo mark.
 * Rendered as a scalable SVG: two pink "B" letters flanking a cute baby face.
 * Matches the brand reference illustration.
 */

import Svg, {
  Rect, Circle, Ellipse, Path,
  Text as SvgText,
} from 'react-native-svg';

interface Props {
  size?: number;
}

export default function LogoBadge({ size = 100 }: Props) {
  // All coordinates are designed on a 100×100 viewBox.
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">

      {/* ── White rounded-square badge ───────────────────────────── */}
      <Rect
        width="100" height="100" rx="24" ry="24"
        fill="white"
      />

      {/* ── B letters (behind face) ───────────────────────────────── */}
      <SvgText
        x="3" y="72"
        fontSize="52" fontWeight="900"
        fill="#E63B6F"
        fontFamily="System"
      >{'B'}</SvgText>

      <SvgText
        x="58" y="72"
        fontSize="52" fontWeight="900"
        fill="#E63B6F"
        fontFamily="System"
      >{'B'}</SvgText>

      {/* ── Baby face circle (overlaps B letters) ─────────────────── */}
      <Circle cx="50" cy="62" r="24"
        fill="#FDDBA8" stroke="#F5C07A" strokeWidth="1.5"
      />

      {/* ── Hair tuft ────────────────────────────────────────────── */}
      <Ellipse cx="49" cy="39" rx="6" ry="5" fill="#C49A6C" />

      {/* ── Flower on hair (top-right of head) ───────────────────── */}
      {/* Petals — 5 small circles around centre */}
      <Circle cx="59" cy="31" r="3.5" fill="#F472B6" opacity="0.9" />
      <Circle cx="65" cy="36" r="3.5" fill="#F472B6" opacity="0.9" />
      <Circle cx="63" cy="43" r="3.5" fill="#F472B6" opacity="0.9" />
      <Circle cx="56" cy="44" r="3.5" fill="#F472B6" opacity="0.9" />
      <Circle cx="54" cy="36" r="3.5" fill="#F472B6" opacity="0.9" />
      {/* Flower centre */}
      <Circle cx="59" cy="38" r="4" fill="#E63B6F" />
      <Circle cx="59" cy="38" r="2" fill="#FCD34D" />

      {/* ── Closed happy eyes (upward-arc = smiling) ─────────────── */}
      <Path
        d="M 36 59 Q 40.5 55 45 59"
        stroke="#5D3A1A" strokeWidth="2.5"
        fill="none" strokeLinecap="round"
      />
      <Path
        d="M 55 59 Q 59.5 55 64 59"
        stroke="#5D3A1A" strokeWidth="2.5"
        fill="none" strokeLinecap="round"
      />

      {/* ── Rosy cheeks ──────────────────────────────────────────── */}
      <Ellipse cx="36" cy="68" rx="7" ry="4.5"
        fill="rgba(240,100,100,0.28)"
      />
      <Ellipse cx="64" cy="68" rx="7" ry="4.5"
        fill="rgba(240,100,100,0.28)"
      />

      {/* ── Tiny smile ───────────────────────────────────────────── */}
      <Path
        d="M 44 73 Q 50 78 56 73"
        stroke="#C49A6C" strokeWidth="1.8"
        fill="none" strokeLinecap="round"
      />

    </Svg>
  );
}
