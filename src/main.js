// ============================================
// ARISE V4.0 — Main Application
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
import { createTask, completeTask, deleteTask, abandonTask, getActiveTasks, twoMinGiveUp, twoMinAriseComplete, getDeadlineBleed } from './engine/questEngine.js';
import { canExtract, getExtractionCost, performExtraction, equipShadow, unequipShadow, getTierLabel, getTierColor, getBuffDescription } from './engine/gacha.js';
import { isPenaltyActive, getPenaltyTimeRemaining, formatPenaltyTime, activatePenalty, clearPenalty, startEssenceDrain, completeEssenceDrain } from './engine/penalty.js';
import { playClick, playTaskComplete, playLevelUp, playGachaPull, playGachaReveal, playPenaltyAlert, playHeartbeat, playArise, playTimerComplete, playChainBreak, initAudio } from './audio/soundEngine.js';
import { ParticleWeather } from './components/effects/ParticleWeather.js';
import { drawRadarChart } from './components/hud/AttributeRadar.js';
import { PortalAnimation } from './components/gacha/Portal.js';
import { pulseManaVeins, addFracture, healFractures, playGlitchTransition, showLevelUpSequence, showToast, showExpToast, showStoneToast, showChainToast } from './components/effects/effectsManager.js';

import { showHandBook } from './components/HandBook.js';
import { initFirebase, connectToGuild, pushToGuild } from './engine/firebase.js';
import { renderStore } from './components/Store.js';
import { evaluateAbandonment } from './engine/ai.js';
import { getIcon } from './engine/icons.js';

// ── Globals ──
let currentView = 'dashboard';
let particles = null;
let isManaCharging = false;

// ── UI Helper: Icon with Image Fallback ──
export function renderUIIcon(assetPath, iconType, color = 'currentColor', size = '100%') {
  const svg = getIcon(iconType, color);
  return `
    <div class="ui-icon-fallback" style="width:${size}; height:${size}; display:flex; align-items:center; justify-content:center; position:relative;">
      <img src="${assetPath}" 
           style="position:absolute; width:100%; height:100%; object-fit:contain; z-index:2" 
           onerror="this.style.opacity='0'; this.nextElementSibling.style.display='block'; this.style.pointerEvents='none';">
      <div class="svg-placeholder" style="display:none; width:100%; height:100%; z-index:1;">
        ${svg}
      </div>
    </div>
  `;
}

// ── Global SVG Icons (Nav/UI) ──
const ICONS = {
  dashboard: getIcon('dashboard'),
  dungeons: getIcon('dungeons'),
  shadows: getIcon('shadows', 'var(--cyan)'),
  store: getIcon('store'),
  settings: getIcon('settings'),
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:24px;height:24px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="width:20px;height:20px"><polyline points="20 6 9 17 4 12"/></svg>',
  timer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  handbook: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;vertical-align:middle"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'
};

// ── Boot ──
document.addEventListener('DOMContentLoaded', () => {
  initAudio();
  initApp();
});

function initApp() {
  const app = document.getElementById('app');
  updateRankTheme();
  const isAuth = gameState.get('initialized') && gameState.get('settings.guildId');
  if (!isAuth) { renderLoginView(app); return; }
  if (initFirebase()) {
    const s = gameState.get('settings');
    connectToGuild(s.guildId, s.username, s.password);
  }
  renderAppShell(app);
  startBackgroundSystems();
}

function updateRankTheme() {
  document.documentElement.setAttribute('data-rank', (gameState.get('rank') || 'e').toLowerCase());
}

