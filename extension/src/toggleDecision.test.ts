import { describe, expect, it } from 'vitest';
import { decideToggleAction } from './toggleDecision';

describe('decideToggleAction', () => {
  it('creates the panel on the first toggle', () => {
    expect(decideToggleAction('missing')).toBe('create');
  });

  it('leaves the game when its panel is active', () => {
    expect(decideToggleAction('active')).toBe('leave');
  });

  it('reveals the retained panel when it is hidden', () => {
    expect(decideToggleAction('hidden')).toBe('reveal');
  });
});
