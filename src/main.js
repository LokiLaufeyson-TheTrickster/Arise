// ============================================
// ARISE V3.0 — Main Application
// App shell, router, views, setup wizard
// ============================================

import './styles/tokens.css';
import './styles/base.css';
import './styles/hud.css';
import './styles/tasks.css';
import './styles/gacha.css';
import './styles/effects.css';
import './styles/penalty.css';

import gameState from './state/gameState.js';
import { ATTRIBUTES, getAttributeSummary, getStatRank, getStatRankColor, getChainWindow, getMaxHp, getMaxMp } from './engine/attributes.js';
import { DIFFICULTY, CATEGORIES, expForLevel, getRankForLevel, getLevelProgress, awardEXP, awardStones, spendStones } from './engine/rankSystem.js';
import { getChainMultiplier, getChainTimeRemaining, isChainActive, formatMultiplier } from './engine/chainLink.js';
import { getBloodlustMultiplier, isBloodlustActive } from './engine/bloodlust.js';
import { createDungeon, completeRoom, deleteRoom, getActiveDungeons, getDungeonRooms, twoMinGiveUp, twoMinAriseComplete } from './engine/questEngine.js';
import { canExtract, getExtractionCost, performExtraction, equipShadow, unequipShadow, getTierLabel, getTierColor, getBuffDescription } from './engine/gacha.js';
import { isPenaltyActive, getPenaltyTimeRemaining, formatPenaltyTime, activatePenalty, clearPenalty, startEssenceDrain, completeEssenceDrain } from './engine/penalty.js';
import { playClick, playTaskComplete, playLevelUp, playGachaPull, playGachaReveal, playPenaltyAlert, playHeartbeat, playArise, playTimerComplete, playChainBreak, initAudio } from './audio/soundEngine.js';
import { ParticleWeather } from './components/effects/ParticleWeather.js';
import { drawRadarChart } from './components/hud/AttributeRadar.js';
import { PortalAnimation } from './components/gacha/Portal.js';
import { pulseManaVeins, addFracture, healFractures, playGlitchTransition, showLevelUpSequence, showToast, showExpToast, showStoneToast, showChainToast } from './components/effects/effectsManager.js';

import { showHandBook } from './components/HandBook.js';
import { initFirebase, connectToGuild, pushToGuild } from './engine/firebase.js';


// ── Globals ──
let currentView = 'dashboard';
let particles = null;
let timerInterval = null;
let twoMinInterval = null;
let chainCheckInterval = null;
let taskFilter = 'all';

// ── SVG Icons ──
const ICONS = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:24px;height:24px;filter:drop-shadow(0 0 6px rgba(0,229,255,0.4))"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  dungeons: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:24px;height:24px;filter:drop-shadow(0 0 6px rgba(0,229,255,0.4))"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
  shadows: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:24px;height:24px;filter:drop-shadow(0 0 6px rgba(0,229,255,0.4))"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 0 0 20 7 7 0 0 1 0-20z"/></svg>',
  profile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:24px;height:24px;filter:drop-shadow(0 0 6px rgba(0,229,255,0.4))"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:24px;height:24px;filter:drop-shadow(0 0 6px rgba(0,229,255,0.4))"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:24px;height:24px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="width:20px;height:20px"><polyline points="20 6 9 17 4 12"/></svg>',
  timer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;vertical-align:-2px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  skull: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><circle cx="12" cy="10" r="8"/><path d="M8 22l1-4h6l1 4"/><circle cx="9" cy="10" r="1.5" fill="currentColor"/><circle cx="15" cy="10" r="1.5" fill="currentColor"/></svg>',
  mana: '<svg viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="2" style="width:16px;height:16px;vertical-align:middle"><polygon points="12 2 15 10 22 10 16 15 18 22 12 18 6 22 8 15 2 10 9 10"/></svg>',
  essence: '<svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" style="width:16px;height:16px;vertical-align:middle"><polygon points="12 2 22 12 12 22 2 12"/></svg>',
  help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;vertical-align:middle"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  store: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:24px;height:24px;filter:drop-shadow(0 0 6px rgba(0,229,255,0.4))"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;vertical-align:-2px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
};

// ── Boot ──
document.addEventListener('DOMContentLoaded', () => {
  initAudio();
  initApp();
});

function initApp() {
  const app = document.getElementById('app');

  // Apply rank theme
  updateRankTheme();

  // Check login state
  const isAuth = gameState.get('initialized') && gameState.get('settings.guildId');
  
  if (!isAuth) {
    renderLoginView(app);
    return;
  }

  // Initialize Firebase and connect
  if (initFirebase()) {
    const s = gameState.get('settings');
    connectToGuild(s.guildId, s.username, s.password);
  }

  renderAppShell(app);
  startBackgroundSystems();
}

// ── Rank Theme ──
function updateRankTheme() {
  document.documentElement.setAttribute('data-rank', gameState.get('rank') || 'e');
}

// ── Login / Setup View ──
function renderLoginView(container) {
  const savedConfig = gameState.get('settings.firebaseConfig') || '';
  
  container.innerHTML = `
    <div class="setup-overlay" id="setup-wizard">
      <div class="setup-content" style="max-width:450px">
        <div style="font-size:48px;margin-bottom:16px;">⚔️</div>
        <h1 class="setup-title">ARISE</h1>
        <p class="setup-subtitle">Connect to "The System" using your Hunter credentials.</p>
        
        <div class="setup-field">
          <label>Hunter ID (Username)</label>
          <input type="text" id="login-username" placeholder="e.g. SungJinWoo" autocomplete="username" />
        </div>
        
        <div class="setup-field">
          <label>Access Key (Password)</label>
          <input type="password" id="login-password" placeholder="••••••••" autocomplete="current-password" />
        </div>

        <div class="setup-field">
          <label>Target Guild ID</label>
          <input type="text" id="login-guild" placeholder="e.g. shadow-monarch-1" autocomplete="off" />
        </div>

        <div class="setup-field">
          <label>Firebase Config (JSON)</label>
          <textarea id="login-config" placeholder='{"apiKey": "...", ...}' style="height:80px;font-size:10px">${savedConfig}</textarea>
        </div>

        <button class="btn btn-primary btn-lg btn-full" id="login-btn">
          Connect to System
        </button>
        
        <p id="login-error" style="color:var(--crimson);font-size:12px;margin-top:12px;display:none"></p>
        <p class="setup-warning">// Existing Guilds will be joined. New ones will be registered.</p>
      </div>
    </div>
  `;

  const btn = document.getElementById('login-btn');
  const errorEl = document.getElementById('login-error');

  btn.addEventListener('click', async () => {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const guildId = document.getElementById('login-guild').value.trim() || username;
    const config = document.getElementById('login-config').value.trim();

    if (!username || !password || !config) {
      errorEl.textContent = "SYSTEM ERROR: All fields required.";
      errorEl.style.display = 'block';
      return;
    }

    btn.disabled = true;
    btn.textContent = "INITIALIZING...";
    playClick();

    // Temporarily save config to initialize
    gameState.set('settings.firebaseConfig', config);
    
    if (initFirebase()) {
      const result = await connectToGuild(guildId, username, password);
      
      if (result.success) {
        gameState.batch({
          initialized: true,
          hunterName: username,
          'settings.username': username,
          'settings.password': password,
          'settings.guildId': guildId,
          'settings.firebaseConfig': config,
          createdAt: new Date().toISOString()
        });
        gameState.forceSave();

        const wizard = document.getElementById('setup-wizard');
        wizard.style.animation = 'fadeOut 0.5s ease-out forwards';
        setTimeout(() => {
          renderAppShell(container);
          startBackgroundSystems();
          showToast(`Welcome back, Shadow Monarch. Sync active.`, 'success');
        }, 500);
      } else {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = "Connect to System";
      }
    } else {
      errorEl.textContent = "FIREBASE ERROR: Invalid Configuration.";
      errorEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = "Connect to System";
    }
  });
}

// ── App Shell ──
function renderAppShell(container) {
  container.innerHTML = `
    <canvas class="particle-canvas" id="particle-canvas"></canvas>
    <div id="mana-veins" class="mana-veins"></div>
    <div id="screen-fractures" class="screen-fractures"></div>
    <div id="glitch-overlay" class="glitch-overlay"></div>

    <div class="view-container" id="view-container"></div>

    <nav class="nav-bar" id="nav-bar">
      <button class="nav-item active" data-view="dashboard" id="nav-dashboard">
        ${ICONS.dashboard}
        <span>HUD</span>
      </button>
      <button class="nav-item" data-view="dungeons" id="nav-dungeons">
        ${ICONS.dungeons}
        <span>Dungeons</span>
      </button>
      <button class="nav-item" data-view="shadows" id="nav-shadows">
        ${ICONS.shadows}
        <span>Shadows</span>
      </button>
      <button class="nav-item" data-view="store" id="nav-store">
        ${ICONS.store}
        <span>Store</span>
      </button>
      <button class="nav-item" data-view="profile" id="nav-profile">
        ${ICONS.profile}
        <span>Profile</span>
      </button>
      <button class="nav-item" data-view="settings" id="nav-settings">
        ${ICONS.settings}
        <span>Settings</span>
      </button>
    </nav>
  `;

  // Init particles
  const pCanvas = document.getElementById('particle-canvas');
  if (gameState.get('settings.particlesEnabled') !== false) {
    particles = new ParticleWeather(pCanvas);
    particles.setRankColor(gameState.get('rank') || 'e');
    particles.setIntensity(getChainMultiplier());
    particles.start();
  }

  // Nav listeners
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      if (view === currentView) return;
      navigateTo(view);
    });
  });

  // Render initial view
  renderView(currentView);
}

function navigateTo(view) {
  playClick();

  if (gameState.get('settings.glitchTransitions') !== false) {
    playGlitchTransition();
  }

  // Update nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`[data-view="${view}"]`)?.classList.add('active');

  currentView = view;
  setTimeout(() => renderView(view), gameState.get('settings.glitchTransitions') !== false ? 100 : 0);
}

function renderView(view) {
  const container = document.getElementById('view-container');
  if (!container) return;

  switch (view) {
    case 'dashboard': renderDashboard(container); break;
    case 'dungeons': renderDungeons(container); break;
    case 'shadows': renderShadows(container); break;
    case 'store': renderStore(container); break;
    case 'profile': renderProfile(container); break;
    case 'settings': renderSettings(container); break;
  }
}

