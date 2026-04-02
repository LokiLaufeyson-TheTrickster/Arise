// ============================================
// ARISE V4.0 — Quest & Dungeon Engine
// Dungeons (Groups), Rooms (Tasks), Recurrence
// ============================================

import gameState from '../state/gameState.js';
import { DIFFICULTY, awardEXP, awardStones } from './rankSystem.js';
import { addAttributePoints, getConcentrationMultiplier, getHiddenQuestChance, consumeMp } from './attributes.js';
import { extendChain, getChainMultiplier } from './chainLink.js';
import { recordHardTask, getBloodlustMultiplier } from './bloodlust.js';

let dungeonIdCounter = Date.now();
let roomIdCounter = Date.now() + 1000;

/**
 * Creates a new Dungeon (Group) containing one or more Rooms (Tasks)
 */
export function createDungeon({ title, rooms = [], recurrence = 'none', category = 'personal' }) {
  const dungeonId = `dungeon_${dungeonIdCounter++}`;
  
  const newDungeon = {
    id: dungeonId,
    title,
    category,
    recurrence,
    status: 'active',
    createdAt: new Date().toISOString(),
    completedAt: null,
    roomIds: []
  };

  const allRooms = [];
  
  // If no rooms provided, create one default room (Solo Dungeon)
  const roomData = rooms.length > 0 ? rooms : [{ title: title, difficulty: 'normal', stat: 'wil' }];

  roomData.forEach(r => {
    const roomId = `room_${roomIdCounter++}`;
    const room = {
      id: roomId,
      dungeonId: dungeonId,
      title: r.title,
      difficulty: r.difficulty || 'normal',
      stat: r.stat || 'wil',
      deadline: r.deadline ? new Date(r.deadline).toISOString() : null,
      status: 'active',
      createdAt: new Date().toISOString(),
      completedAt: null
    };
    allRooms.push(room);
    newDungeon.roomIds.push(roomId);
  });

  // Save to state
  const dungeons = gameState.get('dungeons') || [];
  const existingRooms = gameState.get('tasks') || []; // Rooms are stored in 'tasks' for backward compatibility
  
  gameState.batch({
    dungeons: [newDungeon, ...dungeons],
    tasks: [...allRooms, ...existingRooms]
  });

  return newDungeon;
}

/**
 * Completes a Room (Task) within a Dungeon
 */
export async function completeRoom(roomId) {
  const rooms = gameState.get('tasks') || [];
  const roomIndex = rooms.findIndex(r => r.id === roomId);
  if (roomIndex === -1) return null;

  const room = rooms[roomIndex];
  const diff = DIFFICULTY[room.difficulty] || DIFFICULTY.normal;

  // Calculate rewards
  const chainResult = extendChain();
  const totalMult = chainResult.multiplier * getBloodlustMultiplier() * getConcentrationMultiplier();
  
  const finalExp = Math.round(diff.exp * totalMult);
  const stonesEarned = awardStones(diff.stones);
  const expResult = awardEXP(finalExp);
  
  // Award stat points based on category
  const dungeons = gameState.get('dungeons') || [];
  const dungeon = dungeons.find(d => d.id === room.dungeonId);
  const category = (dungeon && dungeon.category) || room.category || 'personal';
  
  const { CATEGORIES } = await import('./rankSystem.js');
  const catDef = CATEGORIES.find(c => c.key === category) || CATEGORIES[0];
  
  const statGained = [];
  if (catDef.stats) {
    for (const [statKey, ratio] of Object.entries(catDef.stats)) {
      const points = Math.max(1, Math.round(diff.statBonus * ratio));
      addAttributePoints(statKey, points);
      statGained.push({ stat: statKey, points });
    }
  } else {
    const points = addAttributePoints(room.stat || 'wil', diff.statBonus);
    statGained.push({ stat: room.stat || 'wil', points });
  }

  if (['hard', 'ultra', 'extreme'].includes(room.difficulty)) recordHardTask();

  // Update room status
  room.status = 'completed';
  room.completedAt = new Date().toISOString();
  gameState.set('tasks', [...rooms]);

  // Check if Dungeon is cleared
  checkDungeonClear(room.dungeonId);

  return {
    room,
    expEarned: finalExp,
    stonesEarned,
    statGained,
    ...expResult,
    chainStreak: chainResult.streak
  };
}

function checkDungeonClear(dungeonId) {
  const dungeons = gameState.get('dungeons') || [];
  const dungeon = dungeons.find(d => d.id === dungeonId);
  if (!dungeon || dungeon.status === 'completed') return;

  const rooms = gameState.get('tasks') || [];
  const dungeonRooms = rooms.filter(r => r.dungeonId === dungeonId);
  const allCleared = dungeonRooms.every(r => r.status === 'completed');

  if (allCleared) {
    dungeon.status = 'completed';
    dungeon.completedAt = new Date().toISOString();
    gameState.set('dungeons', [...dungeons]);
    
    // Recovery Bonus for clearing a full dungeon
    import('./attributes.js').then(attr => {
      attr.restoreMp(10);
    });
  }
}

/**
 * NLP Deadline Parser
 * Handles: today, tomorrow, every wednesday, wed, 5pm, etc.
 */
export function parseDeadline(input) {
  if (!input) return null;
  const now = new Date();
  const lower = input.toLowerCase().trim();
  
  // Basic absolute dates
  if (lower === 'tod' || lower === 'today') {
    return new Date(now.setHours(23, 59, 0, 0));
  }
  if (lower === 'tom' || lower === 'tomorrow') {
    const tom = new Date(now);
    tom.setDate(now.getDate() + 1);
    return new Date(tom.setHours(23, 59, 0, 0));
  }

  // Days of week
  const days = { sun:0, mon:1, tue:2, wed:3, thu:4, fri:5, sat:6, sunday:0, monday:1, tuesday:2, wednesday:3, thursday:4, friday:5, saturday:6 };
  for (const [day, val] of Object.entries(days)) {
    if (lower.includes(day)) {
      const target = new Date(now);
      const diff = (val + 7 - now.getDay()) % 7;
      target.setDate(now.getDate() + (diff === 0 ? 7 : diff));
      return new Date(target.setHours(23, 59, 0, 0));
    }
  }

  // Fallback to standard JS Date parsing
  const parsed = new Date(input);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function deleteRoom(roomId) {
  const rooms = gameState.get('tasks') || [];
  const room = rooms.find(r => r.id === roomId);
  
  // Penalty for abandoning a quest or deleting a room
  if (room && room.status === 'active') {
    consumeMp(5); // MP Drain
  }

  gameState.set('tasks', rooms.filter(r => r.id !== roomId));
}

export function getActiveDungeons() {
  const dungeons = gameState.get('dungeons') || [];
  return dungeons.filter(d => d.status === 'active');
}

export function getDungeonRooms(dungeonId) {
  const rooms = gameState.get('tasks') || [];
  return rooms.filter(r => r.dungeonId === dungeonId);
}
