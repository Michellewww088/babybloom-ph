/**
 * feeding-guide.ts — PH Superfoods, Complementary Food Timeline, Allergen Guide
 * Sources: DOH Philippines IYCF Guidelines, WHO, Philippine Pediatric Society (PPS)
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface FoodItem {
  id: string;
  emoji: string;
  nameEN: string;
  nameFIL: string;
  nameZH: string;
  descEN: string;
  descFIL: string;
  descZH: string;
  texture: string;        // puree / mashed / soft / finger
  minAgeMonths: number;
  nutrients: string[];    // nutrient highlight keys
  prepEN: string[];       // step-by-step preparation tips
  prepFIL: string[];
  prepZH: string[];
  allergenKey?: string;   // maps to ALLERGENS id if relevant
  gradient: [string, string];
}

export interface AgeStage {
  id: string;
  labelEN: string;
  labelFIL: string;
  labelZH: string;
  ageMin: number;   // months
  ageMax: number;   // months (99 = open-ended)
  summaryEN: string;
  summaryFIL: string;
  summaryZH: string;
  keyPoints: string[];  // i18n keys
  foods: string[];      // FoodItem ids
  textureEN: string;
  textureFIL: string;
  textureZH: string;
  portionEN: string;
  portionFIL: string;
  portionZH: string;
}

export interface Allergen {
  id: string;
  emoji: string;
  nameEN: string;
  nameFIL: string;
  nameZH: string;
  introAgeMonths: number;  // WHO-recommended earliest intro age
  evidenceEN: string;
  evidenceFIL: string;
  evidenceZH: string;
  cautionEN: string;
  cautionFIL: string;
  cautionZH: string;
  commonPHFoods: string[];  // local foods containing this allergen
  warningColor: 'green' | 'yellow' | 'red';
}

export interface Superfood {
  id: string;
  emoji: string;
  nameEN: string;
  nameFIL: string;
  nameZH: string;
  taglineEN: string;
  taglineFIL: string;
  taglineZH: string;
  benefitsEN: string[];
  benefitsFIL: string[];
  benefitsZH: string[];
  prepTipsEN: string[];
  prepTipsFIL: string[];
  prepTipsZH: string[];
  minAgeMonths: number;
  nutrients: string[];
  allergenKeys: string[];  // allergen ids in this food
  gradient: [string, string];
  bgColor: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPLEMENTARY FOOD TIMELINE
// ─────────────────────────────────────────────────────────────────────────────

export const AGE_STAGES: AgeStage[] = [
  {
    id: 'stage_0_6',
    labelEN: '0–6 Months',
    labelFIL: '0–6 Buwan',
    labelZH: '0–6个月',
    ageMin: 0,
    ageMax: 5,
    summaryEN: 'Exclusive breastfeeding is the only nutrition Baby needs. Breast milk provides all vitamins, minerals, and immunity.',
    summaryFIL: 'Ang eksklusibong pagpapasuso lamang ang kailangan ni Baby. Ang gatas ng ina ay nagbibigay ng lahat ng bitamina, mineral, at proteksyon.',
    summaryZH: '纯母乳喂养是宝宝所需的唯一营养。母乳提供所有维生素、矿物质和免疫保护。',
    keyPoints: ['feeding_guide.stage_0_6_kp1', 'feeding_guide.stage_0_6_kp2', 'feeding_guide.stage_0_6_kp3'],
    foods: [],
    textureEN: 'Breast milk or formula only',
    textureFIL: 'Gatas ng ina o formula lamang',
    textureZH: '仅母乳或配方奶',
    portionEN: 'On-demand feeding, 8–12 times/day',
    portionFIL: 'Ayon sa pangangailangan, 8–12 beses/araw',
    portionZH: '按需喂养，每天8–12次',
  },
  {
    id: 'stage_6_8',
    labelEN: '6–8 Months',
    labelFIL: '6–8 Buwan',
    labelZH: '6–8个月',
    ageMin: 6,
    ageMax: 7,
    summaryEN: 'Start complementary foods when Baby shows readiness signs. Begin with single-ingredient smooth purees, 2–3 times a day.',
    summaryFIL: 'Magsimula ng complementary foods kapag handa na si Baby. Magsimula sa single-ingredient na malambot na puree, 2–3 beses sa isang araw.',
    summaryZH: '当宝宝显示出准备好的迹象时，开始辅食。从单一成分的顺滑泥开始，每天2–3次。',
    keyPoints: ['feeding_guide.stage_6_8_kp1', 'feeding_guide.stage_6_8_kp2', 'feeding_guide.stage_6_8_kp3'],
    foods: ['lugaw', 'kamote', 'kalabasa', 'saging_saba', 'malunggay_puree'],
    textureEN: 'Smooth puree, thick liquid',
    textureFIL: 'Malambot na puree, makapal na likido',
    textureZH: '顺滑泥糊，浓稠液体',
    portionEN: '2–3 teaspoons → 2–3 tablespoons per meal',
    portionFIL: '2–3 kutsarita → 2–3 kutsara bawat kain',
    portionZH: '每餐2–3茶匙 → 2–3汤匙',
  },
  {
    id: 'stage_8_10',
    labelEN: '8–10 Months',
    labelFIL: '8–10 Buwan',
    labelZH: '8–10个月',
    ageMin: 8,
    ageMax: 9,
    summaryEN: 'Increase texture and variety. Mashed or minced foods, 3–4 times a day. Introduce protein sources like fish, chicken, and egg yolk.',
    summaryFIL: 'Dagdagan ang texture at iba\'t ibang pagkain. Mashed o minced na pagkain, 3–4 beses sa isang araw. Uvain ang mga protina tulad ng isda, manok, at pula ng itlog.',
    summaryZH: '增加食物质地和多样性。捣碎或切碎的食物，每天3–4次。引入蛋白质来源如鱼、鸡肉和蛋黄。',
    keyPoints: ['feeding_guide.stage_8_10_kp1', 'feeding_guide.stage_8_10_kp2', 'feeding_guide.stage_8_10_kp3'],
    foods: ['lugaw', 'kamote', 'kalabasa', 'isda', 'manok', 'itlog_yolk', 'mongo'],
    textureEN: 'Mashed, minced, lumpy',
    textureFIL: 'Mashed, minced, may butil',
    textureZH: '捣碎、切碎、有小块',
    portionEN: '3–4 tablespoons per meal, 3–4 meals/day',
    portionFIL: '3–4 kutsara bawat kain, 3–4 kain/araw',
    portionZH: '每餐3–4汤匙，每天3–4餐',
  },
  {
    id: 'stage_10_12',
    labelEN: '10–12 Months',
    labelFIL: '10–12 Buwan',
    labelZH: '10–12个月',
    ageMin: 10,
    ageMax: 11,
    summaryEN: 'Introduce soft finger foods. Baby can start joining family meals with soft, small pieces. 3–4 meals + 1–2 snacks per day.',
    summaryFIL: 'Uvain ang malambot na finger foods. Maaari nang sumali si Baby sa pagkain ng pamilya na may malambot at maliliit na piraso. 3–4 kain + 1–2 meryenda sa isang araw.',
    summaryZH: '引入软手指食物。宝宝可以开始参与家庭用餐，吃软小块食物。每天3–4餐 + 1–2次零食。',
    keyPoints: ['feeding_guide.stage_10_12_kp1', 'feeding_guide.stage_10_12_kp2', 'feeding_guide.stage_10_12_kp3'],
    foods: ['lugaw', 'kamote', 'kalabasa', 'saging_saba', 'isda', 'manok', 'itlog', 'mongo', 'mais'],
    textureEN: 'Soft finger foods, small pieces',
    textureFIL: 'Malambot na finger foods, maliliit na piraso',
    textureZH: '软手指食物，小块',
    portionEN: '½ cup per meal, 3–4 meals + 1–2 snacks/day',
    portionFIL: '½ tasa bawat kain, 3–4 kain + 1–2 meryenda/araw',
    portionZH: '每餐半杯，每天3–4餐 + 1–2次零食',
  },
  {
    id: 'stage_12_plus',
    labelEN: '12+ Months',
    labelFIL: '12+ Buwan',
    labelZH: '12个月以上',
    ageMin: 12,
    ageMax: 99,
    summaryEN: 'Baby transitions to family foods with low salt, sugar, and no honey. Continue breastfeeding up to 2 years or beyond.',
    summaryFIL: 'Lumipat si Baby sa pagkain ng pamilya na mababa ang asin, asukal, at walang pulot. Ipagpatuloy ang pagpapasuso hanggang 2 taon o higit pa.',
    summaryZH: '宝宝过渡到低盐、低糖的家庭食物，不加蜂蜜。继续母乳喂养至2岁或更长。',
    keyPoints: ['feeding_guide.stage_12_kp1', 'feeding_guide.stage_12_kp2', 'feeding_guide.stage_12_kp3'],
    foods: ['lugaw', 'kamote', 'kalabasa', 'saging_saba', 'malunggay_puree', 'isda', 'manok', 'itlog', 'mongo', 'mais', 'kangkong'],
    textureEN: 'Family foods, varied textures',
    textureFIL: 'Pagkain ng pamilya, iba\'t ibang texture',
    textureZH: '家庭食物，多样化质地',
    portionEN: '¾ cup per meal, 3 meals + 2 snacks/day',
    portionFIL: '¾ tasa bawat kain, 3 kain + 2 meryenda/araw',
    portionZH: '每餐¾杯，每天3餐 + 2次零食',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PHILIPPINE SUPERFOODS
// ─────────────────────────────────────────────────────────────────────────────

export const PH_SUPERFOODS: Superfood[] = [
  {
    id: 'malunggay',
    emoji: '🌿',
    nameEN: 'Malunggay',
    nameFIL: 'Malunggay',
    nameZH: '辣木叶',
    taglineEN: 'The "Miracle Tree" of the Philippines',
    taglineFIL: 'Ang "Puno ng Himala" ng Pilipinas',
    taglineZH: '菲律宾的"奇迹之树"',
    benefitsEN: [
      '7× more vitamin C than oranges',
      '4× more calcium than milk',
      '3× more iron than spinach',
      'Rich in complete protein with all essential amino acids',
      'High folate for brain development',
    ],
    benefitsFIL: [
      '7× mas maraming vitamin C kaysa sa kahel',
      '4× mas maraming calcium kaysa sa gatas',
      '3× mas maraming iron kaysa sa spinach',
      'Mayaman sa kumpletong protina na may lahat ng mahahalagang amino acid',
      'Mataas na folate para sa pag-unlad ng utak',
    ],
    benefitsZH: [
      '维生素C是橙子的7倍',
      '钙含量是牛奶的4倍',
      '铁含量是菠菜的3倍',
      '富含完整蛋白质，含所有必需氨基酸',
      '高叶酸促进大脑发育',
    ],
    prepTipsEN: [
      'Strip leaves from stems and wash well',
      'Boil leaves briefly (1–2 min) to preserve nutrients',
      'Blend into smooth puree for 6–8M babies',
      'Add to lugaw or soup for 8M+ babies',
      'Mix into egg for toddlers (12M+)',
    ],
    prepTipsFIL: [
      'Alisin ang mga dahon mula sa tangkay at hugasan nang mabuti',
      'Pakuluan nang maikli (1–2 minuto) para mapanatili ang nutrients',
      'I-blend sa malambot na puree para sa 6–8 buwang sanggol',
      'Idagdag sa lugaw o sopas para sa 8M+ na sanggol',
      'Ihalo sa itlog para sa toddlers (12M+)',
    ],
    prepTipsZH: [
      '从茎上取下叶子，洗净',
      '短暂煮沸（1–2分钟）以保留营养',
      '搅拌成顺滑泥糊，适合6–8个月宝宝',
      '加入稀饭或汤中，适合8个月以上宝宝',
      '与鸡蛋混合，适合幼儿（12个月以上）',
    ],
    minAgeMonths: 6,
    nutrients: ['Vitamin C', 'Calcium', 'Iron', 'Protein', 'Folate'],
    allergenKeys: [],
    gradient: ['#4CAF7D', '#81C784'],
    bgColor: '#E8F5E9',
  },
  {
    id: 'kamote',
    emoji: '🍠',
    nameEN: 'Kamote',
    nameFIL: 'Kamote',
    nameZH: '红薯',
    taglineEN: 'Sweet Potato — Baby\'s first superfood',
    taglineFIL: 'Kamote — Unang superfood ni Baby',
    taglineZH: '红薯——宝宝的第一种超级食物',
    benefitsEN: [
      'Excellent source of beta-carotene (converts to Vitamin A)',
      'Natural sweetness babies love',
      'High fiber for healthy digestion',
      'Potassium for heart health',
      'Easy to digest — ideal first food',
    ],
    benefitsFIL: [
      'Napakagandang pinagkukunan ng beta-carotene (nagiging Vitamin A)',
      'Natural na tamis na gustong-gusto ng mga sanggol',
      'Mataas na fiber para sa malusog na digestyon',
      'Potassium para sa kalusugan ng puso',
      'Madaling matunaw — perpektong unang pagkain',
    ],
    benefitsZH: [
      '极好的β-胡萝卜素来源（转化为维生素A）',
      '宝宝喜爱的天然甜味',
      '高纤维促进消化健康',
      '钾元素有益心脏健康',
      '易消化——理想的第一辅食',
    ],
    prepTipsEN: [
      'Peel and cube kamote, remove all strings',
      'Steam for 15–20 min until very soft',
      'Mash with a fork, add breast milk/formula for creamier texture',
      'No added salt, sugar, or butter needed',
      'Store puree in ice cube trays, freeze up to 1 month',
    ],
    prepTipsFIL: [
      'Balatan at hiwain ang kamote, alisin ang lahat ng hibla',
      'I-steam ng 15–20 minuto hanggang maging malambot',
      'Durugin gamit ang tinidor, magdagdag ng gatas ng ina/formula para mas malapot',
      'Hindi na kailangan ng asin, asukal, o mantikilya',
      'I-store ang puree sa ice cube tray, i-freeze hanggang 1 buwan',
    ],
    prepTipsZH: [
      '去皮切块，去除所有纤维',
      '蒸15–20分钟至非常软',
      '用叉子捣碎，加入母乳/配方奶使质地更顺滑',
      '无需额外加盐、糖或黄油',
      '将泥糊存入冰格，可冷冻保存1个月',
    ],
    minAgeMonths: 6,
    nutrients: ['Vitamin A', 'Fiber', 'Potassium', 'Vitamin C', 'Manganese'],
    allergenKeys: [],
    gradient: ['#FF8A65', '#FFAB76'],
    bgColor: '#FFF3E0',
  },
  {
    id: 'saging_saba',
    emoji: '🍌',
    nameEN: 'Saging na Saba',
    nameFIL: 'Saging na Saba',
    nameZH: '大蕉',
    taglineEN: 'Plantain Banana — Energy powerhouse',
    taglineFIL: 'Saging na Saba — Puno ng enerhiya',
    taglineZH: '大蕉——能量之源',
    benefitsEN: [
      'High potassium for muscle development',
      'Resistant starch feeds healthy gut bacteria',
      'Vitamin B6 supports brain development',
      'Natural energy source for active babies',
      'More starchy than regular banana — better first food',
    ],
    benefitsFIL: [
      'Mataas na potassium para sa pag-unlad ng kalamnan',
      'Resistant starch para sa malusog na gut bacteria',
      'Vitamin B6 para sa pag-unlad ng utak',
      'Natural na pinagkukunan ng enerhiya para sa aktibong sanggol',
      'Mas matandok kaysa regular na saging — mas magandang unang pagkain',
    ],
    benefitsZH: [
      '高钾有助于肌肉发育',
      '抗性淀粉喂养健康肠道细菌',
      '维生素B6支持大脑发育',
      '为活跃宝宝提供天然能量',
      '比普通香蕉更含淀粉——更好的初始辅食',
    ],
    prepTipsEN: [
      'Choose ripe saba (yellow/brown spots) for sweetness and softness',
      'Boil in water for 10–15 min or steam until soft',
      'Mash well — no chunks for babies under 8M',
      'Mix with coconut water or breast milk for extra flavor',
      'Ripe saba can be mashed raw for 9M+ babies',
    ],
    prepTipsFIL: [
      'Pumili ng hinog na saba (dilaw/kayumanggi na batik) para sa tamis at kalambot',
      'Pakuluan ng 10–15 minuto o i-steam hanggang maging malambot',
      'Durugin nang mabuti — walang butil para sa mga sanggol na wala pang 8 buwan',
      'Ihalo sa tubig ng niyog o gatas ng ina para sa dagdag na lasa',
      'Ang hinog na saba ay maaaring durugin nang hilaw para sa 9M+ na sanggol',
    ],
    prepTipsZH: [
      '选择成熟的大蕉（有黄/棕色斑点）以获得甜味和软度',
      '水中煮10–15分钟或蒸至软',
      '充分捣碎——8个月以下宝宝不要有小块',
      '混入椰子水或母乳增添风味',
      '成熟大蕉可以生捣，适合9个月以上宝宝',
    ],
    minAgeMonths: 6,
    nutrients: ['Potassium', 'Vitamin B6', 'Fiber', 'Vitamin C', 'Resistant Starch'],
    allergenKeys: [],
    gradient: ['#FFD54F', '#FFCA28'],
    bgColor: '#FFFDE7',
  },
  {
    id: 'kalabasa',
    emoji: '🎃',
    nameEN: 'Kalabasa',
    nameFIL: 'Kalabasa',
    nameZH: '南瓜',
    taglineEN: 'Squash/Pumpkin — Vitamin A champion',
    taglineFIL: 'Kalabasa — Kampeon ng Vitamin A',
    taglineZH: '南瓜——维生素A冠军',
    benefitsEN: [
      'Extremely high in Vitamin A (eye & immune health)',
      'Rich in antioxidants (beta-carotene)',
      'Low in calories, high in nutrients',
      'Mildly sweet — most babies accept easily',
      'High in folate for cell growth',
    ],
    benefitsFIL: [
      'Napakataas ng Vitamin A (para sa mata at immune system)',
      'Mayaman sa antioxidants (beta-carotene)',
      'Mababa sa calorie, mataas sa nutrients',
      'Bahagyang matamis — karamihan sa mga sanggol ay madaling tumatanggap',
      'Mataas sa folate para sa paglaki ng cell',
    ],
    benefitsZH: [
      '维生素A含量极高（对眼睛和免疫系统有益）',
      '富含抗氧化剂（β-胡萝卜素）',
      '低卡路里，高营养',
      '略带甜味——大多数宝宝容易接受',
      '高叶酸促进细胞生长',
    ],
    prepTipsEN: [
      'Peel, seed, and cube kalabasa',
      'Steam or boil until fork-tender (12–15 min)',
      'Blend until completely smooth for young babies',
      'Combine with malunggay for a nutrient powerhouse mix',
      'Add to lugaw or arroz caldo for easy meals',
    ],
    prepTipsFIL: [
      'Balatan, alisin ang buto, at hiwain ang kalabasa',
      'I-steam o pakuluan hanggang malambot sa tinidor (12–15 minuto)',
      'I-blend hanggang ganap na malambot para sa mga batang sanggol',
      'Pagsamahin sa malunggay para sa napaka-nutritious na halo',
      'Idagdag sa lugaw o arroz caldo para sa madaling kain',
    ],
    prepTipsZH: [
      '去皮、去籽、切块',
      '蒸或煮至叉子可轻易穿透（12–15分钟）',
      '为小月龄宝宝搅拌至完全顺滑',
      '与辣木叶组合制作营养超级组合',
      '加入稀饭或卡罗饭中轻松搭配',
    ],
    minAgeMonths: 6,
    nutrients: ['Vitamin A', 'Beta-carotene', 'Folate', 'Vitamin C', 'Potassium'],
    allergenKeys: [],
    gradient: ['#FF7043', '#FF8A65'],
    bgColor: '#FBE9E7',
  },
  {
    id: 'lugaw',
    emoji: '🍚',
    nameEN: 'Lugaw',
    nameFIL: 'Lugaw',
    nameZH: '稀饭',
    taglineEN: 'Rice Porridge — Baby\'s comfort staple',
    taglineFIL: 'Lugaw — Pangunahing pagkain ni Baby',
    taglineZH: '稀饭——宝宝的舒适主食',
    benefitsEN: [
      'Easiest grain to digest for babies',
      'Low allergen risk — safe first grain',
      'Provides quick energy from carbohydrates',
      'Base for mixing other nutritious foods',
      'Helps thicken other purees for texture training',
    ],
    benefitsFIL: [
      'Pinakamadaling grain na matunaw para sa mga sanggol',
      'Mababang panganib ng allergen — ligtas na unang grain',
      'Nagbibigay ng mabilis na enerhiya mula sa carbohydrates',
      'Batayan para sa paghahalo ng iba pang nutritious na pagkain',
      'Nakakatulong na palapakin ang iba pang puree para sa texture training',
    ],
    benefitsZH: [
      '婴儿最容易消化的谷物',
      '过敏风险低——安全的第一种谷物',
      '碳水化合物提供快速能量',
      '混合其他营养食物的基础',
      '帮助加厚其他泥糊，进行质地训练',
    ],
    prepTipsEN: [
      'Use white rice ratio 1:8 (rice:water) for very smooth porridge',
      'Cook on low heat for 30–40 min, stirring frequently',
      'Add malunggay + fish or chicken for a complete meal',
      'Use chicken or fish broth instead of water for extra flavor',
      'Blend for young babies, leave soft lumps for 9M+',
    ],
    prepTipsFIL: [
      'Gamitin ang 1:8 (bigas:tubig) para sa napaka-malambot na lugaw',
      'Lutuin sa mahinang apoy ng 30–40 minuto, mindok-mindok na haluin',
      'Magdagdag ng malunggay + isda o manok para sa kumpletong kain',
      'Gumamit ng sabaw ng manok o isda sa halip na tubig para sa dagdag na lasa',
      'I-blend para sa mga batang sanggol, mag-iwan ng malambot na butil para sa 9M+',
    ],
    prepTipsZH: [
      '白米与水比例1:8，煮出非常顺滑的稀饭',
      '小火煮30–40分钟，频繁搅拌',
      '加入辣木叶+鱼或鸡肉制作完整一餐',
      '用鸡汤或鱼汤代替水增添风味',
      '为小月龄宝宝搅拌，9个月以上可留有软小块',
    ],
    minAgeMonths: 6,
    nutrients: ['Carbohydrates', 'B Vitamins', 'Iron (fortified)', 'Magnesium'],
    allergenKeys: [],
    gradient: ['#90CAF9', '#64B5F6'],
    bgColor: '#E3F2FD',
  },
  {
    id: 'mongo',
    emoji: '🫘',
    nameEN: 'Mongo',
    nameFIL: 'Mongo',
    nameZH: '绿豆',
    taglineEN: 'Mung Beans — Plant protein powerhouse',
    taglineFIL: 'Mongo — Pinagkukunan ng plant protein',
    taglineZH: '绿豆——植物蛋白质来源',
    benefitsEN: [
      'High plant-based protein for growth',
      'Excellent iron source for preventing anemia',
      'Rich in folate for brain development',
      'High fiber for gut health',
      'Easy to digest when well-cooked',
    ],
    benefitsFIL: [
      'Mataas na plant-based protein para sa paglaki',
      'Napakagandang pinagkukunan ng iron para maiwasan ang anemia',
      'Mayaman sa folate para sa pag-unlad ng utak',
      'Mataas na fiber para sa gut health',
      'Madaling matunaw kapag luto nang mabuti',
    ],
    benefitsZH: [
      '高植物蛋白促进生长',
      '优质铁源，预防贫血',
      '富含叶酸促进大脑发育',
      '高纤维维护肠道健康',
      '煮熟后容易消化',
    ],
    prepTipsEN: [
      'Soak overnight to reduce cooking time and improve digestibility',
      'Boil until very soft and skins split (30–40 min)',
      'Pass through sieve to remove tough skins for young babies',
      'Blend with lugaw for extra protein porridge',
      'Combine with coconut milk for traditional ginataang mongo',
    ],
    prepTipsFIL: [
      'Ibabad magdamag para mabawasan ang oras ng pagluluto at mapabuti ang digestibility',
      'Pakuluan hanggang maging malambot at mabitak ang balat (30–40 minuto)',
      'Ilagay sa salaan para alisin ang matitigas na balat para sa mga batang sanggol',
      'I-blend sa lugaw para sa karagdagang protein porridge',
      'Pagsamahin sa coconut milk para sa tradisyonal na ginataang mongo',
    ],
    prepTipsZH: [
      '提前一夜浸泡，减少烹饪时间并改善消化',
      '煮至非常软，豆皮裂开（30–40分钟）',
      '过筛去除硬豆皮，适合小月龄宝宝',
      '与稀饭混合制作高蛋白粥',
      '与椰浆混合制作传统椰汁绿豆',
    ],
    minAgeMonths: 7,
    nutrients: ['Protein', 'Iron', 'Folate', 'Fiber', 'Magnesium'],
    allergenKeys: [],
    gradient: ['#A5D6A7', '#66BB6A'],
    bgColor: '#F1F8E9',
  },
  {
    id: 'isda',
    emoji: '🐟',
    nameEN: 'Isda',
    nameFIL: 'Isda',
    nameZH: '鱼',
    taglineEN: 'Fish — Brain-building omega-3s',
    taglineFIL: 'Isda — Omega-3 para sa utak',
    taglineZH: '鱼——构建大脑的Omega-3',
    benefitsEN: [
      'DHA/EPA omega-3 for brain and eye development',
      'High-quality complete protein',
      'Vitamin D for bone health',
      'Easy to digest — softer than chicken',
      'PH local fish (tilapia, bangus) are affordable and nutritious',
    ],
    benefitsFIL: [
      'DHA/EPA omega-3 para sa pag-unlad ng utak at mata',
      'Mataas na kalidad na kumpletong protina',
      'Vitamin D para sa kalusugan ng buto',
      'Madaling matunaw — mas malambot kaysa manok',
      'Lokal na isda ng Pilipinas (tilapia, bangus) ay abot-kaya at masustansya',
    ],
    benefitsZH: [
      'DHA/EPA omega-3促进大脑和眼睛发育',
      '高质量完整蛋白质',
      '维生素D有益骨骼健康',
      '容易消化——比鸡肉更软',
      '菲律宾当地鱼类（罗非鱼、虱目鱼）经济实惠且营养丰富',
    ],
    prepTipsEN: [
      'Choose low-mercury fish: tilapia, bangus (milkfish), galunggong',
      'Steam or boil — never fry for babies',
      'Remove ALL bones carefully before serving',
      'Flake fish finely for 8M babies, small pieces for 10M+',
      'Introduce 1 new fish at a time, wait 3–5 days before trying another',
    ],
    prepTipsFIL: [
      'Pumili ng isda na mababa ang mercury: tilapia, bangus, galunggong',
      'I-steam o pakuluan — huwag mag-prito para sa mga sanggol',
      'Alisin ang LAHAT ng tinik nang maingat bago ihain',
      'Durugin nang pino ang isda para sa 8M na sanggol, maliliit na piraso para sa 10M+',
      'Mag-uvain ng 1 bagong isda sa isang pagkakataon, maghintay ng 3–5 araw bago sumubok ng iba',
    ],
    prepTipsZH: [
      '选择低汞鱼类：罗非鱼、虱目鱼、圆鲹',
      '蒸或煮——绝不给宝宝吃油炸食物',
      '上桌前仔细去除所有鱼骨',
      '8个月宝宝要细细弄碎，10个月以上可切小块',
      '一次引入一种新鱼，等3–5天再尝试另一种',
    ],
    minAgeMonths: 8,
    nutrients: ['Omega-3 DHA', 'Protein', 'Vitamin D', 'Vitamin B12', 'Selenium'],
    allergenKeys: ['fish'],
    gradient: ['#5BC8F5', '#29B6F6'],
    bgColor: '#E1F5FE',
  },
  {
    id: 'itlog',
    emoji: '🥚',
    nameEN: 'Itlog',
    nameFIL: 'Itlog',
    nameZH: '鸡蛋',
    taglineEN: 'Egg — Nature\'s perfect baby food',
    taglineFIL: 'Itlog — Perpektong pagkain ni Baby ng kalikasan',
    taglineZH: '鸡蛋——大自然完美的婴儿食品',
    benefitsEN: [
      'Choline — critical for brain and memory development',
      'Complete protein with all essential amino acids',
      'Lutein for eye development',
      'Vitamin D & B12 for healthy growth',
      'Early introduction (6M) REDUCES allergy risk per WHO guidelines',
    ],
    benefitsFIL: [
      'Choline — kritikal para sa pag-unlad ng utak at memorya',
      'Kumpletong protina na may lahat ng mahahalagang amino acid',
      'Lutein para sa pag-unlad ng mata',
      'Vitamin D at B12 para sa malusog na paglaki',
      'Maagang pagpapakilala (6M) ay NAGPAPABABA ng panganib ng allergy ayon sa WHO',
    ],
    benefitsZH: [
      '胆碱——对大脑和记忆发育至关重要',
      '完整蛋白质，含所有必需氨基酸',
      '叶黄素促进眼睛发育',
      '维生素D和B12促进健康生长',
      '根据WHO指南，早期引入（6个月）可降低过敏风险',
    ],
    prepTipsEN: [
      'Start with well-cooked scrambled or hard-boiled egg',
      'At 6M: begin with egg yolk only, well cooked',
      'At 8M: introduce whole egg (white + yolk)',
      'Watch for allergic reaction 2 hours after first serving',
      'Never serve raw or runny eggs to babies under 12M',
    ],
    prepTipsFIL: [
      'Magsimula sa mabuting nilutong scrambled o hard-boiled na itlog',
      'Sa 6M: magsimula sa pula ng itlog lamang, mabuting niluto',
      'Sa 8M: uvain ang buong itlog (puti + pula)',
      'Bantayan ang allergic reaction 2 oras pagkatapos ng unang kain',
      'Huwag ihain ang hilaw o malambot na itlog sa mga sanggol na wala pang 12M',
    ],
    prepTipsZH: [
      '从充分煮熟的炒蛋或白煮蛋开始',
      '6个月：只从蛋黄开始，充分煮熟',
      '8个月：引入整蛋（蛋白+蛋黄）',
      '第一次喂食后2小时观察过敏反应',
      '12个月以下宝宝绝不提供生蛋或溏心蛋',
    ],
    minAgeMonths: 6,
    nutrients: ['Choline', 'Protein', 'Vitamin D', 'B12', 'Lutein'],
    allergenKeys: ['egg'],
    gradient: ['#FFF176', '#FFEE58'],
    bgColor: '#FFFDE7',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ALLERGEN INTRODUCTION GUIDE
// ─────────────────────────────────────────────────────────────────────────────

export const ALLERGENS: Allergen[] = [
  {
    id: 'egg',
    emoji: '🥚',
    nameEN: 'Egg',
    nameFIL: 'Itlog',
    nameZH: '鸡蛋',
    introAgeMonths: 6,
    evidenceEN: 'LEAP study (2022) & WHO guidelines: Early introduction at 6M significantly reduces egg allergy risk by up to 40%.',
    evidenceFIL: 'Pag-aaral ng LEAP (2022) at WHO: Maagang pagpapakilala sa 6M ay makabuluhang nagpapababa ng panganib ng egg allergy ng hanggang 40%.',
    evidenceZH: 'LEAP研究（2022年）和WHO指南：6个月早期引入可显著降低鸡蛋过敏风险高达40%。',
    cautionEN: 'Start with well-cooked egg yolk first. Introduce whole egg by 8–9M. Watch for hives, swelling, or difficulty breathing.',
    cautionFIL: 'Magsimula muna sa mabuting nilutong pula ng itlog. Uvain ang buong itlog sa 8–9M. Bantayan ang pantal, pamamaga, o hirap sa paghinga.',
    cautionZH: '先从充分煮熟的蛋黄开始。8–9个月时引入整蛋。注意荨麻疹、肿胀或呼吸困难。',
    commonPHFoods: ['Itlog', 'Leche flan', 'Ensaymada', 'Maja blanca', 'Pancake'],
    warningColor: 'green',
  },
  {
    id: 'peanut',
    emoji: '🥜',
    nameEN: 'Peanut',
    nameFIL: 'Mani',
    nameZH: '花生',
    introAgeMonths: 6,
    evidenceEN: 'LEAP trial: Introducing peanut at 6M reduces peanut allergy risk by 70–80% in high-risk infants. Do NOT give whole peanuts (choking risk).',
    evidenceFIL: 'LEAP trial: Ang pagpapakilala ng mani sa 6M ay nagpapababa ng panganib ng peanut allergy ng 70–80% sa mga sanggol na mataas ang panganib. HUWAG magbigay ng buo na mani (panganib ng pag-inis).',
    evidenceZH: 'LEAP试验：6个月引入花生可使高风险婴儿花生过敏风险降低70–80%。不要给整颗花生（噎食风险）。',
    cautionEN: 'Offer as smooth peanut butter thinned with water. Never whole peanuts. Wait 3+ days before re-introducing.',
    cautionFIL: 'Ihain bilang malambot na peanut butter na pinalapot ng tubig. Huwag kailanman buo na mani. Maghintay ng 3+ araw bago muling ipakilala.',
    cautionZH: '以用水稀释的顺滑花生酱形式提供。绝不给整颗花生。等待3天以上再次引入。',
    commonPHFoods: ['Kare-kare (sahog)', 'Peanut candy', 'Sikwate', 'Pastillas'],
    warningColor: 'green',
  },
  {
    id: 'fish',
    emoji: '🐟',
    nameEN: 'Fish',
    nameFIL: 'Isda',
    nameZH: '鱼',
    introAgeMonths: 8,
    evidenceEN: 'Introduce low-mercury fish (tilapia, bangus) at 8M+. Rich in DHA for brain development. High-mercury fish (tuna, swordfish) wait until 12M.',
    evidenceFIL: 'Uvain ang mababang mercury na isda (tilapia, bangus) sa 8M+. Mayaman sa DHA para sa pag-unlad ng utak. Mataas na mercury na isda (tuna, swordfish) hintayin hanggang 12M.',
    evidenceZH: '8个月以上引入低汞鱼类（罗非鱼、虱目鱼）。富含DHA促进大脑发育。高汞鱼类（金枪鱼、剑鱼）等到12个月。',
    cautionEN: 'Remove ALL bones carefully. Avoid high-mercury fish under 12M. Introduce one fish species at a time.',
    cautionFIL: 'Alisin nang maingat ang LAHAT ng tinik. Iwasan ang mataas na mercury na isda sa ilalim ng 12M. Mag-uvain ng isang species ng isda sa isang pagkakataon.',
    cautionZH: '仔细去除所有鱼骨。12个月以下避免高汞鱼类。一次只引入一种鱼类。',
    commonPHFoods: ['Sinigang na isda', 'Tinola', 'Paksiw na isda', 'Daing na bangus'],
    warningColor: 'yellow',
  },
  {
    id: 'shellfish',
    emoji: '🦐',
    nameEN: 'Shellfish',
    nameFIL: 'Mga Hipon at Talaba',
    nameZH: '贝类',
    introAgeMonths: 12,
    evidenceEN: 'Shellfish (shrimp, crab, oyster) can be introduced at 12M in well-cooked form. High allergy risk — introduce cautiously.',
    evidenceFIL: 'Ang mga shellfish (hipon, alimasag, talaba) ay maaaring ipakilala sa 12M sa mabuting nilutong anyo. Mataas na panganib ng allergy — mag-uvain nang maingat.',
    evidenceZH: '贝类（虾、蟹、牡蛎）可在12个月以充分煮熟的形式引入。过敏风险高——谨慎引入。',
    cautionEN: 'Always fully cooked. Watch closely for 24 hours after first introduction. Skip if family history of shellfish allergy.',
    cautionFIL: 'Laging mabuting luto. Bantayan nang mabuti sa loob ng 24 oras pagkatapos ng unang pagpapakilala. Laktawan kung may kasaysayan ng shellfish allergy sa pamilya.',
    cautionZH: '务必充分煮熟。首次引入后密切观察24小时。如有家族贝类过敏史则跳过。',
    commonPHFoods: ['Sinigang na hipon', 'Kare-kare', 'Sugpo', 'Tahong', 'Talaba'],
    warningColor: 'red',
  },
  {
    id: 'dairy',
    emoji: '🥛',
    nameEN: 'Cow\'s Milk Dairy',
    nameFIL: 'Gatas ng Baka',
    nameZH: '牛奶乳制品',
    introAgeMonths: 6,
    evidenceEN: 'Dairy products (yogurt, cheese) can be introduced at 6M as complementary food. Whole cow\'s milk as main drink — wait until 12M (WHO recommendation).',
    evidenceFIL: 'Ang mga dairy products (yogurt, keso) ay maaaring ipakilala sa 6M bilang complementary food. Buong gatas ng baka bilang pangunahing inumin — hintayin hanggang 12M (rekomendasyon ng WHO).',
    evidenceZH: '乳制品（酸奶、奶酪）可在6个月作为辅食引入。全脂牛奶作为主要饮品——等到12个月（WHO建议）。',
    cautionEN: 'Plain yogurt (no sugar) at 6M is fine. Avoid cow\'s milk as main drink before 12M. Use breast milk or formula as main milk.',
    cautionFIL: 'Plain yogurt (walang asukal) sa 6M ay okay. Iwasan ang gatas ng baka bilang pangunahing inumin bago ang 12M. Gumamit ng gatas ng ina o formula bilang pangunahing gatas.',
    cautionZH: '6个月开始可以吃无糖原味酸奶。12个月前避免将牛奶作为主要饮品。以母乳或配方奶作为主要奶源。',
    commonPHFoods: ['Yogurt', 'Keso', 'Pasteurized milk', 'Cream'],
    warningColor: 'yellow',
  },
  {
    id: 'wheat',
    emoji: '🌾',
    nameEN: 'Wheat / Gluten',
    nameFIL: 'Trigo / Gluten',
    nameZH: '小麦/麸质',
    introAgeMonths: 6,
    evidenceEN: 'Introduce gluten-containing foods at 6M. Delaying beyond 12M may increase celiac disease risk. Small amounts first.',
    evidenceFIL: 'Mag-uvain ng gluten-containing foods sa 6M. Ang pagpapaliban ng higit sa 12M ay maaaring magpataas ng panganib ng celiac disease. Maliliit na dami muna.',
    evidenceZH: '6个月引入含麸质食物。延迟到12个月以后可能增加乳糜泻风险。先从少量开始。',
    cautionEN: 'Offer as soft cooked pasta or bread pieces at 6M+. Watch for chronic diarrhea, poor growth, or bloating which may indicate celiac.',
    cautionFIL: 'Ihain bilang malambot na luto na pasta o tinapay sa 6M+. Bantayan ang talamak na pagtatae, mahinang paglaki, o bloating na maaaring nagpapahiwatig ng celiac.',
    cautionZH: '6个月以上可提供软煮意面或面包片。注意慢性腹泻、生长不良或腹胀，这可能表明乳糜泻。',
    commonPHFoods: ['Pan de sal', 'Pancake', 'Pasta', 'Cereal', 'Crackers'],
    warningColor: 'green',
  },
  {
    id: 'soy',
    emoji: '🫘',
    nameEN: 'Soy',
    nameFIL: 'Toyo / Soya',
    nameZH: '大豆',
    introAgeMonths: 7,
    evidenceEN: 'Soy can be introduced at 7M in well-cooked forms like tofu. Soy formula is not recommended over breast milk without medical reason.',
    evidenceFIL: 'Ang soy ay maaaring ipakilala sa 7M sa mabuting nilutong anyo tulad ng tofu. Hindi inirerekomenda ang soy formula kaysa gatas ng ina nang walang medikal na dahilan.',
    evidenceZH: '大豆可在7个月以充分煮熟的形式（如豆腐）引入。没有医学原因不推荐使用豆奶配方代替母乳。',
    cautionEN: 'Soft silken tofu is ideal for babies. Fermented soy (miso, natto) has beneficial probiotics. Soy allergy often co-occurs with milk allergy.',
    cautionFIL: 'Malambot na silken tofu ay perpekto para sa mga sanggol. Ang fermented soy (miso, natto) ay may kapaki-pakinabang na probiotics. Ang soy allergy ay madalas na kasabay ng milk allergy.',
    cautionZH: '软嫩豆腐是宝宝的理想选择。发酵大豆（味噌、纳豆）含有有益益生菌。大豆过敏常与牛奶过敏同时出现。',
    commonPHFoods: ['Taho', 'Tokwa', 'Tausi', 'Toyo (soy sauce)', 'Tokwat baboy'],
    warningColor: 'green',
  },
  {
    id: 'tree_nuts',
    emoji: '🌰',
    nameEN: 'Tree Nuts',
    nameFIL: 'Mga Nuts',
    nameZH: '坚果',
    introAgeMonths: 6,
    evidenceEN: 'Smooth nut butters (cashew, almond) can be introduced at 6M. Never whole nuts (choking hazard) before 5 years.',
    evidenceFIL: 'Ang malambot na nut butters (cashew, almond) ay maaaring ipakilala sa 6M. Huwag kailanman buo na nuts (panganib ng pag-inis) bago ang 5 taon.',
    evidenceZH: '顺滑坚果酱（腰果、杏仁）可在6个月引入。5岁前绝不给整颗坚果（噎食危险）。',
    cautionEN: 'Always as smooth paste thinned with water. Cashew butter is a popular PH option. Watch closely first 2 hours.',
    cautionFIL: 'Laging bilang malambot na paste na pinalapot ng tubig. Ang cashew butter ay isang sikat na pagpipilian sa Pilipinas. Bantayan nang maingat sa unang 2 oras.',
    cautionZH: '始终以用水稀释的顺滑酱形式提供。腰果酱是菲律宾常见选择。密切观察前2小时。',
    commonPHFoods: ['Cashew butter', 'Almond milk', 'Pili nut', 'Macadamia', 'Pesto'],
    warningColor: 'yellow',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// READINESS SIGNS (for timeline intro)
// ─────────────────────────────────────────────────────────────────────────────

export const READINESS_SIGNS = [
  { emoji: '🪑', keyEN: 'Can sit with support', keyFIL: 'Nakakaupo na may suporta', keyZH: '在支撑下能坐起' },
  { emoji: '👀', keyEN: 'Shows interest in food', keyFIL: 'Nagpapakita ng interes sa pagkain', keyZH: '对食物表现出兴趣' },
  { emoji: '👅', keyEN: 'Tongue thrust fades', keyFIL: 'Nababawasan ang tongue thrust reflex', keyZH: '吐舌反射减弱' },
  { emoji: '🤲', keyEN: 'Brings objects to mouth', keyFIL: 'Nagdadala ng mga bagay sa bibig', keyZH: '把东西放入口中' },
  { emoji: '👁️', keyEN: 'Good head control', keyFIL: 'Magandang kontrol ng ulo', keyZH: '能控制头部' },
];

// ─────────────────────────────────────────────────────────────────────────────
// FOODS TO AVOID UNDER 12 MONTHS
// ─────────────────────────────────────────────────────────────────────────────

export const FOODS_TO_AVOID = [
  { emoji: '🍯', nameEN: 'Honey', nameFIL: 'Pulot', nameZH: '蜂蜜', reasonKey: 'feeding_guide.avoid_honey' },
  { emoji: '🧂', nameEN: 'Added salt', nameFIL: 'Idinagdag na asin', nameZH: '额外加盐', reasonKey: 'feeding_guide.avoid_salt' },
  { emoji: '🍬', nameEN: 'Added sugar', nameFIL: 'Idinagdag na asukal', nameZH: '额外加糖', reasonKey: 'feeding_guide.avoid_sugar' },
  { emoji: '🐄', nameEN: 'Cow\'s milk (as main drink)', nameFIL: 'Gatas ng baka (bilang pangunahing inumin)', nameZH: '牛奶（作为主饮品）', reasonKey: 'feeding_guide.avoid_cowmilk' },
  { emoji: '🐟', nameEN: 'High-mercury fish', nameFIL: 'Mataas na mercury na isda', nameZH: '高汞鱼类', reasonKey: 'feeding_guide.avoid_mercury_fish' },
  { emoji: '🫐', nameEN: 'Whole round foods (grapes, berries)', nameFIL: 'Mga buo na mabilog na pagkain', nameZH: '整颗圆形食物（葡萄、浆果）', reasonKey: 'feeding_guide.avoid_choking' },
  { emoji: '☕', nameEN: 'Caffeine (tea, coffee)', nameFIL: 'Caffeine (tsaa, kape)', nameZH: '含咖啡因饮品（茶、咖啡）', reasonKey: 'feeding_guide.avoid_caffeine' },
  { emoji: '🥤', nameEN: 'Sugary drinks & juice', nameFIL: 'Matamis na inumin at juice', nameZH: '含糖饮料和果汁', reasonKey: 'feeding_guide.avoid_juice' },
];
