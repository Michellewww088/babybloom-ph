/**
 * encyclopedia.tsx — BabyBloom PH Parenting Encyclopedia
 * Step 15: Full UI — search, age filter, topic filter, recommended,
 *          article cards, detail modal with Markdown, bookmarks, trilingual.
 * Design: no emoji in UI, animated interactions, source badges, clean typography.
 */

import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Animated,
  SafeAreaView,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { ARTICLES, Article, AgeStage, Topic } from '../../constants/articles';
import Colors from '../../constants/Colors';

const { width: SW } = Dimensions.get('window');
type LangKey = 'en' | 'fil' | 'zh';

/* ─────────────────────────────────────────────────────────────────────────
   Source badge colour palette
───────────────────────────────────────────────────────────────────────── */
const SRC: Record<string, { bg: string; fg: string }> = {
  'WHO':                { bg: '#E0F2F1', fg: '#00695C' },
  'DOH PH':             { bg: '#E3F2FD', fg: '#1565C0' },
  'PPS':                { bg: '#FFF3E0', fg: '#E65100' },
  'AAP':                { bg: '#F3E5F5', fg: '#6A1B9A' },
  'PSA PH':             { bg: '#E8F5E9', fg: '#2E7D32' },
  'PhilHealth PH':      { bg: '#FFEBEE', fg: '#B71C1C' },
  'UNICEF PH':          { bg: '#E1F5FE', fg: '#0277BD' },
  'CDC':                { bg: '#E8EAF6', fg: '#283593' },
  'FNRI PH':            { bg: '#F1F8E9', fg: '#33691E' },
  'PGH':                { bg: '#EDE7F6', fg: '#4527A0' },
  'Evidence-Based Pediatrics': { bg: '#FFF8E1', fg: '#F9A825' },
};

/* ─────────────────────────────────────────────────────────────────────────
   Topic chip colours
───────────────────────────────────────────────────────────────────────── */
const TM: Record<Topic, { bg: string; fg: string }> = {
  feeding:       { bg: '#FFF8E1', fg: '#F57F17' },
  sleep:         { bg: '#EDE7F6', fg: '#4527A0' },
  development:   { bg: '#E8F5E9', fg: '#1B5E20' },
  health:        { bg: '#E3F2FD', fg: '#0D47A1' },
  safety:        { bg: '#FFF3E0', fg: '#BF360C' },
  mental_health: { bg: '#FCE4EC', fg: '#880E4F' },
  traditions:    { bg: '#FFF8E1', fg: '#E65100' },
  admin:         { bg: '#E8F5E9', fg: '#2E7D32' },
};

/* ─────────────────────────────────────────────────────────────────────────
   Age & topic filter config
───────────────────────────────────────────────────────────────────────── */
const AGE_FILTERS: { key: AgeStage | 'all'; labelKey: string }[] = [
  { key: 'all',     labelKey: 'encyclopedia.age_all' },
  { key: 'newborn', labelKey: 'encyclopedia.age_newborn' },
  { key: '1-3m',    labelKey: 'encyclopedia.age_1_3m' },
  { key: '3-6m',    labelKey: 'encyclopedia.age_3_6m' },
  { key: '6-9m',    labelKey: 'encyclopedia.age_6_9m' },
  { key: '9-12m',   labelKey: 'encyclopedia.age_9_12m' },
  { key: '1-2y',    labelKey: 'encyclopedia.age_1_2y' },
  { key: '2-3y',    labelKey: 'encyclopedia.age_2_3y' },
];

const TOPIC_FILTERS: { key: Topic | 'all'; labelKey: string }[] = [
  { key: 'all',          labelKey: 'encyclopedia.topic_all' },
  { key: 'feeding',      labelKey: 'encyclopedia.topic_feeding' },
  { key: 'sleep',        labelKey: 'encyclopedia.topic_sleep' },
  { key: 'development',  labelKey: 'encyclopedia.topic_development' },
  { key: 'health',       labelKey: 'encyclopedia.topic_health' },
  { key: 'safety',       labelKey: 'encyclopedia.topic_safety' },
  { key: 'mental_health',labelKey: 'encyclopedia.topic_mental_health' },
  { key: 'traditions',   labelKey: 'encyclopedia.topic_traditions' },
  { key: 'admin',        labelKey: 'encyclopedia.topic_admin' },
];

