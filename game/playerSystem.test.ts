import { describe, expect, it, vi } from 'vitest';
import {
  AMMO_REGEN_DELAY_MS,
  MAX_SPECIAL_CHARGE,
  PLAYFIELD_WIDTH,
} from '../constants';
import { createInitialGameStats, createInitialPlayer } from '../utils/gameState';
import { updatePlayerSystem } from './playerSystem';

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

    expect(context.player.x).toBe(startX - 9);
    expect(context.player.y).toBe(startY - 9);
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
