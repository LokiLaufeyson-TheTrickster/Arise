// ============================================
// ARISE V4.0 — AI System Engine (OpenRouter)
// Minimal tokens, structured JSON output
// ============================================

import gameState from '../state/gameState.js';

const OPENROUTER_MODEL = 'meta-llama/llama-3.1-8b-instruct:free';

function getApiKey() {
  const settings = gameState.get('settings') || {};
  return settings.openrouterKey || settings.geminiKey; // Fallback for transition
}

/**
 * Core completion engine using OpenRouter Chat API
 */
async function fetchAICompletion(prompt, systemInstruction = '', requireJson = true) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('SYSTEM OFFLINE: OpenRouter API Key required in Settings.');
  }

  const url = `https://openrouter.ai/api/v1/chat/completions`;

  const payload = {
    model: OPENROUTER_MODEL,
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 300,
    response_format: requireJson ? { type: 'json_object' } : undefined
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Arise V4.0'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || 'API Error');
    }

    const rawText = data.choices?.[0]?.message?.content || '';
    
    if (requireJson) {
      try {
        // Some models still wrap in markdown blocks despite response_format
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        const cleanJson = jsonMatch ? jsonMatch[0] : rawText;
        return JSON.parse(cleanJson);
      } catch (e) {
        console.error('JSON Parse Error:', rawText);
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
  Recommend:
  - difficulty: trivial, normal, hard, extreme
  - stat: str, agi, int, vit, sns, wil
  - category: work, fitness, study, personal
  - multiStats: [string] (list of stats it should boost)

  Respond ONLY with this JSON:
  {"epicTitle": "str", "lore": "str", "difficulty": "str", "stat": "str", "category": "str", "multiStats": []}`;

  const prompt = `Task: ${title}`;

  return await fetchAICompletion(prompt, system, true);
}

/**
 * Judges the validity of a task abandonment reason
 */
export async function evaluateAbandonment(reason, taskTitle) {
  const system = `You are "The System". A Hunter is attempting to abandon the Quest: "${taskTitle}".
  He says: "${reason}".
  Judge this reason with cold calculation. Is it a valid emergency/necessity, or just weakness?
  
  Provide:
  1. score: 0-100 (0 = Total Cowardice/Lazy, 100 = Life-or-death Emergency)
  2. judgment: A brutal 1-sentence verdict.
  
  Respond ONLY with JSON:
  {"score": number, "judgment": "string"}`;

  return await fetchAICompletion(`Reason: ${reason}`, system, true);
}

/**
 * Generates Shadow traits, lore, and an image prompt
 */
export async function generateShadowLore(tier, baseClass) {
  const system = `You are "The System". Extracting a shadow soldier.
  Tier: ${tier.toUpperCase()}, Class: ${baseClass.toUpperCase()}.
  Provide:
  1. name: cool name (1-2 words).
  2. lore: 1-sentence backstory.
  3. imagePrompt: Visually striking description (OLED pure black, glowing cyan smoke, highly detailed dark fantasy, pitch black background).
  
  Respond ONLY with JSON:
  {"name": "str", "lore": "str", "imagePrompt": "str"}`;

  return await fetchAICompletion(`Extract ${tier} ${baseClass}.`, system, true);
}

/**
 * Generates an image URL using pollinations.ai 
 */
export function getPollinationsImageUrl(prompt, width = 400, height = 400) {
  // We append random seed to avoid browser caching identical prompts
  // We append random seed to avoid browser caching identical prompts
  const encodedPrompt = encodeURIComponent(prompt + ' | seed ' + Date.now());
  const settings = gameState.get('settings') || {};
  const pollKey = settings.pollinationsKey ? `&token=${settings.pollinationsKey}` : '';
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&safe=false&model=flux-anime${pollKey}`;
}
