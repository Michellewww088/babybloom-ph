/**
 * milestones.tsx — Milestones: Ages 0–12
 * Stage selector + category filter + milestone checklist
 * Offline-first: all reference data embedded in milestoneStore
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  MessageCircle,
  Users,
  Brain,
  Zap,
  Heart,
  Droplets,
  Gamepad2,
  BookOpen,
  HeartHandshake,
  Shield,
  Monitor,
  Eye,
  Ear,
  Baby,
  Circle,
  CheckCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Colors } from '@/constants/Colors';
import { useChildStore, getChildDisplayName } from '@/store/childStore';
import {
  useMilestoneStore,
  STAGES,
  getStageForAge,
  type StageName,
  type MilestoneRef,
} from '@/store/milestoneStore';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAgeMonths(birthday: string): number {
  const birth = new Date(birthday);
  const now = new Date();
  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  return Math.max(0, months);
}

// ── Category config ───────────────────────────────────────────────────────────

interface CategoryConfig {
  bg: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  motor:     { bg: Colors.softBlue,  icon: Activity },
  language:  { bg: Colors.softPink,  icon: MessageCircle },
  social:    { bg: Colors.softGold,  icon: Users },
  cognitive: { bg: Colors.softMint,  icon: Brain },
  physical:  { bg: Colors.softPink,  icon: Zap },
  'self-care':{ bg: Colors.softMint, icon: Heart },
  feeding:   { bg: Colors.softBlue,  icon: Droplets },
  play:      { bg: Colors.softGold,  icon: Gamepad2 },
  literacy:  { bg: Colors.softPink,  icon: BookOpen },
  emotional: { bg: Colors.softGold,  icon: HeartHandshake },
  health:    { bg: Colors.softMint,  icon: Shield },
  digital:   { bg: Colors.softBlue,  icon: Monitor },
  vision:    { bg: Colors.softBlue,  icon: Eye },
  hearing:   { bg: Colors.softGold,  icon: Ear },
};

function getCategoryConfig(category: string): CategoryConfig {
  return CATEGORY_CONFIG[category] ?? { bg: Colors.softPink, icon: Activity };
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface MilestoneCardProps {
  item: MilestoneRef;
  isAchieved: boolean;
  achievedDate?: string;
  onToggle: (item: MilestoneRef, isAchieved: boolean) => void;
}

const MilestoneCard = React.memo(function MilestoneCard({
  item,
  isAchieved,
  achievedDate,
  onToggle,
}: MilestoneCardProps) {
  const { t } = useTranslation();
  const config = getCategoryConfig(item.category);
  const IconComponent = config.icon;

  const formattedDate = achievedDate
    ? new Date(achievedDate).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <TouchableOpacity
      style={[styles.card, isAchieved && styles.cardAchieved]}
      onPress={() => onToggle(item, isAchieved)}
      activeOpacity={0.75}
    >
      {/* Checkbox */}
      <View style={styles.cardCheckbox}>
        {isAchieved ? (
          <CheckCircle size={24} color={Colors.mint} strokeWidth={1.5} />
        ) : (
          <Circle size={24} color={Colors.textLight} strokeWidth={1.5} />
        )}
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <Text style={[styles.cardText, isAchieved && styles.cardTextAchieved]}>
          {item.milestone_text}
        </Text>

        <View style={styles.cardBadges}>
          {/* Category badge */}
          <View style={[styles.categoryBadge, { backgroundColor: config.bg }]}>
            <IconComponent size={10} color={Colors.textMid} strokeWidth={1.5} />
            <Text style={styles.categoryBadgeText}>{item.category}</Text>
          </View>

          {/* WHO badge */}
          {item.is_who_standard && (
            <View style={styles.whoBadge}>
              <Text style={styles.whoBadgeText}>{t('milestones.who_badge')}</Text>
            </View>
          )}
        </View>

        {/* Achieved date */}
        {isAchieved && formattedDate && (
          <Text style={styles.achievedDate}>
            {t('milestones.achieved_on', { date: formattedDate })}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function MilestonesScreen() {
  const { t } = useTranslation();
  const { activeChild } = useChildStore();
  const { getMilestonesForStage, getAchievedForChild, markAchieved, unmarkAchieved } =
    useMilestoneStore();

  // Determine child age and initial stage
  const childAgeMonths = useMemo(() => {
    if (!activeChild?.birthday) return 0;
    return getAgeMonths(activeChild.birthday);
  }, [activeChild?.birthday]);

  const initialStage = useMemo(
    () => getStageForAge(childAgeMonths),
    [childAgeMonths]
  );

  const [selectedStage, setSelectedStage] = useState<StageName>(initialStage);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Scroll refs for stage selector
  const stageScrollRef = useRef<ScrollView>(null);

  // When child changes, reset to their current stage
  useEffect(() => {
    setSelectedStage(initialStage);
    setSelectedCategory('all');
  }, [initialStage]);

  // Auto-scroll stage chips to show the active stage
  useEffect(() => {
    const idx = STAGES.findIndex((s) => s.name === selectedStage);
    if (idx > 0 && stageScrollRef.current) {
      // Each chip ~90px wide + 8px gap; scroll so active chip is visible
      setTimeout(() => {
        stageScrollRef.current?.scrollTo({ x: Math.max(0, (idx - 1) * 98), animated: true });
      }, 150);
    }
  }, [selectedStage]);

  // Milestones for selected stage
  const stageMilestones = useMemo(
    () => getMilestonesForStage(selectedStage),
    [selectedStage, getMilestonesForStage]
  );

  // Unique categories for current stage
  const categories = useMemo(() => {
    const cats = Array.from(new Set(stageMilestones.map((m) => m.category)));
    return cats;
  }, [stageMilestones]);

  // Achieved milestones for this child
  const achievedList = useMemo(() => {
    if (!activeChild) return [];
    return getAchievedForChild(activeChild.id);
  }, [activeChild, getAchievedForChild]);

  const achievedSet = useMemo(
    () => new Set(achievedList.map((a) => a.milestone_ref_id)),
    [achievedList]
  );

  // Filtered milestone list
  const displayedMilestones = useMemo(() => {
    if (selectedCategory === 'all') return stageMilestones;
    return stageMilestones.filter((m) => m.category === selectedCategory);
  }, [stageMilestones, selectedCategory]);

  // Progress counts
  const achievedInStage = useMemo(
    () => stageMilestones.filter((m) => achievedSet.has(m.id)).length,
    [stageMilestones, achievedSet]
  );

  const progressPct =
    stageMilestones.length > 0
      ? Math.round((achievedInStage / stageMilestones.length) * 100)
      : 0;

  // Toggle handler
  const handleToggle = useCallback(
    (item: MilestoneRef, isAchieved: boolean) => {
      if (!activeChild) return;

      if (isAchieved) {
        Alert.alert(
          t('milestones.unmark_confirm_title'),
          t('milestones.unmark_confirm_msg'),
          [
            { text: t('milestones.unmark_confirm_no'), style: 'cancel' },
            {
              text: t('milestones.unmark_confirm_yes'),
              style: 'destructive',
              onPress: () => unmarkAchieved(activeChild.id, item.id),
            },
          ]
        );
      } else {
        markAchieved(activeChild.id, item.id);
      }
    },
    [activeChild, markAchieved, unmarkAchieved, t]
  );

  const childName = activeChild ? getChildDisplayName(activeChild) : 'Baby';

  const renderMilestoneCard = useCallback(
    ({ item }: { item: MilestoneRef }) => {
      const isAchieved = achievedSet.has(item.id);
      const achievedRecord = achievedList.find((a) => a.milestone_ref_id === item.id);
      return (
        <MilestoneCard
          item={item}
          isAchieved={isAchieved}
          achievedDate={achievedRecord?.achieved_date}
          onToggle={handleToggle}
        />
      );
    },
    [achievedSet, achievedList, handleToggle]
  );

  const listHeader = (
    <>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${progressPct}%` as any }]}
          />
        </View>
        <Text style={styles.progressLabel}>
          {t('milestones.progress', {
            achieved: achievedInStage,
            total: stageMilestones.length,
          })}
          {' · '}{progressPct}%
        </Text>
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            selectedCategory === 'all' && styles.categoryChipActive,
          ]}
          onPress={() => {
            setSelectedCategory('all');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Text
            style={[
              styles.categoryChipText,
              selectedCategory === 'all' && styles.categoryChipTextActive,
            ]}
          >
            {t('milestones.filter_all')}
          </Text>
        </TouchableOpacity>

        {categories.map((cat) => {
          const config = getCategoryConfig(cat);
          const isActive = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, isActive && styles.categoryChipActive]}
              onPress={() => {
                setSelectedCategory(cat);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  isActive && styles.categoryChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </>
  );

  const listEmpty = (
    <View style={styles.emptyState}>
      <Baby size={48} color={Colors.textLight} strokeWidth={1.5} />
      <Text style={styles.emptyText}>{t('milestones.empty_stage')}</Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('milestones.title')}</Text>
        <Text style={styles.headerSubtitle}>
          {t('milestones.subtitle', { name: childName })}
        </Text>
      </View>

      {/* ── Stage selector ── */}
      <ScrollView
        ref={stageScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stageScroll}
        style={styles.stageSelectorRow}
      >
        {STAGES.map((stage) => {
          const isActive = selectedStage === stage.name;
          const isCurrentStage = stage.name === initialStage;
          return (
            <TouchableOpacity
              key={stage.name}
              style={[styles.stageChip, isActive && styles.stageChipActive]}
              onPress={() => {
                setSelectedStage(stage.name as StageName);
                setSelectedCategory('all');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text
                style={[
                  styles.stageChipText,
                  isActive && styles.stageChipTextActive,
                ]}
              >
                {stage.name}
              </Text>
              {isCurrentStage && !isActive && (
                <View style={styles.currentDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Milestone list ── */}
      <FlatList
        data={displayedMilestones}
        keyExtractor={(item) => item.id}
        renderItem={renderMilestoneCard}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 24,
    color: Colors.primary,
  },
  headerSubtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: Colors.textMid,
    marginTop: 2,
  },

  // Stage selector
  stageSelectorRow: {
    maxHeight: 52,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stageScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stageChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.softPink,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stageChipActive: {
    backgroundColor: Colors.primary,
  },
  stageChipText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
    color: Colors.primary,
  },
  stageChipTextActive: {
    color: Colors.white,
  },
  currentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },

  // List
  listContent: {
    paddingBottom: 32,
  },

  // Progress
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  progressLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Colors.textMid,
    textAlign: 'right',
  },

  // Category filter
  categoryScroll: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.softPink,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryChipText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: Colors.primary,
    textTransform: 'capitalize',
  },
  categoryChipTextActive: {
    color: Colors.white,
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  // Milestone card
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: `0 2px 6px ${Colors.shadowColor}14`,
      },
    }),
  },
  cardAchieved: {
    backgroundColor: Colors.softMint,
  },
  cardCheckbox: {
    marginRight: 12,
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: Colors.textDark,
    lineHeight: 20,
    marginBottom: 8,
  },
  cardTextAchieved: {
    color: Colors.mint,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  cardBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 10,
    color: Colors.textMid,
    textTransform: 'capitalize',
  },
  whoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: Colors.softBlue,
  },
  whoBadgeText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    color: Colors.blue,
  },
  achievedDate: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 11,
    color: Colors.mint,
    marginTop: 6,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: Colors.textLight,
    textAlign: 'center',
  },
});
