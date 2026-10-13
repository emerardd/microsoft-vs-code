import { useState, useEffect, useRef, useCallback } from 'react';
import { creditRun, emptyProfile, parseProfile, readProfile, writeProfile, type Loadout } from './game/metaProgression';
import { GameState, type GameStats, type SidebarView, type UpgradeId } from './types';
import GameEngine from './components/GameEngine';
import GameOverlays from './components/GameOverlays';
import EditorDocumentView from './components/EditorDocumentView';
import ActivityBar from './components/ActivityBar';
import { DesktopSidebar, SidebarDrawer } from './components/SidebarPanel';
import { Breadcrumbs, EditorTabs } from './components/EditorTabs';
import BottomPanel from './components/BottomPanel';
import Notification from './components/Notification';
import StatusBar from './components/StatusBar';
import { createStatsStore } from './game/statsStore';
import { parseCheckpoint, type Checkpoint } from './game/checkpoint';
import type { MetaProfile } from './game/metaProgression';
import { EDITOR_DOCUMENTS, BOTTOM_PANELS, type EditorDocument, type BottomPanel as BottomPanelId } from './components/workbenchTypes';
import { readSettings, writeSettings } from './utils/settings';
import { resumeAudio, suspendAudio, setMuted } from './utils/audio';
import { getLang, setLang, t, type Lang } from './utils/i18n';
import { getBrand } from './utils/brand';

const HIGH_SCORE_KEY = 'VSCODE_GAME_HIGHSCORE';

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

interface AppProps {
  initialProfile?: unknown;
  onProfileChange?: (profile: MetaProfile) => void | Promise<void>;
  embedded?: boolean;
  onRequestReturn?: () => void;
  initialCheckpoint?: unknown;
  onCheckpoint?: (checkpoint: Checkpoint | null) => void;
}

