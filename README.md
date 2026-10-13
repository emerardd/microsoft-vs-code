<div align="center">

<img src="./vscode.png" alt="VS Code" width="120" />

# 🎮 Microsoft VS Code: The Game

### MICROSOFT &nbsp;⚔️ VS ⚔️&nbsp; CODE

*An arcade shooter set inside your favorite code editor*

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**English** | [简体中文](./README.zh-CN.md)

<br/>

<a href="http://vscode.emerard.me/">
  <img src="https://img.shields.io/badge/▶️_PLAY_NOW-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white&labelColor=1f1f1f" height="72" alt="Play Now" />
</a>

<br/><br/>

![Gameplay Demo](./Gameplay.gif)

**[🕹️ How to play](#how-to-play)** • **[🧩 Extension](#vs-code-extension)** • **[💻 Development](#development)**

*"The VS was never short for Visual Studio. It means versus."*

</div>

An arcade shooter that takes the name literally: Microsoft, armed with a TypeScript compiler, fights the code itself. The whole game runs inside a recreated VS Code workbench — bugs, syntax errors and a legacy MONOLITH stand between you and shipping the release.

## How to play

| Input | Action |
|---|---|
| `WASD` / arrow keys | Move |
| `Space` | Shoot |
| `R` / `Shift` | Refactor ultimate (when the `R` bar is full) |
| `Esc` / `P` | Pause |

Touch devices get an on-screen D-pad, fire, refactor and pause buttons.

**A run** is five waves plus a final boss — about five minutes for a practiced player. Pick one upgrade before wave 1 and one after each of waves 1–4; each of those clears also grants +5 max HP, +2 ammo and +4% damage. Clear wave 5, then defeat MONOLITH to win. Upgrade menus pause the game.

<details>
<summary><b>Upgrades</b> (8)</summary>

| Upgrade | Effect |
|---|---|
| ⚡ Compiler Upgrade | Weapon level +1 (more projectiles, max 5) |
| ❤️ Heap Expansion | Max HP +12, heal 12 |
| 📦 Buffer Overflow | Magazine +5, restore 5 ammo |
| ⚙️ Fast GC | Reload 10% faster per stack (max 30%) |
| 🔥 Overclock CPU | Fire 8% faster per stack (max 24%) |
| ↟ Piercing types | Hit one more distinct enemy per level (max 2) |
| ↔ Reflect API | One side-wall bounce; adds diagonal shots (max 1) |
| ⚠ Buffer pressure | +25% damage per level at ≤25% ammo (max 2) |

</details>

<details>
<summary><b>Enemies</b> (9)</summary>

| Enemy | Symbol | HP | Points | Behavior |
|---|---|---|---|---|
| Bug | 🪲 | 10 | 100 | Slowly homes in |
| Syntax Error | `};` | 20 | 200 | Tanky, aimed shots |
| Spaghetti Code | `goto` | 15 | 150 | Fast and erratic |
| Memory Leak | `malloc()` | 40 | 300 | Grows larger and tougher, slows down |
| 404 Error | `404` | 15 | 250 | Ricochets, dashes at you |
| Merge Conflict | `<<<<` | 35 | 350 | Splits on death |
| Infinite Loop | `while(1)` | 25 | 400 | Spirals, four-way bursts |
| Race Condition | `async` | 20 | 500 | Teleports, then attacks |
| **MONOLITH** | `LegacyWrapper` | 600 | 5000 | Three-phase boss: minions, tracking and spread fire |

</details>

**Power-ups:** ☕ Coffee (speed) · 🤖 Copilot (+1 weapon level for 8 s) · 🐳 Docker (shield) · 🩹 Hotfix (+30 HP)

**Combos** build with kills (and every 5% of boss HP) and add capped score, damage, fire-rate and ultimate-charge bonuses.

**Between runs:** 5 cumulative waves unlock the Spread loadout, a first win unlocks Piercing, and every 5 waves add +2 permanent HP (max +10). Progress and the high score are stored locally.

## The workbench is the UI

Every VS Code panel shows something real about the run:

- **Explorer** — score, wave and release progress; open the enemy catalog or project metadata
- **Search** — enemy database
- **Source Control** — cleared waves as release history
- **Run and Debug** — frame time, entity counts, max combo
- **Extensions** — your installed upgrades and their live state
- **Settings** — movement sensitivity, sound, English / 中文
- **Problems / status bar** — warnings are the bugs left in this wave; a live boss is the one error blocking the release

## VS Code extension

`extension/` packages the game as **Macrohard vs Code** (巨硬大战代码), a self-contained Webview with no workspace or network access. `Ctrl+Alt+G` (`Cmd+Alt+G` on macOS) opens the game; the same shortcut pauses it and returns to your editor. A checkpoint is saved after each upgrade choice, so a VS Code restart resumes at the start of that wave.

```bash
npm --prefix extension install
npm run package:extension   # → artifacts/macrohard-vs-code-0.1.0.vsix
```

## Development

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev          # http://localhost:3000
npm run verify       # typecheck, lint, unit tests, build
npm run test:e2e     # Playwright (Edge on Windows; elsewhere: npx playwright install chromium && CI=1 npm run test:e2e)
npm run deploy       # verify, then publish dist/ to GitHub Pages
```

Extension checks: `npm run verify:extension` and `npm --prefix extension run test:integration` (set `VSCODE_EXECUTABLE_PATH` to reuse a local VS Code).

```
App.tsx          workbench shell: layout state and wiring
components/      workbench chrome (activity bar, sidebar, tabs, panels, status bar) and game overlays
game/            simulation: fixed 60 Hz clock, player, enemies, combat, progression, rendering
utils/           i18n, brand names, audio synthesis, settings, formatting
constants.ts     enemy, power-up and upgrade data
extension/       VS Code extension host and Webview entry
```

Gameplay logic in `game/` is pure and unit-tested; React only owns the workbench. Workbench colors are Tailwind tokens (`vsc-*`, `syntax-*`) in `tailwind.config.js`. Runtime contracts and design decisions live in [docs/optimization-notes.md](docs/optimization-notes.md) and [docs/gameplay-direction.md](docs/gameplay-direction.md).

## License

[MIT](LICENSE). Not affiliated with Microsoft; dedicated to every bug we've fought in real life 🪲
