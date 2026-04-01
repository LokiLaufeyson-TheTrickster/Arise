// ============================================
// ARISE V3.0 — Penalty System
// Lockdown & Essence Drain logic
// ============================================

import gameState from '../state/gameState.js';
import { getPenaltyReduction } from './attributes.js';

const BASE_LOCKDOWN_HOURS = 4;
const DRAIN_TIMER_SECONDS = 300; // 5 minutes

// Activate penalty lockdown
export function activatePenalty(reason = 'Missed Deadline') {
  const reduction = getPenaltyReduction();
  const durationHours = BASE_LOCKDOWN_HOURS * (1 - reduction);
  const durationMs = durationHours * 60 * 60 * 1000;

  // Check for healer shadows
  const healerReduction = getHealerReduction();
  const finalDurationMs = durationMs * (1 - healerReduction);

  const endTime = Date.now() + finalDurationMs;

  gameState.batch({
    penaltyActive: true,
    penaltyEndTime: new Date(endTime).toISOString(),
    penaltyType: 'lockdown',
    penaltyReason: reason,
  });

  return {
    duration: finalDurationMs,
    endTime: new Date(endTime),
    reason,
  };
}

// Check if penalty is active
export function isPenaltyActive() {
  if (!gameState.get('penaltyActive')) return false;

  const endTime = new Date(gameState.get('penaltyEndTime')).getTime();
  if (Date.now() >= endTime) {
    clearPenalty();
    return false;
  }

  return true;
}

// Get penalty time remaining (ms)
export function getPenaltyTimeRemaining() {
  if (!isPenaltyActive()) return 0;
  const endTime = new Date(gameState.get('penaltyEndTime')).getTime();
  return Math.max(0, endTime - Date.now());
}

// Clear penalty
export function clearPenalty() {
  gameState.batch({
    penaltyActive: false,
    penaltyEndTime: null,
    penaltyType: null,
    penaltyReason: null,
  });
}

// Essence Drain: Start the survival task
export function startEssenceDrain() {
  return {
    timerSeconds: DRAIN_TIMER_SECONDS,
    task: 'Confirm 50 Pushups performed',
  };
}

// Complete essence drain to reduce/clear penalty
export function completeEssenceDrain() {
  clearPenalty();

  // Small reward for completing the physical task
  return {
    cleared: true,
    bonusExp: 50,
  };
}

// Healer shadow reduction
function getHealerReduction() {
  const shadows = gameState.get('equippedShadows') || [];
  const allShadows = gameState.get('shadows') || [];
  let reduction = 0;

  for (const id of shadows) {
    const shadow = allShadows.find(s => s.id === id);
    if (shadow && shadow.class === 'healer') {
      reduction += 0.10; // 10% per healer
    }
  }

  return Math.min(reduction, 0.50); // cap at 50%
}

// Format time remaining
export function formatPenaltyTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
