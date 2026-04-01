# ARISE V3.0 — The Monarch's System

A hyper-gamified productivity platform heavily inspired by the global phenomenon *Solo Leveling*. ARISE transforms your tedious daily obligations into high-stakes dungeon raids complete with an extraction-gacha system, synchronized real-time multiplayer "Guild" mechanics, and atmospheric particle effects.

## ⚔️ Core Features
- **The System Matrix:** Completing tasks yields EXP, dynamically leveling you up from Rank E up to Rank S as you conquer more "Dungeons".
- **Attribute Growth:** Tasks are aligned to core stats (*Strength, Agility, Sense, Vitality, Intelligence, Willpower*). Building specific stats unlocks unique titles.
- **Shadow Extraction (Gacha):** Completing tasks earns Essence Stones. Spend stones to "Extract" Shadows in the Portal. Shadows have dynamic synergy buffs, rarities, and custom names.
- **Guild Synchronization (Multiplayer):** A built-in Firebase V9 real-time synchronization layer connects you to standard "Guilds", letting you assign Dungeons to party members (e.g. your wife) and watch them instantly update across Android, iOS, and PC.
- **The 2-Minute Penalty System:** If you mark a task as "I Can't", it triggers the dreaded 2-Minute Rule Timer. The screen cracks and pulses red; you must complete a micro-task within 2 minutes to survive the penalty zone.

## 📂 Architecture & Directory Structure
The application uses modern Vanilla **HTML/CSS/JS** bundled via **Vite**, keeping the footprint featherlight and hyper-performant.

```text
src/
├── engine/               # Core Game Logic & Mathematics
│   ├── ai.js             # Interfaces with Gemini API & Pollinations for dynamic generation
│   ├── attributes.js     # Stat calculation and Rank thresholds
│   ├── chainLink.js      # Combo multiplier tracking logic
│   ├── firebase.js       # Real-time Web Socket adapter for Firestore 'Guilds'
│   ├── gacha.js          # Shadow extraction loot tables and probability logic
│   ├── penalty.js        # Penalty survival mechanics
│   ├── questEngine.js    # Task CRUD operations
│   ├── rankSystem.js     # Unified EXP curve matrices
│   └── shadowNames.js    # 1,000+ unique lore-friendly names for newly extracted Shadows
├── state/                # State Management Layer
│   ├── gameState.js      # Custom reactive proxy handling saving/syncing
│   └── storage.js        # Hard-export and import JSON utilities
├── components/           # UI Elements & VFX
│   ├── effects/          # Visuals (ParticleWeather, Glitches, WebGL fragments)
│   ├── gacha/            # Portal extraction animations
│   ├── hud/              # The Attribute Radar Chart (Chart.js)
├── styles/               # Componentized CSS
│   └── tasks, hud, etc.  # The UI design system tokens
└── main.js               # The central View Router & Initialization orchestrator
```

## 🚀 Deployment & Installation
ARISE is incredibly lightweight since all game calculation is decoupled from the backend. The entire app can run perfectly in "Offline Mode" via `localStorage`, or online via `Firestore`.

### Local Development
1. Clone the repository.
2. Run `npm install` to grab Vite and Firebase.
3. Run `npm run dev` to start the live-reload server.

### Vercel Deployment (Production)
The easiest way to put this on the internet for your phone is via Vercel.
1. Open your terminal in this directory.
2. Run `npx vercel --prod`.
3. Follow the login prompts. Vercel will bundle the Vite project automatically and spit out your live production URL.
4. On your mobile phone, navigate to that URL and tap **"Add to Home Screen"** to trigger the fullscreen PWA mode.

## ⚙️ Setting up the "Guild System" (Firebase)
By default, the app stores your progress strictly on your device. To enable multiplayer assignment:
1. Open your running App and go to **Settings**.
2. Scroll to the bottom to **Guild Connection**.
3. Create a free Firebase Web project, enable **Firestore**, and paste its config `JSON` into the settings box.
4. Pick a *Guild ID* (e.g. `solo-team`).
5. Open the app on a second device, insert the exact same configuration and ID. You're linked!

*Arise.*
