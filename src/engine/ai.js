// ============================================
// ARISE V4.0 — AI System Engine (OpenRouter)
// Advanced model routing, structured JSON
// ============================================

import gameState from '../state/gameState.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'stepfun/step-3.5-flash:free';

function getApiKey() {
  const settings = gameState.get('settings') || {};
  return settings.openRouterKey || null;
}

/**
 * Core completion engine using OpenRouter OpenAI-compatible API
 */
async function fetchAICompletion(prompt, systemInstruction = '', requireJson = true) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('SYSTEM OFFLINE: OpenRouter API Key required in Settings.');
  }

  const payload = {
    model: DEFAULT_MODEL,
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 500,
    response_format: requireJson ? { type: 'json_object' } : undefined
  };

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://arise-v4.vercel.app', // Required for OpenRouter
        'X-Title': 'Arise V4'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || 'AI System Error');
    }

    const rawText = data.choices?.[0]?.message?.content || '';
    
    if (requireJson) {
      try {
        return JSON.parse(rawText);
      } catch (e) {
        // Fallback for models that don't strictly follow JSON format if not requested
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        throw new Error('System output corrupted (Invalid JSON).');
      }
    }

    return rawText;
  } catch (err) {
    console.error('AI Failure:', err);
    throw err;
  }
}

/**
 * Takes a simple 1-3 word task and expands it into an RPG Quest
 */
export async function enhanceQuest(title) {
  const system = `You are "The System" from Solo Leveling. You are a cold, absolute, and commanding RPG interface.
  Turn the user's task into an epic, high-stakes dungeon description (max 2 sentences).
  Recommend a difficulty (trivial, normal, hard, extreme).
  Recommend the primary stat (str, agi, int, vit, sns, wil).
  Recommend the category (work, fitness, study, personal).

  Respond ONLY with JSON:
  {"epicTitle": "str", "lore": "str", "difficulty": "str", "stat": "str", "category": "str"}`;

  return await fetchAICompletion(`Task: ${title}`, system, true);
}

/**
 * AI Judge for task abandonment
 */
export async function judgeAbandonment(title, reason) {
  const system = `You are "The System". A Hunter is attempting to abandon a quest.
  Analyze their reason. Be harsh but fair.
  Provide a score from 0 to 100 (100 = perfectly valid reason like medical emergency, 0 = pure laziness).
  Provide a cold response judging them.

  Respond ONLY with JSON:
  {"score": number, "judgment": "str"}`;

  return await fetchAICompletion(`Quest: ${title}\nReason for abandonment: ${reason}`, system, true);
}

/**
 * Generates Shadow traits, lore, and an image prompt
 */
export async function generateShadowLore(tier, baseClass) {
  const system = `You are "The System" extracting a shadow soldier.
  Tier: ${tier.toUpperCase()}, Class: ${baseClass.toUpperCase()}.
  Provide:
  1. Lore-accurate shadow name (1-2 words).
  2. Brutal 1-sentence backstory.
  3. Physical description focusing on 'OLED Pure Black, Glowing Cyan smoke, Solo Leveling aesthetic'.

  Respond ONLY with JSON:
  {"name": "str", "lore": "str", "imagePrompt": "str"}`;

  return await fetchAICompletion(`Extracting ${tier} ${baseClass}.`, system, true);
}

export function getPollinationsImageUrl(prompt, width = 400, height = 400) {
  const encodedPrompt = encodeURIComponent(prompt + ' | seed ' + Date.now());
  const settings = gameState.get('settings') || {};
  const pollKey = settings.pollinationsKey ? `&token=${settings.pollinationsKey}` : '';
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&safe=false&model=flux-anime${pollKey}`;
}