// ── Views ──
function renderAppShell(container) {
  container.innerHTML = `
    <canvas class="particle-canvas" id="particle-canvas"></canvas>
    <div id="mana-veins" class="mana-veins"></div>
    <div id="screen-fractures" class="screen-fractures"></div>
    <div id="glitch-overlay" class="glitch-overlay"></div>
    <div class="view-container" id="view-container"></div>
    <nav class="nav-bar">
      <button class="nav-item ${currentView === 'dashboard' ? 'active' : ''}" data-view="dashboard">
        <div class="nav-icon">${getIcon('dashboard')}</div>
        <span>HUD</span>
      </button>
      <button class="nav-item ${currentView === 'dungeons' ? 'active' : ''}" data-view="dungeons">
        <div class="nav-icon">${getIcon('dungeons')}</div>
        <span>DUNGEONS</span>
      </button>
      <button class="nav-item ${currentView === 'shadows' ? 'active' : ''}" data-view="shadows">
        <div class="nav-icon">${getIcon('shadows')}</div>
        <span>ARMY</span>
      </button>
      <button class="nav-item ${currentView === 'store' ? 'active' : ''}" data-view="store">
        <div class="nav-icon">${getIcon('store')}</div>
        <span>VAULT</span>
      </button>
      <button class="nav-item ${currentView === 'settings' ? 'active' : ''}" data-view="settings">
        <div class="nav-icon">${getIcon('settings')}</div>
        <span>SYSTEM</span>
      </button>
    </nav>
  `;

  // Particles
  const pCanvas = document.getElementById('particle-canvas');
  if (gameState.get('settings.particlesEnabled') !== false) {
    particles = new ParticleWeather(pCanvas);
    particles.setRankColor(gameState.get('rank') || 'e');
    particles.start();
  }

  // Nav Handlers
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      if (view === currentView) return;
      navigateTo(view);
    });
  });

  renderView(currentView);
}

function navigateTo(view) {
  playClick();
  if (gameState.get('settings.glitchTransitions') !== false) playGlitchTransition();
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === view));
  currentView = view;
  setTimeout(() => renderView(view), 100);
}

function renderView(view) {
  const container = document.getElementById('view-container');
  if (!container) return;
  switch (view) {
    case 'dashboard': renderDashboard(container); break;
    case 'dungeons': renderDungeons(container); break;
    case 'shadows': renderShadows(container); break;
    case 'store': renderStore(container); break;
    case 'settings': renderSettings(container); break;
  }
}

// ── Background Systems ──
function startBackgroundSystems() {
  setInterval(() => {
    if (isManaCharging) handleManaTick();
    if (particles) particles.setIntensity(getChainMultiplier());
  }, 1000);
  gameState.on('*', () => pushToGuild());
}

function startManaCharge() {
  if (gameState.get('mp') >= (gameState.get('mpMax') || 100)) {
    showToast("Mana at Maximum Capacity", "info");
    return;
  }
  isManaCharging = true;
  document.getElementById('mana-veins')?.classList.add('mana-flicker');
  const label = document.getElementById('mana-charge-label');
  if (label) label.textContent = "EXTRACTING...";
  playHeartbeat();
}

function stopManaCharge() {
  isManaCharging = false;
  document.getElementById('mana-veins')?.classList.remove('mana-flicker');
  const label = document.getElementById('mana-charge-label');
  if (label) label.textContent = "MANA CHARGE";
}

function handleManaTick() {
  const currentMP = gameState.get('mp') || 0;
  const maxMP = gameState.get('mpMax') || 100;
  if (currentMP < maxMP) {
    const nextMP = Math.min(maxMP, currentMP + 5);
    gameState.set('mp', nextMP);
    if (Math.random() > 0.8) { awardStones(1); showStoneToast(1); }
    if (nextMP >= maxMP) { stopManaCharge(); showToast("Mana Fully Restored", "success"); playArise(); }
  }
}

