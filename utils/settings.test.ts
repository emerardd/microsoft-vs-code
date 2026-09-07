import { afterEach, expect, it, vi } from 'vitest';
import { readSettings, writeSettings } from './settings';

afterEach(() => vi.unstubAllGlobals());

it('validates saved preferences and clamps sensitivity', () => {
  vi.stubGlobal('localStorage', { getItem: () => '{"sensitivity":100,"muted":true}' });
  expect(readSettings()).toEqual({ sensitivity: 2, muted: true });
  vi.stubGlobal('localStorage', { getItem: () => '{"sensitivity":"bad","muted":"true"}' });
  expect(readSettings()).toEqual({ sensitivity: 1, muted: false });
});

it('remains playable when storage is corrupt or unavailable', () => {
  vi.stubGlobal('localStorage', { getItem: () => '{' });
  expect(readSettings()).toEqual({ sensitivity: 1, muted: false });
  vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } });
  expect(readSettings()).toEqual({ sensitivity: 1, muted: false });
  expect(() => writeSettings({ sensitivity: 1, muted: true })).not.toThrow();
});
