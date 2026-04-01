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
import { ATTRIBUTES, getAttributeSummary, getStatRank, getStatRankColor, getChainWindow } from './engine/attributes.js';
import { DIFFICULTY, CATEGORIES, expForLevel, getRankForLevel, getLevelProgress, awardEXP, awardStones, spendStones } from './engine/rankSystem.js';
import { getChainMultiplier, getChainTimeRemaining, isChainActive, formatMultiplier } from './engine/chainLink.js';
import { getBloodlustMultiplier, isBloodlustActive } from './engine/bloodlust.js';
import { createTask, completeTask, deleteTask, getActiveTasks, twoMinGiveUp, twoMinAriseComplete, getDeadlineBleed } from './engine/questEngine.js';
import { canExtract, getExtractionCost, performExtraction, equipShadow, unequipShadow, getTierLabel, getTierColor, getBuffDescription } from './engine/gacha.js';
import { isPenaltyActive, getPenaltyTimeRemaining, formatPenaltyTime, activatePenalty, clearPenalty, startEssenceDrain, completeEssenceDrain } from './engine/penalty.js';
import { playClick, playTaskComplete, playLevelUp, playGachaPull, playGachaReveal, playPenaltyAlert, playHeartbeat, playArise, playTimerComplete, playChainBreak, initAudio } from './audio/soundEngine.js';
import { ParticleWeather } from './components/effects/ParticleWeather.js';
import { drawRadarChart } from './components/hud/AttributeRadar.js';
import { PortalAnimation } from './components/gacha/Portal.js';
import { pulseManaVeins, addFracture, healFractures, playGlitchTransition, showLevelUpSequence, showToast, showExpToast, showStoneToast, showChainToast } from './components/effects/effectsManager.js';

import { showHandBook } from './components/HandBook.js';


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
  timer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  skull: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><circle cx="12" cy="10" r="8"/><path d="M8 22l1-4h6l1 4"/><circle cx="9" cy="10" r="1.5" fill="currentColor"/><circle cx="15" cy="10" r="1.5" fill="currentColor"/></svg>',
  mana: '<svg viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="2" style="width:16px;height:16px;vertical-align:middle"><polygon points="12 2 15 10 22 10 16 15 18 22 12 18 6 22 8 15 2 10 9 10"/></svg>',
  essence: '<svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" style="width:16px;height:16px;vertical-align:middle"><polygon points="12 2 22 12 12 22 2 12"/></svg>',
  help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;vertical-align:middle"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
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

  // Check first-time setup
  if (!gameState.get('initialized')) {
    renderSetupWizard(app);
    return;
  }

  renderAppShell(app);
  startBackgroundSystems();
}

// ── Rank Theme ──
function updateRankTheme() {
  document.documentElement.setAttribute('data-rank', gameState.get('rank') || 'e');
}

