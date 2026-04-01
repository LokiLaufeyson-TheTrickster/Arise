// ============================================
// ARISE V3.0 — AI System Engine (Gemini)
// Minimal tokens, structured JSON output
// ============================================

import gameState from '../state/gameState.js';
import { CATEGORIES } from './rankSystem.js';

const GEMINI_VERSION = 'v1beta';
const GEMINI_MODEL = 'gemini-2.0-flash'; // Updated from deprecated 1.5-flash

function getApiKey() {
  const settings = gameState.get('settings') || {};
  return settings.geminiKey;
}

/**
 * Core completion engine using Gemini REST API
 */
async function fetchGeminiCompletion(prompt, systemInstruction = '', requireJson = true) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('SYSTEM OFFLINE: Gemini API Key required in Settings.');
  }

  const url = `https://generativelanguage.googleapis.com/${GEMINI_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    system_instruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 250, // Strict token limit
      responseMimeType: requireJson ? 'application/json' : 'text/plain',
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || 'API Error');
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (requireJson) {
      try {
        return JSON.parse(rawText);
      } catch (e) {
        throw new Error('System output corrupted (Invalid JSON).');
      }
    }

    return rawText;
  } catch (err) {
    console.error('Gemini Failure:', err);
    throw err;
  }
}

/**
 * Takes a simple 1-3 word task and expands it into an RPG Quest
 */
export async function enhanceQuest(title) {
  const system = `You are "The System" from Solo Leveling. You are a cold, absolute, and commanding RPG interface assigning a mission to the Hunter.
  Turn the user's boring real-world task into an epic, high-stakes dungeon description (max 2 sentences).
  Recommend a difficulty (trivial, normal, hard, extreme).
  Recommend the primary stat this requires (str, agi, int, vit, sns, wil).
  Recommend the category (work, fitness, study, personal).

  Respond ONLY with this exact JSON structure:
  {"epicTitle": "str", "lore": "str", "difficulty": "str", "stat": "str", "category": "str"}`;

  const prompt = `Task: ${title}`;

  return await fetchGeminiCompletion(prompt, system, true);
}

/**
 * Generates Shadow traits, lore, and an image prompt
 */
export async function generateShadowLore(tier, baseClass) {
  const system = `You are "The System" from Solo Leveling extracting a shadow soldier from a defeated enemy.
  The soldier is tier: ${tier.toUpperCase()}, Class: ${baseClass.toUpperCase()}.
  Provide:
  1. A cool, lore-accurate shadow name (1-2 words).
  2. A brutal 1-sentence backstory.
  3. A visually striking physical description (for an image generator). Focus on 'OLED pure black, glowing cyan/purple smoke, solo leveling shadow soldier aesthetic, highly detailed dark fantasy'. Include the background as 'pitch black void'.

  Respond ONLY with JSON:
  {"name": "str", "lore": "str", "imagePrompt": "str"}`;

  const prompt = `Extract ${tier} ${baseClass}.`;
  
  return await fetchGeminiCompletion(prompt, system, true);
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
