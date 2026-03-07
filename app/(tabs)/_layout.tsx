/**
 * _layout.tsx — BabyBloom PH Tab Navigation
 * BMAD: 5 tabs with custom SVG icons, brand pink #E63B6F active state,
 *       gradient page headers for tabs 2–5, home has no header (handled in index.tsx)
 */

import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Line, Polygon, Ellipse } from 'react-native-svg';
import Colors from '../../constants/Colors';

const PINK   = Colors.primaryPink;  // #E63B6F
const GRAY   = '#B8B8CC';
const ACTIVE_BG = '#FFE4EE';

// ─────────────────────────────────────────────────────────────────────────────
// SVG Tab Icons  (filled when active, outlined when inactive)
// ─────────────────────────────────────────────────────────────────────────────

function HouseIcon({ active }: { active: boolean }) {
  const c = active ? PINK : GRAY;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      {/* Roof */}
      <Path
        d="M3 11 L12 3 L21 11"
        stroke={c} strokeWidth="2.2" fill="none"
        strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Walls */}
      <Path
        d="M5 11 L5 21 L10 21 L10 15 Q10 14 11 14 L13 14 Q14 14 14 15 L14 21 L19 21 L19 11"
        fill={active ? ACTIVE_BG : 'none'} stroke={c} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Chimney dot (active state heart accent) */}
      {active && (
        <Path
          d="M10.5 8.5 Q12 6.5 13.5 8.5 Q15 10.5 12 12.5 Q9 10.5 10.5 8.5Z"
          fill={PINK} opacity="0.75"
        />
      )}
    </Svg>
  );
}

function CalendarIcon({ active }: { active: boolean }) {
  const c = active ? PINK : GRAY;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      {/* Body */}
      <Rect x="3" y="6" width="18" height="15" rx="3"
        fill={active ? ACTIVE_BG : 'none'} stroke={c} strokeWidth="2" />
      {/* Top bar */}
      <Rect x="3" y="6" width="18" height="5.5" rx="3"
        fill={c} opacity="0.85" />
      {/* Binding tabs */}
      <Line x1="8" y1="3.5" x2="8" y2="7.5" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="16" y1="3.5" x2="16" y2="7.5" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
      {/* Date dots */}
      <Circle cx="8"  cy="15" r="1.6" fill={c} />
      <Circle cx="12" cy="15" r="1.6" fill={c} />
      <Circle cx="16" cy="15" r="1.6" fill={c} />
      <Circle cx="8"  cy="19" r="1.6" fill={c} />
      <Circle cx="12" cy="19" r="1.6" fill={c} />
    </Svg>
  );
}

function SyringeIcon({ active }: { active: boolean }) {
  const c = active ? PINK : GRAY;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      {/* Barrel */}
      <Rect x="7" y="9" width="11" height="6" rx="3"
        fill={active ? ACTIVE_BG : 'none'} stroke={c} strokeWidth="2" />
      {/* Liquid fill (active) */}
      {active && <Rect x="8" y="10" width="6" height="4" rx="2" fill={PINK} opacity="0.35" />}
      {/* Plunger handle */}
      <Line x1="18" y1="9"  x2="22" y2="9"  stroke={c} strokeWidth="2" strokeLinecap="round" />
      <Line x1="18" y1="15" x2="22" y2="15" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <Line x1="21" y1="7"  x2="21" y2="17" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
      {/* Needle */}
      <Line x1="7" y1="12" x2="2.5" y2="12" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="2.5" y1="12" x2="1.5" y2="13.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      {/* Heart (active badge) */}
      {active && (
        <Path d="M13 6 Q14 4.5 15 6 Q16.5 7.5 14 9.5 Q11.5 7.5 13 6Z"
          fill={PINK} opacity="0.8" />
      )}
    </Svg>
  );
}

function BookIcon({ active }: { active: boolean }) {
  const c = active ? PINK : GRAY;
  const bg = active ? ACTIVE_BG : 'none';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      {/* Left page */}
      <Path d="M3 5 Q3 4 4.5 4 L11.5 4 L11.5 20 L4.5 20 Q3 20 3 19 Z"
        fill={bg} stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      {/* Right page */}
      <Path d="M12.5 4 L19.5 4 Q21 4 21 5 L21 19 Q21 20 19.5 20 L12.5 20 Z"
        fill={bg} stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      {/* Spine crease */}
      <Line x1="12" y1="4" x2="12" y2="20" stroke={c} strokeWidth="2" />
      {/* Page lines */}
      <Line x1="5"  y1="9"  x2="10" y2="9"  stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity="0.65" />
      <Line x1="5"  y1="12" x2="10" y2="12" stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity="0.65" />
      <Line x1="5"  y1="15" x2="10" y2="15" stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity="0.65" />
      <Line x1="14" y1="9"  x2="19" y2="9"  stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity="0.65" />
      <Line x1="14" y1="12" x2="19" y2="12" stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity="0.65" />
      <Line x1="14" y1="15" x2="19" y2="15" stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity="0.65" />
    </Svg>
  );
}