// ── Background Systems ──
function startBackgroundSystems() {
  // Chain check
  chainCheckInterval = setInterval(() => {
    if (!isChainActive() && gameState.get('chainStreak') > 0) {
      const broke = gameState.get('chainStreak');
      gameState.batch({ chainStreak: 0, chainLastTaskTime: null });
      showToast(`Chain Broken! Lost ${broke}× streak`, 'error');
      playChainBreak();
    }
    // Update particles
    if (particles) {
      particles.setIntensity(getChainMultiplier());
    }
  }, 10000);

  // Penalty check
  setInterval(() => {
    if (isPenaltyActive() && currentView !== 'penalty') {
      // Could trigger penalty view here
    }
  }, 30000);

  // Reactive Firestore Sync
  gameState.on('*', () => {
    pushToGuild();
  });
}

// ============================================
// VIEW: DASHBOARD
// ============================================
function renderDashboard(container) {
  const name = gameState.get('hunterName');
  const level = gameState.get('level');
  const rank = gameState.get('rank');
  const rankInfo = getRankForLevel(level);
  const exp = gameState.get('exp');
  const needed = expForLevel(level);
  const progress = getLevelProgress();
  const stones = gameState.get('essenceStones');
  const title = gameState.get('title');
  const chainMult = getChainMultiplier();
  const chainActive = isChainActive();
  const chainStreak = gameState.get('chainStreak');
  const bloodMult = getBloodlustMultiplier();
  const bloodActive = isBloodlustActive();
  const attrs = getAttributeSummary();
  const dungeons = getActiveDungeons();

  const maxHp = getMaxHp();
  const maxMp = getMaxMp();
  const hpPercent = (gameState.get('hp') / maxHp) * 100;
  const mpPercent = (gameState.get('mp') / maxMp) * 100;

  container.innerHTML = `
    <div class="status-header">
      <div class="status-avatar">${name.charAt(0).toUpperCase()}</div>
      <div class="status-info">
        <div class="status-name">
          ${name}
          <span class="badge badge-rank" style="color:${getRankColor(rank)}">${rankInfo.name}</span>
          <button id="open-handbook-dash" style="background:transparent; margin-left:var(--space-sm); opacity:0.6; color:var(--ash); border:none; padding:4px;" title="Hunter's Handbook">
            ${ICONS.help}
          </button>
        </div>
        <div class="status-title">${title}</div>
        
        <!-- Vitals -->
        <div class="status-vitals">
          <div class="vital-row">
            <span class="vital-label">HP</span>
            <div class="progress-bar vital-bar vital-bar--hp">
              <div class="progress-bar__fill" style="width:${hpPercent}%"></div>
            </div>
            <span class="vital-value">${Math.round(gameState.get('hp'))}</span>
          </div>
          <div class="vital-row">
            <span class="vital-label">MP</span>
            <div class="progress-bar vital-bar vital-bar--mp">
              <div class="progress-bar__fill" style="width:${mpPercent}%"></div>
            </div>
            <span class="vital-value">${Math.round(gameState.get('mp'))}</span>
          </div>
        </div>

        <div class="status-level-row">
          <span class="status-level">Lv.${level}</span>
          <div class="progress-bar status-exp-bar">
            <div class="progress-bar__fill" style="width:${progress}%"></div>
          </div>
          <span class="status-exp-text">${exp}/${needed}</span>
        </div>
      </div>
    </div>

    <div class="multiplier-bar">
      <div class="multiplier-chip multiplier-chip--chain ${chainActive ? '' : 'style="opacity:0.4"'}">
        ⛓️ Chain ${formatMultiplier(chainMult)} ${chainActive ? `(×${chainStreak})` : ''}
      </div>
      ${bloodActive ? `<div class="multiplier-chip multiplier-chip--bloodlust">💀 Bloodlust ${formatMultiplier(bloodMult)}</div>` : ''}
      <div class="multiplier-chip multiplier-chip--stones">
        💎 ${stones} Stones
      </div>
    </div>

    <div class="section-header">
      <h3 class="section-title">Attributes</h3>
    </div>

    <div class="panel" style="margin-bottom:var(--space-lg)">
      <div class="radar-container">
        <canvas class="radar-canvas" id="radar-chart"></canvas>
      </div>
    </div>

    <div class="stat-grid">
      ${attrs.map(a => `
        <div class="panel stat-card">
          <div class="stat-card__icon">${a.icon}</div>
          <div class="stat-card__value">
            ${a.value}
            ${a.bonusValue > 0 ? `<span style="font-size:10px; color:var(--emerald); display:block;">(+${a.bonusValue})</span>` : ''}
          </div>
          <div class="stat-card__name">${a.key.toUpperCase()}</div>
          <div class="stat-card__rank" style="color:${a.rankColor}">${a.rank}-Rank</div>
        </div>
      `).join('')}
    </div>

    <div class="section-header">
      <h3 class="section-title">Active Dungeons</h3>
      <span class="section-action" id="dash-see-all">See All →</span>
    </div>

    ${dungeons.length === 0 ? `
      <div class="empty-state">
        <img src="/empty_dungeon.png" alt="No Dungeons" style="width:120px; margin-bottom:var(--space-md); opacity:0.8; filter:drop-shadow(0 0 20px rgba(0,229,255,0.2));" />
        <div class="empty-state__text">No active dungeons</div>
        <div class="empty-state__sub">Create a task in the Dungeons tab</div>
      </div>
    ` : `
      <div class="task-list">
        ${dungeons.slice(0, 5).map(d => renderDungeonHTML(d)).join('')}
      </div>
    `}

    <div class="quick-actions" style="margin-top:var(--space-xl)">
      <button class="quick-action-btn" id="dash-new-task">
        ${ICONS.plus}
        <span>New Dungeon</span>
      </button>
      <button class="quick-action-btn" id="dash-pomodoro">
        ${ICONS.timer}
        <span>Mana Charge</span>
      </button>
    </div>
  `;

  // Draw radar
  const radarCanvas = document.getElementById('radar-chart');
  if (radarCanvas) drawRadarChart(radarCanvas);

  // Event listeners
  document.getElementById('dash-see-all')?.addEventListener('click', () => navigateTo('dungeons'));
  document.getElementById('dash-new-task')?.addEventListener('click', () => showTaskCreator());
  document.getElementById('dash-pomodoro')?.addEventListener('click', () => showPomodoroTimer());
  document.getElementById('open-handbook-dash')?.addEventListener('click', (e) => {
    e.stopPropagation();
    showHandBook();
  });

  // Dungeon listeners
  attachDungeonListeners();
}

// ============================================
// VIEW: DUNGEONS
// ============================================
function renderDungeons(container) {
  const dungeons = getActiveDungeons();

  container.innerHTML = `
    <div class="section-header">
      <h3 class="section-title">⚔️ Dungeon Board</h3>
    </div>

    <div class="filter-tabs" id="task-filters" style="display:flex; overflow-x:auto; gap:var(--space-sm); padding-bottom:var(--space-xs);">
      <button class="filter-tab ${taskFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
      ${CATEGORIES.map(c => `
        <button class="filter-tab ${taskFilter === c.key ? 'active' : ''}" data-filter="${c.key}" style="display:flex; align-items:center; gap:var(--space-xs);">
          <img src="${c.icon}" style="width:16px; height:16px; border-radius:2px; object-fit:cover;" />
          ${c.label}
        </button>
      `).join('')}
    </div>

    ${dungeons.length === 0 ? `
      <div class="empty-state">
        <img src="/empty_dungeon.png" alt="No Dungeons" style="width:120px; margin-bottom:var(--space-md); opacity:0.8; filter:drop-shadow(0 0 20px rgba(0,229,255,0.2));" />
        <div class="empty-state__text">No dungeons to clear</div>
        <div class="empty-state__sub">Tap + to create your first quest</div>
      </div>
    ` : `
      <div class="task-list" id="task-list">
        ${getActiveDungeons()
          .filter(d => taskFilter === 'all' || d.category === taskFilter)
          .map(d => renderDungeonHTML(d, true)).join('')}
      </div>
    `}

    <button class="fab" id="fab-add-task" aria-label="Add new dungeon">
      ${ICONS.plus}
    </button>
  `;

  // Filter listeners
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      taskFilter = tab.dataset.filter;
      renderDungeons(container);
      playClick();
    });
  });

  document.getElementById('fab-add-task')?.addEventListener('click', () => showTaskCreator());
  attachDungeonListeners();
}

function filterTasks(tasks) {
  if (taskFilter === 'all') return tasks;
  return tasks.filter(t => t.category === taskFilter);
}

// ============================================
// VIEW: SHADOWS
// ============================================
let shadowFilterTier = 'all';
let shadowFilterClass = 'all';
let shadowFilterBuff = 'all';
let shadowSortBy = 'tier'; // tier | name | newest

