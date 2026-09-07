import { t, type Lang } from '../utils/i18n';
import { useGameStats, type StatsStore } from '../game/statsStore';
import type { SidebarView } from '../types';
import type { BottomPanel } from './workbenchTypes';
interface Props { store: StatsStore; openBottomPanel: (panel: BottomPanel) => void; handleSidebarSelect: (view: SidebarView) => void; setWorkbenchNotice: (text: string) => void; movementSensitivity: number; lang: Lang; handleSoundToggle: () => void; soundMuted: boolean }
export default function StatusBar({store, openBottomPanel, handleSidebarSelect, setWorkbenchNotice, movementSensitivity, lang, handleSoundToggle, soundMuted}: Props) {
 const stats = useGameStats(store);
 const formatSensitivity = (value: number) => `${value.toFixed(2)}x`;
 return (
      <div className="status-bar absolute bottom-0 left-0 right-0 bg-[#007acc] text-white flex items-center text-xs px-2 sm:px-3 justify-between z-50 cursor-default">
        <div className="flex items-center gap-2 sm:gap-4">
          <button type="button" className="flex items-center rounded px-1 hover:bg-white/20" title={t('statusErrors')} onClick={() => openBottomPanel('PROBLEMS')}><span className="mr-1">⊗</span> 0</button>
          <button type="button" className="flex items-center rounded px-1 hover:bg-white/20" title={t('statusWarnings')} onClick={() => openBottomPanel('PROBLEMS')}><span className="mr-1">⚠</span> {Math.max(0, 10 - stats.bugsFixed)}</button>
          <button type="button" className="hidden items-center rounded px-1 hover:bg-white/20 min-[360px]:flex" title={t('statusBranch')} onClick={() => handleSidebarSelect('GIT')}>main*</button>
        </div>
        <div className="flex items-center gap-1 sm:gap-4">
          <button
            type="button"
            className="hidden rounded px-1 hover:bg-white/20 sm:inline"
            title={t('statusPosition')}
            onClick={() => setWorkbenchNotice(t('noticePosition', { lines: stats.linesOfCode, bugs: stats.bugsFixed }))}
          >
            Ln {stats.linesOfCode}, Col {stats.bugsFixed}
          </button>
          <button type="button" className="hidden rounded px-1 hover:bg-white/20 lg:inline" title={t('statusMovement')} onClick={() => handleSidebarSelect('SETTINGS')}>Move {formatSensitivity(movementSensitivity)}</button>
          <button type="button" className="hidden rounded px-1 hover:bg-white/20 lg:inline" title={t('statusHeap')} onClick={() => handleSidebarSelect('DEBUG')}>{t('entityCountLabel')}: {stats.entityCount}</button>
          <button
            type="button"
            className="hidden rounded px-1 hover:bg-white/20 sm:inline"
            title={t('statusEncoding')}
            onClick={() => setWorkbenchNotice(t('noticeEncoding'))}
          >
            UTF-8
          </button>
          <button type="button" className="hidden rounded px-1 hover:bg-white/20 min-[360px]:inline" title={t('statusFps')} onClick={() => openBottomPanel('DEBUG')}>{stats.fps} FPS</button>
          <button
            type="button"
            className="flex items-center px-1 hover:bg-white/20"
            onClick={() => handleSidebarSelect('SETTINGS')}
            title={t('statusLang')}
          >
             🌐 {lang.toUpperCase()}
          </button>
          <button
            type="button"
            className="flex items-center px-1 hover:bg-white/20"
            onClick={handleSoundToggle}
            title={soundMuted ? t('statusUnmute') : t('statusMute')}
          >
             <span className="mr-1" aria-hidden="true">{soundMuted ? '🔇' : '🔔'}</span>
          </button>
        </div>
      </div>

 );
}
