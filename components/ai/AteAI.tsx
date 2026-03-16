/**
 * AteAI.tsx — Ate AI Assistant Component
 * BMAD: Better than AsianParents
 * Features:
 *  - Cute animated kawaii SVG Ate AI avatar (blinking, floating)
 *  - Full-screen chat bottom sheet with animated entrance
 *  - Streaming responses with live typing indicator
 *  - Language detection (EN/FIL/ZH)
 *  - AI summary cards with WHO/DOH analysis
 *  - Conversation history (last 20 messages)
 *  - Disclaimer appended automatically
 */

import React, {
  useState, useRef, useEffect, useCallback, useMemo,
} from 'react';
import {
  View, Text, TouchableOpacity, Modal, TextInput,
  ScrollView, StyleSheet, Dimensions, Animated,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Easing,
} from 'react-native';
import Svg, {
  Path, Circle, Ellipse, Rect, Defs,
  LinearGradient as SvgGrad, Stop, G,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { useChildStore, getChildDisplayName } from '../../store/childStore';
import { useFeedingStore, getTodayEntries }    from '../../store/feedingStore';
import { useSleepStore }                       from '../../store/sleepStore';
import { useGrowthStore }                      from '../../store/growthStore';
import { useVaccineStore }                     from '../../store/vaccineStore';
import { useReminderStore }                    from '../../store/reminderStore';
import {
  ChatMessage, WeeklySummary, Language,
  streamAteAIResponse, detectLanguage, getAISummary,
} from '../../src/lib/claude';
import { Droplets, Moon, Shield, Syringe, TrendingUp, Thermometer, Salad } from 'lucide-react-native';
import Colors from '../../constants/Colors';

const { width: W, height: H } = Dimensions.get('window');
const PINK    = Colors.primaryPink;
const SOFT_PK = Colors.softPink;
const DARK    = Colors.dark;
const GRAY    = Colors.midGray;
const MINT    = Colors.mint;
const GOLD    = Colors.gold;

// ── uuid helper ──────────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

// ─────────────────────────────────────────────────────────────────────────────
// Kawaii Ate AI SVG Avatar  (animated: blinking + floating)
// ─────────────────────────────────────────────────────────────────────────────

export function AteAIAvatar({ size = 56, animate = true }: { size?: number; animate?: boolean }) {
  const blinkAnim  = useRef(new Animated.Value(1)).current;
  const floatAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animate) return;

    // Blink every 3 seconds
    const blink = Animated.loop(
      Animated.sequence([
        Animated.delay(2800),
        Animated.timing(blinkAnim, { toValue: 0.05, duration: 80,  useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(blinkAnim, { toValue: 1,    duration: 80,  useNativeDriver: true, easing: Easing.linear }),
        Animated.delay(120),
        Animated.timing(blinkAnim, { toValue: 0.05, duration: 80,  useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(blinkAnim, { toValue: 1,    duration: 80,  useNativeDriver: true, easing: Easing.linear }),
      ])
    );

    // Float up/down
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -4, duration: 1400, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(floatAnim, { toValue:  4, duration: 1400, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    );

    // Subtle pulse glow
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
        Animated.timing(pulseAnim, { toValue: 1.0,  duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
      ])
    );

    blink.start(); float.start(); pulse.start();
    return () => { blink.stop(); float.stop(); pulse.stop(); };
  }, [animate]);

  const s = size;

  return (
    <Animated.View style={{
      transform: [
        { translateY: floatAnim },
        { scale: pulseAnim },
      ],
    }}>
      <Svg width={s} height={s} viewBox="0 0 80 80">
        <Defs>
          <SvgGrad id="ateBody" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FF8FAB" />
            <Stop offset="1" stopColor="#E63B6F" />
          </SvgGrad>
          <SvgGrad id="ateGlow" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor="#FFB6C8" stopOpacity="0.6" />
            <Stop offset="1" stopColor="#E63B6F" stopOpacity="0" />
          </SvgGrad>
          <SvgGrad id="ateFace" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFECD5" />
            <Stop offset="1" stopColor="#FFDFC8" />
          </SvgGrad>
        </Defs>

        {/* Soft glow halo */}
        <Ellipse cx="40" cy="42" rx="28" ry="28" fill="url(#ateGlow)" />

        {/* Body — pill shape */}
        <Path
          d="M22 44 Q22 28 40 26 Q58 28 58 44 Q58 58 40 60 Q22 58 22 44Z"
          fill="url(#ateBody)"
        />

        {/* Sparkle antenna */}
        <Path d="M40 26 L40 14" stroke="#FFB6C8" strokeWidth="2.5" strokeLinecap="round" />
        <Circle cx="40" cy="12" r="4" fill="#FDE68A" />
        <Circle cx="40" cy="12" r="2" fill="#FBBF24" />
        {/* Antenna sparkles */}
        <Path d="M38 9 L36 6" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M42 9 L44 6" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M36 11 L33 11" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M44 11 L47 11" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" />

        {/* Face */}
        <Ellipse cx="40" cy="44" rx="14" ry="13" fill="url(#ateFace)" />

        {/* Eyes (animated scale for blink via wrapper) */}
        <Animated.View style={{ position: 'absolute', width: s, height: s, scaleY: blinkAnim }}>
          {/* We render eyes as SVG paths; blink via Animated.View wrapper */}
        </Animated.View>
        {/* Left eye */}
        <Ellipse cx="35" cy="43" rx="3" ry="3.5" fill="#5C3317" />
        <Circle  cx="36" cy="42" r="1.2" fill="white" opacity="0.7" />
        {/* Right eye */}
        <Ellipse cx="45" cy="43" rx="3" ry="3.5" fill="#5C3317" />
        <Circle  cx="46" cy="42" r="1.2" fill="white" opacity="0.7" />

        {/* Rosy cheeks */}
        <Ellipse cx="30" cy="48" rx="4.5" ry="3" fill="#FFB3C8" opacity="0.7" />
        <Ellipse cx="50" cy="48" rx="4.5" ry="3" fill="#FFB3C8" opacity="0.7" />

        {/* Smile */}
        <Path d="M34 51 Q40 56 46 51" stroke="#E87090" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* Tiny hands raised in greeting */}
        <Ellipse cx="21" cy="50" rx="4.5" ry="5.5" fill="#FFECD5" transform="rotate(-20,21,50)" />
        <Ellipse cx="59" cy="50" rx="4.5" ry="5.5" fill="#FFECD5" transform="rotate(20,59,50)" />

        {/* Star badge on body */}
        <Path d="M40 32 L41.5 36 L45.5 36 L42.5 38.5 L43.5 42.5 L40 40 L36.5 42.5 L37.5 38.5 L34.5 36 L38.5 36 Z"
          fill="#FDE68A" opacity="0.9" />
      </Svg>
    </Animated.View>
  );
}

// ── Animated Ate AI button (for top nav) ─────────────────────────────────────

export function AteAIButton({ onPress }: { onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
      <Animated.View style={[ab.btn, { transform: [{ scale: scaleAnim }] }]}>
        <AteAIAvatar size={34} animate />
      </Animated.View>
    </TouchableOpacity>
  );
}

const ab = StyleSheet.create({
  btn: {
    width: 42, height: 42,
    borderRadius: 21,
    backgroundColor: SOFT_PK,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: PINK, shadowOpacity: 0.35, shadowRadius: 8,
    elevation: 4,
  },
});

// ── Typing indicator dots ─────────────────────────────────────────────────────

function TypingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = (v: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: -6, duration: 280, useNativeDriver: true }),
        Animated.timing(v, { toValue:  0, duration: 280, useNativeDriver: true }),
        Animated.delay(560),
      ]));
    const a1 = anim(dot1, 0);
    const a2 = anim(dot2, 160);
    const a3 = anim(dot3, 320);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={td.row}>
      {[dot1, dot2, dot3].map((v, i) => (
        <Animated.View key={i} style={[td.dot, { transform: [{ translateY: v }] }]} />
      ))}
    </View>
  );
}
const td = StyleSheet.create({
  row: { flexDirection: 'row', gap: 5, alignItems: 'center', paddingVertical: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: PINK, opacity: 0.7 },
});

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg, isStreaming }: { msg: ChatMessage; isStreaming?: boolean }) {
  const isUser = msg.role === 'user';

  // Simple markdown: bold, bullets
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Horizontal rule
      if (line.trim() === '---') return <View key={i} style={mb.hr} />;

      // Bold text
      const boldParts = line.split(/\*\*(.*?)\*\*/g);
      const rendered = boldParts.map((part, j) =>
        j % 2 === 1
          ? <Text key={j} style={{ fontWeight: '800' }}>{part}</Text>
          : <Text key={j}>{part}</Text>
      );

      // Italic lines (disclaimer)
      if (line.startsWith('*') && line.endsWith('*')) {
        return (
          <Text key={i} style={[mb.italic, isUser ? mb.userItalic : mb.aiteItalic]}>
            {line.slice(1, -1)}
          </Text>
        );
      }

      // Bullet points
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <View key={i} style={mb.bulletRow}>
            <Text style={[mb.bullet, isUser && mb.bulletUser]}>•</Text>
            <Text style={[mb.bubbleText, isUser ? mb.userText : mb.ateText, { flex: 1 }]}>
              {boldParts.map((part, j) =>
                j % 2 === 1
                  ? <Text key={j} style={{ fontWeight: '800' }}>{part}</Text>
                  : <Text key={j}>{part.replace(/^[•\-] /, '')}</Text>
              )}
            </Text>
          </View>
        );
      }

      if (line === '') return <View key={i} style={{ height: 4 }} />;

      return (
        <Text key={i} style={[mb.bubbleText, isUser ? mb.userText : mb.ateText]}>
          {rendered}
        </Text>
      );
    });
  };

  return (
    <View style={[mb.row, isUser ? mb.rowUser : mb.rowAte]}>
      {!isUser && (
        <View style={mb.avatarWrap}>
          <AteAIAvatar size={32} animate={false} />
        </View>
      )}
      <View style={[mb.bubble, isUser ? mb.bubbleUser : mb.bubbleAte]}>
        {isStreaming && msg.content === '' ? (
          <TypingDots />
        ) : (
          renderContent(msg.content)
        )}
        {isStreaming && msg.content !== '' && (
          <View style={mb.cursorDot} />
        )}
      </View>
    </View>
  );
}