// ── HUD / Dashboard ──
function renderDashboard(container) {
  const name = gameState.get('hunterName');
  const level = gameState.get('level');
  const rank = (gameState.get('rank') || 'E').toUpperCase();
  const title = gameState.get('title') || 'Unawakened';
  const stones = gameState.get('essenceStones') || 0;
  const progress = getLevelProgress();
  const hp = gameState.get('hp') || 100;
  const mp = gameState.get('mp') || 100;
  const hpMax = gameState.get('hpMax') || 100;
  const mpMax = gameState.get('mpMax') || 100;
  const attrs = getAttributeSummary();
  const tasks = getActiveTasks().slice(0, 3);

  container.innerHTML = `
    <div class="status-header">
      <div class="status-avatar" title="Open Handbook">${name.charAt(0).toUpperCase()}</div>
      <div class="status-info">
        <div class="status-name">${name} <span class="badge">Lv.${level} [${rank}]</span></div>
        <div class="status-title">${title}</div>
        <div class="status-level-row">
          <div class="status-bar-group"><span class="status-label">HP</span><div class="status-bar"><div class="status-bar__fill status-bar__fill--hp" style="width:${(hp/hpMax)*100}%"></div></div></div>
          <div class="status-bar-group"><span class="status-label">MP</span><div class="status-bar"><div class="status-bar__fill status-bar__fill--mp" style="width:${(mp/mpMax)*100}%"></div></div></div>
          <div class="status-bar-group"><span class="status-label">XP</span><div class="status-bar" style="height:3px"><div class="status-bar__fill status-bar__fill--exp" style="width:${progress}%"></div></div></div>
        </div>
      </div>
      <button class="handbook-btn" onclick="UI_showHandBook()">${ICONS.handbook}</button>
    </div>

    <div class="multiplier-bar">
      <div class="multiplier-chip">⛓️ CHAIN ×${getChainMultiplier()}</div>
      <div class="multiplier-chip">💎 ${stones} STONES</div>
    </div>

    <div class="section-header"><h3 class="section-title">COMBAT RADAR</h3></div>
    <div class="panel radar-panel"><canvas id="radar-chart"></canvas></div>

    <div class="stat-grid">
      ${attrs.map(a => `
        <div class="panel stat-card" style="border-color:${a.rankColor}22">
          <div class="stat-card__icon" style="color:${a.rankColor}">${a.icon}</div>
          <div class="stat-card__value">
            ${a.value}
            ${a.equipBonus > 0 ? `<span class="stat-card__bonus">(+${a.equipBonus})</span>` : ''}
          </div>
          <div class="stat-card__name">${a.key.toUpperCase()}</div>
          <div class="stat-card__rank" style="color:${a.rankColor}">${a.rank}-RANK</div>
        </div>
      `).join('')}
    </div>

    <div class="section-header"><h3 class="section-title">ACTIVE DUNGEONS</h3></div>
    <div class="task-list">
      ${tasks.map(t => renderTaskCardHTML(t)).join('')}
      ${tasks.length === 0 ? '<div class="empty-state">NO DUNGEONS DETECTED</div>' : ''}
    </div>

    <div class="quick-actions">
      <button class="btn btn--primary" id="dash-new-task" style="flex:2">NEW DUNGEON</button>
      <button class="btn btn--secondary" id="dash-mana" style="flex:1">MANA CHARGE</button>
    </div>
  `;

  const radarCanvas = document.getElementById('radar-chart');
  if (radarCanvas) drawRadarChart(radarCanvas);

  document.getElementById('dash-new-task')?.onclick = () => showTaskCreator();
  document.getElementById('dash-mana')?.onmousedown = startManaCharge;
  document.getElementById('dash-mana')?.onmouseup = stopManaCharge;
  document.getElementById('dash-mana')?.onmouseleave = stopManaCharge;

  attachTaskCardListeners();
}

window.UI_showHandBook = showHandBook;

function renderDungeons(container) {
  const tasks = getActiveTasks();
  container.innerHTML = `
    <div class="view-header">
      <h2 class="view-title">DUNGEON BOARD</h2>
      <div class="view-subtitle">${tasks.length} ACTIVE RAID(S)</div>
    </div>
    <div class="task-list">
      ${tasks.length ? tasks.map(t => renderTaskCardHTML(t)).join('') : '<div class="empty-state">QUIET BEFORE THE STORM...</div>'}
    </div>
    <button class="fab" id="fab-add-task">${ICONS.plus}</button>
  `;
  document.getElementById('fab-add-task')?.onclick = () => showTaskCreator();
  attachTaskCardListeners();
}

