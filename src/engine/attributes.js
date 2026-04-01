// ============================================
// ARISE V3.0 — Attribute Matrix
// STR/AGI/INT/VIT/SNS/WIL calculations
// ============================================

import gameState from '../state/gameState.js';

export const ATTRIBUTES = {
  str: { key: 'str', name: 'Strength', icon: '<img src="/stat_str.png" style="width:100%;height:100%;object-fit:contain" alt="STR">', color: '#FF6B35' },
  agi: { key: 'agi', name: 'Agility', icon: '<img src="/stat_agi.png" style="width:100%;height:100%;object-fit:contain" alt="AGI">', color: '#FFD700' },
  int: { key: 'int', name: 'Intelligence', icon: '<img src="/stat_int.png" style="width:100%;height:100%;object-fit:contain" alt="INT">', color: '#2979FF' },
  vit: { key: 'vit', name: 'Vitality', icon: '<img src="/stat_vit.png" style="width:100%;height:100%;object-fit:contain" alt="VIT">', color: '#00E676' },
  sns: { key: 'sns', name: 'Sense', icon: '<img src="/stat_sns.png" style="width:100%;height:100%;object-fit:contain" alt="SNS">', color: '#E040FB' },
  wil: { key: 'wil', name: 'Willpower', icon: '<img src="/stat_wil.png" style="width:100%;height:100%;object-fit:contain" alt="WIL">', color: '#FF1744' },
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
    'B': '#A78BFA', 'A': '#C084FC', 'S': '#00E5FF'
  };
  return colors[rank] || '#6B7280';
}

export function addAttributePoints(stat, points) {
  const attrs = gameState.get('attributes');
  const knightBuff = getKnightBuff(stat);
  const finalPoints = Math.round(points * (1 + knightBuff));

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
  return 60 + Math.floor(agi / 10); // minutes
}

// Concentration multiplier (INT benefit)
export function getConcentrationMultiplier() {
  const int = gameState.get('attributes').int || 0;
  // At 100 INT, 25 mins → 30 mins (1.2x)
  return 1 + (int / 500);
}

// Penalty duration reduction (VIT benefit)
export function getPenaltyReduction() {
  const vit = gameState.get('attributes').vit || 0;
  const vitRank = getStatRank(vit);
  // B rank or above: 4h → 2.5h
  if (['B', 'A', 'S'].includes(vitRank)) {
    return 0.375; // 37.5% reduction
  }
  if (vitRank === 'C') return 0.15;
  if (vitRank === 'D') return 0.05;
  return 0;
}

// Hidden quest chance (SNS benefit)
export function getHiddenQuestChance() {
  const sns = gameState.get('attributes').sns || 0;
  return 1 + (sns * 0.1); // percentage
}

// Loot floor (WIL benefit)
export function getLootFloorBonus() {
  const wil = gameState.get('attributes').wil || 0;
  return Math.min(wil * 0.1, 15); // max 15% shift
}

// Knight shadow buff for physical stats
function getKnightBuff(stat) {
  const shadows = gameState.get('equippedShadows') || [];
  const allShadows = gameState.get('shadows') || [];
  let buff = 0;

  for (const id of shadows) {
    const shadow = allShadows.find(s => s.id === id);
    if (shadow && shadow.class === 'knight' && shadow.buff?.stat === stat) {
      buff += shadow.buff.value;
    }
  }

  return buff;
}

// Get all attribute values formatted
export function getAttributeSummary() {
  const attrs = gameState.get('attributes');
  return Object.entries(ATTRIBUTES).map(([key, info]) => ({
    key,
    ...info,
    value: attrs[key] || 0,
    rank: getStatRank(attrs[key] || 0),
    rankColor: getStatRankColor(getStatRank(attrs[key] || 0)),
  }));
}
