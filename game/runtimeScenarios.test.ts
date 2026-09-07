import { describe, expect, it, vi } from 'vitest';
import { SimulationClock } from './simulationClock';
import { updatePlayerSystem } from './playerSystem';
import { advanceEnemyProjectiles, advancePlayerProjectiles } from './advanceEntities';
import { createEnemy, createPlayerProjectiles } from './entityFactory';
import { createInitialGameStats, createInitialPlayer } from '../utils/gameState';
import { resolveCombat } from './combat';
import { resolveEnemyDefeat } from './progression';
import { applyUpgrade } from './upgrades';
import { createCheckpoint, parseCheckpoint } from './checkpoint';
import type { EnemyProjectile } from '../types';

function runAt(fps: number) {
  const clock = new SimulationClock();
  const player = createInitialPlayer();
  const stats = createInitialGameStats();
  player.speedBuff = 600;
  player.shield = 600;
  const enemy = createEnemy('BUG', 1, { x: player.x, y: player.y });
  enemy.hp = enemy.maxHp = 10000;
  let lastFireTime = 0;
  let shots = 0;
  for (let i = 0; i < fps * 2; i++) clock.advance(1000 / fps, timestamp => {
    const result = updatePlayerSystem({ player, stats, frameScale: 1, timestamp, lastFireTime,
      keys: new Set(timestamp < 300 ? ['Space', 'KeyA', 'KeyW'] : ['Space']), movementSensitivity: 1, fastGcLevel: 0, overclockLevel: 0,
      addFloatingText: vi.fn(), triggerUltimate: vi.fn() });
    lastFireTime = result.lastFireTime;
    shots += result.projectiles.length;
    enemy.x = player.x; enemy.y = player.y;
    resolveCombat({ player, stats, frameScale: 1, enemies: [enemy], projectiles: [], enemyProjectiles: [], powerUps: [],
      addFloatingText: vi.fn(), createExplosion: vi.fn(), handleEnemyDefeat: vi.fn(), triggerGameOver: vi.fn() });
  });
  return { x: player.x, y: player.y, shots, ammo: player.ammo, buff: player.speedBuff, hp: enemy.hp, time: clock.time };
}

describe('runtime scenarios', () => {
  it('keeps shooting, buffs, ammo and shield contact damage identical at 15/30/60/144 Hz', () => {
    const baseline = runAt(60);
    for (const fps of [15, 30, 144]) expect(runAt(fps)).toEqual(baseline);
    expect(baseline.hp).toBe(8800);
  });

  it('stops catch-up at a phase transition and bounds long stalls', () => {
    const clock = new SimulationClock();
    const update = vi.fn(() => false);
    clock.advance(10000, update);
    expect(update).toHaveBeenCalledTimes(1);
    const after = clock.time;
    clock.advance(1000 / 60, () => {});
    expect(clock.time - after).toBeCloseTo(1000 / 60);
    clock.reset();
    clock.advance(10000, () => {});
    expect(clock.time).toBeCloseTo(250);
  });

  it('removes sustained fire escaping in all four directions', () => {
    let bullets: EnemyProjectile[] = [];
    let peak = 0;
    for (let frame = 0; frame < 60 * 120; frame++) {
      if (frame % 6 === 0) for (const [vx, vy] of [[0, -8], [0, 8], [-8, 0], [8, 0]]) {
        bullets.push({ id: `${frame}:${vx}:${vy}`, x: 370, y: 300, vx, vy, width: 8, height: 8, color: '#fff', damage: 5, label: '!' });
      }
      bullets = advanceEnemyProjectiles(bullets, 1);
      peak = Math.max(peak, bullets.length);
    }
    expect(peak).toBeLessThan(40);
    for (let frame = 0; frame < 120; frame++) bullets = advanceEnemyProjectiles(bullets, 1);
    expect(bullets).toHaveLength(0);
  });

  it('gives death priority over boss rewards and healing in the same step', () => {
    const player = createInitialPlayer(); player.hp = 5;
    const stats = createInitialGameStats();
    const boss = createEnemy('MONOLITH', 1, { x: player.x, y: player.y - 100 }); boss.hp = 1;
    const bullet = createPlayerProjectiles(player)[0]; bullet.x = boss.x; bullet.y = boss.y;
    const onDefeat = vi.fn(enemy => resolveEnemyDefeat(enemy, { player, stats, spawnEnemy: vi.fn(), createExplosion: vi.fn(), addFloatingText: vi.fn() }));
    const onDeath = vi.fn();
    resolveCombat({ player, stats, frameScale: 1, enemies: [boss], projectiles: [bullet],
      enemyProjectiles: [{ ...bullet, x: player.x, y: player.y, damage: 10, label: 'fatal' }],
      powerUps: [{ ...bullet, x: player.x, y: player.y, type: 'HOTFIX', icon: '+' }],
      addFloatingText: vi.fn(), createExplosion: vi.fn(), handleEnemyDefeat: onDefeat, triggerGameOver: onDeath });
    expect(onDeath).toHaveBeenCalledOnce();
    expect(onDefeat).not.toHaveBeenCalled();
    expect(player.hp).toBeLessThanOrEqual(0);
    expect(stats.wave).toBe(1);
    expect(stats.damageTaken.fatal).toBe(5);
  });

  it('pierces distinct enemies only once and supports wall bounces and low-ammo builds', () => {
    const player = createInitialPlayer();
    for (const id of ['PIERCE', 'RICOCHET', 'LAST_STAND'] as const) applyUpgrade(id, player, { fastGcLevel: 0, overclockLevel: 0 }, vi.fn());
    player.ammo = 10;
    const bullets = createPlayerProjectiles(player);
    expect(bullets).toHaveLength(3);
    expect(bullets[0].damage).toBe(12.5);
    const bullet = bullets[0]; bullet.x = 100; bullet.y = 100;
    const enemies = [0, 1].map(i => ({ ...createEnemy('BUG', 1, { x: 100, y: 100 }), id: String(i), hp: 100 }));
    const context = { player, stats: createInitialGameStats(), frameScale: 1, enemies, projectiles: [bullet], enemyProjectiles: [], powerUps: [], addFloatingText: vi.fn(), createExplosion: vi.fn(), handleEnemyDefeat: vi.fn(), triggerGameOver: vi.fn() };
    resolveCombat(context); resolveCombat(context);
    expect(enemies.map(e => e.hp)).toEqual([87.5, 87.5]);
    const diagonal = bullets[1]; diagonal.x = 0;
    expect(advancePlayerProjectiles([diagonal], 1)).toHaveLength(1);
    expect(diagonal.vx).toBeGreaterThan(0);
    expect(diagonal.bouncesRemaining).toBe(0);
  });

  it('round-trips independent checkpoints and rejects corrupt or incompatible saves', () => {
    const checkpoint = createCheckpoint(createInitialPlayer(), createInitialGameStats(), { fastGcLevel: 1, overclockLevel: 2 });
    const restored = parseCheckpoint(JSON.parse(JSON.stringify(checkpoint)));
    expect(restored).toEqual(checkpoint);
    restored!.player.hp = 1;
    expect(checkpoint.player.hp).toBe(100);
    for (const value of [null, {}, { ...checkpoint, version: 2 }, { ...checkpoint, player: { ...checkpoint.player, hp: NaN } }, { ...checkpoint, stats: { ...checkpoint.stats, upgradeHistory: ['BAD'] } }]) expect(parseCheckpoint(value)).toBeNull();
  });
});
