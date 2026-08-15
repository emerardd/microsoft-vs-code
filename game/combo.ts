import {
  BOSS_COMBO_HEALTH_STEP,
  COMBO_DECAY_INTERVAL,
  COMBO_TIMER_MAX,
} from '../constants';
import type { Enemy, GameStats } from '../types';

export interface ComboBonuses {
  scoreMultiplier: number;
  damageMultiplier: number;
  fireRateMultiplier: number;
  chargeMultiplier: number;
}

export function getComboBonuses(combo: number): ComboBonuses {
  const stacks = Math.max(0, Math.min(20, Math.floor(combo)));

  return {
    scoreMultiplier: 1 + stacks * 0.05,
    damageMultiplier: 1 + stacks * 0.02,
    fireRateMultiplier: 1 - stacks * 0.0125,
    chargeMultiplier: 1 + Math.floor(stacks / 5) * 0.1,
  };
}

export function addComboStacks(stats: GameStats, amount = 1): number {
  const gained = Math.max(0, Math.floor(amount));
  if (gained <= 0) return 0;

  stats.combo += gained;
  stats.maxCombo = Math.max(stats.maxCombo, stats.combo);
  stats.comboTimer = COMBO_TIMER_MAX;
  return gained;
}

export function addBossDamageCombo(
  enemy: Enemy,
  stats: GameStats,
  damage: number,
): number {
  if (enemy.type !== 'MONOLITH' || damage <= 0 || enemy.maxHp <= 0) return 0;

  const damagePerStack = enemy.maxHp * BOSS_COMBO_HEALTH_STEP;
  enemy.bossComboDamage = (enemy.bossComboDamage ?? 0) + damage;
  const gained = Math.floor(
    (enemy.bossComboDamage + damagePerStack * 1e-9)
      / damagePerStack,
  );
  if (gained <= 0) return 0;

  enemy.bossComboDamage -= gained * damagePerStack;
  return addComboStacks(stats, gained);
}

export function tickComboDecay(stats: GameStats, frameScale: number): boolean {
  if (stats.combo <= 0) return false;

  stats.comboTimer -= frameScale;
  let decayed = false;
  while (stats.combo > 0 && stats.comboTimer <= 0) {
    stats.combo--;
    decayed = true;
    if (stats.combo > 0) stats.comboTimer += COMBO_DECAY_INTERVAL;
  }

  if (stats.combo <= 0) {
    stats.combo = 0;
    stats.comboTimer = 0;
  }
  return decayed;
}

export function penalizeCombo(stats: GameStats): number {
  if (stats.combo <= 0) return 0;

  const lost = Math.max(1, Math.ceil(stats.combo * 0.35));
  stats.combo = Math.max(0, stats.combo - lost);
  stats.comboTimer = stats.combo > 0 ? COMBO_DECAY_INTERVAL : 0;
  return lost;
}
