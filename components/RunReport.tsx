import type { GameStats } from '../types';
import { ENEMY_TYPES } from '../constants';
import { RUN_WAVES } from '../game/runPlan';
import { formatDuration } from '../utils/format';
import { t, tUpgrade } from '../utils/i18n';

/** Contact damage is recorded under the bare enemy type; projectile damage is prefixed. */
const CONTACT_SOURCES = new Set<string>(ENEMY_TYPES.map(enemy => enemy.type));

export default function RunReport({ stats }: { stats: GameStats }) {
  const sourceLabel = (source: string) => source.startsWith('projectile:') ? `${source.slice(11)} (${t('projectileCountLabel')})` : source;
  const damage = Object.entries(stats.damageTaken).sort((a, b) => b[1] - a[1]);
  return <section className="mt-4 border-t border-vsc-widget pt-4 text-xs" aria-label={t('runReport')}>
    <h2 className="mb-3 text-sm font-semibold text-syntax-variable">{t('runReport')}</h2>
    <dl className="grid grid-cols-2 gap-2">
      <dt className="text-gray-400">{t(stats.outcome === 'victory' ? 'victoryTime' : 'survivalTime')}</dt><dd>{formatDuration(stats.elapsedMs)}</dd>
      {stats.outcome !== 'victory' && <><dt className="text-gray-400">{t('deathCause')}</dt><dd className="break-words text-[#f48771]">{sourceLabel(stats.deathCause) || '—'}</dd></>}
      <dt className="text-gray-400">{t('wavesClearedLabel')}</dt><dd>{stats.wavesCleared}/{RUN_WAVES}</dd>
      <dt className="text-gray-400">{t('mainDamage')}</dt><dd className="break-words">{damage.length ? `${sourceLabel(damage[0][0])} · ${Math.round(damage[0][1])} HP` : '—'}</dd>
    </dl>
    <h3 className="mb-2 mt-4 text-gray-400">{t('upgradeRoute')}</h3>
    <p className="break-words leading-6 text-syntax-func">{stats.upgradeHistory.map(id => tUpgrade(id, 'title')).join(' → ') || t('noUpgrades')}</p>
    <p className="mt-3 leading-5 text-gray-400">{t(damage[0] && CONTACT_SOURCES.has(damage[0][0]) ? 'contactTip' : 'projectileTip')}</p>
  </section>;
}
