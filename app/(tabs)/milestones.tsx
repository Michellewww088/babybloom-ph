/**
 * milestones.tsx — Page 5: Milestones, Records & Stage Checklist
 * BMAD design: 3-tab UI with Memory Book, Developmental Milestones, Stage Checklist
 * All AI summaries use Ate AI persona; all text via i18n keys.
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, Alert, Dimensions, Platform, Animated,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useChildStore, getChildDisplayName } from '../../store/childStore';
import {
  MILESTONES, STAGE_CHECKLISTS, FIRST_TIMES,
  DOMAIN_META, MilestoneDomain, AgeGroup,
} from '../../constants/milestones';
import Colors from '../../constants/Colors';
import {
  BookOpen, Trophy, CircleCheck, Sparkles, Star, Camera, CalendarDays,
  MapPin, Clock, Flag, Save, Hospital, ClipboardList, Salad, Puzzle, Lock,
  Sprout, Flower, Flower2, Sunflower, PartyPopper,
  Smile, Laugh, RotateCcw, Armchair, Bug, Footprints, MessageCircle,
  Candy, Utensils, Bath, Scissors, Cake,
  Heart, Brain, Activity,
} from 'lucide-react-native';

/** Maps icon-name strings from milestones constants to Lucide components. */
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  // Stage icons
  sprout: Sprout,
  flower: Flower,
  flower2: Flower2,
  sunflower: Sunflower,
  star: Star,
  'party-popper': PartyPopper,
  // First-time category icons
  smile: Smile,
  laugh: Laugh,
  'rotate-ccw': RotateCcw,
  armchair: Armchair,
  bug: Bug,
  footprints: Footprints,
  'message-circle': MessageCircle,
  candy: Candy,
  utensils: Utensils,
  bath: Bath,
  scissors: Scissors,
  cake: Cake,
  // Domain icons
  heart: Heart,
  brain: Brain,
  activity: Activity,
};

/** Render a Lucide icon for a given icon-name string from milestones constants. */
function MilestoneIcon({ name, size, color }: { name: string; size: number; color?: string }) {
  const IconComponent = ICON_MAP[name];
  if (!IconComponent) return <Star size={size} color={color ?? '#888'} />;
  return <IconComponent size={size} color={color ?? '#888'} />;
}

const { width: SCREEN_W } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type TopTab = 'memory' | 'milestones' | 'checklist';

interface FirstTimeLog {
  id: string;
  date: string;      // YYYY-MM-DD
  note?: string;
}

