/**
 * articles.ts — BabyBloom PH Parenting Encyclopedia
 * 14 evidence-based, Philippines-specific articles (EN / FIL / ZH)
 * Sources: WHO, DOH PH, PPS, AAP, UNICEF PH, PSA, PhilHealth, FNRI, PGH
 */

export type AgeStage =
  | 'pregnancy' | 'newborn' | '1-3m' | '3-6m'
  | '6-9m' | '9-12m' | '1-2y' | '2-3y' | '3-6y';

export type Topic =
  | 'feeding' | 'sleep' | 'development' | 'health'
  | 'safety' | 'mental_health' | 'traditions' | 'admin';

export interface Article {
  id: string;
  slug: string;
  title:        { en: string; fil: string; zh: string };
  summary:      { en: string; fil: string; zh: string };
  body:         { en: string; fil: string; zh: string };
  keyTakeaways: { en: string[]; fil: string[]; zh: string[] };
  ageStages:    AgeStage[];
  topics:       Topic[];
  sources:      string[];
  isPHSpecific: boolean;
  readMinutes:  number;
  categoryColor: string;
  isRecommended: boolean;
}

export const ARTICLES: Article[] = [

  // ─── 1. Breastfeeding 101 ──────────────────────────────────────────────────
  {
    id: 'bf-101',
    slug: 'breastfeeding-101',
    title: {
      en:  'Breastfeeding 101: A Guide for New Moms',
      fil: 'Breastfeeding 101 para sa Bagong Nanay',
      zh:  '母乳喂养101：新妈妈完全指南',
    },
    summary: {
      en:  'Everything you need to know about breastfeeding — from colostrum to latch technique to building your milk supply.',
      fil: 'Lahat ng kailangan mong malaman tungkol sa breastfeeding — mula sa colostrum hanggang tamang latch at pagpapalaki ng gatas.',
      zh:  '关于母乳喂养你需要知道的一切——从初乳到含乳技巧，再到建立奶水供应。',
    },
    body: {
      en: `## The First Hour Matters

The WHO and DOH Philippines recommend breastfeeding **within the first hour of birth**. This first feed delivers colostrum — a thick, golden milk packed with antibodies, growth factors, and white blood cells that protect your newborn from infections. Even a teaspoon matters enormously for immunity.

## Getting the Latch Right

A proper latch is the foundation of successful breastfeeding and prevents nipple pain:

- Baby's mouth covers most of the dark areola, not just the nipple
- Chin touches your breast; nose is free to breathe
- Lips are flanged outward; you can hear swallowing
- Never sharp pain — adjust position if it hurts

If it hurts, gently break suction with your clean finger and try again. Ask your BHS midwife for help.

## How Often to Feed

Newborns need **8–12 feeds every 24 hours**. Feed on demand by watching hunger cues:

- **Early cues**: rooting (turning head), sucking fingers, hands to mouth
- **Late cue**: crying — try to feed before baby reaches this stage

Let baby fully finish one breast before offering the other to get fat-rich hindmilk.

## Building Your Milk Supply

Milk supply works on demand — the more your baby feeds, the more you make. Avoid supplementing with formula in the first weeks unless medically necessary, as this reduces supply.

> Feeling engorged? Frequent feeding and warm compresses help. It usually settles within days.

## Free Support in the Philippines

Every Barangay Health Station (BHS) and Rural Health Unit (RHU) has trained Barangay Health Workers and midwives providing **free breastfeeding support**. DOH recommends **exclusive breastfeeding for the first 6 months**, then alongside solid foods up to 2 years.`,

      fil: `## Ang Unang Oras

Inirerekomenda ng WHO at DOH Pilipinas ang breastfeeding **sa loob ng unang oras pagkatapos manganak**. Ang unang gatas (colostrum) ay puno ng antibodies na nagpoprotekta sa iyong sanggol mula sa impeksyon.

## Tamang Latch

Ang tamang latch ay susi sa matagumpay na breastfeeding:

- Dapat sumasaklaw ang bibig sa karamihan ng areola, hindi lang ang utong
- Ang baba ay nakaabot sa dibdib; ang ilong ay malaya
- Ang mga labi ay nakakalat palabas; maririnig ang paglunok
- Hindi dapat masakit — i-adjust kung masakit

## Gaano Kadalas Magpasuso?

Kailangan ng mga newborn ng **8–12 beses sa loob ng 24 oras**. Magpasuso kapag nagpapakita ng mga tanda ng gutom:

- **Maagang tanda**: nagrorooting, nagsu-suck ng daliri
- **Huling tanda**: umiiyak — subukang magpasuso bago umabot dito

## Pagpapalaki ng Supply

Ang produksyon ng gatas ay nakasalalay sa demand — mas madalas na pagpapasuso = mas maraming gatas. Sa unang linggo, iwasang magdagdag ng formula maliban kung kinakailangan.

> Namamaga ang dibdib? Ang madalas na pagpapasuso at mainit na compress ay tumutulong.

## Libreng Tulong

Sa bawat BHS at RHU, may mga trained na midwife at BHW na nagbibigay ng **libreng tulong sa breastfeeding**. Inirerekomenda ng DOH ang **eksklusibong breastfeeding sa unang 6 buwan**.`,

      zh: `## 出生后第一小时

世界卫生组织（WHO）和菲律宾卫生部建议在**分娩后一小时内**开始哺乳。初乳富含抗体和生长因子，即使只有几毫升，对新生儿免疫力也至关重要。

## 正确含乳姿势

正确含乳是成功哺乳的基础：

- 宝宝嘴巴包住大部分乳晕，而非只有乳头
- 下巴贴乳房，鼻子可自由呼吸
- 嘴唇向外翻；可以听到吞咽声
- 若感到疼痛，立即调整——正确含乳不应有疼痛

## 哺乳频率

新生儿每24小时需**哺乳8-12次**。按需哺乳，观察饥饿信号（找奶、吸手指），而非时钟。

## 建立奶量

奶量靠需求维持——喂得越多，产量越多。前几周避免用奶粉补充，以免影响奶量。

> 乳房胀痛？频繁喂奶和热敷有帮助，通常几天内会缓解。

## 在菲律宾获得免费支持

每个BHS和RHU都有免费母乳喂养支持。DOH推荐**纯母乳喂养6个月**，之后继续母乳至2岁。`,
    },
    keyTakeaways: {
      en: [
        'Initiate breastfeeding within the first hour — colostrum is liquid gold packed with immunity',
        'Feed on demand 8–12 times every 24 hours, watching hunger cues not the clock',
        'A good latch is pain-free — baby covers most of the areola, not just the nipple',
        'Free lactation support is available at every BHS and RHU in the Philippines',
      ],
      fil: [
        'Simulan ang breastfeeding sa loob ng unang oras — ang colostrum ay punong-puno ng immunity',
        'Magpasuso 8–12 beses sa loob ng 24 oras; hintayin ang tanda ng gutom, hindi ang orasan',
        'Ang tamang latch ay hindi masakit — sumasaklaw ang bibig sa karamihan ng areola',
        'May libreng breastfeeding support sa bawat BHS at RHU sa Pilipinas',
      ],
      zh: [
        '分娩后1小时内开始母乳喂养——初乳是"液体黄金"，富含免疫力',
        '按需哺乳，每24小时8-12次；看饥饿信号，不看时钟',
        '正确含乳不应疼痛——宝宝嘴巴包住大部分乳晕',
        '菲律宾每个BHS和RHU都有免费母乳喂养支持',
      ],
    },
    ageStages: ['newborn', '1-3m', '3-6m'],
    topics: ['feeding'],
    sources: ['WHO', 'DOH PH', 'PPS'],
    isPHSpecific: true,
    readMinutes: 5,
    categoryColor: '#27AE7A',
    isRecommended: true,
  },

  // ─── 2. Safe Co-Sleeping ──────────────────────────────────────────────────
  {
    id: 'cosleep',
    slug: 'safe-co-sleeping',
    title: {
      en:  'Safe Co-Sleeping: The Right Way',
      fil: 'Ligtas na Co-Sleeping: Ang Tamang Paraan',
      zh:  '安全同床：正确的方式',
    },
    summary: {
      en:  'Co-sleeping is common in Filipino families. Here is how to do it safely — and when it becomes dangerous.',
      fil: 'Karaniwan ang co-sleeping sa mga pamilyang Pilipino. Narito kung paano ito gawin nang ligtas at kung kailan ito nagiging mapanganib.',
      zh:  '同床睡在菲律宾家庭很普遍。以下是安全做法及危险情况的指南。',
    },
    body: {
      en: `## Co-Sleeping in Filipino Culture

Sharing a sleeping space with your baby is a deeply rooted Filipino cultural practice. Research shows that **room-sharing** (baby in same room, different surface) does reduce SIDS risk. The key is doing it safely.

## The Safe Sleep 7 (UNICEF PH)

If you choose bed-sharing, ALL 7 conditions must be met:

1. **Non-smoker** — even outdoor smoking leaves chemicals on skin and clothing
2. **Sober** — no alcohol, sedating medications, or drugs
3. **Not exhausted** — extreme fatigue impairs awareness of baby
4. **Baby is healthy and full-term**
5. **Baby is on their back**
6. **Firm, flat surface** — not a sofa, armchair, or waterbed
7. **Baby lightly dressed** — no overheating risk

## What to Remove from the Sleep Area

- Heavy blankets, duvets, and pillows near baby's face
- Stuffed animals or loose items
- Gaps between mattress and wall where baby could become trapped

## When Co-Sleeping Is Dangerous

> NEVER co-sleep on a sofa or armchair — these cause the most infant sleep deaths. A baby can slip into a position they cannot escape.

Also avoid if: you or partner smokes, either parent consumed alcohol, baby was premature or has medical conditions.

## Safest Alternative: Room-Sharing

A firm crib or bassinet beside your bed gives closeness for night feeds while keeping baby in the safest sleep environment.`,

      fil: `## Co-Sleeping sa Kulturang Pilipino

Ang pagtulog kasama ang sanggol ay isang kilalang kaugalian sa Pilipinas. Ang room-sharing (magkaibang higaan sa iisang kwarto) ay napatunayan na nakakatulong na mabawasan ang SIDS. Ngunit kung magbabahagi ng higaan, kailangan ang lahat ng 7 kondisyon ng kaligtasan.

## Ang Safe Sleep 7 (UNICEF PH)

Kung magde-decide kang matulog kasama ang sanggol sa iisang higaan:

1. **Hindi naninigarilyo** — kahit labas, ang chemicals ay nananatili sa balat at damit
2. **Hindi nakainom ng alak o gamot na nakakatulog**
3. **Hindi sobrang pagod**
4. **Malusog at full-term ang sanggol**
5. **Nakaharap pataas ang sanggol**
6. **Sa matibay na kutson** — hindi sofa o waterbed
7. **Magaang lang ang damit ng sanggol**

## Mga Dapat Iwasan

- Makakal na kumot, unan, at mga malambot na laruan malapit sa mukha ng sanggol
- Mga agwat sa pagitan ng kutson at pader

## Kailan Nagiging Mapanganib

> HUWAG KAILANMAN matulog kasama ang sanggol sa sofa o silyon — ito ang pinaka-mapanganib.

Iwasan din kung ang magulang ay naninigarilyo, nakainom, o sobrang pagod.

## Ang Pinakamainam: Room-Sharing

Ang paglalagay ng kuna sa tabi ng iyong higaan ay nagbibigay ng closeness para sa night feeds nang hindi nanganganib ang sanggol.`,

      zh: `## 同床文化

在菲律宾，与宝宝同睡是常见的文化习俗。研究表明，**同房不同床**可以降低婴儿猝死风险。关键是要安全地进行。

## 安全同床七要素（UNICEF PH）

选择同床睡，必须满足以下**所有7个条件**：

1. 不吸烟——即使室外吸烟，化学物质仍留在皮肤和衣物上
2. 未饮酒或服用镇静药物
3. 不过度疲劳
4. 宝宝健康且足月
5. 宝宝仰面朝上
6. 坚实平坦的床垫——不是沙发或水床
7. 宝宝穿着轻便——避免过热

## 危险情况

> **绝不**在沙发或扶手椅上与宝宝同睡——这是最危险的场景。

若父母吸烟、饮酒，或宝宝早产，请避免同床睡。

## 最安全的替代方案

在您床边放一张婴儿床，既方便夜间哺乳，又能为宝宝提供最安全的睡眠环境。`,
    },
    keyTakeaways: {
      en: [
        'Always use a firm, flat sleep surface — never a sofa, armchair, or waterbed',
        'Keep pillows and heavy blankets away from baby\'s face and head',
        'Never co-sleep if you consumed alcohol, sedating medication, or are extremely fatigued',
        'Room-sharing (same room, separate surface) is the safest option per WHO and UNICEF',
      ],
      fil: [
        'Gumamit ng matibay at patag na ibabaw ng tulugan — hindi sofa o malambot na kutson',
        'Panatilihing malayo ang mga unan at makapal na kumot mula sa mukha ng sanggol',
        'Huwag mag-co-sleep kung nakainom ka ng alak o gamot na pampantok',
        'Ang room-sharing ay ang pinakaligtas na pagpipilian ayon sa WHO at UNICEF',
      ],
      zh: [
        '始终使用坚实平坦的睡眠表面——绝不在沙发或扶手椅上',
        '将枕头和厚重毯子远离宝宝的脸和头',
        '饮酒、服用镇静药物或极度疲劳时，绝不同床睡',
        '同房不同床是WHO和UNICEF推荐的最安全选择',
      ],
    },
    ageStages: ['newborn', '1-3m', '3-6m', '6-9m'],
    topics: ['sleep', 'safety'],
    sources: ['UNICEF PH', 'AAP', 'PPS'],
    isPHSpecific: true,
    readMinutes: 4,
    categoryColor: '#5C6BC0',
    isRecommended: true,
  },

  // ─── 3. MCH Booklet ───────────────────────────────────────────────────────
  {
    id: 'mch-booklet',
    slug: 'mch-booklet-guide',
    title: {
      en:  'Your MCH Booklet: A Complete Guide',
      fil: 'Ang MCH Booklet: Ang Iyong Gabay',
      zh:  'MCH母婴健康手册：完整指南',
    },
    summary: {
      en:  'The Mother and Child Health (MCH) Booklet is your baby\'s official health record. Learn what it contains, why it matters, and how to use it.',
      fil: 'Ang MCH Booklet ay ang opisyal na health record ng iyong sanggol. Alamin kung ano ang laman nito, bakit mahalaga, at paano gamitin.',
      zh:  'MCH手册是宝宝的官方健康记录。了解其内容、重要性及使用方法。',
    },
    body: {
      en: `## What Is the MCH Booklet?

The Mother and Child Health (MCH) Booklet is a free government-issued health record provided by DOH Philippines at every Barangay Health Station (BHS) and hospital. It serves as your baby's complete health passport from birth through school age.

## What It Contains

- Immunization record (aligned with DOH EPI schedule)
- Growth monitoring charts (weight, height, head circumference)
- Developmental milestones checklist
- Nutrition and feeding guide
- Mother's prenatal and delivery history

## Why It Matters

> The MCH Booklet is required for school enrollment and many government benefits. Always bring it to every clinic visit.

It is your baby's official health document and proof of vaccinations. Private pediatricians and public health centers both use it.

## BabyBloom PH Is Your Digital MCH Companion

This app tracks all the same data digitally, but your physical MCH Booklet remains the official document. Use BabyBloom to record data on the go, then update your physical booklet when you visit the BHS.

## Lost or Damaged?

Request a replacement at your nearest BHS or RHU — it is free of charge. Bring valid ID and your baby's birth certificate.

## Tips for Keeping It Safe

- Keep it in a waterproof pouch
- Take a photo of each page for digital backup
- Bring it to every health visit, vaccination, and checkup`,

      fil: `## Ano ang MCH Booklet?

Ang Mother and Child Health (MCH) Booklet ay isang libreng health record na ibinibigay ng DOH Pilipinas sa bawat Barangay Health Station (BHS) at ospital. Ito ang opisyal na health passport ng iyong anak mula pagsilang hanggang school age.

## Ano ang Laman Nito?

- Talaan ng mga bakuna (ayon sa DOH EPI schedule)
- Growth monitoring charts (timbang, taas, ulo)
- Checklist ng developmental milestones
- Gabay sa nutrisyon at pagpapakain
- History ng pagbubuntis at panganganak ng nanay

## Bakit Mahalaga?

> Kailangan ang MCH Booklet para sa pagpapalista sa paaralan at maraming government benefits. Dalhin ito sa bawat check-up.

Ito ang opisyal na health document ng iyong sanggol. Ginagamit ito ng mga pribado at pampublikong health center.

## Nawala o Nasira?

Pumunta sa pinakamalapit na BHS o RHU para humingi ng kapalit — libre ito. Magdala ng valid ID at birth certificate ng iyong sanggol.

## Paano Panatilihing Ligtas

- Ilagay sa waterproof na sobre
- Kumuha ng larawan ng bawat pahina para sa digital backup
- Dalhin sa bawat health visit, bakuna, at check-up`,

      zh: `## 什么是MCH手册？

MCH（母婴健康）手册是菲律宾卫生部在每个BHS和医院免费发放的官方健康记录。它是宝宝从出生到学龄阶段的完整健康档案。

## 包含内容

- 疫苗接种记录（符合DOH EPI计划）
- 生长监测图表（体重、身高、头围）
- 发育里程碑清单
- 营养和喂养指南
- 母亲的产前和分娩史

## 为什么重要？

> MCH手册是学校入学和许多政府福利所必需的文件。每次就诊时务必携带。

## BabyBloom PH是您的数字MCH伴侣

本应用程序以数字方式跟踪所有相同数据，但实体MCH手册仍然是官方文件。

## 丢失或损坏？

到最近的BHS或RHU申请补办，免费。带上有效身份证和宝宝的出生证明。`,
    },
    keyTakeaways: {
      en: [
        'The MCH Booklet is free — request it at your nearest BHS or hospital at birth',
        'It is required for school enrollment and government health benefits',
        'Bring it to every vaccination, checkup, and health visit',
        'Take photos of each page as a digital backup in case it is lost',
      ],
      fil: [
        'Ang MCH Booklet ay libre — hingin ito sa pinakamalapit na BHS o ospital sa pagsilang',
        'Kinakailangan ito para sa pagpapalista sa paaralan at government health benefits',
        'Dalhin ito sa bawat bakuna, check-up, at health visit',
        'Kumuha ng larawan ng bawat pahina bilang digital backup',
      ],
      zh: [
        'MCH手册是免费的——在出生时向最近的BHS或医院索取',
        '学校入学和政府健康福利需要此文件',
        '每次接种、体检和就诊时都要携带',
        '给每页拍照作为数字备份',
      ],
    },
    ageStages: ['newborn', '1-3m'],
    topics: ['health', 'admin'],
    sources: ['DOH PH'],
    isPHSpecific: true,
    readMinutes: 3,
    categoryColor: '#1565C0',
    isRecommended: true,
  },

  // ─── 4. PSA Birth Registration ────────────────────────────────────────────
  {
    id: 'psa-reg',
    slug: 'psa-birth-registration',
    title: {
      en:  'PSA Birth Registration: Do It Within 30 Days',
      fil: 'PSA Birth Registration: Gawin Mo Sa Loob ng 30 Araw',
      zh:  'PSA出生登记：30天内完成',
    },
    summary: {
      en:  'Registering your baby\'s birth with the PSA within 30 days is legally required and affects access to PhilHealth, school, and passport.',
      fil: 'Ang pagpaparehistro ng kapanganakan ng iyong sanggol sa PSA sa loob ng 30 araw ay kinakailangan ng batas at nakakaapekto sa PhilHealth, paaralan, at pasaporte.',
      zh:  '在30天内向PSA登记宝宝出生是法律要求，影响PhilHealth、学校和护照的申请。',
    },
    body: {
      en: `## Why You Must Register Within 30 Days

Philippine law requires birth registration at your Local Civil Registry (LCR) within **30 days of birth**. After 30 days, it becomes a delayed registration — a more complex and time-consuming process requiring additional documents and affidavits.

The PSA birth certificate is required for:

- PhilHealth enrollment
- School enrollment (at all levels)
- Passport application
- SSS/GSIS benefits
- Any future legal transactions

## For Hospital-Born Babies

Most hospitals automatically report births to the LCR. Within 4–6 months, you can request your PSA-authenticated birth certificate at any PSA office or online at serbilis.psa.gov.ph.

## For Home-Born Babies

If born at home (e.g., with hilot or TBA), you must:

1. Go to your barangay for an affidavit of live birth
2. Register at your City/Municipal Civil Registrar
3. Wait for PSA processing (several months)

## Documents Needed at the LCR

- Hospital-issued Certificate of Live Birth
- Both parents' valid IDs
- Marriage Certificate (if married)
- Barangay clearance (for home births)

## Late Registration (After 30 Days)

> If you missed the 30-day window, go to your LCR immediately. The process requires additional affidavits but is still possible. The sooner, the better.

## Getting Your PSA Copy

Once registered, order authenticated PSA copies at any PSA branch or online. Cost: approximately ₱155 per copy.`,

      fil: `## Bakit Kailangan sa Loob ng 30 Araw?

Ayon sa batas ng Pilipinas, kinakailangan ang pagpaparehistro ng kapanganakan sa Local Civil Registry (LCR) sa loob ng **30 araw mula sa kapanganakan**. Pagkatapos ng 30 araw, ito ay magiging delayed registration — isang mas kumplikadong proseso.

Kinakailangan ang PSA birth certificate para sa:

- PhilHealth enrollment
- Pagpapalista sa paaralan
- Aplikasyon ng pasaporte
- SSS/GSIS benefits

## Para sa Mga Isinilang sa Ospital

Karaniwang awtomatikong iniuulat ng ospital ang kapanganakan sa LCR. Sa loob ng 4–6 buwan, maaaring kumuha ng PSA-authenticated birth certificate sa anumang PSA office.

## Para sa Mga Isinilang sa Bahay

Kung isinilang sa bahay (tulad ng sa hilot o TBA), kailangan:

1. Pumunta sa barangay para sa affidavit of live birth
2. Magparehistro sa City/Municipal Civil Registrar
3. Hintayin ang PSA processing

## Mga Kinakailangang Dokumento

- Hospital-issued Certificate of Live Birth
- Valid IDs ng magulang
- Marriage Certificate (kung kasal)

## Delayed Registration (Pagkatapos ng 30 Araw)

> Kung nalampasan ang 30-araw na palugit, pumunta agad sa LCR. Kailangan ng karagdagang mga affidavit ngunit posible pa rin.

## Pagkuha ng PSA Copy

Mag-order ng authenticated PSA copies sa anumang PSA branch o online. Halaga: humigit-kumulang ₱155 bawat kopya.`,

      zh: `## 为什么必须在30天内完成？

菲律宾法律要求在**出生后30天内**在当地民事登记处（LCR）进行出生登记。超过30天将成为延迟登记，需要额外文件和宣誓书。

PSA出生证明用于：
- PhilHealth注册
- 学校入学
- 护照申请
- SSS/GSIS福利

## 在医院出生的宝宝

大多数医院会自动向LCR报告出生。4-6个月内可在PSA办公室或网上申请经认证的出生证明。

## 在家出生的宝宝

需要：1）到村委会获取出生证明宣誓书；2）在市/区民政登记处登记；3）等待PSA处理。

## 所需文件

- 医院出具的出生证明
- 双方父母有效身份证
- 结婚证（已婚的话）

## 延迟登记

> 如果错过30天期限，请立即前往LCR。过程更复杂，但仍然可以办理。

每份PSA认证副本约₱155。`,
    },
    keyTakeaways: {
      en: [
        'Register at your Local Civil Registry (LCR) within 30 days of birth — the law requires it',
        'The PSA birth certificate is needed for school, PhilHealth, passport, and all legal transactions',
        'Hospital-born babies: the hospital files the report; you collect the PSA copy in 4–6 months',
        'Home-born babies: go to your barangay immediately for an affidavit of live birth',
      ],
      fil: [
        'Magparehistro sa Local Civil Registry (LCR) sa loob ng 30 araw — kinakailangan ng batas',
        'Kailangan ang PSA birth certificate para sa paaralan, PhilHealth, pasaporte, at iba pa',
        'Isinilang sa ospital: iniuulat ng ospital; kunin ang PSA copy pagkatapos ng 4–6 buwan',
        'Isinilang sa bahay: pumunta agad sa barangay para sa affidavit of live birth',
      ],
      zh: [
        '出生后30天内在LCR（地方民事登记处）登记——这是法律要求',
        'PSA出生证明用于学校、PhilHealth、护照及所有法律事务',
        '医院出生：医院自动报告；4-6个月后领取PSA副本',
        '在家出生：立即前往村委会办理出生证明宣誓书',
      ],
    },
    ageStages: ['newborn'],
    topics: ['admin'],
    sources: ['PSA PH'],
    isPHSpecific: true,
    readMinutes: 3,
    categoryColor: '#2E7D32',
    isRecommended: false,
  },

  // ─── 5. PhilHealth Newborn Package ───────────────────────────────────────
  {
    id: 'philhealth',
    slug: 'philhealth-newborn-care-package',
    title: {
      en:  'PhilHealth Newborn Care Package: What You Are Entitled To',
      fil: 'PhilHealth para sa Iyong Sanggol: Mga Benepisyo',
      zh:  '菲健保新生儿护理套餐：你的权利',
    },
    summary: {
      en:  'Filipino newborns are entitled to free essential care under PhilHealth. Here is what is covered and how to claim your benefits.',
      fil: 'Ang mga Pilipinong bagong silang ay may karapatang sa libreng essential na pag-aalaga sa ilalim ng PhilHealth. Narito kung ano ang saklaw at paano mag-claim.',
      zh:  '菲律宾新生儿有权享受PhilHealth免费基本护理。以下是涵盖内容和申领方法。',
    },
    body: {
      en: `## Enroll Your Newborn Within 30 Days

Under PhilHealth Circular 2019-0009, newborns must be enrolled as dependents **within 30 days of birth** to avail of full benefits. Enrollment is free.

## What the Newborn Care Package (NCP) Covers

The NCP provides essential care for healthy newborns delivered in accredited facilities:

- **Newborn screening** (hearing test, metabolic screening for 6 conditions)
- **BCG vaccination** (tuberculosis)
- **Hepatitis B birth dose**
- **Vitamin K injection**
- **Eye prophylaxis** (erythromycin eye drops)
- **Essential Newborn Care** — delayed cord clamping, skin-to-skin contact, early breastfeeding

## Benefit Amount

PhilHealth reimburses up to **₱1,750** for the NCP in accredited hospitals and lying-in clinics.

## How to Claim

1. Ensure your PhilHealth is active and contributions are up to date
2. At the hospital: fill out the PhilHealth claim form (CF2)
3. For employed members: HR should handle contributions
4. For indigent members: enroll in the Sponsored Program at your barangay

## Important Documents

- PhilHealth ID or MDR (Member Data Record)
- Valid ID of both parents
- Baby's birth certificate (when available)

> Call PhilHealth hotline: **1-800-10-441-7444** (toll-free) for clarifications.

## After the First 30 Days

Register your child as a dependent through the PhilHealth website or any PhilHealth office. Children are covered as dependents up to age 21.`,

      fil: `## I-Enroll ang Iyong Sanggol sa Loob ng 30 Araw

Ayon sa PhilHealth Circular 2019-0009, dapat i-enroll ang mga newborn bilang dependents **sa loob ng 30 araw mula sa kapanganakan** para maavail ang buong benepisyo. Libre ang enrollment.

## Ano ang Saklaw ng Newborn Care Package (NCP)?

Saklaw ng NCP ang mga sumusunod para sa malusog na newborn:

- **Newborn screening** (hearing test, metabolic screening para sa 6 na kondisyon)
- **BCG vaccination** (tuberculosis)
- **Hepatitis B birth dose**
- **Vitamin K injection**
- **Eye prophylaxis** (erythromycin eye drops)
- **Essential Newborn Care** — delayed cord clamping, skin-to-skin, maagang breastfeeding

## Halaga ng Benepisyo

Nagbabayad ang PhilHealth ng hanggang **₱1,750** para sa NCP sa mga accredited na ospital.

## Paano Mag-Claim

1. Tiyaking aktibo ang iyong PhilHealth at updated ang mga contributions
2. Sa ospital: punan ang PhilHealth claim form (CF2)
3. Para sa employed members: ang HR ang mag-hahandle ng contributions
4. Para sa indigent members: mag-enroll sa Sponsored Program sa inyong barangay

## Mahalagang Dokumento

- PhilHealth ID o MDR (Member Data Record)
- Valid ID ng magulang
- Birth certificate ng sanggol

> PhilHealth hotline: **1-800-10-441-7444** (toll-free)`,

      zh: `## 30天内为新生儿注册

根据PhilHealth第2019-0009号通告，新生儿必须在**出生后30天内**作为家属注册，才能获得全额福利。注册免费。

## 新生儿护理套餐（NCP）涵盖内容

- 新生儿筛查（听力测试、6种疾病代谢筛查）
- BCG疫苗（结核病）
- 乙肝出生剂量
- 维生素K注射
- 眼部预防（红霉素滴眼液）
- 基本新生儿护理——延迟断脐、皮肤接触、早期母乳喂养

## 福利金额

PhilHealth在认可医院最多报销**₱1,750**。

## 如何申领

1. 确保PhilHealth有效且缴费记录更新
2. 在医院填写PhilHealth申领表（CF2）
3. 受雇成员：由HR处理
4. 贫困成员：在村委会申请赞助计划

> PhilHealth热线：**1-800-10-441-7444**（免费）`,
    },
    keyTakeaways: {
      en: [
        'Enroll your newborn as a PhilHealth dependent within 30 days of birth — it is free',
        'The Newborn Care Package covers screening, BCG, Hep B, Vit K, eye drops up to ₱1,750',
        'Active PhilHealth contributions are required to claim benefits',
        'Indigent families can enroll in the PhilHealth Sponsored Program through their barangay',
      ],
      fil: [
        'I-enroll ang iyong newborn bilang PhilHealth dependent sa loob ng 30 araw — libre',
        'Saklaw ng NCP ang screening, BCG, Hep B, Vit K, eye drops hanggang ₱1,750',
        'Kailangan ng aktibong PhilHealth contributions para ma-claim ang benepisyo',
        'Ang indigent na pamilya ay maaaring mag-enroll sa PhilHealth Sponsored Program sa barangay',
      ],
      zh: [
        '在出生后30天内将新生儿注册为PhilHealth家属——免费',
        'NCP涵盖筛查、BCG、乙肝、维生素K、滴眼液，最高报销₱1,750',
        '申领福利需要有效的PhilHealth缴费记录',
        '贫困家庭可通过村委会申请PhilHealth赞助计划',
      ],
    },
    ageStages: ['newborn'],
    topics: ['health', 'admin'],
    sources: ['PhilHealth PH'],
    isPHSpecific: true,
    readMinutes: 4,
    categoryColor: '#C62828',
    isRecommended: false,
  },

  // ─── 6. Starting Solid Foods ──────────────────────────────────────────────
  {
    id: 'solids-intro',
    slug: 'when-to-start-solid-foods',
    title: {
      en:  'When to Start Solid Foods: Signs of Readiness',
      fil: 'Kailan Magsimula ng Solid Foods?',
      zh:  '何时开始添加辅食？',
    },
    summary: {
      en:  'WHO recommends starting solid foods around 6 months. Learn the signs of readiness, best first foods, and what to avoid.',
      fil: 'Inirerekomenda ng WHO ang pagsisimula ng solid foods sa paligid ng 6 na buwan. Alamin ang mga tanda ng pagiging handa, pinakamainam na unang pagkain, at kung ano ang dapat iwasan.',
      zh:  'WHO建议约6个月时开始添加辅食。了解准备好的迹象、最佳初始食物和应避免的事项。',
    },
    body: {
      en: `## When Is the Right Time?

WHO, DOH Philippines, and PPS recommend starting solid foods at **around 6 months** of age, after a period of exclusive breastfeeding. Do NOT start before 4 months — the digestive system is not ready.

## The 4 Signs of Readiness

Your baby is ready for solids when they can:

1. **Hold their head up** steadily without support
2. **Sit with minimal support** (high chair or your lap)
3. **Show interest in food** — reaching for your food, watching you eat
4. **Lost the tongue-thrust reflex** — no longer automatically pushes food out

## Best First Foods

- **Iron-rich foods**: iron-fortified lugaw (rice porridge), mashed chicken or fish, mashed monggo
- **Soft vegetables**: kalabasa (squash), kamote (sweet potato), sayote — cooked and mashed
- **Soft fruits**: saging (banana), papaya, mango — well ripened and mashed

> Lugaw is a perfect first food for Filipino babies — add a little malunggay powder or mashed chicken for extra nutrition.

## Texture Progression

- **6 months**: smooth purees and thick mashes
- **7–8 months**: mashed with small soft lumps
- **9–12 months**: soft finger foods cut into small pieces
- **12 months+**: chopped family foods

## What NOT to Add

- Salt, sugar, or honey (NO honey before 1 year — risk of infant botulism)
- Cow's milk as a main drink (small amounts as ingredient is fine)
- Introduce one new food every 3–5 days to watch for reactions

## Allergen Introduction

Current evidence supports introducing common allergens (egg, peanut products, fish) **early**, around 6 months, not waiting. This may actually reduce allergy risk. Discuss with your pediatrician.`,

      fil: `## Kailan Ang Tamang Oras?

Inirerekomenda ng WHO, DOH Pilipinas, at PPS ang pagsisimula ng solid foods sa **paligid ng 6 buwan** pagkatapos ng eksklusibong breastfeeding. HUWAG magsimula bago mag-4 na buwan — hindi pa handa ang digestive system.

## Ang 4 na Tanda ng Pagiging Handa

Handa na ang iyong sanggol para sa solids kapag:

1. **Nakakapagtayo ng ulo** nang walang suporta
2. **Nakakaupo nang may kaunting suporta**
3. **Nagpapakita ng interes sa pagkain** — umaabot sa iyong pagkain
4. **Nawala ang tongue-thrust reflex** — hindi na awtomatikong tinutulak palabas ang pagkain

## Pinakamainam na Unang Pagkain

- **Iron-rich foods**: iron-fortified lugaw, mashed manok o isda, mashed monggo
- **Malambot na gulay**: kalabasa, kamote, sayote — luto at minasa
- **Malambot na prutas**: saging, papaya, mangga — hinog at minasa

> Ang lugaw ay perpektong unang pagkain para sa mga sanggol na Pilipino — magdagdag ng kaunting malunggay powder para sa karagdagang nutrisyon.

## Pag-unlad ng Texture

- **6 buwan**: maliksi at makapal na puree
- **7–8 buwan**: may maliit na piraso
- **9–12 buwan**: malambot na finger foods
- **12 buwan+**: tinadtad na pagkain ng pamilya

## Huwag Dagdagan

- Asin, asukal, o pulot-pukyutan (WALA nang pulot-pukyutan bago mag-1 taon — botulism risk)
- Mag-introduce ng isang bagong pagkain bawat 3–5 araw`,

      zh: `## 什么时候合适？

WHO、菲律宾卫生部和PPS建议在纯母乳喂养后，约**6个月**开始添加辅食。**不要在4个月前**开始——消化系统尚未准备好。

## 准备好的4个迹象

1. 可以稳定地抬头
2. 可以在少量支撑下坐立
3. 对食物表现出兴趣
4. 失去了舌头推挤反射

## 最佳初始食物

- 富含铁的食物：铁强化米糊、捣碎的鸡肉或鱼
- 软蔬菜：南瓜、红薯——煮熟并捣碎
- 软水果：香蕉、木瓜——成熟并捣碎

## 质地进阶

6个月：光滑泥状→7-8个月：带小块→9-12个月：软指状食物→12个月以上：切碎的家庭食物

## 不要添加

- 盐、糖或蜂蜜（**1岁前绝对不能给蜂蜜**——婴儿肉毒杆菌风险）
- 每次引入一种新食物，观察3-5天`,
    },
    keyTakeaways: {
      en: [
        'Start solids at around 6 months — not before 4 months — after exclusive breastfeeding',
        'Look for 4 signs of readiness: head control, sitting, food interest, no tongue-thrust reflex',
        'Begin with iron-rich foods — iron-fortified lugaw, mashed chicken, monggo, or soft vegetables',
        'Never add honey before 1 year — it carries a risk of infant botulism',
      ],
      fil: [
        'Magsimula ng solids sa paligid ng 6 buwan — hindi bago mag-4 buwan — pagkatapos ng eksklusibong breastfeeding',
        'Hanapin ang 4 na tanda ng pagiging handa: kontrol ng ulo, nakakaupo, interesado sa pagkain, nawala ang tongue-thrust reflex',
        'Magsimula sa mga iron-rich foods — iron-fortified lugaw, mashed manok, monggo, o malambot na gulay',
        'Huwag magbigay ng pulot-pukyutan bago mag-1 taon — botulism risk',
      ],
      zh: [
        '纯母乳喂养后，约6个月开始添加辅食——不早于4个月',
        '寻找4个准备好的迹象：头部控制、坐立、对食物感兴趣、无舌头推挤反射',
        '从富含铁的食物开始——铁强化米糊、捣碎的鸡肉、绿豆或软蔬菜',
        '1岁前绝不给蜂蜜——婴儿肉毒杆菌风险',
      ],
    },
    ageStages: ['3-6m', '6-9m'],
    topics: ['feeding'],
    sources: ['WHO', 'PPS', 'DOH PH'],
    isPHSpecific: false,
    readMinutes: 5,
    categoryColor: '#E65100',
    isRecommended: true,
  },

  // ─── 7. Malunggay & Kamote Superfoods ─────────────────────────────────────
  {
    id: 'superfoods',
    slug: 'malunggay-kamote-superfoods',
    title: {
      en:  'Malunggay & Kamote: Local Superfoods for Your Baby',
      fil: 'Malunggay at Kamote: Superfoods para sa Iyong Sanggol',
      zh:  '辣木与甘薯：宝宝的本地超级食物',
    },
    summary: {
      en:  'The Philippines has incredible local superfoods that are perfect for baby nutrition. Discover how to use malunggay, kamote, and more.',
      fil: 'Ang Pilipinas ay may mga kahanga-hangang lokal na superfoods na perpekto para sa nutrisyon ng sanggol. Alamin kung paano gamitin ang malunggay, kamote, at marami pa.',
      zh:  '菲律宾有令人惊叹的本地超级食物，非常适合宝宝营养。了解如何使用辣木、甘薯等。',
    },
    body: {
      en: `## Why Local Superfoods?

The Philippines has some of the world's most nutrient-dense local foods. They are **affordable, accessible at any palengke**, and perfectly suited for baby's complementary feeding. No imported supplements needed.

## Malunggay (Moringa)

Malunggay leaves are a nutritional powerhouse:

- **7x more vitamin C** than oranges
- **4x more calcium** than milk
- **3x more potassium** than bananas
- Rich in iron, protein, and antioxidants

**For baby**: Blend fresh malunggay leaves into lugaw (remove stems). Start with a small amount (1 tsp) as the flavor is strong. Also available as dried powder.

**For breastfeeding moms**: FNRI PH research shows malunggay may help increase milk supply. It is commonly used as a galactagogue in the Philippines.

## Kamote (Sweet Potato)

Kamote is one of the best first foods for babies:

- Rich in **beta-carotene** (converts to Vitamin A — essential for eye development and immunity)
- Good source of **vitamin C, potassium, and fiber**
- Naturally sweet — babies love it

**Orange vs. Purple kamote**: Orange has more beta-carotene; purple has antioxidants. Both are excellent.

**Preparation**: Steam or boil until very soft, then mash. No salt, no sugar.

## Other Filipino Superfoods

- **Kalabasa** (squash) — excellent beta-carotene source, very soft when cooked
- **Saging na Saba** (cooking banana) — potassium, energy, easy to digest
- **Monggo** (mung beans) — iron and plant protein, blend into smooth porridge
- **Papaya** — digestive enzymes, vitamin C, very easy to mash

> All of these can be found fresh at your local palengke for just a few pesos.`,

      fil: `## Bakit Lokal na Superfoods?

Ang Pilipinas ay may ilan sa mga pinaka-nutritious na pagkain sa mundo. Ang mga ito ay **abot-kaya, makikita sa palengke**, at perpekto para sa complementary feeding ng sanggol.

## Malunggay (Moringa)

Ang dahon ng malunggay ay puno ng sustansya:

- **7x higit na vitamin C** kaysa sa orange
- **4x higit na calcium** kaysa sa gatas
- **3x higit na potassium** kaysa sa saging
- Mayaman sa iron, protein, at antioxidants

**Para sa sanggol**: I-blend ang sariwang dahon ng malunggay sa lugaw (alisin ang tangkay). Magsimula sa maliit na halaga (1 tsp) dahil malakas ang lasa. Available din bilang dried powder.

**Para sa mga nagpapasuso na nanay**: Ayon sa pananaliksik ng FNRI PH, ang malunggay ay maaaring makatulong sa pagdami ng gatas.

## Kamote (Sweet Potato)

Ang kamote ay isa sa pinakamainam na unang pagkain para sa mga sanggol:

- Mayaman sa **beta-carotene** (nagiging Vitamin A — mahalaga para sa mata at immunity)
- Magandang pinagkukunan ng **vitamin C, potassium, at fiber**
- Natural na matamis — gusto ng mga sanggol

**Paghahanda**: Haluin o pakuluan hanggang malambot, pagkatapos ay masahin. Walang asin o asukal.

## Iba Pang Filipino Superfoods

- **Kalabasa** — mahusay na pinagkukunan ng beta-carotene
- **Saging na Saba** — potassium, energy, madaling i-digest
- **Monggo** — iron at plant protein
- **Papaya** — digestive enzymes, vitamin C`,

      zh: `## 为什么选择本地超级食物？

菲律宾有一些世界上营养最密集的本地食物。它们在**任何菜市场都能买到，价格实惠**，非常适合宝宝的辅食喂养。

## 辣木（Malunggay）

辣木叶是营养宝库：
- 维生素C是橙子的7倍
- 钙是牛奶的4倍
- 铁、蛋白质和抗氧化剂丰富

**给宝宝**：将新鲜辣木叶（去梗）打碎加入米糊。从少量开始（1茶匙），因为味道较浓。
**给哺乳妈妈**：FNRI研究显示辣木可能有助于增加奶量。

## 甘薯（Kamote）

甘薯是最好的婴儿初始食物之一：
- 富含**β-胡萝卜素**（转化为维生素A——对眼睛发育和免疫力至关重要）
- 天然甜味——宝宝喜爱

**准备方法**：蒸或煮至非常软，然后捣碎。不加盐和糖。

## 其他菲律宾超级食物

- **Kalabasa**（南瓜）——极佳的β-胡萝卜素来源
- **Saging na Saba**（烹饪香蕉）——钾、能量、易消化
- **Monggo**（绿豆）——铁和植物蛋白
- **木瓜**——消化酶和维生素C`,
    },
    keyTakeaways: {
      en: [
        'Malunggay has 7x more vitamin C than oranges and is an excellent addition to baby\'s lugaw',
        'Kamote (sweet potato) is rich in beta-carotene and is one of the best first foods for babies',
        'All Filipino superfoods are affordable and available at the palengke — no imports needed',
        'Breastfeeding moms: malunggay may help boost milk supply (FNRI PH research)',
      ],
      fil: [
        'Ang malunggay ay may 7x higit na vitamin C kaysa sa orange at mahusay na idinagdag sa lugaw ng sanggol',
        'Ang kamote ay mayaman sa beta-carotene at isa sa pinakamainam na unang pagkain para sa mga sanggol',
        'Lahat ng Filipino superfoods ay abot-kaya at makikita sa palengke',
        'Mga nagpapasuso na nanay: ang malunggay ay maaaring makatulong sa pagdami ng gatas',
      ],
      zh: [
        '辣木的维生素C是橙子的7倍，是宝宝米糊的极佳添加物',
        '甘薯富含β-胡萝卜素，是宝宝最好的初始食物之一',
        '所有菲律宾超级食物都在菜市场有售，价格实惠',
        '哺乳妈妈：辣木可能有助于增加奶量（FNRI PH研究）',
      ],
    },
    ageStages: ['6-9m', '9-12m', '1-2y'],
    topics: ['feeding'],
    sources: ['DOH PH', 'FNRI PH'],
    isPHSpecific: true,
    readMinutes: 4,
    categoryColor: '#33691E',
    isRecommended: true,
  },

  // ─── 8. Foods to Avoid ────────────────────────────────────────────────────
  {
    id: 'foods-avoid',
    slug: 'foods-to-avoid-for-baby',
    title: {
      en:  'Foods to Avoid for Your Baby (Under 1 Year)',
      fil: 'Mga Pagkaing Dapat Iwasan para sa Sanggol',
      zh:  '宝宝应避免的食物（1岁以下）',
    },
    summary: {
      en:  'Some foods are unsafe for babies under 1 year. Know what to avoid, what the risks are, and what is safe.',
      fil: 'Ang ilang pagkain ay hindi ligtas para sa mga sanggol na wala pang 1 taon. Alamin kung ano ang dapat iwasan, ano ang mga panganib, at ano ang ligtas.',
      zh:  '某些食物对1岁以下宝宝不安全。了解应避免的食物、风险以及安全的替代品。',
    },
    body: {
      en: `## The Hard Rules (No Exceptions)

**Honey — before age 1**

This is a firm rule with no exceptions. Honey can contain *Clostridium botulinum* spores that produce a toxin causing infant botulism — a serious illness that can cause paralysis and breathing failure. This applies to all forms: raw honey, processed honey, honey in baked goods, and honey-flavored products.

**Added salt**

A baby's kidneys are not mature enough to handle excess sodium. Do not add salt to any baby food. Use herbs like malunggay or natural flavors instead.

**Added sugar**

Avoid adding sugar to baby food. Sweet foods create a preference for sugar that affects lifelong eating habits. Fruits provide all the natural sweetness needed.

## Important Restrictions

**Cow's milk as a main drink** — before 12 months, cow's milk should not replace breast milk or formula as the main drink. Small amounts as an ingredient in cooking are fine.

**Raw or undercooked seafood and eggs** — risk of Salmonella and other bacteria. Always cook thoroughly.

**Unpasteurized products** — raw milk, certain soft cheeses — bacterial contamination risk.

## Choking Hazards

Always cut food appropriately:

- Whole grapes, cherries, or large berries — cut into quarters
- Raw hard vegetables (carrots, celery) — cook until soft
- Nuts and seeds — not safe as whole pieces; nut butters in thin spread are OK after 6 months
- Large chunks of any food

> Always supervise your baby during meals — never leave them alone while eating.

## Healthy Fats Are Good

Do NOT restrict fat. Babies need healthy fats for brain development. A little olive oil, coconut oil, or butter added to food is beneficial.`,

      fil: `## Mga Matitigas na Alituntunin (Walang Eksepsyon)

**Pulot-Pukyutan — bago mag-1 taon**

Ito ay isang matitigas na alituntunin na walang eksepsyon. Ang pulot-pukyutan ay maaaring naglalaman ng *Clostridium botulinum* spores na nagdudulot ng infant botulism — isang seryosong sakit na maaaring magdulot ng paralysis at hirap sa paghinga. Naaangkop ito sa lahat ng anyo ng pulot-pukyutan.

**Karagdagang Asin**

Hindi pa handa ang mga bato ng sanggol para sa labis na sodium. Huwag magdagdag ng asin sa anumang pagkain ng sanggol.

**Karagdagang Asukal**

Iwasang magdagdag ng asukal sa pagkain ng sanggol. Ang mga prutas ay nagbibigay ng lahat ng natural na tamis na kailangan.

## Mahahalagang Paghihigpit

**Gatas ng baka bilang pangunahing inumin** — bago mag-12 buwan, ang gatas ng baka ay hindi dapat palitan ang breast milk o formula bilang pangunahing inumin.

**Hilaw o halos luto na seafood at itlog** — Salmonella risk. Laging lutuin nang mabuti.

## Mga Panganib ng Pagngingatig

Palaging gupitin ang pagkain nang angkop:

- Buong ubas, seresa — hiwain sa apat
- Matitigas na hilaw na gulay — lutuin hanggang malambot
- Mga mani at binhi — huwag ibigay nang buo

> Laging bantayan ang iyong sanggol habang kumakain — huwag mag-iwan nang nag-iisa.`,

      zh: `## 硬性规定（无例外）

**蜂蜜——1岁前**

这是绝对的规定，无例外。蜂蜜可能含有肉毒梭菌孢子，产生毒素导致婴儿肉毒中毒——一种可导致瘫痪和呼吸衰竭的严重疾病。适用于所有形式的蜂蜜。

**添加盐**

宝宝的肾脏尚未成熟，无法处理过多钠。不要在任何婴儿食品中添加盐。

**添加糖**

避免在婴儿食品中添加糖。水果提供所需的全部天然甜味。

## 重要限制

- **牛奶作为主要饮品**——12个月前，牛奶不应替代母乳或配方奶
- **生的或未熟的海鲜和鸡蛋**——沙门氏菌风险，务必彻底煮熟

## 窒息危险

- 整颗葡萄——切成四等份
- 生硬蔬菜——煮软后再给
- 整颗坚果——不安全

> 宝宝进食时始终要有人监督。`,
    },
    keyTakeaways: {
      en: [
        'NEVER give honey before age 1 — infant botulism risk applies to all forms of honey',
        'No added salt or sugar in baby food — baby\'s kidneys and taste buds are still developing',
        'Cow\'s milk should not replace breast milk as the main drink before 12 months',
        'Always cut food to appropriate sizes and supervise meals — choking is a real risk',
      ],
      fil: [
        'HUWAG KAILANMAN magbigay ng pulot-pukyutan bago mag-1 taon — infant botulism risk',
        'Walang karagdagang asin o asukal sa pagkain ng sanggol',
        'Ang gatas ng baka ay hindi dapat palitan ang breast milk bago mag-12 buwan',
        'Laging gupitin ang pagkain sa angkop na laki at bantayan ang pagkain',
      ],
      zh: [
        '1岁前绝不给蜂蜜——所有形式的蜂蜜都有婴儿肉毒中毒风险',
        '婴儿食品中不添加盐或糖',
        '12个月前，牛奶不应替代母乳作为主要饮品',
        '始终将食物切成适当大小，并监督进食——窒息风险真实存在',
      ],
    },
    ageStages: ['6-9m', '9-12m', '1-2y'],
    topics: ['feeding', 'safety'],
    sources: ['WHO', 'PPS', 'AAP'],
    isPHSpecific: false,
    readMinutes: 4,
    categoryColor: '#BF360C',
    isRecommended: false,
  },

  // ─── 9. Baby Sleep Science ────────────────────────────────────────────────
  {
    id: 'sleep-science',
    slug: 'why-baby-needs-lots-of-sleep',
    title: {
      en:  'Why Babies Sleep So Much: The Science',
      fil: 'Bakit Kailangang Matulog ng Matagal ang Sanggol?',
      zh:  '宝宝为什么需要那么多睡眠？',
    },
    summary: {
      en:  'Babies sleep more than any other creature on earth. Here is the fascinating science behind why sleep is so critical for your baby\'s development.',
      fil: 'Ang mga sanggol ay natutulog nang higit sa anumang nilalang sa mundo. Narito ang kamangha-manghang agham sa likod ng kung bakit ang tulog ay napakahalaga para sa pag-unlad ng iyong sanggol.',
      zh:  '宝宝比地球上任何生物睡得都多。以下是睡眠对宝宝发育至关重要的迷人科学。',
    },
    body: {
      en: `## How Much Sleep Does Your Baby Need?

Sleep needs vary significantly by age:

| Age | Total Sleep Needed |
|---|---|
| Newborn (0–3 months) | 14–17 hours |
| 4–11 months | 12–16 hours |
| 1–2 years | 11–14 hours |
| 3–5 years | 10–13 hours |

## The Growth Hormone Connection

**70–80% of growth hormone is released during deep sleep**. This is why we say babies literally "grow in their sleep." Adequate sleep directly affects physical height and weight gain. Night sleep is especially important for growth hormone release.

## Brain Development During Sleep

During deep sleep, the brain is highly active:

- **Memory consolidation** — new skills and experiences learned during the day are filed into long-term memory
- **Neural pruning** — unused connections are removed, strengthening important pathways
- **Emotional regulation** — sleep helps babies process and regulate emotions (this is why overtired babies are so fussy)

## Newborn Sleep Cycles

Newborns have shorter sleep cycles than adults — about **50 minutes** versus an adult's 90 minutes. They spend more time in active (REM) sleep, which is important for brain development. This is why they wake more frequently — it is completely normal.

## Building Good Sleep Habits

- Consistent bedtime routine (bath, feeding, dim light, lullaby)
- Put baby down drowsy but awake (when developmentally appropriate)
- Same sleep space each time helps baby learn context cues
- Daytime naps are just as important as night sleep

> Night wakings for breastfed babies are biologically normal and expected. Breastfeeding creates natural sleep cycles that differ from formula-fed babies.`,

      fil: `## Gaano Katagal Kailangan Matulog ng Iyong Sanggol?

Ang pangangailangan sa tulog ay nag-iiba-iba ayon sa edad:

- Newborn (0–3 buwan): 14–17 oras
- 4–11 buwan: 12–16 oras
- 1–2 taon: 11–14 oras

## Ang Growth Hormone at Tulog

**70–80% ng growth hormone ay inilalabas habang natutulog**. Kaya naman sinasabi na literal na "lumalaki ang mga sanggol habang natutulog." Ang sapat na tulog ay direktang nakakaapekto sa pisikal na paglaki at timbang.

## Brain Development Habang Natutulog

Sa panahon ng malalim na tulog, ang utak ay aktibo:

- **Memory consolidation** — ang mga bagong natutunang kasanayan ay nagiging pangmatagalang alaala
- **Neural pruning** — pinapalakas ang mahahalagang koneksyon ng utak
- **Emosyonal na regulasyon** — tumutulong ang tulog sa mga sanggol na makontrol ang kanilang damdamin

## Mga Sleep Cycles ng Newborn

Ang mga newborn ay may mas maikling sleep cycles kaysa sa mga matatanda — humigit-kumulang **50 minuto** kumpara sa 90 minuto ng matatanda. Kaya't mas madalas silang gumising — ito ay normal.

## Pagbuo ng Magandang Gawi sa Tulog

- Maayos na bedtime routine (paliligo, pagpapakain, dim light, awit)
- Parehong lugar ng tulog bawat oras
- Ang naps sa araw ay kasinghalaga ng tulog sa gabi

> Ang gising sa gabi para sa mga sanggol na nagpapasuso ay normal at inaasahan.`,

      zh: `## 宝宝需要多少睡眠？

- 新生儿（0-3个月）：14-17小时
- 4-11个月：12-16小时
- 1-2岁：11-14小时

## 生长激素与睡眠

**70-80%的生长激素在深度睡眠中释放**。这就是为什么宝宝真的是"在睡觉中长大"的。充足的睡眠直接影响身体的生长和体重增加。

## 睡眠中的大脑发育

深度睡眠期间，大脑高度活跃：

- **记忆巩固**——白天学到的新技能和经验被存入长期记忆
- **神经修剪**——强化重要的神经通路
- **情绪调节**——睡眠帮助宝宝处理和调节情绪

## 新生儿睡眠周期

新生儿的睡眠周期比成人短——约**50分钟**，而成人为90分钟。他们花更多时间在活跃（REM）睡眠中，这对大脑发育非常重要。

## 建立良好的睡眠习惯

- 一致的睡前惯例（洗澡、喂奶、调暗灯光、摇篮曲）
- 每次在同一个睡眠空间
- 白天小睡与夜间睡眠同样重要

> 母乳喂养宝宝的夜间醒来在生理上是正常且预期的。`,
    },
    keyTakeaways: {
      en: [
        'Newborns need 14–17 hours of sleep daily; 4–11 month babies need 12–16 hours',
        '70–80% of growth hormone is released during deep sleep — babies literally grow while sleeping',
        'Newborn sleep cycles are ~50 minutes (vs adult 90 min) — frequent night waking is normal',
        'Consistent bedtime routine (bath, feed, dim light) helps establish healthy sleep habits',
      ],
      fil: [
        'Ang mga newborn ay kailangan ng 14–17 oras ng tulog araw-araw; 4–11 buwan na sanggol: 12–16 oras',
        '70–80% ng growth hormone ay inilalabas sa malalim na tulog — literal na lumalaki ang mga sanggol habang natutulog',
        'Ang sleep cycles ng newborn ay ~50 minuto — ang madalas na gising sa gabi ay normal',
        'Ang maayos na bedtime routine ay tumutulong sa pagbuo ng malusog na gawi sa tulog',
      ],
      zh: [
        '新生儿每天需要14-17小时睡眠；4-11个月宝宝需要12-16小时',
        '70-80%的生长激素在深度睡眠中释放——宝宝真的是在睡觉中长大的',
        '新生儿睡眠周期约50分钟（成人90分钟）——频繁夜间醒来是正常的',
        '一致的睡前惯例有助于建立健康的睡眠习惯',
      ],
    },
    ageStages: ['newborn', '1-3m', '3-6m', '6-9m', '9-12m', '1-2y'],
    topics: ['sleep'],
    sources: ['WHO', 'AAP', 'PPS'],
    isPHSpecific: false,
    readMinutes: 5,
    categoryColor: '#4527A0',
    isRecommended: true,
  },

  // ─── 10. Language Development ─────────────────────────────────────────────
  {
    id: 'lang-dev',
    slug: 'language-development-guide',
    title: {
      en:  "Your Baby's First Words: Language Development Guide",
      fil: 'Mga Unang Salita ng Iyong Sanggol',
      zh:  '宝宝的第一个词：语言发展指南',
    },
    summary: {
      en:  'From first coos to full sentences — a practical guide to language milestones, bilingual development in the Philippines, and red flags to watch for.',
      fil: 'Mula sa unang cooing hanggang sa buong pangungusap — isang praktikal na gabay sa mga language milestones, bilingual development sa Pilipinas, at mga red flags na dapat bantayan.',
      zh:  '从第一声"咕咕"到完整的句子——语言里程碑、菲律宾双语发展以及需要关注的红旗信号的实用指南。',
    },
    body: {
      en: `## Language Milestones by Age

**2 months**: Cooing (vowel sounds — "aah", "ooh")
**4 months**: Babbling (consonant sounds — "baba", "mama")
**6 months**: Different sounds, imitating tones and facial expressions
**9 months**: "Mama" and "dada" (may not be directed yet)
**12 months**: 1–3 meaningful words with intent
**18 months**: 10+ words; points to objects when named
**24 months**: 2-word phrases ("more milk", "daddy go")
**36 months**: Short sentences of 3–4 words

## Bilingual in the Philippines: A Superpower, Not a Problem

Filipino children often grow up hearing **Tagalog + English + a regional dialect**. Research consistently shows that bilingualism does NOT cause language delay. It may temporarily reduce vocabulary in each individual language, but total vocabulary across both languages is equal to or greater than monolingual peers.

> There is no "confusion" — the brain easily manages multiple languages simultaneously. Speaking your native dialect to your baby is the right thing to do.

## How to Support Language Development

- **Talk constantly**: narrate everything you do ("Now we are washing your hands, the water is warm")
- **Read aloud daily**: even before baby understands, hearing rhythm and vocabulary builds language
- **Sing songs**: Filipino folk songs, nursery rhymes in all languages
- **Respond to babbling**: when baby babbles, babble back — it is conversation
- **Limit screens** under 18 months (except video calls with family)

## Red Flags — Refer to a Developmental Pediatrician

Consult your pediatrician if by:
- **12 months**: no babbling, no pointing, no waving
- **16 months**: no single words
- **24 months**: no 2-word phrases
- **Any age**: loss of previously acquired language skills

Early intervention is always better. Trust your instincts.`,

      fil: `## Mga Language Milestones Ayon sa Edad

- **2 buwan**: Cooing (patinig na tunog)
- **4 buwan**: Babbling (katinig na tunog — "baba", "mama")
- **6 buwan**: Iba't ibang tunog, ginagaya ang tono
- **9 buwan**: "Mama" at "dada"
- **12 buwan**: 1–3 makabuluhang salita
- **18 buwan**: 10+ salita; nagtaturo sa mga bagay kapag pinangalanan
- **24 buwan**: 2-word phrases ("dagdag gatas", "daddy lakad")
- **36 buwan**: Maikling pangungusap ng 3–4 na salita

## Bilingual sa Pilipinas: Isang Kahusayan

Ang mga batang Pilipino ay madalas na lumalaki na nakikinig ng **Tagalog + Ingles + regional dialect**. Ayon sa pananaliksik, ang multilingualism ay HINDI nagdudulot ng language delay. Ang pagsasalita ng iyong katutubong dialect sa iyong sanggol ay tama.

## Paano Suportahan ang Language Development

- **Magsalita nang palagi**: isalaysay ang lahat ng ginagawa mo
- **Magbasa nang malakas araw-araw**: kahit bago pa maunawaan ng sanggol
- **Kumanta ng mga awit**: Filipino folk songs, nursery rhymes
- **Tumugon sa babbling**: kapag nagba-babble ang sanggol, tumugon
- **Limitahan ang screen time** bago mag-18 buwan

## Mga Red Flags

Kumonsulta sa pediatrician kung sa edad ng:
- **12 buwan**: walang babbling, walang pagtaturo
- **16 buwan**: walang iisang salita
- **24 buwan**: walang 2-word phrases

Ang maagang interbensyon ay laging mas mainam.`,

      zh: `## 语言发展里程碑

- **2个月**：咕咕声（元音声音）
- **4个月**：牙牙学语（辅音——"baba"、"mama"）
- **6个月**：不同声音，模仿语调
- **9个月**："妈妈"和"爸爸"
- **12个月**：1-3个有意义的词语
- **18个月**：10个以上词语；能指认被命名的物体
- **24个月**：两词短语
- **36个月**：3-4个词的短句

## 菲律宾的双语：优势而非问题

菲律宾儿童通常同时接触**他加禄语+英语+地区方言**。研究一致表明，多语言不会导致语言延迟。这是一种认知优势。

## 支持语言发展

- **不断说话**：叙述你所做的一切
- **每天大声读书**：即使宝宝还不理解，听节奏和词汇也能建立语言能力
- **唱歌**：菲律宾民间歌曲、各种语言的童谣
- **18个月以下限制屏幕使用时间**

## 红旗信号

如果以下情况出现，请咨询发育儿科医生：
- 12个月：无牙牙学语、无指示
- 16个月：无单词
- 24个月：无两词短语`,
    },
    keyTakeaways: {
      en: [
        'Language milestones: 1 word by 12 months, 2-word phrases by 24 months, sentences by 36 months',
        'Bilingual / multilingual development is a cognitive advantage — not a cause of language delay',
        'Talk, read, and sing to your baby every day — even before they understand words',
        'Red flag: no babbling by 12 months or no words by 16 months — refer to developmental pedia',
      ],
      fil: [
        'Language milestones: 1 salita sa 12 buwan, 2-word phrases sa 24 buwan, pangungusap sa 36 buwan',
        'Ang bilingual/multilingual na pag-unlad ay isang cognitive advantage — hindi dahilan ng delay',
        'Magsalita, magbasa, at kumanta sa iyong sanggol araw-araw',
        'Red flag: walang babbling sa 12 buwan o walang salita sa 16 buwan — kumonsulta sa pediatrician',
      ],
      zh: [
        '语言里程碑：12个月1个词，24个月两词短语，36个月说句子',
        '双语/多语言发展是认知优势——不会导致语言延迟',
        '每天和宝宝说话、读书和唱歌——即使他们还不理解',
        '红旗：12个月无牙牙学语或16个月无单词——咨询发育儿科医生',
      ],
    },
    ageStages: ['6-9m', '9-12m', '1-2y', '2-3y'],
    topics: ['development'],
    sources: ['WHO', 'CDC', 'PPS'],
    isPHSpecific: true,
    readMinutes: 5,
    categoryColor: '#00695C',
    isRecommended: true,
  },

  // ─── 11. Baby Fever Guide ─────────────────────────────────────────────────
  {
    id: 'fever',
    slug: 'baby-fever-when-to-see-doctor',
    title: {
      en:  'Baby Fever: When to Go to the Doctor',
      fil: 'Lagnat ng Sanggol: Kailan Dapat Pumunta sa Doktor?',
      zh:  '宝宝发烧：什么时候需要就医？',
    },
    summary: {
      en:  'Fever in babies is common but can be serious depending on age. Know the exact thresholds, safe home care, and emergency warning signs.',
      fil: 'Ang lagnat sa mga sanggol ay karaniwan ngunit maaaring maging seryoso depende sa edad. Alamin ang eksaktong mga threshold, ligtas na pag-aalaga sa bahay, at mga emergency warning signs.',
      zh:  '婴儿发烧很常见，但根据年龄不同可能很严重。了解确切的温度阈值、安全的家庭护理和紧急警告信号。',
    },
    body: {
      en: `## Emergency Rules by Age

These are the most important rules to remember:

**Under 3 months (any fever) — GO TO THE ER IMMEDIATELY**

A fever of 38°C (100.4°F) or higher in a baby under 3 months is a medical emergency. No exceptions, no waiting, no home treatment first. Go directly to the emergency room.

**3–6 months (38°C or higher)** — Call your pediatrician immediately

**Over 6 months (fever over 39°C, or lasting more than 2–3 days)** — See your doctor

## What Is a Fever?

Normal body temperature: 36.5–37.5°C (axillary/armpit measurement)

- Axillary (armpit): most common in PH; add 0.5°C for true temperature
- Rectal: most accurate but less common; don't add to the reading

## Safe Fever Management at Home (Over 6 Months Only)

- **Paracetamol only** (never aspirin or ibuprofen for babies under 6 months)
- Dose by weight, not age — ask your pediatrician for the correct dose
- Cool compress on forehead, neck, and armpits — never alcohol rubs
- Light clothing, fan in room (not direct on baby)
- Encourage fluids: breastfeed more frequently, or offer water for babies over 6 months

## Fever After Vaccination

> Mild fever (37.5–38.5°C) within 48 hours of vaccination is normal and expected — it shows the immune system is responding. You can give age-appropriate paracetamol if baby is uncomfortable.

## Seek Immediate Help For

- Fever in baby under 3 months (ANY temperature)
- Difficulty breathing or fast breathing
- Rash that does not fade when pressed (petechiae)
- Seizure (febrile convulsion)
- Extreme drowsiness or unresponsiveness
- Stiff neck
- Baby looks very sick, not responding normally`,

      fil: `## Emergency Rules Ayon sa Edad

**Wala pang 3 buwan (anumang lagnat) — PUMUNTA AGAD SA ER**

Ang lagnat na 38°C o higit pa sa sanggol na wala pang 3 buwan ay isang medikal na emergency. Walang eksepsyon — pumunta agad sa emergency room.

**3–6 buwan (38°C o higit pa)** — Tawagan agad ang pediatrician

**Higit sa 6 buwan (lagnat na higit sa 39°C, o tumatagal ng higit sa 2–3 araw)** — Pumunta sa doktor

## Ano ang Lagnat?

Normal na temperatura ng katawan: 36.5–37.5°C (axillary/kilikili)

## Ligtas na Pag-aalaga sa Bahay (Para sa 6 Buwan Pataas)

- **Paracetamol lang** (hindi aspirin o ibuprofen para sa mga sanggol na wala pang 6 buwan)
- Ang dosis ay batay sa timbang, hindi sa edad — tanungin ang iyong pediatrician
- Malamig na basang tela sa noo, leeg, at kilikili — huwag alkohol
- Magaan na damit, bentilador sa kwarto
- Hikayating uminom: magpasuso nang mas madalas

## Lagnat Pagkatapos ng Bakuna

> Ang banayad na lagnat (37.5–38.5°C) sa loob ng 48 oras pagkatapos ng bakuna ay normal — nagpapakita na ang immune system ay tumutugon.

## Humingi ng Agarang Tulong Para sa

- Lagnat sa sanggol na wala pang 3 buwan
- Hirap sa paghinga
- Pantal na hindi kumukupas kapag pinindot
- Seizure (febrile convulsion)
- Matinding pag-aantok o hindi tumutugon
- Matigas na leeg`,

      zh: `## 按年龄的紧急规则

**3个月以下（任何发烧）——立即前往急诊室**

3个月以下婴儿体温38°C（100.4°F）或以上是医疗紧急情况。无例外，立即就医。

**3-6个月（38°C或以上）**——立即联系儿科医生

**6个月以上（体温超过39°C，或持续2-3天以上）**——就医

## 发烧的定义

正常体温：36.5-37.5°C（腋温）

## 家庭安全护理（仅限6个月以上）

- **仅用对乙酰氨基酚**（6个月以下婴儿不用阿司匹林或布洛芬）
- 按体重而非年龄计算剂量
- 额头、颈部和腋下冷敷——不要用酒精擦拭
- 穿轻薄衣物，增加喂奶频率

## 接种后发烧

> 接种后48小时内轻微发烧（37.5-38.5°C）是正常的——表明免疫系统在响应。

## 以下情况立即就医

- 3个月以下任何发烧
- 呼吸困难
- 按压不退的皮疹
- 惊厥
- 极度嗜睡或无反应`,
    },
    keyTakeaways: {
      en: [
        'Under 3 months + any fever = EMERGENCY — go to the ER immediately, no exceptions',
        '3–6 months: 38°C or higher = call your pediatrician right away',
        'Use paracetamol only (never aspirin or ibuprofen under 6 months), dosed by weight',
        'Mild fever 37.5–38.5°C within 48 hours of vaccination is normal and expected',
      ],
      fil: [
        'Wala pang 3 buwan + anumang lagnat = EMERGENCY — pumunta agad sa ER, walang eksepsyon',
        '3–6 buwan: 38°C o higit pa = tawagan agad ang iyong pediatrician',
        'Gamitin ang paracetamol lang (hindi aspirin o ibuprofen para sa wala pang 6 buwan), batay sa timbang',
        'Ang banayad na lagnat pagkatapos ng bakuna ay normal at inaasahan',
      ],
      zh: [
        '3个月以下+任何发烧 = 紧急情况——立即前往急诊室，无例外',
        '3-6个月：38°C或以上 = 立即联系儿科医生',
        '仅使用对乙酰氨基酚（6个月以下不用阿司匹林或布洛芬），按体重计算剂量',
        '接种后48小时内轻微发烧是正常且预期的',
      ],
    },
    ageStages: ['newborn', '1-3m', '3-6m', '6-9m', '9-12m', '1-2y'],
    topics: ['health'],
    sources: ['PPS', 'DOH PH', 'WHO'],
    isPHSpecific: false,
    readMinutes: 5,
    categoryColor: '#C62828',
    isRecommended: true,
  },

  // ─── 12. Diarrhea & ORS ───────────────────────────────────────────────────
  {
    id: 'diarrhea',
    slug: 'diarrhea-ors-home-care',
    title: {
      en:  'Baby Diarrhea: ORS and Home Care Guide',
      fil: 'Diarrhea sa Sanggol: ORS at Pag-aalaga sa Bahay',
      zh:  '宝宝腹泻：口服补液盐与家庭护理',
    },
    summary: {
      en:  'Diarrhea is common in babies and can lead to dangerous dehydration. Learn how to use ORS, recognize dehydration signs, and when to seek emergency help.',
      fil: 'Ang diarrhea ay karaniwan sa mga sanggol at maaaring humantong sa mapanganib na pag-aalis ng tubig. Alamin kung paano gumamit ng ORS, makilala ang mga tanda ng dehydration, at kailan humingi ng tulong.',
      zh:  '腹泻在婴儿中很常见，可导致危险的脱水。了解如何使用口服补液盐（ORS）、识别脱水迹象以及何时寻求紧急帮助。',
    },
    body: {
      en: `## What Counts as Diarrhea?

Diarrhea means **3 or more loose, watery stools in 24 hours** — or more stools than usual for breastfed babies. Note: breastfed newborns can have many loose stools normally — look for a change from their usual pattern.

## The #1 Danger: Dehydration

Dehydration is the main risk in baby diarrhea. Signs of dehydration:

- **Mild**: fewer wet diapers, slightly dry mouth
- **Moderate**: no wet diaper for 6+ hours, no tears when crying, sunken fontanelle (soft spot on head)
- **Severe (EMERGENCY)**: very lethargic, eyes sunken, skin loses elasticity, no urine for 8+ hours

## ORS (Oresol) — Your First Response

Oral Rehydration Solution (Oresol) is available **free at every BHS and RHU** in the Philippines. It is the WHO-recommended first treatment for diarrhea.

**Giving ORS**:
- Small sips every 1–2 minutes — do not give large amounts at once (causes vomiting)
- For babies: 50–100ml per diarrhea episode
- Continue for as long as diarrhea persists

**ALWAYS continue breastfeeding** during diarrhea — WHO recommends this specifically. Breast milk provides fluids, nutrition, and antibodies.

## Zinc Supplementation

PPS recommends **10–20mg of zinc daily for 10–14 days** during diarrhea for babies 6 months and older. Zinc reduces duration and severity. Ask your BHW or pharmacist for zinc drops.

## When to Go to the ER

- Signs of severe dehydration
- Blood or mucus in stool
- Diarrhea not improving after 2 days despite ORS
- Baby under 3 months with any diarrhea
- High fever alongside diarrhea

## Do NOT Give Anti-Diarrheal Medications to Babies

Anti-diarrheal drugs (loperamide) are contraindicated for children under 2 years and can be dangerous.`,

      fil: `## Ano ang Diarrhea?

Ang diarrhea ay nangangahulugang **3 o higit pang maluwag at matubig na dumi sa loob ng 24 oras**. Para sa mga sanggol na nagpapasuso: maghanap ng pagbabago sa kanilang karaniwang pattern.

## Ang Pangunahing Panganib: Dehydration

- **Banayad**: mas kaunting basang diaper, bahagyang tuyo ang bibig
- **Katamtaman**: walang basang diaper sa 6+ oras, walang luha kapag umiiyak, malubog ang fontanelle
- **Malala (EMERGENCY)**: matinding pag-aantok, malubog ang mga mata, walang ihi sa 8+ oras

## ORS (Oresol) — Ang Unang Hakbang

Ang Oral Rehydration Solution (Oresol) ay **libre sa bawat BHS at RHU** sa Pilipinas. Ito ang inirerekomenda ng WHO para sa diarrhea.

**Pagbibigay ng ORS**:
- Maliit na higop bawat 1–2 minuto — huwag magbigay ng malaking halaga nang sabay-sabay
- Para sa mga sanggol: 50–100ml bawat episode ng diarrhea

**LAGING magpatuloy ng breastfeeding** sa panahon ng diarrhea — inirerekomenda ito ng WHO.

## Zinc Supplementation

Inirerekomenda ng PPS ang **10–20mg ng zinc araw-araw sa loob ng 10–14 araw** para sa mga sanggol na 6 buwan pataas.

## Kailan Pumunta sa ER

- Mga tanda ng malubhang dehydration
- Dugo o uhog sa dumi
- Hindi gumagaling pagkatapos ng 2 araw
- Sanggol na wala pang 3 buwan na may anumang diarrhea`,

      zh: `## 什么算腹泻？

腹泻是指**24小时内3次或以上稀水样大便**——或母乳喂养宝宝比平时更多的大便。

## 主要危险：脱水

- **轻度**：尿布较少湿润，口腔略干
- **中度**：6小时以上无湿尿布，哭时无泪，前囟门凹陷
- **严重（紧急）**：极度嗜睡，眼睛凹陷，8小时以上无尿

## 口服补液盐（ORS/Oresol）

ORS在菲律宾**每个BHS和RHU免费提供**。这是WHO推荐的腹泻首要治疗方法。

- 每1-2分钟小口喂——不要一次给大量
- 每次腹泻后给50-100ml
- 腹泻期间**始终继续母乳喂养**

## 补锌

PPS推荐6个月以上宝宝腹泻期间**每天补锌10-20mg，持续10-14天**。

## 何时去急诊室

- 严重脱水迹象
- 大便带血或黏液
- 2天后仍未改善
- 3个月以下宝宝有任何腹泻

**不要给宝宝服用止泻药**——这对2岁以下儿童是禁忌的。`,
    },
    keyTakeaways: {
      en: [
        'ORS (Oresol) is free at every BHS and RHU — use small sips every 1–2 minutes, not large amounts',
        'Always continue breastfeeding during diarrhea — WHO specifically recommends this',
        'Emergency signs: no urine 8+ hours, sunken fontanelle, no tears, extreme lethargy — go to ER',
        'PPS recommends zinc (10–20mg daily for 10–14 days) for babies 6 months and older',
      ],
      fil: [
        'Ang ORS (Oresol) ay libre sa bawat BHS at RHU — magbigay ng maliit na higop bawat 1–2 minuto',
        'Laging magpatuloy ng breastfeeding sa panahon ng diarrhea — inirerekomenda ng WHO ito',
        'Emergency signs: walang ihi sa 8+ oras, malubog na fontanelle — pumunta sa ER',
        'Inirerekomenda ng PPS ang zinc (10–20mg araw-araw sa loob ng 10–14 araw)',
      ],
      zh: [
        'ORS在每个BHS和RHU免费提供——每1-2分钟小口喂，不要一次大量',
        '腹泻期间始终继续母乳喂养——WHO特别推荐这一点',
        '紧急信号：8小时以上无尿、前囟门凹陷、无泪、极度嗜睡——前往急诊室',
        '对6个月以上宝宝，PPS推荐补锌（每天10-20mg，持续10-14天）',
      ],
    },
    ageStages: ['newborn', '1-3m', '3-6m', '6-9m', '9-12m', '1-2y'],
    topics: ['health'],
    sources: ['WHO', 'DOH PH', 'PPS'],
    isPHSpecific: true,
    readMinutes: 4,
    categoryColor: '#0277BD',
    isRecommended: false,
  },

  // ─── 13. Postpartum Depression ────────────────────────────────────────────
  {
    id: 'ppd',
    slug: 'postpartum-depression',
    title: {
      en:  'Postpartum Depression: You Are Not Alone, Mama',
      fil: 'Postpartum Depression: Hindi Ka Nag-iisa, Nanay',
      zh:  '产后抑郁：妈妈，你并不孤单',
    },
    summary: {
      en:  '1 in 5 Filipino mothers experience postpartum depression. This is a medical condition, not a character flaw. Learn the signs, where to get help, and how family can support.',
      fil: '1 sa 5 Pilipinang ina ay nakakaranas ng postpartum depression. Ito ay isang medikal na kondisyon, hindi isang kahinaan. Alamin ang mga tanda, kung saan makakakuha ng tulong, at kung paano makakatulong ang pamilya.',
      zh:  '五分之一的菲律宾母亲经历产后抑郁。这是一种医疗状况，不是性格缺陷。了解迹象、获得帮助的途径以及家人如何提供支持。',
    },
    body: {
      en: `## Baby Blues vs. Postpartum Depression

**Baby Blues (Normal)** — affects up to 80% of new mothers:
- Starts within 3–5 days of birth
- Mood swings, tearfulness, anxiety, irritability
- Usually resolves on its own within **2 weeks**
- Does not require treatment beyond rest, support, and understanding

**Postpartum Depression (PPD) — needs medical attention**:
- Starts within **4 weeks to 1 year** after birth
- Persistent sadness lasting more than 2 weeks
- Difficulty bonding with baby
- Feeling like a "bad mother" or that baby would be better without you
- Withdrawing from family and friends
- Inability to care for yourself or baby
- Intrusive or dark thoughts

## This Is NOT Your Fault

PPD is caused by a dramatic drop in estrogen and progesterone after birth, combined with sleep deprivation, physical recovery, and life changes. It is a **medical condition** — like diabetes or hypertension — not a weakness.

## Cultural Pressure in the Philippines

Filipino culture often expects new mothers to be joyful ("dapat masaya ka, may anak ka na!"). This expectation can make mothers feel ashamed to seek help. **You are allowed to struggle. Asking for help is strength, not weakness.**

## Getting Help

- **Your OB-Gyne**: the first person to speak with; can prescribe medication or refer
- **PGH Department of Psychiatry** (Manila): 0917-836-5256
- **iCall Philippines**: +63 919-952-2255 (mental health helpline)
- **Reach Out**: a crisis text line available in the Philippines

## Medication and Breastfeeding

Several antidepressants are **safe to use while breastfeeding**. Discuss with your doctor — do not stop medication without medical advice.

## How Partners and Family Can Help

- Take over one night feeding per night
- Ensure she sleeps at least one 4-hour stretch daily
- Validate her feelings without judgment
- Reduce visitors in the first weeks
- Say "what do you need?" not "you should be happy"`,

      fil: `## Baby Blues vs. Postpartum Depression

**Baby Blues (Normal)** — nakakaapekto sa hanggang 80% ng mga bagong ina:
- Nagsisimula sa loob ng 3–5 araw pagkatapos manganak
- Mood swings, pag-iyak, pagkabalisa
- Karaniwang nawawala sa loob ng **2 linggo**

**Postpartum Depression (PPD) — kailangan ng medikal na atensyon**:
- Nagsisimula sa loob ng 4 na linggo hanggang 1 taon pagkatapos manganak
- Patuloy na kalungkutan na tumatagal nang higit sa 2 linggo
- Hirap na mag-bond sa sanggol
- Pag-iwas sa pamilya at mga kaibigan
- Mga mapanganib na pag-iisip

## Ito Ay Hindi Mo Kasalanan

Ang PPD ay sanhi ng dramatikong pagbaba ng hormones pagkatapos manganak, kasama ang kawalan ng tulog at mga pagbabago sa buhay. Ito ay isang **medikal na kondisyon** — hindi isang kahinaan.

## Kultura ng Pilipinas

Madalas inaasahan ng kulturang Pilipino na masaya ang mga bagong ina. Ang ganitong presyon ay maaaring magpahiya sa mga ina na humingi ng tulong. **Maaari kang magpagod. Ang paghingi ng tulong ay lakas, hindi kahinaan.**

## Paano Humingi ng Tulong

- **Ang iyong OB-Gyne**: ang unang kausapin
- **PGH Department of Psychiatry**: 0917-836-5256
- **iCall Philippines**: +63 919-952-2255

## Gamot at Breastfeeding

Maraming antidepressant ang **ligtas gamitin habang nagpapasuso**. Kumonsulta sa iyong doktor.

## Paano Makakatulong ang Pamilya

- Alagaan ang isang gabi na pagpapakain
- Tiyaking makatulog siya ng hindi bababa sa 4 na oras nang tuloy-tuloy
- Huwag husgahan ang kanyang damdamin`,

      zh: `## 产后忧郁 vs. 产后抑郁

**产后忧郁（正常）**——影响多达80%的新妈妈：
- 分娩后3-5天开始
- 情绪波动、爱哭、焦虑
- 通常在**2周内**自行消退

**产后抑郁症（PPD）——需要医疗关注**：
- 分娩后4周至1年内出现
- 持续超过2周的悲伤
- 难以与宝宝建立联系
- 感觉自己是"坏妈妈"
- 与家人和朋友疏远
- 黑暗的想法

## 这不是你的错

PPD是由分娩后雌激素和孕酮急剧下降、睡眠剥夺和生活变化共同引起的。这是一种**医疗状况**，不是软弱的表现。

## 获得帮助

- **妇科医生**：第一个联系的人
- **PGH精神科**：0917-836-5256
- **iCall Philippines**：+63 919-952-2255

## 药物与母乳喂养

几种抗抑郁药**在母乳喂养期间是安全的**。请与医生讨论。

## 家人如何帮助

- 每晚承担一次喂奶任务
- 确保她每天至少睡4小时连续睡眠
- 不加评判地倾听她的感受`,
    },
    keyTakeaways: {
      en: [
        '1 in 5 Filipino mothers experience PPD — it is a medical condition, not a weakness or failure',
        'Baby blues (first 2 weeks) is normal; PPD lasts longer and is more intense — seek help',
        'Contact iCall Philippines (+63 919-952-2255) or your OB-Gyne for support',
        'Several antidepressants are safe during breastfeeding — do not go through this alone',
      ],
      fil: [
        '1 sa 5 Pilipinang ina ay may PPD — ito ay medikal na kondisyon, hindi kahinaan',
        'Ang baby blues (unang 2 linggo) ay normal; ang PPD ay mas matagal at mas matindi — humingi ng tulong',
        'Makipag-ugnayan sa iCall Philippines (+63 919-952-2255) o sa iyong OB-Gyne',
        'Maraming antidepressant ang ligtas sa panahon ng breastfeeding — huwag dumaan sa ito nang mag-isa',
      ],
      zh: [
        '五分之一的菲律宾母亲经历PPD——这是医疗状况，不是软弱或失败',
        '产后忧郁（前2周）是正常的；PPD持续更长时间且更严重——寻求帮助',
        '联系iCall Philippines（+63 919-952-2255）或您的妇科医生寻求支持',
        '几种抗抑郁药在母乳喂养期间是安全的——不要独自承受',
      ],
    },
    ageStages: ['newborn', '1-3m', '3-6m'],
    topics: ['mental_health'],
    sources: ['WHO', 'PPS', 'PGH'],
    isPHSpecific: true,
    readMinutes: 5,
    categoryColor: '#6A1B9A',
    isRecommended: true,
  },

  // ─── 14. Science vs Filipino Baby Beliefs ─────────────────────────────────
  {
    id: 'traditions',
    slug: 'science-vs-filipino-baby-beliefs',
    title: {
      en:  'Science vs. Filipino Baby Beliefs: What\'s True?',
      fil: 'Pamahiin o Katotohanan? Science vs. Filipino Baby Beliefs',
      zh:  '迷信还是事实？科学与菲律宾育儿传统',
    },
    summary: {
      en:  'A respectful, evidence-based look at common Filipino baby traditions — which ones are safe and beneficial, and which ones are best reconsidered.',
      fil: 'Isang marespetong, evidence-based na pagtingin sa mga karaniwang Filipino baby traditions — kung alin ang ligtas at kapaki-pakinabang, at kung alin ang dapat na pag-isipang muli.',
      zh:  '以尊重、循证的态度审视常见的菲律宾婴儿传统——哪些是安全有益的，哪些需要重新考虑。',
    },
    body: {
      en: `## A Note on Respect

Filipino parenting traditions carry deep cultural meaning and are passed down with love by lolas, titas, and community elders. This guide is not about dismissing tradition — it is about examining each practice through a health lens so you can make informed choices.

## Traditions Worth Keeping

**Skin-to-skin contact (kangaroo care)** — strongly supported by science. Regulates baby's temperature, supports breastfeeding, and promotes bonding. WHO recommends it for all newborns, especially preterm.

**Babywearing** — traditional carriers (ergonomic) keep baby close, support development, and make breastfeeding convenient. Use an ergonomic carrier (M-position — hips higher than bottom).

**Extended family support (damayan)** — multiple caregivers reduces mother's stress and improves baby's social development. The Filipino extended family system is a genuine protective factor.

**Singing and talking to baby** — scientifically shown to accelerate language development and bonding.

## Beliefs to Approach with Care

**Putting salt on baby's scalp** — No scientific evidence of benefit; excess salt can irritate newborn skin. Best to skip.

**Oiling the umbilical cord area** — WHO recommends keeping the cord stump dry for fastest healing. Traditional coconut oil application is not harmful in small amounts but may slightly delay drying.

**Not bathing baby for a week** — WHO recommends sponge bathing after birth, keeping the cord area dry. A gentle sponge bath from day 1 is safe and recommended.

**Hilot for baby gas (colic)** — Gentle abdominal massage in a clockwise direction actually IS supported by some research for colic relief. The technique matters more than the tradition label.

## Beliefs to Reconsider

**Rubbing lambanog or alcohol on baby's skin** — Never. Alcohol absorbs through newborn skin and can cause hypoglycemia, CNS depression, and toxicity. This is a serious risk.

**Placing amulets or garlic near baby's face while sleeping** — small items near sleeping baby's face are a choking and suffocation hazard.

> **Pasma myth** — Temperature change does not cause paralysis or illness. However, handwashing (which Filipinos often practice rigorously) IS genuinely important for preventing infection.

## The Bottom Line

Your cultural heritage is a strength. Use this knowledge to combine the best of Filipino tradition with modern evidence-based care — for the healthiest possible start for your baby.`,

      fil: `## Isang Tala sa Paggalang

Ang mga Filipino parenting traditions ay puno ng malalim na kulturang kahulugan. Ang gabay na ito ay hindi para itakwil ang tradisyon — ito ay para suriin ang bawat gawi sa pamamagitan ng health lens para makapagdesisyon nang may kaalaman.

## Mga Tradisyong Suportado ng Agham

**Skin-to-skin contact** — lubos na sinusuportahan ng agham. Kinokontrol ang temperatura ng sanggol, sinusuportahan ang breastfeeding, at nagtataguyod ng bonding.

**Babywearing** — ang tradisyonal na pagdadala ng sanggol (ergonomic) ay nagpapalapig sa pag-unlad at ginagawang mas maginhawa ang breastfeeding.

**Damayan (extended family support)** — ang sistema ng pamilya ng Pilipino ay isang tunay na proteksyon para sa ina at sanggol.

**Pagkanta at pagsasalita sa sanggol** — pinatunayan ng agham na nagpapabilis ng language development.

## Mga Tradisyong Dapat Pag-ingatan

**Paglagay ng asin sa ulo ng sanggol** — walang siyentipikong ebidensya ng benepisyo; maaaring makairita ang balat ng newborn.

**Pag-oiling ng umbilical cord area** — inirerekomenda ng WHO ang pagpapanatiling tuyo ng cord. Ang coconut oil ay hindi mapanganib sa maliit na halaga.

**Paggamit ng hilot para sa gas** — ang malambot na abdominal massage (clockwise) ay suportado ng ilang pananaliksik para sa colic relief.

## Mga Tradisyong Dapat Isaalang-alang

**Pag-rub ng lambanog o alkohol sa balat ng sanggol** — HUWAG KAILANMAN. Ang alkohol ay naaabsorb sa balat ng newborn at maaaring magdulot ng seryosong panganib.

**Paglalagay ng mga anting-anting malapit sa mukha ng sanggol habang natutulog** — maaaring maging panganib ng pagngingatig.

> **Ang Pasma** — Ang pagbabago ng temperatura ay hindi nagdudulot ng paralysis. Ngunit ang paghuhugas ng kamay (na madalas isinasagawa ng mga Pilipino) ay tunay na mahalaga para sa pag-iwas sa impeksyon.`,

      zh: `## 关于尊重的说明

菲律宾育儿传统承载着深刻的文化意义，由祖母、阿姨和社区长者用爱传承下来。本指南不是要否定传统——而是通过健康视角审视每种做法，帮助您做出知情选择。

## 值得保留的传统

**肌肤接触（袋鼠式护理）**——得到科学的强力支持。WHO对所有新生儿推荐，尤其是早产儿。

**背婴**——将宝宝靠近，支持发育，方便母乳喂养。使用符合人体工程学的背婴带（M形——臀部高于底部）。

**大家庭支持**——菲律宾大家庭体系是真正的保护因素，减少母亲压力，改善宝宝的社会发展。

## 需要谨慎的信仰

**在宝宝头皮上放盐**——没有科学证据支持此做法；过量盐分可能刺激新生儿皮肤。

**用油涂抹脐带区域**——WHO建议保持脐带残端干燥以促进最快愈合。

**腹部顺时针按摩（哈洛特/肠胀气）**——轻柔的腹部按摩实际上得到一些研究支持，对肠绞痛有所帮助。

## 需要重新考虑的做法

**在宝宝皮肤上涂抹酒精（朗姆酒）**——**绝对不要**。酒精通过新生儿皮肤吸收，可能导致低血糖和中枢神经系统抑制。

**在睡觉宝宝脸附近放护身符或大蒜**——小物品可能构成窒息危险。

> **"Pasma"（因温度变化引起的疾病）**——温度变化不会导致瘫痪。但勤洗手（菲律宾人的优良习惯）确实对预防感染非常重要。`,
    },
    keyTakeaways: {
      en: [
        'Skin-to-skin, babywearing, and extended family support are backed by science — keep these',
        'Gentle clockwise tummy massage for baby gas (colic) has some research support',
        'NEVER rub lambanog or alcohol on baby — it absorbs through the skin and is toxic',
        'Cultural traditions and modern evidence-based care work best together, not against each other',
      ],
      fil: [
        'Ang skin-to-skin, babywearing, at damayan ay sinusuportahan ng agham — panatilihin ang mga ito',
        'Ang malambot na clockwise na pagmamasa ng tiyan para sa gas ng sanggol ay may siyentipikong suporta',
        'HUWAG KAILANMAN mag-rub ng lambanog o alkohol sa sanggol — naaabsorb sa balat at mapanganib',
        'Ang mga tradisyong kultural at modernong pag-aalaga ay pinakaepektibo kung gagamitin nang magkasama',
      ],
      zh: [
        '肌肤接触、背婴和大家庭支持得到科学支持——保留这些传统',
        '轻柔的顺时针腹部按摩对宝宝肠胀气有一定研究支持',
        '绝不在宝宝身上涂抹酒精——通过皮肤吸收，具有毒性',
        '文化传统和现代循证护理结合使用效果最佳',
      ],
    },
    ageStages: ['newborn', '1-3m', '3-6m', '6-9m'],
    topics: ['traditions'],
    sources: ['PPS', 'Evidence-Based Pediatrics'],
    isPHSpecific: true,
    readMinutes: 6,
    categoryColor: '#880E4F',
    isRecommended: true,
  },

];
