/**
 * claude.ts — Anthropic Claude API wrapper for BabyBloom PH
 * Model: claude-haiku-4-5-20251001  (fast, cost-efficient for chat)
 * Features: buildSystemPrompt, streaming chat, language detection, disclaimer
 */

import { Child } from '../../store/childStore';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id:        string;
  role:      'user' | 'assistant';
  content:   string;
  timestamp: string;
}

export interface WeeklySummary {
  totalFeeds:          number;
  avgVolumeMl:         number;
  totalSleepHours:     number;
  avgSleepPerDay:      number;
  latestWeight?:       number;
  latestHeight?:       number;
  weightPercentile?:   number;
  upcomingVaccines:    string[];
  overdueVaccines:     string[];
  lastFedAgo?:         string;
  sleepToday?:         string;
  preferredLanguage:   'en' | 'fil' | 'zh';
}

export type Language = 'en' | 'fil' | 'zh';

// ── API key ──────────────────────────────────────────────────────────────────

const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY ?? '';
const CLAUDE_MODEL   = 'claude-haiku-4-5-20251001';
const API_URL        = 'https://api.anthropic.com/v1/messages';

// ── Language helpers ─────────────────────────────────────────────────────────

const LANG_NAMES: Record<Language, string> = {
  en:  'English',
  fil: 'Filipino (Tagalog)',
  zh:  'Simplified Chinese (Mandarin)',
};

export function detectLanguage(text: string): Language {
  // Simple heuristic: check for Chinese characters or Filipino keywords
  if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(text)) return 'zh';
  if (/\b(ano|paano|bakit|saan|gaano|kailan|sino|nanay|tatay|bata|sanggol|anak|po|naman|ba|nga|kasi|talaga)\b/i.test(text)) return 'fil';
  return 'en';
}

export function getDisclaimer(lang: Language): string {
  const disclaimers: Record<Language, string> = {
    en:  '\n\n---\n*This is general information only. Always consult your Pedia for medical concerns.* 👨‍⚕️',
    fil: '\n\n---\n*Pangkalahatang impormasyon lamang ito. Kumonsulta sa inyong Pedia para sa mga medikal na alalahanin.* 👨‍⚕️',
    zh:  '\n\n---\n*这只是一般性信息。如有医疗问题，请咨询您的儿科医生。* 👨‍⚕️',
  };
  return disclaimers[lang];
}

// ── System prompt builder ─────────────────────────────────────────────────────