function renderShadows(container) {
  const shadows = gameState.get('shadows') || [];
  container.innerHTML = `
    <div class="view-header">
      <h2 class="view-title">SHADOW THRONE</h2>
      <div class="view-subtitle">${shadows.length} LOYAL SHADOWS</div>
    </div>
    
    <div class="shadow-grid">
      ${shadows.map(s => {
        const color = getTierColor(s.tier);
        return `
          <div class="panel shadow-card ${s.equipped ? 'active' : ''}" style="border-color:${color}55">
            <div class="shadow-card__tier" style="color:${color}">${s.tier}</div>
            <div class="shadow-card__name">${s.name}</div>
            <div class="shadow-card__buff">${getBuffDescription(s)}</div>
            <div class="shadow-card__actions">
              <button class="btn btn--sm ${s.equipped ? 'btn--secondary' : 'btn--primary'}" onclick="handleShadowEquip('${s.id}')">
                ${s.equipped ? 'RELEASE' : 'ARISE'}
              </button>
            </div>
          </div>
        `;
      }).join('')}
      
      ${shadows.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state__icon">🌑</div>
          <div class="empty-state__text">THE VOID IS SILENT</div>
          <div class="empty-state__sub">EXTRACT SHADOWS FROM FALLEN DUNGEON BOSSES.</div>
        </div>
      ` : ''}
    </div>
  `;
}

window.handleShadowEquip = (id) => {
  const shadows = gameState.get('shadows');
  const s = shadows.find(x => x.id === id);
  if (s.equipped) unequipShadow(id);
  else equipShadow(id);
  renderView('shadows');
};

function renderSettings(container) {
  const settings = gameState.get('settings') || {};

  container.innerHTML = `
    <div class="view-header">
      <h2 class="view-title">SYSTEM CONFIG</h2>
    </div>
    
    <div class="panel settings-group">
      <div class="settings-group__title">NEURAL LINK (JUDGMENT AI)</div>
      <div class="settings-item">
        <div class="settings-text">
          <div class="settings-item__label">OpenRouter Key</div>
          <div class="settings-item__desc">Essential for 'Trial of the Monarch' evaluation.</div>
        </div>
        <input type="password" id="opt-openrouter" class="input" value="${settings.openrouterKey || ''}" placeholder="sk-or-v1-...">
      </div>
    </div>

    <div class="panel settings-group">
      <div class="settings-group__title">VISUAL INTERFACE</div>
      <div class="settings-item">
        <div class="settings-text">
          <div class="settings-item__label">Mana Particles</div>
          <div class="settings-item__desc">Enable ambient mana flow in the background.</div>
        </div>
        <button class="toggle ${settings.particlesEnabled !== false ? 'active' : ''}" id="opt-particles"></button>
      </div>
    </div>

    <div style="margin-top:var(--space-2xl); display:flex; gap:var(--space-md);">
      <button class="btn btn--primary" id="save-settings" style="flex:1">SYNC SYSTEM</button>
      <button class="btn btn--secondary" id="reset-data" style="color:var(--crimson)">FORMAT DATA</button>
    </div>
  `;

  document.getElementById('save-settings').onclick = () => {
    gameState.set('settings.openrouterKey', document.getElementById('opt-openrouter').value.trim());
    showToast("System Re-calibrated", "success");
    playArise();
  };

  document.getElementById('opt-particles').onclick = (e) => {
    const active = e.target.classList.toggle('active');
    gameState.set('settings.particlesEnabled', active);
    window.location.reload();
  };

  document.getElementById('reset-data').onclick = () => {
    if (confirm("THIS WILL FORMAT ALL SYSTEM DATA. ARE YOU SURE?")) {
      gameState.reset();
    }
  };
}

function renderTaskCardHTML(task) {
  const rankColor = getStatRankColor(task.difficulty);
  const deadlineStr = task.deadline ? getDeadlineBleed(task) : 'INFINITE';
  
  return `
    <div class="task-card task-card--${task.difficulty.toLowerCase()}" data-id="${task.id}" style="border-left: 4px solid ${rankColor}">
      <div class="task-card__difficulty" style="background:${rankColor}">${task.difficulty}</div>
      <div class="task-card__info">
        <div class="task-card__title">${task.title}</div>
        <div class="task-card__meta">
          <span>⌛ ${deadlineStr}</span>
          <span>💎 REWARD: ${task.difficulty}</span>
        </div>
      </div>
      <div class="task-card__actions">
        <button class="task-card__btn task-card__complete" data-id="${task.id}">${ICONS.check}</button>
        <button class="task-card__btn task-card__delete" data-id="${task.id}" style="color:var(--crimson)">${ICONS.trash}</button>
      </div>
    </div>
  `;
}

function attachTaskCardListeners() {
  document.querySelectorAll('.task-card__complete').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); completeTask(btn.dataset.id); renderView(currentView); };
  });
  document.querySelectorAll('.task-card__delete').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); showAbandonModal(btn.dataset.id); };
  });
}

function showAbandonModal(taskId) {
  const reason = prompt("JUDGMENT: State your reason for abandonment.");
  if (!reason) return;
  
  evaluateAbandonment(reason, "Task").then(res => {
    if (res.score < 50) {
      showToast("CONVICTION FAILED. TRIAL COMMENCING.", "error");
      twoMinObstacleRedeem(taskId);
    } else {
      showToast("JUDGMENT PASSED. Task removed.", "success");
      abandonTask(taskId, res.score);
      renderView(currentView);
    }
  });
}

async function twoMinObstacleRedeem(taskId) {
  const overlay = document.createElement('div');
  overlay.className = 'obstacle-overlay';
  overlay.innerHTML = `
    <div class="obstacle-hud">
      <div class="obstacle-title">SYSTEM OVERRIDE</div>
      <div id="obstacle-countdown" class="obstacle-timer">02:00</div>
      <div class="obstacle-msg">PROVE YOUR CONVICTION. COMPLETE THE QUEST NOW.</div>
      <div id="obstacle-task-anchor" style="margin-top:var(--space-2xl)"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const tasks = gameState.get('tasks') || [];
  const task = tasks.find(t => t.id === taskId);
  const anchor = overlay.querySelector('#obstacle-task-anchor');
  anchor.innerHTML = renderTaskCardHTML(task);
  
  anchor.querySelector('.task-card__complete').onclick = async () => {
    clearInterval(timer);
    overlay.remove();
    const result = await twoMinAriseComplete(taskId);
    if (result) {
      showToast("TRIAL OVERCOME. ASCENSION COMMENCING.", "success");
      playArise();
      renderView(currentView);
    }
  };

  let timeLeft = 120;
  const timer = setInterval(() => {
    timeLeft--;
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const timeStr = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    overlay.querySelector('#obstacle-countdown').textContent = timeStr;
    if (timeLeft <= 10) overlay.querySelector('#obstacle-countdown').style.color = 'var(--crimson)';
    if (timeLeft <= 0) {
      clearInterval(timer);
      overlay.remove();
      abandonTask(taskId, 0);
      showToast("TRIAL FAILED. VITALITY DRAINED.", "error");
      renderView(currentView);
    }
  }, 1000);
}

function showTaskCreator() {
  const title = prompt("QUEST DESCRIPTION (e.g. 'Gym' or 'Code for 2h'):");
  if (!title) return;
  const diff = prompt("RANK (E, D, C, B, A, S):", "E").toUpperCase();
  const cat = prompt("TYPE (Work, Study, Fitness, Personal):", "Work");
  createTask({ title, category: cat.toLowerCase(), difficulty: diff || 'E' });
  showToast("SYSTEM: New Dungeon Detected", "success");
  renderView(currentView);
}

function renderLoginView(container) {
  container.innerHTML = `
    <div class="setup-overlay">
      <h1 class="logo-text">ARISE</h1>
      <button class="btn btn--primary" id="quick-start" style="width:200px">AWAKEN</button>
    </div>
  `;
  document.getElementById('quick-start').onclick = () => {
    gameState.set('initialized', true);
    gameState.set('settings.guildId', 'monarch_test');
    initApp();
  };
}
