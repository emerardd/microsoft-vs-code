import type { GameStats } from '../types';

export const formatNumber = (value: number): string => value.toLocaleString();

export const formatSensitivity = (value: number): string => `${value.toFixed(2)}x`;

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * The Problems panel mirrors the fight: every enemy still needed to ship the
 * current wave is a warning, and a live boss is the one error blocking release.
 */
export function getProblemCounts(stats: Pick<GameStats, 'bossActive' | 'levelProgress' | 'levelTarget'>): { errors: number; warnings: number } {
  if (stats.bossActive) return { errors: 1, warnings: 0 };
  return { errors: 0, warnings: Math.max(0, stats.levelTarget - stats.levelProgress) };
}