function renderShadows(container) {
  let shadows = gameState.get('shadows') || [];
  const equipped = gameState.get('equippedShadows') || [];
  const stones = gameState.get('essenceStones');
  const cost = getExtractionCost();
  const canPull = canExtract();

  // Deduplicate by ID (prevents double-render bug)
  const seenIds = new Set();
  shadows = shadows.filter(s => {
    if (seenIds.has(s.id)) return false;
    seenIds.add(s.id);
    return true;
  });

  // Apply filters
  let filtered = [...shadows];
  if (shadowFilterTier !== 'all') filtered = filtered.filter(s => s.tier === shadowFilterTier);
  if (shadowFilterClass !== 'all') filtered = filtered.filter(s => s.class === shadowFilterClass);
  if (shadowFilterBuff !== 'all') filtered = filtered.filter(s => {
    const buffStat = s.buff?.stat || s.buff?.type || '';
    return buffStat === shadowFilterBuff;
  });

  // Sort
  const tierOrder = { monarch: 0, commander: 1, elite: 2, common: 3 };
  if (shadowSortBy === 'tier') {
    filtered.sort((a, b) => (tierOrder[a.tier] ?? 4) - (tierOrder[b.tier] ?? 4));
  } else if (shadowSortBy === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (shadowSortBy === 'newest') {
    filtered.sort((a, b) => new Date(b.extractedAt || 0) - new Date(a.extractedAt || 0));
  }

  const makeOpt = (val, label, current) => `<option value="${val}" ${current === val ? 'selected' : ''}>${label}</option>`;

  container.innerHTML = `
    <div class="section-header">
      <h3 class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;margin-right:6px;vertical-align:middle"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 0 0 20 7 7 0 0 1 0-20z"/></svg>
        Shadow Army
      </h3>
      <span class="section-action">${shadows.length} Shadows</span>
    </div>

    <div class="extract-section panel" style="margin-bottom:var(--space-xl)">
      <h4 style="color:var(--purple);margin-bottom:var(--space-md);font-size:var(--text-lg)">Shadow Extraction</h4>
      <button class="extract-btn" id="extract-btn" ${!canPull ? 'style="opacity:0.4;pointer-events:none"' : ''}>
        EXTRACT
      </button>
      <div class="extract-cost">Cost: ${cost} 💎 (You have: ${stones})</div>
    </div>

    <div class="section-header">
      <h3 class="section-title">Equipped (${equipped.length}/10)</h3>
    </div>

    <!-- Filter/Sort Toolbar -->
    <div class="panel" style="display:flex;flex-wrap:wrap;gap:var(--space-sm);padding:var(--space-md);margin-bottom:var(--space-lg);align-items:center">
      <select id="shadow-filter-tier" style="background:var(--black);color:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);padding:6px 10px;font-size:12px;font-family:var(--font-mono)">
        ${makeOpt('all', '⚔ All Tiers', shadowFilterTier)}
        ${makeOpt('monarch', '👑 Monarch', shadowFilterTier)}
        ${makeOpt('commander', '🔮 Commander', shadowFilterTier)}
        ${makeOpt('elite', '🗡 Elite', shadowFilterTier)}
        ${makeOpt('common', '🛡 Infantry', shadowFilterTier)}
      </select>
      <select id="shadow-filter-class" style="background:var(--black);color:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);padding:6px 10px;font-size:12px;font-family:var(--font-mono)">
        ${makeOpt('all', '⚡ All Classes', shadowFilterClass)}
        ${makeOpt('assassin', '🗡 Assassin', shadowFilterClass)}
        ${makeOpt('knight', '🛡 Knight', shadowFilterClass)}
        ${makeOpt('mage', '🔮 Mage', shadowFilterClass)}
        ${makeOpt('tank', '🏰 Tank', shadowFilterClass)}
        ${makeOpt('ranger', '🏹 Ranger', shadowFilterClass)}
      </select>
      <select id="shadow-filter-buff" style="background:var(--black);color:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);padding:6px 10px;font-size:12px;font-family:var(--font-mono)">
        ${makeOpt('all', '✨ All Buffs', shadowFilterBuff)}
        ${makeOpt('str', '💪 Strength', shadowFilterBuff)}
        ${makeOpt('agi', '⚡ Agility', shadowFilterBuff)}
        ${makeOpt('int', '🧠 Intelligence', shadowFilterBuff)}
        ${makeOpt('vit', '❤️ Vitality', shadowFilterBuff)}
        ${makeOpt('sns', '👁 Sense', shadowFilterBuff)}
        ${makeOpt('wil', '🔥 Willpower', shadowFilterBuff)}
      </select>
      <select id="shadow-sort" style="background:var(--black);color:var(--white);border:1px solid var(--border);border-radius:var(--radius-sm);padding:6px 10px;font-size:12px;font-family:var(--font-mono)">
        ${makeOpt('tier', '↕ Sort: Rarity', shadowSortBy)}
        ${makeOpt('name', '↕ Sort: Name', shadowSortBy)}
        ${makeOpt('newest', '↕ Sort: Newest', shadowSortBy)}
      </select>
      <span style="font-size:11px;color:var(--ash);margin-left:auto">${filtered.length}/${shadows.length} shown</span>
    </div>

    ${filtered.length === 0 && shadows.length > 0 ? `
      <div class="empty-state">
        <div class="empty-state__text">No shadows match filters</div>
        <div class="empty-state__sub">Try adjusting your filter criteria</div>
      </div>
    ` : shadows.length === 0 ? `
      <div class="empty-state">
        <img src="/empty_shadows.png" alt="No Shadows" style="width:120px; margin-bottom:var(--space-md); opacity:0.8; border-radius:50%; filter:drop-shadow(0 0 20px rgba(167,139,250,0.3));" />
        <div class="empty-state__text">No shadows extracted</div>
        <div class="empty-state__sub">Spend Essence Stones to extract shadows</div>
      </div>
    ` : `
      <div class="shadow-grid" id="shadow-grid">
        ${filtered.map(s => `
          <div class="shadow-card ${s.equipped ? 'equipped' : ''}" data-tier="${s.tier}" data-shadow-id="${s.id}" id="shadow-${s.id}">
            ${s.imageUrl 
              ? `<div style="width:100%; height:80px; overflow:hidden; border-radius:var(--radius-sm); margin-bottom:var(--space-sm); position:relative;">
                   <img src="${s.imageUrl}" style="width:100%; height:100%; object-fit:cover;" />
                 </div>`
              : `<div class="shadow-card__emoji">${s.emoji}</div>`
            }
            <div class="shadow-card__name">${s.name}</div>
            <div class="shadow-card__tier-badge" style="color:${getTierColor(s.tier)}">${getTierLabel(s.tier)}</div>
            <div style="font-size:10px;color:var(--ash);margin-top:2px;text-transform:capitalize">${s.class || ''}</div>
            <div class="shadow-card__buff">${getBuffDescription(s.buff)}</div>
            ${s.duplicates > 0 ? `<div style="font-size:10px;color:var(--ash);margin-top:4px">×${s.duplicates + 1}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `}
  `;

  // Extract button
  document.getElementById('extract-btn')?.addEventListener('click', () => {
    startExtraction();
  });

  // Filter/Sort listeners
  document.getElementById('shadow-filter-tier')?.addEventListener('change', (e) => {
    shadowFilterTier = e.target.value; renderShadows(container);
  });
  document.getElementById('shadow-filter-class')?.addEventListener('change', (e) => {
    shadowFilterClass = e.target.value; renderShadows(container);
  });
  document.getElementById('shadow-filter-buff')?.addEventListener('change', (e) => {
    shadowFilterBuff = e.target.value; renderShadows(container);
  });
  document.getElementById('shadow-sort')?.addEventListener('change', (e) => {
    shadowSortBy = e.target.value;
    renderShadows(container);
  });

  // Shadow card clicks (equip/unequip)
  document.querySelectorAll('.shadow-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.shadowId;
      const shadow = shadows.find(s => s.id === id);
      if (!shadow) return;

      playClick();
      if (shadow.equipped) {
        unequipShadow(id);
        showToast(`${shadow.name} unequipped`, 'info');
      } else {
        if (equipShadow(id)) {
          showToast(`${shadow.name} equipped!`, 'success');
        } else {
          showToast('Roster full (10/10)', 'error');
        }
      }
      renderShadows(container);
    });
  });
}

// ============================================
// STORE VIEW (ESSENCE EXCHANGE)
// ============================================
let storeCategory = 'consumable';
let storeSearch = '';

