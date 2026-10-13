import type { ReactNode } from 'react';
import LoadoutSelection from './LoadoutSelection';
import { emptyProfile, type MetaProfile, type Loadout } from '../game/metaProgression';
import { GameState, type GameStats, type UpgradeId } from '../types';
import { t, tUpgrade, type Lang } from '../utils/i18n';
import { formatNumber } from '../utils/format';
import type { Brand } from '../utils/brand';
import RunReport from './RunReport';
import LanguageToggle from './LanguageToggle';
import { BrandTitle, Scoreboard } from './Brand';
import vscodeLogo from '../vscode.png';

interface Props {
  profile?: MetaProfile;
  loadout?: Loadout;
  onLoadoutChange?: (loadout: Loadout) => void;
  profileSaveFailed?: boolean;
  lang: Lang;
  handleLangChange: (lang: Lang) => void;
  gameState: GameState;
  stats: GameStats;
  embedded: boolean;
  brand: Brand;
  highScore: number;
  newRecord: boolean;
  startFreshRun: () => void;
  handleSelectUpgrade: (id: UpgradeId) => void;
  /** Wave of a restored checkpoint waiting for the player to continue, if any. */
  checkpointWave?: number | null;
  onContinueCheckpoint?: () => void;
}

export default function GameOverlays({
  profile = emptyProfile(), loadout = 'standard', onLoadoutChange = () => {}, profileSaveFailed = false,
  lang, handleLangChange, gameState, stats, embedded, brand, highScore, newRecord, startFreshRun, handleSelectUpgrade,
  checkpointWave = null, onContinueCheckpoint,
}: Props) {
  const finished = gameState === GameState.GAME_OVER || gameState === GameState.VICTORY;
  return (
    <>
      {profileSaveFailed && <p role="alert" className="absolute bottom-2 left-2 right-2 z-[60] bg-[#5a3300] p-2 text-xs text-white">{t('profileSaveFailed')}</p>}
      {checkpointWave !== null && gameState === GameState.PAUSED && (
        <CheckpointBanner wave={checkpointWave} onContinue={onContinueCheckpoint} />
      )}
      {gameState === GameState.START && (
        <StartScreen
          brand={brand} embedded={embedded} lang={lang} handleLangChange={handleLangChange} highScore={highScore}
          profile={profile} loadout={loadout} onLoadoutChange={onLoadoutChange} startFreshRun={startFreshRun}
        />
      )}
      {finished && (
        <RunEndScreen
          won={gameState === GameState.VICTORY} brand={brand} stats={stats} highScore={highScore} newRecord={newRecord}
          profile={profile} loadout={loadout} onLoadoutChange={onLoadoutChange} startFreshRun={startFreshRun}
        />
      )}
      {gameState === GameState.UPGRADE && <UpgradeScreen stats={stats} onSelect={handleSelectUpgrade} />}
    </>
  );
}

function CheckpointBanner({ wave, onContinue }: { wave: number; onContinue?: () => void }) {
  return (
    <div className="absolute left-1/2 top-24 z-40 w-[min(26rem,calc(100%-2rem))] -translate-x-1/2 border border-syntax-type border-l-4 bg-vsc-sidebar p-4 text-center text-sm shadow-2xl">
      <p className="mb-3">{t('checkpointRestored', { wave })}</p>
      <button type="button" className="bg-vsc-button px-4 py-2 text-white hover:bg-vsc-button-hover" onClick={onContinue}>{t('continueRun')}</button>
    </div>
  );
}

interface LoadoutProps { profile: MetaProfile; loadout: Loadout; onLoadoutChange: (loadout: Loadout) => void; startFreshRun: () => void }

