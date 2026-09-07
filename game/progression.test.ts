import { describe, expect, it, vi } from 'vitest';
import type { Enemy } from '../types';
import { createInitialGameStats, createInitialPlayer } from '../utils/gameState';
import { resolveEnemyDefeat } from './progression';

const createEnemy = (overrides: Partial<Enemy> = {}): Enemy => ({
  id: 'enemy',
  x: 100,
  y: 100,
  width: 30,
  height: 20,
  vx: 0,
  vy: 0,
  color: '#fff',
  hp: 0,
  maxHp: 10,
  type: 'BUG',
  text: 'bug',
  scoreValue: 100,
  age: 0,
  flashTimer: 0,
  ...overrides,
});

const createContext = () => ({
  player: createInitialPlayer(),
  stats: createInitialGameStats(),
  spawnEnemy: vi.fn(),
  createExplosion: vi.fn(),
  addFloatingText: vi.fn(),
  random: () => 0.9,
});

describe('enemy defeat progression', () => {
  it('ignores an enemy that still has health', () => {
    const context = createContext();
    const result = resolveEnemyDefeat(createEnemy({ hp: 1 }), context);

    expect(result.defeated).toBe(false);
    expect(context.stats.bugsFixed).toBe(0);
  });

  it('awards score, combo, charge, and level progress', () => {
    const context = createContext();
    context.stats.combo = 2;

    const result = resolveEnemyDefeat(createEnemy(), context);

    expect(result.defeated).toBe(true);
    expect(context.stats.score).toBe(110);
    expect(context.stats.combo).toBe(3);
    expect(context.stats.levelProgress).toBe(1);
    expect(context.player.specialCharge).toBe(5);
  });

  it('caps high-combo scoring while accelerating ultimate charge', () => {
    const context = createContext();
    context.stats.combo = 10;

    resolveEnemyDefeat(createEnemy(), context);

    expect(context.stats.score).toBe(150);
    expect(context.player.specialCharge).toBe(6);
  });

  it('keeps all defeat rewards except charge when the kill came from Refactor', () => {
    const context = createContext();
    context.player.specialCharge = 0;
    context.stats.combo = 4;

    const result = resolveEnemyDefeat(createEnemy(), {
      ...context,
      grantSpecialCharge: false,
    });

    expect(result.defeated).toBe(true);
    expect(context.player.specialCharge).toBe(0);
    expect(context.stats.score).toBeGreaterThan(0);
    expect(context.stats.combo).toBe(5);
    expect(context.stats.levelProgress).toBe(1);
  });

  it('splits a merge conflict into two smaller bugs', () => {
    const context = createContext();

    resolveEnemyDefeat(createEnemy({ type: 'MERGE_CONFLICT' }), context);

    expect(context.spawnEnemy).toHaveBeenNthCalledWith(1, 'BUG', 80, 100, 0.5);
    expect(context.spawnEnemy).toHaveBeenNthCalledWith(2, 'BUG', 120, 100, 0.5);
  });

  it('ends the run on final boss defeat without another upgrade or wave', () => {
    const context = createContext();
    context.stats.bossActive = true;
    context.stats.wave = 5;
    context.stats.wavesCleared = 5;
    context.player.hp = 10;
    const result = resolveEnemyDefeat(createEnemy({ type: 'MONOLITH', scoreValue: 5000 }), context);
    expect(context.stats.wave).toBe(5);
    expect(context.stats.bossActive).toBe(false);
    expect(context.stats.outcome).toBe('victory');
    expect(context.player.hp).toBe(10);
    expect(result.victory).toBe(true);
    expect(result.upgradeChoices).toHaveLength(0);
  });

  it('returns a power-up when the drop roll succeeds', () => {
    const context = createContext();
    context.random = () => 0;

    const result = resolveEnemyDefeat(createEnemy(), context);

    expect(result.droppedPowerUp?.type).toBe('COFFEE');
  });
});
