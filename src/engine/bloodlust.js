// ============================================
// ARISE V3.0 — Bloodlust Multiplier
// Intensity stacking for hard tasks
// ============================================

import gameState from '../state/gameState.js';

const BLOODLUST_WINDOW = 3 * 60 * 60 * 1000; // 3 hours in ms
const MIN_QUALIFYING_TASKS = 3;

// Record a hard+ task completion
export function recordHardTask() {
  const tasks = gameState.get('bloodlustTasks') || [];
  const now = Date.now();

  // Clean old entries
  const active = tasks.filter(t => (now - t) < BLOODLUST_WINDOW);
  active.push(now);

  gameState.set('bloodlustTasks', active);
  gameState.set('bloodlustStack', Math.max(0, active.length - MIN_QUALIFYING_TASKS + 1));

  return getBloodlustMultiplier();
}

// Get current bloodlust multiplier
export function getBloodlustMultiplier() {
  const tasks = gameState.get('bloodlustTasks') || [];
  const now = Date.now();
  const active = tasks.filter(t => (now - t) < BLOODLUST_WINDOW);

  if (active.length < MIN_QUALIFYING_TASKS) return 1.0;

  const stacks = active.length - MIN_QUALIFYING_TASKS + 1;
  return 1.0 + (stacks * 0.5);
}

// Check if bloodlust is active
export function isBloodlustActive() {
  return getBloodlustMultiplier() > 1.0;
}

// Clean expired entries
export function cleanBloodlustTasks() {
  const tasks = gameState.get('bloodlustTasks') || [];
  const now = Date.now();
  const active = tasks.filter(t => (now - t) < BLOODLUST_WINDOW);
  gameState.set('bloodlustTasks', active);
}
