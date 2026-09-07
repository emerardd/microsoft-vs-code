import type { GameStats } from '../types';
import { t, tUpgrade } from '../utils/i18n';

export default function RunReport({ stats }: { stats: GameStats }) {
  const sourceLabel = (source: string) => source.startsWith('projectile:') ? `${source.slice(11)} (${t('projectileCountLabel')})` : source;
  const damage = Object.entries(stats.damageTaken).sort((a, b) => b[1] - a[1]);
  return <section className="mt-4 border-t border-[#454545] pt-4 text-xs" aria-label={t('runReport')}>
    <h2 className="mb-3 text-sm font-semibold text-[#9cdcfe]">{t('runReport')}</h2>
    <dl className="grid grid-cols-2 gap-2">
      <dt className="text-gray-400">{t(stats.outcome === 'victory' ? 'victoryTime' : 'survivalTime')}</dt><dd>{Math.floor(stats.elapsedMs / 60000)}:{String(Math.floor(stats.elapsedMs / 1000) % 60).padStart(2, '0')}</dd>
      {stats.outcome !== 'victory' && <><dt className="text-gray-400">{t('deathCause')}</dt><dd className="break-words text-[#f48771]">{sourceLabel(stats.deathCause) || '—'}</dd></>}
      <dt className="text-gray-400">{t('wavesClearedLabel')}</dt><dd>{stats.wavesCleared}/5</dd>
      <dt className="text-gray-400">{t('mainDamage')}</dt><dd className="break-words">{damage.length ? `${sourceLabel(damage[0][0])} · ${Math.round(damage[0][1])} HP` : '—'}</dd>
    </dl>
    <h3 className="mb-2 mt-4 text-gray-400">{t('upgradeRoute')}</h3>
    <p className="break-words leading-6 text-[#dcdcaa]">{stats.upgradeHistory.map(id => tUpgrade(id, 'title')).join(' → ') || t('noUpgrades')}</p>
    <p className="mt-3 leading-5 text-gray-400">{t(damage[0]?.[0] && ['BUG', 'SYNTAX_ERROR', 'MONOLITH', 'SPAGHETTI', 'ERROR_404', 'MEMORY_LEAK', 'MERGE_CONFLICT', 'INFINITE_LOOP', 'RACE_CONDITION'].includes(damage[0][0]) ? 'contactTip' : 'projectileTip')}</p>
  </section>;
}