export function buildSystemPrompt(child: Child, summary: WeeklySummary): string {
  const ageMonths = child.birthday
    ? Math.floor((Date.now() - new Date(child.birthday).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    : 0;
  const ageText  = ageMonths < 1 ? 'newborn' : `${ageMonths} months old`;
  const name     = child.nickname || child.firstName || 'the baby';
  const lang     = summary.preferredLanguage;
  const langName = LANG_NAMES[lang];

  const allergiesTxt = child.allergies?.length
    ? child.allergies.join(', ')
    : 'none recorded';

  const upcomingTxt = summary.upcomingVaccines.length
    ? summary.upcomingVaccines.slice(0, 5).join(', ')
    : 'none in next 30 days';

  const overdueTxt = summary.overdueVaccines.length
    ? summary.overdueVaccines.slice(0, 5).join(', ')
    : 'none';

  const weightTxt = summary.latestWeight
    ? `${summary.latestWeight} kg${summary.weightPercentile ? ` (WHO p${Math.round(summary.weightPercentile)})` : ''}`
    : 'not recorded';

  return `You are Ate AI — the warm, knowledgeable health assistant for BabyBloom PH.
Your persona: Like a trusted Ate (older sister) to Filipino parents. Friendly, caring, non-clinical tone.
You combine the warmth of a family member with evidence-based medical knowledge.

━━ CHILD PROFILE ━━
Name: ${name}
Age: ${ageText}
Sex: ${child.sex || 'unknown'}
Birth weight: ${child.birthWeight ? child.birthWeight + ' kg' : 'unknown'}
Gestational age: ${child.gestationalAge ? child.gestationalAge + ' weeks' : 'unknown'}
Known allergies: ${allergiesTxt}
Pediatrician: ${child.pediatricianName || 'not recorded'}

━━ CURRENT STATS ━━
Weight: ${weightTxt}
Height: ${summary.latestHeight ? summary.latestHeight + ' cm' : 'not recorded'}
Last fed: ${summary.lastFedAgo || 'unknown'}
Sleep today: ${summary.sleepToday || 'unknown'}

━━ PAST 7 DAYS ━━
Total feeds: ${summary.totalFeeds}
Avg volume per feed: ${summary.avgVolumeMl > 0 ? summary.avgVolumeMl + ' ml' : 'N/A (breastfed or not recorded)'}
Total sleep: ${summary.totalSleepHours.toFixed(1)} hours
Avg sleep/day: ${summary.avgSleepPerDay.toFixed(1)} hours

━━ VACCINES ━━
Upcoming: ${upcomingTxt}
Overdue: ${overdueTxt}

━━ GUIDELINES ━━
Always cite: WHO, DOH Philippines, Philippine Pediatric Society (PPS), AAP when relevant.
Philippines-specific: mention free DOH EPI vaccines at BHS/RHU when relevant.
Breastfeeding: align with DOH recommendation (exclusive for 6 months).
Red flags to ALWAYS escalate: fever in newborn <3 months, difficulty breathing, seizures, purple rash, won't wake up, severe dehydration.
NEVER give specific medication dosages.
For complementary foods: follow WHO/DOH IYCF guidelines.
Garantisadong Pambata: remind about free Vit A + deworming every January and July.

━━ LANGUAGE ━━
IMPORTANT: Respond ONLY in ${langName}.
Keep replies warm, concise, and practical. Use bullet points for lists.
End every response with the disclaimer in ${langName}.
Format: use markdown (bold, bullets) for clarity.`;
}

// ── Streaming chat ────────────────────────────────────────────────────────────

interface StreamOptions {
  messages:      ChatMessage[];
  child:         Child;
  summary:       WeeklySummary;
  onChunk:       (text: string) => void;
  onDone:        (fullText: string) => void;
  onError:       (error: string) => void;
  language:      Language;
}

export async function streamAteAIResponse(opts: StreamOptions): Promise<void> {
  const { messages, child, summary, onChunk, onDone, onError, language } = opts;

  if (!CLAUDE_API_KEY || CLAUDE_API_KEY === 'YOUR_CLAUDE_API_KEY') {
    // Demo mode — return a helpful message without API
    await simulateDemoResponse(child, messages, language, onChunk, onDone);
    return;
  }

  const systemPrompt = buildSystemPrompt(child, { ...summary, preferredLanguage: language });

  // Build message history (last 20, skip system-level)
  const apiMessages = messages.slice(-20).map(m => ({
    role:    m.role,
    content: m.content,
  }));

  try {
    const response = await fetch(API_URL, {
      method:  'POST',
      headers: {
        'Content-Type':                           'application/json',
        'x-api-key':                              CLAUDE_API_KEY,
        'anthropic-version':                      '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model:      CLAUDE_MODEL,
        max_tokens: 1024,
        stream:     true,
        system:     systemPrompt,
        messages:   apiMessages,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      // Gracefully fall back to demo mode for billing/quota errors
      if (response.status === 400 || response.status === 402 || response.status === 529) {
        const isCredits = errBody.includes('credit') || errBody.includes('balance') || errBody.includes('quota');
        if (isCredits) {
          await simulateDemoResponse(child, messages, language, onChunk, onDone);
          return;
        }
      }
      onError(`API error ${response.status}: ${errBody.substring(0, 200)}`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) { onError('No response stream'); return; }

    const decoder  = new TextDecoder();
    let   fullText = '';
    let   buffer   = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
            const chunk = parsed.delta.text ?? '';
            fullText   += chunk;
            onChunk(chunk);
          }
          if (parsed.type === 'message_stop') {
            // Append disclaimer
            const disclaimer = getDisclaimer(language);
            fullText += disclaimer;
            onChunk(disclaimer);
          }
        } catch { /* ignore parse errors on partial chunks */ }
      }
    }

    onDone(fullText);
  } catch (e: any) {
    onError(e?.message ?? 'Network error. Check your connection.');
  }
}

// ── Demo response (no API key) ─────────────────────────────────────────────

async function simulateDemoResponse(
  child: Child,
  messages: ChatMessage[],
  lang: Language,
  onChunk: (t: string) => void,
  onDone:  (t: string) => void,
): Promise<void> {
  const name     = child.nickname || child.firstName || 'your baby';
  const ageMonths = child.birthday
    ? Math.floor((Date.now() - new Date(child.birthday).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    : 0;

  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content ?? '';

  const demos: Record<Language, string[]> = {
    en: [
      `Hi Mommy! 🌸 I'm Ate AI, your BabyBloom health companion!\n\nI'm here to help you with **${name}'s** health journey. At **${ageMonths} months**, here's what I'd suggest watching:\n\n• **Feeding** — Track feeds consistently for the best insights\n• **Sleep** — ${ageMonths < 6 ? 'Newborns need 14–17 hours/day' : ageMonths < 12 ? 'Babies need 12–16 hours/day' : '12–14 hours is ideal'}\n• **Vaccines** — Stay on top of the DOH EPI schedule — free at your local BHS/RHU! 💉\n\nWhat would you like to know today?`,
      `Based on WHO and DOH Philippines guidelines, here's what I'd recommend for **${name}** at **${ageMonths} months**:\n\n${ageMonths < 6 ? '🤱 **Exclusive breastfeeding** is recommended for the first 6 months per DOH IYCF guidelines.\n\n• Breastfeed on demand — about 8–12 times per day\n• No water, juice, or other foods needed yet\n• Watch for 6+ wet diapers daily as a hydration sign' : ageMonths < 12 ? '🍚 **Complementary feeding** should now complement breastfeeding:\n\n• Start with soft, mashed Philippine superfoods: lugaw, kamote, kalabasa\n• Introduce one new food every 3–5 days\n• Continue breastfeeding alongside solids' : '🌟 **${name}** is growing so well! Continue balanced nutrition with family foods.'}\n\nRemember: free nutrition guidance is available at your Barangay Health Station! 🏥`,
    ],
    fil: [
      `Hoy, Nanay! 🌸 Ako si Ate AI, ang inyong health companion sa BabyBloom!\n\nNandito ako para tulungan kayo sa kalusugan ni **${name}**. Sa **${ageMonths} buwang** gulang niya, ito ang dapat bantayan:\n\n• **Pagpapakain** — Mag-track ng feeds para sa mas magandang insights\n• **Tulog** — ${ageMonths < 6 ? 'Kailangan ng sanggol ng 14–17 oras bawat araw' : '12–16 oras ang kailangan'}\n• **Bakuna** — Huwag palampasin ang DOH EPI schedule — libre sa BHS/RHU! 💉\n\nAno ang gusto ninyong malaman ngayon?`,
    ],
    zh: [
      `您好，妈妈！🌸 我是Ate AI，您的BabyBloom健康助手！\n\n我在这里帮助您关注**${name}**的健康成长。**${ageMonths}个月**大的宝宝，需要注意：\n\n• **喂养** — 定期记录喂奶情况以获得更好的健康分析\n• **睡眠** — ${ageMonths < 6 ? '新生儿需要每天14-17小时睡眠' : '婴儿需要每天12-16小时睡眠'}\n• **疫苗** — 请按时接种DOH EPI疫苗 — 在BHS/RHU免费接种！ 💉\n\n今天您想了解什么？`,
    ],
  };

  const responses = demos[lang];
  // Rotate based on message count
  const idx = Math.floor(messages.filter(m => m.role === 'assistant').length) % responses.length;
  let   response = responses[idx] ?? responses[0];

  // Add contextual response based on user's question
  if (lastUserMsg.toLowerCase().includes('vaccine') || lastUserMsg.toLowerCase().includes('bakuna') || lastUserMsg.includes('疫苗')) {
    response = lang === 'en'
      ? `Great question about vaccines! 💉\n\nFor **${name}** at **${ageMonths} months**, here's what the DOH Philippines EPI schedule recommends:\n\n${ageMonths <= 1 ? '• **BCG** — at birth (free at BHS)\n• **Hepatitis B** — at birth + 6 weeks + 14 weeks\n• **Pentavalent** — 6, 10, 14 weeks' : ageMonths <= 6 ? '• **Pentavalent 1-3** — 6, 10, 14 weeks\n• **OPV** — 6, 10, 14 weeks\n• **PCV** — 6, 10, 14 weeks\n• **Rotavirus** — 6, 10 weeks' : '• **MMR** — 9 months\n• **Varicella** — 12–15 months\n• **Booster doses** — see your schedule in the Vaccines tab'}\n\n🏥 **Free DOH EPI vaccines** are available at your nearest Barangay Health Station (BHS) or RHU!\n\n💊 Always bring your MCH Booklet to track doses.`
      : response;
  }

  if (lastUserMsg.toLowerCase().includes('feed') || lastUserMsg.toLowerCase().includes('milk') || lastUserMsg.toLowerCase().includes('pagkain')) {
    response = lang === 'en'
      ? `About feeding **${name}** 🍼\n\nAt **${ageMonths} months**, here's what DOH and WHO recommend:\n\n${ageMonths < 6 ? '🤱 **Exclusive breastfeeding** for the first 6 months:\n• Feed on demand, every 2–3 hours\n• 8–12 times per 24 hours is normal\n• Watch for weight gain and 6+ wet diapers/day\n\n*DOH strongly recommends exclusive breastfeeding — it provides complete nutrition and immunity.*' : ageMonths < 12 ? '🥄 **Continue breastfeeding + start solids** at 6 months:\n• Start with single-ingredient purees\n• Philippine superfoods: **lugaw, kamote, kalabasa, malunggay**\n• Introduce one new food every 3–5 days\n• Watch for allergy signs' : '🍚 **Family foods + continued breastfeeding:**\n• 3 meals + 2 snacks daily\n• Variety from all food groups\n• Breast milk until 2 years and beyond per WHO'}`
      : response;
  }

  // Simulate streaming
  const words = response.split('');
  let full = '';
  const CHUNK_SIZE = 3;
  for (let i = 0; i < words.length; i += CHUNK_SIZE) {
    const chunk = words.slice(i, i + CHUNK_SIZE).join('');
    full += chunk;
    onChunk(chunk);
    await new Promise(r => setTimeout(r, 8));
  }

  const disclaimer = getDisclaimer(lang);
  full += disclaimer;
  onChunk(disclaimer);
  onDone(full);
}

// ── Non-streaming helper (for AI summary cards) ────────────────────────────

export async function getAISummary(
  prompt: string,
  child: Child,
  summary: WeeklySummary,
): Promise<string> {
  if (!CLAUDE_API_KEY || CLAUDE_API_KEY === 'YOUR_CLAUDE_API_KEY') {
    return getDemoSummary(child, summary);
  }

  const systemPrompt = buildSystemPrompt(child, summary);
  try {
    const res = await fetch(API_URL, {
      method:  'POST',
      headers: {
        'Content-Type':                               'application/json',
        'x-api-key':                                  CLAUDE_API_KEY,
        'anthropic-version':                          '2023-06-01',
        'anthropic-dangerous-direct-browser-access':  'true',
      },
      body: JSON.stringify({
        model:      CLAUDE_MODEL,
        max_tokens: 200,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) return getDemoSummary(child, summary);
    const json = await res.json();
    return json.content?.[0]?.text ?? getDemoSummary(child, summary);
  } catch {
    return getDemoSummary(child, summary);
  }
}

function getDemoSummary(child: Child, summary: WeeklySummary): string {
  const name = child.nickname || child.firstName || 'baby';
  const ageMonths = child.birthday
    ? Math.floor((Date.now() - new Date(child.birthday).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    : 0;
  const lang = summary.preferredLanguage;

  if (lang === 'zh') {
    return `${name}本周总体状况${summary.totalFeeds > 0 ? '良好' : '待记录'}。${summary.totalSleepHours > 0 ? `共睡眠${summary.totalSleepHours.toFixed(0)}小时。` : ''}按时接种疫苗对${name}的健康非常重要。`;
  }
  if (lang === 'fil') {
    return `Si ${name} ay ${summary.totalFeeds > 0 ? 'maayos ang pagkain ngayong linggo' : 'kailangan ng mas maraming data para sa analysis'}. ${summary.totalSleepHours > 0 ? `Natulog ng ${summary.totalSleepHours.toFixed(0)} oras kabuuan.` : ''} Huwag palampasin ang mga bakunang libre sa BHS!`;
  }
  return `${name} is doing ${summary.totalFeeds > 0 ? 'great' : 'well'} at ${ageMonths} months! ${summary.totalFeeds > 0 ? `Fed ${summary.totalFeeds}x this week.` : 'Start logging feeds for personalized insights.'} ${summary.overdueVaccines.length > 0 ? `⚠️ ${summary.overdueVaccines.length} vaccine(s) overdue — visit your BHS/RHU.` : '✅ Vaccine schedule looks good!'}`;
}

// ── Dev access ────────────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  (window as any).__claudeLib = { streamAteAIResponse, getAISummary, buildSystemPrompt, detectLanguage };
}