function StartScreen({ brand, embedded, lang, handleLangChange, highScore, profile, loadout, onLoadoutChange, startFreshRun }: LoadoutProps & {
  brand: Brand; embedded: boolean; lang: Lang; handleLangChange: (lang: Lang) => void; highScore: number;
}) {
  return (
    <div className="start-overlay absolute inset-0 z-50 flex flex-col items-center justify-start overflow-y-auto bg-vsc-editor/95 px-4 pt-5">
      <div className="mb-3 md:mb-5">
        {embedded ? (
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-syntax-type bg-[#12332f] font-mono text-xl font-black text-syntax-type shadow-lg shadow-syntax-type/10 md:h-20 md:w-20 md:text-2xl">
            {'</>'}
          </div>
        ) : (
          <img src={vscodeLogo} alt="" className="h-14 w-14 md:h-20 md:w-20" />
        )}
      </div>
      <BrandTitle brand={brand} />
      <p className="mb-1 mt-2 text-center font-mono text-xs text-gray-400">{t('brandTagline')}</p>
      <p className="mb-4 font-mono text-xs text-syntax-string">{embedded ? 'Extension Preview 0.1.0' : t('appVersion')}</p>

      <div className="mb-4"><LanguageToggle lang={lang} onChange={handleLangChange} /></div>

      {highScore > 0 && (
        <div className="mb-4 text-center font-mono text-sm">
          <span className="text-gray-500">{t('bestLabel')}: </span>
          <span className="font-bold text-syntax-type">{formatNumber(highScore)}</span>
        </div>
      )}

      <div className="mobile-start-guide mb-4 w-full max-w-sm border-y border-vsc-control py-3 text-center text-sm leading-6 text-gray-300 sm:hidden">
        <span className="text-syntax-keyword">D-PAD</span> {t('ctrlMove')}
        <span className="mx-2 text-gray-600">·</span>
        <span className="text-syntax-variable">&lt;/&gt;</span> {t('ctrlShoot')}
        <br />
        <span className="text-syntax-control">R</span> {t('ctrlRefactor')}
        <span className="mx-2 text-gray-600">·</span>
        <span className="text-syntax-func">Ⅱ</span> {t('ctrlPause')}
      </div>

      <p className="mb-3 text-center text-sm text-syntax-string">{t('runGoal')}</p>
      <p className="mb-3 hidden text-center text-xs text-gray-400 sm:block">
        <Kbd>WASD</Kbd> {t('ctrlMove')} · <Kbd>Space</Kbd> {t('ctrlShoot')} · <Kbd>R</Kbd> {t('ctrlRefactor')} · <Kbd>Esc</Kbd> {t('ctrlPause')}
      </p>
      <LoadoutSelection profile={profile} selected={loadout} onChange={onLoadoutChange} />

      <StickyAction fade="from-vsc-editor via-vsc-editor/90">
        <button
          type="button"
          onClick={startFreshRun}
          className="min-h-12 rounded-sm bg-vsc-button px-8 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-vsc-button-hover"
        >
          {t('startBtn')}
        </button>
      </StickyAction>
    </div>
  );
}

function RunEndScreen({ won, brand, stats, highScore, newRecord, profile, loadout, onLoadoutChange, startFreshRun }: LoadoutProps & {
  won: boolean; brand: Brand; stats: GameStats; highScore: number; newRecord: boolean;
}) {
  return (
    <div className={`absolute inset-0 z-50 flex flex-col items-center justify-start overflow-y-auto px-4 pt-8 ${won ? 'bg-[#12332f]/95' : 'bg-[#750e0e]/95'}`}>
      <h1 className="mb-2 text-center text-4xl font-bold text-white md:text-6xl">{t(won ? 'runVictory' : 'buildFailed')}</h1>
      <p className="mb-4 font-mono text-xl text-red-200">
        <span className="text-gray-400">{t('exitCode')}</span> {won ? 0 : 1}
      </p>
      <Scoreboard brand={brand} won={won} />

      <div className={`mb-5 w-full max-w-2xl rounded-md border bg-vsc-editor p-4 font-mono text-xs shadow-2xl md:mb-8 md:w-3/4 md:p-6 ${won ? 'border-syntax-type' : 'border-red-500'}`}>
        <p className={`mb-2 ${won ? 'text-syntax-type' : 'text-red-400'}`}>{won ? t('runComplete') : t('errorAt', { wave: stats.wave })}</p>
        <RunReport stats={stats} />
        <div className="mt-4 border-t border-gray-700 pt-4">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <dt className="text-right text-gray-400">{t('finalScore')}</dt>
            <dd className="font-bold text-syntax-string">{formatNumber(stats.score)}</dd>

            <dt className="text-right text-gray-400">{t('highScore')}</dt>
            <dd className={`font-bold ${newRecord ? 'text-syntax-type' : 'text-gray-300'}`}>
              {formatNumber(highScore)}
              {newRecord && <span className="ml-2 animate-pulse rounded border border-syntax-type bg-syntax-type/20 px-1 py-0.5 text-[10px]">{t('newRecord')}</span>}
            </dd>

            <dt className="text-right text-gray-400">{t('maxCombo')}</dt>
            <dd className="font-bold text-syntax-func">{stats.maxCombo}x</dd>

            <dt className="text-right text-gray-400">{t('bugsFixed')}</dt>
            <dd className="font-bold text-syntax-number">{stats.bugsFixed}</dd>
          </dl>
        </div>
      </div>

      <LoadoutSelection profile={profile} selected={loadout} onChange={onLoadoutChange} />
      <StickyAction fade={won ? 'from-[#12332f] via-[#12332f]/90' : 'from-[#750e0e] via-[#750e0e]/90'}>
        <button
          type="button"
          onClick={startFreshRun}
          className="rounded-sm bg-[#28a745] px-6 py-3 font-semibold text-white shadow-lg hover:bg-[#2fb950]"
        >
          {t('restartBtn')}
        </button>
      </StickyAction>
    </div>
  );
}

function UpgradeScreen({ stats, onSelect }: { stats: GameStats; onSelect: (id: UpgradeId) => void }) {
  const opening = stats.wave === 1;
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-start overflow-y-auto bg-black/80 p-3 pt-5 sm:justify-center sm:p-4">
      <div className="mb-4 text-center sm:mb-6">
        <div className="mb-1 font-mono text-xs uppercase tracking-widest text-syntax-type">{opening ? t('openingUpgrade') : t('waveDeployed', { wave: stats.wave - 1 })}</div>
        <h2 className="mb-1 text-3xl font-bold text-white">{t('chooseUpgrade')}</h2>
        <p className="font-mono text-sm text-gray-400">{opening ? t('openingUpgradeHint') : t('upgradeSubtitle')}</p>
        {!opening && <p className="mt-2 font-mono text-xs text-syntax-type">{t('waveGrowthSummary')}</p>}
      </div>

      <div className="flex w-full max-w-3xl flex-col gap-3 px-2 sm:flex-row sm:gap-4 sm:px-6">
        {stats.pendingUpgrades.map(option => (
          <button
            type="button"
            data-testid="upgrade-choice"
            key={option.id}
            onClick={() => onSelect(option.id)}
            className="group min-h-20 flex-1 rounded border border-vsc-control bg-vsc-sidebar p-3 text-left transition-all hover:-translate-y-0.5 hover:border-vsc-accent hover:bg-vsc-hover sm:p-4"
          >
            <div className="mb-1 text-2xl sm:mb-3 sm:text-3xl">{option.icon}</div>
            <div className="mb-1 text-sm font-bold text-vsc-accent transition-colors group-hover:text-white">{tUpgrade(option.id, 'title')}</div>
            <div className="text-xs leading-relaxed text-gray-400">{tUpgrade(option.id, 'desc')}</div>
          </button>
        ))}
      </div>

      <p className="mt-4 font-mono text-xs text-gray-600 sm:mt-6">{t('clickToConfirm')}</p>
    </div>
  );
}

/** Keeps the primary action reachable at the bottom of long, scrolling overlays on phones. */
function StickyAction({ children, fade }: { children: ReactNode; fade: string }) {
  return <div className={`sticky bottom-0 z-10 mt-3 flex w-full shrink-0 justify-center bg-gradient-to-t via-60% to-transparent pb-4 pt-6 ${fade}`}>{children}</div>;
}

function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-vsc-widget bg-vsc-control px-1.5 py-0.5 font-mono text-[10px] text-gray-200">{children}</kbd>;
}
