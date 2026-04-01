import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, enableIndexedDbPersistence } from 'firebase/firestore';
import gameState from '../state/gameState.js';

let db = null;
let unsub = null;
let currentGuildId = null;
let isSyncing = false;

export function initFirebase() {
  const settings = gameState.get('settings') || {};
  let configStr = settings.firebaseConfig;
  
  if (!configStr) return false;

  try {
    let configObj = null;
    
    // 1. Try strict JSON
    try {
      configObj = JSON.parse(configStr.trim());
    } catch (e) {
      // 2. Loose Parsing for JS-style objects
      let cleaned = configStr.trim();
      
      // Extract content within curly braces if it's a full JS assignment
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) cleaned = match[0];

      cleaned = cleaned
        // Ensure keys are quoted: key: -> "key":
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":')
        // Ensure values use double quotes: 'value' -> "value"
        .replace(/:\s*'([^']+)'/g, ':"$1"')
        // Remove trailing commas before closing braces/brackets
        .replace(/,\s*([\}\]])/g, '$1')
        // Final cleanup of extra characters like variable declarations (const config = ...)
        .replace(/^[^{]*/, '')
        .replace(/[^}]*$/, '');

      configObj = JSON.parse(cleaned);
    }

    const app = initializeApp(configObj);
    db = getFirestore(app);
    
    // Enable offline bulletproof caching for the Dungeons/Shadows
    enableIndexedDbPersistence(db).catch((err) => {
      console.warn("Offline Persistence fell back to memory:", err.code);
    });

    return true;
  } catch (err) {
    console.error("Firebase Init Error:", err);
    return false;
  }
}

export async function connectToGuild(guildId, username, password) {
  if (!db) return { success: false, error: 'Firebase not initialized' };
  if (unsub) unsub();
  
  const docRef = doc(db, 'guilds', guildId);
  
  try {
    const { getDoc } = await import('firebase/firestore');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Verify password if auth exists
      if (data.auth && data.auth.password !== password) {
        return { success: false, error: 'INVALID ACCESS KEY: Permission Denied.' };
      }
    } else {
      // First time registration for this Guild ID
      await setDoc(docRef, {
        auth: { username, password, createdAt: new Date().toISOString() },
        tasks: [],
        shadows: [],
        stats: { level: 1, exp: 0, str: 0, agi: 0, int: 0, vit: 0, sns: 0, wil: 0 },
        inventory: { essenceStones: 0, manaCrystals: 0 }
      });
    }

    currentGuildId = guildId;

    unsub = onSnapshot(docRef, (docSnap) => {
      isSyncing = true;
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.tasks) gameState.set('tasks', data.tasks, false);
        if (data.shadows) gameState.set('shadows', data.shadows, false);
        if (data.stats) gameState.set('attributes', data.stats, false); // Mapping stats to attributes
        if (data.inventory) {
          if (data.inventory.essenceStones !== undefined) gameState.set('essenceStones', data.inventory.essenceStones, false);
        }
        if (data.totalStonesSpent !== undefined) gameState.set('totalStonesSpent', data.totalStonesSpent, false);
        if (data.totalExtractions !== undefined) gameState.set('totalExtractions', data.totalExtractions, false);
      }
      isSyncing = false;
    });

    return { success: true };
  } catch (err) {
    console.error("Guild Connection Error:", err);
    return { success: false, error: err.message };
  }
}

export function pushToGuild() {
  if (!db || !currentGuildId || isSyncing) return;
  
  const docRef = doc(db, 'guilds', currentGuildId);
  const payload = {
    tasks: gameState.get('tasks') || [],
    shadows: gameState.get('shadows') || [],
    stats: gameState.get('attributes') || { str: 0, agi: 0, int: 0, vit: 0, sns: 0, wil: 0 },
    inventory: { 
      essenceStones: gameState.get('essenceStones') || 0 
    },
    totalStonesSpent: gameState.get('totalStonesSpent') || 0,
    totalExtractions: gameState.get('totalExtractions') || 0,
    lastUpdate: new Date().toISOString()
  };

  setDoc(docRef, payload, { merge: true }).catch(err => {
    console.error("Failed to push to Guild:", err);
  });
}
