import gameState from '../state/gameState.js';
import { STORE_ITEMS, LOOTBOXES, buyItem, equipItem, openLootbox, ITEM_TIERS, addCustomItem } from '../engine/storeLogic.js';
import { getIcon } from '../engine/icons.js';
import { showToast } from '../components/effects/effectsManager.js';

// SVG Icons
const UI_ICONS = {
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  essence: '<svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" style="width:14px;height:14px;vertical-align:middle"><polygon points="12 2 22 12 12 22 2 12"/></svg>',
  forge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 12h5v5h-5z"/><path d="M2 12h5v5H2z"/><path d="M7 12V7a5 5 0 0 1 10 0v5"/><path d="M2 17v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2"/></svg>'
};

let currentTab = 'vault'; // 'vault' or 'forge'

export function renderStore(container) {
  const stones = gameState.get('essenceStones') || 0;
  
  container.innerHTML = `
    <div class="store-container">
      <div class="view-header">
        <h2 class="view-title">THE MONARCH'S VAULT</h2>
        <div class="view-subtitle">${stones} ESSENCE STONES</div>
      </div>

      <div class="filter-tabs" style="margin-bottom: var(--space-xl)">
        <button class="filter-tab ${currentTab === 'vault' ? 'active' : ''}" data-tab="vault">SYSTEM VAULT</button>
        <button class="filter-tab ${currentTab === 'forge' ? 'active' : ''}" data-tab="forge">CUSTOM FORGE</button>
      </div>

      <div id="store-content">
        ${currentTab === 'vault' ? renderVault() : renderForge()}
      </div>
    </div>
  `;

  attachStoreListeners(container);
}

function renderVault() {
  const hunterRank = gameState.get('rank') || 'E';
  const inventory = gameState.get('inventory') || [];
  const equipment = gameState.get('equipment') || {};
  const customItems = gameState.get('customItems') || [];

  return `
    <!-- Lootboxes -->
    <div class="lootbox-section" style="margin-bottom: var(--space-2xl); display:grid; grid-template-columns: repeat(3, 1fr); gap:var(--space-md)">
      ${Object.values(LOOTBOXES).map(box => `
        <div class="panel lootbox-card" style="border-color: ${box.color}; text-align:center; padding:var(--space-md)">
          <div style="font-size:32px; margin-bottom:var(--space-sm)">📦</div>
          <div style="color:${box.color}; font-weight:bold; font-size:var(--text-xs)">${box.name.toUpperCase()}</div>
          <button class="btn btn--primary btn--sm lootbox-btn" data-box-id="${box.id}" style="width:100%; margin-top:var(--space-sm)">
            ${box.cost} 💎
          </button>
        </div>
      `).join('')}
    </div>

    <!-- System Items -->
    ${ITEM_TIERS.map(tier => {
      const tierItems = Object.values(STORE_ITEMS).filter(i => i.tier === tier);
      const isLocked = ITEM_TIERS.indexOf(tier) > ITEM_TIERS.indexOf(hunterRank.toUpperCase());
      
      return `
        <div class="section-header" style="margin-top: var(--space-xl)">
          <h4 class="section-title" style="font-size: 14px; color: ${getTierColor(tier)}">${tier}-RANK ARTIFACTS</h4>
          ${isLocked ? `<span style="font-size: 10px; color: var(--crimson)">RANK RESTRICTED</span>` : ''}
        </div>
        <div class="store-grid" style="${isLocked ? 'opacity: 0.5; pointer-events:none' : ''}">
          ${tierItems.map(item => renderItemCard(item, inventory, equipment)).join('')}
        </div>
      `;
    }).join('')}

    <!-- Custom Items Section -->
    ${customItems.length ? `
      <div class="section-header" style="margin-top: var(--space-2xl)">
        <h4 class="section-title" style="font-size: 14px; color: var(--gold)">FORGED LEGENDARIES</h4>
      </div>
      <div class="store-grid">
        ${customItems.map(item => renderItemCard(item, inventory, equipment, true)).join('')}
      </div>
    ` : ''}
  `;
}

function renderItemCard(item, inventory, equipment, isCustom = false) {
  const isBought = inventory.some(i => i.id === item.id);
  const isEquipped = Object.values(equipment).some(e => e && e.id === item.id);
  const tierColor = getTierColor(item.tier);
  
  return `
    <div class="panel item-card" data-item-id="${item.id}" data-custom="${isCustom}" style="border-color:${tierColor}22">
      <div class="item-card__icon" style="color:${tierColor}; filter: drop-shadow(0 0 8px ${tierColor}44)">
        ${getIcon(item.iconType, tierColor)}
      </div>
      <div class="item-card__info">
        <div class="item-card__name">${item.name}</div>
        <div class="item-card__tier" style="color:${tierColor}">${item.tier}-RANK ${item.type.toUpperCase()}</div>
      </div>
      <div class="item-card__buy">
        ${isEquipped ? `<span style="color:var(--cyan)">ACTIVE</span>` : 
          isBought ? `<span style="color:var(--emerald)">OWNED</span>` : 
          `<span style="color:var(--gold)">${item.cost} 💎</span>`}
      </div>
    </div>
  `;
}

