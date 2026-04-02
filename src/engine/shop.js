// ============================================
// ARISE V4.0 — Store & Equipment Engine
// Tier-locked items, Potion logic, SVG Rewards
// ============================================

import gameState from '../state/gameState.js';
import { spendStones } from './rankSystem.js';
import { healHp, restoreMp } from './attributes.js';

// SVG Paths for high-quality icons
const SHOP_ICONS = {
  potion_hp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v3"/><path d="M14 2v3"/><path d="M8 5h8v2a4 4 0 0 1-4 4 4 4 0 0 1-4-4V5z"/><path d="M19 10H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2z"/></svg>',
  potion_mp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 9h9l-7 5 3 8-8-5-8 5 3-8-7-5h9l3-9z"/></svg>',
  dagger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14.5 12.5-8 8-4-4 8-8"/><path d="m8.5 6.5 11-1 2 2-1 11z"/><path d="m15 15 6 6"/><path d="m15 15 2.5 2.5"/></svg>',
  ring: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7"/><path d="M12 5V2"/><path d="M12 11V8"/></svg>',
  coffee: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>',
  game: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><rect x="15" y="13" width="2" height="2"/><rect x="17" y="11" width="2" height="2"/><path d="M21 15V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z"/></svg>'
};

export const SHOP_ITEMS = [
  // --- Consumables ---
  { 
    id: 'hp_potion_small', 
    name: 'Small HP Potion', 
    type: 'consumable', 
    tier: 'E', 
    cost: 5, 
    icon: SHOP_ICONS.potion_hp, 
    effect: 'HEAL_HP', 
    value: 20,
    desc: 'Breathes a small amount of life back into a weary Hunter.'
  },
  { 
    id: 'mp_potion_small', 
    name: 'Small MP Potion', 
    type: 'consumable', 
    tier: 'E', 
    cost: 10, 
    icon: SHOP_ICONS.potion_mp, 
    effect: 'RESTORE_MP', 
    value: 10,
    desc: 'Restores a fragment of Mana to fuel your skills.'
  },
  
  // --- Equipment (Tier-Locked) ---
  { 
    id: 'kasaka_dagger', 
    name: "Kasaka's Venom Fang", 
    type: 'equipment', 
    tier: 'C', 
    cost: 150, 
    icon: SHOP_ICONS.dagger, 
    stats: { agi: 10, str: 5 },
    desc: 'A dagger forged from the fang of a blue poison-scaled great serpent.'
  },
  { 
    id: 'monarch_ring', 
    name: 'Ring of the Monarch', 
    type: 'equipment', 
    tier: 'S', 
    cost: 1000, 
    icon: SHOP_ICONS.ring, 
    stats: { int: 50, wil: 50 },
    desc: 'A divine artifact that radiates overwhelming authority.'
  },

  // --- Real World Rewards (Searchable Gallery) ---
  {
    id: 'reward_coffee',
    name: 'Iced Americano',
    type: 'reward',
    tier: 'E',
    cost: 20,
    icon: SHOP_ICONS.coffee,
    desc: 'A standard-issue Hunter stimulant. Real-world reward.'
  },
  {
    id: 'reward_game_time',
    name: '1 Hour Gaming',
    type: 'reward',
    tier: 'D',
    cost: 50,
    icon: SHOP_ICONS.game,
    desc: 'Brief respite from the eternal grind. Real-world reward.'
  }
];

/**
 * Merges system items with user-defined custom rewards
 */
export function getShopItems() {
  const custom = gameState.get('customRewards') || [];
  return [...SHOP_ITEMS, ...custom];
}

export function addCustomReward({ name, cost, desc = '', tier = 'E' }) {
  const custom = gameState.get('customRewards') || [];
  const newReward = {
    id: `custom_${Date.now()}`,
    name,
    cost: parseInt(cost) || 10,
    desc,
    tier,
    type: 'reward',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>' // Star icon for custom
  };
  
  gameState.set('customRewards', [newReward, ...custom]);
  return newReward;
}

export function removeCustomReward(id) {
  const custom = gameState.get('customRewards') || [];
  gameState.set('customRewards', custom.filter(r => r.id !== id));
}

export function buyItem(itemId) {
  const allItems = getShopItems();
  const item = allItems.find(i => i.id === itemId);
  if (!item) return { success: false, message: 'Item not found in System.' };

  // Check Tier Lock
  const hunterRank = gameState.get('rank').toUpperCase();
  const tierWeights = { 'E': 0, 'D': 1, 'C': 2, 'B': 3, 'A': 4, 'S': 5 };
  
  if (tierWeights[hunterRank] < tierWeights[item.tier]) {
    return { success: false, message: `ACCESS DENIED: Required Rank [${item.tier}]` };
  }

  // Spend Stones
  if (!spendStones(item.cost)) {
    return { success: false, message: 'INSUFFICIENT ESSENCE STONES.' };
  }

  // Apply Effects immediately for consumables
  if (item.type === 'consumable') {
    if (item.effect === 'HEAL_HP') healHp(item.value);
    if (item.effect === 'RESTORE_MP') restoreMp(item.value);
  } else {
    // Add to inventory
    const inventory = gameState.get('inventory') || [];
    gameState.set('inventory', [...inventory, { ...item, boughtAt: new Date().toISOString() }]);
  }

  return { success: true, message: `${item.name} purchased successfully.` };
}
