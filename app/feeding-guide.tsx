/**
 * feeding-guide.tsx — Feeding Guide Screen (accessible from Dashboard icon grid)
 * Step 17: PH Superfoods, Complementary Food Timeline, Allergen Introduction Guide
 * BMAD design: 3-tab UX with Ate AI summaries, allergy warnings, trilingual
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Modal, SafeAreaView, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useChildStore, getChildDisplayName } from '../store/childStore';
import {
  AGE_STAGES, PH_SUPERFOODS, ALLERGENS, READINESS_SIGNS, FOODS_TO_AVOID,
  Superfood, Allergen,
} from '../constants/feeding-guide';
import Colors from '../constants/Colors';
import {
  Calendar, Leaf, AlertTriangle, Sparkles, Ban, BookOpen, CircleCheck,
  Lock, Hospital, UtensilsCrossed, Baby, Microscope, Zap, Flag, ChefHat,
} from 'lucide-react-native';

const { width: W } = Dimensions.get('window');

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

type TopTab = 'timeline' | 'superfoods' | 'allergens';

// ─────────────────────────────────────────────────────────────────────────────
// ATE AI SUMMARY BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

function buildTimelineSummary(ageMonths: number, childName: string, lang: string): string {
  // ── 0–5 months: exclusive breastfeeding ───────────────────────────────────
  if (ageMonths < 6) {
    const msgs: Record<string, string> = {
      en:  `🤱 ${childName} is ${ageMonths}mo — still in the exclusive breastfeeding stage. Breast milk or formula is all Baby needs. Breastfeed 8–12×/day; formula-fed babies take 120–180 ml per feed. Start solids at 6 months or when readiness signs appear. You're doing great, Nanay! 💕`,
      fil: `🤱 Si ${childName} ay ${ageMonths} buwan pa — nasa eksklusibong pagpapasuso pa. Ang gatas ng ina o formula ay lahat ng kailangan ni Baby. Magpasuso 8–12×/araw; ang formula-fed na sanggol ay kumukonsumo ng 120–180 ml bawat pagpapakain. Magsimula ng solids sa 6 buwan. Magaling ka, Nanay! 💕`,
      zh:  `🤱 ${childName}现在${ageMonths}个月——还处于纯母乳/配方奶阶段。母乳每天8–12次按需喂养；配方奶每次120–180毫升。在6个月或出现准备迹象时开始辅食。妈妈加油！💕`,
    };
    return msgs[lang] || msgs.en;
  }
  // ── 6 months: first foods ─────────────────────────────────────────────────
  if (ageMonths === 6) {
    const msgs: Record<string, string> = {
      en:  `🥣 ${childName} is ready for first foods! Start with iron-rich single-ingredient purees — lugaw, kamote, kalabasa, mongo. Introduce one new food every 3–5 days to watch for reactions. Aim for 2–3 small solids sessions + continue breast milk or formula. 🌟`,
      fil: `🥣 Handa na si ${childName} para sa unang pagkain! Magsimula sa iron-rich single-ingredient purees — lugaw, kamote, kalabasa, mongo. Mag-uvain ng isang bagong pagkain bawat 3–5 araw para masundan ang mga reaksyon. Target ang 2–3 maliit na solids sessions + ipagpatuloy ang gatas ng ina o formula. 🌟`,
      zh:  `🥣 ${childName}已经准备好吃第一口辅食了！从富铁的单一成分泥糊开始——稀饭、红薯、南瓜、绿豆。每3–5天引入一种新食物，观察反应。每天2–3次辅食 + 继续母乳/配方奶。🌟`,
    };
    return msgs[lang] || msgs.en;
  }
  // ── 7–8 months: mashed textures ──────────────────────────────────────────
  if (ageMonths < 9) {
    const msgs: Record<string, string> = {
      en:  `🍌 ${childName} is ready for mashed foods! Banana, avocado, egg yolk, soft tofu, fish, and chicken are great now. Aim for 3 meals + 1–2 snacks. Egg yolk is a great first protein — introduce egg white separately at 8+ months. 💪`,
      fil: `🍌 Handa na si ${childName} para sa mashed foods! Saging, abokado, pula ng itlog, malambot na tofu, isda, at manok ay maganda ngayon. Target ang 3 kain + 1–2 meryenda. Ang pula ng itlog ay mahusay na unang protina — mag-uvain ng puti ng itlog nang hiwalay sa 8+ buwan. 💪`,
      zh:  `🍌 ${childName}已经准备好捣碎食物了！香蕉、牛油果、蛋黄、软豆腐、鱼和鸡肉都很适合。目标每天3餐 + 1–2次零食。蛋黄是很好的第一蛋白质——8个月以上单独引入蛋白。💪`,
    };
    return msgs[lang] || msgs.en;
  }
  // ── 9–11 months: finger foods ─────────────────────────────────────────────
  if (ageMonths < 12) {
    const msgs: Record<string, string> = {
      en:  `👣 ${childName} is ready for soft finger foods! Small bite-sized pieces baby can pick up. Reduce formula to ~500 ml/day — solids are now the main meal. 3–4 meals + 1–2 snacks. Almost ready for the family table! 🎉`,
      fil: `👣 Handa na si ${childName} para sa malambot na finger foods! Maliliit na piraso na maaaring pulutin ni Baby. Bawasan ang formula sa ~500 ml/araw — ang solids na ang pangunahing pagkain. 3–4 kain + 1–2 meryenda. Halos handa na para sa hapag ng pamilya! 🎉`,
      zh:  `👣 ${childName}已经准备好软手指食物了！小口大小的块让宝宝自己抓。配方奶减少到每天约500毫升——辅食现在是主餐。每天3–4餐 + 1–2次零食。快要上家庭餐桌了！🎉`,
    };
    return msgs[lang] || msgs.en;
  }
  // ── 12 months: cow's milk transition ─────────────────────────────────────
  if (ageMonths === 12) {
    const msgs: Record<string, string> = {
      en:  `🥛 Happy 1st birthday, ${childName}! Switch from formula to whole cow's milk (360–480 ml/day max). No honey, whole nuts, or added salt. Baby joins the full family table — 3 meals + 2 snacks. Continue breastfeeding if possible. 🎂`,
      fil: `🥛 Maligayang kaarawan, ${childName}! Lumipat mula formula patungong buong gatas ng baka (360–480 ml/araw). Walang pulot, buo na mani, o dagdag na asin. Sumali na si Baby sa buong hapag ng pamilya — 3 kain + 2 meryenda. Ipagpatuloy ang pagpapasuso kung posible. 🎂`,
      zh:  `🥛 生日快乐，${childName}！从配方奶改用全脂牛奶（每天最多360–480毫升）。不加蜂蜜、整颗坚果或盐。宝宝加入完整的家庭餐桌——每天3餐 + 2次零食。如可能继续母乳喂养。🎂`,
    };
    return msgs[lang] || msgs.en;
  }
  // ── 13–23 months: 1–2 years ──────────────────────────────────────────────
  if (ageMonths < 24) {
    const msgs: Record<string, string> = {
      en:  `🌟 ${childName} is on full family foods! Water is the main drink — no juice or sweetened drinks. Offer a rainbow of veggies, protein, grains, and dairy at every meal. Encourage self-feeding — it builds independence and fine motor skills! 🥄`,
      fil: `🌟 Si ${childName} ay kumakain na ng pagkain ng pamilya! Tubig ang pangunahing inumin — walang juice o matamis na inumin. Mag-alok ng iba't ibang gulay, protina, butil, at dairy sa bawat kain. Hikayating kumain nang mag-isa — nagtatayo ito ng kalayaan at fine motor skills! 🥄`,
      zh:  `🌟 ${childName}现在吃家庭食物了！水是主要饮品——不喝果汁或甜饮料。每餐提供彩虹般的蔬菜、蛋白质、谷物和乳制品。鼓励自主进食——培养独立性和精细运动技能！🥄`,
    };
    return msgs[lang] || msgs.en;
  }
  // ── 24–59 months: 2–5 years ──────────────────────────────────────────────
  if (ageMonths < 60) {
    const ageYears = Math.floor(ageMonths / 12);
    const msgs: Record<string, string> = {
      en:  `🍱 ${childName} is ${ageYears} years old — all food groups at every meal! Limit juice to 120 ml/day (100% fruit juice only). Avoid sugary snacks, processed meats, and fried fast foods. This is the perfect time to build lifelong healthy eating habits! 🥦`,
      fil: `🍱 ${ageYears} taon na si ${childName} — lahat ng food groups sa bawat kain! Limitahan ang juice sa 120 ml/araw (100% fruit juice lamang). Iwasan ang matamis na meryenda, processed na karne, at piniritong fast foods. Ito ang perpektong oras para bumuo ng malusog na gawi sa pagkain! 🥦`,
      zh:  `🍱 ${childName}已经${ageYears}岁了——每餐包含所有食物组！将果汁限制在每天120毫升（仅100%纯果汁）。避免含糖零食、加工肉类和油炸快餐。这是建立终身健康饮食习惯的最佳时机！🥦`,
    };
    return msgs[lang] || msgs.en;
  }
  // ── 60–143 months: 5–12 years ────────────────────────────────────────────
  const ageYears = Math.floor(ageMonths / 12);
  const msgs: Record<string, string> = {
    en:  `🎒 ${childName} is ${ageYears} years old — school nutrition matters! Pack a balanced lunchbox: carbs + protein + veggies + fruit. Iron-rich foods (isda, malunggay, mongo) are especially important for girls. Milk or dairy daily for strong bones (480–720 ml). Limit chips, instant noodles, and sugary drinks. 📚`,
    fil: `🎒 ${ageYears} taon na si ${childName} — mahalaga ang nutrisyon sa paaralan! Mag-pack ng balanseng lunchbox: carbs + protina + gulay + prutas. Ang iron-rich na pagkain (isda, malunggay, mongo) ay espesyal na mahalaga para sa mga batang babae. Gatas o dairy araw-araw para sa matibay na buto (480–720 ml). Limitahan ang chips, instant noodles, at matamis na inumin. 📚`,
    zh:  `🎒 ${childName}已经${ageYears}岁了——学校营养很重要！带一个均衡的午餐盒：碳水 + 蛋白质 + 蔬菜 + 水果。富铁食物（鱼、辣木叶、绿豆）对女孩尤其重要。每天牛奶或乳制品强健骨骼（480–720毫升）。限制薯片、方便面和含糖饮料。📚`,
  };
  return msgs[lang] || msgs.en;
}

function buildSuperfoodsSummary(childName: string, ageMonths: number, lang: string): string {
  const availableCount = PH_SUPERFOODS.filter(f => f.minAgeMonths <= ageMonths).length;
  const msgs: Record<string, string> = {
    en: `🌿 ${availableCount} PH superfoods are ready for ${childName} at ${ageMonths} months! These local ingredients are packed with nutrients babies need — and they're available at your nearest palengke. Try malunggay for iron, kamote for Vitamin A, and isda for brain-building DHA. 🇵🇭`,
    fil: `🌿 ${availableCount} PH superfoods ang handa para kay ${childName} sa ${ageMonths} buwan! Ang mga lokal na sangkap na ito ay puno ng nutrients na kailangan ng mga sanggol — at makikita sila sa pinakamalapit na palengke. Subukan ang malunggay para sa iron, kamote para sa Vitamin A, at isda para sa DHA ng utak. 🇵🇭`,
    zh: `🌿 ${availableCount}种菲律宾超级食物适合${ageMonths}个月的${childName}！这些当地食材富含婴儿所需营养——在附近的菜市场就能买到。试试辣木叶补铁、红薯补维生素A、鱼补大脑DHA。🇵🇭`,
  };
  return msgs[lang] || msgs.en;
}

function buildAllergenSummary(childName: string, allergies: string[], lang: string): string {
  if (allergies.length > 0) {
    const msgs: Record<string, string> = {
      en: `⚠️ ${childName} has ${allergies.length} recorded allerg${allergies.length > 1 ? 'ies' : 'y'}: ${allergies.join(', ')}. I've marked related foods below. Always consult your Pedia before introducing allergen foods. Early introduction of OTHER allergens (not their known ones) may still help reduce risk. 💙`,
      fil: `⚠️ Si ${childName} ay may ${allergies.length} recorded allerg${allergies.length > 1 ? 'ies' : 'y'}: ${allergies.join(', ')}. Na-mark ko na ang mga kaugnay na pagkain sa ibaba. Laging kumonsulta sa inyong Pedia bago mag-uvain ng allergen foods. Ang maagang pagpapakilala ng IBANG allergens (hindi ang kanilang kilalang allergy) ay maaari pa ring tumulong na bawasan ang panganib. 💙`,
      zh: `⚠️ ${childName}有${allergies.length}种已记录的过敏：${allergies.join('、')}。我已在下方标记了相关食物。在引入过敏食物前，请务必咨询儿科医生。早期引入其他过敏原（不是已知的）仍可能有助于降低风险。💙`,
    };
    return msgs[lang] || msgs.en;
  }
  const msgs: Record<string, string> = {
    en: `✅ No allergies recorded for ${childName}! Current evidence supports early introduction of all major allergens (from 6M) to reduce allergy risk. Introduce one at a time, wait 3–5 days. Always watch for reactions for 2 hours after first exposure. 💚`,
    fil: `✅ Walang naitalang allergy para kay ${childName}! Sinusuportahan ng kasalukuyang ebidensya ang maagang pagpapakilala ng lahat ng pangunahing allergens (mula 6M) para mabawasan ang panganib ng allergy. Mag-uvain ng isa sa isang pagkakataon, maghintay ng 3–5 araw. Laging bantayan ang mga reaksyon sa loob ng 2 oras pagkatapos ng unang pagkakalantad. 💚`,
    zh: `✅ ${childName}没有记录的过敏！当前证据支持早期引入所有主要过敏原（从6个月开始）以降低过敏风险。一次引入一种，等待3–5天。首次接触后始终观察反应2小时。💚`,
  };
  return msgs[lang] || msgs.en;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function FeedingGuideScreen() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('zh') ? 'zh' : i18n.language?.startsWith('fil') ? 'fil' : 'en';

  const { activeChild } = useChildStore();
  const childName    = activeChild ? getChildDisplayName(activeChild) : 'Baby';
  const ageMonths    = activeChild ? getAgeInMonths(activeChild.birthday) : 6;
  const childAllergies = activeChild?.allergies ?? [];

  const [activeTab, setActiveTab]           = useState<TopTab>('timeline');
  // Auto-expand the child's current age stage on first render
  const defaultStage = useMemo(() => {
    const found = AGE_STAGES.find(s => ageMonths >= s.ageMin && ageMonths <= s.ageMax);
    return found?.id ?? AGE_STAGES[1].id;
  }, [ageMonths]);
  const [expandedStage, setExpandedStage]   = useState<string | null>(defaultStage);
  const [selectedFood, setSelectedFood]     = useState<Superfood | null>(null);
  const [selectedAllergen, setSelectedAllergen] = useState<Allergen | null>(null);

  // Current age stage (for highlighting)
  const currentStage = useMemo(() =>
    AGE_STAGES.find(s => ageMonths >= s.ageMin && ageMonths <= s.ageMax) ?? AGE_STAGES[1],
    [ageMonths]
  );

  // Filter superfoods to age-appropriate + all (with locked indicator)
  const superfoodsForAge = useMemo(() =>
    PH_SUPERFOODS.filter(f => f.minAgeMonths <= ageMonths),
    [ageMonths]
  );
  const superfoodsLocked = useMemo(() =>
    PH_SUPERFOODS.filter(f => f.minAgeMonths > ageMonths),
    [ageMonths]
  );

  // Allergen warning check
  const hasAllergyFor = (allergenId: string) =>
    childAllergies.some(a => a.toLowerCase().includes(allergenId.toLowerCase()));

  const getName = (item: { nameEN: string; nameFIL: string; nameZH: string }) =>
    lang === 'zh' ? item.nameZH : lang === 'fil' ? item.nameFIL : item.nameEN;

  const tabs: { id: TopTab; icon: React.ReactNode; labelKey: string }[] = [
    { id: 'timeline',   icon: <Calendar size={18} />, labelKey: 'feeding_guide.tab_timeline' },
    { id: 'superfoods', icon: <Leaf size={18} />, labelKey: 'feeding_guide.tab_superfoods' },
    { id: 'allergens',  icon: <AlertTriangle size={18} />, labelKey: 'feeding_guide.tab_allergens' },
  ];

  // ── ATE AI SUMMARIES ──────────────────────────────────────────────────────
  const timelineSummary  = buildTimelineSummary(ageMonths, childName, lang);
  const superfoodSummary = buildSuperfoodsSummary(childName, ageMonths, lang);
  const allergenSummary  = buildAllergenSummary(childName, childAllergies, lang);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER SECTIONS
  // ─────────────────────────────────────────────────────────────────────────

  const renderTimeline = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ss.scrollContent}>

      {/* Ate AI Summary */}
      <AteAICard text={timelineSummary} />

      {/* Readiness Signs */}
      <View style={ss.section}>
        <Text style={ss.sectionTitle}>{t('feeding_guide.readiness_title')}</Text>
        <Text style={ss.sectionSub}>{t('feeding_guide.readiness_sub')}</Text>
        <View style={ss.readinessGrid}>
          {READINESS_SIGNS.map((s, i) => (
            <View key={i} style={ss.readinessChip}>
              <Text style={ss.readinessEmoji}>{s.emoji}</Text>
              <Text style={ss.readinessText}>
                {lang === 'zh' ? s.keyZH : lang === 'fil' ? s.keyFIL : s.keyEN}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Age Stage Timeline */}
      <View style={ss.section}>
        <Text style={ss.sectionTitle}>{t('feeding_guide.timeline_title')}</Text>
        {AGE_STAGES.map(stage => {
          const isCurrentStage = stage.id === currentStage.id;
          const isPast = stage.ageMax < ageMonths && stage.ageMax !== 99;
          const isExpanded = expandedStage === stage.id;
          const stageLabel = lang === 'zh' ? stage.labelZH : lang === 'fil' ? stage.labelFIL : stage.labelEN;
          const stageSummary = lang === 'zh' ? stage.summaryZH : lang === 'fil' ? stage.summaryFIL : stage.summaryEN;

          return (
            <TouchableOpacity
              key={stage.id}
              style={[ss.stageCard, isCurrentStage && ss.stageCardActive, isPast && ss.stageCardPast]}
              onPress={() => setExpandedStage(isExpanded ? null : stage.id)}
              activeOpacity={0.85}
            >
              <View style={ss.stageHeader}>
                <View style={[ss.stageDot, isCurrentStage && ss.stageDotActive, isPast && ss.stageDotPast]} />
                <View style={ss.stageLabelCol}>
                  <Text style={[ss.stageLabel, isCurrentStage && ss.stageLabelActive]}>{stageLabel}</Text>
                  {isCurrentStage && (
                    <View style={ss.currentBadge}>
                      <View style={ss.currentBadgeContent}><Sparkles size={12} color={Colors.gold} /><Text style={ss.currentBadgeText}> {t('feeding_guide.current_stage')}</Text></View>
                    </View>
                  )}
                </View>
                <Text style={ss.stageChevron}>{isExpanded ? '▲' : '▼'}</Text>
              </View>

              {isExpanded && (
                <View style={ss.stageBody}>
                  <Text style={ss.stageSummary}>{stageSummary}</Text>

                  <View style={ss.stageInfoRow}>
                    <View style={ss.stageInfoBox}>
                      <Text style={ss.stageInfoLabel}>{t('feeding_guide.texture')}</Text>
                      <Text style={ss.stageInfoValue}>
                        {lang === 'zh' ? stage.textureZH : lang === 'fil' ? stage.textureFIL : stage.textureEN}
                      </Text>
                    </View>
                    <View style={ss.stageInfoBox}>
                      <Text style={ss.stageInfoLabel}>{t('feeding_guide.portion')}</Text>
                      <Text style={ss.stageInfoValue}>
                        {lang === 'zh' ? stage.portionZH : lang === 'fil' ? stage.portionFIL : stage.portionEN}
                      </Text>
                    </View>
                  </View>

                  {stage.foods.length > 0 && (
                    <View style={ss.stageFoodRow}>
                      {stage.foods.slice(0, 6).map(fid => {
                        const food = PH_SUPERFOODS.find(f => f.id === fid);
                        if (!food) return null;
                        const hasWarning = food.allergenKeys.some(k => hasAllergyFor(k));
                        return (
                          <View key={fid} style={[ss.stageFoodChip, hasWarning && ss.stageFoodChipWarn]}>
                            <Text style={ss.stageFoodEmoji}>{food.emoji}</Text>
                            <Text style={ss.stageFoodName}>{getName(food)}</Text>
                            {hasWarning && <AlertTriangle size={14} color={Colors.gold} style={ss.stageFoodWarnIcon} />}
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {stage.id === 'stage_0_6' && (
                    <View style={ss.breastfeedBanner}>
                      <Text style={ss.breastfeedText}>🤱 {t('feeding_guide.exclusive_bf')}</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Foods to Avoid */}
      <View style={ss.section}>
        <View style={ss.sectionTitleRow}><Ban size={16} color={Colors.dark} /><Text style={ss.sectionTitle}> {t('feeding_guide.avoid_title')}</Text></View>
        <Text style={ss.sectionSub}>{t('feeding_guide.avoid_sub')}</Text>
        {FOODS_TO_AVOID.map((f, i) => (
          <View key={i} style={ss.avoidRow}>
            <Text style={ss.avoidEmoji}>{f.emoji}</Text>
            <View style={ss.avoidTextCol}>
              <Text style={ss.avoidName}>{getName(f)}</Text>
              <Text style={ss.avoidReason}>{t(f.reasonKey)}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={ss.sourceBox}>
        <View style={ss.sourceRow}><BookOpen size={12} color={Colors.midGray} /><Text style={ss.sourceText}> {t('feeding_guide.source')}</Text></View>
      </View>
    </ScrollView>
  );

  const renderSuperfoods = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ss.scrollContent}>

      <AteAICard text={superfoodSummary} />

      {/* Available Now */}
      <View style={ss.section}>
        <View style={ss.sectionTitleRow}><CircleCheck size={16} color={Colors.mint} /><Text style={ss.sectionTitle}> {t('feeding_guide.available_now', { name: childName })}</Text></View>
        {superfoodsForAge.map(food => {
          const hasWarning = food.allergenKeys.some(k => hasAllergyFor(k));
          const benefits = lang === 'zh' ? food.benefitsZH : lang === 'fil' ? food.benefitsFIL : food.benefitsEN;
          return (
            <TouchableOpacity
              key={food.id}
              style={[ss.superfoodCard, hasWarning && ss.superfoodCardWarn]}
              onPress={() => setSelectedFood(food)}
              activeOpacity={0.9}
            >
              <LinearGradient colors={food.gradient} style={ss.superfoodGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={ss.superfoodEmoji}>{food.emoji}</Text>
              </LinearGradient>
              <View style={ss.superfoodBody}>
                <View style={ss.superfoodHeaderRow}>
                  <View>
                    <Text style={ss.superfoodName}>{getName(food)}</Text>
                    <Text style={ss.superfoodTagline} numberOfLines={1}>
                      {lang === 'zh' ? food.taglineZH : lang === 'fil' ? food.taglineFIL : food.taglineEN}
                    </Text>
                  </View>
                  {hasWarning && (
                    <View style={ss.warnBadge}>
                      <View style={ss.warnBadgeContent}><AlertTriangle size={12} color={Colors.gold} /><Text style={ss.warnBadgeText}> {t('feeding_guide.allergy_warning')}</Text></View>
                    </View>
                  )}
                </View>
                <View style={ss.nutrientRow}>
                  {food.nutrients.slice(0, 3).map((n, i) => (
                    <View key={i} style={[ss.nutrientChip, { backgroundColor: food.bgColor }]}>
                      <Text style={[ss.nutrientText, { color: food.gradient[0] }]}>{n}</Text>
                    </View>
                  ))}
                </View>
                <Text style={ss.superfoodBenefit} numberOfLines={2}>{benefits[0]}</Text>
                <Text style={ss.tapHint}>{t('feeding_guide.tap_prep_tips')} →</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Coming Soon */}
      {superfoodsLocked.length > 0 && (
        <View style={ss.section}>
          <View style={ss.sectionTitleRow}><Lock size={16} color={Colors.midGray} /><Text style={ss.sectionTitle}> {t('feeding_guide.coming_soon')}</Text></View>
          <View style={ss.lockedGrid}>
            {superfoodsLocked.map(food => (
              <View key={food.id} style={ss.lockedChip}>
                <Text style={ss.lockedEmoji}>{food.emoji}</Text>
                <Text style={ss.lockedName}>{getName(food)}</Text>
                <Text style={ss.lockedAge}>{food.minAgeMonths}M+</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={ss.sourceBox}>
        <View style={ss.sourceRow}><BookOpen size={12} color={Colors.midGray} /><Text style={ss.sourceText}> {t('feeding_guide.source')}</Text></View>
      </View>
    </ScrollView>
  );

  const renderAllergens = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ss.scrollContent}>

      <AteAICard text={allergenSummary} color="#E8F2FF" borderColor="#1A73C8" />

      {/* Allergy Profile Warning */}
      {childAllergies.length > 0 && (
        <View style={ss.allergyProfileCard}>
          <Text style={ss.allergyProfileTitle}>
            <Hospital size={14} color={Colors.primaryPink} /> {t('feeding_guide.allergy_profile', { name: childName })}
          </Text>
          <View style={ss.allergyChipRow}>
            {childAllergies.map((a, i) => (
              <View key={i} style={ss.allergyChip}>
                <Text style={ss.allergyChipText}>{a}</Text>
              </View>
            ))}
          </View>
          <Text style={ss.allergyProfileNote}>{t('feeding_guide.allergy_consult')}</Text>
        </View>
      )}

      {/* Introduction Guide */}
      <View style={ss.section}>
        <Text style={ss.sectionTitle}>{t('feeding_guide.allergen_intro_title')}</Text>
        <Text style={ss.sectionSub}>{t('feeding_guide.allergen_intro_sub')}</Text>
        {ALLERGENS.map(allergen => {
          const isKnownAllergy = hasAllergyFor(allergen.id);
          const evidence = lang === 'zh' ? allergen.evidenceZH : lang === 'fil' ? allergen.evidenceFIL : allergen.evidenceEN;
          const caution  = lang === 'zh' ? allergen.cautionZH  : lang === 'fil' ? allergen.cautionFIL  : allergen.cautionEN;
          const dotColor = allergen.warningColor === 'green' ? Colors.mint : allergen.warningColor === 'yellow' ? Colors.gold : Colors.primaryPink;
          const bgColor  = allergen.warningColor === 'green' ? Colors.softMint : allergen.warningColor === 'yellow' ? Colors.softGold : Colors.softPink;

          return (
            <TouchableOpacity
              key={allergen.id}
              style={[ss.allergenCard, isKnownAllergy && ss.allergenCardAlert, { borderLeftColor: dotColor }]}
              onPress={() => setSelectedAllergen(allergen)}
              activeOpacity={0.88}
            >
              <View style={ss.allergenTop}>
                <View style={[ss.allergenEmojiBox, { backgroundColor: bgColor }]}>
                  <Text style={ss.allergenEmoji}>{allergen.emoji}</Text>
                </View>
                <View style={ss.allergenInfo}>
                  <View style={ss.allergenNameRow}>
                    <Text style={ss.allergenName}>{getName(allergen)}</Text>
                    <View style={[ss.allergenAgeBadge, { backgroundColor: dotColor }]}>
                      <Text style={ss.allergenAgeBadgeText}>{allergen.introAgeMonths}M+</Text>
                    </View>
                    {isKnownAllergy && (
                      <View style={ss.knownAllergyBadge}>
                        <View style={ss.knownAllergyContent}><AlertTriangle size={11} color={Colors.primaryPink} /><Text style={ss.knownAllergyText}> {t('feeding_guide.known_allergy')}</Text></View>
                      </View>
                    )}
                  </View>
                  <Text style={ss.allergenEvidence} numberOfLines={2}>{evidence}</Text>
                </View>
              </View>
              {isKnownAllergy && (
                <View style={ss.allergenWarnBox}>
                  <Text style={ss.allergenWarnText}>
                    <Hospital size={12} color={Colors.primaryPink} /> {t('feeding_guide.consult_pedia_allergy')}
                  </Text>
                </View>
              )}
              <Text style={ss.tapHint}>{t('feeding_guide.tap_details')} →</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Emergency Signs */}
      <View style={ss.emergencyCard}>
        <View style={ss.sectionTitleRow}><AlertTriangle size={16} color={Colors.primaryPink} /><Text style={ss.emergencyTitle}> {t('feeding_guide.emergency_title')}</Text></View>
        {['feeding_guide.emergency_1', 'feeding_guide.emergency_2', 'feeding_guide.emergency_3', 'feeding_guide.emergency_4'].map(k => (
          <Text key={k} style={ss.emergencyItem}>• {t(k)}</Text>
        ))}
        <Text style={ss.emergencyAction}>{t('feeding_guide.emergency_action')}</Text>
      </View>

      <View style={ss.sourceBox}>
        <View style={ss.sourceRow}><BookOpen size={12} color={Colors.midGray} /><Text style={ss.sourceText}> {t('feeding_guide.source_allergen')}</Text></View>
      </View>
    </ScrollView>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // MODALS
  // ─────────────────────────────────────────────────────────────────────────

  const SuperfoodModal = () => {
    if (!selectedFood) return null;
    const hasWarn = selectedFood.allergenKeys.some(k => hasAllergyFor(k));
    const prepTips = lang === 'zh' ? selectedFood.prepTipsZH : lang === 'fil' ? selectedFood.prepTipsFIL : selectedFood.prepTipsEN;
    const benefits = lang === 'zh' ? selectedFood.benefitsZH : lang === 'fil' ? selectedFood.benefitsFIL : selectedFood.benefitsEN;
    return (
      <Modal visible transparent animationType="slide" onRequestClose={() => setSelectedFood(null)}>
        <View style={ss.modalOverlay}>
          <View style={ss.modalSheet}>
            <LinearGradient colors={selectedFood.gradient} style={ss.modalHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={ss.modalHeroEmoji}>{selectedFood.emoji}</Text>
              <Text style={ss.modalHeroName}>{getName(selectedFood)}</Text>
              <Text style={ss.modalHeroTagline}>
                {lang === 'zh' ? selectedFood.taglineZH : lang === 'fil' ? selectedFood.taglineFIL : selectedFood.taglineEN}
              </Text>
            </LinearGradient>

            <ScrollView style={ss.modalBody} showsVerticalScrollIndicator={false}>
              {hasWarn && (
                <View style={ss.modalWarnBanner}>
                  <View style={ss.modalWarnContent}><AlertTriangle size={14} color={Colors.gold} /><Text style={ss.modalWarnText}> {t('feeding_guide.allergy_warning_detail', { name: childName })}</Text></View>
                </View>
              )}

              <View style={ss.modalSectionTitleRow}><Sparkles size={14} color={Colors.gold} /><Text style={ss.modalSectionTitle}> {t('feeding_guide.key_benefits')}</Text></View>
              {benefits.map((b, i) => (
                <View key={i} style={ss.bulletRow}>
                  <View style={[ss.bullet, { backgroundColor: selectedFood.gradient[0] }]} />
                  <Text style={ss.bulletText}>{b}</Text>
                </View>
              ))}

              <View style={[ss.modalSectionTitleRow, { marginTop: 20 }]}><ChefHat size={14} color={Colors.dark} /><Text style={ss.modalSectionTitle}> {t('feeding_guide.prep_tips')}</Text></View>
              {prepTips.map((tip, i) => (
                <View key={i} style={ss.prepRow}>
                  <View style={[ss.prepNum, { backgroundColor: selectedFood.bgColor }]}>
                    <Text style={[ss.prepNumText, { color: selectedFood.gradient[0] }]}>{i + 1}</Text>
                  </View>
                  <Text style={ss.prepText}>{tip}</Text>
                </View>
              ))}

              <View style={ss.nutrientFullRow}>
                {selectedFood.nutrients.map((n, i) => (
                  <View key={i} style={[ss.nutrientFullChip, { backgroundColor: selectedFood.bgColor }]}>
                    <Text style={[ss.nutrientFullText, { color: selectedFood.gradient[0] }]}>✓ {n}</Text>
                  </View>
                ))}
              </View>

              <View style={ss.ageTagRow}><Baby size={13} color={Colors.midGray} /><Text style={ss.ageTag}> {t('feeding_guide.suitable_from', { age: selectedFood.minAgeMonths })}</Text></View>
              <View style={ss.aiDisclaimerBox}>
                <Text style={ss.aiDisclaimer}>{t('feeding_guide.disclaimer')}</Text>
              </View>
            </ScrollView>

            <TouchableOpacity style={ss.modalClose} onPress={() => setSelectedFood(null)}>
              <Text style={ss.modalCloseText}>{t('feeding_guide.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const AllergenModal = () => {
    if (!selectedAllergen) return null;
    const isKnown = hasAllergyFor(selectedAllergen.id);
    const evidence = lang === 'zh' ? selectedAllergen.evidenceZH : lang === 'fil' ? selectedAllergen.evidenceFIL : selectedAllergen.evidenceEN;
    const caution  = lang === 'zh' ? selectedAllergen.cautionZH  : lang === 'fil' ? selectedAllergen.cautionFIL  : selectedAllergen.cautionEN;
    const dotColor = selectedAllergen.warningColor === 'green' ? Colors.mint : selectedAllergen.warningColor === 'yellow' ? Colors.gold : Colors.primaryPink;
    const bgColor  = selectedAllergen.warningColor === 'green' ? Colors.softMint : selectedAllergen.warningColor === 'yellow' ? Colors.softGold : Colors.softPink;
    return (
      <Modal visible transparent animationType="slide" onRequestClose={() => setSelectedAllergen(null)}>
        <View style={ss.modalOverlay}>
          <View style={ss.modalSheet}>
            <View style={[ss.allergenModalHero, { backgroundColor: bgColor }]}>
              <Text style={ss.modalHeroEmoji}>{selectedAllergen.emoji}</Text>
              <Text style={[ss.modalHeroName, { color: dotColor }]}>{getName(selectedAllergen)}</Text>
              <View style={[ss.allergenAgeBadge, { backgroundColor: dotColor, alignSelf: 'center', marginTop: 8 }]}>
                <Text style={ss.allergenAgeBadgeText}>{t('feeding_guide.intro_from', { age: selectedAllergen.introAgeMonths })}</Text>
              </View>
            </View>

            <ScrollView style={ss.modalBody} showsVerticalScrollIndicator={false}>
              {isKnown && (
                <View style={ss.modalWarnBanner}>
                  <View style={ss.modalWarnContent}><AlertTriangle size={14} color={Colors.gold} /><Text style={ss.modalWarnText}> {t('feeding_guide.known_allergy_warning', { name: childName })}</Text></View>
                </View>
              )}

              <View style={ss.modalSectionTitleRow}><Microscope size={14} color={Colors.dark} /><Text style={ss.modalSectionTitle}> {t('feeding_guide.evidence')}</Text></View>
              <Text style={ss.evidenceText}>{evidence}</Text>

              <View style={[ss.modalSectionTitleRow, { marginTop: 16 }]}><Zap size={14} color={Colors.gold} /><Text style={ss.modalSectionTitle}> {t('feeding_guide.caution')}</Text></View>
              <Text style={ss.cautionText}>{caution}</Text>

              <View style={[ss.modalSectionTitleRow, { marginTop: 16 }]}><Flag size={14} color={Colors.dark} /><Text style={ss.modalSectionTitle}> {t('feeding_guide.common_ph_foods')}</Text></View>
              <View style={ss.phFoodRow}>
                {selectedAllergen.commonPHFoods.map((f, i) => (
                  <View key={i} style={[ss.phFoodChip, { borderColor: dotColor }]}>
                    <Text style={[ss.phFoodText, { color: dotColor }]}>{f}</Text>
                  </View>
                ))}
              </View>

              <View style={ss.aiDisclaimerBox}>
                <Text style={ss.aiDisclaimer}>{t('feeding_guide.disclaimer')}</Text>
              </View>
            </ScrollView>

            <TouchableOpacity style={ss.modalClose} onPress={() => setSelectedAllergen(null)}>
              <Text style={ss.modalCloseText}>{t('feeding_guide.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={ss.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <LinearGradient colors={['#FF8A65', '#FFB74D']} style={ss.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <TouchableOpacity onPress={() => router.back()} style={ss.backBtn}>
          <Text style={ss.backBtnText}>← {t('feeding_guide.back')}</Text>
        </TouchableOpacity>
        <View style={ss.headerCenter}>
          <UtensilsCrossed size={40} color="#fff" />
          <Text style={ss.headerTitle}>{t('feeding_guide.screen_title')}</Text>
          <Text style={ss.headerSub}>{t('feeding_guide.screen_sub')}</Text>
        </View>
        {activeChild && (
          <View style={ss.agePill}>
            <View style={ss.agePillContent}><Baby size={13} color="#fff" /><Text style={ss.agePillText}> {childName} · {ageMonths}M</Text></View>
          </View>
        )}
      </LinearGradient>

      {/* Top Tab Switcher */}
      <View style={ss.tabBar}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[ss.tabBtn, activeTab === tab.id && ss.tabBtnActive]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.8}
          >
            <View style={ss.tabEmoji}>{tab.icon}</View>
            <Text style={[ss.tabLabel, activeTab === tab.id && ss.tabLabelActive]}>
              {t(tab.labelKey)}
            </Text>
            {activeTab === tab.id && <View style={ss.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'timeline'   && renderTimeline()}
      {activeTab === 'superfoods' && renderSuperfoods()}
      {activeTab === 'allergens'  && renderAllergens()}

      {/* Modals */}
      <SuperfoodModal />
      <AllergenModal />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ATE AI CARD
// ─────────────────────────────────────────────────────────────────────────────

function AteAICard({
  text, color = Colors.softGold, borderColor = Colors.gold,
}: { text: string; color?: string; borderColor?: string }) {
  const { t } = useTranslation();
  return (
    <View style={[ss.ateAiCard, { backgroundColor: color, borderColor }]}>
      <View style={ss.ateAiLabelRow}><Sparkles size={11} color={borderColor} /><Text style={[ss.ateAiLabel, { color: borderColor }]}> ATE AI SAYS</Text></View>
      <Text style={ss.ateAiText}>{text}</Text>
      <Text style={ss.ateAiDisclaimer}>{t('feeding_guide.disclaimer')}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const ss = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  // Header
  header:       { paddingTop: 12, paddingBottom: 20, paddingHorizontal: 20 },
  backBtn:      { marginBottom: 10 },
  backBtnText:  { color: Colors.white, fontWeight: '700', fontSize: 14 },
  headerCenter: { alignItems: 'center' },
  headerEmoji:  { fontSize: 40, marginBottom: 4 },
  headerTitle:  { fontSize: 22, fontWeight: '900', color: Colors.white, textAlign: 'center' },
  headerSub:    { fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 2 },
  agePill: {
    alignSelf: 'center', marginTop: 10, backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5,
  },
  agePillText:  { color: Colors.white, fontWeight: '700', fontSize: 13 },

  // Tab bar
  tabBar: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  tabBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative',
  },
  tabBtnActive: {},
  tabEmoji:     { marginBottom: 2, alignItems: 'center' },
  tabLabel:     { fontSize: 11, color: Colors.midGray, fontWeight: '600' },
  tabLabelActive: { color: Colors.primaryPink, fontWeight: '800' },
  tabUnderline: {
    position: 'absolute', bottom: 0, left: '15%', right: '15%',
    height: 2, backgroundColor: Colors.primaryPink, borderRadius: 2,
  },

  // Scroll
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },

  // Ate AI Card
  ateAiCard: {
    borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1.5,
  },
  ateAiLabel:      { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  ateAiText:       { fontSize: 14, color: Colors.dark, lineHeight: 21, fontWeight: '500' },
  ateAiDisclaimer: { fontSize: 11, color: '#9E9EB8', marginTop: 8, fontStyle: 'italic' },

  // Section
  section:      { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.dark, marginBottom: 4 },
  sectionSub:   { fontSize: 12, color: Colors.midGray, marginBottom: 12 },

  // Readiness
  readinessGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  readinessChip: {
    backgroundColor: Colors.softMint, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
    alignItems: 'center', flexDirection: 'row', gap: 6,
  },
  readinessEmoji: { fontSize: 18 },
  readinessText:  { fontSize: 12, color: Colors.mint, fontWeight: '600' },

  // Stage Timeline
  stageCard: {
    backgroundColor: Colors.surface, borderRadius: 20, marginBottom: 10,
    padding: 16, elevation: 4,
    shadowColor: Colors.shadowColor, shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
    borderLeftWidth: 4, borderLeftColor: '#E0E0E0',
  },
  stageCardActive:  { borderLeftColor: Colors.primaryPink, backgroundColor: '#FFF5F8' },
  stageCardPast:    { borderLeftColor: Colors.mint, opacity: 0.85 },
  stageHeader:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stageDot:         { width: 12, height: 12, borderRadius: 6, backgroundColor: '#E0E0E0' },
  stageDotActive:   { backgroundColor: Colors.primaryPink },
  stageDotPast:     { backgroundColor: Colors.mint },
  stageLabelCol:    { flex: 1 },
  stageLabel:       { fontSize: 15, fontWeight: '700', color: Colors.midGray },
  stageLabelActive: { color: Colors.primaryPink },
  currentBadge: {
    alignSelf: 'flex-start', backgroundColor: Colors.softPink, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 2, marginTop: 4,
  },
  currentBadgeText: { fontSize: 11, color: Colors.primaryPink, fontWeight: '800' },
  stageChevron:     { color: '#B8B8CC', fontSize: 12 },
  stageBody:        { marginTop: 14 },
  stageSummary:     { fontSize: 13, color: Colors.midGray, lineHeight: 20, marginBottom: 12 },
  stageInfoRow:     { flexDirection: 'row', gap: 10, marginBottom: 12 },
  stageInfoBox: {
    flex: 1, backgroundColor: '#F8F8FC', borderRadius: 10, padding: 10,
  },
  stageInfoLabel: { fontSize: 10, color: '#9E9EB8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 3 },
  stageInfoValue: { fontSize: 12, color: Colors.dark, fontWeight: '600' },
  stageFoodRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  stageFoodChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5FA',
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, gap: 3,
  },
  stageFoodChipWarn: { backgroundColor: Colors.softPink },
  stageFoodEmoji:    { fontSize: 14 },
  stageFoodName:     { fontSize: 11, color: Colors.midGray, fontWeight: '600' },
  stageFoodWarnIcon: { marginLeft: 2 },
  breastfeedBanner: {
    backgroundColor: Colors.softPink, borderRadius: 10, padding: 10, marginTop: 8,
  },
  breastfeedText: { fontSize: 13, color: Colors.primaryPink, fontWeight: '700', textAlign: 'center' },

  // Avoid
  avoidRow:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 12 },
  avoidEmoji:    { fontSize: 24 },
  avoidTextCol:  { flex: 1 },
  avoidName:     { fontSize: 14, fontWeight: '700', color: Colors.dark },
  avoidReason:   { fontSize: 12, color: Colors.midGray, lineHeight: 18 },

  // Superfood cards
  superfoodCard: {
    backgroundColor: Colors.surface, borderRadius: 20, marginBottom: 12,
    flexDirection: 'row', overflow: 'hidden',
    elevation: 4, shadowColor: Colors.shadowColor, shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
  },
  superfoodCardWarn: { borderWidth: 1.5, borderColor: '#FFB74D' },
  superfoodGradient: { width: 80, alignItems: 'center', justifyContent: 'center' },
  superfoodEmoji:    { fontSize: 36 },
  superfoodBody:     { flex: 1, padding: 12 },
  superfoodHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  superfoodName:     { fontSize: 16, fontWeight: '800', color: Colors.dark },
  superfoodTagline:  { fontSize: 11, color: Colors.midGray, marginTop: 1 },
  nutrientRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 6 },
  nutrientChip:      { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  nutrientText:      { fontSize: 10, fontWeight: '700' },
  superfoodBenefit:  { fontSize: 12, color: Colors.midGray, lineHeight: 17, marginBottom: 4 },
  warnBadge: {
    backgroundColor: Colors.softGold, borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  warnBadgeText:  { fontSize: 10, color: Colors.gold, fontWeight: '700' },
  tapHint:        { fontSize: 11, color: '#B8B8CC', fontStyle: 'italic' },

  // Locked superfoods
  lockedGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  lockedChip: {
    backgroundColor: '#F5F5FA', borderRadius: 12, padding: 12,
    alignItems: 'center', width: (W - 52) / 3,
  },
  lockedEmoji: { fontSize: 28, opacity: 0.5 },
  lockedName:  { fontSize: 11, color: '#9E9EB8', fontWeight: '600', marginTop: 4, textAlign: 'center' },
  lockedAge:   { fontSize: 10, color: '#B8B8CC', marginTop: 2 },

  // Allergen profile card
  allergyProfileCard: {
    backgroundColor: Colors.softPink, borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1.5, borderColor: Colors.primaryPink,
  },
  allergyProfileTitle: { fontSize: 14, fontWeight: '800', color: Colors.primaryPink, marginBottom: 8 },
  allergyChipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  allergyChip: {
    backgroundColor: Colors.primaryPink, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
  },
  allergyChipText:   { fontSize: 12, color: Colors.white, fontWeight: '700' },
  allergyProfileNote: { fontSize: 12, color: '#C62A47' },

  // Allergen cards
  allergenCard: {
    backgroundColor: Colors.white, borderRadius: 14, marginBottom: 10, padding: 14,
    borderLeftWidth: 4, borderLeftColor: Colors.mint,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 1 },
  },
  allergenCardAlert: { backgroundColor: '#FFF5F8' },
  allergenTop:       { flexDirection: 'row', gap: 12, marginBottom: 8 },
  allergenEmojiBox:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  allergenEmoji:     { fontSize: 24 },
  allergenInfo:      { flex: 1 },
  allergenNameRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 },
  allergenName:      { fontSize: 15, fontWeight: '800', color: Colors.dark },
  allergenAgeBadge: {
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
  },
  allergenAgeBadgeText: { fontSize: 10, color: Colors.white, fontWeight: '700' },
  knownAllergyBadge: {
    backgroundColor: Colors.softPink, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
  },
  knownAllergyText:  { fontSize: 10, color: Colors.primaryPink, fontWeight: '700' },
  allergenEvidence:  { fontSize: 12, color: Colors.midGray, lineHeight: 17 },
  allergenWarnBox: {
    backgroundColor: Colors.softPink, borderRadius: 8, padding: 8, marginBottom: 6,
  },
  allergenWarnText:  { fontSize: 12, color: '#C62A47', fontWeight: '600' },

  // Emergency
  emergencyCard: {
    backgroundColor: Colors.softPink, borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1.5, borderColor: Colors.primaryPink,
  },
  emergencyTitle:  { fontSize: 15, fontWeight: '900', color: Colors.primaryPink, marginBottom: 10 },
  emergencyItem:   { fontSize: 13, color: '#C62A47', lineHeight: 22, fontWeight: '600' },
  emergencyAction: { marginTop: 8, fontSize: 12, color: Colors.primaryPink, fontWeight: '700' },

  // Source box
  sourceBox: {
    backgroundColor: Colors.softBlue, borderRadius: 10, padding: 10, marginTop: 8,
  },
  sourceText: { fontSize: 11, color: Colors.blue, textAlign: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '88%',
  },
  modalHero: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, alignItems: 'center',
  },
  allergenModalHero: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, alignItems: 'center',
  },
  modalHeroEmoji:   { fontSize: 56, marginBottom: 8 },
  modalHeroName:    { fontSize: 22, fontWeight: '900', color: Colors.white, marginBottom: 4 },
  modalHeroTagline: { fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  modalBody:        { padding: 20 },
  modalSectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.dark, marginBottom: 10 },
  bulletRow:        { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  bullet:           { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  bulletText:       { flex: 1, fontSize: 13, color: Colors.midGray, lineHeight: 20 },
  prepRow:          { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  prepNum:          { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  prepNumText:      { fontSize: 12, fontWeight: '800' },
  prepText:         { flex: 1, fontSize: 13, color: Colors.midGray, lineHeight: 20 },
  nutrientFullRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 16 },
  nutrientFullChip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  nutrientFullText: { fontSize: 12, fontWeight: '700' },
  ageTag:           { fontSize: 13, color: Colors.midGray, textAlign: 'center' },
  modalWarnBanner: {
    backgroundColor: Colors.softPink, borderRadius: 10, padding: 10, marginBottom: 14,
    borderWidth: 1, borderColor: Colors.gold,
  },
  modalWarnText:  { fontSize: 13, color: '#C62A47', fontWeight: '600' },
  evidenceText:   { fontSize: 13, color: Colors.midGray, lineHeight: 20 },
  cautionText:    { fontSize: 13, color: Colors.midGray, lineHeight: 20 },
  phFoodRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  phFoodChip:     { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  phFoodText:     { fontSize: 12, fontWeight: '600' },
  aiDisclaimerBox: {
    backgroundColor: '#F8F8FC', borderRadius: 10, padding: 10, marginTop: 16, marginBottom: 8,
  },
  aiDisclaimer:   { fontSize: 11, color: '#9E9EB8', textAlign: 'center', fontStyle: 'italic' },
  modalClose: {
    backgroundColor: Colors.primaryPink, margin: 16, borderRadius: 14, padding: 14, alignItems: 'center',
  },
  modalCloseText: { color: Colors.white, fontWeight: '800', fontSize: 15 },

  // Icon + text row helpers
  sectionTitleRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  sourceRow:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  currentBadgeContent:  { flexDirection: 'row', alignItems: 'center' },
  warnBadgeContent:     { flexDirection: 'row', alignItems: 'center' },
  knownAllergyContent:  { flexDirection: 'row', alignItems: 'center' },
  modalWarnContent:     { flexDirection: 'row', alignItems: 'center' },
  modalSectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  ateAiLabelRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  agePillContent:       { flexDirection: 'row', alignItems: 'center' },
  ageTagRow:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
});
