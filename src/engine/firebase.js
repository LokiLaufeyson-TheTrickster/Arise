import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';
import gameState from '../state/gameState.js';

let db = null;
let unsub = null;
let currentGuildId = null;
let isSyncing = false;

export function initFirebase() {
  const settings = gameState.get('settings') || {};
  const configStr = settings.firebaseConfig;
  
  if (!configStr) return false;

  try {
    // Try to parse as strict JSON
    let configObj = null;
    try {
      configObj = JSON.parse(configStr);
    } catch (e) {
      // If they pasted the JS object without quotes, do a loose eval-like parse (unsafe generally, but ok locally for a config object)
      // Basic cleaning to make it JSON compliant
      const cleaned = configStr
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": ')
        .replace(/'/g, '"')
        .replace(/;\s*$/, '');
      configObj = JSON.parse(cleaned);
    }

    const app = initializeApp(configObj);
    db = getFirestore(app);
    return true;
  } catch (err) {
    console.error("Firebase Init Error:", err);
    return false;
  }
}

export function connectToGuild(guildId) {
  if (!db) return;
  if (unsub) unsub();
  
  currentGuildId = guildId;
  const docRef = doc(db, 'guilds', guildId);

  unsub = onSnapshot(docRef, (docSnap) => {
    isSyncing = true; // Prevent bounce-back saves
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Only sync specific shared entities
      if (data.tasks) gameState.set('tasks', data.tasks, false);
      if (data.shadows) gameState.set('shadows', data.shadows, false);
      // Optional: sync stats/level? Probably want to keep those per-user, or share them? Let's share the whole state to be simple, except settings.
      if (data.stats) gameState.set('stats', data.stats, false);
      if (data.inventory) gameState.set('inventory', data.inventory, false);
      if (data.totalStonesSpent !== undefined) gameState.set('totalStonesSpent', data.totalStonesSpent, false);
      if (data.totalExtractions !== undefined) gameState.set('totalExtractions', data.totalExtractions, false);
    }
    isSyncing = false;
  }, (err) => {
    console.error("Guild Sync Error:", err);
  });
}

export function pushToGuild() {
  if (!db || !currentGuildId || isSyncing) return;
  
  const docRef = doc(db, 'guilds', currentGuildId);
  const payload = {
    tasks: gameState.get('tasks') || [],
    shadows: gameState.get('shadows') || [],
    stats: gameState.get('stats') || { level: 1, exp: 0, str: 0, agi: 0, int: 0, vit: 0, sns: 0, wil: 0 },
    inventory: gameState.get('inventory') || { essenceStones: 0, manaCrystals: 0 },
    totalStonesSpent: gameState.get('totalStonesSpent') || 0,
    totalExtractions: gameState.get('totalExtractions') || 0,
    lastUpdate: new Date().toISOString()
  };

  setDoc(docRef, payload, { merge: true }).catch(err => {
    console.error("Failed to push to Guild:", err);
  });
}
