// ============================================
// ARISE V3.0 — localStorage Persistence Layer
// Offline-first data management
// ============================================

const STORAGE_KEY = 'arise_v3_gamedata';
const STORAGE_VERSION = 1;

function getDefaultState() {
  return {
    version: STORAGE_VERSION,
    initialized: false,
    hunterName: '',
    level: 1,
    exp: 0,
    rank: 'e',
    essenceStones: 50,
    title: 'The Unawakened',

    // Attributes
    attributes: {
      str: 0, agi: 0, int: 0,
      vit: 0, sns: 0, wil: 0
    },

    // Stamina
    stamina: 100,
    staminaMax: 100,

    // Chain-Link
    chainStreak: 0,
    chainLastTaskTime: null,

    // Bloodlust
    bloodlustStack: 0,
    bloodlustTasks: [], // timestamps of Hard+ tasks

    // Tasks / Dungeons
    tasks: [],
    completedTasks: [],

    // Shadow Army
    shadows: [],
    equippedShadows: [],

    // Penalties
    penaltyActive: false,
    penaltyEndTime: null,
    penaltyType: null,

    // Stats tracking
    totalTasksCompleted: 0,
    totalExpEarned: 0,
    totalStonesEarned: 0,
    totalExtractions: 0,
    highestChain: 0,
    totalPomodorosCompleted: 0,

    // Settings
    settings: {
      soundEnabled: true,
      soundVolume: 0.5,
      particlesEnabled: true,
      glitchTransitions: true,
      manaVeinsEnabled: true,
      fracturesEnabled: true,
    },

    // Timestamps
    createdAt: null,
    lastActiveDate: null,
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();

    const data = JSON.parse(raw);

    // Version migration
    if (data.version !== STORAGE_VERSION) {
      return migrateState(data);
    }

    // Merge with defaults to handle missing keys
    return { ...getDefaultState(), ...data };
  } catch (e) {
    console.error('[Storage] Failed to load state:', e);
    return getDefaultState();
  }
}

export function saveState(state) {
  try {
    state.version = STORAGE_VERSION;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('[Storage] Failed to save state:', e);
  }
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportState() {
  const state = loadState();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `arise_backup_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importState(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.version) {
          saveState(data);
          resolve(data);
        } else {
          reject(new Error('Invalid backup file'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function migrateState(oldData) {
  // Future migrations go here
  const merged = { ...getDefaultState(), ...oldData, version: STORAGE_VERSION };
  saveState(merged);
  return merged;
}