async function renderStore(container) {
  const { getShopItems, buyItem, removeCustomReward } = await import('./engine/shop.js');
  const userRank = gameState.get('rank').toUpperCase();
  const stones = gameState.get('essenceStones') || 0;

  const filtered = getShopItems().filter(item => {
    const matchesCat = item.type === storeCategory;
    const matchesSearch = item.name.toLowerCase().includes(storeSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  container.innerHTML = `
    <div class="view-header">
      <h2 class="view-title">Essence Exchange</h2>
      <div class="currency-display">
        ${ICONS.essence} <span>${stones} Stones</span>
      </div>
    </div>

    <!-- Category Tabs -->
    <div class="tab-scroller">
      <div class="tab-list">
        <button class="tab-item ${storeCategory === 'consumable' ? 'active' : ''}" data-cat="consumable">Artifacts</button>
        <button class="tab-item ${storeCategory === 'equipment' ? 'active' : ''}" data-cat="equipment">Arsenal</button>
        <button class="tab-item ${storeCategory === 'reward' ? 'active' : ''}" data-cat="reward">Real Life</button>
      </div>
    </div>

    <div class="search-bar" style="margin-top:var(--space-md)">
      <input type="text" id="store-search" placeholder="Search the system inventory..." value="${storeSearch}" autocomplete="off" />
    </div>

    <div class="store-grid" style="margin-top:var(--space-lg); display:grid; grid-template-columns:1fr 1fr; gap:var(--space-md); padding-bottom:100px;">
      ${filtered.map(item => {
        const tierWeights = { 'E': 0, 'D': 1, 'C': 2, 'B': 3, 'A': 4, 'S': 5 };
        const isLocked = tierWeights[userRank] < tierWeights[item.tier];
        
        return `
          <div class="store-card panel ${isLocked ? 'locked' : ''}" data-tier="${item.tier}">
            <div class="store-card__header">
              <div class="store-card__icon">${item.icon}</div>
              <div class="store-card__tier" style="color:${getTierColor(item.tier)}">${item.tier}-Rank</div>
            </div>
            <div class="store-card__body">
              <div class="store-card__name">${item.name}</div>
              <div class="store-card__desc">${item.desc}</div>
            </div>
            <div class="store-card__footer">
              <div class="store-card__cost">${ICONS.essence} ${item.cost}</div>
              <button class="btn btn-sm ${isLocked ? 'btn-ghost' : 'btn-primary'} store-buy-btn" 
                data-id="${item.id}" ${isLocked ? 'disabled' : ''}>
                ${isLocked ? 'Locked' : 'Exchange'}
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    ${storeCategory === 'reward' ? `
      <div style="margin-top:var(--space-lg); padding:0 var(--space-sm)">
        <button id="open-custom-reward-btn" style="width:100%; display:flex; align-items:center; justify-content:center; gap:10px; padding:16px 20px; background:rgba(0,229,255,0.06); border:2px dashed var(--cyan); border-radius:var(--radius-md); color:var(--cyan); font-family:var(--font-display); font-weight:700; font-size:14px; letter-spacing:1.5px; text-transform:uppercase; cursor:pointer; transition:all 0.2s ease;">
          ${ICONS.plus} Register Custom Reward
        </button>
      </div>
    ` : ''}
  `;

  // Listeners
  container.querySelectorAll('.tab-item').forEach(tab => {
    tab.addEventListener('click', () => {
      storeCategory = tab.dataset.cat;
      playClick();
      renderStore(container);
    });
  });

  const searchInput = document.getElementById('store-search');
  searchInput?.addEventListener('input', (e) => {
    storeSearch = e.target.value;
  });
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') renderStore(container);
  });

  container.querySelectorAll('.store-buy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const { buyItem } = await import('./engine/shop.js');
      const result = buyItem(btn.dataset.id);
      
      if (result.success) {
        showToast(result.message, 'success');
        playClick();
        pulseManaVeins();
        renderStore(container);
      } else {
        showToast(result.message, 'error');
      }
    });
  });

  container.querySelector('#open-custom-reward-btn')?.addEventListener('click', () => {
    showCustomRewardCreator(() => renderStore(container));
  });
}

/**
 * Modal to add custom Real Life rewards
 */
function showCustomRewardCreator(onComplete) {
  const overlay = document.createElement('div');
  overlay.className = 'setup-overlay';
  overlay.style.zIndex = 'var(--z-modal)';
  
  const emojis = ['🍔','🎮','📺','💤','🍺','🎬','📚','🎵','🛒','📱','🍩','💸'];
  let selectedIcon = '🎮';

  function render() {
    overlay.innerHTML = `
      <div class="setup-content" style="max-width:400px; padding:var(--space-xl)">
        <h3 class="view-title" style="margin-bottom:var(--space-lg)">Register New Reward</h3>
        
        <div class="task-creator">
          <label class="task-creator__label">Reward Icon</label>
          <div style="display:grid; grid-template-columns:repeat(6, 1fr); gap:8px; margin-bottom:var(--space-md);">
            ${emojis.map(e => `
              <button class="icon-selector-btn ${e === selectedIcon ? 'selected' : ''}" data-icon="${e}" style="background:var(--black); border:1px solid ${e === selectedIcon ? 'var(--cyan)' : 'rgba(255,255,255,0.05)'}; border-radius:4px; padding:8px; font-size:18px;">
                ${e}
              </button>
            `).join('')}
          </div>

          <label class="task-creator__label">Reward Name</label>
          <input type="text" id="custom-reward-name" placeholder="E.g. 1 Hour Gaming Session" class="task-creator" />
          
          <label class="task-creator__label" style="margin-top:var(--space-md)">Extraction Cost (Stones)</label>
          <input type="number" id="custom-reward-cost" value="25" class="task-creator" />
          
          <label class="task-creator__label" style="margin-top:var(--space-md)">System Clearance (Tier)</label>
          <select id="custom-reward-tier" class="task-creator" style="width:100%; background:var(--black); color:var(--white); padding:8px; border-radius:4px; border:1px solid var(--border);">
            <option value="E">E-Rank (Default)</option>
            <option value="D">D-Rank</option>
            <option value="C">C-Rank</option>
            <option value="B">B-Rank</option>
            <option value="A">A-Rank</option>
            <option value="S">S-Rank (Elite)</option>
          </select>

          <div style="margin-top:var(--space-2xl); display:grid; grid-template-columns:1fr 1fr; gap:var(--space-md)">
            <button class="btn btn-ghost" id="cancel-custom-reward">Cancel</button>
            <button class="btn btn-primary" id="confirm-custom-reward">Register</button>
          </div>
        </div>
      </div>
    `;

    overlay.querySelectorAll('.icon-selector-btn').forEach(btn => {
      btn.onclick = () => {
        selectedIcon = btn.dataset.icon;
        
        // Preserve values before re-render
        const name = overlay.querySelector('#custom-reward-name')?.value || '';
        const cost = overlay.querySelector('#custom-reward-cost')?.value || '25';
        const tier = overlay.querySelector('#custom-reward-tier')?.value || 'E';
        
        render();
        
        if (overlay.querySelector('#custom-reward-name')) overlay.querySelector('#custom-reward-name').value = name;
        if (overlay.querySelector('#custom-reward-cost')) overlay.querySelector('#custom-reward-cost').value = cost;
        if (overlay.querySelector('#custom-reward-tier')) overlay.querySelector('#custom-reward-tier').value = tier;
      };
    });

    overlay.querySelector('#cancel-custom-reward').onclick = () => {
      overlay.remove();
    };

    overlay.querySelector('#confirm-custom-reward').onclick = async () => {
      const nameInput = overlay.querySelector('#custom-reward-name');
      const costInput = overlay.querySelector('#custom-reward-cost');
      const tierInput = overlay.querySelector('#custom-reward-tier');

      const name = nameInput.value.trim();
      const cost = parseInt(costInput.value);
      const tier = tierInput.value;

      if (!name) return showToast('Reward name is required.', 'error');

      try {
        const { addCustomReward } = await import('./engine/shop.js');
        await addCustomReward({ name, cost, tier, icon: selectedIcon });
        
        showToast(`${name} registered in Registry.`, 'success');
        pulseManaVeins();
        playArise();
        overlay.remove();
        onComplete();
      } catch (err) {
        console.error('Registry failure:', err);
        showToast('System Error: Failed to register reward.', 'error');
      }
    };
  }

  document.body.appendChild(overlay);
  render();
}

// ============================================
// VIEW: PROFILE
function renderProfile(container) {
  const name = gameState.get('hunterName');
  const level = gameState.get('level');
  const rank = gameState.get('rank');
  const rankInfo = getRankForLevel(level);
  const attrs = getAttributeSummary();
  const totalTasks = gameState.get('totalTasksCompleted') || 0;
  const totalExp = gameState.get('totalExpEarned') || 0;
  const totalStones = gameState.get('totalStonesEarned') || 0;
  const highestChain = gameState.get('highestChain') || 0;
  const totalExtractions = gameState.get('totalExtractions') || 0;
  const shadows = (gameState.get('shadows') || []).length;
  const created = gameState.get('createdAt');
  const daysSince = created ? Math.floor((Date.now() - new Date(created).getTime()) / (1000*60*60*24)) : 0;

  container.innerHTML = `
    <div class="panel profile-section profile-big-rank" style="margin-bottom:var(--space-xl)">
      <div class="profile-big-rank__letter" style="color:${getRankColor(rank)}">${rankInfo.name.charAt(0)}</div>
      <div class="profile-big-rank__label">${rankInfo.name} Hunter</div>
      <div style="font-family:var(--font-mono);font-size:var(--text-sm);color:var(--cyan);margin-top:var(--space-sm)">
        Level ${level} — ${name}
      </div>
    </div>

    <div class="section-header">
      <h3 class="section-title">Attributes</h3>
      <button id="open-handbook-profile" style="background:transparent; opacity:0.6; color:var(--cyan); border:none; padding:4px;" title="Hunter's Handbook">
        ${ICONS.help}
      </button>
    </div>
    <div class="panel profile-section" style="padding:var(--space-lg);margin-bottom:var(--space-xl)">
      ${attrs.map(a => `
        <div class="profile-stat-row">
          <span class="profile-stat-row__label">${a.icon} ${a.name}</span>
          <span class="profile-stat-row__value" style="color:${a.rankColor}">
            ${a.value} 
            ${a.bonusValue > 0 ? `<small style="color:var(--emerald); font-size:10px; margin-left:4px">(+${a.bonusValue})</small>` : ''}
            <small style="font-size:10px;opacity:0.6;margin-left:4px">(${a.rank})</small>
          </span>
        </div>
      `).join('')}
    </div>

    <div class="section-header"><h3 class="section-title">Lifetime Stats</h3></div>
    <div class="panel profile-section" style="padding:var(--space-lg);margin-bottom:var(--space-xl)">
      <div class="profile-stat-row">
        <span class="profile-stat-row__label">📅 Days Active</span>
        <span class="profile-stat-row__value">${daysSince}</span>
      </div>
      <div class="profile-stat-row">
        <span class="profile-stat-row__label">✅ Dungeons Cleared</span>
        <span class="profile-stat-row__value">${totalTasks}</span>
      </div>
      <div class="profile-stat-row">
        <span class="profile-stat-row__label">⭐ Total EXP Earned</span>
        <span class="profile-stat-row__value">${totalExp.toLocaleString()}</span>
      </div>
      <div class="profile-stat-row">
        <span class="profile-stat-row__label">💎 Total Stones Earned</span>
        <span class="profile-stat-row__value">${totalStones.toLocaleString()}</span>
      </div>
      <div class="profile-stat-row">
        <span class="profile-stat-row__label">⛓️ Highest Chain</span>
        <span class="profile-stat-row__value">${highestChain}×</span>
      </div>
      <div class="profile-stat-row">
        <span class="profile-stat-row__label">👻 Shadow Extractions</span>
        <span class="profile-stat-row__value">${totalExtractions}</span>
      </div>
      <div class="profile-stat-row">
        <span class="profile-stat-row__label">🗡️ Shadow Army Size</span>
        <span class="profile-stat-row__value">${shadows}</span>
      </div>
    </div>
  `;

  document.getElementById('open-handbook-profile')?.addEventListener('click', (e) => {
    e.stopPropagation();
    showHandBook();
  });
}

// ============================================
// VIEW: SETTINGS
// ============================================
function renderSettings(container) {
  const s = gameState.get('settings') || {};

  container.innerHTML = `
    <div class="section-header"><h3 class="section-title">⚙️ System Settings</h3></div>

    <div class="settings-group">
      <div class="settings-group__title">Audio</div>
      <div class="settings-item">
        <div>
          <div class="settings-item__label">Sound Effects</div>
          <div class="settings-item__desc">System clicks, alerts, and music</div>
        </div>
        <button class="toggle ${s.soundEnabled !== false ? 'active' : ''}" id="toggle-sound"></button>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-group__title">System Privileges</div>
      <div class="settings-item" style="flex-direction:column;align-items:flex-start;gap:var(--space-md)">
        <div style="width:100%">
          <div class="settings-item__label">OpenRouter API Key</div>
          <div class="settings-item__desc">Powers 'The System' AI (Auto-Free routing)</div>
        </div>
        <div style="display:flex;width:100%;gap:var(--space-sm)">
          <input type="password" id="openrouter-key-input" placeholder="sk-or-v1-..." value="${s.openRouterKey || ''}" style="flex:1" autocomplete="off" />
          <button class="btn btn-primary" id="save-openrouter-key">Save</button>
        </div>
      </div>
      <div class="settings-item" style="flex-direction:column;align-items:flex-start;gap:var(--space-md)">
        <div style="width:100%">
          <div class="settings-item__label">Pollinations.ai Key</div>
          <div class="settings-item__desc">Optional key to bypass basic image generation limits</div>
        </div>
        <div style="display:flex;width:100%;gap:var(--space-sm)">
          <input type="password" id="pollinations-key-input" placeholder="pk-..." value="${s.pollinationsKey || ''}" style="flex:1" autocomplete="off" />
          <button class="btn btn-primary" id="save-poll-key">Save</button>
        </div>
      </div>
      <div class="settings-item" style="flex-direction:column;align-items:flex-start;gap:var(--space-md); border-top:1px solid rgba(255,255,255,0.05); padding-top:var(--space-md);">
        <div style="width:100%">
          <div class="settings-item__label">Guild Connection (Firebase)</div>
          <div class="settings-item__desc">Enter your Firebase Config JSON to sync tasks</div>
        </div>
        <div style="width:100%">
          <textarea id="firebase-config-input" placeholder='{"apiKey": "...", "projectId": "..."}' class="task-creator" style="width:100%; height:100px; padding:12px; border-radius:var(--radius-md); background:var(--black); border:1px solid var(--border); color:var(--white); font-family:var(--font-mono); font-size:10px;">${s.firebaseConfig || ''}</textarea>
        </div>
        <div style="width:100%; display:flex; gap:var(--space-sm); align-items:center;">
          <input type="text" id="guild-id-input" placeholder="Enter Guild ID (Shared Code)" value="${s.guildId || 'home'}" class="task-creator" style="flex:1; padding:12px; border-radius:var(--radius-md); background:var(--black); border:1px solid var(--border); color:var(--white);" />
          <button class="btn btn-primary" id="save-firebase-key">Connect Guild</button>
        </div>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-group__title">Visual Effects</div>
      <div class="settings-item">
        <div>
          <div class="settings-item__label">Particle Weather</div>
          <div class="settings-item__desc">Ambient background particles</div>
        </div>
        <button class="toggle ${s.particlesEnabled !== false ? 'active' : ''}" id="toggle-particles"></button>
      </div>
      <div class="settings-item">
        <div>
          <div class="settings-item__label">Glitch Transitions</div>
          <div class="settings-item__desc">Screen glitch when switching tabs</div>
        </div>
        <button class="toggle ${s.glitchTransitions !== false ? 'active' : ''}" id="toggle-glitch"></button>
      </div>
      <div class="settings-item">
        <div>
          <div class="settings-item__label">Mana Veins</div>
          <div class="settings-item__desc">Blue pulse on screen borders</div>
        </div>
        <button class="toggle ${s.manaVeinsEnabled !== false ? 'active' : ''}" id="toggle-veins"></button>
      </div>
      <div class="settings-item">
        <div>
          <div class="settings-item__label">Screen Fractures</div>
          <div class="settings-item__desc">Cracks for missed tasks</div>
        </div>
        <button class="toggle ${s.fracturesEnabled !== false ? 'active' : ''}" id="toggle-fractures"></button>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-group__title">Data</div>
      <div class="settings-item" style="cursor:pointer" id="export-data">
        <div>
          <div class="settings-item__label">Export Data</div>
          <div class="settings-item__desc">Download your progress as JSON</div>
        </div>
        <span style="color:var(--cyan);font-size:var(--text-sm)">→</span>
      </div>
      <div class="settings-item" style="cursor:pointer" id="import-data">
        <div>
          <div class="settings-item__label">Import Data</div>
          <div class="settings-item__desc">Restore from a backup file</div>
        </div>
        <span style="color:var(--cyan);font-size:var(--text-sm)">→</span>
      </div>
      <div class="settings-item" style="cursor:pointer" id="reset-data">
        <div>
          <div class="settings-item__label" style="color:var(--crimson)">Reset All Data</div>
          <div class="settings-item__desc">Permanently delete all progress</div>
        </div>
        <span style="color:var(--crimson);font-size:var(--text-sm)">→</span>
      </div>
      <div class="settings-item" style="cursor:pointer" id="logout-system">
        <div>
          <div class="settings-item__label" style="color:var(--crimson)">Disconnect / Logout</div>
          <div class="settings-item__desc">Clear local session & return to login</div>
        </div>
        <span style="color:var(--crimson);font-size:var(--text-sm)">→</span>
      </div>
    </div>

    <div style="text-align:center;margin-top:var(--space-2xl);color:var(--ash);font-size:var(--text-xs);font-family:var(--font-mono);padding-bottom:var(--space-2xl)">
      ARISE V3.0 — The Monarch's Absolute System<br/>
      Built for the relentless.
    </div>
  `;

  // Listeners
  document.getElementById('logout-system')?.addEventListener('click', () => {
    if (confirm("DISCONNECT SYSTEM? All local session data will be cleared.")) {
      playClick();
      gameState.clearSession();
    }
  });

  // Toggle handlers
  const toggleMap = {
    'toggle-sound': 'soundEnabled',
    'toggle-particles': 'particlesEnabled',
    'toggle-glitch': 'glitchTransitions',
    'toggle-veins': 'manaVeinsEnabled',
    'toggle-fractures': 'fracturesEnabled',
  };

  Object.entries(toggleMap).forEach(([id, key]) => {
    document.getElementById(id)?.addEventListener('click', (e) => {
      playClick();
      const settings = gameState.get('settings') || {};
      settings[key] = settings[key] === false ? true : false;
      gameState.set('settings', { ...settings });
      e.currentTarget.classList.toggle('active');

      if (key === 'particlesEnabled') {
        if (settings[key] && !particles) {
          const canvas = document.getElementById('particle-canvas');
          particles = new ParticleWeather(canvas);
          particles.setRankColor(gameState.get('rank'));
          particles.start();
        } else if (!settings[key] && particles) {
          particles.destroy();
          particles = null;
        }
      }
    });
  });

  // Save Gemini Key
  const saveGeminiBtn = document.getElementById('save-gemini-key');
  saveGeminiBtn?.addEventListener('click', async (e) => {
    playClick();
    const input = document.getElementById('gemini-key-input');
    const key = input.value.trim();
    
    if (!key) {
      showToast('Key cannot be empty', 'error');
      return;
    }

    const btn = e.currentTarget;
    const oldText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = 'Syncing...';

    const settings = gameState.get('settings') || {};
    settings.geminiKey = key;
    gameState.set('settings', { ...settings });
    
    try {
      await gameState.forceSave();
      btn.textContent = 'Saved!';
      btn.style.background = 'var(--cyan)';
      showToast('System Awakened', 'success');
    } catch (err) {
      showToast('Sync Failed', 'error');
    } finally {
      btn.disabled = false;
      setTimeout(() => {
        btn.textContent = oldText;
        btn.style.background = '';
      }, 2000);
    }
  });

  // Save OpenRouter Key
  const saveORBtn = document.getElementById('save-openrouter-key');
  saveORBtn?.addEventListener('click', async (e) => {
    playClick();
    const input = document.getElementById('openrouter-key-input');
    const key = input.value.trim();
    
    if (!key) {
      showToast('Key cannot be empty', 'error');
      return;
    }

    const btn = e.currentTarget;
    const oldText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = 'Syncing...';

    const settings = gameState.get('settings') || {};
    settings.openRouterKey = key;
    // Also set as geminiKey for backward compatibility in engine
    settings.geminiKey = key;
    gameState.set('settings', { ...settings });
    
    try {
      await gameState.forceSave();
      btn.textContent = 'Saved!';
      btn.style.background = 'var(--cyan)';
      showToast('System Link Finalized', 'success');
    } catch (err) {
      showToast('Link Failed', 'error');
    } finally {
      btn.disabled = false;
      setTimeout(() => {
        btn.textContent = oldText;
        btn.style.background = '';
      }, 2000);
    }
  });

  // Save Pollinations Key
  document.getElementById('save-poll-key')?.addEventListener('click', (e) => {
    playClick();
    const input = document.getElementById('pollinations-key-input');
    const key = input.value.trim();
    
    const settings = gameState.get('settings') || {};
    settings.pollinationsKey = key;
    gameState.set('settings', { ...settings });
    gameState.forceSave();
    
    const btn = e.currentTarget;
    const oldText = btn.textContent;
    btn.textContent = 'Saved!';
    btn.style.background = 'var(--cyan)';
    setTimeout(() => {
      btn.textContent = oldText;
      btn.style.background = '';
    }, 1500);

    if (key) showToast('Visuals Upgraded', 'success');
  });

  // Save Firebase Config
  document.getElementById('save-firebase-key')?.addEventListener('click', (e) => {
    playClick();
    const configInput = document.getElementById('firebase-config-input');
    const guildInput = document.getElementById('guild-id-input');
    
    const settings = gameState.get('settings') || {};
    settings.firebaseConfig = configInput.value.trim();
    settings.guildId = guildInput.value.trim() || 'home';
    
    gameState.set('settings', { ...settings });
    gameState.forceSave();

    const btn = e.currentTarget;
    const oldText = btn.textContent;
    btn.textContent = 'Guild Connected!';
    btn.style.background = 'var(--cyan)';
    setTimeout(() => {
      btn.textContent = oldText;
      btn.style.background = '';
      location.reload(); // Reload to init firebase
    }, 1500);
  });

  // Import/Export
  document.getElementById('export-data')?.addEventListener('click', () => {
    playClick();
    import('./state/storage.js').then(({ exportState }) => {
      exportState();
      showToast('Data exported!', 'success');
    });
  });

  document.getElementById('import-data')?.addEventListener('click', () => {
    playClick();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const { importState } = await import('./state/storage.js');
        await importState(file);
        showToast('Data imported! Reloading...', 'success');
        setTimeout(() => location.reload(), 1500);
      } catch (err) {
        showToast('Import failed: ' + err.message, 'error');
      }
    };
    input.click();
  });

  document.getElementById('reset-data')?.addEventListener('click', () => {
    if (confirm('⚠️ This will permanently delete ALL your progress. Are you sure?')) {
      if (confirm('This is your FINAL warning. All data will be lost. Proceed?')) {
        import('./state/storage.js').then(({ clearState }) => {
          clearState();
          location.reload();
        });
      }
    }
  });
}

// ============================================
// SHARED: Dungeon & Room HTML
// ============================================
function renderDungeonHTML(dungeon, showActions = false) {
  const rooms = getDungeonRooms(dungeon.id);
  const cat = CATEGORIES.find(c => c.key === dungeon.category) || CATEGORIES[0];
  const isRecurring = dungeon.recurrence && dungeon.recurrence !== 'none';
  
  return `
    <div class="dungeon-card" data-dungeon-id="${dungeon.id}" id="dungeon-${dungeon.id}">
      <div class="dungeon-card__header">
        <div class="dungeon-card__cat-icon">
          ${cat.icon.startsWith('/') ? `<img src="${cat.icon}" class="cat-img-pulse" />` : cat.icon}
        </div>
        <div class="dungeon-card__title-area">
          <div class="dungeon-card__title">${dungeon.title}</div>
          <div class="dungeon-card__subtitle">
            ${cat.label} • ${rooms.length} Rooms • ${isRecurring ? `🔄 ${dungeon.recurrence}` : 'Solo Run'}
          </div>
        </div>
      </div>
      
      <div class="room-list">
        ${rooms.map(room => renderRoomHTML(room, showActions)).join('')}
      </div>
    </div>
  `;
}

function renderRoomHTML(room, showActions = false) {
  const diff = DIFFICULTY[room.difficulty] || DIFFICULTY.normal;
  const bleed = 0; // Legacy bleed removed for V4.0
  const deadlineClass = bleed > 0.8 ? 'deadline-critical' : bleed > 0.5 ? 'deadline-near' : '';
  
  return `
    <div class="room-item ${deadlineClass} ${room.status === 'completed' ? 'completed' : ''}" 
         data-room-id="${room.id}" id="room-${room.id}">
      <div class="room-item__main">
        <button class="room-item__checkbox" data-action="complete-room" data-room-id="${room.id}">
          ${room.status === 'completed' ? ICONS.check : ''}
        </button>
        <div class="room-item__content">
          <div class="room-item__title">${room.title}</div>
          <div class="room-item__meta">
            <span style="color:${diff.color}">${diff.label}</span> • +${diff.exp} XP
            ${room.deadline ? ` • 📅 ${formatDeadline(room.deadline)}` : ''}
          </div>
        </div>
        ${showActions && room.status !== 'completed' ? `
          <div class="room-item__actions">
            <button class="room-item__action-btn" data-action="abandon-room" data-room-id="${room.id}" style="color:var(--crimson); background:transparent; border:none; padding:4px; display:flex; align-items:center; justify-content:center; cursor:pointer; opacity:0.8; transition:opacity 0.2s;">
              ${ICONS.trash}
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function attachDungeonListeners() {
  // Complete room
  document.querySelectorAll('[data-action="complete-room"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const roomId = btn.dataset.roomId;
      handleRoomComplete(roomId);
    });
  });

  // Abandon room (with AI Judge)
  document.querySelectorAll('[data-action="abandon-room"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const roomId = btn.dataset.roomId;
      handleAbandonmentFlow(roomId);
    });
  });
}

// ============================================
// ROOM COMPLETION FLOW
// ============================================
async function handleRoomComplete(roomId) {
  playTaskComplete();
  const result = await completeRoom(roomId);
  if (!result) return;

  // Visual effects
  pulseManaVeins();
  healFractures();

  // Toasts
  showExpToast(result.expEarned);
  if (result.stonesEarned > 0) {
    setTimeout(() => showStoneToast(result.stonesEarned), 400);
  }

  // Level up?
  if (result.levelsGained > 0) {
    playLevelUp();
    await showLevelUpSequence(result.newLevel, result.statGained);
    updateRankTheme();
  }

  // Re-render
  renderView(currentView);
}

// ============================================
// ABANDONMENT FLOW (AI JUDGE)
// ============================================
async function handleAbandonmentFlow(roomId) {
  const rooms = gameState.get('tasks') || [];
  const room = rooms.find(r => r.id === roomId);
  if (!room) return;

  const settings = gameState.get('settings') || {};
  if (!settings.geminiKey) {
    // Fallback: No AI Key -> Simple Delete
    if (confirm(`[SYSTEM NOTICE]\nNo API Key detected. Terminate this quest immediately?`)) {
      deleteRoom(roomId);
      renderView(currentView);
    }
    return;
  }

  const reason = prompt(`[THE SYSTEM IS WATCHING]\nWhy are you abandoning this quest, Hunter?`);
  
  if (reason === null) return; // User cancelled
  
  if (!reason.trim()) {
    showToast('Silence is not an answer. Penalty Ritual Activated.', 'error');
    showTwoMinRule(roomId);
    return;
  }

  const btn = document.querySelector(`[data-room-id="${roomId}"] [data-action="abandon-room"]`);
  const origHTML = btn?.innerHTML;
  if (btn) btn.innerHTML = 'Evaluating...';

  try {
    const { judgeAbandonment } = await import('./engine/ai.js');
    const { score, judgment } = await judgeAbandonment(room.title, reason);

    playClick();
    alert(`[SYSTEM JUDGMENT]\nScore: ${score}/100\n\n"${judgment}"`);

    if (score < 50) {
      showToast('JUDGMENT: UNWORTHY. PENALTY ACTIVATED.', 'error');
      showTwoMinRule(roomId);
    } else {
      showToast('JUDGMENT: VALID. QUEST TERMINATED.', 'info');
      deleteRoom(roomId);
      renderView(currentView);
    }
  } catch (err) {
    console.error('Judge error:', err);
    // Fallback if AI fails: allow delete with MP hit
    showToast('AI Link Fractured. Task Terminated.', 'error');
    deleteRoom(roomId);
    renderView(currentView);
  } finally {
    if (btn) btn.innerHTML = origHTML;
  }
}

// ============================================
// TASK CREATOR MODAL
// ============================================
function showTaskCreator() {
  playClick();
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.id = 'task-creator-modal';

  let creatorMode = 'solo'; // solo | dungeon
  let selectedCat = 'personal';
  let rooms = [{ id: Date.now(), title: '', difficulty: 'normal', stat: 'wil', nlp: null }];

  function render() {
    backdrop.innerHTML = `
      <div class="modal task-creator" style="max-height:90vh; overflow-y:auto; padding-top:var(--space-xl);">
        <div class="type-selector" style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-sm); margin-bottom:var(--space-xl);">
          <button class="type-tab ${creatorMode === 'solo' ? 'active' : ''}" data-mode="solo">Solo Quest</button>
          <button class="type-tab ${creatorMode === 'dungeon' ? 'active' : ''}" data-mode="dungeon">Dungeon</button>
        </div>

        <h2 class="task-creator__title">${creatorMode === 'solo' ? 'Initialize Solo Quest' : 'Spawn New Dungeon'}</h2>

        ${creatorMode === 'dungeon' ? `
          <div class="task-creator__field">
            <label class="task-creator__label">Dungeon Designation</label>
            <input type="text" id="tc-dungeon-name" placeholder="Name your project..." autocomplete="off" />
          </div>
        ` : ''}

        <div class="task-creator__field" style="margin-bottom:var(--space-md)">
          <div class="task-creator__category-grid">
            ${CATEGORIES.map(c => `
              <button class="category-option ${c.key === selectedCat ? 'selected' : ''}" data-cat="${c.key}">
                <img src="${c.icon}" class="category-icon-img" alt="${c.label}" />
                <span>${c.label}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="task-creator__separator">${creatorMode === 'solo' ? 'Objective' : 'Dungeon Rooms'}</div>
        
        <div id="tc-rooms-list">
          ${rooms.map((room, index) => `
            <div class="tc-room-entry panel" data-index="${index}" style="margin-bottom:var(--space-md); padding:var(--space-md)">
              <div style="display:flex; flex-direction:column; gap:var(--space-xs);">
                <div style="display:flex; gap:var(--space-sm); align-items:center;">
                  <input type="text" class="tc-room-title" value="${room.title}" placeholder="What is your goal?" style="flex:1" />
                  ${creatorMode === 'dungeon' && rooms.length > 1 ? `<button class="tc-remove-room" data-index="${index}" style="background:transparent; border:none; cursor:pointer; padding:6px; display:flex; align-items:center; justify-content:center; color:var(--crimson); filter:drop-shadow(0 0 4px rgba(255,50,50,0.4)); transition:opacity 0.2s;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>` : ''}
                </div>
                
                <div class="nlp-feedback-area" style="min-height:20px; display:flex; gap:var(--space-sm); flex-wrap:wrap;">
                   ${room.nlp && room.nlp.recurrence !== 'none' ? `
                     <div class="nlp-suggestion-chip" style="font-family:var(--font-rajdhani); letter-spacing:0.5px; font-weight:600;">
                        ${ICONS.timer} RECURRING: ${room.nlp.recurrence}
                        <span class="tc-clear-nlp" data-index="${index}" style="cursor:pointer; opacity:0.6">×</span>
                     </div>
                   ` : ''}
                   ${room.nlp && room.nlp.date ? `
                     <div class="nlp-suggestion-chip" style="font-family:var(--font-rajdhani); letter-spacing:0.5px; font-weight:600;">
                        ${ICONS.calendar} DUE: ${new Date(room.nlp.date).toLocaleString([], {dateStyle:'short', timeStyle:'short'})}
                        <span class="tc-clear-nlp" data-index="${index}" style="cursor:pointer; opacity:0.6">×</span>
                     </div>
                   ` : ''}
                </div>
              </div>
              
              <div class="tc-param-grid" style="margin-top:var(--space-sm);">
                <div style="display:flex; flex-direction:column; gap:8px">
                  <label class="task-creator__label">Difficulty Level</label>
                  <div class="tc-diff-selector" data-room-index="${index}" style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;">
                    ${Object.entries(DIFFICULTY).map(([k, d]) => {
                      const isSelected = room.difficulty === k;
                      const lightTheme = k === 'easy' || k === 'ultra';
                      const textColor = isSelected ? (lightTheme ? 'var(--black)' : 'var(--white)') : 'var(--ash)';
                      return `
                      <button class="tc-diff-btn ${isSelected ? 'selected' : ''}" data-diff="${k}" style="--rank-color:${d.color}; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:12px; border-radius:8px; color:${textColor};">
                        <span style="font-weight:800; font-size:12px;">${d.label.toUpperCase()}</span>
                        <span style="font-weight:600; font-size:9px; opacity:0.8; margin-top:2px;">+${d.exp} EXP</span>
                      </button>
                    `}).join('')}
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        ${creatorMode === 'dungeon' ? `
          <button class="btn btn-ghost btn-full" id="tc-add-room" style="margin-top:var(--space-sm); font-size:11px; border-style:dashed;">+ Build Another Room</button>
        ` : ''}

        <div style="display:flex;gap:var(--space-md);margin-top:var(--space-xl)">
          <button class="btn btn-ghost btn-full" id="tc-cancel">Cancel</button>
          <button class="btn btn-primary btn-full btn-lg" id="tc-create">A R I S E</button>
        </div>
      </div>
    `;

    attachListeners();
  }

  function attachListeners() {
    backdrop.querySelectorAll('.type-tab').forEach(tab => {
      tab.onclick = () => {
        syncFormState();
        creatorMode = tab.dataset.mode;
        if (creatorMode === 'solo' && rooms.length > 1) rooms = [rooms[0]];
        playClick();
        render();
      };
    });

    backdrop.querySelectorAll('.category-option').forEach(opt => {
      opt.onclick = () => {
        syncFormState();
        selectedCat = opt.dataset.cat;
        const catData = CATEGORIES.find(c => c.key === selectedCat);
        if (catData) {
          const mainStat = Object.entries(catData.stats).sort((a,b) => b[1] - a[1])[0][0];
          rooms.forEach(r => r.stat = mainStat);
        }
        playClick();
        render();
      };
    });

    backdrop.querySelectorAll('.tc-room-title').forEach(input => {
      input.oninput = (e) => {
        const idx = input.closest('.tc-room-entry').dataset.index;
        rooms[idx].title = e.target.value;
        const nlpResult = parseDeadline(e.target.value);
        if (nlpResult && (nlpResult.date || nlpResult.recurrence !== 'none')) {
          rooms[idx].nlp = nlpResult;
          renderNLPChips(idx);
        } else {
          rooms[idx].nlp = null;
          renderNLPChips(idx);
        }
      };
    });

    backdrop.querySelectorAll('.tc-diff-btn').forEach(btn => {
      btn.onclick = () => {
        const idx = btn.closest('.tc-diff-selector').dataset.roomIndex;
        rooms[idx].difficulty = btn.dataset.diff;
        playClick();
        render();
      };
    });


    backdrop.querySelector('#tc-add-room')?.addEventListener('click', () => {
      syncFormState();
      rooms.push({ id: Date.now(), title: '', difficulty: 'normal', stat: 'wil', nlp: null });
      playClick();
      render();
    });

    backdrop.querySelectorAll('.tc-remove-room').forEach(btn => {
      btn.onclick = () => {
        syncFormState();
        rooms.splice(btn.dataset.index, 1);
        playClick();
        render();
      };
    });

    backdrop.querySelector('#tc-cancel').onclick = () => {
      playClick();
      backdrop.remove();
    };

    backdrop.querySelector('#tc-create').onclick = () => {
      syncFormState();
      const dungeonNameInput = backdrop.querySelector('#tc-dungeon-name');
      
      const finalRooms = rooms.filter(r => r.title.trim().length > 0).map(r => {
        const nlp = r.nlp || parseDeadline(r.title);
        return {
          ...r,
          title: nlp ? nlp.cleanTitle : r.title,
          deadline: nlp ? nlp.date : null,
          recurrence: nlp ? nlp.recurrence : 'none'
        };
      });
      
      if (finalRooms.length === 0) {
        showToast('Quest objective cannot be empty, Hunter.', 'error');
        return;
      }

      createDungeon({
        title: creatorMode === 'solo' ? finalRooms[0].title : (dungeonNameInput?.value || 'Active Dungeon'),
        category: selectedCat,
        recurrence: finalRooms[0].recurrence,
        rooms: finalRooms
      });

      playArise();
      backdrop.remove();
      showToast('Quest Initialized. Arise.', 'success');
      renderView(currentView);
    };
  }

  function renderNLPChips(idx) {
    const room = rooms[idx];
    const area = backdrop.querySelector(`.tc-room-entry[data-index="${idx}"] .nlp-feedback-area`);
    if (!area) return;
    area.innerHTML = `
       ${room.nlp && room.nlp.recurrence !== 'none' ? `
         <div class="nlp-suggestion-chip" style="font-family:var(--font-rajdhani); letter-spacing:0.5px; font-weight:600;">
            ${ICONS.timer} RECURRING: ${room.nlp.recurrence}
            <span class="tc-clear-nlp" data-index="${idx}" data-type="rec" style="cursor:pointer; opacity:0.6">×</span>
         </div>
       ` : ''}
       ${room.nlp && room.nlp.date ? `
         <div class="nlp-suggestion-chip" style="font-family:var(--font-rajdhani); letter-spacing:0.5px; font-weight:600;">
            ${ICONS.calendar} DUE: ${new Date(room.nlp.date).toLocaleString([], {dateStyle:'short', timeStyle:'short'})}
            <span class="tc-clear-nlp" data-index="${idx}" data-type="date" style="cursor:pointer; opacity:0.6">×</span>
         </div>
       ` : ''}
    `;
    
    area.querySelectorAll('.tc-clear-nlp').forEach(btn => {
      btn.onclick = () => {
        if (btn.dataset.type === 'rec') rooms[idx].nlp.recurrence = 'none';
        else rooms[idx].nlp.date = null;
        renderNLPChips(idx);
      };
    });
  }

  function syncFormState() {
    const roomEntries = backdrop.querySelectorAll('.tc-room-entry');
    roomEntries.forEach((entry, i) => {
      const titleInput = entry.querySelector('.tc-room-title');
      if (titleInput) rooms[i].title = titleInput.value;
    });
  }

  document.body.appendChild(backdrop);
  render();
}

// ============================================
// 2-MINUTE RULE
// ============================================
function showTwoMinRule(taskId) {
  playHeartbeat();
  const overlay = document.createElement('div');
  overlay.className = 'two-min-overlay';
  overlay.id = 'two-min-overlay';

  let timeLeft = 120;
  let phase = 'countdown'; // countdown | choice | arise

  overlay.innerHTML = `
    <div class="two-min-content" style="display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; width:100%; max-width:350px; margin:0 auto;">
      <div class="two-min-timer" id="tmr-clock">02:00</div>
      <div class="two-min-status" id="tmr-status">SYSTEM MONITORING...</div>
      <div class="two-min-message" id="tmr-msg">Overcome the obstacle. Do not look away.</div>
      <div class="two-min-actions" id="tmr-actions" style="width:100%; display:flex; flex-direction:column; align-items:center;">
        <button class="btn btn-ghost btn-sm" id="tmr-yield" style="color:var(--ash); border-color:rgba(255,255,255,0.1); width:100%; max-width:320px;">
          I can't even for 2m... I give up
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const clock = overlay.querySelector('#tmr-clock');
  const status = overlay.querySelector('#tmr-status');
  const msg = overlay.querySelector('#tmr-msg');
  const actions = overlay.querySelector('#tmr-actions');

  function updateUI() {
    if (phase === 'countdown') {
      const mins = Math.floor(timeLeft / 60);
      const secs = timeLeft % 60;
      clock.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    } else if (phase === 'choice') {
      clock.textContent = "0:00";
      status.textContent = "RITUAL COMPLETE";
      status.style.color = "var(--emerald)";
      msg.textContent = "You have endured the observation. What is your choice?";
      actions.innerHTML = `
        <button class="btn btn-primary btn-lg" id="tmr-arise">I can do more (ARISE)</button>
        <button class="btn btn-ghost btn-lg" id="tmr-success">I did it for 2m</button>
      `;

      overlay.querySelector('#tmr-arise').addEventListener('click', () => {
        playArise();
        phase = 'arise';
        timeLeft = 600; // 10 minutes
        status.textContent = "ARISE MODE ACTIVE";
        status.style.color = "var(--cyan)";
        msg.textContent = "The System acknowledges your will. Complete the task.";
        actions.innerHTML = '';
        startAriseTimer();
      });

      overlay.querySelector('#tmr-success').addEventListener('click', () => {
        playClick();
        clearInterval(twoMinInterval);
        twoMinGiveUp(taskId); // Minimal reward
        overlay.remove();
        showToast('Ritual survived. 1 Essence Stone recorded.', 'info');
        renderView(currentView);
      });
    } else if (phase === 'arise') {
      const mins = Math.floor(timeLeft / 60);
      const secs = timeLeft % 60;
      clock.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  }

  overlay.querySelector('#tmr-yield').addEventListener('click', () => {
    playClick();
    clearInterval(twoMinInterval);
    overlay.remove();
    showToast('The System reflects your weakness. Quest Lost.', 'error');
    // MP Debt or HP loss could be added here
    deleteRoom(taskId);
    renderView(currentView);
  });

  // Start 2-min countdown
  twoMinInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(twoMinInterval);
      if (phase === 'countdown') {
        phase = 'choice';
        updateUI();
      }
    } else {
      updateUI();
    }
    if (timeLeft % 2 === 0 && phase === 'countdown') playHeartbeat();
  }, 1000);

  function startAriseTimer() {
    twoMinInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(twoMinInterval);
        const result = twoMinAriseComplete(taskId);
        overlay.remove();
        if (result) {
          showToast('🔥 ARISE COMPLETE! +25 Stones +5× EXP!', 'exp');
          pulseManaVeins();
          if (result.levelsGained > 0) {
            playLevelUp();
            showLevelUpSequence(result.newLevel, result.statGained);
          }
        }
        renderView(currentView);
      } else {
        updateUI();
      }
    }, 1000);
  }

  updateUI();
}

