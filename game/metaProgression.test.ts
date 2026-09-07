import { describe, expect, it } from 'vitest';
import { createInitialGameStats, createInitialPlayer } from '../utils/gameState';
import { applyLoadout, creditRun, emptyProfile, getMetaProgress, isLoadoutUnlocked, parseProfile } from './metaProgression';

describe('meta progression', () => {
  it('credits cumulative waves once across checkpoint replay, repeated settlement and failures', () => {
    const stats = createInitialGameStats();
    stats.wavesCleared = 3;
    let profile = creditRun(emptyProfile(), stats);
    expect(creditRun(profile, stats)).toBe(profile);
    expect(creditRun(profile, { ...stats, wavesCleared: 1 })).toBe(profile);
    profile = creditRun(profile, { ...stats, wavesCleared: 5, outcome: 'defeat' });
    expect(getMetaProgress(profile)).toEqual({ waves: 5, wins: 0, bonusHp: 2 });
    expect(isLoadoutUnlocked(profile, 'spread')).toBe(true);
    expect(isLoadoutUnlocked(profile, 'pierce')).toBe(false);
    profile = creditRun(profile, { ...stats, wavesCleared: 5, outcome: 'victory' });
    expect(getMetaProgress(profile).wins).toBe(1);
    expect(creditRun(profile, { ...stats, wavesCleared: 5, outcome: 'victory' })).toBe(profile);
    expect(isLoadoutUnlocked(profile, 'pierce')).toBe(true);
  });

  it('caps permanent HP and applies only one unlocked loadout to a fresh player', () => {
    let profile = emptyProfile();
    for (let i = 0; i < 10; i++) profile = creditRun(profile, { runId: `run-${i}`, wavesCleared: 5, outcome: 'victory' });
    expect(getMetaProgress(profile).bonusHp).toBe(10);
    const player = createInitialPlayer();
    applyLoadout(player, profile, 'pierce');
    expect(player.hp).toBe(110);
    expect(player.weaponLevel).toBe(1);
    expect(player.pierceLevel).toBe(1);
    const locked = createInitialPlayer();
    applyLoadout(locked, emptyProfile(), 'spread');
    expect(locked.weaponLevel).toBe(1);
  });

  it('round-trips independent profiles and rejects corrupt or unsupported data', () => {
    const profile = creditRun(emptyProfile(), { runId: 'test-run', wavesCleared: 5, outcome: 'victory' });
    const restored = parseProfile(JSON.parse(JSON.stringify(profile)))!;
    restored.runs['test-run'].waves = 1;
    expect(profile.runs['test-run'].waves).toBe(5);
    for (const value of [null, {}, { version: 2, runs: {} }, { version: 1, runs: [] },
      { version: 1, runs: { x: { waves: 6, won: false } } },
      { version: 1, runs: { x: { waves: 1, won: true } } },
      JSON.parse('{"version":1,"runs":{"__proto__":{"waves":5,"won":true}}}')]) expect(parseProfile(value)).toBeNull();
  });
});
