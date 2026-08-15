import type { EnemyType } from '../types';

export interface AmbientSpawnPlan {
  intervalMs: number;
  maxConcurrentEnemies: number;
}

export interface BossSummonPlan {
  intervalFrames: number;
  maxMinions: number;
  types: EnemyType[];
}

export function getAmbientSpawnPlan(wave: number): AmbientSpawnPlan {
  const waveIndex = Math.max(0, Math.floor(wave) - 1);

  return {
    // Keep later releases busy without the wave-three difficulty cliff caused by
    // the previous exponential curve.
    intervalMs: Math.max(560, 1100 - waveIndex * 85),
    maxConcurrentEnemies: Math.min(11, 7 + Math.floor(waveIndex / 2)),
  };
}

export function getBossSummonPlan(wave: number, phase: number): BossSummonPlan {
  const safeWave = Math.max(1, Math.floor(wave));
  const safePhase = Math.max(1, Math.min(3, Math.floor(phase)));
  const burstSize = Math.min(
    6,
    2 + Math.floor((safeWave - 1) / 2) + safePhase - 1,
  );
  const pools: EnemyType[][] = [
    ['BUG', 'SYNTAX_ERROR'],
    ['BUG', 'SYNTAX_ERROR', 'INFINITE_LOOP'],
    ['BUG', 'SYNTAX_ERROR', 'MERGE_CONFLICT', 'SPAGHETTI'],
    ['SPAGHETTI', 'ERROR_404', 'MERGE_CONFLICT', 'SYNTAX_ERROR'],
  ];
  const pool = pools[Math.min(pools.length - 1, safeWave - 1)];

  return {
    intervalFrames: Math.max(
      88,
      [220, 160, 115][safePhase - 1] - (safeWave - 1) * 10,
    ),
    maxMinions: Math.min(12, 5 + safeWave + safePhase),
    types: Array.from(
      { length: burstSize },
      (_, index) => pool[(index + safePhase - 1) % pool.length],
    ),
  };
}
