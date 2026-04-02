// ============================================
// ARISE V3.0 — Rank System & EXP
// Player progression engine
// ============================================

import gameState from '../state/gameState.js';

export const RANKS = [
  { rank: 'e', name: 'E-Rank', minLevel: 1, maxLevel: 10 },
  { rank: 'd', name: 'D-Rank', minLevel: 11, maxLevel: 25 },
  { rank: 'c', name: 'C-Rank', minLevel: 26, maxLevel: 50 },
  { rank: 'b', name: 'B-Rank', minLevel: 51, maxLevel: 80 },
  { rank: 'a', name: 'A-Rank', minLevel: 81, maxLevel: 120 },
  { rank: 's', name: 'S-Rank', minLevel: 121, maxLevel: Infinity },
];

export const DIFFICULTY = {
  trivial:  { label: 'Trivial',    color: '#6B7280', exp: 10,  stones: 1,  statBonus: 0,  expMult: 0.5 },
  easy:     { label: 'Easy',       color: '#00E676', exp: 25,  stones: 3,  statBonus: 1,  expMult: 0.8 },
  normal:   { label: 'Normal',     color: '#2979FF', exp: 50,  stones: 5,  statBonus: 2,  expMult: 1.0 },
  hard:     { label: 'Hard',       color: '#7B2FBE', exp: 100, stones: 10, statBonus: 4,  expMult: 1.5 },
  ultra:    { label: 'Ultra Hard', color: '#FFD700', exp: 250, stones: 25, statBonus: 8,  expMult: 2.0 },
  extreme:  { label: 'Extreme',    color: '#FF1744', exp: 500, stones: 50, statBonus: 15, expMult: 3.0 },
};

export const CATEGORIES = [
  { 
    key: 'work', label: 'Work', icon: '💼', 
    stats: { int: 0.7, wil: 0.3 },
    desc: 'Professional missions that sharpen the mind and resolve.'
  },
  { 
    key: 'fitness', label: 'Fitness', icon: '⚡', 
    stats: { vit: 0.7, str: 0.3 },
    desc: 'Physical trials to transcend human limits.'
  },
  { 
    key: 'study', label: 'Study', icon: '📚', 
    stats: { int: 0.7, sns: 0.3 },
    desc: 'Acquiring forbidden knowledge and heightened perception.'
  },
  { 
    key: 'social', label: 'Social', icon: '🤝', 
    stats: { sns: 0.7, agi: 0.3 },
    desc: 'Interactions that hone your instincts and movement.'
  },
  { 
    key: 'personal', label: 'Personal', icon: '🧘', 
    stats: { wil: 0.7, agi: 0.3 },
    desc: 'Self-discipline and flexibility of character.'
  },
  { 
    key: 'hobby', label: 'Hobby', icon: '🎨', 
    stats: { str: 0.5, sns: 0.5 },
    desc: 'Specialized skills that balance power and precision.'
  }
];

// EXP needed for a given level
export function expForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.5));
}

// Get current rank based on level
export function getRankForLevel(level) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (level >= RANKS[i].minLevel) return RANKS[i];
  }
  return RANKS[0];
}

// Award EXP and handle level-ups
// Returns { levelsGained, newLevel, expGained, rankChanged, newRank }
export function awardEXP(amount) {
  let exp = gameState.get('exp');
  let level = gameState.get('level');
  const oldRank = gameState.get('rank');
  let levelsGained = 0;

  exp += amount;

  // Check for level-ups (can level multiple times)
  while (exp >= expForLevel(level)) {
    exp -= expForLevel(level);
    level++;
    levelsGained++;
  }

  const newRankInfo = getRankForLevel(level);
  const rankChanged = newRankInfo.rank !== oldRank;

  gameState.batch({
    exp,
    level,
    rank: newRankInfo.rank,
    totalExpEarned: (gameState.get('totalExpEarned') || 0) + amount,
  });

  return {
    levelsGained,
    newLevel: level,
    expGained: amount,
    rankChanged,
    newRank: newRankInfo.rank,
    newRankName: newRankInfo.name,
  };
}

// Award Essence Stones
export function awardStones(amount) {
  const mageBuff = getMageBuff();
  const finalAmount = Math.round(amount * (1 + mageBuff));

  const current = gameState.get('essenceStones') || 0;
  gameState.batch({
    essenceStones: current + finalAmount,
    totalStonesEarned: (gameState.get('totalStonesEarned') || 0) + finalAmount,
  });

  return finalAmount;
}

// Spend stones (returns false if not enough)
export function spendStones(amount) {
  const current = gameState.get('essenceStones') || 0;
  if (current < amount) return false;
  gameState.set('essenceStones', current - amount);
  return true;
}

// Get level progress percentage
export function getLevelProgress() {
  const exp = gameState.get('exp');
  const level = gameState.get('level');
  const needed = expForLevel(level);
  return Math.min((exp / needed) * 100, 100);
}

// Mage shadow buff
function getMageBuff() {
  const shadows = gameState.get('equippedShadows') || [];
  const allShadows = gameState.get('shadows') || [];
  let buff = 0;

  for (const id of shadows) {
    const s = allShadows.find(sh => sh.id === id);
    if (s && s.class === 'mage') {
      buff += s.buff?.value || 0;
    }
  }

  return buff;
}
