import { useSyncExternalStore } from 'react';
import type { GameStats } from '../types';
import { createInitialGameStats } from '../utils/gameState';

export function createStatsStore() {
  let snapshot = createInitialGameStats();
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    publish: (stats: GameStats) => {
      snapshot = { ...stats, upgradeHistory: [...stats.upgradeHistory], damageTaken: { ...stats.damageTaken } };
      listeners.forEach(listener => listener());
    },
  };
}

export type StatsStore = ReturnType<typeof createStatsStore>;
const idleSnapshot = createInitialGameStats();
const getIdleSnapshot = () => idleSnapshot;
export function useGameStats(store: StatsStore, enabled = true): GameStats {
  return useSyncExternalStore(store.subscribe, enabled ? store.getSnapshot : getIdleSnapshot, store.getSnapshot);
}
