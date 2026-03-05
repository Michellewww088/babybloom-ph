import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Colors from '../../constants/Colors';

const PINK  = Colors.primaryPink;   // #E63B6F — spec brand color
const GRAY  = Colors.lightGray;     // #9CA3AF

export default function TabLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: PINK,
        tabBarInactiveTintColor: GRAY,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F3F4F6',
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTitleStyle: { color: '#1F2937', fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('tabs.home'), tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} /> }}
      />
      <Tabs.Screen
        name="calendar"
        options={{ title: t('tabs.calendar'), tabBarIcon: ({ color }) => <TabIcon emoji="📅" color={color} /> }}
      />
      <Tabs.Screen
        name="vaccines"
        options={{ title: t('tabs.vaccines'), tabBarIcon: ({ color }) => <TabIcon emoji="💉" color={color} /> }}
      />
      <Tabs.Screen
        name="encyclopedia"
        options={{ title: t('tabs.encyclopedia'), tabBarIcon: ({ color }) => <TabIcon emoji="📚" color={color} /> }}
      />
      <Tabs.Screen
        name="milestones"
        options={{ title: t('tabs.milestones'), tabBarIcon: ({ color }) => <TabIcon emoji="⭐" color={color} /> }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 22, opacity: color === Colors.primaryPink ? 1 : 0.5 }}>{emoji}</Text>;
}
