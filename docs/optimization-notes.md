# Runtime and product improvements

## Runtime contracts

- `SimulationClock` runs all gameplay updates at 60 Hz. It accumulates render time, executes fixed steps and caps catch-up at 250 ms. Excess time is discarded for movement, shots, cooldowns, spawn timing and buffs together. A game-state transition interrupts catch-up immediately.
- Pausing does not advance simulation time or keep scheduling animation frames. A pause frame is redrawn only after state, language or viewport changes. An inactive game document cannot resume through global input. Key releases always clear held input, including after focus moves to an interactive control.
- Enemy and player projectiles are culled beyond all four playfield edges, with a 50-unit margin. Ricochet shots reflect at the side walls before culling. A piercing shot remembers distinct enemies it has hit.
- Diagonal input is normalized. Shields prevent contact damage and consume touching hostile bullets, including during other invulnerability frames. They do not damage enemies. Contact damage preserves weapon levels.
- Player death prevents subsequent projectile rewards or healing within the same combat step. Boss rewards cannot resurrect a player who already died that step.

## UI and diagnostics

`App.tsx` coordinates the workbench and game phases. Sidebar content, document views, bottom-panel content, status bar, overlays and run reports live in separate components. A per-App external statistics store updates subscribers at 10 Hz; App only updates for UI actions, phase changes and log changes. Settings and the static enemy database do not subscribe to changing statistics snapshots.

The former synthetic heap counter is replaced by actual entity and projectile counts. Frame interval is measured between render callbacks; simulation and Canvas command-submission CPU times are measured separately. These are neither memory measurements nor GPU timings. No universal frame-rate guarantee or hardware benchmark is claimed.

Run reports include simulated survival time, final damage source, the greatest cumulative damage source, maximum combo and upgrade history. Reports exclude paused time. Sensitivity and mute preferences use versioned local storage with validation and a session-only fallback when storage is unavailable.

## Build choices

- Piercing types: one extra distinct target per level, capped at two levels.
- Reflect API: one side-wall bounce, capped at one; adds diagonal projectiles for the base weapon.
- Buffer pressure: +25% damage per level when remaining ammo is at most 25%, capped at two.

These coexist with the five original upgrade choices. Capped choices are excluded from subsequent selections. Runs contain five waves and one final boss, with one opening and four between-wave choices. Tuning these new combinations still benefits from human playtesting.

## Extension checkpoint boundary

After the opening or between-wave upgrade is chosen, the wave starts with a clean battlefield. The extension saves player state, run statistics and permanent modifiers through the Webview state API. Data has an explicit version and is validated before use. A serializer restores an open game panel after a VS Code restart, and the game starts paused at the last completed checkpoint.

Mid-wave enemies, bullets, input state and particle effects are intentionally not serialized. Ordinary hide/reveal retains the live panel to preserve seamless switching. Starting a fresh run, dying or winning clears the checkpoint. Closing the tab is not an independent save-slot system. The browser test exercises the actual Webview entry point with a simulated VS Code state API; the native Extension Host test exercises real create/reveal/return commands. A full manual VS Code restart is a separate end-to-end check.

## Validation commands

```text
npm run verify
npm run test:e2e
npm run verify:extension
npm --prefix extension run test:integration
```

The browser suite uses installed Edge on Windows and downloaded Chromium in CI. The Vite test server runs in the test runner process so teardown does not depend on Windows process-tree termination. Screenshots are written to ignored `artifacts/qa/`; browser failure traces go to `test-results/`.

For an installed VS Code, set `VSCODE_EXECUTABLE_PATH` to its executable. `MACROHARD_TEST_TMPDIR` optionally selects the isolated test-profile parent directory. Cleanup checks that the resolved target remains beneath that parent and retries transient Windows file locks. The host tests may require execution outside a filesystem sandbox to clean up Electron profile files.

The checked-in GitHub Actions workflow runs web and extension jobs independently with read-only repository permissions. Remote CI results require a subsequent push; this change does not publish or deploy anything.

## Meta progression

See [gameplay direction](gameplay-direction.md) for confirmed milestones. Browser profiles use local storage; extension profiles use `ExtensionContext.globalState`. Per-run cumulative credit is monotonic, so checkpoint replay and repeated events cannot duplicate wave or win rewards. Checkpoint version 2 records the finite-run state and run ID. Version 1 checkpoints migrate to at most wave 5, retain their player stats and upgrade history, and receive a deterministic legacy ID. Active projectiles and pending choices are not restored.