export default function App({ embedded = false, onRequestReturn, initialCheckpoint, onCheckpoint, initialProfile, onProfileChange }: AppProps) {
  // ── Run & persistence ────────────────────────────────────────────────────
  const [profile, setProfile] = useState(() => embedded ? parseProfile(initialProfile) ?? emptyProfile() : readProfile());
  const profileRef = useRef(profile);
  const [profileSaveFailed, setProfileSaveFailed] = useState(false);
  const [loadout, setLoadout] = useState<Loadout>('standard');
  const [checkpoint, setCheckpoint] = useState(() => parseCheckpoint(initialCheckpoint));
  const [gameState, setGameState] = useState<GameState>(checkpoint ? GameState.PAUSED : GameState.START);
  const [restartToken, setRestartToken] = useState(0);
  const [pendingUpgrade, setPendingUpgrade] = useState<UpgradeId | null>(null);
  const [statsStore] = useState(createStatsStore);
  const stats = statsStore.getSnapshot();
  const [highScore, setHighScore] = useState<number>(readHighScore);
  const [newRecord, setNewRecord] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  // ── Preferences ──────────────────────────────────────────────────────────
  const [movementSensitivity, setMovementSensitivity] = useState(() => readSettings().sensitivity);
  const [soundMuted, setSoundMuted] = useState(() => readSettings().muted);
  // Stored in state to re-render; the module-level language drives t() inside the game loop.
  const [lang, setLangState] = useState<Lang>(getLang);
  const brand = getBrand(lang, embedded);

  // ── Workbench layout ─────────────────────────────────────────────────────
  const [sidebarView, setSidebarView] = useState<SidebarView>('EXPLORER');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [openDocuments, setOpenDocuments] = useState<EditorDocument[]>(['GAME', 'ENEMIES']);
  const [activeDocument, setActiveDocument] = useState<EditorDocument | null>('GAME');
  const [activeBottomPanel, setActiveBottomPanel] = useState<BottomPanelId>('TERMINAL');
  const [workbenchNotice, setWorkbenchNotice] = useState<string | null>(null);
  const dismissNotice = useCallback(() => setWorkbenchNotice(null), []);

  const saveCheckpoint = useCallback((value: Checkpoint | null) => { onCheckpoint?.(value); }, [onCheckpoint]);

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

  const pauseForHost = useCallback(() => {
    setGameState(previous => (previous === GameState.PLAYING ? GameState.PAUSED : previous));
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
    if (!embedded) document.title = lang === 'zh' ? `${brand.full} · 游戏版` : `${brand.full}: The Game`;
  }, [embedded, lang, brand.full]);

  useEffect(() => {
    if (gameState === GameState.PLAYING && checkpoint) setCheckpoint(null);
  }, [gameState, checkpoint]);

  useEffect(() => {
    if (gameState !== GameState.GAME_OVER && gameState !== GameState.VICTORY) return;
    const previous = readHighScore();
    const isRecord = stats.score > previous;
    setNewRecord(isRecord);
    setHighScore(Math.max(previous, stats.score));
    if (isRecord) writeHighScore(stats.score);
  }, [gameState, stats.score]);

  useEffect(() => {
    setMuted(soundMuted);
    writeSettings({ sensitivity: movementSensitivity, muted: soundMuted });
  }, [movementSensitivity, soundMuted]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const startFreshRun = () => {
    resumeAudio();
    setCheckpoint(null);
    saveCheckpoint(null);
    setNewRecord(false);
    setActiveDocument('GAME');
    setMobileSidebarOpen(false);
    setRestartToken(previous => previous + 1);
    setPendingUpgrade(null);
    setGameState(GameState.UPGRADE);
    setTerminalLogs([t('termLog1'), t('termLog2'), t('termLog3'), t('termLog4')]);
  };

  const continueCheckpoint = () => {
    setCheckpoint(null);
    resumeAudio();
    setGameState(GameState.PLAYING);
  };

  const handleLangChange = (next: Lang) => {
    setLang(next);
    setLangState(next);
  };

  const handleSoundToggle = () => setSoundMuted(muted => !muted);

  const handleReturnToCode = () => {
    pauseForHost();
    onRequestReturn?.();
  };

  /** Programmatic navigation (status bar, document links): always shows the view. */
  const revealSidebar = (view: SidebarView) => {
    setSidebarView(view);
    setSidebarVisible(true);
    setMobileSidebarOpen(true);
  };

  /** Activity bar: clicking the active view collapses the side bar, as in VS Code. */
  const toggleSidebar = (view: SidebarView) => {
    if (sidebarVisible && sidebarView === view) {
      setSidebarVisible(false);
    } else {
      revealSidebar(view);
    }
  };

  const hideSidebar = () => {
    setSidebarVisible(false);
    setWorkbenchNotice(t('noticeSidebarHidden'));
  };

  const openDocument = (document: EditorDocument) => {
    if (document !== 'GAME' && gameState === GameState.PLAYING) {
      setGameState(GameState.PAUSED);
      setWorkbenchNotice(t('noticeGamePaused'));
    } else if (document !== activeDocument) {
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

  const openBottomPanel = (panel: BottomPanelId) => {
    setActiveBottomPanel(panel);
    const label = BOTTOM_PANELS.find(item => item.id === panel)?.label ?? 'termTerminal';
    setWorkbenchNotice(t('noticePanelOpened', { name: t(label) }));
  };

  const sidebarContent = {
    store: statsStore, sidebarView, activeDocument, explorerOpen, setExplorerOpen, openDocument, highScore,
    movementSensitivity, setMovementSensitivity, handleSoundToggle, soundMuted, handleLangChange, lang,
  };
  const gameVisible = activeDocument === 'GAME';

  return (
    <div className={`workbench-shell relative flex w-screen select-none overflow-hidden font-mono text-vsc-text ${embedded ? 'workbench-shell--embedded' : ''}`}>
      {!embedded && <ActivityBar sidebarView={sidebarView} sidebarVisible={sidebarVisible} onSelect={toggleSidebar} />}
      {!embedded && sidebarVisible && <DesktopSidebar content={sidebarContent} onHide={hideSidebar} onNotice={setWorkbenchNotice} />}
      {!embedded && mobileSidebarOpen && <SidebarDrawer content={sidebarContent} onClose={() => setMobileSidebarOpen(false)} />}

      <main className="relative flex min-w-0 flex-1 flex-col bg-vsc-editor">
        {!embedded && (
          <>
            <EditorTabs
              openDocuments={openDocuments}
              activeDocument={activeDocument}
              mobileSidebarOpen={mobileSidebarOpen}
              onToggleMobileSidebar={() => setMobileSidebarOpen(open => !open)}
              onOpen={openDocument}
              onClose={closeDocument}
            />
            <Breadcrumbs activeDocument={activeDocument} />
          </>
        )}

        <div className="relative min-h-0 flex-1 overflow-hidden bg-vsc-editor">
          <div className={`absolute inset-0 items-center justify-center ${gameVisible ? 'flex' : 'hidden'}`}>
            {embedded && (
              <ExtensionToolbar brandName={brand.full} soundMuted={soundMuted} onToggleSound={handleSoundToggle} onReturn={handleReturnToCode} />
            )}
            <GameEngine
              gameState={gameState}
              setGameState={setGameState}
              active={gameVisible}
              language={lang}
              profile={profile}
              loadout={loadout}
              checkpoint={checkpoint}
              onCheckpoint={saveCheckpoint}
              onStatsUpdate={handleStatsUpdate}
              pendingUpgrade={pendingUpgrade}
              onUpgradeConsumed={() => setPendingUpgrade(null)}
              movementSensitivity={movementSensitivity}
              restartToken={restartToken}
            />
            <GameOverlays
              profile={profile} loadout={loadout} onLoadoutChange={setLoadout} profileSaveFailed={profileSaveFailed}
              lang={lang} handleLangChange={handleLangChange} gameState={gameState} stats={stats}
              embedded={embedded} brand={brand} highScore={highScore} newRecord={newRecord}
              startFreshRun={startFreshRun} handleSelectUpgrade={setPendingUpgrade}
              checkpointWave={checkpoint ? checkpoint.stats.wave : null} onContinueCheckpoint={continueCheckpoint}
            />
          </div>
          {!gameVisible && (
            <EditorDocumentView store={statsStore} activeDocument={activeDocument} highScore={highScore} openDocument={openDocument} handleSidebarSelect={revealSidebar} />
          )}
        </div>

        {!embedded && <BottomPanel store={statsStore} activePanel={activeBottomPanel} onSelect={openBottomPanel} terminalLogs={terminalLogs} />}
      </main>

      {!embedded && workbenchNotice && <Notification message={workbenchNotice} onDismiss={dismissNotice} />}

      {!embedded && (
        <StatusBar
          store={statsStore} openBottomPanel={openBottomPanel} handleSidebarSelect={revealSidebar} setWorkbenchNotice={setWorkbenchNotice}
          movementSensitivity={movementSensitivity} lang={lang} handleSoundToggle={handleSoundToggle} soundMuted={soundMuted}
        />
      )}
    </div>
  );
}

function ExtensionToolbar({ brandName, soundMuted, onToggleSound, onReturn }: {
  brandName: string; soundMuted: boolean; onToggleSound: () => void; onReturn: () => void;
}) {
  const soundLabel = soundMuted ? t('statusUnmute') : t('statusMute');
  return (
    <div className="extension-game-toolbar pointer-events-none absolute left-3 right-3 top-3 z-[95] flex items-center justify-between gap-3">
      <div className="rounded border border-vsc-widget bg-[#181818]/90 px-3 py-2 text-[11px] text-gray-400 shadow-lg backdrop-blur-sm">
        <span className="mr-2 text-syntax-type">{brandName}</span>
        <span className="hidden sm:inline">Ctrl+Alt+G</span>
      </div>
      <div className="pointer-events-auto flex gap-2">
        <button
          type="button"
          className="rounded border border-vsc-widget bg-vsc-sidebar/95 px-3 py-2 text-xs text-gray-200 shadow-lg hover:border-syntax-variable hover:text-white"
          onClick={onToggleSound}
          title={soundLabel}
          aria-label={soundLabel}
        >
          {soundMuted ? '🔇' : '🔔'}
        </button>
        <button
          type="button"
          className="rounded border border-vsc-accent bg-vsc-button/95 px-3 py-2 text-xs font-semibold text-white shadow-lg hover:bg-vsc-button-hover"
          onClick={onReturn}
        >
          ← Code
        </button>
      </div>
    </div>
  );
}
