import type { GameStats, Player } from '../types';

export type Loadout = 'standard' | 'spread' | 'pierce';
import { emptyProfile, parseProfile, type MetaProfile } from '../extension/src/metaProfile';
export { emptyProfile, parseProfile, type MetaProfile } from '../extension/src/metaProfile';

export function getMetaProgress(profile: MetaProfile) {
  const runs = Object.values(profile.runs);
  const waves = runs.reduce((total, run) => total + run.waves, 0);
  const wins = runs.filter(run => run.won).length;
  return { waves, wins, bonusHp: Math.min(10, Math.floor(waves / 5) * 2) };
}

export function isLoadoutUnlocked(profile: MetaProfile, loadout: Loadout): boolean {
  const { waves, wins } = getMetaProgress(profile);
  return loadout === 'standard' || (loadout === 'spread' && waves >= 5) || (loadout === 'pierce' && wins > 0);
}

/** Monotonic per-run credit makes refresh, checkpoint replay and repeated events idempotent. */
export function creditRun(profile: MetaProfile, stats: Pick<GameStats, 'runId' | 'wavesCleared' | 'outcome'>): MetaProfile {
  const previous = profile.runs[stats.runId] ?? { waves: 0, won: false };
  const waves = Math.max(previous.waves, stats.wavesCleared);
  const won = previous.won || (stats.outcome === 'victory' && waves === 5);
  if (waves === previous.waves && won === previous.won) return profile;
  return { version: 1, runs: { ...profile.runs, [stats.runId]: { waves, won } } };
}

export function applyLoadout(player: Player, profile: MetaProfile, requested: Loadout): void {
  const loadout = isLoadoutUnlocked(profile, requested) ? requested : 'standard';
  player.maxHp += getMetaProgress(profile).bonusHp;
  player.hp = player.maxHp;
  if (loadout === 'spread') player.weaponLevel = 2;
  if (loadout === 'pierce') player.pierceLevel = 1;
}

const PROFILE_KEY = 'VSCODE_GAME_PROFILE_V1';
export function readProfile(): MetaProfile {
  try { return parseProfile(JSON.parse(localStorage.getItem(PROFILE_KEY) ?? 'null')) ?? emptyProfile(); }
  catch { return emptyProfile(); }
}
export function writeProfile(profile: MetaProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
