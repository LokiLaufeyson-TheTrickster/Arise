// ============================================
// ARISE V3.0 — Hunter's Handbook
// System tutorials and documentation
// ============================================

export function showHandBook() {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.id = 'handbook-modal';

  backdrop.innerHTML = `
    <div class="modal system-handbook" style="max-width: 500px; padding: var(--space-xl)">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-lg)">
        <h2 style="color:var(--cyan); font-family:var(--font-display); text-transform:uppercase; letter-spacing:0.1em; font-size:var(--text-xl)">Hunter's Handbook</h2>
        <button id="close-handbook" style="background:transparent; color:var(--ash); font-size:24px;">&times;</button>
      </div>

      <div class="handbook-content" style="max-height: 70vh; overflow-y:auto; padding-right:var(--space-md)">
        <section style="margin-bottom: var(--space-xl)">
          <h3 style="color:var(--purple); font-size:var(--text-sm); text-transform:uppercase; margin-bottom:var(--space-md); border-bottom:1px solid var(--purple-dim); padding-bottom:4px">Attribute Matrix</h3>
          <div style="display:flex; flex-direction:column; gap:var(--space-md)">
            <p style="font-size:var(--text-xs); line-height:1.6">
              <strong style="color:var(--white)">STR (Strength):</strong> Increases base points gained after clearing a dungeon. Higher strength makes every task more rewarding.
            </p>
            <p style="font-size:var(--text-xs); line-height:1.6">
              <strong style="color:var(--white)">AGI (Agility):</strong> Extends your <span style="color:var(--cyan)">Chain-Link</span> window. Higher Agility gives you more time between tasks to maintain your multiplier.
            </p>
            <p style="font-size:var(--text-xs); line-height:1.6">
              <strong style="color:var(--white)">INT (Intelligence):</strong> Multiplies concentration/focus rewards. Essential for high-XP "Study" dungeons.
            </p>
            <p style="font-size:var(--text-xs); line-height:1.6">
              <strong style="color:var(--white)">VIT (Vitality):</strong> Reduces Penalty durations. At Rank B and above, physical recovery is significantly faster.
            </p>
            <p style="font-size:var(--text-xs); line-height:1.6">
              <strong style="color:var(--white)">SNS (Sense):</strong> Increases <span style="color:var(--gold)">Hidden Quest</span> detection and the quality of shadow extraction.
            </p>
            <p style="font-size:var(--text-xs); line-height:1.6">
              <strong style="color:var(--white)">WIL (Willpower):</strong> Shifts the "Loot Floor". Higher Willpower prevents finding common-grade shadows and stabilizes rare drops.
            </p>
          </div>
        </section>

        <section style="margin-bottom: var(--space-xl)">
          <h3 style="color:var(--purple); font-size:var(--text-sm); text-transform:uppercase; margin-bottom:var(--space-md); border-bottom:1px solid var(--purple-dim); padding-bottom:4px">Quest Core Logic</h3>
          <p style="font-size:var(--text-xs); line-height:1.6; margin-bottom:var(--space-sm)">
            The System automatically assigns attributes based on the dungeon type you create:
          </p>
          <ul style="list-style:none; font-size:var(--text-xs); display:flex; flex-direction:column; gap:4px">
            <li>💼 <span style="color:var(--white)">PROFESSIONAL:</span> Strength + Intelligence</li>
            <li>🏋️‍♀️ <span style="color:var(--white)">FITNESS:</span> Strength + Vitality</li>
            <li>📚 <span style="color:var(--white)">LEARNING:</span> Intelligence + Sense</li>
            <li>👑 <span style="color:var(--white)">PERSONAL:</span> Agility + Willpower</li>
          </ul>
        </section>

        <section style="margin-bottom: var(--space-xl)">
          <h3 style="color:var(--purple); font-size:var(--text-sm); text-transform:uppercase; margin-bottom:var(--space-md); border-bottom:1px solid var(--purple-dim); padding-bottom:4px">Shadow Enhancement</h3>
          <p style="font-size:var(--text-xs); line-height:1.6">
            Equipping shadows provides a **FLAT BONUS** to your attribute values. Shadows of the <span style="color:var(--cyan)">Knight-Grade</span> or higher provide significantly larger power increases. 
          </p>
          <p style="font-size:var(--text-xs); line-height:1.6; margin-top:var(--space-sm); color:var(--ash)">
            Note: You must have common infantry or high-grade shadows *Equipped* in your Roster to receive their blessings.
          </p>
        </section>

        <section>
          <h3 style="color:var(--purple); font-size:var(--text-sm); text-transform:uppercase; margin-bottom:var(--space-md); border-bottom:1px solid var(--purple-dim); padding-bottom:4px">Penalty Protocol</h3>
          <p style="font-size:var(--text-xs); line-height:1.6">
            If your <span style="color:var(--cyan)">Chain-Link</span> expires or you delete an active quest, you may trigger a **Penalty Quest**. Penalties lock major UI features until they are cleared (either by time or ritual completion).
          </p>
        </section>
      </div>

      <button id="understood-handbook" class="btn btn-primary btn-full" style="margin-top:var(--space-xl)">Understood</button>
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
