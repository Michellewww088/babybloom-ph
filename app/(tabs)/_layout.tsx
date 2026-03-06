import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';

const PINK  = Colors.primaryPink;
const GRAY  = Colors.lightGray;

function HomeHeader() {
  return (
    <LinearGradient
      colors={['#E8637C', '#F0A0B0', '#F5C5CF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={hs.gradient}
    >
      <View style={hs.logoWrap}>
        <Image source={require('../../assets/images/icon.png')} style={hs.logo} />
      </View>
      <Text style={hs.title}>BabyBloom PH</Text>
    </LinearGradient>
  );
}

const hs = StyleSheet.create({
  gradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  logoWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#fff', overflow: 'hidden' },
  logo:     { width: 72, height: 72, marginTop: -16, marginLeft: -16 },
  title:    { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 0.3 },
});

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
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} />,
          header: () => <HomeHeader />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{ title: t('tabs.calendar'), tabBarIcon: ({ color }) => <TabIcon emoji="📅" color={color} />, headerStyle: { backgroundColor: '#FFF0F4' }, headerTitleStyle: { color: PINK, fontWeight: '700' } }}
      />
      <Tabs.Screen
        name="vaccines"
        options={{ title: t('tabs.vaccines'), tabBarIcon: ({ color }) => <TabIcon emoji="💉" color={color} />, headerStyle: { backgroundColor: '#FFF0F4' }, headerTitleStyle: { color: PINK, fontWeight: '700' } }}
      />
      <Tabs.Screen
        name="encyclopedia"
        options={{ title: t('tabs.encyclopedia'), tabBarIcon: ({ color }) => <TabIcon emoji="📚" color={color} />, headerStyle: { backgroundColor: '#FFF0F4' }, headerTitleStyle: { color: PINK, fontWeight: '700' } }}
      />
      <Tabs.Screen
        name="milestones"
        options={{ title: t('tabs.milestones'), tabBarIcon: ({ color }) => <TabIcon emoji="⭐" color={color} />, headerStyle: { backgroundColor: '#FFF0F4' }, headerTitleStyle: { color: PINK, fontWeight: '700' } }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 22, opacity: color === Colors.primaryPink ? 1 : 0.5 }}>{emoji}</Text>;
}
