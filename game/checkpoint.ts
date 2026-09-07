import { UPGRADE_OPTIONS } from '../constants';
import { createInitialGameStats, createInitialPlayer } from '../utils/gameState';
import type { GameStats, Player } from '../types';
import type { RunModifiers } from './upgrades';

export interface Checkpoint {
  version: 1;
  player: Player;
  stats: GameStats;
  modifiers: RunModifiers;
}

export function createCheckpoint(player: Player, stats: GameStats, modifiers: RunModifiers): Checkpoint {
  return structuredClone({ version: 1, player, stats, modifiers });
}

/** Checkpoints are untrusted persisted data. Reject malformed or incompatible versions. */
export function parseCheckpoint(value: unknown): Checkpoint | null {
  if (!value || typeof value !== 'object') return null;
  const c = value as Partial<Checkpoint>;
  if (c.version !== 1 || !c.player || !c.stats || !c.modifiers) return null;
  const validShape = (sample: object, candidate: object): boolean => Object.entries(sample).every(([key, expected]) => {
    const actual = (candidate as Record<string, unknown>)[key];
    if (typeof expected === 'number') return typeof actual === 'number' && Number.isFinite(actual) && Math.abs(actual) < 1e12;
    return typeof actual === typeof expected && (typeof expected !== 'object' || actual !== null);
  });
  if (!validShape(createInitialPlayer(), c.player) || !validShape(createInitialGameStats(), c.stats)) return null;
  if (c.player.hp <= 0 || c.player.maxHp <= 0 || c.player.maxAmmo <= 0 || c.stats.wave < 1
    || !Number.isInteger(c.stats.wave) || c.stats.bossActive || c.stats.levelProgress !== 0) return null;
  if (![c.modifiers.fastGcLevel, c.modifiers.overclockLevel].every(n => Number.isInteger(n) && n >= 0 && n <= 3)) return null;
  if (![c.player.pierceLevel, c.player.ricochetLevel, c.player.lastStandLevel].every(n => n === undefined || (Number.isInteger(n) && n >= 0 && n <= 2))) return null;
  if (!Array.isArray(c.stats.pendingUpgrades) || c.stats.pendingUpgrades.length !== 0
    || !Array.isArray(c.stats.upgradeHistory) || c.stats.upgradeHistory.length > 10000
    || !c.stats.upgradeHistory.every(id => UPGRADE_OPTIONS.some(option => option.id === id))) return null;
  if (Array.isArray(c.stats.damageTaken) || !Object.values(c.stats.damageTaken).every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0)) return null;
  return createCheckpoint(c.player, c.stats, c.modifiers);
}
