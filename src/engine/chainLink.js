// ============================================
// ARISE V3.0 — Chain-Link Multiplier
// Flow state momentum tracking
// ============================================

import gameState from '../state/gameState.js';
import { getChainWindow } from './attributes.js';

// Check if chain is still active
export function isChainActive() {
  const lastTime = gameState.get('chainLastTaskTime');
  if (!lastTime) return false;

  const windowMs = getChainWindow() * 60 * 1000;
  const elapsed = Date.now() - new Date(lastTime).getTime();

  return elapsed < windowMs;
}

// Get current chain multiplier
export function getChainMultiplier() {
  if (!isChainActive()) return 1.0;
  const streak = gameState.get('chainStreak') || 0;
  return 1.0 + (streak * 0.1);
}

// Get time remaining in chain window (ms)
export function getChainTimeRemaining() {
  const lastTime = gameState.get('chainLastTaskTime');
  if (!lastTime) return 0;

  const windowMs = getChainWindow() * 60 * 1000;
  const elapsed = Date.now() - new Date(lastTime).getTime();
  return Math.max(0, windowMs - elapsed);
}

// Record a task completion (extends chain)
export function extendChain() {
  const wasActive = isChainActive();
  const currentStreak = wasActive ? (gameState.get('chainStreak') || 0) : 0;
  const newStreak = currentStreak + 1;

  gameState.batch({
    chainStreak: newStreak,
    chainLastTaskTime: new Date().toISOString(),
    highestChain: Math.max(newStreak, gameState.get('highestChain') || 0),
  });

  return {
    streak: newStreak,
    multiplier: 1.0 + (newStreak * 0.1),
    wasChainBroken: !wasActive && currentStreak > 0,
  };
}

// Break the chain (missed window)
export function breakChain() {
  const streak = gameState.get('chainStreak') || 0;
  gameState.batch({
    chainStreak: 0,
    chainLastTaskTime: null,
  });
  return streak;
}

// Format multiplier for display
export function formatMultiplier(mult) {
  return `${mult.toFixed(1)}×`;
}
