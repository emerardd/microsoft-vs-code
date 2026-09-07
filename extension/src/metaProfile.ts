export interface MetaProfile {
  version: 1;
  runs: Record<string, { waves: number; won: boolean }>;
}

export const emptyProfile = (): MetaProfile => ({ version: 1, runs: {} });

export function parseProfile(value: unknown): MetaProfile | null {
  if (!value || typeof value !== 'object') return null;
  const p = value as Partial<MetaProfile>;
  if (p.version !== 1 || !p.runs || typeof p.runs !== 'object' || Array.isArray(p.runs)) return null;
  const runs: MetaProfile['runs'] = {};
  for (const [id, run] of Object.entries(p.runs)) {
    if (!/^[a-zA-Z0-9-]{1,100}$/.test(id) || ['__proto__', 'constructor', 'prototype'].includes(id)
      || !run || typeof run !== 'object' || !Number.isInteger(run.waves) || run.waves < 0 || run.waves > 5
      || typeof run.won !== 'boolean' || (run.won && run.waves !== 5)) return null;
    runs[id] = { waves: run.waves, won: run.won };
  }
  return { version: 1, runs };
}
