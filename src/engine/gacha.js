// ============================================
// ARISE V4.0 — Shadow Army Engine
// RNG Extraction + SVG Shadow Generation
// ============================================

import gameState from '../state/gameState.js';
import { getLootFloorBonus } from './attributes.js';
import { spendStones } from './rankSystem.js';

const EXTRACTION_COST = 10;

const TIER_RATES = {
  common:    0.70,
  elite:     0.20,
  commander: 0.075,
  monarch:   0.025,
};

// Shadow name pools
const SHADOW_NAMES = {
  common: [
    'Iron Shade', 'Dust Walker', 'Void Grunt', 'Dark Pawn', 'Ash Wraith',
    'Hollow Guard', 'Mist Stalker', 'Bone Sentry', 'Pale Soldier', 'Night Wisp',
  ],
  elite: [
    'Steel Fang', 'Frost Reaver', 'Storm Blade', 'Iron Marshal', 'Crimson Viper',
    'Obsidian Warden', 'Phantom Lancer', 'Azure Knight', 'Flame Dancer',
  ],
  commander: [
    'Igris', 'Tank', 'Iron', 'Greed', 'Jima',
    'Beru', 'Tusk', 'Kaisel', 'Fangs', 'Shadow Marshal',
  ],
  monarch: [
    'Bellion', 'Beru the Ant King', 'Grand Marshal Igris',
    'Shade of Ashborn', 'Absolute Void',
  ],
};

const SHADOW_ICONS = {
  common: [
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>'
  ],
  elite: [
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>'
  ],
  commander: [
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 16L12 2l10 14v6H2z"/><path d="M12 12v6"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
  ],
  monarch: [
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h20"/><path d="M12 2v20"/><path d="M4.93 4.93l14.14 14.14"/></svg>'
  ]
};

const SHADOW_CLASSES = ['assassin', 'knight', 'mage', 'tank', 'ranger'];

export function canExtract() {
  return (gameState.get('essenceStones') || 0) >= EXTRACTION_COST;
}

export function getExtractionCost() {
  return EXTRACTION_COST;
}

export function performExtraction() {
  if (!canExtract()) return null;

  spendStones(EXTRACTION_COST);
  gameState.set('totalExtractions', (gameState.get('totalExtractions') || 0) + 1);

  const tier = rollTier();
  const shadow = generateShadow(tier);

  const army = gameState.get('shadows') || [];
  const existing = army.find(s => s.name === shadow.name && s.tier === shadow.tier);

  if (existing) {
    existing.duplicates = (existing.duplicates || 0) + 1;
    gameState.set('shadows', [...army]);
    return { shadow: existing, isDuplicate: true };
  }

  army.push(shadow);
  gameState.set('shadows', [...army]);

  return { shadow, isDuplicate: false };
}

/**
 * AI Enhancement for Shadows (Lore Only - No Images)
 */
export async function enhanceShadowAI(shadow, customName) {
  if (customName) shadow.name = customName;
  
  try {
    const { generateShadowLore } = await import('./ai.js');
    const aiData = await generateShadowLore(shadow.tier, shadow.class);
    if (aiData) {
      if (!customName && aiData.name) shadow.name = aiData.name;
      shadow.buff.desc = aiData.lore;
    }
  } catch (err) {
    console.warn('AI Shadow Enhancement failed:', err);
  }

  return shadow;
}

function rollTier() {
  const lootBonus = (getLootFloorBonus() || 0) / 100;
  let roll = Math.random();

  const adjustedRates = { ...TIER_RATES };
  adjustedRates.common = Math.max(0.40, adjustedRates.common - lootBonus);
  const redistributed = lootBonus / 3;
  adjustedRates.elite += redistributed;
  adjustedRates.commander += redistributed;
  adjustedRates.monarch += redistributed;

  let cumulative = 0;
  for (const [tier, rate] of Object.entries(adjustedRates)) {
    cumulative += rate;
    if (roll <= cumulative) return tier;
  }
  return 'common';
}

function generateShadow(tier) {
  const id = `shadow_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const names = SHADOW_NAMES[tier] || SHADOW_NAMES.common;
  const icons = SHADOW_ICONS[tier] || SHADOW_ICONS.common;
  const name = names[Math.floor(Math.random() * names.length)];
  const icon = icons[Math.floor(Math.random() * icons.length)];
  const shadowClass = SHADOW_CLASSES[Math.floor(Math.random() * SHADOW_CLASSES.length)];

  let buffStats = [];
  switch (shadowClass) {
    case 'assassin': buffStats = ['agi', 'sns']; break;
    case 'knight': buffStats = ['str', 'vit']; break;
    case 'mage': buffStats = ['int', 'sns']; break;
    case 'tank': buffStats = ['vit', 'str']; break;
    case 'ranger': buffStats = ['sns', 'agi']; break;
    default: buffStats = ['str', 'int'];
  }

  let mult = 1;
  if (tier === 'elite') mult = 2;
  else if (tier === 'commander') mult = 4;
  else if (tier === 'monarch') mult = 6;
  
  const chosenStat = buffStats[Math.floor(Math.random() * buffStats.length)];
  const statValue = Math.floor((Math.random() * 2 + 1) * mult);
  
  const buff = {
    type: 'stat',
    stat: chosenStat,
    value: statValue,
    desc: `+${statValue} ${chosenStat.toUpperCase()}`
  };

  return {
    id,
    tier,
    class: shadowClass,
    name,
    emoji: icon,
    buff,
    level: 1,
    duplicates: 0,
    equipped: false,
    extractedAt: new Date().toISOString(),
  };
}

export function equipShadow(shadowId) {
  const equipped = gameState.get('equippedShadows') || [];
  if (equipped.length >= 10) return false;
  if (equipped.includes(shadowId)) return false;

  equipped.push(shadowId);
  gameState.set('equippedShadows', [...equipped]);

  const shadows = gameState.get('shadows') || [];
  const shadow = shadows.find(s => s.id === shadowId);
  if (shadow) {
    shadow.equipped = true;
    gameState.set('shadows', [...shadows]);
  }
  return true;
}

export function unequipShadow(shadowId) {
  let equipped = gameState.get('equippedShadows') || [];
  equipped = equipped.filter(id => id !== shadowId);
  gameState.set('equippedShadows', [...equipped]);

  const shadows = gameState.get('shadows') || [];
  const shadow = shadows.find(s => s.id === shadowId);
  if (shadow) {
    shadow.equipped = false;
    gameState.set('shadows', [...shadows]);
  }
}

export function getTierLabel(tier) {
  const labels = { common: 'Infantry', elite: 'Knight', commander: 'Commander', monarch: 'Monarch Grade' };
  return labels[tier] || tier;
}

export function getTierColor(tier) {
  const colors = { common: '#6B7280', elite: '#2979FF', commander: '#7B2FBE', monarch: '#00E5FF' };
  return colors[tier] || '#6B7280';
}

export function getBuffDescription(buff) {
  if (!buff) return 'Loyal Soldier';
  const STAT_NAMES = { str: 'Strength', agi: 'Agility', int: 'Intelligence', vit: 'Vitality', sns: 'Sense', wil: 'Willpower' };
  if (buff.type === 'stat') {
    const statLabel = STAT_NAMES[buff.stat] || (buff.stat || '').toUpperCase();
    return `+${buff.value} ${statLabel}`;
  }
  return buff.desc || 'Passive Buff';
}
