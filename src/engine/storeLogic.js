import gameState from '../state/gameState.js';
import { awardStones, spendStones, awardEXP } from './rankSystem.js';

export const ITEM_TIERS = ['E', 'D', 'C', 'B', 'A', 'S'];

export const STORE_ITEMS = {
  // E RANK
  'e_sword': { id: 'e_sword', name: 'Rusted Iron Sword', tier: 'E', type: 'weapon', iconType: 'sword', cost: 10, stats: { str: 2 }, lore: 'A dull, chipped blade barely holding together.' },
  'e_dagger': { id: 'e_dagger', name: 'Chipped Dagger', tier: 'E', type: 'weapon', iconType: 'dagger', cost: 8, stats: { agi: 2 }, lore: 'Small, rusty, but still sharp enough to cut.' },
  'e_staff': { id: 'e_staff', name: 'Gnarled Branch', tier: 'E', type: 'weapon', iconType: 'staff', cost: 12, stats: { int: 2 }, lore: 'A wooden staff with a faint trace of mana.' },
  'e_chest': { id: 'e_chest', name: 'Patched Tunic', tier: 'E', type: 'chest', iconType: 'chest', cost: 15, stats: { vit: 2 }, lore: 'Multiple layers of old leather.' },
  'e_ring': { id: 'e_ring', name: 'Copper Band', tier: 'E', type: 'accessory', iconType: 'ring', cost: 20, stats: { int: 1, sns: 1 }, lore: 'A simple ring with a copper shine.' },

  // D RANK
  'd_sword': { id: 'd_sword', name: 'Steel Longsword', tier: 'D', type: 'weapon', iconType: 'sword', cost: 100, stats: { str: 5, agi: 2 }, lore: 'Standard issue knight-grade weaponry.' },
  'd_dagger': { id: 'd_dagger', name: 'Assassin Knife', tier: 'D', type: 'weapon', iconType: 'dagger', cost: 80, stats: { agi: 7 }, lore: 'Silently slices through the dark.' },
  'd_mace': { id: 'd_mace', name: 'Flanged Mace', tier: 'D', type: 'weapon', iconType: 'mace', cost: 110, stats: { str: 8 }, lore: 'Designed to crush even the sturdiest armor.' },
  'd_chest': { id: 'd_chest', name: 'Chainmail Hauberk', tier: 'D', type: 'chest', iconType: 'chest', cost: 150, stats: { vit: 8, wil: 2 }, lore: 'Interlocking metal rings.' },
  'd_shield': { id: 'd_shield', name: 'Kite Shield', tier: 'D', type: 'accessory', iconType: 'shield', cost: 140, stats: { vit: 10, str: 4 }, lore: 'A sturdy shield with a faded crest.' },

  // C RANK
  'c_sword': { id: 'c_sword', name: 'Dark Steel Greatsword', tier: 'C', type: 'weapon', iconType: 'sword', cost: 500, stats: { str: 15, wil: 5 }, lore: 'Faintly glows red along the edge.' },
  'c_dagger': { id: 'c_dagger', name: 'Venom Daggers', tier: 'C', type: 'weapon', iconType: 'dagger', cost: 450, stats: { agi: 20 }, lore: 'Dripping with toxic green residue.' },
  'c_spear': { id: 'c_spear', name: 'Frost Halberd', tier: 'C', type: 'weapon', iconType: 'spear', cost: 550, stats: { str: 10, int: 15 }, lore: 'Emits a chilling mist.' },
  'c_chest': { id: 'c_chest', name: 'Midnight Plate', tier: 'C', type: 'chest', iconType: 'chest', cost: 700, stats: { vit: 20, sns: 5 }, lore: 'Engraved with ancient runes.' },
  'c_amulet': { id: 'c_amulet', name: 'Mana Crystal Amulet', tier: 'C', type: 'accessory', iconType: 'amulet', cost: 650, stats: { int: 20, sns: 15 }, lore: 'Contains dense mana.' },

  // B RANK
  'b_sword': { id: 'b_sword', name: 'Shadow Katana', tier: 'B', type: 'weapon', iconType: 'sword', cost: 2000, stats: { str: 30, agi: 20, sns: 10 }, lore: 'Made of black glass, trailing dark smoke.' },
  'b_dagger': { id: 'b_dagger', name: 'Cursed Bone Dagger', tier: 'B', type: 'weapon', iconType: 'dagger', cost: 1800, stats: { agi: 45, str: 10 }, lore: 'A jagged blade glowing with purple aura.' },
  'b_scythe': { id: 'b_scythe', name: 'Plasma Reaper', tier: 'B', type: 'weapon', iconType: 'scythe', cost: 2500, stats: { str: 40, int: 30 }, lore: 'Pure cyan concentrated energy.' },
  'b_chest': { id: 'b_chest', name: 'Circuit Suit', tier: 'B', type: 'chest', iconType: 'chest', cost: 3000, stats: { agi: 40, vit: 30, sns: 20 }, lore: 'Jet-black armor layered with circuitry.' },
  'b_grimoire': { id: 'b_grimoire', name: 'Monarch Grimoire', tier: 'B', type: 'accessory', iconType: 'grimoire', cost: 3500, stats: { int: 80, wil: 40 }, lore: 'A floating spellbook of blinding light.' },

  // A RANK
  'a_sword': { id: 'a_sword', name: 'Commander Blade', tier: 'A', type: 'weapon', iconType: 'sword', cost: 10000, stats: { str: 80, wil: 40, sns: 20 }, lore: 'Ornate blade of white light.' },
  'a_dagger': { id: 'a_dagger', name: 'Venom Fang', tier: 'A', type: 'weapon', iconType: 'dagger', cost: 9000, stats: { agi: 120, str: 30 }, lore: 'Carved from a legendary serpent tooth.' },
  'a_bow': { id: 'a_bow', name: 'Lightning Archbow', tier: 'A', type: 'weapon', iconType: 'bow', cost: 9500, stats: { agi: 100, int: 50 }, lore: 'Fires bolts of pure crackling mana.' },
  'a_chest': { id: 'a_chest', name: 'High Orc Plate', tier: 'A', type: 'chest', iconType: 'chest', cost: 15000, stats: { vit: 150, str: 50, wil: 30 }, lore: 'Crimson armor radiating heat.' },
  'a_orb': { id: 'a_orb', name: 'Orb of Zero', tier: 'A', type: 'accessory', iconType: 'orb', cost: 11000, stats: { int: 200, sns: 40 }, lore: 'Freezes the dimensions around it.' },

  // S RANK
  's_sword': { id: 's_sword', name: 'Monarch Greatsword', tier: 'S', type: 'weapon', iconType: 'sword', cost: 60000, stats: { str: 400, wil: 200, sns: 100 }, lore: 'Absolute authority over shadows.' },
  's_dagger': { id: 's_dagger', name: 'Demon King Dagger', tier: 'S', type: 'weapon', iconType: 'dagger', cost: 50000, stats: { agi: 300, str: 100, sns: 50 }, lore: 'Absolute darkness with violet fury.' },
  's_spear': { id: 's_spear', name: 'Ice Monarch Spear', tier: 'S', type: 'weapon', iconType: 'spear', cost: 55000, stats: { str: 250, int: 250, vit: 100 }, lore: 'Terror that freezes light itself.' },
  's_chest': { id: 's_chest', name: 'Absolute Plating', tier: 'S', type: 'chest', iconType: 'chest', cost: 80000, stats: { vit: 500, wil: 200, sns: 100 }, lore: 'Sleek, biological metallic armor.' },
  's_cloak': { id: 's_cloak', name: 'Sovereign Cloak', tier: 'S', type: 'accessory', iconType: 'cloak', cost: 50000, stats: { sns: 500, wil: 300, agi: 200 }, lore: 'A pitch-black cape that absorbs light.' },
};

