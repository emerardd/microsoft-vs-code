import { describe, expect, it } from 'vitest';
import { getAmbientSpawnPlan, getBossSummonPlan } from './spawnDirector';

describe('spawn director', () => {
  it('smooths the ambient spawn curve and caps concurrent enemies', () => {
    expect(getAmbientSpawnPlan(1)).toEqual({
      intervalMs: 1100,
      maxConcurrentEnemies: 7,
    });
    expect(getAmbientSpawnPlan(3)).toEqual({
      intervalMs: 930,
      maxConcurrentEnemies: 8,
    });
    expect(getAmbientSpawnPlan(4)).toEqual({
      intervalMs: 845,
      maxConcurrentEnemies: 8,
    });
    expect(getAmbientSpawnPlan(20)).toEqual({
      intervalMs: 560,
      maxConcurrentEnemies: 11,
    });
  });

  it('gives later and lower-health bosses larger summon bursts', () => {
    const openingBoss = getBossSummonPlan(1, 1);
    const lateBoss = getBossSummonPlan(4, 3);

    expect(openingBoss.types).toHaveLength(2);
    expect(lateBoss.types).toHaveLength(5);
    expect(lateBoss.intervalFrames).toBeLessThan(openingBoss.intervalFrames);
    expect(lateBoss.maxMinions).toBeGreaterThan(openingBoss.maxMinions);
    expect(lateBoss.types).toEqual([
      'MERGE_CONFLICT',
      'SYNTAX_ERROR',
      'SPAGHETTI',
      'ERROR_404',
      'MERGE_CONFLICT',
    ]);
  });
});
