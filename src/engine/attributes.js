// ============================================
// ARISE V4.0 — Attribute Matrix
// STR/AGI/INT/VIT/SNS/WIL calculations
// ============================================

import gameState from '../state/gameState.js';
import { getIcon } from './icons.js';

export const ATTRIBUTES = {
  str: { key: 'str', name: 'Strength', iconType: 'str', color: '#FF6B35' },
  agi: { key: 'agi', name: 'Agility', iconType: 'agi', color: '#FFD700' },
  int: { key: 'int', name: 'Intelligence', iconType: 'int', color: '#2979FF' },
  vit: { key: 'vit', name: 'Vitality', iconType: 'vit', color: '#00E676' },
  sns: { key: 'sns', name: 'Sense', iconType: 'sns', color: '#E040FB' },
  wil: { key: 'wil', name: 'Willpower', iconType: 'wil', color: '#FF1744' },
};

// Rank thresholds per attribute
export const STAT_RANKS = [
  { rank: 'E', min: 0, max: 49 },
  { rank: 'D', min: 50, max: 99 },
  { rank: 'C', min: 100, max: 199 },
  { rank: 'B', min: 200, max: 349 },
  { rank: 'A', min: 350, max: 499 },
  { rank: 'S', min: 500, max: Infinity },
];

export function getStatRank(value) {
  for (const tier of STAT_RANKS) {
    if (value >= tier.min && value <= tier.max) return tier.rank;
  }
  return 'E';
}

export function getStatRankColor(rank) {
  const colors = {
    'E': '#6B7280', 'D': '#60A5FA', 'C': '#00E5FF',
    'B': '#A78BFA', 'A': '#C084FC', 'S': '#FF1744'
  };
  return colors[rank] || '#6B7280';
}

export function addAttributePoints(stat, points) {
  const attrs = gameState.get('attributes');
  const shadowBuff = getShadowStatBuff(stat);
  const finalPoints = Math.round(points * (1 + shadowBuff));

  attrs[stat] = (attrs[stat] || 0) + finalPoints;
  gameState.set('attributes', { ...attrs });

  return finalPoints;
}

// Stamina system (STR benefit)
export function getStaminaFloor() {
  const str = gameState.get('attributes').str || 0;
  return str * 0.5; // minutes
}

// Chain-Link window (AGI benefit)
export function getChainWindow() {
  const agi = gameState.get('attributes').agi || 0;
  return 60 + Math.floor(agi / 10); 
}

// Concentration multiplier (INT benefit)
export function getConcentrationMultiplier() {
  const int = gameState.get('attributes').int || 0;
  return 1 + (int / 500);
}

// Penalty duration reduction (VIT benefit)
export function getPenaltyReduction() {
  const vit = gameState.get('attributes').vit || 0;
  const vitRank = getStatRank(vit);
  if (['B', 'A', 'S'].includes(vitRank)) {
    return 0.375; 
  }
  if (vitRank === 'C') return 0.15;
  if (vitRank === 'D') return 0.05;
  return 0;
}

// Hidden quest chance (SNS benefit)
export function getHiddenQuestChance() {
  const sns = gameState.get('attributes').sns || 0;
  return 1 + (sns * 0.1); 
}

// Loot floor (WIL benefit)
export function getLootFloorBonus() {
  const wil = gameState.get('attributes').wil || 0;
  return Math.min(wil * 0.1, 15); 
}

// Shadow buff for stats 
function getShadowStatBuff(stat) {
  const equippedIds = gameState.get('equippedShadows') || [];
  const allShadows = gameState.get('shadows') || [];
  let buff = 0;

  for (const id of equippedIds) {
    const shadow = allShadows.find(s => s.id === id);
    if (!shadow || !shadow.buff) continue;
    
    if (shadow.buff.type === 'stat' && shadow.buff.stat === stat) {
      buff += shadow.buff.value;
    }
    else if (shadow.buff.type === stat) {
      buff += shadow.buff.value;
    }
  }

  return buff;
}

// Get all attribute values formatted (Base + Shadows + Equipment)
export function getAttributeSummary() {
  const attrs = gameState.get('attributes') || {};
  const equipment = gameState.get('equipment') || {};
  
  return Object.entries(ATTRIBUTES).map(([key, info]) => {
    const baseValue = attrs[key] || 0;
    
    // Shadow Buffs
    const shadowBonus = getShadowStatBuff(key);
    
    // Equipment Buffs
    let equipBonus = 0;
    Object.values(equipment).forEach(item => {
      if (item && item.stats && item.stats[key]) {
        equipBonus += item.stats[key];
      }
    });

    const totalValue = baseValue + shadowBonus + equipBonus;
    const rank = getStatRank(totalValue);
    
    return {
      key,
      ...info,
      // Wrap the SVG from iconType
      icon: getIcon(info.iconType, info.color),
      baseValue,
      shadowBonus,
      equipBonus,
      value: totalValue,
      rank,
      rankColor: getStatRankColor(rank),
    };
  });
}
