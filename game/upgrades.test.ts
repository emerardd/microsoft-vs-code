import { describe, expect, it, vi } from 'vitest';
import { createInitialPlayer } from '../utils/gameState';
import { applyUpgrade } from './upgrades';

describe('upgrade application', () => {
  it('applies player stat upgrades and restores the affected resource', () => {
    const player = createInitialPlayer();
    player.hp = 10;
    player.ammo = 1;
    const addFloatingText = vi.fn();

    const modifiers = { fastGcLevel: 0, overclockLevel: 0 };
    applyUpgrade('MAX_HP', player, modifiers, addFloatingText);
    applyUpgrade('MAX_AMMO', player, modifiers, addFloatingText);

    expect(player.maxHp).toBe(112);
    expect(player.hp).toBe(22);
    expect(player.maxAmmo).toBe(45);
    expect(player.ammo).toBe(6);
    expect(addFloatingText).toHaveBeenCalledTimes(2);
  });

  it('caps the weapon level', () => {
    const player = createInitialPlayer();
    player.weaponLevel = 5;

    applyUpgrade(
      'WEAPON',
      player,
      { fastGcLevel: 0, overclockLevel: 0 },
      vi.fn(),
    );

    expect(player.weaponLevel).toBe(5);
  });

  it('returns updated permanent run modifiers', () => {
    const player = createInitialPlayer();
    const addFloatingText = vi.fn();

    const fastGc = applyUpgrade(
      'RELOAD',
      player,
      { fastGcLevel: 0, overclockLevel: 0 },
      addFloatingText,
    );
    const overclock = applyUpgrade('OVERCLOCK', player, fastGc, addFloatingText);

    expect(overclock).toEqual({ fastGcLevel: 1, overclockLevel: 1 });

    const stacked = applyUpgrade('OVERCLOCK', player, overclock, addFloatingText);
    expect(stacked.overclockLevel).toBe(2);
  });
});
