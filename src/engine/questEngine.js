// ============================================
// ARISE V3.0 — Quest Engine
// Task lifecycle, 2-Minute Rule, completion
// ============================================

import gameState from '../state/gameState.js';
import { DIFFICULTY, awardEXP, awardStones } from './rankSystem.js';
import { addAttributePoints, getConcentrationMultiplier, getHiddenQuestChance } from './attributes.js';
import { extendChain, getChainMultiplier } from './chainLink.js';
import { recordHardTask, getBloodlustMultiplier } from './bloodlust.js';

let taskIdCounter = Date.now();

/**
 * Advanced NLP Deadline Parser
 * Detects: tod, tomorrow, mon, every wednesday, etc.
 */
export function parseDeadline(text) {
  const now = new Date();
  const lower = text.toLowerCase();
  
  // Today
  if (/\b(tod|today)\b/.test(lower)) {
    return new Date(now.setHours(23, 59, 59, 999));
  }
  
  // Tomorrow
  if (/\b(tom|tomorrow|tmr)\b/.test(lower)) {
    const tom = new Date(now);
    tom.setDate(tom.getDate() + 1);
    return new Date(tom.setHours(23, 59, 59, 999));
  }

  // Days of week
  const days = {
    sun: 0, sunday: 0,
    mon: 1, monday: 1,
    tue: 2, tuesday: 2,
    wed: 3, wednesday: 3,
    thu: 4, thursday: 4,
    fri: 5, friday: 5,
    sat: 6, saturday: 6
  };

  for (const [day, index] of Object.entries(days)) {
    const regex = new RegExp(`\\b${day}\\b`);
    if (regex.test(lower)) {
      const target = new Date(now);
      const currentDay = target.getDay();
      let diff = index - currentDay;
      if (diff <= 0) diff += 7;
      target.setDate(target.getDate() + diff);
      return new Date(target.setHours(23, 59, 59, 999));
    }
  }

  return null;
}

export function createTask({ 
  title, 
  difficulty = 'normal', 
  category = 'personal', 
  stat = 'int', 
  deadline = null,
  isDungeon = false,
  dungeonId = null,
  multiStats = []
}) {
  // Auto-detect deadline if not provided
  const detectedDeadline = deadline || parseDeadline(title);

  const task = {
    id: `task_${taskIdCounter++}`,
    title: title.replace(/\b(tod|today|tom|tomorrow|tmr|mon|tue|wed|thu|fri|sat|sun|sunday|monday|tuesday|wednesday|thursday|friday|saturday|every)\b/gi, '').trim(), 
    originalTitle: title,
    difficulty,
    category,
    stat,
    multiStats: multiStats.length > 0 ? multiStats : [stat],
    deadline: detectedDeadline ? new Date(detectedDeadline).toISOString() : null,
    isDungeon,
    dungeonId,
    createdAt: new Date().toISOString(),
    completedAt: null,
    status: 'active', // active | completed | failed
    timerActive: false,
    timerStartedAt: null,
    timerDuration: null,
  };

  const tasks = gameState.get('tasks') || [];
  tasks.unshift(task);
  gameState.set('tasks', tasks);

  return task;
}

export function createDungeon({ 
  title, 
  rooms = [], // array of room titles
  difficulty = 'normal', 
  category = 'personal',
  period = 'once', // once | daily | weekly | alt
  active = true
}) {
  const dungeonId = `dungeon_${Date.now()}`;
  const dungeon = {
    id: dungeonId,
    title,
    difficulty,
    category,
    period,
    active,
    roomCount: rooms.length,
    completedRooms: 0,
    createdAt: new Date().toISOString()
  };

  // Create room tasks
  rooms.forEach((roomTitle, index) => {
    createTask({
      title: `${title}: ${roomTitle}`,
      difficulty,
      category,
      isDungeon: true,
      dungeonId,
      stat: 'str' // Base stat, AI will enhance
    });
  });

  const dungeons = gameState.get('dungeons') || [];
  dungeons.push(dungeon);
  gameState.set('dungeons', dungeons);

  return dungeon;
}

