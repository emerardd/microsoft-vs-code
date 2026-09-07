import { describe, expect, it } from 'vitest';
import { createInitialGameStats, createInitialPlayer } from '../utils/gameState';
import { completeWave, getExcludedUpgrades } from './runPlan';
import { pickUpgradeChoices } from './contentSelection';
import { createCheckpoint, parseCheckpoint } from './checkpoint';

describe('finite run', () => {
  it('offers four between-wave upgrades then exactly one final boss transition', () => {
    const player = createInitialPlayer();
    const stats = createInitialGameStats();
    const transitions = [];
    for (let wave = 1; wave <= 5; wave++) {
      expect(stats.wave).toBe(wave);
      expect(completeWave(player, stats)).toBe('none');
      stats.levelProgress = stats.levelTarget;
      transitions.push(completeWave(player, stats));
      expect(stats.wavesCleared).toBe(wave);
      expect(completeWave(player, stats)).toBe('none');
    }
    expect(transitions).toEqual(['upgrade', 'upgrade', 'upgrade', 'upgrade', 'boss']);
    expect(stats.wave).toBe(5);
    expect(player.maxHp).toBe(120);
  });

  it('does not credit a wave cleared in the same step as death', () => {
    const player = createInitialPlayer();
    const stats = createInitialGameStats();
    stats.levelProgress = stats.levelTarget;
    player.hp = 0;
    expect(completeWave(player, stats)).toBe('none');
    expect(stats.wavesCleared).toBe(0);
  });

  it('never offers capped upgrades and still has three options', () => {
    const player = createInitialPlayer();
    Object.assign(player, { weaponLevel: 5, pierceLevel: 2, ricochetLevel: 1, lastStandLevel: 1 });
    const excluded = getExcludedUpgrades(player, { fastGcLevel: 3, overclockLevel: 3 });
    expect(pickUpgradeChoices(3, () => 0, excluded).map(option => option.id)).toEqual(['MAX_HP', 'MAX_AMMO', 'LAST_STAND']);
  });

  it('migrates the same legacy checkpoint consistently and rejects terminal or impossible new saves', () => {
    const checkpoint = createCheckpoint(createInitialPlayer(), createInitialGameStats(), { fastGcLevel: 0, overclockLevel: 0 });
    const legacy = JSON.parse(JSON.stringify(checkpoint));
    legacy.version = 1;
    delete legacy.stats.runId; delete legacy.stats.wavesCleared; delete legacy.stats.outcome;
    legacy.stats.wave = 12;
    const restored = parseCheckpoint(legacy)!;
    expect(restored.version).toBe(2);
    expect(restored.stats.wave).toBe(5);
    expect(restored.stats.runId).toBe(parseCheckpoint(legacy)!.stats.runId);
    for (const change of [{ outcome: 'victory' }, { wave: 6 }, { wavesCleared: 5 }, { runId: '__proto__' }]) {
      expect(parseCheckpoint({ ...checkpoint, stats: { ...checkpoint.stats, ...change } })).toBeNull();
    }
  });
});