// ============================================
// POMODORO / MANA CHARGE TIMER
// ============================================
function showPomodoroTimer() {
  playClick();
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.id = 'pomodoro-modal';

  const totalSeconds = 25 * 60;
  let remaining = totalSeconds;
  let running = false;
  const circumference = 2 * Math.PI * 90;

  // Initial Modal Structure
  backdrop.innerHTML = `
    <div class="modal" style="padding:var(--space-xl)">
      <h3 style="text-align:center;margin-bottom:var(--space-lg);color:var(--cyan)">⚡ MANA CHARGE</h3>
      <div class="timer-display">
        <div class="timer-ring">
          <svg viewBox="0 0 200 200">
            <circle class="timer-ring__bg" cx="100" cy="100" r="90" />
            <circle class="timer-ring__progress" id="pomo-ring-fill" cx="100" cy="100" r="90"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${circumference}" />
          </svg>
          <div class="timer-time" id="pomo-time-text">25:00</div>
        </div>
        <div class="timer-label" id="pomo-status-label">Ready</div>
      </div>
      <div class="timer-controls">
        <button class="btn btn-primary" id="pomo-toggle">Start</button>
        <button class="btn btn-ghost" id="pomo-cancel">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);

  const timeText = backdrop.querySelector('#pomo-time-text');
  const ringFill = backdrop.querySelector('#pomo-ring-fill');
  const statusLabel = backdrop.querySelector('#pomo-status-label');
  const toggleBtn = backdrop.querySelector('#pomo-toggle');

  function updateUI() {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const progress = remaining / totalSeconds;
    const dashOffset = circumference * (1 - progress);

    timeText.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    ringFill.style.strokeDashoffset = dashOffset;
    statusLabel.textContent = running ? 'Focusing...' : remaining === totalSeconds ? 'Ready' : 'Paused';
    toggleBtn.textContent = running ? 'Pause' : 'Start';
    toggleBtn.className = `btn ${running ? 'btn-danger' : 'btn-primary'}`;
  }

  toggleBtn.addEventListener('click', () => {
    running = !running;
    if (running) startPomoInterval();
    else clearInterval(timerInterval);
    updateUI();
  });

  backdrop.querySelector('#pomo-cancel')?.addEventListener('click', () => {
    clearInterval(timerInterval);
    playClick();
    backdrop.remove();
  });

  function startPomoInterval() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(timerInterval);
        running = false;
        playTimerComplete();
        pulseManaVeins();

        import('./engine/attributes.js').then(({ addAttributePoints }) => {
          addAttributePoints('int', 2);
          awardEXP(30);
          gameState.set('totalPomodorosCompleted', (gameState.get('totalPomodorosCompleted') || 0) + 1);
          showToast('⚡ Mana Charged! +2 INT +30 EXP', 'success');
          backdrop.remove();
          renderView(currentView);
        });
        return;
      }
      updateUI();
    }, 1000);
  }

  updateUI();
}

// ============================================
// SHADOW EXTRACTION & NAMING
// ============================================
function startExtraction() {
  playGachaPull();

  const overlay = document.createElement('div');
  overlay.className = 'portal-overlay';
  overlay.innerHTML = `
    <canvas class="portal-canvas" id="portal-canvas"></canvas>
    <div class="portal-text">Extracting Shadow...</div>
  `;
  document.body.appendChild(overlay);

  const canvas = document.getElementById('portal-canvas');
  
  import('./engine/gacha.js').then(({ performExtraction }) => {
    const portal = new PortalAnimation(canvas, () => {
      // Portal animation complete
      const result = performExtraction();
      overlay.remove();

      if (!result) {
        showToast('Extraction failed!', 'error');
        return;
      }

      if (result.isDuplicate) {
        // Skip naming for duplicates
        showShadowReveal(result.shadow, true);
      } else {
        showNamingPhase(result.shadow);
      }
    });
    portal.start();
  });
}

async function showNamingPhase(shadow) {
  const overlay = document.createElement('div');
  overlay.className = 'shadow-reveal';
  
  // Get 5 unique suggestions
  const { SHADOW_NAMES_DB } = await import('./engine/shadowNames.js');
  const army = gameState.get('shadows') || [];
  const ownedNames = new Set(army.map(s => s.name));
  
  let suggestions = [];
  while(suggestions.length < 5) {
    const cand = SHADOW_NAMES_DB[Math.floor(Math.random() * SHADOW_NAMES_DB.length)];
    if (!ownedNames.has(cand) && !suggestions.includes(cand)) {
      suggestions.push(cand);
    }
  }

  overlay.innerHTML = `
    <div class="shadow-reveal__card" style="box-shadow:0 0 40px ${getTierColor(shadow.tier)}; animation:none; transform:none; max-width:400px; width:100%;">
      <div style="font-size:12px; color:var(--cyan); margin-bottom:var(--space-md); text-align:center;">
        Wild ${shadow.class.toUpperCase()} Extracted
      </div>
      <div class="shadow-reveal__emoji" style="animation:none;">${shadow.emoji}</div>
      <div class="shadow-reveal__tier" style="color:${getTierColor(shadow.tier)}; margin-bottom:var(--space-md);">
        ${getTierLabel(shadow.tier)} Class: ${shadow.class.toUpperCase()}
      </div>
      <div class="shadow-reveal__buff" style="margin-bottom:var(--space-lg); padding:var(--space-sm); border:1px solid rgba(0,229,255,0.2);">
        BASE STATS: +${shadow.buff.value} ${shadow.buff.type.toUpperCase()}
      </div>
      
      <div style="text-align:left; width:100%;">
        <label style="font-size:var(--text-xs); color:var(--ash); margin-bottom:8px; display:block;">Command your shadow (Name it)</label>
        <input type="text" id="shadow-name-input" placeholder="Enter custom name..." class="task-creator" style="width:100%; padding:12px; border-radius:var(--radius-md); background:var(--black); border:1px solid var(--border); color:var(--white); margin-bottom:12px; outline:none;" />
        
        <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:var(--space-xl);">
          ${suggestions.map(s => `
            <button class="btn btn-ghost btn-sm name-suggestion" style="font-size:10px; padding:4px 8px;">${s}</button>
          `).join('')}
        </div>
      </div>

      <button class="btn btn-primary btn-full btn-lg" id="arise-shadow-btn" style="box-shadow:var(--glow-cyan);">
        A R I S E
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  const input = document.getElementById('shadow-name-input');
  
  // Suggestion click
  document.querySelectorAll('.name-suggestion').forEach(btn => {
    btn.addEventListener('click', () => {
      playClick();
      input.value = btn.textContent;
    });
  });

  // Arise click
  document.getElementById('arise-shadow-btn')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const finalName = input.value.trim() || shadow.name; // Use custom or default to generated single name
    
    playArise();
    btn.innerHTML = 'System Processing Lore...';
    btn.disabled = true;

    try {
      const { enhanceShadowAI } = await import('./engine/gacha.js');
      const enhancedShadow = await enhanceShadowAI(shadow, finalName);
      
      // Save to army
      const shadows = gameState.get('shadows') || [];
      shadows.push(enhancedShadow);
      gameState.set('shadows', [...shadows]);
      gameState.forceSave();

      overlay.remove();
      showShadowReveal(enhancedShadow, false);
      
    } catch (err) {
      showToast('System Error', 'error');
      btn.innerHTML = 'A R I S E';
      btn.disabled = false;
    }
  });
}