function renderForge() {
  return `
    <div class="panel forge-panel" style="max-width: 600px; margin: 0 auto; padding: var(--space-xl)">
      <div style="text-align:center; margin-bottom:var(--space-xl)">
        <div style="font-size:48px; margin-bottom:var(--space-md)">⚒️</div>
        <h3 style="color:var(--gold); font-family:var(--font-display)">MONARCH'S FORGE</h3>
        <p style="font-size:var(--text-xs); color:var(--ash)">Construct a unique artifact for the System.</p>
      </div>

      <div style="display:flex; flex-direction:column; gap:var(--space-lg)">
        <div class="input-group">
          <label class="label">Artifact Name</label>
          <input type="text" id="forge-name" class="input" placeholder="e.g. Blade of Absolute Zero">
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:var(--space-md)">
          <div class="input-group">
            <label class="label">Tier</label>
            <select id="forge-tier" class="input">
              ${ITEM_TIERS.map(t => `<option value="${t}">${t}-Rank</option>`).join('')}
            </select>
          </div>
          <div class="input-group">
            <label class="label">Type</label>
            <select id="forge-type" class="input">
              <option value="weapon">Weapon</option>
              <option value="chest">Armor</option>
              <option value="accessory">Accessory</option>
            </select>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:var(--space-md)">
          <div class="input-group">
            <label class="label">Icon Type</label>
            <select id="forge-icon" class="input">
              <option value="sword">Sword</option>
              <option value="dagger">Dagger</option>
              <option value="scythe">Scythe</option>
              <option value="staff">Staff</option>
              <option value="bow">Bow</option>
              <option value="orb">Orb</option>
              <option value="chest">Chestplate</option>
              <option value="shield">Shield</option>
              <option value="ring">Ring</option>
              <option value="amulet">Amulet</option>
            </select>
          </div>
          <div class="input-group">
            <label class="label">Cost (💎)</label>
            <input type="number" id="forge-cost" class="input" value="1000">
          </div>
        </div>

        <div class="input-group">
          <label class="label">Base Stat (Bonus)</label>
          <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:var(--space-sm)">
            ${['str', 'agi', 'int', 'vit', 'sns', 'wil'].map(s => `
              <div style="display:flex; align-items:center; gap:4px">
                <span style="font-size:10px; color:var(--ash); width:24px">${s.toUpperCase()}</span>
                <input type="number" class="input forge-stat" data-stat="${s}" value="0" style="padding:4px">
              </div>
            `).join('')}
          </div>
        </div>

        <button id="btn-forge" class="btn btn--primary" style="margin-top:var(--space-lg)">FORGE ARTIFACT</button>
      </div>
    </div>
  `;
}

function attachStoreListeners(container) {
  // Tab switching
  container.querySelectorAll('.filter-tab').forEach(tab => {
    tab.onclick = () => {
      currentTab = tab.dataset.tab;
      renderStore(container);
    };
  });

  // Gacha
  container.querySelectorAll('.lootbox-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const boxId = btn.dataset.boxId;
      const res = openLootbox(boxId);
      if (res) {
        if (res.type === 'gear') showToast(`SYSTEM: Obtained ${res.value.name}`, "success");
        else showToast(`SYSTEM: Gained ${res.value} ${res.type.toUpperCase()}`, "success");
        renderStore(container);
      } else {
        showToast("Insufficient Essence Stones", "error");
      }
    };
  });

  // Buying / Equipping
  container.querySelectorAll('.item-card').forEach(card => {
    card.onclick = () => {
      const id = card.dataset.itemId;
      const isCustom = card.dataset.custom === 'true';
      handleItemInteraction(id, isCustom, container);
    };
  });

  // Forging
  const forgeBtn = container.querySelector('#btn-forge');
  if (forgeBtn) {
    forgeBtn.onclick = () => {
      const name = document.getElementById('forge-name').value;
      const tier = document.getElementById('forge-tier').value;
      const type = document.getElementById('forge-type').value;
      const iconType = document.getElementById('forge-icon').value;
      const cost = document.getElementById('forge-cost').value;
      
      const stats = {};
      container.querySelectorAll('.forge-stat').forEach(input => {
        const val = parseInt(input.value);
        if (val > 0) stats[input.dataset.stat] = val;
      });

      if (!name) { showToast("Artifact requires a name", "error"); return; }
      
      addCustomItem({ name, tier, type, iconType, cost, stats });
      showToast(`${name} has been forged`, "success");
      currentTab = 'vault';
      renderStore(container);
    };
  }
}

function handleItemInteraction(itemId, isCustom, container) {
  const inventory = gameState.get('inventory') || [];
  const instance = inventory.find(i => i.id === itemId);

  if (instance) {
    const res = equipItem(instance.instanceId);
    if (res.success) {
      showToast(`${instance.name} Equipped`, "success");
      renderStore(container);
    } else {
      showToast(res.error, "error");
    }
  } else {
    const res = buyItem(itemId, isCustom);
    if (res.success) {
      showToast(`Acquired ${res.item.name}`, "success");
      renderStore(container);
    } else {
      showToast(res.error, "error");
    }
  }
}

function getTierColor(tier) {
  const colors = { E: '#6B7280', D: '#60A5FA', C: '#00E5FF', B: '#A78BFA', A: '#C084FC', S: '#FF1744' };
  return colors[tier] || '#6B7280';
}
