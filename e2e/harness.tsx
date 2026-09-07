// Development-only fixtures; this entry is never included in production builds.
import { createRoot } from 'react-dom/client';
import { useRef, useState } from 'react';
import { useGameInput } from '../game/useGameInput';
import { GameState } from '../types';
import { getWaveTarget } from '../game/runPlan';
import { emptyProfile } from '../game/metaProgression';
import { createCheckpoint } from '../game/checkpoint';
import { createInitialGameStats, createInitialPlayer } from '../utils/gameState';
import GameOverlays from '../components/GameOverlays';
import '../index.css';

export function InputFixture() {
  const keys = useRef(new Set<string>());
  const [active, setActive] = useState(true);
  const [state, setState] = useState(GameState.PLAYING);
  const [pressed, setPressed] = useState('');
  useGameInput(keys, setState, active);
  return <>
    <button onClick={() => setPressed([...keys.current].join(','))}>Inspect keys</button>
    <button onClick={() => setActive(false)}>Hide game</button>
    <output data-testid="keys">{pressed}</output><output data-testid="phase">{GameState[state]}</output>
  </>;
}

if (new URLSearchParams(location.search).has('report')) {
  const stats = createInitialGameStats();
  Object.assign(stats, { score: 12500, wave: 4, wavesCleared: 3, outcome: 'defeat', maxCombo: 28, bugsFixed: 95, elapsedMs: 192000,
    deathCause: 'projectile:MONOLITH', damageTaken: { 'projectile:MONOLITH': 85, BUG: 20 }, upgradeHistory: ['PIERCE', 'RICOCHET', 'LAST_STAND'] });
  createRoot(document.getElementById('root')!).render(<GameOverlays lang="en" handleLangChange={() => {}} gameState={GameState.GAME_OVER} stats={stats} embedded={false} embeddedBrandName="" highScore={12500} newRecord movementSensitivity={1} startFreshRun={() => {}} handleSelectUpgrade={() => {}} />);
} else if (new URLSearchParams(location.search).has('input')) {
  createRoot(document.getElementById('root')!).render(<InputFixture />);
} else {
  const player = createInitialPlayer();
  player.damageMultiplier = 1000;
  player.maxHp = player.hp = 10000;
  player.shield = 10000;
  player.maxAmmo = player.ammo = 10000;
  const stats = createInitialGameStats(); stats.wave = 2; stats.wavesCleared = 1; stats.levelTarget = getWaveTarget(2);
  if (new URLSearchParams(location.search).has('final')) { stats.wave = 5; stats.wavesCleared = 4; stats.levelTarget = getWaveTarget(5); }
  if (new URLSearchParams(location.search).has('campaign')) {
    Math.random = () => 0.5;
    player.x = 350;
    stats.wave = 1; stats.wavesCleared = 0; stats.levelTarget = getWaveTarget(1);
  }
  const seed = { checkpoint: createCheckpoint(player, stats, { fastGcLevel: 0, overclockLevel: 0 }) };
  Object.assign(window, { acquireVsCodeApi: () => ({
    getState: () => JSON.parse(localStorage.getItem('test-webview-state') ?? JSON.stringify(seed)),
    setState: (value: unknown) => localStorage.setItem('test-webview-state', JSON.stringify(value)),
    postMessage: (message: { type: string; profile?: unknown; requestId?: string }) => {
      if (message.type === 'ready') window.postMessage({ type: 'profile-loaded', profile: JSON.parse(localStorage.getItem('test-profile') ?? JSON.stringify(emptyProfile())) }, '*');
      if (message.type === 'save-profile') {
        localStorage.setItem('test-profile', JSON.stringify(message.profile));
        window.postMessage({ type: 'profile-saved', requestId: message.requestId, ok: true }, '*');
      }
    },
  }) });
  void import('../extension/webview/index');
}