/* ─────────────────────────────────────────────────────────────────────────
   renderInline — bold + italic within a paragraph
───────────────────────────────────────────────────────────────────────── */
function renderInline(text: string, baseStyle: object): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <Text key={i} style={[baseStyle, { fontWeight: '700' }]}>{part.slice(2, -2)}</Text>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <Text key={i} style={[baseStyle, { fontStyle: 'italic' }]}>{part.slice(1, -1)}</Text>;
    return <Text key={i} style={baseStyle}>{part}</Text>;
  });
}

/* ─────────────────────────────────────────────────────────────────────────
   MarkdownText — renders subset of Markdown for article bodies
───────────────────────────────────────────────────────────────────────── */
function MarkdownText({ content }: { content: string }) {
  const lines = content.split('\n');
  const nodes: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];
  let numBuffer: Array<{ n: string; text: string }> = [];

  const flushBullets = (key: string) => {
    if (!bulletBuffer.length) return;
    nodes.push(
      <View key={`b-${key}`} style={{ marginBottom: 10 }}>
        {bulletBuffer.map((b, j) => (
          <View key={j} style={{ flexDirection: 'row', marginBottom: 5 }}>
            <View style={s.bulletDot} />
            <Text style={s.mdPara}>{renderInline(b, s.mdPara)}</Text>
          </View>
        ))}
      </View>
    );
    bulletBuffer = [];
  };

  const flushNum = (key: string) => {
    if (!numBuffer.length) return;
    nodes.push(
      <View key={`n-${key}`} style={{ marginBottom: 10 }}>
        {numBuffer.map(({ n, text }, j) => (
          <View key={j} style={{ flexDirection: 'row', marginBottom: 5 }}>
            <Text style={[s.mdPara, { width: 22, fontWeight: '700', color: Colors.dark }]}>{n}.</Text>
            <Text style={[s.mdPara, { flex: 1 }]}>{renderInline(text, s.mdPara)}</Text>
          </View>
        ))}
      </View>
    );
    numBuffer = [];
  };

  lines.forEach((line, i) => {
    if (line.startsWith('## ')) {
      flushBullets(`h2-pre-${i}`);
      flushNum(`h2-pre-n-${i}`);
      nodes.push(<Text key={`h2-${i}`} style={s.mdH2}>{line.slice(3)}</Text>);
    } else if (line.startsWith('### ')) {
      flushBullets(`h3-pre-${i}`);
      flushNum(`h3-pre-n-${i}`);
      nodes.push(<Text key={`h3-${i}`} style={s.mdH3}>{line.slice(4)}</Text>);
    } else if (line.startsWith('> ')) {
      flushBullets(`q-pre-${i}`);
      flushNum(`q-pre-n-${i}`);
      nodes.push(
        <View key={`q-${i}`} style={s.mdQuote}>
          <Text style={s.mdQuoteText}>{renderInline(line.slice(2), s.mdQuoteText)}</Text>
        </View>
      );
    } else if (/^\d+\. /.test(line)) {
      flushBullets(`num-pre-${i}`);
      const match = line.match(/^(\d+)\. (.+)/);
      if (match) numBuffer.push({ n: match[1], text: match[2] });
    } else if (line.startsWith('- ')) {
      flushNum(`bul-pre-${i}`);
      bulletBuffer.push(line.slice(2));
    } else if (line.trim() === '') {
      flushBullets(`e-${i}`);
      flushNum(`en-${i}`);
    } else {
      flushBullets(`p-pre-${i}`);
      flushNum(`pn-pre-${i}`);
      nodes.push(
        <Text key={`p-${i}`} style={s.mdPara}>{renderInline(line, s.mdPara)}</Text>
      );
    }
  });
  flushBullets('end');
  flushNum('end-n');

  return <View>{nodes}</View>;
}

