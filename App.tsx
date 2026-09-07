import { creditRun, emptyProfile, parseProfile, readProfile, writeProfile, type Loadout, type MetaProfile } from './game/metaProgression';
import vscodeLogo from './vscode.png';
import StatusBar from './components/StatusBar';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameEngine from './components/GameEngine';
import { GameState, GameStats, SidebarView, UpgradeId } from './types';
import WorkbenchSidebar from './components/WorkbenchSidebar';
import EditorDocumentView from './components/EditorDocumentView';
import BottomPanelContent, { ProblemCount } from './components/BottomPanelContent';
import GameOverlays from './components/GameOverlays';
import { createStatsStore } from './game/statsStore';
import { readSettings, writeSettings } from './utils/settings';
import { parseCheckpoint, type Checkpoint } from './game/checkpoint';
import type { EditorDocument, BottomPanel } from './components/workbenchTypes';
import { resumeAudio, suspendAudio, setMuted } from './utils/audio';
import { getLang, setLang, t, Lang } from './utils/i18n';

const HIGH_SCORE_KEY = 'VSCODE_GAME_HIGHSCORE';

const EDITOR_DOCUMENTS: Record<EditorDocument, { label: string; icon: string; color: string }> = {
  GAME: { label: 'game_loop.ts', icon: 'TS', color: '#cca700' },
  ENEMIES: { label: 'enemies.json', icon: 'JSON', color: '#e06c75' },
  METADATA: { label: 'metadata.json', icon: 'JSON', color: '#e06c75' },
};

const readHighScore = (): number => {
  try {
    const value = Number(window.localStorage.getItem(HIGH_SCORE_KEY));
    return Number.isFinite(value) && value >= 0 ? value : 0;
  } catch {
    return 0;
  }
};