const mb = StyleSheet.create({
  row:        { flexDirection: 'row', marginVertical: 5, alignItems: 'flex-end' },
  rowUser:    { justifyContent: 'flex-end' },
  rowAte:     { justifyContent: 'flex-start' },
  avatarWrap: { marginRight: 8, marginBottom: 2 },
  bubble:     { maxWidth: W * 0.72, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { backgroundColor: PINK, borderBottomRightRadius: 6 },
  bubbleAte:  { backgroundColor: Colors.white, borderBottomLeftRadius: 6,
                shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  userText:   { color: Colors.white },
  ateText:    { color: DARK },
  italic:     { fontSize: 12, opacity: 0.7, marginTop: 4 },
  userItalic: { color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' },
  aiteItalic: { color: GRAY, fontStyle: 'italic' },
  bulletRow:  { flexDirection: 'row', gap: 6, marginVertical: 2 },
  bullet:     { color: PINK, fontWeight: '800', lineHeight: 21 },
  bulletUser: { color: 'rgba(255,255,255,0.85)' },
  hr:         { height: 1, backgroundColor: '#EEE', marginVertical: 8 },
  cursorDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: PINK,
                alignSelf: 'flex-end', marginTop: 2, opacity: 0.7 },
});

// ── Quick suggestion chips ────────────────────────────────────────────────────

function SuggestionChips({ lang, onSelect }: { lang: Language; onSelect: (q: string) => void }) {
  const iconSize = 16;
  const iconColor = PINK;
  const icons: React.ReactNode[] = [
    <Droplets size={iconSize} color={iconColor} />,
    <Moon size={iconSize} color={iconColor} />,
    <Syringe size={iconSize} color={iconColor} />,
    <TrendingUp size={iconSize} color={iconColor} />,
    <Thermometer size={iconSize} color={iconColor} />,
    <Salad size={iconSize} color={iconColor} />,
  ];

  const texts: Record<Language, string[]> = {
    en: [
      'Is my baby eating enough?',
      'How much sleep does baby need?',
      'Which vaccines are due soon?',
      'How is baby growing?',
      'What are signs baby is unwell?',
      'When to start solid foods?',
    ],
    fil: [
      'Kumakain ba nang sapat ang anak ko?',
      'Gaano katagal dapat tulog ng sanggol?',
      'Anong bakuna ang dapat sa susunod?',
      'Paano ang paglaki ng anak ko?',
      'Ano ang palatandaan ng sakit?',
      'Kailan magsimula ng solid foods?',
    ],
    zh: [
      '宝宝吃得够吗？',
      '宝宝需要睡多久？',
      '近期需要接种哪些疫苗？',
      '宝宝的发育情况如何？',
      '宝宝不舒服有哪些迹象？',
      '何时开始添加辅食？',
    ],
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={sc.scroll}>
      <View style={sc.row}>
        {texts[lang].map((text, i) => (
          <TouchableOpacity key={i} style={sc.chip} onPress={() => onSelect(text)} activeOpacity={0.75}>
            {icons[i]}
            <Text style={sc.chipText}>{text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const sc = StyleSheet.create({
  scroll:    { marginBottom: 8 },
  row:       { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 4 },
  chip:      { flexDirection: 'row', alignItems: 'center', gap: 6,
               backgroundColor: SOFT_PK, borderRadius: 20,
               paddingHorizontal: 12, paddingVertical: 8,
               borderWidth: 1, borderColor: '#FFB6C8' },
  chipText:  { fontSize: 12, fontWeight: '600', color: PINK, maxWidth: 150 },
});

// ── AI Summary Card (for embedding on other screens) ──────────────────────────

export function AteAISummaryCard({
  title, emoji, icon, prompt, onChatPress,
}: {
  title: string; emoji?: string; icon?: React.ReactNode; prompt: string; onChatPress?: () => void;
}) {
  const { activeChild } = useChildStore();
  const { t }           = useTranslation();
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const weekSummary = useWeeklySummary();

  useEffect(() => {
    if (!activeChild || summary) return;
    setLoading(true);
    getAISummary(prompt, activeChild, weekSummary)
      .then(s => setSummary(s))
      .finally(() => setLoading(false));
  }, [activeChild?.id]);

  if (!activeChild) return null;

  return (
    <TouchableOpacity
      style={asc.card}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={[Colors.primaryBg, '#FFF5F8']}
        style={asc.gradient}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <View style={asc.header}>
          <View style={asc.iconWrap}>
            <AteAIAvatar size={36} animate />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={asc.title}>{icon ?? emoji} {title}</Text>
            <Text style={asc.subtitle}>{t('ateai.powered_by')}</Text>
          </View>
          <Text style={asc.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>

        {expanded && (
          <View style={asc.body}>
            {loading ? (
              <View style={asc.loadRow}>
                <ActivityIndicator color={PINK} size="small" />
                <Text style={asc.loadText}>{t('ateai.analyzing')}</Text>
              </View>
            ) : (
              <>
                <Text style={asc.summaryText}>{summary}</Text>
                {onChatPress && (
                  <TouchableOpacity style={asc.chatBtn} onPress={onChatPress} activeOpacity={0.8}>
                    <Text style={asc.chatBtnText}>{t('ateai.ask_ate_ai')} →</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const asc = StyleSheet.create({
  card:        { borderRadius: 20, overflow: 'hidden', marginTop: 12,
                 shadowColor: Colors.shadowColor, shadowOffset: { width: 0, height: 4 },
                 shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  gradient:    { borderRadius: 20, borderWidth: 1.5, borderColor: '#FFB6C8' },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  iconWrap:    { width: 40, height: 40, borderRadius: 20, backgroundColor: SOFT_PK,
                 alignItems: 'center', justifyContent: 'center' },
  title:       { fontSize: 13, fontWeight: '800', color: DARK },
  subtitle:    { fontSize: 11, color: PINK, fontWeight: '600', marginTop: 1 },
  chevron:     { fontSize: 12, color: PINK },
  body:        { paddingHorizontal: 14, paddingBottom: 14 },
  loadRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  loadText:    { fontSize: 13, color: GRAY, fontStyle: 'italic' },
  summaryText: { fontSize: 13, color: DARK, lineHeight: 20 },
  chatBtn:     { marginTop: 10, backgroundColor: PINK, borderRadius: 12,
                 paddingVertical: 8, paddingHorizontal: 14, alignSelf: 'flex-start' },
  chatBtnText: { color: Colors.white, fontSize: 12, fontWeight: '800' },
});

// ── Weekly summary hook ───────────────────────────────────────────────────────

function useWeeklySummary(): WeeklySummary {
  const { activeChild }    = useChildStore();
  const { entries }        = useFeedingStore();
  const sleepStore         = useSleepStore();
  const growthStore        = useGrowthStore();
  const vaccineStore       = useVaccineStore();

  return useMemo(() => {
    const childId = activeChild?.id ?? '';
    const now     = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);

    // Feeding summary (last 7 days)
    const weekFeeds = entries.filter(e =>
      e.childId === childId && new Date(e.startedAt) >= weekAgo
    );
    const totalFeeds   = weekFeeds.length;
    const vols         = weekFeeds.filter(e => e.volumeMl).map(e => e.volumeMl!);
    const avgVolumeMl  = vols.length ? Math.round(vols.reduce((a, b) => a + b, 0) / vols.length) : 0;

    // Sleep summary
    const weekSleep = sleepStore.entries?.filter((e: any) =>
      e.childId === childId && new Date(e.startedAt) >= weekAgo
    ) ?? [];
    const totalSleepMs  = weekSleep.reduce((acc: number, e: any) => {
      if (!e.endedAt) return acc;
      return acc + (new Date(e.endedAt).getTime() - new Date(e.startedAt).getTime());
    }, 0);
    const totalSleepHours = totalSleepMs / 3600000;
    const avgSleepPerDay  = totalSleepHours / 7;

    // Growth
    const latest      = growthStore.getLatest(childId);
    const sleepToday  = sleepStore.getTodaySleepMinutes?.(childId) ?? 0;
    const sleepTodayStr = sleepToday > 0
      ? `${Math.floor(sleepToday / 60)}h ${sleepToday % 60}m`
      : undefined;

    // Vaccines
    const records  = vaccineStore.getRecords(childId);
    const upcoming = records.filter((r: any) => r.status === 'upcoming').map((r: any) => r.nameEN);
    const overdue  = records.filter((r: any) => r.status === 'overdue').map((r: any) => r.nameEN);

    // Language from i18n (fallback to 'en')
    let lang: Language = 'en';
    try {
      const saved = (globalThis as any).__i18nLanguage ?? 'en';
      if (saved === 'fil' || saved === 'zh') lang = saved;
    } catch {}

    return {
      totalFeeds,
      avgVolumeMl,
      totalSleepHours,
      avgSleepPerDay,
      latestWeight:      latest?.weightKg,
      latestHeight:      latest?.heightCm,
      weightPercentile:  undefined,
      upcomingVaccines:  upcoming.slice(0, 5),
      overdueVaccines:   overdue.slice(0, 5),
      sleepToday:        sleepTodayStr,
      preferredLanguage: lang,
    };
  }, [activeChild?.id, entries, growthStore, vaccineStore]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main AteAI Chat Component
// ─────────────────────────────────────────────────────────────────────────────

export function AteAIChat({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t }           = useTranslation();
  const { activeChild } = useChildStore();
  const weekSummary     = useWeeklySummary();

  const [messages,     setMessages]     = useState<ChatMessage[]>([]);
  const [inputText,    setInputText]    = useState('');
  const [isStreaming,  setIsStreaming]  = useState(false);
  const [streamingId,  setStreamingId] = useState<string | null>(null);
  const [language,     setLanguage]    = useState<Language>('en');

  const scrollRef   = useRef<ScrollView>(null);
  const slideAnim   = useRef(new Animated.Value(H)).current;

  // Welcome message on first open
  useEffect(() => {
    if (visible && messages.length === 0 && activeChild) {
      const name = getChildDisplayName(activeChild);
      const welcomes: Record<Language, string> = {
        en:  `Hi Mommy! 🌸 I'm **Ate AI**, your BabyBloom health companion!\n\nI'm here to help you with **${name}'s** health and development. Ask me anything about feeding, sleep, vaccines, or growth!\n\n*Powered by WHO & DOH Philippines guidelines.*`,
        fil: `Hoy, Nanay! 🌸 Ako si **Ate AI**, ang inyong BabyBloom health companion!\n\nNandito ako para sa kalusugan ni **${name}**. Magtanong kayo tungkol sa pagkain, tulog, bakuna, o paglaki!\n\n*Batay sa WHO at DOH Pilipinas na alituntunin.*`,
        zh:  `您好，妈妈！🌸 我是**Ate AI**，您的BabyBloom健康助手！\n\n我在这里帮助您关注**${name}**的健康成长。关于喂养、睡眠、疫苗或生长发育，尽管问我！\n\n*基于WHO和菲律宾DOH指南。*`,
      };
      const welcome: ChatMessage = {
        id:        uid(),
        role:      'assistant',
        content:   welcomes[language],
        timestamp: new Date().toISOString(),
      };
      setMessages([welcome]);
    }
  }, [visible, activeChild?.id]);

  // Slide in/out animation
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0, tension: 65, friction: 10, useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: H, duration: 280, useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }).start();
    }
  }, [visible]);

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text ?? inputText).trim();
    if (!content || isStreaming || !activeChild) return;
    setInputText('');

    // Detect language from user input
    const detectedLang = detectLanguage(content);
    setLanguage(detectedLang);

    const userMsg: ChatMessage = {
      id: uid(), role: 'user', content, timestamp: new Date().toISOString(),
    };

    const assistantId = uid();
    const assistantMsg: ChatMessage = {
      id: assistantId, role: 'assistant', content: '', timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg, assistantMsg];
    setMessages(newMessages);
    setIsStreaming(true);
    setStreamingId(assistantId);
    scrollToBottom();

    await streamAteAIResponse({
      messages:  [...messages, userMsg],
      child:     activeChild,
      summary:   { ...weekSummary, preferredLanguage: detectedLang },
      language:  detectedLang,
      onChunk: (chunk) => {
        setMessages(prev =>
          prev.map(m => m.id === assistantId
            ? { ...m, content: m.content + chunk }
            : m
          )
        );
        scrollToBottom();
      },
      onDone: (fullText) => {
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: fullText } : m)
        );
        setIsStreaming(false);
        setStreamingId(null);

        // Keep only last 20 messages
        setMessages(prev => prev.length > 20 ? prev.slice(prev.length - 20) : prev);
        scrollToBottom();
      },
      onError: (err) => {
        setMessages(prev =>
          prev.map(m => m.id === assistantId
            ? { ...m, content: `Sorry, I couldn't connect. Please check your internet and try again.\n\nError: ${err}` }
            : m
          )
        );
        setIsStreaming(false);
        setStreamingId(null);
      },
    });
  }, [inputText, messages, isStreaming, activeChild, weekSummary, language]);

  const clearChat = () => {
    setMessages([]);
    setIsStreaming(false);
  };

  const name = activeChild ? getChildDisplayName(activeChild) : 'baby';

  const headerTitles: Record<Language, string> = {
    en:  `Ate AI — ${name}'s Health Companion`,
    fil: `Ate AI — Kasamahan ni ${name}`,
    zh:  `Ate AI — ${name}的健康助手`,
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={chat.overlay}>
        <TouchableOpacity style={chat.backdrop} onPress={onClose} activeOpacity={1} />

        <Animated.View style={[chat.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Header */}
          <LinearGradient
            colors={[Colors.primaryPink, '#F06292']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={chat.header}
          >
            <View style={chat.headerAvatar}>
              <AteAIAvatar size={38} animate />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={chat.headerTitle} numberOfLines={1}>
                {headerTitles[language]}
              </Text>
              <View style={chat.onlineRow}>
                <View style={chat.onlineDot} />
                <Text style={chat.onlineText}>{t('ateai.online')}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={clearChat} style={chat.clearBtn}>
              <Text style={chat.clearText}>{t('ateai.clear')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={chat.closeBtn}>
              <Text style={chat.closeText}>✕</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* WHO/DOH badge */}
          <View style={chat.trustBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Shield size={12} color={Colors.blue} />
              <Text style={chat.trustText}>{t('ateai.trust_badge')}</Text>
            </View>
          </View>

          {/* Messages */}
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
            <ScrollView
              ref={scrollRef}
              style={chat.messages}
              contentContainerStyle={chat.messagesContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isStreaming={isStreaming && msg.id === streamingId}
                />
              ))}
            </ScrollView>

            {/* Suggestion chips (show when empty or after welcome) */}
            {messages.length <= 1 && !isStreaming && (
              <SuggestionChips lang={language} onSelect={q => sendMessage(q)} />
            )}

            {/* Input row */}
            <View style={chat.inputRow}>
              <TextInput
                style={chat.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder={t('ateai.input_placeholder')}
                placeholderTextColor="#B0B0C0"
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={() => sendMessage()}
                editable={!isStreaming}
              />
              <TouchableOpacity
                style={[chat.sendBtn, isStreaming && chat.sendBtnDisabled]}
                onPress={() => sendMessage()}
                disabled={isStreaming || !inputText.trim()}
                activeOpacity={0.8}
              >
                {isStreaming ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={chat.sendIcon}>➤</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const chat = StyleSheet.create({
  overlay:        { flex: 1, justifyContent: 'flex-end' },
  backdrop:       { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:          { height: H * 0.88, backgroundColor: Colors.background,
                    borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  header:         { flexDirection: 'row', alignItems: 'center', gap: 10,
                    paddingHorizontal: 16, paddingVertical: 12, paddingTop: 18 },
  headerAvatar:   { width: 44, height: 44, borderRadius: 22,
                    backgroundColor: 'rgba(255,255,255,0.22)',
                    alignItems: 'center', justifyContent: 'center' },
  headerTitle:    { fontSize: 13, fontWeight: '800', color: Colors.white },
  onlineRow:      { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: '#86EFAC' },
  onlineText:     { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  clearBtn:       { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 8,
                    paddingHorizontal: 8, paddingVertical: 5 },
  clearText:      { fontSize: 11, color: Colors.white, fontWeight: '700' },
  closeBtn:       { width: 28, height: 28, borderRadius: 14,
                    backgroundColor: 'rgba(255,255,255,0.22)',
                    alignItems: 'center', justifyContent: 'center' },
  closeText:      { fontSize: 14, color: Colors.white, fontWeight: '800' },
  trustBar:       { backgroundColor: Colors.softBlue, paddingHorizontal: 16, paddingVertical: 7 },
  trustText:      { fontSize: 11, color: Colors.blue, fontWeight: '600' },
  messages:       { flex: 1 },
  messagesContent:{ padding: 16, paddingBottom: 8 },
  inputRow:       { flexDirection: 'row', alignItems: 'flex-end', gap: 8,
                    padding: 12, borderTopWidth: 1, borderTopColor: '#F0E4EC',
                    backgroundColor: Colors.white },
  input:          { flex: 1, backgroundColor: '#F8F0F5', borderRadius: 12,
                    paddingHorizontal: 16, paddingVertical: 10,
                    fontSize: 14, color: DARK, maxHeight: 100,
                    borderWidth: 1.5, borderColor: Colors.border },
  sendBtn:        { width: 44, height: 44, borderRadius: 22,
                    backgroundColor: PINK, alignItems: 'center', justifyContent: 'center',
                    shadowColor: PINK, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
  sendBtnDisabled:{ backgroundColor: '#F48FB1' },
  sendIcon:       { fontSize: 18, color: Colors.white },
});

// ─────────────────────────────────────────────────────────────────────────────
// Default export: the full AteAI feature (button + chat)
// ─────────────────────────────────────────────────────────────────────────────

export default function AteAI() {
  const [chatOpen, setChatOpen] = useState(false);
  return (
    <>
      <AteAIButton onPress={() => setChatOpen(true)} />
      <AteAIChat visible={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