function StarIcon({ active }: { active: boolean }) {
  const c = active ? PINK : GRAY;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M12 2 L14.6 9.3 L22.4 9.3 L16 14.1 L18.6 21.4 L12 16.8 L5.4 21.4 L8 14.1 L1.6 9.3 L9.4 9.3 Z"
        fill={active ? PINK : 'none'}
        stroke={c} strokeWidth="1.8" strokeLinejoin="round"
      />
      {/* Inner sparkle (active) */}
      {active && <Circle cx="12" cy="13" r="2.2" fill="white" opacity="0.5" />}
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab icon wrapper (pill highlight when active)
// ─────────────────────────────────────────────────────────────────────────────

function TabIcon({
  Icon, active,
}: { Icon: React.FC<{ active: boolean }>; active: boolean }) {
  return (
    <View style={[ti.wrap, active && ti.wrapActive]}>
      <Icon active={active} />
    </View>
  );
}

const ti = StyleSheet.create({
  wrap:       { width: 44, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  wrapActive: { backgroundColor: ACTIVE_BG },
});

// ─────────────────────────────────────────────────────────────────────────────
// Gradient page header (tabs 2–5)
// ─────────────────────────────────────────────────────────────────────────────

function CutePageHeader({ title, emoji, colors }: {
  title: string; emoji: string; colors: [string, string];
}) {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      style={ph.bar}
    >
      <View style={ph.iconPill}>
        <Text style={ph.icon}>{emoji}</Text>
      </View>
      <Text style={ph.title}>{title}</Text>
      <Text style={ph.deco1}>🌸</Text>
      <Text style={ph.deco2}>✨</Text>
    </LinearGradient>
  );
}

const ph = StyleSheet.create({
  bar:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 13, gap: 12 },
  iconPill: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.32)', alignItems: 'center', justifyContent: 'center' },
  icon:     { fontSize: 21 },
  title:    { fontSize: 17, fontWeight: '800', color: '#fff', flex: 1, letterSpacing: 0.3 },
  deco1:    { fontSize: 17, opacity: 0.65 },
  deco2:    { fontSize: 13, opacity: 0.5 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────────────────────────────────────

export default function TabLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   PINK,
        tabBarInactiveTintColor: GRAY,
        tabBarStyle: {
          backgroundColor:  '#FFFFFF',
          borderTopColor:   '#F8E4EC',
          borderTopWidth:   1.5,
          height:           68,
          paddingBottom:    12,
          paddingTop:       6,
          shadowColor:      PINK,
          shadowOpacity:    0.1,
          shadowRadius:     12,
          elevation:        12,
        },
        tabBarLabelStyle:   { fontSize: 10, fontWeight: '700', marginTop: 2 },
        headerShadowVisible: false,
      }}
    >
      {/* Tab 1 — Home / Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          headerShown: false,   // index.tsx owns its own top nav bar
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={HouseIcon} active={focused} />
          ),
        }}
      />

      {/* Tab 2 — Calendar */}
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('tabs.calendar'),
          header: () => (
            <CutePageHeader
              title={t('calendar.title')}
              emoji="📅"
              colors={['#F06292', '#F48FB1']}
            />
          ),
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={CalendarIcon} active={focused} />
          ),
        }}
      />

      {/* Tab 3 — Vaccines */}
      <Tabs.Screen
        name="vaccines"
        options={{
          title: t('tabs.vaccines'),
          header: () => (
            <CutePageHeader
              title={t('vaccines.title')}
              emoji="💉"
              colors={['#5BC8F5', '#90D8F8']}
            />
          ),
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={SyringeIcon} active={focused} />
          ),
        }}
      />

      {/* Tab 4 — Encyclopedia / Guide */}
      <Tabs.Screen
        name="encyclopedia"
        options={{
          title: t('tabs.encyclopedia'),
          header: () => (
            <CutePageHeader
              title={t('encyclopedia.title')}
              emoji="📖"
              colors={['#4CAF7D', '#81C784']}
            />
          ),
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={BookIcon} active={focused} />
          ),
        }}
      />

      {/* Tab 5 — Milestones */}
      <Tabs.Screen
        name="milestones"
        options={{
          title: t('tabs.milestones'),
          header: () => (
            <CutePageHeader
              title={t('milestones.title')}
              emoji="⭐"
              colors={['#FFB74D', '#FFC870']}
            />
          ),
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={StarIcon} active={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
