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

export function createTask({ title, difficulty = 'normal', category = 'personal', stat = 'int', deadline = null }) {
  const task = {
    id: `task_${taskIdCounter++}`,
    title,
    difficulty,
    category,
    stat,
    deadline: deadline ? new Date(deadline).toISOString() : null,
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
  const totalMult = chainMult * bloodMult * concMult;

  // Calculate rewards
  const baseExp = diff.exp;
  const finalExp = Math.round(baseExp * totalMult);
  const stonesEarned = awardStones(diff.stones);

  // Award EXP
  const expResult = awardEXP(finalExp);

  // Award stat points
  const statPoints = addAttributePoints(task.stat, diff.statBonus);

  // Check for bloodlust (Hard+ tasks)
  if (['hard', 'ultra', 'extreme'].includes(task.difficulty)) {
    recordHardTask();
  }

  // Check for hidden quest
  const hiddenChance = getHiddenQuestChance();
  const isHiddenQuest = Math.random() * 100 < hiddenChance;

  // Move task to completed
  task.status = 'completed';
  task.completedAt = new Date().toISOString();
  tasks.splice(taskIndex, 1);
  gameState.set('tasks', tasks);

  const completed = gameState.get('completedTasks') || [];
  completed.unshift(task);
  // Keep last 100 completed
  if (completed.length > 100) completed.length = 100;
  gameState.set('completedTasks', completed);
  gameState.set('totalTasksCompleted', (gameState.get('totalTasksCompleted') || 0) + 1);

  return {
    task,
    expEarned: finalExp,
    stonesEarned,
    statGained: { stat: task.stat, points: statPoints },
    chainStreak: chainResult.streak,
    chainMultiplier: chainMult,
    bloodlustMultiplier: bloodMult,
    totalMultiplier: totalMult,
    ...expResult,
    isHiddenQuest,
    hiddenQuestBonus: isHiddenQuest ? finalExp : 0,
  };
}

export function deleteTask(taskId) {
  const tasks = gameState.get('tasks') || [];
  gameState.set('tasks', tasks.filter(t => t.id !== taskId));
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