interface MemoryEntry {
  id: string;
  caption: string;
  date: string;
  tag: string;
  photoPlaceholder: string;  // emoji stand-in for demo
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getAgeInMonths(birthday: string): number {
  const birth = new Date(birthday);
  const now   = new Date();
  let months  = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  return Math.max(0, months);
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

// Build AI milestone summary based on progress
function buildMilestoneSummary(
  childName: string,
  ageMonths: number,
  checkedCount: number,
  totalCount: number,
  lang: string
): string {
  const pct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
  if (lang === 'fil') {
    if (pct >= 80) return `🌟 Napakagaling ni ${childName}! Natutupad na ang ${pct}% ng mga milestone para sa edad na ito. Patuloy na magtrabaho nang mabuti, ${childName}! 💕`;
    if (pct >= 50) return `😊 Si ${childName} ay mabuting nagsusulong — ${pct}% na ng mga milestone para sa edad na ito ang nakamit. Bawat sanggol ay may sariling ritmo, ipagpatuloy lang! 🌸`;
    return `💙 Mukhang hindi pa nakakamit ni ${childName} ang ilang milestone para sa edad na ito. Bawat sanggol ay natatangi — ngunit maaaring sulit na banggitin sa susunod na checkup ng Pedia.`;
  }
  if (lang === 'zh') {
    if (pct >= 80) return `🌟 ${childName}表现太棒了！已完成本月龄${pct}%的里程碑。继续加油，${childName}！💕`;
    if (pct >= 50) return `😊 ${childName}进步良好——已达成本月龄${pct}%的里程碑。每个宝宝都有自己的节奏，继续保持！🌸`;
    return `💙 ${childName}在本月龄的里程碑中还有一些未达成。每个宝宝都是独特的——但建议在下次体检时向儿科医生提及。`;
  }
  // en
  if (pct >= 80) return `🌟 ${childName} is doing amazingly! ${pct}% of milestones for this age are achieved. Keep shining, ${childName}! 💕`;
  if (pct >= 50) return `😊 ${childName} is making great progress — ${pct}% of milestones for this age are done. Every baby has their own pace, keep it up! 🌸`;
  return `💙 It looks like ${childName} hasn't reached some milestones yet for this age. Every baby develops at their own pace — but it might be worth mentioning to your Pedia at the next checkup.`;
}

// Build AI stage summary
function buildStageSummary(
  childName: string,
  done: number,
  total: number,
  lang: string
): string {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  if (lang === 'fil') {
    if (pct === 100) return `🎉 Natapos na ang lahat ng gawain para sa stage na ito! Napakagaling ni ${childName}!`;
    if (pct >= 60)   return `👏 ${done} ng ${total} na gawain ang tapos na. Palapit na sa pagtatapos ng stage na ito!`;
    return `💪 ${done} ng ${total} na gawain ang tapos na. Isa-isa lang — kaya mo ito, ${childName}!`;
  }
  if (lang === 'zh') {
    if (pct === 100) return `🎉 本阶段所有任务已完成！${childName}太棒了！`;
    if (pct >= 60)   return `👏 已完成${done}/${total}项任务。快要完成本阶段了！`;
    return `💪 已完成${done}/${total}项任务。一步一步来——加油，${childName}！`;
  }
  if (pct === 100) return `🎉 All tasks for this stage are done! Way to go, ${childName}!`;
  if (pct >= 60)   return `👏 ${done} of ${total} tasks done. Getting close to completing this stage!`;
  return `💪 ${done} of ${total} tasks done. One step at a time — you've got this, ${childName}!`;
}

// Build AI memory summary
function buildMemorySummary(childName: string, count: number, lang: string): string {
  if (lang === 'fil') {
    if (count === 0) return `📖 Simulan ang memory book ni ${childName}! I-record ang mga unang beses at espesyal na sandali. Ang bawat larawan ay isang mahalagang alaala. 💕`;
    return `📖 Mayroon nang ${count} na alaala sa memory book ni ${childName}! Patuloy na idokumento ang bawat espesyal na sandali — lumalaki nang mabilis ang mga sanggol! 🌸`;
  }
  if (lang === 'zh') {
    if (count === 0) return `📖 开始${childName}的成长记录册吧！记录第一次和特别时刻——每张照片都是珍贵的回忆。💕`;
    return `📖 ${childName}的成长记录册已有${count}个美好记忆！继续记录每个特别时刻——宝宝成长得好快！🌸`;
  }
  if (count === 0) return `📖 Start ${childName}'s memory book! Record first times and special moments — every photo is a precious memory. 💕`;
  return `📖 ${childName}'s memory book has ${count} beautiful memories! Keep documenting every special moment — babies grow so fast! 🌸`;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function MilestonesScreen() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';

  const activeChild = useChildStore((s) => s.activeChild);
  const childName   = activeChild ? getChildDisplayName(activeChild) : 'Baby';
  const ageMonths   = activeChild ? getAgeInMonths(activeChild.birthday) : 0;

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TopTab>('memory');

  // ── Memory Book state ──────────────────────────────────────────────────────
  const [firstTimeLogs, setFirstTimeLogs]   = useState<Record<string, FirstTimeLog>>({});
  const [memories, setMemories]             = useState<MemoryEntry[]>([]);
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(false);
  const [selectedFirstTime, setSelectedFirstTime]   = useState<typeof FIRST_TIMES[0] | null>(null);
  const [firstTimeDate, setFirstTimeDate]   = useState(today());
  const [firstTimeNote, setFirstTimeNote]   = useState('');
  const [showAddMemoryModal, setShowAddMemoryModal] = useState(false);
  const [memCaption, setMemCaption]         = useState('');
  const [memDate, setMemDate]               = useState(today());
  const [memTag, setMemTag]                 = useState('');

  // ── Milestone state ────────────────────────────────────────────────────────
  const [selectedAgeIdx, setSelectedAgeIdx] = useState(0);
  const [checkedMilestones, setCheckedMilestones] = useState<Record<string, boolean>>({});

  // ── Stage Checklist state ──────────────────────────────────────────────────
  const [selectedStageIdx, setSelectedStageIdx]   = useState(0);
  const [checkedStageItems, setCheckedStageItems] = useState<Record<string, boolean>>({});

  // ── Memory Book helpers ────────────────────────────────────────────────────
  const MEMORY_TAGS = [
    '😊 First Smile', '👣 First Steps', '🦷 First Tooth', '🥣 First Food',
    '🛁 First Bath', '📖 Story Time', '🎉 Celebration', '💕 Family Moment',
  ];
  const PHOTO_EMOJIS = ['👶', '🌸', '⭐', '💖', '🌟', '🎀', '🌈', '🍼'];

  const openFirstTimeModal = (ft: typeof FIRST_TIMES[0]) => {
    setSelectedFirstTime(ft);
    const existing = firstTimeLogs[ft.id];
    setFirstTimeDate(existing?.date || today());
    setFirstTimeNote(existing?.note || '');
    setShowFirstTimeModal(true);
  };

  const saveFirstTime = () => {
    if (!selectedFirstTime) return;
    setFirstTimeLogs((prev) => ({
      ...prev,
      [selectedFirstTime.id]: { id: selectedFirstTime.id, date: firstTimeDate, note: firstTimeNote },
    }));
    setShowFirstTimeModal(false);
  };

  const saveMemory = () => {
    if (!memCaption.trim() && !memTag) { Alert.alert('Add a caption or tag first!'); return; }
    const entry: MemoryEntry = {
      id:               Date.now().toString(),
      caption:          memCaption || memTag,
      date:             memDate,
      tag:              memTag,
      photoPlaceholder: PHOTO_EMOJIS[Math.floor(Math.random() * PHOTO_EMOJIS.length)],
    };
    setMemories((prev) => [entry, ...prev]);
    setMemCaption(''); setMemDate(today()); setMemTag('');
    setShowAddMemoryModal(false);
  };

  // ── Milestone helpers ──────────────────────────────────────────────────────
  const currentAgeGroup: AgeGroup = MILESTONES[selectedAgeIdx];
  const domains: MilestoneDomain[] = ['social', 'cognitive', 'language', 'motor'];

  const toggleMilestone = (id: string) =>
    setCheckedMilestones((prev) => ({ ...prev, [id]: !prev[id] }));

  const milestoneProgress = useMemo(() => {
    const total = currentAgeGroup.milestones.length;
    const done  = currentAgeGroup.milestones.filter((m) => checkedMilestones[m.id]).length;
    return { done, total, pct: total > 0 ? done / total : 0 };
  }, [currentAgeGroup, checkedMilestones]);

  // ── Stage Checklist helpers ────────────────────────────────────────────────
  const currentStage = STAGE_CHECKLISTS[selectedStageIdx];
  const toggleStageItem = (id: string) =>
    setCheckedStageItems((prev) => ({ ...prev, [id]: !prev[id] }));

  const stageProgress = useMemo(() => {
    const total = currentStage.items.length;
    const done  = currentStage.items.filter((it) => checkedStageItems[it.id]).length;
    return { done, total, pct: total > 0 ? done / total : 0 };
  }, [currentStage, checkedStageItems]);

  const CATEGORY_COLORS: Record<string, string> = {
    medical:     Colors.primaryPink,
    admin:       Colors.blue,
    nutrition:   Colors.mint,
    development: Colors.gold,
    safety:      '#7B5CF0',
  };
  const CATEGORY_ICONS: Record<string, typeof Hospital> = {
    medical: Hospital, admin: ClipboardList, nutrition: Salad, development: Puzzle, safety: Lock,
  };

  // ── First Time label by language ───────────────────────────────────────────
  const getFTLabel = (ft: typeof FIRST_TIMES[0]) => {
    if (lang === 'fil') return ft.labelFil;
    if (lang === 'zh')  return ft.labelZh;
    return ft.labelEn;
  };
  const getFTNoteLabel = (ft: typeof FIRST_TIMES[0]) => {
    if (lang === 'fil') return ft.noteLabelFil || '';
    if (lang === 'zh')  return ft.noteLabelZh || '';
    return ft.noteLabelEn || '';
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <View style={s.root}>

      {/* ── Top Tab Switcher ── */}
      <View style={s.tabBar}>
        {([
          { key: 'memory',     label: t('milestones.tab_memory'),      icon: BookOpen },
          { key: 'milestones', label: t('milestones.tab_milestones'),  icon: Trophy },
          { key: 'checklist',  label: t('milestones.tab_checklist'),   icon: CircleCheck },
        ] as { key: TopTab; label: string; icon: typeof BookOpen }[]).map(({ key, label, icon: Icon }) => (
          <TouchableOpacity
            key={key}
            style={[s.tabBtn, activeTab === key && s.tabBtnActive]}
            activeOpacity={0.75}
            onPress={() => setActiveTab(key)}
          >
            <Icon size={18} color={activeTab === key ? Colors.primaryPink : '#BBB'} />
            <Text style={[s.tabLabel, activeTab === key && s.tabLabelActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: MEMORY BOOK
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'memory' && (
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <LinearGradient colors={['#FFDDE8', '#FFB3C6']} style={s.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <BookOpen size={40} color="#880E4F" />
            <View style={{ flex: 1 }}>
              <Text style={s.heroTitle}>{t('milestones.memory_book_title', { name: childName })}</Text>
              <Text style={s.heroSub}>{t('milestones.memory_book_sub')}</Text>
            </View>
          </LinearGradient>

          {/* AI Summary */}
          <View style={s.aiCard}>
            <LinearGradient colors={['#F8E4F0', '#FFDDE8']} style={s.aiGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <View style={s.aiLabelRow}><Sparkles size={12} color="#C2185B" /><Text style={s.aiLabel}>{t('milestones.ate_ai_says')}</Text></View>
              <Text style={s.aiText}>{buildMemorySummary(childName, Object.keys(firstTimeLogs).length + memories.length, lang)}</Text>
              <Text style={s.aiDisclaimer}>{t('milestones.ai_disclaimer')}</Text>
            </LinearGradient>
          </View>

          {/* ── FIRST TIMES timeline ── */}
          <View style={s.sectionHeader}>
            <View style={s.sectionTitleRow}><Star size={15} color="#C2185B" /><Text style={s.sectionTitle}>{t('milestones.first_times_title')}</Text></View>
            <Text style={s.sectionSub}>{t('milestones.first_times_sub')}</Text>
          </View>

          <View style={s.firstTimesGrid}>
            {FIRST_TIMES.map((ft) => {
              const log = firstTimeLogs[ft.id];
              return (
                <TouchableOpacity
                  key={ft.id}
                  style={[s.ftCard, log && s.ftCardDone]}
                  activeOpacity={0.78}
                  onPress={() => openFirstTimeModal(ft)}
                >
                  <LinearGradient
                    colors={log ? ['#FFDDE8', '#FFB3C6'] : [Colors.background, '#F0F0F0']}
                    style={s.ftGrad}
                  >
                    <MilestoneIcon name={ft.emoji} size={26} color="#E63B6F" />
                    <Text style={[s.ftLabel, log && s.ftLabelDone]}>{getFTLabel(ft)}</Text>
                    {log ? (
                      <>
                        <View style={s.ftDoneBadge}>
                          <Text style={s.ftDoneTick}>✓</Text>
                        </View>
                        <Text style={s.ftDate}>{formatDate(log.date)}</Text>
                        {log.note ? <Text style={s.ftNote}>"{log.note}"</Text> : null}
                      </>
                    ) : (
                      <Text style={s.ftTap}>{t('milestones.tap_to_log')}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── GROWTH PHOTOS ── */}
          <View style={s.sectionHeader}>
            <View style={s.sectionTitleRow}><Camera size={15} color="#C2185B" /><Text style={s.sectionTitle}>{t('milestones.growth_photos_title')}</Text></View>
            <Text style={s.sectionSub}>{t('milestones.growth_photos_sub')}</Text>
          </View>

          {memories.length === 0 ? (
            <View style={s.emptyPhotos}>
              <Camera size={48} color="#999" />
              <Text style={s.emptyPhotoTitle}>{t('milestones.no_memories_title')}</Text>
              <Text style={s.emptyPhotoSub}>{t('milestones.no_memories_sub')}</Text>
            </View>
          ) : (
            <View style={s.memoriesGrid}>
              {memories.map((mem) => (
                <TouchableOpacity key={mem.id} style={s.memCard} activeOpacity={0.82}>
                  <LinearGradient colors={['#FFDDE8', '#FFE8F0']} style={s.memGrad}>
                    <Text style={s.memEmoji}>{mem.photoPlaceholder}</Text>
                    <Text style={s.memCaption} numberOfLines={2}>{mem.caption}</Text>
                    <Text style={s.memDate}>{formatDate(mem.date)}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Add Memory FAB row */}
          <TouchableOpacity activeOpacity={0.85} onPress={() => setShowAddMemoryModal(true)}>
            <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={s.addBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <View style={s.addBtnContent}><Camera size={18} color={Colors.white} /><Text style={s.addBtnText}>{t('milestones.add_memory')}</Text></View>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: DEVELOPMENTAL MILESTONES
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'milestones' && (
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <LinearGradient colors={['#EDE8FF', '#D4C8FF']} style={s.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Trophy size={40} color="#5B3FC5" />
            <View style={{ flex: 1 }}>
              <Text style={[s.heroTitle, { color: '#5B3FC5' }]}>{t('milestones.dev_title', { name: childName })}</Text>
              <Text style={[s.heroSub, { color: '#7B5CF0' }]}>{t('milestones.dev_sub')}</Text>
            </View>
          </LinearGradient>

          {/* Age selector chips */}
          <View style={s.sectionTitleRow}><CalendarDays size={15} color="#C2185B" /><Text style={s.sectionTitle}>{t('milestones.select_age')}</Text></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
            {MILESTONES.map((ag, idx) => (
              <TouchableOpacity
                key={ag.ageMonths}
                style={[s.ageChip, selectedAgeIdx === idx && s.ageChipActive]}
                onPress={() => setSelectedAgeIdx(idx)}
                activeOpacity={0.78}
              >
                <Text style={[s.ageChipText, selectedAgeIdx === idx && s.ageChipTextActive]}>
                  {ag.ageMonths < 12 ? `${ag.ageMonths}M` : `${ag.ageMonths / 12}Y`}
                </Text>
                {ageMonths >= ag.ageMonths && (
                  <View style={s.ageChipDot} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Progress bar */}
          <View style={s.progressRow}>
            <Text style={s.progressLabel}>
              {t('milestones.progress_label', { done: milestoneProgress.done, total: milestoneProgress.total })}
            </Text>
            <Text style={s.progressPct}>{Math.round(milestoneProgress.pct * 100)}%</Text>
          </View>
          <View style={s.progressBarBg}>
            <View style={[s.progressBarFill, { width: `${Math.round(milestoneProgress.pct * 100)}%`, backgroundColor: milestoneProgress.pct >= 0.8 ? Colors.mint : milestoneProgress.pct >= 0.5 ? Colors.gold : Colors.primaryPink }]} />
          </View>

          {/* Domain groups */}
          {domains.map((domain) => {
            const meta  = DOMAIN_META[domain];
            const items = currentAgeGroup.milestones.filter((m) => m.domain === domain);
            if (items.length === 0) return null;
            return (
              <View key={domain} style={[s.domainCard, { borderLeftColor: meta.color }]}>
                <View style={[s.domainHeader, { backgroundColor: meta.bgColor }]}>
                  <MilestoneIcon name={meta.emoji} size={20} color={meta.color} />
                  <Text style={[s.domainLabel, { color: meta.color }]}>{t(meta.labelKey)}</Text>
                  <View style={[s.domainCount, { backgroundColor: meta.color }]}>
                    <Text style={s.domainCountText}>{items.filter((m) => checkedMilestones[m.id]).length}/{items.length}</Text>
                  </View>
                </View>
                {items.map((milestone) => {
                  const done = !!checkedMilestones[milestone.id];
                  const label = lang === 'fil' ? milestone.fil : lang === 'zh' ? milestone.zh : milestone.en;
                  return (
                    <TouchableOpacity
                      key={milestone.id}
                      style={s.milestoneRow}
                      activeOpacity={0.72}
                      onPress={() => toggleMilestone(milestone.id)}
                    >
                      <View style={[s.checkbox, done && { backgroundColor: meta.color, borderColor: meta.color }]}>
                        {done && <Text style={s.checkmark}>✓</Text>}
                      </View>
                      <Text style={[s.milestoneText, done && s.milestoneTextDone]}>{label}</Text>
                      {done && <Star size={14} color={Colors.gold} fill={Colors.gold} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}

          {/* AI Summary */}
          <View style={s.aiCard}>
            <LinearGradient colors={['#EDE8FF', '#D4C8FF']} style={s.aiGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <View style={s.aiLabelRow}><Sparkles size={12} color="#5B3FC5" /><Text style={[s.aiLabel, { color: '#5B3FC5' }]}>{t('milestones.ate_ai_says')}</Text></View>
              <Text style={s.aiText}>
                {buildMilestoneSummary(childName, ageMonths, milestoneProgress.done, milestoneProgress.total, lang)}
              </Text>
              <Text style={s.aiDisclaimer}>{t('milestones.ai_disclaimer')}</Text>
            </LinearGradient>
          </View>

          {/* Age context note */}
          {ageMonths < currentAgeGroup.ageMonths && (
            <View style={s.ageFutureCard}>
              <Text style={s.ageFutureText}>
                <Clock size={12} color="#A07020" />{' '}{t('milestones.age_future_note', { age: currentAgeGroup.ageMonths < 12 ? `${currentAgeGroup.ageMonths}` : `${currentAgeGroup.ageMonths / 12}` })}
              </Text>
            </View>
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: STAGE CHECKLIST
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'checklist' && (
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <LinearGradient colors={['#D8F5E8', '#A8ECC4']} style={s.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <CircleCheck size={40} color="#1A6E48" />
            <View style={{ flex: 1 }}>
              <Text style={[s.heroTitle, { color: '#1A6E48' }]}>{t('milestones.checklist_title', { name: childName })}</Text>
              <Text style={[s.heroSub, { color: Colors.mint }]}>{t('milestones.checklist_sub')}</Text>
            </View>
          </LinearGradient>

          {/* Stage selector */}
          <View style={s.sectionTitleRow}><MapPin size={15} color="#C2185B" /><Text style={s.sectionTitle}>{t('milestones.select_stage')}</Text></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
            {STAGE_CHECKLISTS.map((stage, idx) => (
              <TouchableOpacity
                key={stage.key}
                style={[s.stageChip, selectedStageIdx === idx && s.stageChipActive]}
                onPress={() => setSelectedStageIdx(idx)}
                activeOpacity={0.78}
              >
                <MilestoneIcon name={stage.emoji} size={16} color={selectedStageIdx === idx ? '#FFF' : '#777'} />
                <Text style={[s.stageChipText, selectedStageIdx === idx && s.stageChipTextActive]}>
                  {t(stage.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Progress bar */}
          <View style={s.progressRow}>
            <Text style={s.progressLabel}>
              {t('milestones.stage_progress_label', { done: stageProgress.done, total: stageProgress.total })}
            </Text>
            <Text style={[s.progressPct, { color: Colors.mint }]}>{Math.round(stageProgress.pct * 100)}%</Text>
          </View>
          <View style={s.progressBarBg}>
            <View style={[s.progressBarFill, {
              width: `${Math.round(stageProgress.pct * 100)}%`,
              backgroundColor: stageProgress.pct === 1 ? Colors.mint : stageProgress.pct >= 0.6 ? Colors.gold : Colors.blue,
            }]} />
          </View>

          {/* Category legend */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.legendRow}>
            {Object.entries(CATEGORY_ICONS).map(([cat, Icon]) => (
              <View key={cat} style={[s.legendItem, { borderColor: CATEGORY_COLORS[cat] }]}>
                <Icon size={12} color={CATEGORY_COLORS[cat]} />
                <Text style={[s.legendLabel, { color: CATEGORY_COLORS[cat] }]}>{t(`milestones.cat_${cat}`)}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Checklist items */}
          <View style={s.checklistCard}>
            {currentStage.items.map((item) => {
              const done  = !!checkedStageItems[item.id];
              const label = lang === 'fil' ? item.fil : lang === 'zh' ? item.zh : item.en;
              const catColor = CATEGORY_COLORS[item.category];
              const CatIcon = CATEGORY_ICONS[item.category];
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[s.checklistRow, done && s.checklistRowDone]}
                  activeOpacity={0.72}
                  onPress={() => toggleStageItem(item.id)}
                >
                  <View style={[s.stageCatDot, { backgroundColor: catColor }]}>
                    <CatIcon size={13} color={Colors.white} />
                  </View>
                  <Text style={[s.checklistText, done && s.checklistTextDone]}>{label}</Text>
                  <View style={[s.stageCheckbox, done && { backgroundColor: Colors.mint, borderColor: Colors.mint }]}>
                    {done && <Text style={s.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* AI Summary */}
          <View style={s.aiCard}>
            <LinearGradient colors={['#D8F5E8', '#A8ECC4']} style={s.aiGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <View style={s.aiLabelRow}><Sparkles size={12} color="#1A6E48" /><Text style={[s.aiLabel, { color: '#1A6E48' }]}>{t('milestones.ate_ai_says')}</Text></View>
              <Text style={s.aiText}>
                {buildStageSummary(childName, stageProgress.done, stageProgress.total, lang)}
              </Text>
              <Text style={s.aiDisclaimer}>{t('milestones.ai_disclaimer')}</Text>
            </LinearGradient>
          </View>

          {/* PH Tip */}
          <View style={s.phTipCard}>
            <View style={s.phTipRow}><Flag size={12} color="#8B6914" /><Text style={s.phTipText}>{t('milestones.ph_tip')}</Text></View>
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Log First Time
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal visible={showFirstTimeModal} animationType="slide" transparent onRequestClose={() => setShowFirstTimeModal(false)}>
        <View style={s.modalBackdrop}>
          <View style={s.modalSheet}>
            <LinearGradient colors={['#FFDDE8', '#FFE8F0']} style={s.modalHeaderGrad}>
              {selectedFirstTime ? <MilestoneIcon name={selectedFirstTime.emoji} size={36} color="#880E4F" /> : null}
              <View style={{ flex: 1 }}>
                <Text style={s.modalTitle}>{selectedFirstTime ? getFTLabel(selectedFirstTime) : ''}</Text>
                <Text style={s.modalSubtitle}>{t('milestones.log_first_time_sub')}</Text>
              </View>
            </LinearGradient>

            <View style={s.modalBody}>
              <Text style={s.fieldLabel}>{t('milestones.modal_date')}</Text>
              <TextInput
                style={s.input}
                value={firstTimeDate}
                onChangeText={setFirstTimeDate}
                placeholder="YYYY-MM-DD"
                keyboardType="numbers-and-punctuation"
              />

              {selectedFirstTime?.hasNote && (
                <>
                  <Text style={s.fieldLabel}>{selectedFirstTime ? getFTNoteLabel(selectedFirstTime) : ''}</Text>
                  <TextInput
                    style={s.input}
                    value={firstTimeNote}
                    onChangeText={setFirstTimeNote}
                    placeholder={t('milestones.modal_note_placeholder')}
                  />
                </>
              )}

              <View style={s.modalBtnRow}>
                <TouchableOpacity style={s.modalCancel} onPress={() => setShowFirstTimeModal(false)}>
                  <Text style={s.modalCancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveFirstTime} style={{ flex: 1 }}>
                  <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={s.modalSave}>
                    <View style={s.modalSaveContent}><Star size={14} color={Colors.white} /><Text style={s.modalSaveText}>{t('milestones.save_first_time')}</Text></View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {firstTimeLogs[selectedFirstTime?.id || ''] && (
                <TouchableOpacity style={s.clearBtn} onPress={() => {
                  if (selectedFirstTime) {
                    setFirstTimeLogs((prev) => { const n = { ...prev }; delete n[selectedFirstTime.id]; return n; });
                    setShowFirstTimeModal(false);
                  }
                }}>
                  <Text style={s.clearBtnText}>{t('milestones.clear_first_time')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Add Memory
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal visible={showAddMemoryModal} animationType="slide" transparent onRequestClose={() => setShowAddMemoryModal(false)}>
        <View style={s.modalBackdrop}>
          <View style={s.modalSheet}>
            <LinearGradient colors={['#FFDDE8', '#FFE8F0']} style={s.modalHeaderGrad}>
              <Camera size={36} color="#880E4F" />
              <View style={{ flex: 1 }}>
                <Text style={s.modalTitle}>{t('milestones.add_memory_title')}</Text>
                <Text style={s.modalSubtitle}>{t('milestones.add_memory_sub')}</Text>
              </View>
            </LinearGradient>

            <View style={s.modalBody}>
              {/* Photo placeholder row */}
              <View style={s.photoPlaceholderRow}>
                <View style={s.photoPlaceholderBox}>
                  <Camera size={28} color={Colors.primaryPink} />
                  <Text style={s.photoPlaceholderText}>{t('milestones.add_photo')}</Text>
                </View>
                <Text style={s.photoHint}>{t('milestones.photo_hint')}</Text>
              </View>

              <Text style={s.fieldLabel}>{t('milestones.modal_caption')}</Text>
              <TextInput
                style={s.input}
                value={memCaption}
                onChangeText={setMemCaption}
                placeholder={t('milestones.modal_caption_placeholder')}
              />

              <Text style={s.fieldLabel}>{t('milestones.modal_date')}</Text>
              <TextInput
                style={s.input}
                value={memDate}
                onChangeText={setMemDate}
                placeholder="YYYY-MM-DD"
                keyboardType="numbers-and-punctuation"
              />

              <Text style={s.fieldLabel}>{t('milestones.modal_tag')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {MEMORY_TAGS.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[s.tagChip, memTag === tag && s.tagChipActive]}
                    onPress={() => setMemTag(memTag === tag ? '' : tag)}
                  >
                    <Text style={[s.tagChipText, memTag === tag && s.tagChipTextActive]}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={[s.modalBtnRow, { marginTop: 16 }]}>
                <TouchableOpacity style={s.modalCancel} onPress={() => setShowAddMemoryModal(false)}>
                  <Text style={s.modalCancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveMemory} style={{ flex: 1 }}>
                  <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={s.modalSave}>
                    <View style={s.modalSaveContent}><Save size={14} color={Colors.white} /><Text style={s.modalSaveText}>{t('milestones.save_memory')}</Text></View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#FFF5F8' },
  scroll:  { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // ── Top tabs ────────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1,
    borderBottomColor: '#FCE4EC', paddingHorizontal: 8, paddingTop: 4,
  },
  tabBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 3,
    borderBottomColor: 'transparent', gap: 2,
  },
  tabBtnActive: { borderBottomColor: Colors.primaryPink },
  tabLabel:     { fontSize: 11, fontWeight: '600', color: '#BBB', textAlign: 'center' },
  tabLabelActive: { color: Colors.primaryPink, fontWeight: '800' },

  // ── Hero banner ─────────────────────────────────────────────────────────────
  hero: {
    borderRadius: 22, padding: 18, marginBottom: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: Colors.primaryPink, shadowOpacity: 0.18, shadowRadius: 10, elevation: 4,
  },
  heroTitle: { fontSize: 15, fontWeight: '800', color: '#880E4F', lineHeight: 20 },
  heroSub:   { fontSize: 12, color: '#E87090', fontWeight: '600', marginTop: 3 },

  // ── AI card ─────────────────────────────────────────────────────────────────
  aiCard: { marginBottom: 18 },
  aiGrad: { borderRadius: 18, padding: 16, gap: 8 },
  aiLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  aiLabel: { fontSize: 11, fontWeight: '800', color: '#C2185B', letterSpacing: 0.5, textTransform: 'uppercase' },
  aiText:  { fontSize: 14, color: '#3C1C2C', fontWeight: '500', lineHeight: 21 },
  aiDisclaimer: { fontSize: 10, color: '#999', fontStyle: 'italic', marginTop: 4 },

  // ── Section header ──────────────────────────────────────────────────────────
  sectionHeader: { marginBottom: 10 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  sectionTitle:  { fontSize: 15, fontWeight: '800', color: '#C2185B' },
  sectionSub:    { fontSize: 12, color: '#888', fontWeight: '500' },

  // ── First Times grid ────────────────────────────────────────────────────────
  firstTimesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  ftCard: {
    width: (SCREEN_W - 52) / 3, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
    borderWidth: 1.5, borderColor: '#FCE4EC',
  },
  ftCardDone: { borderColor: '#F06292' },
  ftGrad: { padding: 12, alignItems: 'center', minHeight: 110, justifyContent: 'center', gap: 4 },
  ftEmoji: { fontSize: 26 },
  ftLabel: { fontSize: 10, fontWeight: '700', color: '#666', textAlign: 'center', lineHeight: 14 },
  ftLabelDone: { color: '#C2185B' },
  ftDoneBadge: {
    position: 'absolute', top: 6, right: 6,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.primaryPink, alignItems: 'center', justifyContent: 'center',
  },
  ftDoneTick: { color: Colors.white, fontSize: 10, fontWeight: '900' },
  ftDate:  { fontSize: 9, color: Colors.primaryPink, fontWeight: '700', textAlign: 'center' },
  ftNote:  { fontSize: 8, color: '#888', fontStyle: 'italic', textAlign: 'center', lineHeight: 12 },
  ftTap:   { fontSize: 9, color: '#CCC', textAlign: 'center', fontStyle: 'italic' },

  // ── Growth photos / memories ────────────────────────────────────────────────
  memoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  memCard: {
    width: (SCREEN_W - 52) / 3, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  memGrad:    { padding: 12, alignItems: 'center', minHeight: 100, gap: 4 },
  memEmoji:   { fontSize: 32 },
  memCaption: { fontSize: 10, fontWeight: '700', color: '#C2185B', textAlign: 'center', lineHeight: 14 },
  memDate:    { fontSize: 9, color: '#999' },

  emptyPhotos: { alignItems: 'center', paddingVertical: 32, marginBottom: 16, gap: 10 },
  emptyPhotoTitle: { fontSize: 14, fontWeight: '700', color: '#555', marginBottom: 4 },
  emptyPhotoSub:   { fontSize: 12, color: '#999', textAlign: 'center', paddingHorizontal: 20 },

  // ── Add button ───────────────────────────────────────────────────────────────
  addBtn: {
    borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 10,
    shadowColor: Colors.primaryPink, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  addBtnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addBtnText: { color: Colors.white, fontSize: 16, fontWeight: '800' },

  // ── Age chip row ─────────────────────────────────────────────────────────────
  chipRow:       { paddingHorizontal: 2, gap: 8, marginBottom: 16, alignItems: 'center' },
  ageChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F0F0F0', alignItems: 'center', flexDirection: 'row', gap: 4,
  },
  ageChipActive: { backgroundColor: Colors.primaryPink },
  ageChipText:   { fontSize: 13, fontWeight: '700', color: '#888' },
  ageChipTextActive: { color: Colors.white },
  ageChipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.mint },

  // ── Progress bar ─────────────────────────────────────────────────────────────
  progressRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel:  { fontSize: 13, color: '#555', fontWeight: '600' },
  progressPct:    { fontSize: 13, fontWeight: '800', color: Colors.primaryPink },
  progressBarBg:  { height: 8, backgroundColor: '#EEE', borderRadius: 4, marginBottom: 16, overflow: 'hidden' },
  progressBarFill: { height: 8, borderRadius: 4 },

  // ── Domain cards ─────────────────────────────────────────────────────────────
  domainCard: {
    backgroundColor: Colors.surface, borderRadius: 20, marginBottom: 12, overflow: 'hidden',
    shadowColor: Colors.shadowColor, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
    borderLeftWidth: 4,
  },
  domainHeader:   { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  domainEmoji:    { fontSize: 20 },
  domainLabel:    { fontSize: 14, fontWeight: '800', flex: 1 },
  domainCount:    { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  domainCountText: { color: Colors.white, fontSize: 11, fontWeight: '800' },

  milestoneRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#F8F0F4', gap: 10,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#DDD',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  checkmark:        { fontSize: 12, color: Colors.white, fontWeight: '900' },
  milestoneText:    { flex: 1, fontSize: 13, color: '#444', fontWeight: '500', lineHeight: 19 },
  milestoneTextDone: { color: '#BBB', textDecorationLine: 'line-through' },

  // ── Age future note ──────────────────────────────────────────────────────────
  ageFutureCard: {
    backgroundColor: Colors.softGold, borderRadius: 14, padding: 12, marginTop: 4,
    borderLeftWidth: 3, borderLeftColor: Colors.gold,
  },
  ageFutureText: { fontSize: 12, color: '#A07020', fontWeight: '600' },

  // ── Stage chips ───────────────────────────────────────────────────────────────
  stageChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#F0F0F0',
    alignItems: 'center', gap: 2,
  },
  stageChipActive: { backgroundColor: Colors.mint },
  stageChipEmoji:  { fontSize: 16 },
  stageChipText:   { fontSize: 11, fontWeight: '700', color: '#777' },
  stageChipTextActive: { color: Colors.white },

  // ── Category legend ───────────────────────────────────────────────────────────
  legendRow:   { paddingHorizontal: 2, gap: 6, marginBottom: 12, alignItems: 'center' },
  legendItem:  { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
  legendLabel: { fontSize: 10, fontWeight: '700' },

  // ── Checklist ─────────────────────────────────────────────────────────────────
  checklistCard: {
    backgroundColor: Colors.surface, borderRadius: 20, overflow: 'hidden',
    shadowColor: Colors.shadowColor, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4, marginBottom: 14,
  },
  checklistRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  checklistRowDone: { backgroundColor: '#F9FFF9' },
  stageCatDot:  { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checklistText: { flex: 1, fontSize: 13, color: '#333', fontWeight: '500', lineHeight: 19 },
  checklistTextDone: { color: '#AAA', textDecorationLine: 'line-through' },
  stageCheckbox: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#DDD',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  // ── PH Tip ───────────────────────────────────────────────────────────────────
  phTipCard: {
    backgroundColor: '#FFF5C8', borderRadius: 14, padding: 12, marginTop: 4,
    borderLeftWidth: 3, borderLeftColor: Colors.gold,
  },
  phTipRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  phTipText: { fontSize: 12, color: '#8B6914', fontWeight: '600', lineHeight: 18, flex: 1 },

  // ── Modals ────────────────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden',
    maxHeight: '85%',
  },
  modalHeaderGrad: {
    flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12,
  },
  modalHeaderEmoji: { fontSize: 36 },
  modalTitle:    { fontSize: 18, fontWeight: '800', color: '#880E4F' },
  modalSubtitle: { fontSize: 12, color: '#E87090', fontWeight: '600', marginTop: 2 },
  modalBody:     { padding: 20 },

  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 14,
    backgroundColor: '#FFF9FB', color: '#333', height: 52,
    fontFamily: 'PlusJakartaSans_400Regular',
  },

  photoPlaceholderRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 4 },
  photoPlaceholderBox: {
    width: 80, height: 80, borderRadius: 16, backgroundColor: '#FCE4EC',
    alignItems: 'center', justifyContent: 'center', gap: 4,
    borderWidth: 2, borderColor: '#F48FB1', borderStyle: 'dashed',
  },
  photoPlaceholderText:  { fontSize: 9, color: Colors.primaryPink, fontWeight: '700' },
  photoHint: { flex: 1, fontSize: 12, color: '#999', fontStyle: 'italic', lineHeight: 18 },

  tagChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F0F0F0' },
  tagChipActive: { backgroundColor: Colors.primaryPink },
  tagChipText:   { fontSize: 12, color: '#666', fontWeight: '600' },
  tagChipTextActive: { color: Colors.white },

  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalCancel: {
    flex: 0.4, borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: '#888' },
  modalSave: { borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' },
  modalSaveContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  modalSaveText: { fontSize: 14, fontWeight: '800', color: Colors.white },

  clearBtn: { marginTop: 12, alignItems: 'center' },
  clearBtnText: { fontSize: 13, color: Colors.primaryPink, fontWeight: '700', textDecorationLine: 'underline' },
});