function showShadowReveal(shadow, isDuplicate) {
  playGachaReveal(shadow.tier);

  const overlay = document.createElement('div');
  overlay.className = 'shadow-reveal';
  
  const visual = shadow.imageUrl 
    ? `<img src="${shadow.imageUrl}" alt="${shadow.name}" style="width:100%; height:auto; border-radius:var(--radius-md); box-shadow:0 0 20px ${getTierColor(shadow.tier)}; margin-bottom:var(--space-md);">`
    : `<div class="shadow-reveal__emoji">${shadow.emoji}</div>`;

  overlay.innerHTML = `
    <div class="shadow-reveal__card" data-tier="${shadow.tier}">
      ${visual}
      <div class="shadow-reveal__name">${shadow.name}</div>
      <div class="shadow-reveal__tier" style="color:${getTierColor(shadow.tier)}">
        ${getTierLabel(shadow.tier)} ${isDuplicate ? '(DUPLICATE)' : ''}
      </div>
      <div class="shadow-reveal__buff">${getBuffDescription(shadow.buff)}</div>
    </div>
    <div class="shadow-reveal__actions">
      <button class="btn btn-primary" id="reveal-ok">Continue</button>
      ${!shadow.equipped && shadow.tier !== 'common' ? `
        <button class="btn btn-ghost" id="reveal-equip">Equip</button>
      ` : ''}
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('reveal-ok')?.addEventListener('click', () => {
    playClick();
    overlay.remove();
    renderView(currentView);
  });

  document.getElementById('reveal-equip')?.addEventListener('click', () => {
    playClick();
    if (equipShadow(shadow.id)) {
      showToast(`${shadow.name} equipped!`, 'success');
    }
    overlay.remove();
    renderView(currentView);
  });
}

// ============================================
// UTILITIES
// ============================================
function getRankColor(rank) {
  const colors = { 'E': '#94a3b8', 'D': '#4ade80', 'C': '#22d3ee', 'B': '#818cf8', 'A': '#a78bfa', 'S': '#f472b6' };
  return colors[rank.charAt(0)] || '#ffffff';
}

export function parseDeadline(input) {
  if (!input) return { date: null, recurrence: 'none', cleanTitle: 'Untitled Quest' };
  const now = new Date();
  let lower = input.toLowerCase().trim();
  let cleanTitle = input;
  let targetDate = null;
  let recurrence = 'none';

  // 1. Recurrence Detection (every day, daily, every monday, etc.)
  if (/\bevery day\b|\bdaily\b/i.test(lower)) {
    recurrence = 'daily';
    cleanTitle = cleanTitle.replace(/\bevery day\b|\bdaily\b/gi, '').trim();
  } else if (/\bevery week\b|\bweekly\b/i.test(lower)) {
    recurrence = 'weekly';
    cleanTitle = cleanTitle.replace(/\bevery week\b|\bweekly\b/gi, '').trim();
  } else if (/\bevery month\b|\bmonthly\b/i.test(lower)) {
    recurrence = 'monthly';
    cleanTitle = cleanTitle.replace(/\bevery month\b|\bmonthly\b/gi, '').trim();
  } else if (/\bevery (monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i.test(lower)) {
    recurrence = 'weekly';
    cleanTitle = cleanTitle.replace(/\bevery (monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/gi, '').trim();
  }

  // 2. Relative Dates (today, tomorrow, tod, tom)
  const relMap = { 'today': 0, 'tod': 0, 'tomorrow': 1, 'tom': 1 };
  for (const [key, offset] of Object.entries(relMap)) {
    const reg = new RegExp(`\\b${key}\\b`, 'i');
    if (reg.test(lower)) {
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      d.setHours(23, 59, 0, 0);
      targetDate = d;
      cleanTitle = cleanTitle.replace(reg, '').trim();
      break;
    }
  }

  // 3. Times (8pm, 16:00, etc.)
  const timeMatch = cleanTitle.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (timeMatch && targetDate) {
    let hrs = parseInt(timeMatch[1]);
    const mins = parseInt(timeMatch[2] || 0);
    const ampm = timeMatch[3]?.toLowerCase();

    if (ampm === 'pm' && hrs < 12) hrs += 12;
    if (ampm === 'am' && hrs === 12) hrs = 0;
    
    targetDate.setHours(hrs, mins, 0, 0);
    cleanTitle = cleanTitle.replace(timeMatch[0], '').trim();
  } else if (timeMatch && !targetDate) {
    const d = new Date(now);
    let hrs = parseInt(timeMatch[1]);
    const mins = parseInt(timeMatch[2] || 0);
    const ampm = timeMatch[3]?.toLowerCase();

    if (ampm === 'pm' && hrs < 12) hrs += 12;
    if (ampm === 'am' && hrs === 12) hrs = 0;
    
    d.setHours(hrs, mins, 0, 0);
    if (d < now) d.setDate(d.getDate() + 1);
    targetDate = d;
    cleanTitle = cleanTitle.replace(timeMatch[0], '').trim();
  }

  // Final Clean
  cleanTitle = cleanTitle.replace(/\s+/g, ' ').replace(/^[-–—]\s*/, '').trim();
  cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

  return { 
    date: targetDate ? targetDate.toISOString() : null, 
    recurrence,
    cleanTitle: cleanTitle || 'Untitled Quest' 
  };
}

function formatDeadline(isoString) {
  const d = new Date(isoString);
  const now = new Date();
  const diff = d - now;

  if (diff <= 0) return 'OVERDUE';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m left`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h left`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Service Worker Registration ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
