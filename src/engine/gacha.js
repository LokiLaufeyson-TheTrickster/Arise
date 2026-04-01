// ============================================
// ARISE V3.0 — Gacha / Shadow Extraction
// Probability engine + shadow generation
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
    'Shadow Imp', 'Dusk Crawler', 'Grim Footman', 'Dead Eyes', 'Rust Knight',
  ],
  elite: [
    'Steel Fang', 'Frost Reaver', 'Storm Blade', 'Iron Marshal', 'Crimson Viper',
    'Thunder Scout', 'Obsidian Warden', 'Phantom Lancer', 'Azure Knight', 'Flame Dancer',
  ],
  commander: [
    'Igris', 'Tank', 'Iron', 'Greed', 'Jima',
    'Beru', 'Tusk', 'Kaisel', 'Fangs', 'Shadow Marshal',
  ],
  monarch: [
    'Bellion', 'Igris the Crimson', 'Beru the Ant King', 'Grand Marshal Igris',
    'Ashborn\'s Vessel',
  ],
};

const SHADOW_ICONS = {
  common: [
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="18" y2="20"/><polyline points="15 7 12 4 9 7"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>'
  ],
  elite: [
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 17.5L3 6l4.5-4.5L19 13l4.5 4.5-4.5 4.5L14.5 17.5z"/><polyline points="14.5 17.5 19 13 22.5 16.5 18 21 14.5 17.5"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>'
  ],
  commander: [
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 16L12 2l10 14v6H2z"/><path d="M12 12v6"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
  ],
  monarch: [
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h20"/><path d="M12 2v20"/><path d="M4.93 4.93l14.14 14.14"/><path d="M19.07 4.93L4.93 19.07"/></svg>'
  ]
};

const SHADOW_CLASSES = ['assassin', 'knight', 'mage', 'tank', 'ranger'];

const BUFF_TEMPLATES = {
  common: null,
  elite: [
    { type: 'stat', value: 0.05 },
  ],
  commander: [
    { type: 'global_exp', value: 0.15 },
    { type: 'shop_discount', value: 0.10 },
    { type: 'stat', value: 0.12 },
  ],
  monarch: [
    { type: 'penalty_clear', value: 1 },
    { type: 'global_exp', value: 0.30 },
    { type: 'chain_shield', value: 1 },
    { type: 'double_stones', value: 1 },
  ],
};

export function canExtract() {
  return (gameState.get('essenceStones') || 0) >= EXTRACTION_COST;
}

export function getExtractionCost() {
  return EXTRACTION_COST;
}

export function performExtraction() {
  if (!canExtract()) return null;

  spendStones(10);
  gameState.set('totalExtractions', (gameState.get('totalExtractions') || 0) + 1);

  const tier = rollTier();
  
  // Generate basic shadow first
  let shadow = generateShadow(tier);

  // Check for duplicate
  const army = gameState.get('shadows') || [];
  const existing = army.find(s => s.name === shadow.name && s.tier === shadow.tier);

  if (existing) {
    existing.duplicates = (existing.duplicates || 0) + 1;
    gameState.set('shadows', [...army]);
    return { shadow: existing, isDuplicate: true };
  }

  army.push(shadow);
  gameState.set('shadows', army);

  return { shadow, isDuplicate: false };
}

export async function enhanceShadowAI(shadow, customName) {
  if (customName) shadow.name = customName;
  
  try {
    const { generateShadowLore, getPollinationsImageUrl } = await import('./ai.js');
    const aiData = await generateShadowLore(shadow.tier, shadow.class);
    if (aiData && aiData.name) {
      // Keep their custom name if they provided one, otherwise take AI's name suggestion
      shadow.name = customName || aiData.name;
      shadow.buff.desc = aiData.lore; // Overwrite description with AI lore
      shadow.imageUrl = getPollinationsImageUrl(aiData.imagePrompt);
    }
  } catch (err) {
    console.warn('AI Shadow Generation fallback to standard:', err);
  }

  return shadow;
}

function rollTier() {
  const lootBonus = getLootFloorBonus() / 100;
  let roll = Math.random();

  // WIL shifts the floor: increases rare chances
  // Redistribute loot bonus from common to higher tiers
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
  const names = SHADOW_NAMES[tier];
  const icons = SHADOW_ICONS[tier];
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

  // Tier multiplier
  let mult = 1;
  if (tier === 'elite') mult = 2;
  else if (tier === 'commander') mult = 4;
  else if (tier === 'monarch') mult = 8;
  
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
    imageUrl: null, // Will be populated by AI if available
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
  gameState.set('equippedShadows', equipped);

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
  gameState.set('equippedShadows', equipped);

  const shadows = gameState.get('shadows') || [];
  const shadow = shadows.find(s => s.id === shadowId);
  if (shadow) {
    shadow.equipped = false;
    gameState.set('shadows', [...shadows]);
  }
}

export function getTierLabel(tier) {
  const labels = {
    common: 'Infantry',
    elite: 'Knight',
    commander: 'Commander',
    monarch: 'Monarch Grade',
  };
  return labels[tier] || tier;
}

export function getTierColor(tier) {
  const colors = {
    common: '#6B7280',
    elite: '#2979FF',
    commander: '#7B2FBE',
    monarch: '#00E5FF',
  };
  return colors[tier] || '#6B7280';
}

export function getBuffDescription(buff) {
  if (!buff) return 'Evolution Material';
  const STAT_NAMES = { str: 'Strength', agi: 'Agility', int: 'Intelligence', vit: 'Vitality', sns: 'Sense', wil: 'Willpower' };
  switch (buff.type) {
    case 'stat': {
      const statLabel = STAT_NAMES[buff.stat] || (buff.stat || '').toUpperCase();
      return `+${typeof buff.value === 'number' && buff.value < 1 ? (buff.value * 100).toFixed(0) + '%' : buff.value} ${statLabel}`;
    }
    case 'global_exp': return `+${(buff.value * 100).toFixed(0)}% Global EXP`;
    case 'shop_discount': return `${(buff.value * 100).toFixed(0)}% Shop Discount`;
    case 'penalty_clear': return 'Instant Penalty Clear';
    case 'chain_shield': return 'Chain Break Shield (1×)';
    case 'double_stones': return '2× Stone Drops';
    default: {
      // Legacy fallback: buff.type might be a stat key like 'str', 'agi', etc.
      if (STAT_NAMES[buff.type]) {
        return `+${buff.value} ${STAT_NAMES[buff.type]}`;
      }
      return buff.desc || 'Passive Buff';
    }
  }
}