// ── Setup Wizard ──
function renderSetupWizard(container) {
  container.innerHTML = `
    <div class="setup-overlay" id="setup-wizard">
      <div class="setup-content">
        <div style="font-size:48px;margin-bottom:16px;">⚔️</div>
        <h1 class="setup-title">ARISE</h1>
        <p class="setup-subtitle">The System has chosen you. Enter your Hunter name to begin.</p>
        <div class="setup-field">
          <label for="hunter-name-input">Hunter Name</label>
          <input type="text" id="hunter-name-input" placeholder="Enter your name..." maxlength="20" autocomplete="off" />
        </div>
        <button class="btn btn-primary btn-lg btn-full" id="setup-begin-btn" disabled>
          Begin Awakening
        </button>
        <p class="setup-warning">// This name cannot be changed easily. Choose wisely.</p>
      </div>
    </div>
  `;

  const input = document.getElementById('hunter-name-input');
  const btn = document.getElementById('setup-begin-btn');

  input.addEventListener('input', () => {
    btn.disabled = input.value.trim().length < 2;
  });

  btn.addEventListener('click', () => {
    const name = input.value.trim();
    if (name.length < 2) return;

    playClick();
    gameState.batch({
      initialized: true,
      hunterName: name,
      createdAt: new Date().toISOString(),
      lastActiveDate: new Date().toISOString(),
    });
    gameState.forceSave();

    // Dramatic transition
    const wizard = document.getElementById('setup-wizard');
    wizard.style.animation = 'fadeOut 0.8s ease-out forwards';
    setTimeout(() => {
      renderAppShell(container);
      startBackgroundSystems();
      showToast(`Welcome, Hunter ${name}. The System awaits.`, 'info');
    }, 800);
  });

  // Focus on mount
  setTimeout(() => input.focus(), 300);
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
  const activeTasks = getActiveTasks();

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

    ${activeTasks.length === 0 ? `
      <div class="empty-state">
        <img src="/empty_dungeon.png" alt="No Dungeons" style="width:120px; margin-bottom:var(--space-md); opacity:0.8; filter:drop-shadow(0 0 20px rgba(0,229,255,0.2));" />
        <div class="empty-state__text">No active dungeons</div>
        <div class="empty-state__sub">Create a task in the Dungeons tab</div>
      </div>
    ` : `
      <div class="task-list">
        ${activeTasks.slice(0, 3).map(t => renderTaskCardHTML(t)).join('')}
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

  // Task card listeners
  attachTaskCardListeners();
}

// ============================================
// VIEW: DUNGEONS
// ============================================
function renderDungeons(container) {
  const tasks = getActiveTasks();

  container.innerHTML = `
    <div class="section-header">
      <h3 class="section-title">⚔️ Dungeon Board</h3>
    </div>

    <div class="filter-tabs" id="task-filters">
      <button class="filter-tab ${taskFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
      ${CATEGORIES.map(c => `
        <button class="filter-tab ${taskFilter === c.key ? 'active' : ''}" data-filter="${c.key}">${c.icon} ${c.label}</button>
      `).join('')}
    </div>

    ${tasks.length === 0 ? `
      <div class="empty-state">
        <img src="/empty_dungeon.png" alt="No Dungeons" style="width:120px; margin-bottom:var(--space-md); opacity:0.8; filter:drop-shadow(0 0 20px rgba(0,229,255,0.2));" />
        <div class="empty-state__text">No dungeons to clear</div>
        <div class="empty-state__sub">Tap + to create your first quest</div>
      </div>
    ` : `
      <div class="task-list" id="task-list">
        ${filterTasks(tasks).map(t => renderTaskCardHTML(t, true)).join('')}
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
  attachTaskCardListeners();
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
    shadowSortBy = e.target.value; renderShadows(container);
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
// VIEW: PROFILE
// ============================================
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
          <div class="settings-item__label">Gemini API Key</div>
          <div class="settings-item__desc">Required to awaken the Monarch's true AI System</div>
        </div>
        <div style="display:flex;width:100%;gap:var(--space-sm)">
          <input type="password" id="gemini-key-input" placeholder="AIzaSy..." value="${s.geminiKey || ''}" style="flex:1" autocomplete="off" />
          <button class="btn btn-primary" id="save-gemini-key">Save</button>
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
    </div>

    <div style="text-align:center;margin-top:var(--space-2xl);color:var(--ash);font-size:var(--text-xs);font-family:var(--font-mono)">
      ARISE V3.0 — The Monarch's Absolute System<br/>
      Built for the relentless.
    </div>
  `;

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
  document.getElementById('save-gemini-key')?.addEventListener('click', (e) => {
    playClick();
    const input = document.getElementById('gemini-key-input');
    const key = input.value.trim();
    
    if (key && !key.startsWith('AIza')) {
      showToast('Invalid Gemini API Key format', 'error');
      return;
    }

    const settings = gameState.get('settings') || {};
    settings.geminiKey = key;
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

    if (key) showToast('System Awakened', 'success');
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
// SHARED: Task Card HTML
// ============================================
function renderTaskCardHTML(task, showActions = false) {
  const diff = DIFFICULTY[task.difficulty] || DIFFICULTY.normal;
  const bleed = getDeadlineBleed(task);
  const bleedColor = bleed > 0.8 ? 'rgba(255,23,68,0.15)' : bleed > 0.5 ? 'rgba(255,215,0,0.08)' : 'transparent';
  const deadlineClass = bleed > 0.8 ? 'deadline-critical' : bleed > 0.5 ? 'deadline-near' : '';
  const cat = CATEGORIES.find(c => c.key === task.category);

  return `
    <div class="task-card ${deadlineClass} ${task.status === 'completed' ? 'completed' : ''}"
         data-difficulty="${task.difficulty}" data-task-id="${task.id}" id="task-${task.id}">
      <div class="task-card__bleed" style="background:${bleedColor}"></div>
      <div class="task-card__header">
        <button class="task-card__checkbox" data-action="complete" data-task-id="${task.id}">
          ${ICONS.check}
        </button>
        <span class="task-card__title">${task.title}</span>
      </div>
      <div class="task-card__meta">
        <span class="task-card__tag task-card__tag--difficulty" style="color:${diff.color};border-color:${diff.color}40">${diff.label}</span>
        ${cat ? `<span class="task-card__tag task-card__tag--category">${cat.icon} ${cat.label}</span>` : ''}
        <span class="task-card__tag task-card__tag--stat">${task.stat.toUpperCase()}</span>
        <span class="task-card__tag task-card__tag--exp">+${diff.exp} XP</span>
        ${task.assignee && task.assignee.toLowerCase() !== 'self' ? `<span class="task-card__tag" style="border:1px solid var(--purple); color:var(--purple); box-shadow:0 0 8px rgba(167,139,250,0.3)">👥 ${task.assignee}</span>` : ''}
        ${task.deadline ? `<span class="task-card__deadline">${formatDeadline(task.deadline)}</span>` : ''}
      </div>
      ${showActions ? `
        <div class="task-card__actions">
          <button class="task-card__action-btn btn btn-ghost btn-sm" data-action="twominrule" data-task-id="${task.id}">
            ${ICONS.skull} I Can't
          </button>
          <button class="task-card__action-btn btn btn-primary btn-sm" data-action="complete" data-task-id="${task.id}">
            ${ICONS.check} Done
          </button>
          <button class="task-card__action-btn btn btn-ghost btn-sm" data-action="delete" data-task-id="${task.id}" style="color:var(--crimson);border-color:rgba(255,23,68,0.2)">
            ${ICONS.trash}
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

function attachTaskCardListeners() {
  // Complete buttons
  document.querySelectorAll('[data-action="complete"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskId = btn.dataset.taskId;
      handleTaskComplete(taskId);
    });
  });

  // 2-min rule buttons
  document.querySelectorAll('[data-action="twominrule"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskId = btn.dataset.taskId;
      showTwoMinRule(taskId);
    });
  });

  // Delete buttons
  document.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskId = btn.dataset.taskId;
      playClick();
      deleteTask(taskId);
      showToast('Dungeon abandoned', 'info');
      renderView(currentView);
    });
  });
}

