import type { Lang } from './i18n';

/**
 * The whole joke: "Microsoft VS Code" read literally is Microsoft *versus* Code,
 * which Chinese players famously render as 微软大战代码. The title always keeps
 * the two fighters and the "VS" between them; the extension build swaps in the
 * Macrohard / 巨硬 parody name so it can ship on the Marketplace.
 */
export interface Brand {
  /** The player's side. */
  left: string;
  /** The versus badge between the fighters. */
  versus: string;
  /** The enemy: everyone's code. */
  right: string;
  /** Single-line form for toolbars and document titles. */
  full: string;
}

const BRANDS: Record<'web' | 'extension', Record<Lang, Brand>> = {
  web: {
    en: { left: 'MICROSOFT', versus: 'VS', right: 'CODE', full: 'Microsoft VS Code' },
    zh: { left: '微软', versus: '大战', right: '代码', full: '微软大战代码' },
  },
  extension: {
    en: { left: 'MACROHARD', versus: 'VS', right: 'CODE', full: 'MACROHARD VS CODE' },
    zh: { left: '巨硬', versus: '大战', right: '代码', full: '巨硬大战代码' },
  },
};

export function getBrand(lang: Lang, embedded: boolean): Brand {
  return BRANDS[embedded ? 'extension' : 'web'][lang];
}