export function completeTask(taskId) {
  const tasks = gameState.get('tasks') || [];
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return null;

  const task = tasks[taskIndex];
  const diff = DIFFICULTY[task.difficulty] || DIFFICULTY.normal;

  // Calculate multipliers
  const chainResult = extendChain();
  const chainMult = chainResult.multiplier;
  const bloodMult = getBloodlustMultiplier();
  const concMult = getConcentrationMultiplier();
  
  // New: Streak Multiplier
  const totalStreak = gameState.get('totalStreak') || 0;
  const streakMult = 1 + (totalStreak * 0.01); // 1% per streak day
  
  const totalMult = chainMult * bloodMult * concMult * streakMult;

  // Calculate rewards
  const baseExp = diff.exp;
  const finalExp = Math.round(baseExp * totalMult);
  const stonesEarned = awardStones(diff.stones);

  // Award EXP
  const expResult = awardEXP(finalExp);

  // New: Multi-Stat Rewards
  const statsToGained = [];
  const stats = task.multiStats || [task.stat];
  const pointsPerStat = Math.max(1, Math.floor(diff.statBonus / stats.length));
  
  stats.forEach(s => {
    const points = addAttributePoints(s, pointsPerStat);
    statsToGained.push({ stat: s, points });
  });

  // Check for bloodlust (Hard+ tasks)
  if (['hard', 'ultra', 'extreme'].includes(task.difficulty)) {
    recordHardTask();
  }

  // Handle Dungeon Progress
  if (task.isDungeon && task.dungeonId) {
    const dungeons = gameState.get('dungeons') || [];
    const dungeon = dungeons.find(d => d.id === task.dungeonId);
    if (dungeon) {
      dungeon.completedRooms++;
      if (dungeon.completedRooms >= dungeon.roomCount) {
        awardEXP(finalExp); // Bonus for dungeon clear
        awardStones(10);
      }
      gameState.set('dungeons', dungeons);
    }
  }

  // Update Global Streak
  gameState.set('totalStreak', totalStreak + 1);

  // Move task to completed
  task.status = 'completed';
  task.completedAt = new Date().toISOString();
  tasks.splice(taskIndex, 1);
  gameState.set('tasks', tasks);

  const completed = gameState.get('completedTasks') || [];
  completed.unshift(task);
  if (completed.length > 100) completed.length = 100;
  gameState.set('completedTasks', completed);
  gameState.set('totalTasksCompleted', (gameState.get('totalTasksCompleted') || 0) + 1);

  return {
    task,
    expEarned: finalExp,
    stonesEarned,
    statsGained: statsToGained,
    chainStreak: chainResult.streak,
    totalStreak: totalStreak + 1,
    totalMultiplier: totalMult,
    ...expResult
  };
}

export function deleteTask(taskId) {
  const tasks = gameState.get('tasks') || [];
  gameState.set('tasks', tasks.filter(t => t.id !== taskId));
}

/**
 * Handles Task Abandonment with Penalties
 * @param {string} taskId 
 * @param {number} aiScore 0-100 (Threshold usually 70)
 */
export function abandonTask(taskId, aiScore = 100) {
  const tasks = gameState.get('tasks') || [];
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  if (aiScore < 70) {
    // Penalty for "Weak Reasoning"
    const currentMP = gameState.get('mp') || 100;
    const currentHP = gameState.get('hp') || 100;
    
    // MP Drain (Mental Toll)
    gameState.set('mp', Math.max(0, currentMP - 30));
    
    // If MP is empty, HP starts to drain (Physical Toll)
    if (currentMP <= 0) {
      gameState.set('hp', Math.max(0, currentHP - 20));
      addFracture(); // Visual screen effect
    }
  }

  deleteTask(taskId);
}

export function getActiveTasks() {
  return (gameState.get('tasks') || []).filter(t => t.status === 'active');
}

export function getTasksByCategory(category) {
  return getActiveTasks().filter(t => t.category === category);
}

export function getTasksByDifficulty(difficulty) {
  return getActiveTasks().filter(t => t.difficulty === difficulty);
}

// 2-Minute Rule: Give Up (1 stone)
export function twoMinGiveUp(taskId) {
  awardStones(1);
  deleteTask(taskId);
  return { stonesEarned: 1 };
}

// 2-Minute Rule: Arise Success (25 stones + 5x EXP)
export function twoMinAriseComplete(taskId) {
  const tasks = gameState.get('tasks') || [];
  const task = tasks.find(t => t.id === taskId);
  if (!task) return null;

  const diff = DIFFICULTY[task.difficulty] || DIFFICULTY.normal;
  const bonusExp = diff.exp * 5;
  const bonusStones = 25;

  const expResult = awardEXP(bonusExp);
  const stonesEarned = awardStones(bonusStones);
  addAttributePoints('wil', 3); // WIL bonus for Arise

  // Complete the task
  task.status = 'completed';
  task.completedAt = new Date().toISOString();
  const taskIndex = tasks.indexOf(task);
  tasks.splice(taskIndex, 1);
  gameState.set('tasks', tasks);

  const completed = gameState.get('completedTasks') || [];
  completed.unshift(task);
  gameState.set('completedTasks', completed);
  gameState.set('totalTasksCompleted', (gameState.get('totalTasksCompleted') || 0) + 1);

  return {
    task,
    expEarned: bonusExp,
    stonesEarned: bonusStones,
    ...expResult,
  };
}

// Deadline detection
export function getDeadlineStatus(task) {
  if (!task.deadline) return 'none';
  const now = Date.now();
  const deadline = new Date(task.deadline).getTime();
  const remaining = deadline - now;

  if (remaining <= 0) return 'overdue';
  if (remaining <= 60 * 60 * 1000) return 'critical'; // < 1 hour
  if (remaining <= 4 * 60 * 60 * 1000) return 'near'; // < 4 hours
  return 'safe';
}

// Get deadline bleed intensity (0-1)
export function getDeadlineBleed(task) {
  if (!task.deadline) return 0;
  const now = Date.now();
  const created = new Date(task.createdAt).getTime();
  const deadline = new Date(task.deadline).getTime();

  if (now >= deadline) return 1;
  const total = deadline - created;
  const elapsed = now - created;

  return Math.max(0, Math.min(1, elapsed / total));
}
