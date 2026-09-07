import type { RefObject } from 'react';
import { t } from '../utils/i18n';
import type { BottomPanel } from './workbenchTypes';
import { useGameStats, type StatsStore } from '../game/statsStore';
interface Props { store: StatsStore; activeBottomPanel: BottomPanel; terminalLogs: string[]; logsEndRef: RefObject<HTMLDivElement | null> }
export default function BottomPanelContent({store, activeBottomPanel, terminalLogs, logsEndRef}: Props) {
 const stats = useGameStats(store);
 const formatNumber = (value: number) => value.toLocaleString();

    const problemCount = Math.max(0, 10 - stats.bugsFixed);

    if (activeBottomPanel === 'PROBLEMS') {
      return problemCount === 0 ? (
        <div className="flex h-full items-center px-4 text-[#4ec9b0]">✓ {t('problemsClear')}</div>
      ) : (
        <div className="space-y-1 p-2">
          <div className="flex items-start gap-2 border-b border-[#2d2d2d] px-2 py-1">
            <span className="text-[#cca700]">⚠</span>
            <div>
              <div className="text-gray-200">{t('problemsRemaining', { n: problemCount })}</div>
              <div className="text-[10px] text-gray-500">game_loop.ts · {t('problemsHint')}</div>
            </div>
          </div>
        </div>
      );
    }

    if (activeBottomPanel === 'DEBUG') {
      return (
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 p-3 sm:grid-cols-4">
          <div><span className="text-gray-500">FPS</span><div className="text-[#4ec9b0]">{stats.fps}</div></div>
          <div><span className="text-gray-500">{t('dbgMaxCombo')}</span><div className="text-[#dcdcaa]">{stats.maxCombo}x</div></div>
          <div><span className="text-gray-500">{t('extGcHeap')}</span><div className="text-[#9cdcfe]">{Math.round(stats.ammo)}/{stats.maxAmmo}</div></div>
          <div><span className="text-gray-500">{t('extRefactorCharge')}</span><div className="text-[#c586c0]">{stats.specialCharge}%</div></div>
        </div>
      );
    }

    if (activeBottomPanel === 'OUTPUT') {
      return (
        <div className="space-y-1 p-2">
          <div><span className="text-[#4ec9b0]">[game]</span> {t('outputRuntimeReady')}</div>
          <div><span className="text-[#569cd6]">[wave]</span> {t('outputWave', { wave: stats.wave })}</div>
          <div><span className="text-[#dcdcaa]">[stats]</span> {t('outputStats', { score: formatNumber(stats.score), bugs: stats.bugsFixed })}</div>
          <div><span className="text-[#c586c0]">[input]</span> {t('outputInput')}</div>
        </div>
      );
    }

    return (
      <>
        {terminalLogs.length === 0 && (
          <div className="mb-1 text-gray-500">{t('terminalIdle')}</div>
        )}
        {terminalLogs.map((log, i) => (
          <div key={`${log}-${i}`} className="mb-0.5">
            <span className="mr-2 text-green-500">➜</span>
            <span className="opacity-80">{log}</span>
          </div>
        ))}
        <div ref={logsEndRef} />
        <div className="mt-1 animate-pulse text-[#007acc]">▍</div>
      </>
    );
  }

export function ProblemCount({ store }: { store: StatsStore }) {
  const stats = useGameStats(store);
  return <>{Math.max(0, 10 - stats.bugsFixed)}</>;
}
