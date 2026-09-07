import { describe, expect, it, vi } from 'vitest';
import {
  AMMO_REGEN_DELAY_MS,
  MAX_SPECIAL_CHARGE,
  PLAYFIELD_WIDTH,
} from '../constants';
import { createInitialGameStats, createInitialPlayer } from '../utils/gameState';
import { updatePlayerSystem } from './playerSystem';
import { SimulationClock } from './simulationClock';

const createContext = () => ({
  player: createInitialPlayer(),
  stats: createInitialGameStats(),
  keys: new Set<string>(),
  frameScale: 1,
  timestamp: 200,
  lastFireTime: 0,
  movementSensitivity: 1,
  fastGcLevel: 0,
  overclockLevel: 0,
  addFloatingText: vi.fn(),
  triggerUltimate: vi.fn(),
});

describe('player system', () => {
  it('moves the player using the active speed before timers decay', () => {
    const context = createContext();
    context.keys.add('KeyA');
    context.keys.add('KeyW');
    context.player.speedBuff = 10;
    context.player.weaponBuff = 10;
    const startX = context.player.x;
    const startY = context.player.y;

    updatePlayerSystem(context);

    expect(context.player.x).toBeCloseTo(startX - 9 / Math.SQRT2);
    expect(context.player.y).toBeCloseTo(startY - 9 / Math.SQRT2);
    expect(context.player.speedBuff).toBe(9);
    expect(context.player.weaponBuff).toBe(9);
  });

  it('keeps the player out of the reserved minimap rail', () => {
    const context = createContext();
    context.player.x = PLAYFIELD_WIDTH - context.player.width;
    context.keys.add('KeyD');

    updatePlayerSystem(context);

    expect(context.player.x).toBe(PLAYFIELD_WIDTH - context.player.width);
  });

  it('fires the projectile pattern and updates ammo statistics', () => {
    const context = createContext();
    context.keys.add('Space');
    context.player.weaponLevel = 4;

    const result = updatePlayerSystem(context);

    expect(result.projectiles).toHaveLength(5);
    expect(result.lastFireTime).toBe(context.timestamp);
    expect(context.player.ammo).toBe(context.player.maxAmmo - 1);
    expect(context.stats.linesOfCode).toBe(1);
  });

  it('does not regenerate ammo between rapid tap shots', () => {
    const context = createContext();
    context.player.ammo = 10;
    context.keys.add('Space');

    const firstShot = updatePlayerSystem(context);
    context.lastFireTime = firstShot.lastFireTime;
    expect(context.player.ammo).toBe(9);

    context.keys.delete('Space');
    context.timestamp += 16;
    updatePlayerSystem(context);
    expect(context.player.ammo).toBe(9);

    context.keys.add('Space');
    context.timestamp += 200;
    const secondShot = updatePlayerSystem(context);

    expect(secondShot.projectiles).toHaveLength(1);
    expect(context.player.ammo).toBe(8);
  });

  it('regenerates ammo only after the post-fire cooldown', () => {
    const context = createContext();
    context.player.ammo = 10;
    context.lastFireTime = 200;
    context.timestamp = context.lastFireTime + AMMO_REGEN_DELAY_MS - 1;

    updatePlayerSystem(context);
    expect(context.player.ammo).toBe(10);

    context.timestamp += 1;
    updatePlayerSystem(context);
    expect(context.player.ammo).toBeCloseTo(10.4);
  });

  it('turns a high combo into a noticeable fire-rate bonus', () => {
    const context = createContext();
    context.timestamp = 130;
    context.keys.add('Space');

    expect(updatePlayerSystem(context).projectiles).toHaveLength(0);

    context.stats.combo = 20;
    context.stats.comboTimer = 180;
    expect(updatePlayerSystem(context).projectiles).toHaveLength(1);
  });

  it('starts the shortened reload after firing the final round', () => {
    const context = createContext();
    context.keys.add('Space');
    context.fastGcLevel = 1;
    context.player.ammo = 1;

    updatePlayerSystem(context);

    expect(context.player.isReloading).toBe(true);
    expect(context.player.reloadTimer).toBe(135);
  });

  it('reloads a fractional last round and resumes firing while Space stays held', () => {
    const context = createContext();
    context.player.ammo = 2;
    context.timestamp = AMMO_REGEN_DELAY_MS;
    updatePlayerSystem(context);
    expect(context.player.ammo).toBeCloseTo(2.4);
    context.keys.add('Space');
    const clock = new SimulationClock();
    clock.reset(context.timestamp);
    let sawFractionalReload = false;
    for (let frame = 0; frame < 300; frame++) clock.advance(1000 / 60, timestamp => {
      context.timestamp = timestamp;
      context.lastFireTime = updatePlayerSystem(context).lastFireTime;
      if (context.player.isReloading && context.player.ammo > 0 && context.player.ammo < 1) sawFractionalReload = true;
    });
    expect(sawFractionalReload).toBe(true);
    expect(context.stats.linesOfCode).toBeGreaterThan(2);
    expect(context.player.ammo).toBeGreaterThan(1);
  });

  it.each([0, 0.4, 0.999999])('recovers an already stranded ammo balance of %s', ammo => {
    const context = createContext();
    context.player.ammo = ammo;
    context.keys.add('Space');
    expect(updatePlayerSystem(context).projectiles).toHaveLength(0);
    expect(context.player.isReloading).toBe(true);
    expect(context.player.reloadTimer).toBe(150);
  });

  it('delivers each overclock level at the advertised average interval at different frame rates', () => {
    for (const fps of [15, 30, 60, 144]) {
      const counts: number[] = [];
      for (const level of [0, 1, 2, 3]) {
        const context = createContext();
        context.player.weaponLevel = 3;
        context.player.maxAmmo = context.player.ammo = 100000;
        context.overclockLevel = level;
        context.keys.add('Space');
        const clock = new SimulationClock();
        for (let frame = 0; frame < fps * 60; frame++) clock.advance(1000 / fps, timestamp => {
          context.timestamp = timestamp;
          context.lastFireTime = updatePlayerSystem(context).lastFireTime;
        });
        counts.push(context.stats.linesOfCode);
        expect(context.stats.linesOfCode).toBe(Math.floor(60000 / (110 * (1 - level * 0.08))));
      }
      expect(counts.every((count, index) => index === 0 || count > counts[index - 1])).toBe(true);
    }
  });

  it('does not bank fire-rate credit while idle or reloading, and keeps the real regeneration delay', () => {
    const context = createContext();
    context.player.weaponLevel = 3;
    context.keys.add('Space');
    for (let frame = 1; frame <= 7; frame++) {
      context.timestamp = frame * 1000 / 60;
      context.lastFireTime = updatePlayerSystem(context).lastFireTime;
    }
    expect(context.stats.linesOfCode).toBe(1);
    expect(context.lastFireTime).toBe(context.timestamp);
    context.keys.clear();
    context.timestamp = context.lastFireTime + AMMO_REGEN_DELAY_MS - 1;
    updatePlayerSystem(context);
    expect(context.player.ammo).toBe(39);
    context.timestamp += 1;
    updatePlayerSystem(context);
    expect(context.player.ammo).toBeCloseTo(39.4);
    context.timestamp += 10000;
    context.keys.add('Space');
    context.lastFireTime = updatePlayerSystem(context).lastFireTime;
    context.timestamp += 1000 / 60;
    expect(updatePlayerSystem(context).projectiles).toHaveLength(0);
    context.player.isReloading = true;
    context.player.reloadTimer = 1;
    context.timestamp += 2500;
    context.lastFireTime = updatePlayerSystem(context).lastFireTime;
    context.timestamp += 1000 / 60;
    expect(updatePlayerSystem(context).projectiles).toHaveLength(0);
  });

  it('decays a combo by one stack and requests the ultimate when charged', () => {
    const context = createContext();
    context.keys.add('KeyR');
    context.player.specialCharge = MAX_SPECIAL_CHARGE;
    context.stats.combo = 3;
    context.stats.comboTimer = 1;

    updatePlayerSystem(context);

    expect(context.stats.combo).toBe(2);
    expect(context.triggerUltimate).toHaveBeenCalledOnce();
  });
});
