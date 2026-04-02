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
  
  let cleanTitle = input;
  let date = null;
  let recurrence = 'none';
  
  const recRegex = /\b(?:every|recurring)\s+(day|daily|weekly|week|month|monthly|mon|tue|wed|thu|fri|sat|sun)\b/i;
  const standaloneRec = /\b(daily|weekly|monthly)\b/i;
  
  let match = cleanTitle.match(recRegex);
  if (match) {
    recurrence = match[1].toLowerCase().replace('day', 'daily').replace('week', 'weekly').replace('month', 'monthly');
    cleanTitle = cleanTitle.replace(match[0], '').trim();
  } else {
    match = cleanTitle.match(standaloneRec);
    if (match) {
      recurrence = match[1].toLowerCase();
      cleanTitle = cleanTitle.replace(match[0], '').trim();
    }
  }

  const exactDateRegex = /\b(\d{1,2}(?:st|nd|rd|th)?)\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i;
  match = cleanTitle.match(exactDateRegex);
  if (match) {
    const dStr = match[1].replace(/\D/g, '') + ' ' + match[2] + ' ' + now.getFullYear();
    const parsed = new Date(dStr);
    if (!isNaN(parsed.getTime())) {
      date = parsed;
      cleanTitle = cleanTitle.replace(match[0], '').trim();
    }
  }

  const dowRegex = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i;
  if (!date) {
    match = cleanTitle.match(dowRegex);
    if (match) {
      const days = { sun:0, mon:1, tue:2, wed:3, thu:4, fri:5, sat:6, sunday:0, monday:1, tuesday:2, wednesday:3, thursday:4, friday:5, saturday:6 };
      const val = days[match[1].toLowerCase()];
      if (val !== undefined) {
        const target = new Date(now);
        const diff = (val + 7 - now.getDay()) % 7;
        target.setDate(now.getDate() + (diff === 0 ? 7 : diff));
        target.setHours(23, 59, 0, 0);
        date = target;
        cleanTitle = cleanTitle.replace(match[0], '').trim();
      }
    }
  }

  const relRegex = /\b(today|tod|tomorrow|tom)\b/i;
  if (!date) {
    match = cleanTitle.match(relRegex);
    if (match) {
      const p = match[1].toLowerCase();
      const target = new Date(now);
      if (p === 'tom' || p === 'tomorrow') {
        target.setDate(target.getDate() + 1);
      }
      target.setHours(23, 59, 0, 0);
      date = target;
      cleanTitle = cleanTitle.replace(match[0], '').trim();
    }
  }

  const timeRegex = /(?:at\s+)?\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)?\b/i;
  match = cleanTitle.match(timeRegex);
  if (match) {
    let hours = parseInt(match[1]);
    const mins = match[2] ? parseInt(match[2]) : 0;
    const ampm = match[3] ? match[3].toLowerCase() : '';
    
    if (ampm.startsWith('p') && hours < 12) hours += 12;
    if (ampm.startsWith('a') && hours === 12) hours = 0;
    
    if (!date) date = new Date(now);
    date.setHours(hours, mins, 0, 0);
    cleanTitle = cleanTitle.replace(match[0], '').trim();
  }

  if (!date && recurrence === 'none') return null;
  return { date: date ? date.toISOString() : null, recurrence, cleanTitle };
}

export function deleteRoom(roomId) {
  const rooms = gameState.get('tasks') || [];
  const room = rooms.find(r => r.id === roomId);
  if (!room) return;
  
  // Penalty for abandoning a quest or deleting a room
  if (room.status === 'active') {
    import('./attributes.js').then(attr => attr.consumeMp(5));
  }

  const newRooms = rooms.filter(r => r.id !== roomId);
  gameState.set('tasks', newRooms);
  
  // Check if Dungeon is empty
  const dungeonId = room.dungeonId;
  const remainingRooms = newRooms.filter(r => r.dungeonId === dungeonId);
  if (remainingRooms.length === 0) {
    const dungeons = gameState.get('dungeons') || [];
    gameState.set('dungeons', dungeons.filter(d => d.id !== dungeonId));
  } else {
    checkDungeonClear(dungeonId);
  }
}

export function getActiveDungeons() {
  const dungeons = gameState.get('dungeons') || [];
  return dungeons.filter(d => d.status === 'active');
}

export function getDungeonRooms(dungeonId) {
  const rooms = gameState.get('tasks') || [];
  return rooms.filter(r => r.dungeonId === dungeonId);
}

/**
 * Two-Minute Rule: Failure/Give Up Logic
 */
export function twoMinGiveUp(roomId) {
  const rooms = gameState.get('tasks') || [];
  const room = rooms.find(r => r.id === roomId);
  if (!room) return;

  // Tiny consolation reward for surviving the 2m stare-down
  awardStones(1);
  
  // Close the room
  room.status = 'failed';
  room.completedAt = new Date().toISOString();
  gameState.set('tasks', [...rooms]);
  
  // Check dungeon
  checkDungeonClear(room.dungeonId);
}

/**
 * Two-Minute Rule: Arise/Success Logic
 */
export function twoMinAriseComplete(roomId) {
  const rooms = gameState.get('tasks') || [];
  const room = rooms.find(r => r.id === roomId);
  if (!room) return null;

  // Massive rewards for those who ARISE from a penalty
  const stones = awardStones(25);
  const expRes = awardEXP(200); // Fixed high EXP for Arise success
  
  // Update attributes (WIL bonus)
  import('./attributes.js').then(attr => attr.addAttributePoints('wil', 5));

  room.status = 'completed';
  room.completedAt = new Date().toISOString();
  gameState.set('tasks', [...rooms]);

  checkDungeonClear(room.dungeonId);
  return { ...expRes, stonesEarned: stones, statGained: 'wil' };
}