// ============================================
// TASK COMPLETION FLOW
// ============================================
async function handleTaskComplete(taskId) {
  playTaskComplete();
  const result = completeTask(taskId);
  if (!result) return;

  // Visual effects
  pulseManaVeins();
  healFractures();

  // Toasts
  showExpToast(result.expEarned);
  if (result.stonesEarned > 0) {
    setTimeout(() => showStoneToast(result.stonesEarned), 400);
  }
  if (result.chainStreak > 1) {
    setTimeout(() => showChainToast(result.chainStreak), 800);
  }

  // Level up?
  if (result.levelsGained > 0) {
    playLevelUp();
    await showLevelUpSequence(result.newLevel, [result.statGained]);
    updateRankTheme();
    if (particles) particles.setRankColor(gameState.get('rank'));
  }

  // Hidden quest?
  if (result.isHiddenQuest) {
    setTimeout(() => {
      showToast('🌟 HIDDEN QUEST TRIGGERED! Double rewards!', 'exp');
      awardEXP(result.hiddenQuestBonus);
    }, 1200);
  }

  // Re-render
  renderView(currentView);
}

// ============================================
// TASK CREATOR MODAL
// ============================================
function showTaskCreator() {
  playClick();
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.id = 'task-creator-modal';

  let selectedDiff = 'normal';
  let selectedStat = 'int';
  let selectedCat = 'personal';

  backdrop.innerHTML = `
    <div class="modal task-creator">
      <h2 class="task-creator__title">New Dungeon</h2>

      <div class="task-creator__field">
        <label class="task-creator__label">Quest Name</label>
        <input type="text" id="tc-name" placeholder="What must be done?" autocomplete="off" />
      </div>

      <div class="task-creator__field">
        <label class="task-creator__label">Difficulty</label>
        <div class="task-creator__difficulty-grid" id="tc-diff-grid">
          ${Object.entries(DIFFICULTY).map(([key, d]) => `
            <button class="difficulty-option ${key === selectedDiff ? 'selected' : ''}" data-diff="${key}">
              ${d.label}<br/><span style="font-size:9px;opacity:0.7">+${d.exp}XP</span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="task-creator__field">
        <label class="task-creator__label">Stat Growth</label>
        <div class="task-creator__stat-grid" id="tc-stat-grid">
          ${Object.entries(ATTRIBUTES).map(([key, a]) => `
            <button class="stat-option ${key === selectedStat ? 'selected' : ''}" data-stat="${key}">
              ${a.icon} ${key.toUpperCase()}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="task-creator__field">
        <label class="task-creator__label">Category</label>
        <div class="task-creator__category-grid" id="tc-cat-grid">
          ${CATEGORIES.map(c => `
            <button class="category-option ${c.key === selectedCat ? 'selected' : ''}" data-cat="${c.key}">
              ${c.icon} ${c.label}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="task-creator__field">
        <label class="task-creator__label">Assign To</label>
        <div style="display:flex;gap:var(--space-sm);">
          <input type="text" id="tc-assignee" value="Self" class="task-creator" style="flex:1; padding:12px; border-radius:var(--radius-md); background:var(--black); border:1px solid var(--border); color:var(--white); outline:none;" />
        </div>
      </div>

      <div class="task-creator__field">
        <label class="task-creator__label">Deadline (Optional)</label>
        <input type="datetime-local" id="tc-deadline" style="color-scheme:dark" />
      </div>

      <div style="margin-top:var(--space-md)">
        <button class="btn btn-ghost btn-full" id="tc-enhance" style="color:var(--cyan); border-color:rgba(0,229,255,0.3)">
          ✨ Enhance Quest with AI
        </button>
      </div>

      <div style="display:flex;gap:var(--space-md);margin-top:var(--space-xl)">
        <button class="btn btn-ghost btn-full" id="tc-cancel">Cancel</button>
        <button class="btn btn-primary btn-full" id="tc-create">Create</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);

  // Focus
  setTimeout(() => document.getElementById('tc-name')?.focus(), 200);

  // Difficulty select
  document.querySelectorAll('.difficulty-option').forEach(opt => {
    opt.addEventListener('click', () => {
      playClick();
      document.querySelectorAll('.difficulty-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedDiff = opt.dataset.diff;
    });
  });

  // Stat select
  document.querySelectorAll('.stat-option').forEach(opt => {
    opt.addEventListener('click', () => {
      playClick();
      document.querySelectorAll('.stat-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedStat = opt.dataset.stat;
    });
  });

  // Category select
  document.querySelectorAll('.category-option').forEach(opt => {
    opt.addEventListener('click', () => {
      playClick();
      document.querySelectorAll('.category-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedCat = opt.dataset.cat;
    });
  });

  // Enhance with AI
  document.getElementById('tc-enhance')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const nameInput = document.getElementById('tc-name');
    const title = nameInput.value.trim();
    
    if (!title) {
      showToast('Enter a basic quest name first', 'error');
      return;
    }
    
    // Check if key exists
    if (!gameState.get('settings')?.geminiKey) {
      showToast('System Offline. Add Gemini Key in Settings.', 'error');
      return;
    }

    playClick();
    const origText = btn.innerHTML;
    btn.innerHTML = 'Connecting to System...';
    btn.disabled = true;

    try {
      const { enhanceQuest } = await import('./engine/ai.js');
      const data = await enhanceQuest(title);
      
      if (data) {
        // Update Title
        if (data.epicTitle) nameInput.value = data.epicTitle;
        
        // Update Difficulty
        if (data.difficulty && DIFFICULTY[data.difficulty]) {
          document.querySelectorAll('.difficulty-option').forEach(o => o.classList.remove('selected'));
          document.querySelector(`.difficulty-option[data-diff="${data.difficulty}"]`)?.classList.add('selected');
          selectedDiff = data.difficulty;
        }

        // Update Stat
        if (data.stat && ATTRIBUTES[data.stat]) {
          document.querySelectorAll('.stat-option').forEach(o => o.classList.remove('selected'));
          document.querySelector(`.stat-option[data-stat="${data.stat}"]`)?.classList.add('selected');
          selectedStat = data.stat;
        }

        // Update Category
        if (data.category && CATEGORIES.find(c => c.key === data.category)) {
          document.querySelectorAll('.category-option').forEach(o => o.classList.remove('selected'));
          document.querySelector(`.category-option[data-cat="${data.category}"]`)?.classList.add('selected');
          selectedCat = data.category;
        }

        showToast('Quest Enhanced by The System', 'success');
        pulseManaVeins();
      }
    } catch (err) {
      showToast(err.message || 'System error', 'error');
    } finally {
      btn.innerHTML = origText;
      btn.disabled = false;
    }
  });

  // Cancel
  document.getElementById('tc-cancel')?.addEventListener('click', () => {
    playClick();
    backdrop.remove();
  });
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) backdrop.remove();
  });

  // Create
  document.getElementById('tc-create')?.addEventListener('click', () => {
    const name = document.getElementById('tc-name')?.value.trim();
    if (!name) {
      showToast('Quest name is required', 'error');
      return;
    }

    const deadline = document.getElementById('tc-deadline')?.value || null;
    const assignee = document.getElementById('tc-assignee')?.value || 'Self';
    createTask({
      title: name,
      difficulty: selectedDiff,
      category: selectedCat,
      stat: selectedStat,
      deadline,
      assignee,
    });

    playClick();
    backdrop.remove();
    showToast('🏰 New dungeon created!', 'success');
    renderView(currentView);
  });
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

  function render() {
    if (phase === 'countdown') {
      const mins = Math.floor(timeLeft / 60);
      const secs = timeLeft % 60;
      overlay.innerHTML = `
        <div class="two-min-timer">${mins}:${secs.toString().padStart(2, '0')}</div>
        <div class="two-min-message">The System is watching.<br/>Can you overcome this?</div>
      `;
    } else if (phase === 'choice') {
      overlay.innerHTML = `
        <div class="two-min-timer">0:00</div>
        <div class="two-min-message">Time's up. What is your choice?</div>
        <div class="two-min-choices">
          <button class="btn btn-danger btn-lg" id="tmr-giveup">Give Up</button>
          <button class="btn btn-primary btn-lg" id="tmr-arise" style="box-shadow:var(--glow-cyan),0 0 40px var(--cyan-glow)">
            A R I S E
          </button>
        </div>
      `;

      document.getElementById('tmr-giveup')?.addEventListener('click', () => {
        playClick();
        clearInterval(twoMinInterval);
        twoMinGiveUp(taskId);
        overlay.remove();
        showToast('You received 1 Stone. The dungeon is closed.', 'info');
        renderView(currentView);
      });

      document.getElementById('tmr-arise')?.addEventListener('click', () => {
        playArise();
        phase = 'arise';
        timeLeft = 600; // 10 minutes
        render();
        startAriseTimer();
      });
    } else if (phase === 'arise') {
      const mins = Math.floor(timeLeft / 60);
      const secs = timeLeft % 60;
      overlay.innerHTML = `
        <div class="two-min-timer arise-mode">${mins}:${secs.toString().padStart(2, '0')}</div>
        <div class="two-min-message" style="color:var(--cyan)">
          You chose to ARISE.<br/>Complete the task before time runs out.
        </div>
      `;
    }
  }

  document.body.appendChild(overlay);
  render();

  // Start 2-min countdown
  twoMinInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(twoMinInterval);
      if (phase === 'countdown') {
        phase = 'choice';
        render();
      }
    } else {
      render();
    }
    // Heartbeat every 2 seconds
    if (timeLeft % 2 === 0 && phase === 'countdown') {
      playHeartbeat();
    }
  }, 1000);

  function startAriseTimer() {
    twoMinInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(twoMinInterval);
        // Arise complete!
        const result = twoMinAriseComplete(taskId);
        overlay.remove();
        if (result) {
          showToast('🔥 ARISE COMPLETE! +25 Stones +5× EXP!', 'exp');
          pulseManaVeins();
          if (result.levelsGained > 0) {
            playLevelUp();
            showLevelUpSequence(result.newLevel);
          }
        }
        renderView(currentView);
      } else {
        render();
      }
    }, 1000);
  }
}

