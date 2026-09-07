import { GameState, type GameStats, type UpgradeId, type UpgradeOption } from '../types';
import { t, tUpgrade, type Lang } from '../utils/i18n';
import RunReport from './RunReport';
import vscodeLogo from '../vscode.png';
interface Props { lang: Lang; handleLangChange: (lang: Lang) => void; gameState: GameState; stats: GameStats; embedded: boolean; embeddedBrandName: string; highScore: number; newRecord: boolean; movementSensitivity: number; startFreshRun: () => void; handleSelectUpgrade: (id: UpgradeId) => void }
export default function GameOverlays({lang, handleLangChange, gameState, stats, embedded, embeddedBrandName, highScore, newRecord, movementSensitivity, startFreshRun, handleSelectUpgrade}: Props) {
 const formatNumber = (value: number) => value.toLocaleString();
 const formatSensitivity = (value: number) => `${value.toFixed(2)}x`;
 return <>
            {/* Start Screen Overlay */}
            {gameState === GameState.START && (
              <div className="start-overlay absolute inset-0 z-50 flex flex-col items-center justify-start overflow-y-auto bg-[#1e1e1e]/95 px-4 py-5 sm:justify-center">
                 <div className="mb-2 transform transition-transform duration-500 hover:scale-110 md:mb-8">
                    {embedded ? (
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-[#4ec9b0] bg-[#12332f] font-mono text-xl font-black text-[#4ec9b0] shadow-lg shadow-[#4ec9b0]/10 md:h-24 md:w-24 md:text-3xl">
                        {'</>'}
                      </div>
                    ) : (
                      <img src={vscodeLogo} alt="VS Code" className="h-16 w-16 md:h-24 md:w-24" />
                    )}
                 </div>
                  <h1 className="mb-2 text-center font-sans text-2xl font-bold tracking-tight text-[#007acc] md:text-4xl">{embedded ? embeddedBrandName : t('appTitle')}</h1>
                 <p className="text-[#ce9178] mb-2 font-mono text-sm">{embedded ? 'Extension Preview 0.1.0' : t('appVersion')}</p>

                 {/* Language toggle on start screen */}
                 <div className="flex gap-2 mb-4">
                   <button
                     onClick={() => handleLangChange('en')}
                     className={`px-3 py-1 rounded text-xs font-mono transition-colors ${lang === 'en' ? 'bg-[#007acc] text-white' : 'bg-[#3c3c3c] text-gray-400 hover:text-white'}`}
                   >{t('langEnBtn')}</button>
                   <button
                     onClick={() => handleLangChange('zh')}
                     className={`px-3 py-1 rounded text-xs font-mono transition-colors ${lang === 'zh' ? 'bg-[#007acc] text-white' : 'bg-[#3c3c3c] text-gray-400 hover:text-white'}`}
                   >{t('langZhBtn')}</button>
                 </div>

                 {/* High score display */}
                 {highScore > 0 && (
                   <div className="mb-6 font-mono text-sm text-center">
                     <span className="text-gray-500">{t('bestLabel')}: </span>
                     <span className="text-[#4ec9b0] font-bold">{formatNumber(highScore)}</span>
                   </div>
                 )}

                 <div className="mobile-start-guide mb-4 w-full max-w-sm border-y border-[#3c3c3c] py-3 text-center text-sm leading-6 text-gray-300 sm:hidden">
                    <span className="text-[#569cd6]">D-PAD</span> {t('ctrlMove')}
                    <span className="mx-2 text-gray-600">·</span>
                    <span className="text-[#9cdcfe]">&lt;/&gt;</span> {t('ctrlShoot')}
                    <br />
                    <span className="text-[#c586c0]">R</span> {t('ctrlRefactor')}
                    <span className="mx-2 text-gray-600">·</span>
                    <span className="text-[#dcdcaa]">Ⅱ</span> {t('ctrlPause')}
                 </div>

                 <div className="desktop-start-guide mb-5 hidden max-w-2xl grid-cols-1 gap-3 text-sm text-gray-400 sm:grid sm:grid-cols-2 sm:gap-12 md:mb-8">
                    <div className="border-b border-gray-600 pb-3 text-left sm:border-b-0 sm:border-r sm:pr-8 sm:text-right">
                        <h3 className="font-bold text-white mb-2 text-lg">{t('controlsTitle')}</h3>
                        <p className="mb-1"><span className="text-[#569cd6]">WASD</span> : {t('ctrlMove')}</p>
                        <p className="mb-1"><span className="text-[#4ec9b0]">{t('ctrlSens')}</span> : {formatSensitivity(movementSensitivity)}</p>
                        <p className="mb-1"><span className="text-[#569cd6]">SPACE</span> : {t('ctrlShoot')}</p>
                        <p className="mb-1"><span className="text-[#4ec9b0]">SHIFT / R</span> : {t('ctrlRefactor')}</p>
                        <p className="mb-1"><span className="text-gray-500">ESC</span> : {t('ctrlPause')}</p>
                    </div>
                    <div className="sm:pl-4">
                        <h3 className="font-bold text-white mb-2 text-lg">{t('featuresTitle')}</h3>
                        <p className="mb-1">🧩 <span className="text-[#dcdcaa]">{t('feat1')}</span></p>
                        <p className="mb-1">🗺️ <span className="text-[#ce9178]">{t('feat2')}</span></p>
                        <p className="mb-1">⚡ <span className="text-[#007acc]">{t('feat3')}</span></p>
                        <p className="mb-1">🩹 <span className="text-[#81b88b]">{t('feat4')}</span></p>
                        <p className="mb-1">📦 <span className="text-[#C586C0]">{t('feat5')}</span></p>
                    </div>
                 </div>

                 <button
                   onClick={startFreshRun}
                   className="min-h-12 px-8 py-3 bg-[#0e639c] hover:bg-[#1177bb] text-white font-semibold rounded-sm shadow-lg transition-colors"
                 >
                   {t('startBtn')}
                 </button>
              </div>
            )}

            {/* Game Over Overlay */}
            {gameState === GameState.GAME_OVER && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-start overflow-y-auto bg-[#750e0e]/95 p-4 pt-8 animate-in fade-in duration-300 sm:justify-center sm:pt-4">
                 <h1 className="mb-2 text-center text-4xl font-bold text-white md:text-6xl">{t('buildFailed')}</h1>
                 <p className="text-red-200 mb-8 font-mono text-xl">
                    <span className="text-gray-400">{t('exitCode')}</span> 1
                 </p>

                 <div className="mb-5 w-full max-w-2xl rounded-md border border-red-500 bg-[#1e1e1e] p-4 font-mono text-xs shadow-2xl md:mb-8 md:w-3/4 md:p-6">
                    <p className="text-red-400 mb-2">{t('errorAt', { wave: stats.wave })}</p>
                    <RunReport stats={stats} />
                    <div className="mt-4 border-t border-gray-700 pt-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-right text-gray-400">{t('finalScore')}</div>
                            <div className="text-[#ce9178] font-bold">{formatNumber(stats.score)}</div>

                            <div className="text-right text-gray-400">{t('highScore')}</div>
                            <div className={`font-bold ${newRecord ? 'text-[#4ec9b0]' : 'text-gray-300'}`}>
                              {formatNumber(highScore)}
                              {newRecord && <span className="ml-2 text-[10px] bg-[#4ec9b0]/20 border border-[#4ec9b0] px-1 py-0.5 rounded animate-pulse">{t('newRecord')}</span>}
                            </div>

                            <div className="text-right text-gray-400">{t('maxCombo')}</div>
                            <div className="text-[#dcdcaa] font-bold">{stats.maxCombo}x</div>

                            <div className="text-right text-gray-400">{t('bugsFixed')}</div>
                            <div className="text-[#b5cea8] font-bold">{stats.bugsFixed}</div>
                        </div>
                    </div>
                 </div>

                 <button
                   onClick={startFreshRun}
                   className="px-6 py-3 bg-[#28a745] hover:bg-[#2fb950] text-white font-semibold rounded-sm shadow-lg"
                 >
                   {t('restartBtn')}
                 </button>
              </div>
            )}

            {/* Wave Upgrade Overlay */}
            {gameState === GameState.UPGRADE && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-start overflow-y-auto bg-black/80 p-3 pt-5 sm:justify-center sm:p-4">
                 <div className="mb-4 text-center sm:mb-6">
                   <div className="text-[#4ec9b0] text-xs font-mono mb-1 uppercase tracking-widest">{t('waveDeployed', { wave: stats.wave - 1 })}</div>
                   <h2 className="text-3xl font-bold text-white mb-1">{t('chooseUpgrade')}</h2>
                    <p className="text-gray-400 text-sm font-mono">{t('upgradeSubtitle')}</p>
                    <p className="mt-2 text-xs font-mono text-[#4ec9b0]">{t('waveGrowthSummary')}</p>
                 </div>

                 <div className="flex w-full max-w-3xl flex-col gap-3 px-2 sm:flex-row sm:gap-4 sm:px-6">
                   {stats.pendingUpgrades.map((opt: UpgradeOption) => (
                     <button
                       key={opt.id}
                       onClick={() => handleSelectUpgrade(opt.id)}
                       className="min-h-20 flex-1 border border-[#3c3c3c] bg-[#252526] hover:bg-[#2a2d2e] hover:border-[#007acc] rounded p-3 text-left transition-all group sm:p-4"
                     >
                       <div className="mb-1 text-2xl sm:mb-3 sm:text-3xl">{opt.icon}</div>
                       <div className="text-[#007acc] font-bold text-sm mb-1 group-hover:text-white transition-colors">{tUpgrade(opt.id, 'title')}</div>
                       <div className="text-gray-400 text-xs leading-relaxed">{tUpgrade(opt.id, 'desc')}</div>
                     </button>
                   ))}
                 </div>

                 <p className="mt-4 text-gray-600 text-xs font-mono sm:mt-6">{t('clickToConfirm')}</p>
               </div>
             )}
 </>;
}
