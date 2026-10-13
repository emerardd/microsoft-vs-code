import { describe, expect, it } from 'vitest';
import { formatDuration, getProblemCounts } from './format';
import { getBrand } from './brand';

describe('workbench formatting', () => {
  it('formats simulated run time as m:ss', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(192_000)).toBe('3:12');
    expect(formatDuration(59_999)).toBe('0:59');
  });

  it('counts remaining wave enemies as warnings and a live boss as the only error', () => {
    expect(getProblemCounts({ bossActive: false, levelProgress: 4, levelTarget: 15 })).toEqual({ errors: 0, warnings: 11 });
    expect(getProblemCounts({ bossActive: false, levelProgress: 20, levelTarget: 15 })).toEqual({ errors: 0, warnings: 0 });
    expect(getProblemCounts({ bossActive: true, levelProgress: 0, levelTarget: 35 })).toEqual({ errors: 1, warnings: 0 });
  });
});

describe('brand', () => {
  it('always keeps Microsoft versus Code, including the extension parody name', () => {
    expect(getBrand('zh', false)).toMatchObject({ left: '微软', versus: '大战', right: '代码', full: '微软大战代码' });
    expect(getBrand('en', false).versus).toBe('VS');
    expect(getBrand('zh', true).full).toBe('巨硬大战代码');
    expect(getBrand('en', true).full).toBe('MACROHARD VS CODE');
  });
});