/* ─────────────────────────────────────────────────────────────────────────
   SourceBadge
───────────────────────────────────────────────────────────────────────── */
function SourceBadge({ source }: { source: string }) {
  const c = SRC[source] ?? { bg: '#F5F5F5', fg: '#616161' };
  return (
    <View style={[s.srcBadge, { backgroundColor: c.bg }]}>
      <Text style={[s.srcBadgeText, { color: c.fg }]}>{source}</Text>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   TopicTag
───────────────────────────────────────────────────────────────────────── */
function TopicTag({ topic, t }: { topic: Topic; t: (k: string) => string }) {
  const c = TM[topic] ?? { bg: '#F5F5F5', fg: '#616161' };
  return (
    <View style={[s.topicTag, { backgroundColor: c.bg }]}>
      <Text style={[s.topicTagText, { color: c.fg }]}>{t(`encyclopedia.topic_${topic}`)}</Text>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   PHBadge
───────────────────────────────────────────────────────────────────────── */
function PHBadge() {
  return (
    <View style={[s.topicTag, { backgroundColor: '#E3F2FD' }]}>
      <Text style={[s.topicTagText, { color: '#1565C0' }]}>PH</Text>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   KeyTakeawaysBox
───────────────────────────────────────────────────────────────────────── */
function KeyTakeawaysBox({ takeaways, t }: { takeaways: string[]; t: (k: string) => string }) {
  return (
    <LinearGradient colors={['#E8F8F1', '#D4F2E4']} style={s.ktBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Text style={s.ktTitle}>{t('encyclopedia.key_takeaways')}</Text>
      {takeaways.map((item, i) => (
        <View key={i} style={s.ktRow}>
          <View style={s.ktCheck} />
          <Text style={s.ktText}>{item}</Text>
        </View>
      ))}
    </LinearGradient>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ArticleDetailModal
───────────────────────────────────────────────────────────────────────── */
function ArticleDetailModal({
  article, visible, onClose, defaultLang, t, isSaved, onToggleSave,
}: {
  article: Article | null;
  visible: boolean;
  onClose: () => void;
  defaultLang: LangKey;
  t: (k: string) => string;
  isSaved: boolean;
  onToggleSave: () => void;
}) {
  const [activeLang, setActiveLang] = useState<LangKey>(defaultLang);

  // reset lang when article changes
  React.useEffect(() => { setActiveLang(defaultLang); }, [article?.id, defaultLang]);

  if (!article) return null;

  const LANG_LABELS: Record<LangKey, string> = { en: 'EN', fil: 'FIL', zh: '中文' };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <SafeAreaView style={s.detailSafe}>
        {/* ── Gradient header ── */}
        <LinearGradient
          colors={[article.categoryColor, article.categoryColor + 'BB']}
          style={s.detailHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity onPress={onClose} style={s.backBtn} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
            <View style={s.backArrow} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.detailTitle} numberOfLines={3}>{article.title[activeLang]}</Text>
            <Text style={s.detailMeta}>{article.readMinutes} {t('encyclopedia.min_read')}</Text>
          </View>
          <TouchableOpacity onPress={onToggleSave} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }} style={s.detailSaveBtn}>
            <View style={[s.detailBookmarkFlag, isSaved && s.detailBookmarkFlagSaved]} />
            <View style={[s.detailBookmarkBase, isSaved && s.detailBookmarkBaseSaved]} />
          </TouchableOpacity>
        </LinearGradient>

        {/* ── Language toggle ── */}
        <View style={s.langBar}>
          {(['en', 'fil', 'zh'] as LangKey[]).map(l => (
            <TouchableOpacity
              key={l}
              onPress={() => setActiveLang(l)}
              style={[s.langBtn, activeLang === l && s.langBtnActive]}
            >
              <Text style={[s.langBtnText, activeLang === l && s.langBtnActiveText]}>
                {LANG_LABELS[l]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Scrollable body ── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.detailScroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Topic tags */}
          <View style={s.tagsRow}>
            {article.topics.map(tp => <TopicTag key={tp} topic={tp} t={t} />)}
            {article.isPHSpecific && <PHBadge />}
          </View>

          {/* Summary */}
          <Text style={s.detailSummary}>{article.summary[activeLang]}</Text>

          {/* Key Takeaways */}
          <KeyTakeawaysBox takeaways={article.keyTakeaways[activeLang]} t={t} />

          {/* Markdown body */}
          <MarkdownText content={article.body[activeLang]} />

          {/* Sources */}
          <View style={s.sourcesSection}>
            <Text style={s.sourcesLabel}>{t('encyclopedia.sources')}</Text>
            <View style={s.sourcesRow}>
              {article.sources.map(src => <SourceBadge key={src} source={src} />)}
            </View>
          </View>

          {/* Disclaimer */}
          <View style={s.disclaimer}>
            <Text style={s.disclaimerText}>{t('encyclopedia.disclaimer')}</Text>
          </View>

          <View style={{ height: 50 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ArticleCard
───────────────────────────────────────────────────────────────────────── */
function ArticleCard({
  article, lang, t, onPress, isSaved, onToggleSave,
}: {
  article: Article;
  lang: LangKey;
  t: (k: string) => string;
  onPress: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 50 }).start();

  return (
    <Animated.View style={[s.card, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
      >
        {/* Left colour bar */}
        <View style={[s.cardBar, { backgroundColor: article.categoryColor }]} />

        <View style={s.cardBody}>
          {/* Tags */}
          <View style={s.tagsRow}>
            {article.topics.slice(0, 2).map(tp => <TopicTag key={tp} topic={tp} t={t} />)}
            {article.isPHSpecific && <PHBadge />}
          </View>

          <Text style={s.cardTitle} numberOfLines={2}>{article.title[lang]}</Text>
          <Text style={s.cardSummary} numberOfLines={2}>{article.summary[lang]}</Text>

          {/* Footer */}
          <View style={s.cardFooter}>
            <View style={s.srcRow}>
              {article.sources.slice(0, 3).map(src => <SourceBadge key={src} source={src} />)}
            </View>
            <View style={s.cardFooterRight}>
              <Text style={s.cardReadTime}>{article.readMinutes} min</Text>
              {/* Bookmark icon (no emoji) */}
              <TouchableOpacity onPress={onToggleSave} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <View style={s.bookmarkOuter}>
                  <View style={[s.bookmarkFlag, isSaved && { backgroundColor: Colors.primaryPink }]} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   RecommendedCard  (horizontal scroll)
───────────────────────────────────────────────────────────────────────── */
function RecommendedCard({
  article, lang, t, onPress,
}: {
  article: Article;
  lang: LangKey;
  t: (k: string) => string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={s.recCard}>
      <View style={[s.recCardTop, { backgroundColor: article.categoryColor }]}>
        <View style={s.recChip}>
          <Text style={s.recChipText}>{t(`encyclopedia.topic_${article.topics[0]}`)}</Text>
        </View>
      </View>
      <View style={s.recCardBody}>
        <Text style={s.recCardTitle} numberOfLines={2}>{article.title[lang]}</Text>
        <Text style={s.recCardSub} numberOfLines={2}>{article.summary[lang]}</Text>
        <Text style={s.recCardTime}>{article.readMinutes} min</Text>
      </View>
    </TouchableOpacity>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ChipFilter (generic)
───────────────────────────────────────────────────────────────────────── */
function ChipFilter<T extends string>({
  options, selected, onSelect, t,
}: {
  options: { key: T; labelKey: string }[];
  selected: T;
  onSelect: (k: T) => void;
  t: (k: string) => string;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.chipRow}
      style={s.chipScroll}
    >
      {options.map(o => (
        <TouchableOpacity
          key={o.key}
          onPress={() => onSelect(o.key)}
          style={[s.chip, selected === o.key && s.chipActive]}
        >
          <Text style={[s.chipText, selected === o.key && s.chipTextActive]}>
            {t(o.labelKey)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   SavedTab
───────────────────────────────────────────────────────────────────────── */
function SavedTab({
  savedIds, lang, t, onOpen, onToggleSave,
}: {
  savedIds: Set<string>;
  lang: LangKey;
  t: (k: string) => string;
  onOpen: (a: Article) => void;
  onToggleSave: (id: string) => void;
}) {
  const saved = ARTICLES.filter(a => savedIds.has(a.id));

  if (saved.length === 0) {
    return (
      <View style={s.emptyState}>
        {/* Geometric placeholder instead of emoji */}
        <View style={s.emptyIconCircle}>
          <View style={s.emptyIconDiamond} />
        </View>
        <Text style={s.emptyTitle}>{t('encyclopedia.no_saved')}</Text>
        <Text style={s.emptySub}>{t('encyclopedia.no_saved_sub')}</Text>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
      {saved.map(a => (
        <ArticleCard
          key={a.id}
          article={a}
          lang={lang}
          t={t}
          onPress={() => onOpen(a)}
          isSaved
          onToggleSave={() => onToggleSave(a.id)}
        />
      ))}
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   EncyclopediaScreen — main export
───────────────────────────────────────────────────────────────────────── */
export default function EncyclopediaScreen() {
  const { t, i18n } = useTranslation();
  const lang: LangKey = (i18n.language as LangKey) ?? 'en';

  const [activeTab, setActiveTab]       = useState<'explore' | 'saved'>('explore');
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedAge, setSelectedAge]   = useState<AgeStage | 'all'>('all');
  const [selectedTopic, setSelectedTopic] = useState<Topic | 'all'>('all');
  const [savedIds, setSavedIds]         = useState<Set<string>>(new Set());
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [detailVisible, setDetailVisible]     = useState(false);

  /* Animated search-bar border colour */
  const borderAnim = useRef(new Animated.Value(0)).current;
  const onFocus = () => Animated.timing(borderAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
  const onBlur  = () => Animated.timing(borderAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
  const borderColor = borderAnim.interpolate({ inputRange: [0, 1], outputRange: ['#E8E8EE', Colors.mint] });

  const toggleSave = useCallback((id: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const openArticle = useCallback((a: Article) => {
    setSelectedArticle(a);
    setDetailVisible(true);
  }, []);

  /* Filtered article list */
  const filtered = useMemo(() => {
    let list = [...ARTICLES];
    if (selectedAge !== 'all')   list = list.filter(a => a.ageStages.includes(selectedAge as AgeStage));
    if (selectedTopic !== 'all') list = list.filter(a => a.topics.includes(selectedTopic as Topic));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a =>
        a.title[lang].toLowerCase().includes(q) ||
        a.summary[lang].toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedAge, selectedTopic, searchQuery, lang]);

  const recommended = useMemo(() => ARTICLES.filter(a => a.isRecommended), []);
  const showRecommended = !searchQuery && selectedAge === 'all' && selectedTopic === 'all';

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      {/* ── Tab bar: Explore / Saved ── */}
      <View style={s.tabBar}>
        {(['explore', 'saved'] as const).map(tab => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={s.tabItem}>
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {t(`encyclopedia.tab_${tab}`)}
            </Text>
            {activeTab === tab && <View style={s.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Saved tab ── */}
      {activeTab === 'saved' ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 60 }}>
          <SavedTab
            savedIds={savedIds}
            lang={lang}
            t={t}
            onOpen={openArticle}
            onToggleSave={toggleSave}
          />
        </ScrollView>
      ) : (
        /* ── Explore tab ── */
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 60 }}
        >
          {/* Search bar */}
          <View style={s.searchWrap}>
            <Animated.View style={[s.searchBox, { borderColor }]}>
              {/* Search icon: circle + line */}
              <View style={s.searchIconCircle} />
              <TextInput
                style={s.searchInput}
                placeholder={t('encyclopedia.search_placeholder')}
                placeholderTextColor="#9E9EBE"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={onFocus}
                onBlur={onBlur}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
            </Animated.View>
          </View>

          {/* Age filter */}
          <Text style={s.filterLabel}>{t('encyclopedia.browse_age')}</Text>
          <ChipFilter
            options={AGE_FILTERS}
            selected={selectedAge}
            onSelect={setSelectedAge}
            t={t}
          />

          {/* Topic filter */}
          <Text style={[s.filterLabel, { marginTop: 6 }]}>{t('encyclopedia.browse_topic')}</Text>
          <ChipFilter
            options={TOPIC_FILTERS}
            selected={selectedTopic}
            onSelect={setSelectedTopic}
            t={t}
          />

          {/* Recommended for You */}
          {showRecommended && (
            <>
              <Text style={s.sectionTitle}>{t('encyclopedia.recommended_for_you')}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 6 }}
              >
                {recommended.map(a => (
                  <RecommendedCard
                    key={a.id}
                    article={a}
                    lang={lang}
                    t={t}
                    onPress={() => openArticle(a)}
                  />
                ))}
              </ScrollView>
            </>
          )}

          {/* Article list */}
          <Text style={[s.sectionTitle, { marginTop: 16 }]}>
            {searchQuery
              ? `${t('encyclopedia.search_results')} (${filtered.length})`
              : t('encyclopedia.all_articles')
            }
          </Text>

          {filtered.length === 0 ? (
            <View style={s.noResults}>
              <Text style={s.noResultsText}>{t('encyclopedia.no_results')}</Text>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 16 }}>
              {filtered.map(a => (
                <ArticleCard
                  key={a.id}
                  article={a}
                  lang={lang}
                  t={t}
                  onPress={() => openArticle(a)}
                  isSaved={savedIds.has(a.id)}
                  onToggleSave={() => toggleSave(a.id)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* ── Article detail modal ── */}
      <ArticleDetailModal
        article={selectedArticle}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        defaultLang={lang}
        t={t}
        isSaved={selectedArticle ? savedIds.has(selectedArticle.id) : false}
        onToggleSave={() => selectedArticle && toggleSave(selectedArticle.id)}
      />
    </SafeAreaView>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Styles
───────────────────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  /* Tab bar */
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F8',
    paddingHorizontal: 24,
  },
  tabItem:       { flex: 1, alignItems: 'center', paddingVertical: 14, position: 'relative' },
  tabText:       { fontSize: 15, fontWeight: '600', color: '#9E9EBE' },
  tabTextActive: { color: Colors.primaryPink, fontWeight: '800' },
  tabUnderline:  {
    position: 'absolute', bottom: 0,
    left: '20%', right: '20%',
    height: 2.5, backgroundColor: Colors.primaryPink, borderRadius: 2,
  },

  /* Search */
  searchWrap: { padding: 16, paddingBottom: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    gap: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  searchIconCircle: {
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2, borderColor: '#9E9EBE',
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.dark },

  /* Filter labels + chips */
  filterLabel: {
    fontSize: 11, fontWeight: '800', color: Colors.textMid,
    letterSpacing: 1.5, marginLeft: 16, marginBottom: 6,
    textTransform: 'uppercase', fontFamily: 'PlusJakartaSans_500Medium',
  },
  chipScroll: { marginBottom: 4 },
  chipRow:    { paddingHorizontal: 16, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#F0F0F8',
  },
  chipActive:     { backgroundColor: Colors.primaryPink },
  chipText:       { fontSize: 13, fontWeight: '600', color: Colors.midGray },
  chipTextActive: { color: Colors.white, fontWeight: '700' },

  /* Section headings */
  sectionTitle: {
    fontSize: 16, fontWeight: '800', color: Colors.dark,
    marginHorizontal: 16, marginTop: 18, marginBottom: 12,
  },

  /* Recommended card */
  recCard: {
    width: 190, borderRadius: 20, backgroundColor: Colors.surface, overflow: 'hidden',
    shadowColor: Colors.shadowColor, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  recCardTop: { height: 72, padding: 10, justifyContent: 'flex-end' },
  recChip: {
    backgroundColor: 'rgba(255,255,255,0.28)', alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  recChipText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  recCardBody: { padding: 12 },
  recCardTitle: { fontSize: 13, fontWeight: '800', color: Colors.dark, marginBottom: 4, lineHeight: 17 },
  recCardSub:   { fontSize: 12, color: Colors.midGray, lineHeight: 16, marginBottom: 5 },
  recCardTime:  { fontSize: 11, color: '#9E9EBE', fontWeight: '600' },

  /* Article card */
  card: {
    backgroundColor: Colors.surface, borderRadius: 20, marginBottom: 12, overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: Colors.shadowColor, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  cardBar:  { width: 4 },
  cardBody: { flex: 1, padding: 14 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  topicTag:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  topicTagText: { fontSize: 11, fontWeight: '700' },

  cardTitle:   { fontSize: 14, fontWeight: '800', color: Colors.dark, marginBottom: 4, lineHeight: 19 },
  cardSummary: { fontSize: 13, color: Colors.midGray, lineHeight: 18, marginBottom: 10 },

  cardFooter:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardFooterRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  srcRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 4, flex: 1 },
  srcBadge:        { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  srcBadgeText:    { fontSize: 10, fontWeight: '700' },
  cardReadTime:    { fontSize: 11, color: '#9E9EBE', fontWeight: '600' },

  /* Bookmark icon on article list card */
  bookmarkOuter: { width: 18, height: 22, alignItems: 'center' },
  bookmarkFlag: {
    width: 14, height: 18,
    backgroundColor: '#E0E0E8',
    borderRadius: 2, borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
  },

  /* Bookmark button in article detail modal header */
  detailSaveBtn: { width: 36, height: 42, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 4 },
  detailBookmarkFlag: {
    width: 20, height: 26,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 3, borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
  },
  detailBookmarkFlagSaved: { backgroundColor: Colors.white },
  detailBookmarkBase: {
    width: 0, height: 0,
    borderLeftWidth: 10, borderRightWidth: 10, borderTopWidth: 8,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: 'rgba(255,255,255,0.35)',
    marginTop: -1,
  },
  detailBookmarkBaseSaved: { borderTopColor: Colors.white },

  /* Empty / no results */
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 80, paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.softPink,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyIconDiamond: {
    width: 32, height: 32, backgroundColor: Colors.primaryPink, opacity: 0.25,
    transform: [{ rotate: '45deg' }], borderRadius: 4,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: Colors.dark, textAlign: 'center', marginBottom: 8 },
  emptySub:   { fontSize: 14, color: '#9E9EBE', textAlign: 'center', lineHeight: 20 },
  noResults:  { alignItems: 'center', paddingVertical: 40 },
  noResultsText: { fontSize: 14, color: '#9E9EBE', fontStyle: 'italic' },

  /* Detail modal */
  detailSafe: { flex: 1, backgroundColor: Colors.background },
  detailHeader: {
    paddingTop: 16, paddingBottom: 20, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
  },
  backBtn:   { marginTop: 2, padding: 4 },
  backArrow: {
    width: 10, height: 10,
    borderLeftWidth: 2.5, borderBottomWidth: 2.5,
    borderColor: Colors.white,
    transform: [{ rotate: '45deg' }],
  },
  detailTitle: { fontSize: 18, fontWeight: '800', color: Colors.white, flex: 1, lineHeight: 24 },
  detailMeta:  { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: '600' },

  langBar:          { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: '#F0F0F8', paddingHorizontal: 20 },
  langBtn:          { flex: 1, alignItems: 'center', paddingVertical: 12 },
  langBtnActive:    { borderBottomWidth: 2.5, borderBottomColor: Colors.primaryPink },
  langBtnText:      { fontSize: 13, fontWeight: '600', color: '#9E9EBE' },
  langBtnActiveText:{ color: Colors.primaryPink, fontWeight: '800' },

  detailScroll:  { padding: 16 },
  detailSummary: { fontSize: 15, color: Colors.midGray, lineHeight: 22, marginBottom: 16, fontStyle: 'italic' },

  /* Key Takeaways */
  ktBox:   { borderRadius: 16, padding: 16, marginBottom: 20 },
  ktTitle: {
    fontSize: 12, fontWeight: '800', color: '#1A6A40',
    marginBottom: 10, letterSpacing: 0.8, textTransform: 'uppercase',
  },
  ktRow:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 10 },
  ktCheck: { width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.mint, marginTop: 2 },
  ktText:  { flex: 1, fontSize: 14, color: '#1A6A40', lineHeight: 20, fontWeight: '500' },

  /* Markdown */
  mdH2:   { fontSize: 17, fontWeight: '800', color: Colors.dark, marginTop: 20, marginBottom: 8 },
  mdH3:   { fontSize: 15, fontWeight: '700', color: Colors.dark, marginTop: 14, marginBottom: 6 },
  mdPara: { fontSize: 14, color: Colors.midGray, lineHeight: 22, marginBottom: 8 },
  bulletDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.mint, marginTop: 8, marginRight: 10,
  },
  mdQuote: {
    borderLeftWidth: 3, borderLeftColor: Colors.mint,
    paddingLeft: 12, paddingVertical: 6, marginVertical: 8,
    backgroundColor: '#F0FBF6', borderRadius: 4,
  },
  mdQuoteText: { fontSize: 14, color: '#1A6A40', fontStyle: 'italic', lineHeight: 20 },

  /* Sources */
  sourcesSection: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F0F0F8' },
  sourcesLabel:   { fontSize: 11, fontWeight: '800', color: '#9E9EBE', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  sourcesRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  /* Disclaimer */
  disclaimer: {
    marginTop: 16, backgroundColor: Colors.softGold,
    borderRadius: 12, padding: 12,
    borderLeftWidth: 3, borderLeftColor: Colors.gold,
  },
  disclaimerText: { fontSize: 12, color: '#7A6030', lineHeight: 18, fontStyle: 'italic' },
});
