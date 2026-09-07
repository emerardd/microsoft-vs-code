import type { GameStats, Player, UpgradeId } from '../types';
import { MAX_RICOCHET_LEVEL } from '../constants';
import type { RunModifiers } from './upgrades';

export const RUN_WAVES = 5;

// Keep the existing kill targets while the finite-run pacing is playtested.
export function getWaveTarget(wave: number): number {
  return 15 + (Math.min(RUN_WAVES, Math.max(1, wave)) - 1) * 5;
}

export function getExcludedUpgrades(player: Player, modifiers: RunModifiers): UpgradeId[] {
  const caps: [UpgradeId, number, number][] = [
    ['PIERCE', player.pierceLevel ?? 0, 2],
    ['RICOCHET', player.ricochetLevel ?? 0, MAX_RICOCHET_LEVEL],
    ['LAST_STAND', player.lastStandLevel ?? 0, 2],
    ['WEAPON', player.weaponLevel, 5],
    ['RELOAD', modifiers.fastGcLevel, 3],
    ['OVERCLOCK', modifiers.overclockLevel, 3],
  ];
  return caps.filter(([, level, cap]) => level >= cap).map(([id]) => id);
}

/** A wave is credited once, after combat resolves so a fatal hit wins the tie. */
export function completeWave(player: Player, stats: GameStats): 'none' | 'upgrade' | 'boss' {
  if (player.hp <= 0 || stats.outcome !== 'active' || stats.bossActive
    || stats.levelProgress < stats.levelTarget || stats.wavesCleared >= stats.wave) return 'none';
  stats.wavesCleared = stats.wave;
  if (stats.wave === RUN_WAVES) return 'boss';
  // Preserve the existing between-wave recovery and passive growth.
  player.maxHp += 5;
  player.maxAmmo += 2;
  player.damageMultiplier = Number((player.damageMultiplier + 0.04).toFixed(2));
  player.hp = player.maxHp;
  player.ammo = player.maxAmmo;
  stats.wave++;
  stats.levelProgress = 0;
  stats.levelTarget = getWaveTarget(stats.wave);
  return 'upgrade';
}
