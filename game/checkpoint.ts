import { MAX_RICOCHET_LEVEL, UPGRADE_OPTIONS } from '../constants';
import { createInitialGameStats, createInitialPlayer } from '../utils/gameState';
import type { GameStats, Player } from '../types';
import type { RunModifiers } from './upgrades';
import { getWaveTarget, RUN_WAVES } from './runPlan';

export interface Checkpoint {
  version: 2;
  player: Player;
  stats: GameStats;
  modifiers: RunModifiers;
}

export function createCheckpoint(player: Player, stats: GameStats, modifiers: RunModifiers): Checkpoint {
  return structuredClone({ version: 2,
    player: { ...player, fireCadenceRemainderMs: 0, wasFiring: false }, stats, modifiers });
}

/** Checkpoints are untrusted persisted data. Reject malformed or incompatible versions. */
export function parseCheckpoint(value: unknown): Checkpoint | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<Omit<Checkpoint, 'version'>> & { version?: number };
  if (![1, 2].includes(raw.version ?? 0) || !raw.player || !raw.stats || !raw.modifiers) return null;
  const c = structuredClone(raw) as Checkpoint;
  if (!Number.isInteger(c.stats.wave) || c.stats.wave < 1) return null;
  if (raw.version === 1) {
    const serialized = JSON.stringify(raw);
    let hash = 2166136261;
    for (const char of serialized) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    c.stats.runId = `legacy-${(hash >>> 0).toString(16)}-${serialized.length}`;
    c.stats.wave = Math.min(RUN_WAVES, c.stats.wave);
    c.stats.wavesCleared = c.stats.wave - 1;
    c.stats.outcome = 'active';
    c.stats.levelTarget = getWaveTarget(c.stats.wave);
  }
  const validShape = (sample: object, candidate: object): boolean => Object.entries(sample).every(([key, expected]) => {
    const actual = (candidate as Record<string, unknown>)[key];
    if (typeof expected === 'number') return typeof actual === 'number' && Number.isFinite(actual) && Math.abs(actual) < 1e12;
    return typeof actual === typeof expected && (typeof expected !== 'object' || actual !== null);
  });
  if (!validShape(createInitialPlayer(), c.player) || !validShape(createInitialGameStats(), c.stats)) return null;
  if (c.player.hp <= 0 || c.player.maxHp <= 0 || c.player.maxAmmo <= 0 || c.stats.wave < 1
    || !Number.isInteger(c.stats.wave) || c.stats.wave > RUN_WAVES || c.stats.bossActive || c.stats.levelProgress !== 0
    || c.stats.outcome !== 'active' || !/^[a-zA-Z0-9-]{1,100}$/.test(c.stats.runId)
    || ['constructor', 'prototype', '__proto__'].includes(c.stats.runId)
    || c.stats.levelTarget !== getWaveTarget(c.stats.wave)
    || c.stats.wavesCleared !== c.stats.wave - 1) return null;
  if (![c.modifiers.fastGcLevel, c.modifiers.overclockLevel].every(n => Number.isInteger(n) && n >= 0 && n <= 3)) return null;
  if (![c.player.pierceLevel, c.player.ricochetLevel, c.player.lastStandLevel].every(n => n === undefined || (Number.isInteger(n) && n >= 0 && n <= 2))) return null;
  if (!Array.isArray(c.stats.pendingUpgrades) || c.stats.pendingUpgrades.length !== 0
    || !Array.isArray(c.stats.upgradeHistory) || c.stats.upgradeHistory.length > 10000
    || !c.stats.upgradeHistory.every(id => UPGRADE_OPTIONS.some(option => option.id === id))) return null;
  if (Array.isArray(c.stats.damageTaken) || !Object.values(c.stats.damageTaken).every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0)) return null;
  const checkpoint = createCheckpoint(c.player, c.stats, c.modifiers);
  // Accept old level-two saves, preserving historical choices while applying the current cap.
  if (checkpoint.player.ricochetLevel !== undefined) {
    checkpoint.player.ricochetLevel = Math.min(MAX_RICOCHET_LEVEL, checkpoint.player.ricochetLevel);
  }
  return checkpoint;
}
