// ============================================
// ARISE V3.0 — Central Game State Manager
// Pub/Sub reactive state with auto-persistence
// ============================================

import { loadState, saveState } from './storage.js';

class GameState {
  constructor() {
    this.state = loadState();
    this.listeners = new Map();
    this.saveTimeout = null;
  }

  get(key) {
    if (key.includes('.')) {
      return key.split('.').reduce((obj, k) => obj?.[k], this.state);
    }
    return this.state[key];
  }

  set(key, value) {
    if (key.includes('.')) {
      const keys = key.split('.');
      const last = keys.pop();
      const target = keys.reduce((obj, k) => {
        if (!obj[k]) obj[k] = {};
        return obj[k];
      }, this.state);
      target[last] = value;
    } else {
      this.state[key] = value;
    }

    this.emit(key, value);
    this.emit('*', this.state);
    this.debounceSave();
  }

  update(updater) {
    updater(this.state);
    this.emit('*', this.state);
    this.debounceSave();
  }

  // Batch multiple updates
  batch(updates) {
    for (const [key, value] of Object.entries(updates)) {
      if (key.includes('.')) {
        const keys = key.split('.');
        const last = keys.pop();
        const target = keys.reduce((obj, k) => {
          if (!obj[k]) obj[k] = {};
          return obj[k];
        }, this.state);
        target[last] = value;
      } else {
        this.state[key] = value;
      }
      this.emit(key, value);
    }
    this.emit('*', this.state);
    this.debounceSave();
  }

  on(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    return () => this.listeners.get(key)?.delete(callback);
  }

  emit(key, value) {
    this.listeners.get(key)?.forEach(cb => {
      try { cb(value); } catch (e) { console.error('[GameState] Listener error:', e); }
    });
  }

  debounceSave() {
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.state.lastActiveDate = new Date().toISOString();
      saveState(this.state);
    }, 300);
  }

  forceSave() {
    clearTimeout(this.saveTimeout);
    this.state.lastActiveDate = new Date().toISOString();
    saveState(this.state);
  }

  getSnapshot() {
    return JSON.parse(JSON.stringify(this.state));
  }

  reset() {
    const { loadState: load } = require('./storage.js');
    // Clear and reload
    localStorage.removeItem('arise_v3_gamedata');
    this.state = loadState();
    this.emit('*', this.state);
  }
}

// Singleton
export const gameState = new GameState();
export default gameState;