// ============================================
// POMODORO / MANA CHARGE TIMER
// ============================================
function showPomodoroTimer() {
  playClick();
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  const totalSeconds = 25 * 60;
  let remaining = totalSeconds;
  let running = false;
  const circumference = 2 * Math.PI * 90;

  function render() {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const progress = remaining / totalSeconds;
    const dashOffset = circumference * (1 - progress);

    backdrop.innerHTML = `
      <div class="modal" style="padding:var(--space-xl)">
        <h3 style="text-align:center;margin-bottom:var(--space-lg);color:var(--cyan)">⚡ MANA CHARGE</h3>
        <div class="timer-display">
          <div class="timer-ring">
            <svg viewBox="0 0 200 200">
              <circle class="timer-ring__bg" cx="100" cy="100" r="90" />
              <circle class="timer-ring__progress" cx="100" cy="100" r="90"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${dashOffset}" />
            </svg>
            <div class="timer-time">${mins}:${secs.toString().padStart(2, '0')}</div>
          </div>
          <div class="timer-label">${running ? 'Focusing...' : remaining === totalSeconds ? 'Ready' : 'Paused'}</div>
        </div>
        <div class="timer-controls">
          <button class="btn ${running ? 'btn-danger' : 'btn-primary'}" id="pomo-toggle">
            ${running ? 'Pause' : 'Start'}
          </button>
          <button class="btn btn-ghost" id="pomo-cancel">Cancel</button>
        </div>
      </div>
    `;

    document.getElementById('pomo-toggle')?.addEventListener('click', () => {
      running = !running;
      if (running) startPomoInterval();
      else clearInterval(timerInterval);
      render();
    });

    document.getElementById('pomo-cancel')?.addEventListener('click', () => {
      clearInterval(timerInterval);
      playClick();
      backdrop.remove();
    });
  }

  function startPomoInterval() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(timerInterval);
        running = false;
        // Pomodoro complete!
        playTimerComplete();
        pulseManaVeins();

        // Award INT and EXP
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
      render();
    }, 1000);
  }

  document.body.appendChild(backdrop);
  render();
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
  const colors = {
    e: '#6B7280', d: '#60A5FA', c: '#00E5FF',
    b: '#A78BFA', a: '#C084FC', s: '#00E5FF'
  };
  return colors[rank] || '#6B7280';
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
