<div align="center">

# 🎮 Microsoft VS Code: The Game

### *An Arcade Shooter Set Inside Your Favorite Code Editor*

<img src="./vscode.png" alt="VS Code" />

**English** | [简体中文](./README.zh-CN.md)

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.1.5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)


<a href="http://vscode.emerard.me/">
  <img src="https://img.shields.io/badge/▶️_Play_Now-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white&labelColor=1f1f1f" height="50" />
</a>

<br/>

![Gameplay Demo](./Gameplay.gif)

**[📖 Documentation](#game-mechanics)** • **[🎯 Features](#features)** • **[💻 Development](#development)**

---

*"What if debugging was an actual battle?"*

Transform your coding workflow into an epic arcade shooter! Deploy your project by defeating bugs, syntax errors, and the dreaded legacy code monoliths. Each wave brings new challenges as you refactor your way to version 1.0... and beyond.

</div>

---

## 🎯 Features

### 🕹️ **Authentic VS Code Experience**
- **Pixel-Perfect UI**: Lovingly recreated VS Code interface with activity bar, sidebar, editor tabs, terminal, and status bar
- **Interactive Sidebars**:
  - 📁 **Explorer** - View project stats and release progress
  - 🔍 **Search** - Browse enemy database with detailed info
  - 🌿 **Git** - Track your commit history through waves
  - 🐛 **Debug** - Monitor performance metrics, combos, and high score
  - 🧩 **Extensions** - Check your installed power-ups and upgrades
  - ⚙️ **Settings** - Tune movement sensitivity and toggle sound

### ⚔️ **Intense Gameplay**
- **9 Unique Enemy Types**: From basic bugs 🪲 to merge conflicts ⚠️ to the terrifying MONOLITH boss
- **Three-Phase Boss**: Monolith opens with a reinforcement squad, then escalates its minion budget, tracking shots, spread fire, movement, and five-way final-phase burst across later releases
- **Progressive Difficulty**: Enemy health, speed, rewards, roster, and attacks scale across waves; ambient spawns use a smoother cadence with an on-screen cap while every clear grants modest baseline player growth
- **Combo System**: Combos decay one stack at a time, gain one stack per 5% Boss health dealt, and grant capped score, damage, fire-rate, and ultimate-charge bonuses
- **Local High Score**: Best run is saved to your browser and shown on the start screen and game-over screen
- **Power-Ups**:
  - ☕ **Coffee** - Speed boost
  - 🤖 **GitHub Copilot** - Temporary +1 weapon tier for 8 seconds
  - 🐳 **Docker** - Temporary shield
  - 🩹 **Hotfix** - Restore 30 HP

### 📦 **Wave Upgrade System**
Choose one upgrade before wave one, then one after each of the first four waves. Those four clears also grant +5 max HP, +2 ammo, and +4% base damage for the current run:

| Upgrade | Effect |
|---------|--------|
| ⚡ Compiler Upgrade | TypeScript compiler +1 level (more projectiles) |
| ❤️ Heap Expansion | Max HP +12 and restore 12 HP |
| 📦 Buffer Overflow | Magazine size +5 and restore 5 ammo |
| ⚙️ Fast GC | Reload 10% faster per stack (max 30%) |
| 🔥 Overclock CPU | Fire 8% faster per stack (max 24%) |

### 🎨 **Polished Mechanics**
- **Advanced Weapon System**:
  - Ammo management with auto-reload
  - TypeScript Compiler upgrades (up to level 5)
  - Ultimate "Refactor" ability (Press R/Shift)
- **WebAudio Sound Effects**: Synthesised SFX for shooting, hits, explosions, power-ups, heals, Boss appearance, Refactor ultimate, and wave clear — with a mutable toggle in the status bar and Settings panel
- **Visual Effects**:
  - Particle explosions on enemy destruction
  - Floating damage numbers
  - Hit flash feedback
  - Animated combo meter
- **Readable Combat HUD**:
  - Compact player HP/max display integrated into the canvas HUD
  - Persistent `R` Refactor charge bar with percentage readout and a high-contrast ready state
  - Boss health bar with distinct Phase 2 and Phase 3 warning labels
- **Unified game clock**: movement, shooting, reloads, buffs, enemies and collisions use a fixed 60 Hz simulation. Catch-up is capped at 250 ms per rendered frame; longer stalls discard excess time consistently. Diagonal movement is normalized. Shields block contact and consume touching hostile bullets without damaging enemies; contact damage never removes weapon levels.

---

### Builds and run reports

- **Piercing types**: hit one additional distinct enemy per level, up to 2 levels; each bullet damages an enemy only once.
- **Reflect API**: one side-wall bounce, capped at 1 level; also adds diagonal shots to the base weapon.
- **Buffer pressure**: gain 25% damage per level at 25% ammo or less, up to 2 levels.
- Run reports show survival time, the fatal damage source, the largest damage source and the upgrade route.
- Sensitivity and mute preferences persist; the settings slider supports keyboard input.
- Diagnostics show actual entity/projectile counts, frame interval, simulation CPU time and Canvas submission CPU time (not GPU time).

## 🎮 Game Mechanics

### Controls
```
WASD       → Move your player
SPACE      → Shoot TypeScript bullets
SHIFT / R  → Refactor Ultimate (when charged)
ESC / P    → Pause game
```

On touch devices, the game area shows directional, fire, and refactor controls. Activity-bar buttons open a dismissible mobile sidebar.

### Accessibility / Tuning
- Open the **Settings** sidebar from the gear icon in the activity bar
- Adjust **Movement Sensitivity** from `0.5x` to `2.0x`
- Toggle **Sound Effects** on/off — or click the 🔔 icon in the status bar
- Slider focus is automatically released after dragging so keyboard control returns to gameplay

### Objective
Complete **five waves and one final Boss**. A practiced run targets approximately five minutes; there is no hard timer. Choose a starting upgrade, clear waves 1–4 with another choice after each, then clear wave 5 and defeat the final Boss to win. Upgrade menus pause the simulation.

### Between-run progression

- Clear 5 waves cumulatively to unlock the level-2 spread loadout.
- Win once to unlock the level-1 weapon with Piercing level 1.
- Every 5 cumulative waves grants +2 permanent HP, capped at +10. Choose one starting loadout; bonuses apply on the next run.
- Progress is saved after wave clears. Replaying the same checkpoint does not duplicate credit. The browser uses local storage; the extension uses its global profile storage, independently of the game panel. These are separate local profiles, without cross-device sync.
- The current kill targets (15/20/25/30/35) and combat scaling are retained for initial playtesting. The five-minute target is not yet a measured human-playtest result.

### Enemy Roster

| Enemy | Symbol | HP | Points | Behavior |
|-------|--------|----|----|----------|
| **Bug** | 🪲 | 10 | 100 | Gradually homes toward the player |
| **Syntax Error** | `};` | 20 | 200 | Tanky ranged enemy with aimed shots |
| **Spaghetti Code** | `goto` | 15 | 150 | Fast and erratic |
| **Memory Leak** | `malloc()` | 40 | 300 | Grows in size and health while slowing down |
| **404 Error** | `404` | 15 | 250 | Ricochets and periodically dashes toward the player |
| **Merge Conflict** | `<<<<` | 35 | 350 | Splits into smaller enemies on death |
| **Infinite Loop** | `while(1)` | 25 | 400 | Spiral movement with four-way projectile bursts |
| **Race Condition** | `async` | 20 | 500 | Teleports and attacks from its new position |
| **MONOLITH** 👹 | `LegacyWrapper` | 600 | 5000 | Three-phase Boss with scaling tracking fire, spread bursts, and minions |

### Progression System
- **Weapon Levels**: Compiler Upgrade permanently raises the weapon tier (max 5); Copilot only grants a temporary +1 tier for 8 seconds
- **Ammo System**: 40 bullets max (expandable), auto-regenerates slowly, reload time 2.5s (reducible)
- **Special Meter**: The visible `R` bar charges from regular defeats and switches to a pulsing ready state before unleashing "Refactor"; enemies cleared by the ultimate do not recharge it
- **Wave System**: Difficulty scales each version release (v1.0, v2.0, v3.0…)
- **High Score**: Persisted locally via `localStorage`, displayed on start and game-over screens

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (20.19+ on the 20.x line, or 22.12+)
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone https://github.com/emerardd/microsoft-vs-code.git
cd microsoft-vs-code

# Install dependencies
npm install

# Start development server
npm run dev
```

The game will open at `http://localhost:3000` 🎮

### Build for Production

```bash
# Build optimized version
npm run build

# Run type checking, lint, tests, and the production build
npm run verify

# Preview production build
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

---

## 💻 Development

### Project Structure

```
microsoft-vs-code/
├── components/
│   ├── GameEngine.tsx      # Frame and runtime orchestration
│   └── TouchControls.tsx   # Mobile touch keycaps
├── game/
│   ├── advanceEntities.ts  # Projectile and transient-entity advancement
│   ├── canvasViewport.ts   # Responsive high-DPI Canvas sizing
│   ├── combat.ts           # Collision effects and damage resolution
│   ├── collision.ts        # Shared collision primitives
│   ├── combo.ts            # Combo decay and bonus curves
│   ├── contentSelection.ts # Enemy, upgrade, and power-up selection
│   ├── entityFactory.ts    # Enemy, projectile, and effect construction
│   ├── minimap.ts          # Full-height world-position telemetry
│   ├── playerSystem.ts     # Movement, timers, reload, and shooting
│   ├── progression.ts      # Score, combo, wave, and defeat rewards
│   ├── refactorUltimate.ts # Refactor ultimate ability
│   ├── renderScene.ts      # Canvas scene renderer
│   ├── spawnDirector.ts    # Ambient and Boss reinforcement pacing
│   ├── updateEnemy.ts      # Enemy and boss behavior updates
│   ├── upgrades.ts         # Wave-upgrade effects
│   └── useGameInput.ts     # Keyboard input lifecycle
├── utils/
│   ├── audio.ts            # WebAudio synthesised SFX engine
│   ├── gameLogic.ts        # Tested timing, damage, and input logic
│   ├── gameState.ts        # Player and stats state factories
│   └── i18n.ts             # EN/ZH strings and language persistence
├── App.tsx                 # VS Code UI shell, sidebars, overlays
├── types.ts                # TypeScript interfaces for game entities
├── constants.ts            # Game configuration, enemy data, upgrade options
├── index.css               # Local Tailwind entry and accessibility styles
├── index.tsx               # React entry point
├── index.html              # HTML template
└── vscode.png              # VS Code logo asset
```

### Tech Stack

- **React 19.2** - UI framework
- **TypeScript 5.8** - Type safety
- **Vite 8.1** - Build tool and dev server
- **HTML5 Canvas** - Game rendering
- **Web Audio API** - Procedural sound effects
- **CSS3 / Tailwind 3** - Locally compiled VS Code styling with no runtime CDN
- **Vitest / ESLint** - Pure game-logic tests and static quality gates

### Key Components

#### `GameEngine.tsx`
Coordinates the game runtime:
- Time-scaled game loop for frame-rate independent gameplay
- Mutable entity state and `requestAnimationFrame` lifecycle
- Spawn, combat, progression, and upgrade coordination
- Delegates input, collisions, enemy behaviour, and drawing to focused modules
- Wave upgrade trigger → `GameState.UPGRADE`

#### `game/` modules
- `useGameInput.ts` owns keyboard listener setup, cleanup, and pause handling
- `entityFactory.ts` creates enemies, bosses, projectiles, power-ups, and effects
- `advanceEntities.ts` advances projectiles, particles, and floating text
- `canvasViewport.ts` keeps Canvas text sharp across display pixel densities
- `minimap.ts` projects the complete playable area into the reserved telemetry rail
- `combat.ts` resolves contact, projectile damage, pickups, and entity cleanup
- `playerSystem.ts` owns movement, status timers, ammo, reload, and shooting
- `progression.ts` owns defeat rewards, combos, boss completion; `runPlan.ts` controls finite waves and upgrade eligibility
- `refactorUltimate.ts` owns activation and damage for the ultimate ability
- `upgrades.ts` applies selected wave upgrades and permanent run modifiers
- `updateEnemy.ts` owns enemy movement, special behaviour, and boss phases
- `collision.ts` provides shared collision primitives
- `contentSelection.ts` owns weighted random content selection
- `renderScene.ts` owns Canvas drawing and visual effects

#### `App.tsx`
Handles the VS Code interface:
- Activity bar navigation
- Dynamic sidebar views (Explorer, Search, Git, Debug, Extensions, Settings)
- Wave upgrade overlay (three-choice card UI)
- High score persistence via `localStorage`
- Terminal log display
- Start / game-over screens
- Sound toggle

#### `utils/audio.ts`
Lightweight procedural audio:
- No external files — all sounds synthesised with `OscillatorNode` and white noise
- Global mute toggle
- Functions: `sfxShoot`, `sfxHit`, `sfxExplosion`, `sfxPowerUp`, `sfxHeal`, `sfxBossAppear`, `sfxUltimate`, `sfxPlayerHit`, `sfxWaveClear`

---

## 🧩 VS Code Extension

The `extension/` package builds the game as **Macrohard vs Code** (Simplified Chinese: **巨硬大战代码**), a self-contained Webview extension with no workspace or network access. Press `Ctrl+Alt+G` (`Cmd+Alt+G` on macOS) to open the game, then use the same shortcut to pause and return to the previously active editor. The hidden Webview is retained so the current run resumes instead of restarting.

```bash
# Install extension-only build and packaging dependencies
npm --prefix extension install

# Unit tests, Webview build, extension-host typecheck/build, and package inventory
npm run verify:extension

# Create artifacts/macrohard-vs-code-0.1.0.vsix
npm run package:extension
```

The isolated Extension Development Host test is available through `npm --prefix extension run test:integration`. Set `VSCODE_EXECUTABLE_PATH` to a local VS Code executable to avoid downloading another copy.

---

## 🎨 Customization

### Modify Enemy Difficulty

Edit `constants.ts`:

```typescript
export const ENEMY_TYPES = [
  {
    type: 'BUG',
    text: '🪲',
    hp: 10,        // Increase for tankier bugs
    score: 100,    // Adjust point values
    speed: 1.5,    // Higher = faster
    color: '#f14c4c',
    width: 24,
    desc: '普通Bug，数量众多'
  },
  // Add your own enemies!
]
```

### Adjust Game Balance

```typescript
// constants.ts
export const PLAYER_SPEED = 5;             // Movement speed
export const MAX_AMMO = 40;                // Ammo capacity
export const AMMO_REGEN = 0.4;             // Regen per frame
export const SPECIAL_CHARGE_PER_KILL = 5;  // Ultimate charge rate
```

### Add New Upgrades

```typescript
// constants.ts
export const UPGRADE_OPTIONS = [
  {
    id: 'MY_UPGRADE',
    icon: '🔥'
  }
]
```

Adding an enemy requires more than its config: extend `EnemyType` in `types.ts`, add EN/ZH strings for its `descKey`, include it in the wave spawn distribution in `game/contentSelection.ts`, implement any special AI in `game/updateEnemy.ts`, and finish with `npm run verify`.

Then complete all four integration points:

1. Add `'MY_UPGRADE'` to the `UpgradeId` union in `types.ts`.
2. Add `upg_MY_UPGRADE_title` and `upg_MY_UPGRADE_desc` to both language maps in `utils/i18n.ts`.
3. Handle the effect in the `applyUpgrade` switch inside `game/upgrades.ts`:

```typescript
case 'MY_UPGRADE':
  // Your custom logic here
  break;
```

4. Add a test for the effect and run `npm run verify`.

---

## 🐛 Known Issues

- [ ] Hitboxes may need fine-tuning for pixel-perfect collision
- [ ] Performance can drop on some machines with 200+ entities

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

Please ensure:
- Code follows TypeScript best practices
- Game mechanics are balanced and fun
- UI changes respect VS Code's design language

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Microsoft VS Code Team** - For creating the amazing editor that inspired this
- **TypeScript** - For making JavaScript development bearable
- **React & Vite** - For the smooth development experience
- **All the bugs** we've fought in real life - this game is dedicated to you 🪲

---

<div align="center">

### 🎮 Ready to Debug?

**[Start Playing Now!](http://vscode.emerard.me/)**

Made with ❤️ by developers, for developers

*"Ship code, not bugs!"*

---

⭐ **Star this repo** if you enjoy the game! | 🐛 **Report bugs** in Issues | 💬 **Share** with fellow devs

</div>

### Automated verification

```bash
npm run verify
npm run test:e2e
npm run verify:extension
```

Browser tests use installed Edge on Windows and Chromium in CI. On other platforms, run `npx playwright install chromium`, then `CI=1 npm run test:e2e`. The test server starts and stops in-process; screenshots go to ignored `artifacts/qa/`. CI covers the web game, extension package checks and isolated Extension Host integration tests.

The extension saves the next wave checkpoint after an upgrade is chosen. Reloading or restarting with the game tab restored opens that wave paused. Mid-wave enemies and bullets are not serialized. Starting a new run, dying, or winning clears the checkpoint; unlocked progression remains. Ordinary hide/reveal keeps the current live run. See [optimization notes](docs/optimization-notes.md).
