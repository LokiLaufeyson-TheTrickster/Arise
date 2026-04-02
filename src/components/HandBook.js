// ============================================
// ARISE V4.0 — Hunter's Handbook
// System tutorials and documentation
// ============================================

export function showHandBook() {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.id = 'handbook-modal';

  backdrop.innerHTML = `
    <div class="modal system-handbook" style="max-width: 500px; padding: var(--space-xl)">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-lg)">
        <h2 style="color:var(--cyan); font-family:var(--font-display); text-transform:uppercase; letter-spacing:0.1em; font-size:var(--text-xl)">The Monarch's Guide [V4.0]</h2>
        <button id="close-handbook" style="background:transparent; color:var(--ash); font-size:24px;">&times;</button>
      </div>

      <div class="handbook-content" style="max-height: 70vh; overflow-y:auto; padding-right:var(--space-md)">
        <section style="margin-bottom: var(--space-xl)">
          <h3 style="color:var(--purple); font-size:var(--text-sm); text-transform:uppercase; margin-bottom:var(--space-md); border-bottom:1px solid var(--purple-dim); padding-bottom:4px">Survival Core (HP/MP)</h3>
          <div style="display:flex; flex-direction:column; gap:var(--space-md)">
            <p style="font-size:var(--text-xs); line-height:1.6">
              <strong style="color:var(--white)">Vitality (HP):</strong> Your life force. Failing a Penalty Quest or a Trial drains your HP. If it reaches zero, the System will force a <span style="color:var(--crimson)">Hard Reset</span>.
            </p>
            <p style="font-size:var(--text-xs); line-height:1.6">
              <strong style="color:var(--white)">Mana (MP):</strong> Used to power the System. Tasks and actions consume MP. If you run out, performance suffers.
            </p>
            <p style="font-size:var(--text-xs); line-height:1.6">
              <strong style="color:var(--white)">Mana Charge:</strong> In the HUD, hold the <span style="color:var(--cyan)">Mana Charge</span> action to restore MP. During this ritual, there is a chance to mine <span style="color:var(--gold)">Essence Stones</span> from the void.
            </p>
          </div>
        </section>

        <section style="margin-bottom: var(--space-xl)">
          <h3 style="color:var(--purple); font-size:var(--text-sm); text-transform:uppercase; margin-bottom:var(--space-md); border-bottom:1px solid var(--purple-dim); padding-bottom:4px">Trial of the Monarch</h3>
          <p style="font-size:var(--text-xs); line-height:1.6; margin-bottom:var(--space-sm)">
            Deleting a quest is no longer simple. The System will judge your conviction.
          </p>
          <ul style="list-style:none; font-size:var(--text-xs); display:flex; flex-direction:column; gap:4px">
            <li>⚖️ <span style="color:var(--white)">AI JUDGMENT:</span> State your reason for giving up. If deemed unworthy, you lose HP.</li>
            <li>⚔️ <span style="color:var(--white)">SYSTEM OVERRIDE:</span> If judged a failure, you have 2 minutes to complete the quest anyway. Succeeding clears the failure and grants **Double EXP**.</li>
          </ul>
        </section>

        <section style="margin-bottom: var(--space-xl)">
          <h3 style="color:var(--purple); font-size:var(--text-sm); text-transform:uppercase; margin-bottom:var(--space-md); border-bottom:1px solid var(--purple-dim); padding-bottom:4px">The Vault & Forging</h3>
          <p style="font-size:var(--text-xs); line-height:1.6">
            <strong style="color:var(--white)">SVG Equipment:</strong> Items are now ranked E through S. All gear uses high-fidelity SVG icons with rank-specific glows.
          </p>
          <p style="font-size:var(--text-xs); line-height:1.6; margin-top:var(--space-sm)">
            <strong style="color:var(--white)">Custom Shop:</strong> Handlers and Monarchs can now forge custom legendary items in the Store. Define the stats, name, and icon yourself.
          </p>
        </section>

        <section>
          <h3 style="color:var(--purple); font-size:var(--text-sm); text-transform:uppercase; margin-bottom:var(--space-md); border-bottom:1px solid var(--purple-dim); padding-bottom:4px">Attribute Matrix</h3>
          <div style="display:flex; flex-direction:column; gap:var(--space-md)">
            <p style="font-size:var(--text-xs); line-height:1.6">
              <strong style="color:var(--white)">STR:</strong> Boosts task rewards. • <strong style="color:var(--white)">AGI:</strong> Extends Chain window. • <strong style="color:var(--white)">INT:</strong> Boosts focus XP.
            </p>
            <p style="font-size:var(--text-xs); line-height:1.6">
              <strong style="color:var(--white)">VIT:</strong> Reduces Penalty time. • <strong style="color:var(--white)">SNS:</strong> Boosts Shadow Extraction. • <strong style="color:var(--white)">WIL:</strong> Stabilizes Loot quality.
            </p>
          </div>
        </section>
      </div>

      <button id="understood-handbook" class="btn btn--primary" style="width:100%; margin-top:var(--space-xl)">ACKNOWLEDGE SYSTEM</button>
    </div>
  `;

  document.getElementById('app').appendChild(backdrop);

  const close = () => {
    backdrop.classList.add('fade-out');
    setTimeout(() => backdrop.remove(), 200);
  };

  document.getElementById('close-handbook').onclick = close;
  document.getElementById('understood-handbook').onclick = close;
  backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
}
