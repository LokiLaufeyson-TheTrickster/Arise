// ============================================
// ARISE V4.0 — AI System Engine (OpenRouter)
// Multi-model fallback, structured JSON
// ============================================

import gameState from '../state/gameState.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Fallback chain — if one model fails, try the next
const MODEL_CHAIN = [
  'meta-llama/llama-3.1-8b-instruct:free',
  'qwen/qwen-2.5-7b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'huggingfaceh4/zephyr-7b-beta:free'
];

function getApiKey() {
  const settings = gameState.get('settings') || {};
  return settings.openRouterKey || null;
}

/**
 * Core completion engine using OpenRouter OpenAI-compatible API
 * Tries each model in MODEL_CHAIN until one succeeds
 */
async function fetchAICompletion(prompt, systemInstruction = '', requireJson = true) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('SYSTEM OFFLINE: OpenRouter API Key required in Settings.');
  }

  let lastError = null;

  for (const model of MODEL_CHAIN) {
    try {
      const payload = {
        model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: requireJson ? { type: 'json_object' } : undefined
      };

      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://arise-v4.vercel.app',
          'X-Title': 'Arise V4'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        console.warn(`Model ${model} failed:`, data.error?.message);
        lastError = new Error(data.error?.message || 'AI System Error');
        continue; // Try next model
      }

      const rawText = data.choices?.[0]?.message?.content || '';

      if (requireJson) {
        try {
          return JSON.parse(rawText);
        } catch (e) {
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) return JSON.parse(jsonMatch[0]);
          console.warn(`Model ${model} returned invalid JSON, trying next...`);
          lastError = new Error('System output corrupted (Invalid JSON).');
          continue;
        }
      }

      return rawText;
    } catch (err) {
      console.warn(`Model ${model} errored:`, err.message);
      lastError = err;
      continue;
    }
  }

  // All models failed
  console.error('All AI models exhausted:', lastError);
  throw lastError || new Error('All AI models failed.');
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
