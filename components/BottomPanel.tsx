import { useEffect, useRef } from 'react';
import { t } from '../utils/i18n';
import { formatNumber, getProblemCounts } from '../utils/format';
import { BOTTOM_PANELS, type BottomPanel as BottomPanelId } from './workbenchTypes';
import { useGameStats, type StatsStore } from '../game/statsStore';

interface Props {
  store: StatsStore;
  activePanel: BottomPanelId;
  onSelect: (panel: BottomPanelId) => void;
  terminalLogs: string[];
}

export default function BottomPanel({ store, activePanel, onSelect, terminalLogs }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll the panel itself; scrollIntoView would also drag every scrollable ancestor along.
  useEffect(() => {
    const element = scrollRef.current;
    if (element && activePanel === 'TERMINAL') element.scrollTop = element.scrollHeight;
  }, [terminalLogs, activePanel]);

  return (
    <section className="bottom-panel hidden h-40 shrink-0 flex-col border-t border-vsc-panel bg-vsc-editor md:flex">
      <div role="tablist" className="flex border-b border-vsc-panel px-4 pt-2 text-xs">
        {BOTTOM_PANELS.map(({ id, label }) => (
          <button
            type="button"
            role="tab"
            aria-selected={activePanel === id}
            key={id}
            className={`mr-6 border-b pb-1.5 text-[10px] uppercase tracking-wide hover:text-white ${
              activePanel === id ? 'border-vsc-accent text-white' : 'border-transparent text-gray-400'
            }`}
            onClick={() => onSelect(id)}
          >
            {t(label)}
            {id === 'PROBLEMS' && <ProblemBadge store={store} />}
          </button>
        ))}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 font-mono text-xs text-gray-300">
        <PanelContent store={store} activePanel={activePanel} terminalLogs={terminalLogs} />
      </div>
    </section>
  );
}

function ProblemBadge({ store }: { store: StatsStore }) {
  const { errors, warnings } = getProblemCounts(useGameStats(store));
  return <span className="ml-1 rounded-full bg-vsc-control px-1.5 py-0.5 text-[10px] text-gray-200">{errors + warnings}</span>;
}

function PanelContent({ store, activePanel, terminalLogs }: { store: StatsStore; activePanel: BottomPanelId; terminalLogs: string[] }) {
  const stats = useGameStats(store, activePanel !== 'TERMINAL');

  if (activePanel === 'PROBLEMS') {
    const { errors, warnings } = getProblemCounts(stats);
    if (errors + warnings === 0) {
      return <div className="flex h-full items-center px-4 text-syntax-type">✓ {t('problemsClear')}</div>;
    }
    return (
      <div className="flex items-start gap-2 border-b border-vsc-tab px-2 py-1">
        <span className={errors ? 'text-syntax-error' : 'text-syntax-warning'}>{errors ? '⊗' : '⚠'}</span>
        <div>
          <div className="text-gray-200">{errors ? t('problemsBoss') : t('problemsRemaining', { n: warnings })}</div>
          <div className="text-[10px] text-gray-500">game_loop.ts · {t('problemsHint')}</div>
        </div>
      </div>
    );
  }

  if (activePanel === 'DEBUG') {
    return (
      <div className="grid grid-cols-2 gap-x-8 gap-y-1 p-1 sm:grid-cols-4">
        <div><span className="text-gray-500">FPS</span><div className="text-syntax-type">{stats.fps}</div></div>
        <div><span className="text-gray-500">{t('dbgMaxCombo')}</span><div className="text-syntax-func">{stats.maxCombo}x</div></div>
        <div><span className="text-gray-500">{t('extGcHeap')}</span><div className="text-syntax-variable">{Math.round(stats.ammo)}/{stats.maxAmmo}</div></div>
        <div><span className="text-gray-500">{t('extRefactorCharge')}</span><div className="text-syntax-control">{stats.specialCharge}%</div></div>
      </div>
    );
  }

  if (activePanel === 'OUTPUT') {
    return (
      <div className="space-y-1">
        <div><span className="text-syntax-type">[game]</span> {t('outputRuntimeReady')}</div>
        <div><span className="text-syntax-keyword">[wave]</span> {t('outputWave', { wave: stats.wave })}</div>
        <div><span className="text-syntax-func">[stats]</span> {t('outputStats', { score: formatNumber(stats.score), bugs: stats.bugsFixed })}</div>
        <div><span className="text-syntax-control">[input]</span> {t('outputInput')}</div>
      </div>
    );
  }

  return (
    <>
      {terminalLogs.length === 0 && <div className="mb-1 text-gray-500">{t('terminalIdle')}</div>}
      {terminalLogs.map((log, i) => (
        <div key={`${log}-${i}`} className="mb-0.5">
          <span className="mr-2 text-green-500">➜</span>
          <span className="opacity-80">{log}</span>
        </div>
      ))}
      <div className="mt-1 animate-pulse text-vsc-accent">▍</div>
    </>
  );
}
