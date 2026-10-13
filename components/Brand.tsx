import type { Brand } from '../utils/brand';
import { t } from '../utils/i18n';

/** Fighting-game title card: the player's side, the versus badge, then the code. */
export function BrandTitle({ brand }: { brand: Brand }) {
  return (
    <h1 className="brand-title" aria-label={brand.full}>
      <span className="brand-fighter brand-fighter--left" aria-hidden="true">{brand.left}</span>
      <span className="brand-versus" aria-hidden="true">{brand.versus}</span>
      <span className="brand-fighter brand-fighter--right" aria-hidden="true">{brand.right}</span>
    </h1>
  );
}

/** End-of-run result framed as the match the title promised. */
export function Scoreboard({ brand, won }: { brand: Brand; won: boolean }) {
  return (
    <div className="mb-6 text-center">
      <div className="flex items-center justify-center gap-3 font-sans text-lg font-black tracking-wide md:text-2xl">
        <span className="text-[#3794ff]">{brand.left}</span>
        <span className="tabular-nums text-white">{won ? 1 : 0}</span>
        <span className="text-gray-400">:</span>
        <span className="tabular-nums text-white">{won ? 0 : 1}</span>
        <span className="text-syntax-error">{brand.right}</span>
      </div>
      <p className="mt-1 font-mono text-xs text-gray-300">
        {won ? t('scoreboardWin', { left: brand.left }) : t('scoreboardLoss', { right: brand.right })}
      </p>
    </div>
  );
}
