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
  if (ageMonths < 6) {
    const msgs: Record<string, string> = {
      en: `🤱 ${childName} is ${ageMonths}mo — still in the exclusive breastfeeding stage. Breast milk is all Baby needs right now. Start solids at 6 months or when readiness signs appear. You're doing great, Nanay! 💕`,
      fil: `🤱 Si ${childName} ay ${ageMonths} buwan pa — nasa eksklusibong pagpapasuso pa. Ang gatas ng ina ay lahat ng kailangan ni Baby ngayon. Magsimula ng solids sa 6 buwan o kapag lumabas ang readiness signs. Magaling ka, Nanay! 💕`,
      zh: `🤱 ${childName}现在${ageMonths}个月——还处于纯母乳喂养阶段。母乳就是宝宝现在所需的一切。在6个月或出现准备迹象时开始辅食。妈妈加油！💕`,
    };
    return msgs[lang] || msgs.en;
  }
  if (ageMonths < 8) {
    const msgs: Record<string, string> = {
      en: `🥣 ${childName} is ready for first foods! Start with smooth purees like lugaw, kamote, and kalabasa — 2–3 teaspoons at first. Continue breastfeeding alongside solids. One new food every 3–5 days. 🌟`,
      fil: `🥣 Handa na si ${childName} para sa unang pagkain! Magsimula sa malambot na puree tulad ng lugaw, kamote, at kalabasa — 2–3 kutsarita muna. Ipagpatuloy ang pagpapasuso kasabay ng solids. Isang bagong pagkain bawat 3–5 araw. 🌟`,
      zh: `🥣 ${childName}已经准备好吃第一口辅食了！从顺滑泥糊开始，如稀饭、红薯和南瓜——先从2–3茶匙开始。继续母乳喂养同时添加辅食。每3–5天引入一种新食物。🌟`,
    };
    return msgs[lang] || msgs.en;
  }
  if (ageMonths < 10) {
    const msgs: Record<string, string> = {
      en: `🍽️ ${childName} is ready for more variety! Introduce mashed textures, proteins (fish, chicken, egg yolk), and 3–4 meals a day. This is the best time to introduce PH superfoods for iron and DHA. 💪`,
      fil: `🍽️ Handa na si ${childName} para sa mas maraming pagkain! Mag-uvain ng mashed texture, protina (isda, manok, pula ng itlog), at 3–4 kain sa isang araw. Ito ang pinakamabuting oras para mag-uvain ng PH superfoods para sa iron at DHA. 💪`,
      zh: `🍽️ ${childName}已经准备好更多变化了！引入捣碎质地、蛋白质（鱼、鸡肉、蛋黄）和每天3–4餐。这是引入菲律宾超级食物补充铁和DHA的最佳时机。💪`,
    };
    return msgs[lang] || msgs.en;
  }
  if (ageMonths < 12) {
    const msgs: Record<string, string> = {
      en: `👣 ${childName} is almost 1 year old! Soft finger foods and small pieces of family meals are great now. 3–4 meals + 1–2 snacks per day. Almost ready for the family table! 🎉`,
      fil: `👣 Malapit nang mag-1 taon si ${childName}! Malambot na finger foods at maliliit na piraso ng pagkain ng pamilya ay maganda ngayon. 3–4 kain + 1–2 meryenda sa isang araw. Halos handa na para sa hapag ng pamilya! 🎉`,
      zh: `👣 ${childName}快满1岁了！现在软手指食物和家庭餐的小块非常适合。每天3–4餐 + 1–2次零食。几乎准备好上家庭餐桌了！🎉`,
    };
    return msgs[lang] || msgs.en;
  }
  const msgs: Record<string, string> = {
    en: `🌟 ${childName} is on full family foods! Low salt, no honey, varied textures. Continue breastfeeding up to 2+ years. Encourage self-feeding — it builds independence and fine motor skills! 🥄`,
    fil: `🌟 Si ${childName} ay kumakain na ng pagkain ng pamilya! Mababang asin, walang pulot, iba't ibang texture. Ipagpatuloy ang pagpapasuso hanggang 2+ taon. Hikayating kumain nang mag-isa — nagtatayo ito ng kalayaan at fine motor skills! 🥄`,
    zh: `🌟 ${childName}现在吃家庭食物了！低盐、无蜂蜜、多样化质地。继续母乳喂养至2岁以上。鼓励自主进食——这培养独立性和精细运动技能！🥄`,
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
  const [expandedStage, setExpandedStage]   = useState<string | null>('stage_6_8');
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

  const tabs: { id: TopTab; emoji: string; labelKey: string }[] = [
    { id: 'timeline',   emoji: '📅', labelKey: 'feeding_guide.tab_timeline' },
    { id: 'superfoods', emoji: '🌿', labelKey: 'feeding_guide.tab_superfoods' },
    { id: 'allergens',  emoji: '⚠️',  labelKey: 'feeding_guide.tab_allergens' },
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
                      <Text style={ss.currentBadgeText}>✨ {t('feeding_guide.current_stage')}</Text>
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
                            {hasWarning && <Text style={ss.stageFoodWarnIcon}>⚠️</Text>}
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
        <Text style={ss.sectionTitle}>🚫 {t('feeding_guide.avoid_title')}</Text>
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
        <Text style={ss.sourceText}>📚 {t('feeding_guide.source')}</Text>
      </View>
    </ScrollView>
  );

  const renderSuperfoods = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ss.scrollContent}>

      <AteAICard text={superfoodSummary} />

      {/* Available Now */}
      <View style={ss.section}>
        <Text style={ss.sectionTitle}>✅ {t('feeding_guide.available_now', { name: childName })}</Text>
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
                      <Text style={ss.warnBadgeText}>⚠️ {t('feeding_guide.allergy_warning')}</Text>
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
          <Text style={ss.sectionTitle}>🔒 {t('feeding_guide.coming_soon')}</Text>
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
        <Text style={ss.sourceText}>📚 {t('feeding_guide.source')}</Text>
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
            🏥 {t('feeding_guide.allergy_profile', { name: childName })}
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
                        <Text style={ss.knownAllergyText}>⚠️ {t('feeding_guide.known_allergy')}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={ss.allergenEvidence} numberOfLines={2}>{evidence}</Text>
                </View>
              </View>
              {isKnownAllergy && (
                <View style={ss.allergenWarnBox}>
                  <Text style={ss.allergenWarnText}>
                    🏥 {t('feeding_guide.consult_pedia_allergy')}
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
        <Text style={ss.emergencyTitle}>🚨 {t('feeding_guide.emergency_title')}</Text>
        {['feeding_guide.emergency_1', 'feeding_guide.emergency_2', 'feeding_guide.emergency_3', 'feeding_guide.emergency_4'].map(k => (
          <Text key={k} style={ss.emergencyItem}>• {t(k)}</Text>
        ))}
        <Text style={ss.emergencyAction}>{t('feeding_guide.emergency_action')}</Text>
      </View>

      <View style={ss.sourceBox}>
        <Text style={ss.sourceText}>📚 {t('feeding_guide.source_allergen')}</Text>
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
                  <Text style={ss.modalWarnText}>⚠️ {t('feeding_guide.allergy_warning_detail', { name: childName })}</Text>
                </View>
              )}

              <Text style={ss.modalSectionTitle}>✨ {t('feeding_guide.key_benefits')}</Text>
              {benefits.map((b, i) => (
                <View key={i} style={ss.bulletRow}>
                  <View style={[ss.bullet, { backgroundColor: selectedFood.gradient[0] }]} />
                  <Text style={ss.bulletText}>{b}</Text>
                </View>
              ))}

              <Text style={[ss.modalSectionTitle, { marginTop: 20 }]}>👩‍🍳 {t('feeding_guide.prep_tips')}</Text>
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

              <Text style={ss.ageTag}>👶 {t('feeding_guide.suitable_from', { age: selectedFood.minAgeMonths })}</Text>
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
                  <Text style={ss.modalWarnText}>⚠️ {t('feeding_guide.known_allergy_warning', { name: childName })}</Text>
                </View>
              )}

              <Text style={ss.modalSectionTitle}>🔬 {t('feeding_guide.evidence')}</Text>
              <Text style={ss.evidenceText}>{evidence}</Text>

              <Text style={[ss.modalSectionTitle, { marginTop: 16 }]}>⚡ {t('feeding_guide.caution')}</Text>
              <Text style={ss.cautionText}>{caution}</Text>

              <Text style={[ss.modalSectionTitle, { marginTop: 16 }]}>🇵🇭 {t('feeding_guide.common_ph_foods')}</Text>
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
          <Text style={ss.headerEmoji}>🥣</Text>
          <Text style={ss.headerTitle}>{t('feeding_guide.screen_title')}</Text>
          <Text style={ss.headerSub}>{t('feeding_guide.screen_sub')}</Text>
        </View>
        {activeChild && (
          <View style={ss.agePill}>
            <Text style={ss.agePillText}>👶 {childName} · {ageMonths}M</Text>
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
            <Text style={ss.tabEmoji}>{tab.emoji}</Text>
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
      <Text style={[ss.ateAiLabel, { color: borderColor }]}>✨ ATE AI SAYS</Text>
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
  tabEmoji:     { fontSize: 18, marginBottom: 2 },
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
  ateAiLabel:      { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 6 },
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
    backgroundColor: Colors.white, borderRadius: 16, marginBottom: 10,
    padding: 16, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
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
  stageFoodWarnIcon: { fontSize: 10 },
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
    backgroundColor: Colors.white, borderRadius: 16, marginBottom: 12,
    flexDirection: 'row', overflow: 'hidden',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
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
  ageTag:           { fontSize: 13, color: Colors.midGray, marginTop: 12, textAlign: 'center' },
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
});
