/**
 * constants/milestones.ts
 * Full CDC/WHO developmental milestones + Philippines-specific stage checklists
 * + "First Times" log definitions for BabyBloom PH Memory Book
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type MilestoneDomain = 'social' | 'cognitive' | 'language' | 'motor';

export interface MilestoneItem {
  id:     string;
  domain: MilestoneDomain;
  en:     string;
  fil:    string;
  zh:     string;
}

export interface AgeGroup {
  ageMonths:  number;
  labelKey:   string;        // i18n key, e.g. "milestones.age_2m"
  milestones: MilestoneItem[];
}

export interface StageChecklistItem {
  id:       string;
  en:       string;
  fil:      string;
  zh:       string;
  category: 'medical' | 'admin' | 'nutrition' | 'development' | 'safety';
  url?:     string;
}

export interface Stage {
  key:       string;           // e.g. "0_1m"
  labelKey:  string;           // i18n key
  emoji:     string;
  items:     StageChecklistItem[];
}

export interface FirstTimeCategory {
  id:      string;
  emoji:   string;
  labelEn: string;
  labelFil: string;
  labelZh: string;
  hasNote?: boolean;        // if true, prompt for extra text (e.g. "What word?")
  noteLabelEn?: string;
  noteLabelFil?: string;
  noteLabelZh?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// MILESTONES  (CDC/WHO per docs/11-milestones.md)
// ─────────────────────────────────────────────────────────────────────────────

export const MILESTONES: AgeGroup[] = [
  {
    ageMonths: 2,
    labelKey: 'milestones.age_2m',
    milestones: [
      { id: '2m_soc_1', domain: 'social',    en: 'Smiles at people',                                     fil: 'Ngumingiti sa mga tao',                                        zh: '对人微笑' },
      { id: '2m_soc_2', domain: 'social',    en: 'Tries to look at parent',                              fil: 'Sinusubukang tumingin sa magulang',                             zh: '尝试注视父母' },
      { id: '2m_cog_1', domain: 'cognitive', en: 'Pays attention to faces',                              fil: 'Napapansin ang mga mukha',                                      zh: '注意观察面孔' },
      { id: '2m_lang_1',domain: 'language',  en: 'Makes cooing sounds',                                  fil: 'Gumagawa ng mga tunog (cooing)',                                zh: '发出咕咕声' },
      { id: '2m_motor_1',domain: 'motor',    en: 'Can briefly hold head up when on tummy',               fil: 'Kaya itaas ang ulo nang sandali kapag nakahiga sa tiyan',        zh: '俯卧时可短暂抬头' },
      { id: '2m_motor_2',domain: 'motor',    en: 'Makes smooth movements with arms and legs',            fil: 'Maayos na pagkilos ng mga braso at binti',                     zh: '手臂和腿部动作协调' },
    ],
  },
  {
    ageMonths: 4,
    labelKey: 'milestones.age_4m',
    milestones: [
      { id: '4m_soc_1', domain: 'social',    en: 'Smiles spontaneously, especially at people',           fil: 'Kusang ngumingiti, lalo na sa mga tao',                         zh: '自发微笑，尤其对人' },
      { id: '4m_soc_2', domain: 'social',    en: 'Likes to play with people and might cry when play stops', fil: 'Gusto maglaro at maaaring umiyak kapag natapos na',          zh: '喜欢和人互动，停止玩耍时可能哭泣' },
      { id: '4m_cog_1', domain: 'cognitive', en: 'Follows moving things with eyes from side to side',    fil: 'Sinusundan ng mata ang gumagalaw na bagay',                     zh: '眼睛能左右追踪移动物体' },
      { id: '4m_cog_2', domain: 'cognitive', en: 'Recognizes familiar people from a distance',           fil: 'Nakikilala ang mga pamilyar na tao mula sa malayo',             zh: '能从远处认出熟悉的人' },
      { id: '4m_lang_1',domain: 'language',  en: 'Babbles with expression',                              fil: 'Nagbabable nang may ekspresyon',                                zh: '有表情地咿呀学语' },
      { id: '4m_lang_2',domain: 'language',  en: 'Copies some sounds you make',                          fil: 'Kinokopya ang ilang tunog na ginagawa mo',                     zh: '模仿你发出的一些声音' },
      { id: '4m_motor_1',domain: 'motor',    en: 'Holds head steady without support',                    fil: 'Hawak ang ulo nang tuwid nang walang tulong',                  zh: '头部可无支撑稳定保持' },
      { id: '4m_motor_2',domain: 'motor',    en: 'Pushes down on legs when feet placed on firm surface', fil: 'Nagtutulak ng pababa kapag nakalagay ang paa sa patag na ibabaw', zh: '脚触及硬面时会用力向下蹬' },
      { id: '4m_motor_3',domain: 'motor',    en: 'May be able to roll from tummy to back',               fil: 'Maaaring makalikot mula sa tiyan patungo sa likod',             zh: '可能会从俯卧翻身至仰卧' },
    ],
  },
  {
    ageMonths: 6,
    labelKey: 'milestones.age_6m',
    milestones: [
      { id: '6m_soc_1', domain: 'social',    en: 'Knows familiar faces; begins to know strangers',       fil: 'Nakikilala ang mga pamilyar na mukha; nagsisimulang makilala ang mga hindi pamilyar', zh: '认识熟悉的面孔，开始认生' },
      { id: '6m_soc_2', domain: 'social',    en: 'Likes to play with others, especially parents',        fil: 'Gusto maglaro kasama ang iba, lalo na ang mga magulang',        zh: '喜欢和他人玩耍，尤其是父母' },
      { id: '6m_cog_1', domain: 'cognitive', en: 'Looks around at nearby things with curiosity',         fil: 'Nagmamasid sa paligid nang may pagkamausisa',                  zh: '好奇地观察周围事物' },
      { id: '6m_cog_2', domain: 'cognitive', en: 'Brings things to mouth',                               fil: 'Dina-dalhin ang mga bagay sa bibig',                            zh: '将东西放进嘴里探索' },
      { id: '6m_lang_1',domain: 'language',  en: 'Responds to sounds by making sounds',                  fil: 'Tumutugon sa mga tunog sa pamamagitan ng paggawa ng tunog',     zh: '听到声音后会发出声音回应' },
      { id: '6m_lang_2',domain: 'language',  en: 'Strings vowels together when babbling',                fil: 'Nagsasama-sama ng mga patinig sa pag-babble',                  zh: '咿呀学语时能连续发出元音' },
      { id: '6m_motor_1',domain: 'motor',    en: 'Rolls over in both directions',                        fil: 'Nakaka-likot sa magkabilang direksyon',                         zh: '能向两个方向翻身' },
      { id: '6m_motor_2',domain: 'motor',    en: 'Begins to sit without support',                        fil: 'Nagsisimulang makaupo nang walang tulong',                     zh: '开始能无支撑独坐' },
      { id: '6m_motor_3',domain: 'motor',    en: 'Rocks back and forth on hands and knees',              fil: 'Nagpalakpak-palakpak sa mga kamay at tuhod',                   zh: '用手和膝盖前后摇摆' },
    ],
  },
  {
    ageMonths: 9,
    labelKey: 'milestones.age_9m',
    milestones: [
      { id: '9m_soc_1', domain: 'social',    en: 'May be clingy with familiar adults',                   fil: 'Maaaring mapanatili sa mga pamilyar na matatanda',             zh: '可能对熟悉的成人产生依赖' },
      { id: '9m_soc_2', domain: 'social',    en: 'Has favourite toys',                                   fil: 'May paboritong laruan',                                         zh: '有最喜欢的玩具' },
      { id: '9m_cog_1', domain: 'cognitive', en: 'Watches the path of something as it falls',            fil: 'Sinisundan ang landas ng bagay na nahuhulog',                  zh: '追踪掉落物体的路径' },
      { id: '9m_cog_2', domain: 'cognitive', en: 'Looks for things she sees you hide',                   fil: 'Naghahanap ng mga bagay na nakita mong itago',                 zh: '寻找你藏起来的东西' },
      { id: '9m_lang_1',domain: 'language',  en: 'Makes a lot of different sounds like "mamamama"',      fil: 'Gumagawa ng maraming iba\'t ibang tunog tulad ng "mamamama"',   zh: '发出多种不同声音如"妈妈妈"' },
      { id: '9m_lang_2',domain: 'language',  en: 'Understands the word "no"',                            fil: 'Naiintindihan ang salitang "hindi"',                            zh: '理解"不"这个词' },
      { id: '9m_motor_1',domain: 'motor',    en: 'Stands holding on',                                    fil: 'Nakatayo na may hawak',                                         zh: '扶物站立' },
      { id: '9m_motor_2',domain: 'motor',    en: 'Can get into sitting position',                        fil: 'Kaya umabot sa posisyon ng pag-upo',                           zh: '能自己坐起来' },
      { id: '9m_motor_3',domain: 'motor',    en: 'Crawls',                                               fil: 'Gumagapang',                                                    zh: '会爬行' },
    ],
  },
  {
    ageMonths: 12,
    labelKey: 'milestones.age_12m',
    milestones: [
      { id: '12m_soc_1', domain: 'social',    en: 'Cries when mom or dad leaves',                        fil: 'Umiiyak kapag umalis ang nanay o tatay',                        zh: '妈妈或爸爸离开时会哭' },
      { id: '12m_soc_2', domain: 'social',    en: 'Shows fear in some situations',                       fil: 'Nagpapakita ng takot sa ilang sitwasyon',                      zh: '在某些情况下表现出恐惧' },
      { id: '12m_cog_1', domain: 'cognitive', en: 'Explores things by shaking, banging, throwing',       fil: 'Nag-eeksplora ng mga bagay sa iba\'t ibang paraan',              zh: '通过摇晃、敲打、扔东西等方式探索物体' },
      { id: '12m_cog_2', domain: 'cognitive', en: 'Finds hidden objects easily',                          fil: 'Madaling makita ang mga nakatago na bagay',                    zh: '轻松找到藏起来的物体' },
      { id: '12m_lang_1',domain: 'language',  en: 'Says "mama" and "dada"',                              fil: 'Nagsasabi ng "mama" at "dada"',                                zh: '能说"妈妈"和"爸爸"' },
      { id: '12m_lang_2',domain: 'language',  en: 'Uses exclamations like "oh-oh!"',                     fil: 'Gumagamit ng exclamation tulad ng "ay!"',                       zh: '使用感叹词如"哦！"' },
      { id: '12m_lang_3',domain: 'language',  en: 'Tries to imitate words',                              fil: 'Sinusubukang gumaya ng mga salita',                             zh: '尝试模仿单词' },
      { id: '12m_motor_1',domain: 'motor',    en: 'Gets to sitting position without help',               fil: 'Nakaupo nang walang tulong',                                    zh: '能独立坐起' },
      { id: '12m_motor_2',domain: 'motor',    en: 'Pulls up to stand',                                   fil: 'Nakakatulong na makatayo',                                      zh: '能扶物站起' },
      { id: '12m_motor_3',domain: 'motor',    en: 'May stand alone and take first steps',                fil: 'Maaaring nakatayo nang walang tulong at gumagawa ng unang hakbang', zh: '可能会独站并迈出第一步' },
    ],
  },
  {
    ageMonths: 18,
    labelKey: 'milestones.age_18m',
    milestones: [
      { id: '18m_soc_1', domain: 'social',    en: 'Shows affection for familiar people by hugging',      fil: 'Nagpapakita ng pagmamahal sa pamamagitan ng yakap',             zh: '用拥抱表达对熟悉的人的感情' },
      { id: '18m_soc_2', domain: 'social',    en: 'Points to show something interesting',                fil: 'Nagpupunto para magpakita ng isang bagay na kawili-wili',       zh: '用手指指向有趣的东西' },
      { id: '18m_cog_1', domain: 'cognitive', en: 'Knows what ordinary things are for (phone, spoon)',   fil: 'Alam ang gamit ng mga ordinaryong bagay (telepono, kutsara)',  zh: '知道日常物品的用途（手机、汤匙等）' },
      { id: '18m_lang_1',domain: 'language',  en: 'Says at least 10 words',                              fil: 'Nagsasabi ng kahit 10 salita',                                  zh: '至少能说10个词' },
      { id: '18m_lang_2',domain: 'language',  en: 'Responds to simple verbal requests',                  fil: 'Tumutugon sa simpleng verbal na kahilingan',                   zh: '能回应简单的口头指令' },
      { id: '18m_motor_1',domain: 'motor',    en: 'Walks alone',                                         fil: 'Nakakalakad nang mag-isa',                                      zh: '能独立行走' },
      { id: '18m_motor_2',domain: 'motor',    en: 'May walk up steps with help',                         fil: 'Maaaring makaahon ng hagdan na may tulong',                    zh: '可能在帮助下爬楼梯' },
      { id: '18m_motor_3',domain: 'motor',    en: 'Scribbles on own',                                    fil: 'Nagsusulat-sulat nang mag-isa',                                 zh: '能自己涂鸦' },
    ],
  },
  {
    ageMonths: 24,
    labelKey: 'milestones.age_24m',
    milestones: [
      { id: '24m_soc_1', domain: 'social',    en: 'Plays alongside other children',                      fil: 'Naglalaro sa tabi ng ibang mga bata',                          zh: '能在其他孩子旁边玩耍' },
      { id: '24m_soc_2', domain: 'social',    en: 'Shows defiant behaviour',                             fil: 'Nagpapakita ng masuwayin na ugali',                             zh: '开始出现叛逆行为' },
      { id: '24m_cog_1', domain: 'cognitive', en: 'Finds things even when hidden under two or three covers', fil: 'Mahanap ang mga bagay kahit nakatago sa ilalim ng dalawa o tatlong takip', zh: '能找到藏在两三层遮盖物下的东西' },
      { id: '24m_lang_1',domain: 'language',  en: 'Says sentences with 2 to 4 words',                    fil: 'Nagsasabi ng pangungusap na may 2 hanggang 4 salita',           zh: '能说2到4个词的句子' },
      { id: '24m_lang_2',domain: 'language',  en: 'Vocabulary of at least 50 words',                     fil: 'Kahit 50 salita sa talasalitaan',                               zh: '词汇量至少50个词' },
      { id: '24m_motor_1',domain: 'motor',    en: 'Kicks a ball',                                        fil: 'Sinisipa ang bola',                                             zh: '能踢球' },
      { id: '24m_motor_2',domain: 'motor',    en: 'Runs with increasing steadiness',                     fil: 'Tumakbo nang may tumataas na katatagan',                        zh: '跑步越来越稳' },
      { id: '24m_motor_3',domain: 'motor',    en: 'Climbs furniture',                                    fil: 'Umaakyat ng kasangkapan',                                       zh: '能攀爬家具' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// STAGE CHECKLISTS (Philippines-specific per docs/11-milestones.md)
// ─────────────────────────────────────────────────────────────────────────────

export const STAGE_CHECKLISTS: Stage[] = [
  {
    key: '0_1m',
    labelKey: 'milestones.stage_0_1m',
    emoji: 'sprout',
    items: [
      { id: '0_1m_1',  category: 'medical',     en: 'Schedule 1st well-baby checkup within 1 week of hospital discharge',           fil: 'Mag-schedule ng unang well-baby checkup sa loob ng 1 linggo',                          zh: '出院后1周内安排首次体检' },
      { id: '0_1m_2',  category: 'admin',       en: 'Register birth at LCR (Local Civil Registry) — within 30 days (PSA)',          fil: 'Irerehistro ang kapanganakan sa LCR sa loob ng 30 araw (PSA)',                         zh: '30天内在民政局登记出生（PSA）' },
      { id: '0_1m_3',  category: 'admin',       en: 'Apply for PSA Birth Certificate',                                              fil: 'Mag-apply ng PSA Birth Certificate',                                                  zh: '申请PSA出生证明' },
      { id: '0_1m_4',  category: 'admin',       en: 'Enroll newborn in PhilHealth — within 30 days for Newborn Care Package',       fil: 'I-enroll ang sanggol sa PhilHealth sa loob ng 30 araw',                               zh: '30天内为新生儿加入PhilHealth' },
      { id: '0_1m_5',  category: 'medical',     en: 'Get MCH Booklet from Barangay Health Station (BHS)',                           fil: 'Kunin ang MCH Booklet mula sa BHS',                                                    zh: '从社区卫生站获取MCH手册' },
      { id: '0_1m_6',  category: 'medical',     en: 'Confirm BCG + Hepatitis B dose 1 given (check discharge papers)',              fil: 'Kumpirmahin ang BCG + Hepatitis B dose 1 (tingnan ang discharge papers)',              zh: '确认BCG和乙肝第1针已接种（查看出院文件）' },
      { id: '0_1m_7',  category: 'medical',     en: 'Schedule Newborn Screening if not done at hospital (RA 9288)',                 fil: 'Mag-schedule ng Newborn Screening kung hindi pa nagawa sa ospital (RA 9288)',          zh: '若未在医院做，安排新生儿筛查（RA 9288）' },
      { id: '0_1m_8',  category: 'safety',      en: 'Set up safe sleep environment (firm mattress, no soft bedding)',               fil: 'Gumawa ng ligtas na lugar para matulog ang sanggol',                                  zh: '建立安全睡眠环境（硬床垫，无软性床品）' },
      { id: '0_1m_9',  category: 'nutrition',   en: 'Learn breastfeeding latch — visit BHS or lactation consultant if needed',      fil: 'Matuto ng tamang pagpapasuso — bisitahin ang BHS o lactation consultant',             zh: '学习母乳喂养姿势——如需要可访问BHS或哺乳顾问' },
      { id: '0_1m_10', category: 'development', en: 'Check for postpartum blues — Nanay\'s mental health matters too 💙',           fil: 'Tingnan ang postpartum blues — mahalaga rin ang mental health ni Nanay 💙',           zh: '关注产后情绪——妈妈的心理健康同样重要 💙' },
      { id: '0_1m_11', category: 'medical',     en: 'Identify nearest BHS/RHU for future vaccines + checkups',                     fil: 'Alamin ang pinakamalapit na BHS/RHU para sa mga susunod na bakuna',                   zh: '找到最近的社区卫生站/农村卫生所，用于未来疫苗和体检' },
    ],
  },
  {
    key: '1_3m',
    labelKey: 'milestones.stage_1_3m',
    emoji: 'flower',
    items: [
      { id: '1_3m_1', category: 'medical',     en: '6-week vaccines at BHS: Pentavalent (1), OPV (1), PCV (1), Rotavirus (1)',    fil: 'Bakuna sa 6 na linggo sa BHS: Pentavalent (1), OPV (1), PCV (1), Rotavirus (1)',   zh: '6周疫苗（BHS）：五联苗(1)、OPV(1)、PCV(1)、轮状病毒(1)' },
      { id: '1_3m_2', category: 'medical',     en: '10-week vaccines: Pentavalent (2), OPV (2), PCV (2), Rotavirus (2)',          fil: 'Bakuna sa 10 linggo: Pentavalent (2), OPV (2), PCV (2), Rotavirus (2)',             zh: '10周疫苗：五联苗(2)、OPV(2)、PCV(2)、轮状病毒(2)' },
      { id: '1_3m_3', category: 'medical',     en: '1-month well-baby checkup',                                                   fil: '1-buwang well-baby checkup',                                                         zh: '1个月体检' },
      { id: '1_3m_4', category: 'medical',     en: '2-month well-baby checkup',                                                   fil: '2-buwang well-baby checkup',                                                         zh: '2个月体检' },
      { id: '1_3m_5', category: 'development', en: 'Tummy time: 2–3 times daily (strengthens neck and core muscles)',              fil: 'Tummy time: 2–3 beses sa isang araw (nagpapatibay ng leeg at kalamnan)',            zh: '俯卧时间：每天2-3次（锻炼颈部和核心肌肉）' },
      { id: '1_3m_6', category: 'development', en: 'Start reading and talking to baby daily — language development begins now!',   fil: 'Magsimulang magbasa at makipag-usap sa sanggol araw-araw!',                         zh: '每天开始给宝宝读书和说话——语言发展从现在开始！' },
    ],
  },
  {
    key: '3_6m',
    labelKey: 'milestones.stage_3_6m',
    emoji: 'flower2',
    items: [
      { id: '3_6m_1', category: 'medical',     en: '14-week vaccines: Pentavalent (3), OPV (3), IPV (1), PCV (3)',                fil: 'Bakuna sa 14 linggo: Pentavalent (3), OPV (3), IPV (1), PCV (3)',                  zh: '14周疫苗：五联苗(3)、OPV(3)、IPV(1)、PCV(3)' },
      { id: '3_6m_2', category: 'medical',     en: '4-month well-baby checkup',                                                   fil: '4-buwang well-baby checkup',                                                         zh: '4个月体检' },
      { id: '3_6m_3', category: 'nutrition',   en: 'Begin watching for signs of solid food readiness (head control, interest)',    fil: 'Magsimulang bantayan ang mga tanda ng pagiging handa para sa solid food',           zh: '开始关注辅食准备信号（头部控制、对食物感兴趣）' },
      { id: '3_6m_4', category: 'safety',      en: 'Baby-proof the home — baby will start rolling and grabbing soon!',            fil: 'Baby-proof ang bahay — magsisimula nang lumikot ang sanggol!',                     zh: '做好家居安全防护——宝宝很快就会翻身和抓东西！' },
      { id: '3_6m_5', category: 'medical',     en: 'If Garantisadong Pambata month (Jan or Jul): visit BHS for free Vitamin A',   fil: 'Kung Garantisadong Pambata month (Ene o Hul): bisitahin ang BHS para sa libreng Vitamin A', zh: '如是Garantisadong Pambata月（1月或7月）：去BHS领取免费维生素A' },
    ],
  },
  {
    key: '6_9m',
    labelKey: 'milestones.stage_6_9m',
    emoji: 'sunflower',
    items: [
      { id: '6_9m_1', category: 'medical',     en: '6-month well-baby checkup',                                                   fil: '6-buwang well-baby checkup',                                                         zh: '6个月体检' },
      { id: '6_9m_2', category: 'nutrition',   en: 'Start solid foods (single-ingredient purees: kamote, kalabasa, saging)',       fil: 'Simulan ang solid foods (iisang sangkap na puree: kamote, kalabasa, saging)',      zh: '开始辅食（单一成分泥：甘薯、南瓜、香蕉）' },
      { id: '6_9m_3', category: 'nutrition',   en: 'Introduce iron-rich foods (chicken, fish, malunggay fortified lugaw)',         fil: 'Ipakilala ang mga pagkaing mayaman sa iron (manok, isda, lugaw na may malunggay)', zh: '引入富铁食物（鸡肉、鱼、加辣木叶稀粥）' },
      { id: '6_9m_4', category: 'nutrition',   en: 'Introduce a sippy cup with water alongside solid meals',                      fil: 'Ipakilala ang sippy cup na may tubig kasabay ng solid meals',                      zh: '开始使用吸管杯喝水（配合辅食）' },
      { id: '6_9m_5', category: 'development', en: 'Begin exposing to multiple languages at home (EN/FIL/ZH)',                    fil: 'Simulan ang paglalantad sa maraming wika sa bahay (EN/FIL/ZH)',                    zh: '开始在家接触多种语言（EN/FIL/ZH）' },
      { id: '6_9m_6', category: 'medical',     en: 'Schedule Influenza vaccine (private, optional but recommended)',               fil: 'Mag-schedule ng Influenza vaccine (pribado, opsyonal ngunit inirerekomenda)',       zh: '安排流感疫苗（自费，可选但推荐）' },
    ],
  },
  {
    key: '9_12m',
    labelKey: 'milestones.stage_9_12m',
    emoji: 'star',
    items: [
      { id: '9_12m_1', category: 'medical',   en: '9-month vaccines: MMR (1), Hepatitis A (1) — check with Pedia',               fil: 'Bakuna sa 9 buwan: MMR (1), Hepatitis A (1) — alamin sa Pedia',                   zh: '9个月疫苗：MMR(1)、甲肝(1)——与医生确认' },
      { id: '9_12m_2', category: 'medical',   en: '9-month well-baby checkup',                                                   fil: '9-buwang well-baby checkup',                                                         zh: '9个月体检' },
      { id: '9_12m_3', category: 'nutrition', en: 'Transition to soft finger foods',                                              fil: 'Mag-transition sa malambot na finger foods',                                        zh: '过渡到软质手指食物' },
      { id: '9_12m_4', category: 'safety',    en: 'Install cabinet/drawer locks and outlet covers (baby is mobile now!)',         fil: 'Mag-install ng cabinet/drawer locks at outlet covers (malikot na ang sanggol!)',   zh: '安装柜子/抽屉锁和插座盖（宝宝现在会动了！）' },
      { id: '9_12m_5', category: 'safety',    en: 'Forward-facing car seat check (if using car)',                                 fil: 'Suriin ang forward-facing car seat (kung gumagamit ng kotse)',                     zh: '检查前向儿童安全座椅（如使用汽车）' },
    ],
  },
  {
    key: '12_18m',
    labelKey: 'milestones.stage_12_18m',
    emoji: 'party-popper',
    items: [
      { id: '12_18m_1', category: 'medical',     en: '12-month well-baby checkup',                                                fil: '12-buwang well-baby checkup',                                                        zh: '12个月体检' },
      { id: '12_18m_2', category: 'medical',     en: 'Vaccines at 12M: Varicella (1), Hep A (2), Typhoid (discuss with Pedia)',   fil: 'Bakuna sa 12M: Varicella (1), Hep A (2), Typhoid (pag-usapan sa Pedia)',          zh: '12月疫苗：水痘(1)、甲肝(2)、伤寒（与医生商议）' },
      { id: '12_18m_3', category: 'medical',     en: 'MMR (2) at 12–15 months',                                                  fil: 'MMR (2) sa 12–15 buwan',                                                           zh: '12-15个月接种MMR(2)' },
      { id: '12_18m_4', category: 'medical',     en: 'DPT Booster + OPV Booster at 15–18 months',                                fil: 'DPT Booster + OPV Booster sa 15–18 buwan',                                        zh: '15-18个月接种DPT加强针+OPV加强针' },
      { id: '12_18m_5', category: 'nutrition',   en: 'Transition from formula/bottle to cow\'s milk in cup (after 12 months)',   fil: 'Mag-transition mula sa formula/bote sa gatas ng baka sa tasa',                   zh: '从配方奶/奶瓶过渡到杯子喝牛奶（12个月后）' },
      { id: '12_18m_6', category: 'medical',     en: 'Dental checkup — first tooth means first dental visit!',                    fil: 'Dental checkup — ang unang ngipin ay nangangahulugang unang pagbisita sa dentista!', zh: '牙科检查——第一颗牙意味着第一次看牙！' },
      { id: '12_18m_7', category: 'safety',      en: 'Toddler-proof home (stair gates, secure heavy furniture)',                  fil: 'Toddler-proof ang bahay (stair gates, i-secure ang mabibigat na kasangkapan)',    zh: '幼儿防护家居（楼梯安全门，固定重家具）' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// FIRST TIMES (Memory Book)
// ─────────────────────────────────────────────────────────────────────────────

export const FIRST_TIMES: FirstTimeCategory[] = [
  { id: 'smile',      emoji: 'smile',          labelEn: 'First Smile',        labelFil: 'Unang Ngiti',             labelZh: '第一次微笑' },
  { id: 'laugh',      emoji: 'laugh',          labelEn: 'First Laugh',        labelFil: 'Unang Tawa',              labelZh: '第一次大笑' },
  { id: 'roll',       emoji: 'rotate-ccw',     labelEn: 'First Roll Over',    labelFil: 'Unang Pag-ikot',          labelZh: '第一次翻身' },
  { id: 'sit',        emoji: 'armchair',       labelEn: 'First Sit',          labelFil: 'Unang Pag-upo',           labelZh: '第一次独坐' },
  { id: 'crawl',      emoji: 'bug',            labelEn: 'First Crawl',        labelFil: 'Unang Paggapang',         labelZh: '第一次爬行' },
  { id: 'steps',      emoji: 'footprints',     labelEn: 'First Steps',        labelFil: 'Unang Hakbang',           labelZh: '第一步' },
  { id: 'word',       emoji: 'message-circle', labelEn: 'First Word',         labelFil: 'Unang Salita',            labelZh: '第一个词',       hasNote: true, noteLabelEn: 'What was the word?', noteLabelFil: 'Anong salita?', noteLabelZh: '说的是什么词？' },
  { id: 'tooth',      emoji: 'candy',          labelEn: 'First Tooth',        labelFil: 'Unang Ngipin',            labelZh: '第一颗牙' },
  { id: 'solid_food', emoji: 'utensils',       labelEn: 'First Solid Food',   labelFil: 'Unang Solid na Pagkain',  labelZh: '第一次辅食',     hasNote: true, noteLabelEn: 'What food?',       noteLabelFil: 'Anong pagkain?', noteLabelZh: '吃的是什么食物？' },
  { id: 'bath',       emoji: 'bath',           labelEn: 'First Bath',         labelFil: 'Unang Paligo',            labelZh: '第一次洗澡' },
  { id: 'haircut',    emoji: 'scissors',       labelEn: 'First Haircut',      labelFil: 'Unang Gupit ng Buhok',    labelZh: '第一次剪头发' },
  { id: 'birthday',   emoji: 'cake',           labelEn: 'First Birthday',     labelFil: 'Unang Kaarawan',          labelZh: '第一个生日' },
];

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN META (labels + colors + emoji)
// ─────────────────────────────────────────────────────────────────────────────

export const DOMAIN_META: Record<MilestoneDomain, {
  emoji: string; color: string; bgColor: string; labelKey: string;
}> = {
  social:    { emoji: 'heart', color: '#E63B6F', bgColor: '#FFE4EE', labelKey: 'milestones.domain_social' },
  cognitive: { emoji: 'brain', color: '#7B5CF0', bgColor: '#EDE8FF', labelKey: 'milestones.domain_cognitive' },
  language:  { emoji: 'message-circle', color: '#1A73C8', bgColor: '#E8F2FF', labelKey: 'milestones.domain_language' },
  motor:     { emoji: 'activity', color: '#27AE7A', bgColor: '#E0F7EF', labelKey: 'milestones.domain_motor' },
};
