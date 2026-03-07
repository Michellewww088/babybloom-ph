import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';

const PINK = Colors.primaryPink;
const GRAY = Colors.lightGray;

// ── Cute page header for non-home tabs ────────────────────────────────────────
function CutePageHeader({ title, emoji, colors }: {
  title: string; emoji: string; colors: [string, string];
}) {
  return (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={hs.gradient}>
      <View style={hs.emojiCircle}><Text style={hs.emoji}>{emoji}</Text></View>
      <Text style={hs.title}>{title}</Text>
      <Text style={hs.deco1}>🌸</Text>
      <Text style={hs.deco2}>✨</Text>
    </LinearGradient>
  );
}

const hs = StyleSheet.create({
  gradient:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  emojiCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' },
  emoji:       { fontSize: 20 },
  title:       { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: 0.3, flex: 1 },
  deco1:       { fontSize: 16, opacity: 0.7 },
  deco2:       { fontSize: 13, opacity: 0.55 },
});

// ── Tab icon ─────────────────────────────────────────────────────────────────
function TabIcon({ emoji, active }: { emoji: string; active: boolean }) {
  return (
    <View style={[ti.wrap, active && ti.wrapActive]}>
      <Text style={{ fontSize: 20, opacity: active ? 1 : 0.45 }}>{emoji}</Text>
    </View>
  );
}

const ti = StyleSheet.create({
  wrap:       { width: 42, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  wrapActive: { backgroundColor: '#FFE4EE' },
});

// ── Layout ────────────────────────────────────────────────────────────────────
export default function TabLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: PINK,
        tabBarInactiveTintColor: GRAY,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#FCE4EC',
          borderTopWidth: 1.5,
          height: 66,
          paddingBottom: 10,
          paddingTop: 6,
          shadowColor: '#E87090',
          shadowOpacity: 0.12,
          shadowRadius: 10,
          elevation: 10,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" active={focused} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('tabs.calendar'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="🗓️" active={focused} />,
          header: () => <CutePageHeader title={t('calendar.title')} emoji="🗓️" colors={['#F48FB1', '#F8BBD9']} />,
        }}
      />
      <Tabs.Screen
        name="vaccines"
        options={{
          title: t('tabs.vaccines'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="💉" active={focused} />,
          header: () => <CutePageHeader title={t('vaccines.title')} emoji="💉" colors={['#64B5F6', '#BBDEFB']} />,
        }}
      />
      <Tabs.Screen
        name="encyclopedia"
        options={{
          title: t('tabs.encyclopedia'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="📖" active={focused} />,
          header: () => <CutePageHeader title={t('encyclopedia.title')} emoji="📖" colors={['#81C784', '#C8E6C9']} />,
        }}
      />
      <Tabs.Screen
        name="milestones"
        options={{
          title: t('tabs.milestones'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="⭐" active={focused} />,
          header: () => <CutePageHeader title={t('milestones.title')} emoji="⭐" colors={['#FFB74D', '#FFE0B2']} />,
        }}
      />
    </Tabs>
  );
}
