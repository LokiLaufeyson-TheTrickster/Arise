// ============================================
// ARISE V3.0 — Sound Engine
// Procedural audio via Web Audio API
// ============================================

import gameState from '../state/gameState.js';

let audioCtx = null;

function getContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function isEnabled() {
  return gameState.get('settings.soundEnabled') !== false;
}

function getVolume() {
  return gameState.get('settings.soundVolume') ?? 0.5;
}

// Play a tone
function playTone(freq, duration, type = 'sine', volume = 1) {
  if (!isEnabled()) return;
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume * getVolume() * 0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

// Play noise burst
function playNoise(duration, volume = 0.2) {
  if (!isEnabled()) return;
  const ctx = getContext();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume * getVolume() * 0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 2000;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

// ── Sound Effects ──

export function playClick() {
  playTone(800, 0.08, 'square', 0.3);
}

export function playTaskComplete() {
  if (!isEnabled()) return;
  // Rising chime
  playTone(523, 0.15, 'sine', 0.5);
  setTimeout(() => playTone(659, 0.15, 'sine', 0.5), 80);
  setTimeout(() => playTone(784, 0.25, 'sine', 0.6), 160);
}

export function playChainTick() {
  playTone(1200, 0.06, 'triangle', 0.3);
}

export function playChainBreak() {
  if (!isEnabled()) return;
  playTone(300, 0.3, 'sawtooth', 0.4);
  playNoise(0.2, 0.3);
}

export function playLevelUp() {
  if (!isEnabled()) return;
  const ctx = getContext();
  const vol = getVolume();

  // Ascending orchestral hit
  const notes = [261, 329, 392, 523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => {
      playTone(freq, 0.4, 'sine', 0.4 + i * 0.05);
      playTone(freq * 1.005, 0.4, 'sine', 0.2); // slight detune for richness
    }, i * 60);
  });
}

export function playGachaPull() {
  if (!isEnabled()) return;
  // Vortex whoosh
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(100, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 1.5);
  gain.gain.setValueAtTime(0.3 * getVolume(), ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 1.5);

  playNoise(1.5, 0.4);
}

export function playGachaReveal(tier) {
  if (!isEnabled()) return;
  const delays = { common: 0, elite: 0, commander: 0, monarch: 0 };

  // Base reveal sting
  playTone(440, 0.2, 'sine', 0.5);
  setTimeout(() => playTone(880, 0.3, 'sine', 0.6), 100);

  if (tier === 'elite') {
    setTimeout(() => playTone(1100, 0.4, 'triangle', 0.5), 200);
  } else if (tier === 'commander') {
    setTimeout(() => {
      playTone(660, 0.3, 'sine', 0.6);
      playTone(880, 0.3, 'sine', 0.5);
      playTone(1320, 0.5, 'sine', 0.7);
    }, 200);
  } else if (tier === 'monarch') {
    setTimeout(() => {
      [440, 554, 659, 880, 1108, 1318, 1760].forEach((f, i) => {
        setTimeout(() => playTone(f, 0.6, 'sine', 0.5), i * 50);
      });
    }, 200);
  }
}

export function playPenaltyAlert() {
  if (!isEnabled()) return;
  // Low bass drone + alarm
  playTone(80, 2, 'sawtooth', 0.5);
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      playTone(880, 0.2, 'square', 0.4);
      setTimeout(() => playTone(660, 0.2, 'square', 0.4), 200);
    }, i * 500);
  }
}

export function playHeartbeat() {
  if (!isEnabled()) return;
  playTone(60, 0.15, 'sine', 0.6);
  setTimeout(() => playTone(55, 0.12, 'sine', 0.4), 120);
}

export function playArise() {
  if (!isEnabled()) return;
  // Epic bass drop
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.8);
  gain.gain.setValueAtTime(0.8 * getVolume(), ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 1);

  playNoise(0.5, 0.5);

  // Follow-up power chord
  setTimeout(() => {
    playTone(110, 0.5, 'sawtooth', 0.4);
    playTone(165, 0.5, 'sawtooth', 0.3);
    playTone(220, 0.5, 'sawtooth', 0.3);
  }, 300);
}

export function playTimerTick() {
  playTone(600, 0.03, 'sine', 0.15);
}

export function playTimerComplete() {
  if (!isEnabled()) return;
  playTone(880, 0.2, 'sine', 0.5);
  setTimeout(() => playTone(1100, 0.2, 'sine', 0.5), 100);
  setTimeout(() => playTone(1320, 0.3, 'sine', 0.6), 200);
  setTimeout(() => playTone(1760, 0.5, 'sine', 0.7), 300);
}

// Initialize audio context on first user interaction
export function initAudio() {
  document.addEventListener('click', () => {
    if (!audioCtx) getContext();
  }, { once: true });
}
