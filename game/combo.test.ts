import { describe, expect, it } from 'vitest';
import { COMBO_DECAY_INTERVAL } from '../constants';
import { createInitialGameStats } from '../utils/gameState';
import type { Enemy } from '../types';
import {
  addBossDamageCombo,
  getComboBonuses,
  penalizeCombo,
  tickComboDecay,
} from './combo';

const createBoss = (): Enemy => ({
  id: 'boss',
  x: 100,
  y: 60,
  width: 160,
  height: 60,
  vx: 0,
  vy: 0,
  color: '#fff',
  hp: 1000,
  maxHp: 1000,
  type: 'MONOLITH',
  text: 'LegacyWrapper',
  scoreValue: 5000,
  age: 0,
  flashTimer: 0,
});

describe('combo system', () => {
  it('grants capped score, damage, fire-rate, and charge bonuses', () => {
    expect(getComboBonuses(10)).toEqual({
      scoreMultiplier: 1.5,
      damageMultiplier: 1.2,
      fireRateMultiplier: 0.875,
      chargeMultiplier: 1.2,
    });
    expect(getComboBonuses(99)).toEqual(getComboBonuses(20));
  });

  it('decays one stack at a time instead of clearing the combo', () => {
    const stats = createInitialGameStats();
    stats.combo = 4;
    stats.comboTimer = 1;

    expect(tickComboDecay(stats, 1)).toBe(true);
    expect(stats.combo).toBe(3);
    expect(stats.comboTimer).toBe(COMBO_DECAY_INTERVAL);
  });

  it('applies a partial combo penalty when the player is hit', () => {
    const stats = createInitialGameStats();
    stats.combo = 10;

    expect(penalizeCombo(stats)).toBe(4);
    expect(stats.combo).toBe(6);
    expect(stats.comboTimer).toBe(COMBO_DECAY_INTERVAL);
  });

  it('awards one combo for each five percent of Boss health dealt', () => {
    const stats = createInitialGameStats();
    const boss = createBoss();

    expect(addBossDamageCombo(boss, stats, 49)).toBe(0);
    expect(addBossDamageCombo(boss, stats, 1)).toBe(1);
    expect(addBossDamageCombo(boss, stats, 100)).toBe(2);
    expect(stats.combo).toBe(3);
    expect(stats.maxCombo).toBe(3);
  });
});
