// ============================================
// ARISE V3.0 — Visual Effects Manager
// Mana Veins, Screen Fractures, Glitch,
// Level-Up Sequence, Toasts
// ============================================

// ── Mana Veins ──
export function pulseManaVeins() {
  const el = document.getElementById('mana-veins');
  if (!el) return;
  el.classList.remove('active');
  void el.offsetWidth; // reflow
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 1500);
}

// ── Screen Fractures ──
let fractureCount = 0;

export function addFracture() {
  const container = document.getElementById('screen-fractures');
  if (!container) return;

  fractureCount++;
  container.classList.add('active');

  const fracture = document.createElement('div');
  fracture.className = 'fracture-line';

  const angle = Math.random() * 180;
  const x = Math.random() * 100;
  const y = Math.random() * 100;
  const length = 30 + Math.random() * 120;

  fracture.style.left = `${x}%`;
  fracture.style.top = `${y}%`;
  fracture.style.width = `${length}px`;
  fracture.style.height = '1px';
  fracture.style.transform = `rotate(${angle}deg)`;

  container.appendChild(fracture);

  // Limit fractures
  if (container.children.length > 8) {
    container.removeChild(container.firstChild);
  }
}

export function healFractures() {
  const container = document.getElementById('screen-fractures');
  if (!container) return;

  if (container.children.length > 0) {
    container.removeChild(container.lastChild);
  }
  if (container.children.length === 0) {
    container.classList.remove('active');
    fractureCount = 0;
  }
}

// ── Glitch Transition ──
export function playGlitchTransition() {
  const el = document.getElementById('glitch-overlay');
  if (!el) return;
  el.classList.remove('active');
  void el.offsetWidth;
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 220);
}

// ── Level-Up Sequence ──
export function showLevelUpSequence(newLevel, statGains) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'levelup-overlay';
    overlay.innerHTML = `
      <div class="levelup-flash"></div>
      <div class="levelup-text">Level Up</div>
      <div class="levelup-number">${newLevel}</div>
      ${statGains ? `
        <div class="levelup-stats">
          ${statGains.map(s => `
            <div class="levelup-stat-gain">+${s.points} ${s.stat.toUpperCase()}</div>
          `).join('')}
        </div>
      ` : ''}
    `;

    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.style.animation = 'fadeOut 0.5s ease-out forwards';
      setTimeout(() => {
        overlay.remove();
        resolve();
      }, 500);
    }, 2500);
  });
}

// ── Toast System ──
let toastContainer = null;

function ensureToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function showToast(message, type = 'info') {
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

export function showExpToast(amount) {
  showToast(`+${amount} EXP`, 'exp');
}

export function showStoneToast(amount) {
  showToast(`+${amount} Essence Stones`, 'info');
}

export function showChainToast(streak) {
  showToast(`Chain ×${streak}! Multiplier: ${(1 + streak * 0.1).toFixed(1)}×`, 'info');
}