export const LOOTBOXES = {
  'basic': { id: 'basic', name: 'Basic Crate', cost: 50, color: 'var(--ash)', lore: 'A simple wooden crate. May contain EXP or Stones.' },
  'premium': { id: 'premium', name: 'Premium Relic', cost: 500, color: 'var(--purple)', lore: 'A sleek obsidian box. High chance for C+ gear.' },
  'monarch': { id: 'monarch', name: 'Monarch Cache', cost: 5000, color: 'var(--cyan)', lore: 'A floating shadow chest. Gambling on S-rank power.' },
};

/**
 * Purchases an item and adds it to inventory
 */
export function buyItem(itemId, isCustom = false) {
  let item = STORE_ITEMS[itemId];
  
  if (isCustom) {
    const customItems = gameState.get('customItems') || [];
    item = customItems.find(i => i.id === itemId);
  }

  if (!item) return { success: false, error: 'Item not found' };

  if (spendStones(item.cost)) {
    const inventory = gameState.get('inventory') || [];
    const newItem = { ...item, instanceId: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}` };
    inventory.push(newItem);
    gameState.set('inventory', inventory);
    return { success: true, item: newItem };
  }
  return { success: false, error: 'Insufficient Essence Stones' };
}

/**
 * Adds a new custom item to the system
 */
export function addCustomItem(data) {
  const customItems = gameState.get('customItems') || [];
  const id = `custom_${Date.now()}`;
  const newItem = {
    id,
    name: data.name || 'Unknown Artifact',
    tier: data.tier || 'E',
    type: data.type || 'weapon',
    iconType: data.iconType || 'sword',
    cost: parseInt(data.cost) || 100,
    stats: data.stats || {},
    lore: data.lore || 'A unique item forged by a Monarch.',
    isCustom: true
  };
  
  customItems.push(newItem);
  gameState.set('customItems', customItems);
  return newItem;
}

/**
 * Equips an item and handles stat updates
 */
export function equipItem(instanceId) {
  const inventory = gameState.get('inventory') || [];
  const item = inventory.find(i => i.instanceId === instanceId);
  if (!item) return { success: false, error: 'Item not in inventory' };

  const HunterRank = gameState.get('rank') || 'E';
  const tierOrder = ITEM_TIERS.indexOf(item.tier);
  const hunterOrder = ITEM_TIERS.indexOf(HunterRank.toUpperCase());
  
  if (tierOrder > hunterOrder) {
    return { success: false, error: `Rank Restricted: Requires ${item.tier}-Rank` };
  }

  const equipment = gameState.get('equipment') || {};
  equipment[item.type] = item;
  gameState.set('equipment', { ...equipment });
  
  return { success: true };
}

/**
 * Opens a lootbox and handles rewards
 */
export function openLootbox(boxId) {
  const box = LOOTBOXES[boxId];
  if (!box) return null;

  if (!spendStones(box.cost)) return null;

  const roll = Math.random();
  
  if (roll < 0.4) {
    const exp = (boxId === 'basic' ? 50 : boxId === 'premium' ? 250 : 1000);
    awardEXP(exp);
    return { type: 'exp', value: exp };
  } else if (roll < 0.7) {
    const stones = (boxId === 'basic' ? 20 : boxId === 'premium' ? 200 : 800);
    awardStones(stones);
    return { type: 'stones', value: stones };
  } else {
    // Gear reward
    const tiers = boxId === 'basic' ? ['E', 'D'] : boxId === 'premium' ? ['C', 'B', 'A'] : ['A', 'S'];
    const tier = tiers[Math.floor(Math.random() * tiers.length)];
    const tierItems = Object.values(STORE_ITEMS).filter(i => i.tier === tier);
    const item = tierItems[Math.floor(Math.random() * tierItems.length)];
    
    // Auto-buy
    const inventory = gameState.get('inventory') || [];
    const newItem = { ...item, instanceId: `gacha_${Date.now()}` };
    inventory.push(newItem);
    gameState.set('inventory', inventory);
    
    return { type: 'gear', value: newItem };
  }
}
