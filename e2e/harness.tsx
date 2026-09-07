// Development-only fixtures; this entry is never included in production builds.
import { createRoot } from 'react-dom/client';
import { useRef, useState } from 'react';
import { useGameInput } from '../game/useGameInput';
import { GameState } from '../types';
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
  Object.assign(stats, { score: 12500, wave: 4, maxCombo: 28, bugsFixed: 95, elapsedMs: 192000,
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
  const stats = createInitialGameStats(); stats.wave = 2;
  const seed = { checkpoint: createCheckpoint(player, stats, { fastGcLevel: 0, overclockLevel: 0 }) };
  Object.assign(window, { acquireVsCodeApi: () => ({
    getState: () => JSON.parse(localStorage.getItem('test-webview-state') ?? JSON.stringify(seed)),
    setState: (value: unknown) => localStorage.setItem('test-webview-state', JSON.stringify(value)),
    postMessage: () => {},
  }) });
  void import('../extension/webview/index');
}