const writeHighScore = (score: number): void => {
  try {
    window.localStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch {
    // The current session remains playable when persistent storage is blocked.
  }
};

interface IconProps {
    active: boolean;
    onClick: () => void;
    title: string;
}

const SidebarIcon = ({ active, onClick, children, title }: IconProps & { children: React.ReactNode }) => (
    <div className="relative group w-full flex justify-center mb-4">
        <button
            type="button"
            aria-label={title}
            title={title}
            className={`cursor-pointer p-2 transition-colors ${active ? 'text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={onClick}
        >
            {children}
        </button>
        {active && <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-white"></div>}
        <div className="absolute left-12 top-2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-[#454545] shadow-lg transition-opacity delay-75">
            {title}
        </div>
    </div>
);

interface AppProps {
  initialProfile?: unknown;
  onProfileChange?: (profile: MetaProfile) => void | Promise<void>;
  embedded?: boolean;
  onRequestReturn?: () => void;
  initialCheckpoint?: unknown;
  onCheckpoint?: (checkpoint: Checkpoint | null) => void;
}

const FilesIcon      = () => <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const SearchIcon     = () => <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const GitIcon        = () => <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>;
const BugIcon        = () => <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ExtensionsIcon = () => <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;

const SettingsIcon = ({ active, onClick, title }: { active: boolean; onClick: () => void; title: string }) => (
    <div className="relative group w-full flex justify-center mt-auto mb-4">
        <button
            type="button"
            aria-label={title}
            title={title}
            className={`cursor-pointer p-2 transition-colors ${active ? 'text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={onClick}
        >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
        {active && <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-white"></div>}
        <div className="absolute left-12 top-1 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-[#454545] shadow-lg">
            {title}
        </div>
    </div>
);

export default function App({ embedded = false, onRequestReturn, initialCheckpoint, onCheckpoint, initialProfile, onProfileChange }: AppProps) {
  const [profile, setProfile] = useState(() => embedded ? parseProfile(initialProfile) ?? emptyProfile() : readProfile());
  const profileRef = useRef(profile);
  const [loadout, setLoadout] = useState<Loadout>('standard');
  const [profileSaveFailed, setProfileSaveFailed] = useState(false);
  const [checkpoint, setCheckpoint] = useState(() => parseCheckpoint(initialCheckpoint));
  const [gameState, setGameState] = useState<GameState>(checkpoint ? GameState.PAUSED : GameState.START);
  const [statsStore] = useState(createStatsStore);
  const saveCheckpoint = useCallback((value: Checkpoint | null) => { onCheckpoint?.(value); }, [onCheckpoint]);
  const [sidebarView, setSidebarView] = useState<SidebarView>('EXPLORER');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [sidebarMenuOpen, setSidebarMenuOpen] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [movementSensitivity, setMovementSensitivity] = useState(() => readSettings().sensitivity);
  const [restartToken, setRestartToken] = useState(0);
  const stats = statsStore.getSnapshot();
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [activeDocument, setActiveDocument] = useState<EditorDocument | null>('GAME');
  const [openDocuments, setOpenDocuments] = useState<EditorDocument[]>(['GAME', 'ENEMIES']);
  const [activeBottomPanel, setActiveBottomPanel] = useState<BottomPanel>('TERMINAL');
  const [workbenchNotice, setWorkbenchNotice] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const handleStatsUpdate = useCallback((next: GameStats) => {
    statsStore.publish(next);
    const updated = creditRun(profileRef.current, next);
    if (updated !== profileRef.current) {
      profileRef.current = updated;
      setProfile(updated);
      try {
        const saved = onProfileChange ? onProfileChange(updated) : writeProfile(updated);
        void Promise.resolve(saved).then(() => setProfileSaveFailed(false), () => setProfileSaveFailed(true));
      } catch { setProfileSaveFailed(true); }
    }
    if (next.lastLog) setTerminalLogs(previous => previous[previous.length - 1] === next.lastLog ? previous : [...previous.slice(-5), next.lastLog]);
  }, [statsStore, onProfileChange]);

  // High score
  const [highScore, setHighScore] = useState<number>(readHighScore);
  const [newRecord, setNewRecord] = useState(false);

  // Wave upgrade: id of the option the player chose; consumed by GameEngine
  const [pendingUpgrade, setPendingUpgrade] = useState<UpgradeId | null>(null);

  // Sound toggle
  const [soundMuted, setSoundMuted] = useState(() => readSettings().muted);

  // Language: storing in state triggers re-render; module-level variable drives t()
  const [lang, setLangState] = useState<Lang>(() => getLang());
  const embeddedBrandName = lang === 'zh' ? '巨硬大战代码' : 'MACROHARD VS CODE';

  const handleLangChange = (l: Lang) => {
    setLang(l);
    setLangState(l);
  };

  const pauseForHost = useCallback(() => {
    setGameState(previous => (
      previous === GameState.PLAYING ? GameState.PAUSED : previous
    ));
    void suspendAudio();
  }, []);

  useEffect(() => {
    if (!embedded) return;

    const handleHostMessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type === 'pause-before-hide') pauseForHost();
    };
    const pauseWhenHidden = () => {
      if (document.visibilityState === 'hidden') pauseForHost();
    };

    window.addEventListener('message', handleHostMessage);
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => {
      window.removeEventListener('message', handleHostMessage);
      document.removeEventListener('visibilitychange', pauseWhenHidden);
    };
  }, [embedded, pauseForHost]);

  useEffect(() => {
    if (gameState === GameState.PLAYING && checkpoint) setCheckpoint(null);
  }, [gameState, checkpoint]);

  // Persist high score when game ends
  useEffect(() => {
    if (gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) {
      const previous = readHighScore();
      const isRecord = stats.score > previous;
      setNewRecord(isRecord);
      setHighScore(Math.max(previous, stats.score));
      if (isRecord) writeHighScore(stats.score);
    }
  }, [gameState, stats.score]);

  useEffect(() => {
    setMuted(soundMuted);
    writeSettings({ sensitivity: movementSensitivity, muted: soundMuted });
  }, [movementSensitivity, soundMuted]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs]);

  const startFreshRun = () => {
    resumeAudio();
    setCheckpoint(null);
    saveCheckpoint(null);
    setNewRecord(false);
    setActiveDocument('GAME');
    setMobileSidebarOpen(false);
    setRestartToken(prev => prev + 1);
    setPendingUpgrade(null);
    setGameState(GameState.UPGRADE);
    setTerminalLogs([t('termLog1'), t('termLog2'), t('termLog3'), t('termLog4')]);
  };

  const handleSoundToggle = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    setMuted(next);
  };

  const handleReturnToCode = () => {
    pauseForHost();
    onRequestReturn?.();
  };

  const handleSelectUpgrade = (id: UpgradeId) => {
    setPendingUpgrade(id);
  };

  const handleUpgradeConsumed = () => {
    setPendingUpgrade(null);
  };

  const handleSidebarSelect = (view: SidebarView) => {
    setSidebarVisible(true);
    setSidebarMenuOpen(false);
    setMobileSidebarOpen(previous => sidebarView === view ? !previous : true);
    setSidebarView(view);
  };

  const openDocument = (document: EditorDocument) => {
    if (document !== 'GAME' && gameState === GameState.PLAYING) {
      setGameState(GameState.PAUSED);
      setWorkbenchNotice(t('noticeGamePaused'));
    } else {
      setWorkbenchNotice(t('noticeDocumentOpened', { name: EDITOR_DOCUMENTS[document].label }));
    }
    setOpenDocuments(previous => previous.includes(document) ? previous : [...previous, document]);
    setActiveDocument(document);
    setMobileSidebarOpen(false);
  };

  const closeDocument = (document: EditorDocument) => {
    if (document === 'GAME') pauseForHost();
    const next = openDocuments.filter(item => item !== document);
    setOpenDocuments(next);
    if (activeDocument === document) {
      const previousIndex = openDocuments.indexOf(document);
      setActiveDocument(next[Math.min(previousIndex, next.length - 1)] ?? null);
    }
    setWorkbenchNotice(t('noticeDocumentClosed', { name: EDITOR_DOCUMENTS[document].label }));
  };

  const openBottomPanel = (panel: BottomPanel) => {
    setActiveBottomPanel(panel);
    const panelNames: Record<BottomPanel, string> = {
      PROBLEMS: t('termProblems'),
      TERMINAL: t('termTerminal'),
      DEBUG: t('termDebug'),
      OUTPUT: t('termOutput'),
    };
    setWorkbenchNotice(t('noticePanelOpened', { name: panelNames[panel] }));
  };

  const showCurrentPanelInfo = () => {
    const panelInfo: Record<SidebarView, string> = {
      EXPLORER: t('panelInfoExplorer'),
      SEARCH: t('panelInfoSearch'),
      GIT: t('panelInfoGit'),
      DEBUG: t('panelInfoDebug'),
      EXTENSIONS: t('panelInfoExtensions'),
      SETTINGS: t('panelInfoSettings'),
    };
    setWorkbenchNotice(panelInfo[sidebarView]);
    setSidebarMenuOpen(false);
  };

  // ── Sidebar renderers ────────────────────────────────────────────────────

  return (
    <div className={`workbench-shell relative flex w-screen select-none overflow-hidden font-mono text-[#cccccc] ${embedded ? 'workbench-shell--embedded' : ''}`}>
      {/* Activity Bar (Left) */}
      {!embedded && (
      <div className="activity-bar z-[80] hidden w-12 shrink-0 flex-col items-center border-r border-[#252526] bg-[#333333] py-2 md:z-10 md:flex md:w-14">
        <img src={vscodeLogo} alt="VS Code" className="mb-6 mt-2 h-9 w-9 md:h-10 md:w-10" />
        <SidebarIcon active={sidebarView === 'EXPLORER'} onClick={() => handleSidebarSelect('EXPLORER')} title={t('ttExplorer')}>
            <FilesIcon />
        </SidebarIcon>
        <SidebarIcon active={sidebarView === 'SEARCH'} onClick={() => handleSidebarSelect('SEARCH')} title={t('ttSearch')}>
            <SearchIcon />
        </SidebarIcon>
        <SidebarIcon active={sidebarView === 'GIT'} onClick={() => handleSidebarSelect('GIT')} title={t('ttGit')}>
            <GitIcon />
        </SidebarIcon>
        <SidebarIcon active={sidebarView === 'DEBUG'} onClick={() => handleSidebarSelect('DEBUG')} title={t('ttDebug')}>
            <BugIcon />
        </SidebarIcon>
        <SidebarIcon active={sidebarView === 'EXTENSIONS'} onClick={() => handleSidebarSelect('EXTENSIONS')} title={t('ttExtensions')}>
            <ExtensionsIcon />
        </SidebarIcon>
        <SettingsIcon active={sidebarView === 'SETTINGS'} onClick={() => handleSidebarSelect('SETTINGS')} title={t('ttSettings')} />
      </div>
      )}

      {/* Sidebar */}
      {!embedded && sidebarVisible && (
      <div className="desktop-sidebar relative hidden w-64 shrink-0 flex-col border-r border-[#1e1e1e] bg-[#252526] md:flex">
        <div className="flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
            <span>{sidebarView}</span>
            <button
              type="button"
              className="px-1 text-lg leading-3 hover:text-white"
              aria-label={t('sidebarActions')}
              aria-expanded={sidebarMenuOpen}
              onClick={() => setSidebarMenuOpen(previous => !previous)}
            >
              ...
            </button>
        </div>
        {sidebarMenuOpen && (
          <div className="absolute right-2 top-9 z-40 min-w-44 border border-[#454545] bg-[#252526] py-1 text-xs font-normal normal-case tracking-normal text-gray-200 shadow-xl">
            <button
              type="button"
              className="block w-full px-3 py-2 text-left hover:bg-[#094771]"
              onClick={showCurrentPanelInfo}
            >
              {t('describePanel')}
            </button>
            <button
              type="button"
              className="block w-full px-3 py-2 text-left hover:bg-[#094771]"
              onClick={() => {
                setSidebarVisible(false);
                setSidebarMenuOpen(false);
                setWorkbenchNotice(t('noticeSidebarHidden'));
              }}
            >
              {t('closeSidebar')}
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#424242]">
            <WorkbenchSidebar store={statsStore} sidebarView={sidebarView} explorerOpen={explorerOpen} setExplorerOpen={setExplorerOpen} openDocument={openDocument} highScore={highScore} movementSensitivity={movementSensitivity} setMovementSensitivity={setMovementSensitivity} handleSoundToggle={handleSoundToggle} soundMuted={soundMuted} handleLangChange={handleLangChange} lang={lang} />
        </div>
      </div>
      )}

      {/* Small-screen sidebar drawer */}
      {!embedded && mobileSidebarOpen && (
        <>
          <button
            type="button"
            className="mobile-sidebar-backdrop absolute inset-0 z-[60] bg-black/50 md:hidden"
            aria-label={t('closeSidebar')}
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="mobile-sidebar-drawer absolute bottom-0 left-0 top-0 z-[70] flex w-[min(18rem,calc(100vw-2rem))] flex-col border-r border-[#454545] bg-[#252526] shadow-2xl md:hidden">
            <div className="flex items-center justify-between border-b border-[#3c3c3c] px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">
              <span>{sidebarView}</span>
              <button
                type="button"
                className="px-2 py-1 text-lg leading-none text-gray-400 hover:text-white"
                aria-label={t('closeSidebar')}
                onClick={() => setMobileSidebarOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <WorkbenchSidebar store={statsStore} sidebarView={sidebarView} explorerOpen={explorerOpen} setExplorerOpen={setExplorerOpen} openDocument={openDocument} highScore={highScore} movementSensitivity={movementSensitivity} setMovementSensitivity={setMovementSensitivity} handleSoundToggle={handleSoundToggle} soundMuted={soundMuted} handleLangChange={handleLangChange} lang={lang} />
            </div>
          </aside>
        </>
      )}

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col bg-[#1e1e1e] relative min-w-0">
        {/* Tabs */}
        {!embedded && (
        <div className="h-9 bg-[#252526] flex items-center overflow-x-auto border-b border-[#1e1e1e] shrink-0">
          <button
            type="button"
            className="mobile-menu-button flex h-full w-11 shrink-0 items-center justify-center border-r border-[#1e1e1e] text-gray-400 hover:bg-[#2a2d2e] hover:text-white md:hidden"
            aria-label={t('ttExplorer')}
            aria-expanded={mobileSidebarOpen}
            onClick={() => handleSidebarSelect('EXPLORER')}
          >
            <span className="text-xl leading-none" aria-hidden="true">☰</span>
          </button>
          {openDocuments.map(document => {
            const details = EDITOR_DOCUMENTS[document];
            const active = activeDocument === document;
            return (
              <div
                key={document}
                className={`group flex h-full min-w-fit items-center border-r border-[#1e1e1e] text-sm ${
                  active ? 'border-t border-t-[#007acc] bg-[#1e1e1e] text-white' : 'bg-[#2d2d2d] text-gray-400 hover:bg-[#2a2d2e]'
                }`}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className="flex h-full items-center py-0 pl-4 pr-2"
                  onClick={event => { openDocument(document); event.currentTarget.blur(); }}
                >
                  <span className="mr-2" style={{ color: details.color }}>{details.icon}</span>
                  {details.label}
                </button>
                <button
                  type="button"
                  className="mr-2 px-1 text-gray-500 opacity-60 hover:bg-[#3c3c3c] hover:text-white group-hover:opacity-100"
                  aria-label={t('closeDocument', { name: details.label })}
                  onClick={() => closeDocument(document)}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
        )}

        {/* Breadcrumbs */}
        {!embedded && (
        <div className="editor-breadcrumbs hidden h-6 shrink-0 items-center border-b border-[#1e1e1e] bg-[#1e1e1e] px-4 text-xs text-gray-500 sm:flex">
          {activeDocument === 'GAME' && <>src &gt; components &gt; game &gt; <span className="ml-1 flex items-center text-[#dcdcaa]"><span className="mr-1 text-purple-400">def</span> render()</span></>}
          {activeDocument === 'ENEMIES' && <>src &gt; data &gt; <span className="ml-1 text-[#e06c75]">enemies.json</span></>}
          {activeDocument === 'METADATA' && <>project &gt; <span className="ml-1 text-[#e06c75]">metadata.json</span></>}
          {activeDocument === null && <span>{t('noOpenEditors')}</span>}
        </div>
        )}

        {/* Game Canvas Container */}
        <div className="relative min-h-0 flex-1 overflow-hidden bg-[#1e1e1e]">
          <div className={`absolute inset-0 items-center justify-center ${activeDocument === 'GAME' ? 'flex' : 'hidden'}`}>
            {embedded && (
              <div className="extension-game-toolbar pointer-events-none absolute left-3 right-3 top-3 z-[95] flex items-center justify-between gap-3">
                <div className="rounded border border-[#454545] bg-[#181818]/90 px-3 py-2 text-[11px] text-gray-400 shadow-lg backdrop-blur-sm">
                  <span className="mr-2 text-[#4ec9b0]">{embeddedBrandName}</span>
                  <span className="hidden sm:inline">Ctrl+Alt+G</span>
                </div>
                <div className="pointer-events-auto flex gap-2">
                  <button
                    type="button"
                    className="rounded border border-[#454545] bg-[#252526]/95 px-3 py-2 text-xs text-gray-200 shadow-lg hover:border-[#9cdcfe] hover:text-white"
                    onClick={handleSoundToggle}
                    title={soundMuted ? t('statusUnmute') : t('statusMute')}
                    aria-label={soundMuted ? t('statusUnmute') : t('statusMute')}
                  >
                    {soundMuted ? '🔇' : '🔔'}
                  </button>
                  <button
                    type="button"
                    className="rounded border border-[#007acc] bg-[#0e639c]/95 px-3 py-2 text-xs font-semibold text-white shadow-lg hover:bg-[#1177bb]"
                    onClick={handleReturnToCode}
                  >
                    ← Code
                  </button>
                </div>
              </div>
            )}
            <GameEngine
              gameState={gameState}
              setGameState={setGameState}
              active={activeDocument === 'GAME'}
              language={lang}
              profile={profile}
              loadout={loadout}
              checkpoint={checkpoint}
              onCheckpoint={saveCheckpoint}
              onStatsUpdate={handleStatsUpdate}
              pendingUpgrade={pendingUpgrade}
              onUpgradeConsumed={handleUpgradeConsumed}
              movementSensitivity={movementSensitivity}
              restartToken={restartToken}
            />

            {checkpoint && gameState === GameState.PAUSED && <div className="absolute left-4 right-4 top-24 z-40 border border-[#4ec9b0] bg-[#252526] p-4 text-center text-sm">
              <p className="mb-3">{t('checkpointRestored', { wave: checkpoint.stats.wave })}</p>
              <button className="bg-[#0e639c] px-4 py-2 text-white" onClick={() => { setCheckpoint(null); resumeAudio(); setGameState(GameState.PLAYING); }}>{t('continueRun')}</button>
            </div>}
            <GameOverlays profile={profile} loadout={loadout} onLoadoutChange={setLoadout} profileSaveFailed={profileSaveFailed} lang={lang} handleLangChange={handleLangChange} gameState={gameState} stats={stats} embedded={embedded} embeddedBrandName={embeddedBrandName} highScore={highScore} newRecord={newRecord} movementSensitivity={movementSensitivity} startFreshRun={startFreshRun} handleSelectUpgrade={handleSelectUpgrade} />
          </div>
          {activeDocument !== 'GAME' && <EditorDocumentView store={statsStore} activeDocument={activeDocument} highScore={highScore} openDocument={openDocument} handleSidebarSelect={handleSidebarSelect} />}
        </div>

        {/* Terminal / Bottom Panel */}
        {!embedded && (
        <div className="bottom-panel hidden h-40 shrink-0 flex-col border-t border-[#414141] bg-[#1e1e1e] md:flex">
          <div className="flex text-xs px-4 py-2 border-b border-[#414141] bg-[#1e1e1e]">
            {([
              ['PROBLEMS', t('termProblems')],
              ['TERMINAL', t('termTerminal')],
              ['DEBUG', t('termDebug')],
              ['OUTPUT', t('termOutput')],
            ] as const).map(([panel, label]) => (
              <button
                type="button"
                key={panel}
                className={`mr-6 -mb-2 pb-2 text-[10px] uppercase tracking-wide hover:text-white ${
                  activeBottomPanel === panel ? 'border-b border-[#007acc] text-[#007acc]' : 'text-gray-400'
                }`}
                onClick={() => openBottomPanel(panel)}
              >
                {label}
                {panel === 'PROBLEMS' && (
                  <span className="ml-1 rounded-full bg-[#252526] px-2 py-0.5 text-[10px]"><ProblemCount store={statsStore} /></span>
                )}
              </button>
            ))}
          </div>
          <div className="flex-1 p-2 font-mono text-xs overflow-y-auto text-gray-300 scrollbar-thin scrollbar-thumb-gray-700">
             <BottomPanelContent store={statsStore} activeBottomPanel={activeBottomPanel} terminalLogs={terminalLogs} logsEndRef={logsEndRef} />
          </div>
        </div>
        )}
      </div>

      {!embedded && workbenchNotice && (
        <div
          className="absolute bottom-9 right-3 z-[90] w-[min(22rem,calc(100vw-4rem))] border border-[#007acc] bg-[#252526] p-3 text-xs text-gray-200 shadow-2xl"
          role="status"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="mb-1 font-semibold text-[#9cdcfe]">{t('noticeTitle')}</div>
              <p className="leading-relaxed text-gray-300">{workbenchNotice}</p>
            </div>
            <button
              type="button"
              className="px-1 text-lg leading-none text-gray-500 hover:text-white"
              aria-label={t('dismissNotice')}
              onClick={() => setWorkbenchNotice(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {!embedded && <StatusBar store={statsStore} openBottomPanel={openBottomPanel} handleSidebarSelect={handleSidebarSelect} setWorkbenchNotice={setWorkbenchNotice} movementSensitivity={movementSensitivity} lang={lang} handleSoundToggle={handleSoundToggle} soundMuted={soundMuted} />}

    </div>
  );
}
