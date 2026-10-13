import { ENEMY_TYPES, COMBO_TIMER_MAX, MAX_RICOCHET_LEVEL } from '../constants';
import { t, tUpgrade, type Lang } from '../utils/i18n';
import type { SidebarView } from '../types';
import { useGameStats, type StatsStore } from '../game/statsStore';
import { EDITOR_DOCUMENTS, EDITOR_DOCUMENT_ORDER, WORKSPACE_FOLDER, type EditorDocument } from './workbenchTypes';
import { formatNumber, formatSensitivity } from '../utils/format';
import LanguageToggle from './LanguageToggle';
interface Props {
 store: StatsStore; sidebarView: SidebarView; activeDocument: EditorDocument | null; explorerOpen: boolean; setExplorerOpen: (update: (value: boolean) => boolean) => void;
 openDocument: (document: EditorDocument) => void; highScore: number; movementSensitivity: number;
 setMovementSensitivity: (value: number) => void; handleSoundToggle: () => void; soundMuted: boolean;
 handleLangChange: (lang: Lang) => void; lang: Lang;
}
export default function WorkbenchSidebar({store, sidebarView, activeDocument, explorerOpen, setExplorerOpen, openDocument, highScore, movementSensitivity, setMovementSensitivity, handleSoundToggle, soundMuted, handleLangChange, lang}: Props) {
 const stats = useGameStats(store, sidebarView !== 'SEARCH' && sidebarView !== 'SETTINGS');
  const renderExplorer = () => (
    <>
      <div className="px-2">
          <button
            type="button"
            className="flex w-full items-center bg-vsc-list-active px-2 py-1 text-left text-xs font-bold text-white hover:bg-vsc-list-active-hover"
            aria-expanded={explorerOpen}
            onClick={() => setExplorerOpen(previous => !previous)}
          >
             <span className="mr-2" aria-hidden="true">{explorerOpen ? '▼' : '▶'}</span> {WORKSPACE_FOLDER}
          </button>
          {explorerOpen && (
            <div className="mt-1 font-mono text-sm">
              {EDITOR_DOCUMENT_ORDER.map(document => {
                const details = EDITOR_DOCUMENTS[document];
                return (
                  <button
                    key={document}
                    type="button"
                    aria-current={activeDocument === document ? 'true' : undefined}
                    className={`flex w-full items-center py-1 pl-6 text-left ${activeDocument === document ? 'bg-vsc-list-active text-white' : 'text-gray-300 hover:bg-vsc-hover'}`}
                    onClick={() => openDocument(document)}
                  >
                    <span className="mr-2 text-xs" style={{ color: details.color }}>{details.icon}</span> {details.label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="px-4 py-2 mt-6 text-xs font-bold uppercase tracking-wider text-gray-500">{t('runDebugLabel')}</div>
          <div className="pl-4 mt-2 text-xs font-mono space-y-2">
             <div className="flex justify-between mb-1"><span>{t('scoreLabel')}</span> <span className="text-syntax-string">{formatNumber(stats.score)}</span></div>
             <div className="flex justify-between mb-1"><span>{t('bugsLabel')}</span> <span className="text-syntax-error">{stats.bugsFixed}</span></div>
             <div className="flex justify-between mb-1"><span>{t('waveLabel')}</span> <span className="text-syntax-func">v{stats.wave}.0</span></div>

             {/* COMBO METER */}
             {stats.combo > 1 && (
                 <div className="mt-4 border border-syntax-func bg-syntax-func/10 p-2 rounded animate-pulse">
                    <div className="text-syntax-func font-bold text-center text-lg">{stats.combo}x COMBO</div>
                    <div className="w-full bg-vsc-control h-1 mt-1">
                        <div className="bg-syntax-func h-full transition-all duration-75" style={{ width: `${(stats.comboTimer / COMBO_TIMER_MAX) * 100}%` }} />
                    </div>
                 </div>
             )}

             {/* RELEASE PROGRESS BAR */}
             <div className="mt-4">
                 <div className="flex justify-between text-xs mb-1">
                     <span>{t('releaseProgress')}</span>
                     <span>{stats.bossActive ? t('blocked') : `${Math.round((stats.levelProgress / stats.levelTarget) * 100)}%`}</span>
                 </div>
                 <div className="w-full bg-vsc-control h-2 rounded-full overflow-hidden">
                     <div
                        className={`h-full ${stats.bossActive ? 'bg-red-500 animate-pulse' : 'bg-syntax-type'}`}
                        style={{ width: stats.bossActive ? '100%' : `${Math.min(100, (stats.levelProgress / stats.levelTarget) * 100)}%` }}
                     />
                 </div>
                 {stats.bossActive && <div className="text-red-400 text-[10px] mt-1 font-bold">{t('bossBlockMsg')}</div>}
             </div>
          </div>
      </div>
    </>
  );

  const renderSearch = () => (
    <div className="px-4 py-2">
        <div className="text-xs font-bold uppercase text-gray-500 mb-4">{t('enemyDatabase')}</div>
        <div className="space-y-4 overflow-y-auto pr-1">
            {ENEMY_TYPES.map((e) => (
                <div key={e.type} className="border border-vsc-control p-2 rounded hover:bg-vsc-hover">
                    <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm" style={{color: e.color}}>{e.type}</span>
                        <span className="text-lg font-mono">{e.text}</span>
                    </div>
                    <div className="text-xs text-gray-400 mb-1">HP: {e.hp} | PTS: {e.score}</div>
                    <div className="text-[10px] text-gray-500">{t(e.descKey)}</div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderGit = () => (
      <div className="px-4 py-2">
          <div className="text-xs font-bold uppercase text-gray-500 mb-4">{t('commitHistory')}</div>
          <div className="space-y-2">
              <div className="flex items-center text-xs">
                  <span className="text-syntax-func mr-2">●</span>
                  <span className="text-gray-300">{t('initialCommit')}</span>
              </div>
              {Array.from({length: stats.wave - 1}).map((_, i) => (
                  <div key={i} className="flex items-start text-xs border-l border-gray-600 ml-1 pl-3 py-2">
                      <div>
                        <div className="text-white mb-1">{t('releaseLabel', { wave: i + 1 })}</div>
                        <div className="text-gray-500">{t('refactoredLines', { n: 100 + i * 50 })}</div>
                      </div>
                  </div>
              ))}
              <div className="flex items-start text-xs border-l border-dashed border-gray-500 ml-1 pl-3 py-2">
                  <div className="text-syntax-warning">{t('workingOn', { wave: stats.wave })}</div>
              </div>
          </div>
      </div>
  );

  const renderDebug = () => (
      <div className="px-4 py-2">
          <div className="text-xs font-bold uppercase text-gray-500 mb-4">{t('debugConsole')}</div>
          <div className="font-mono text-xs space-y-2 text-green-400">
              <div>{t('projectileCountLabel')} <span className="text-white">{stats.projectileCount}</span></div>
              <div>{t('frameTimeLabel')} <span className="text-white">{stats.frameTimeMs.toFixed(2)}ms</span></div>
              <div>{t('entityCountLabel')} <span className="text-white">{stats.entityCount}</span></div>
              <div>{t('updateTimeLabel')} <span className="text-white">{stats.updateTimeMs.toFixed(2)} ms</span></div>
              <div>{t('renderTimeLabel')} <span className="text-white">{stats.renderTimeMs.toFixed(2)} ms</span></div>
              <div className="h-px bg-gray-700 my-2"></div>
              <div>{t('dbgMaxCombo')} <span className="text-syntax-warning">{stats.maxCombo}</span></div>
              <div>{t('dbgLines')} <span className="text-syntax-string">{stats.linesOfCode}</span></div>
              <div>{t('dbgHighScore')} <span className="text-syntax-type">{formatNumber(highScore)}</span></div>
          </div>
      </div>
  );

  const renderExtensions = () => (
      <div className="px-4 py-2">
          <div className="text-xs font-bold uppercase text-gray-500 mb-4">{t('installedExt')}</div>
          {stats.upgradeHistory.length > 0 && <div className="mb-4 border-l-2 border-syntax-type pl-3 text-xs">
            <div className="mb-2 text-gray-400">{t('upgradeRoute')}</div>
            {[...new Set(stats.upgradeHistory)].map(id => <div key={id} className="mb-1 text-syntax-func">{tUpgrade(id, 'title')} ×{Math.min(id === 'RICOCHET' ? MAX_RICOCHET_LEVEL : Infinity, stats.upgradeHistory.filter(selected => selected === id).length)}</div>)}
          </div>}
          <div className="space-y-3">
             <div className="flex items-start p-2 bg-vsc-activity rounded hover:bg-vsc-control">
                <div className="w-8 h-8 bg-vsc-accent flex items-center justify-center text-white rounded mr-3 mt-1">TS</div>
                <div>
                   <div className="text-sm font-bold text-white">{t('extTsTitle')}</div>
                   <div className="text-xs text-gray-400">v{stats.weaponLevel}.0.0</div>
                   <div className="text-[10px] text-gray-500 mt-1">{t('extTsDesc')}</div>
                </div>
             </div>

             <div className="flex items-start p-2 bg-vsc-activity rounded hover:bg-vsc-control">
                <div className="w-8 h-8 bg-syntax-json flex items-center justify-center text-white rounded mr-3 mt-1">GC</div>
                <div>
                   <div className="text-sm font-bold text-white">{t('extGcTitle')}</div>
                   <div className="text-xs text-gray-400">{t('extGcHeap')} {Math.round(stats.ammo)}/{stats.maxAmmo}</div>
                   <div className="text-[10px] text-gray-500 mt-1">{t('extGcDesc')}</div>
                </div>
             </div>

             <div className="flex items-start p-2 bg-vsc-activity rounded hover:bg-vsc-control">
                <div className="w-8 h-8 bg-[#0db7ed] flex items-center justify-center text-white rounded mr-3 mt-1">
                   <span className="text-lg">🐳</span>
                </div>
                <div>
                   <div className="text-sm font-bold text-white">{t('extDockerTitle')}</div>
                   <div className="text-xs text-gray-400">{stats.shieldActive ? t('extDockerRunning') : t('extDockerStopped')}</div>
                   <div className="text-[10px] text-gray-500 mt-1">{t('extDockerDesc')}</div>
                </div>
             </div>

             <div className="flex items-start p-2 bg-vsc-activity rounded hover:bg-vsc-control">
                <div className="w-8 h-8 bg-syntax-control flex items-center justify-center text-white rounded mr-3 mt-1">R</div>
                <div>
                   <div className="text-sm font-bold text-white">{t('extRefactorTitle')}</div>
                   <div className="text-xs text-gray-400">{t('extRefactorCharge')} {stats.specialCharge}%</div>
                   <div className="text-[10px] text-gray-500 mt-1">{t('extRefactorDesc')}</div>
                </div>
             </div>
          </div>
      </div>
  );

  const renderSettings = () => (
      <div className="px-4 py-2 space-y-4">
          <div className="text-xs font-bold uppercase text-gray-500 mb-4">{t('playerSettings')}</div>

          {/* Movement sensitivity */}
          <div className="border border-vsc-control bg-vsc-hover rounded p-3 space-y-3">
              <div className="flex items-center justify-between text-sm">
                  <span className="text-white font-bold">{t('moveSensLabel')}</span>
                  <span className="text-syntax-type font-mono">{formatSensitivity(movementSensitivity)}</span>
              </div>
              <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.05"
                  value={movementSensitivity}
                  onChange={(e) => setMovementSensitivity(Number(e.target.value))}
                  onMouseUp={(e) => e.currentTarget.blur()}
                  onTouchEnd={(e) => e.currentTarget.blur()}
                  className="w-full accent-vsc-accent cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                  <span>{t('sensSlowLabel')}</span>
                  <span>{t('sensDefaultLabel')}</span>
                  <span>{t('sensFastLabel')}</span>
              </div>
              <div className="text-xs text-gray-400 leading-relaxed">
                  {t('sensDesc')}
              </div>
          </div>

          {/* Sound toggle */}
          <div className="border border-vsc-control bg-vsc-hover rounded p-3">
              <div className="flex items-center justify-between text-sm">
                  <span className="text-white font-bold">{t('soundLabel')}</span>
                  <button
                      type="button"
                      onClick={handleSoundToggle}
                      className={`px-3 py-1 rounded text-xs font-mono font-bold transition-colors ${
                        soundMuted
                          ? 'bg-vsc-control text-gray-400 hover:bg-vsc-muted hover:text-white'
                          : 'bg-vsc-accent text-white hover:bg-vsc-button-hover'
                      }`}
                  >
                      {soundMuted ? t('soundMutedLabel') : t('soundOnLabel')}
                  </button>
              </div>
              <div className="text-xs text-gray-400 mt-2 leading-relaxed">
                  {t('soundDesc')}
              </div>
          </div>

          {/* Language toggle */}
          <div className="border border-vsc-control bg-vsc-hover rounded p-3">
              <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-white font-bold">{t('languageLabel')}</span>
              </div>
              <LanguageToggle lang={lang} onChange={handleLangChange} stretch />
          </div>
      </div>
  );

  return (
    <>
      {sidebarView === 'EXPLORER'   && renderExplorer()}
      {sidebarView === 'SEARCH'     && renderSearch()}
      {sidebarView === 'GIT'        && renderGit()}
      {sidebarView === 'DEBUG'      && renderDebug()}
      {sidebarView === 'EXTENSIONS' && renderExtensions()}
      {sidebarView === 'SETTINGS'   && renderSettings()}
    </>
  );
}
