
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { GameState, Player, Projectile, Enemy, Particle, GameStats, PowerUp, FloatingText, EnemyProjectile, UpgradeId } from '../types';
import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT, BACKGROUND_STRINGS, PLAYFIELD_WIDTH } from '../constants';
import { sfxBossAppear } from '../utils/audio';
import { t } from '../utils/i18n';
import { FRAME_DURATION } from '../utils/gameLogic';
import { createInitialGameStats, createInitialPlayer } from '../utils/gameState';
import { renderPausedFrame, renderScene, renderStartFrame } from '../game/renderScene';
import type { BackgroundParticle } from '../game/renderScene';
import { setControlPressed, useGameInput } from '../game/useGameInput';
import { updateEnemy } from '../game/updateEnemy';
import { pickUpgradeChoices, type EnemySpawnType } from '../game/contentSelection';
import { completeWave, getExcludedUpgrades } from '../game/runPlan';
import {
  createBoss,
  createEnemy,
  createExplosionParticles,
  createFloatingText,
} from '../game/entityFactory';
import {
  advanceEnemyProjectiles,
  advanceFloatingTexts,
  advanceParticles,
  advancePlayerProjectiles,
} from '../game/advanceEntities';
import { resolveCombat } from '../game/combat';
import { updatePlayerSystem } from '../game/playerSystem';
import { applyUpgrade } from '../game/upgrades';
import { resolveEnemyDefeat } from '../game/progression';
import { activateRefactorUltimate } from '../game/refactorUltimate';
import { getAmbientSpawnPlan } from '../game/spawnDirector';
import {
  captureCanvasSnapshot,
  prepareGameContext,
  resizeCanvasToDisplaySize,
} from '../game/canvasViewport';
import { SimulationClock } from '../game/simulationClock';
import { createCheckpoint, type Checkpoint } from '../game/checkpoint';
import { applyLoadout, type Loadout, type MetaProfile } from '../game/metaProgression';
import TouchControls, { TouchControlCode } from './TouchControls';

interface GameEngineProps {
  profile: MetaProfile;
  loadout: Loadout;
  active: boolean;
  language: string;
  checkpoint?: Checkpoint | null;
  onCheckpoint?: (checkpoint: Checkpoint | null) => void;
  gameState: GameState;
  setGameState: (state: React.SetStateAction<GameState>) => void;
  onStatsUpdate: (stats: GameStats) => void;
  /** Id of the upgrade the player chose. GameEngine consumes it and calls onUpgradeConsumed. */
  pendingUpgrade: UpgradeId | null;
  onUpgradeConsumed: () => void;
  movementSensitivity: number;
  restartToken: number;
}

const GameEngine: React.FC<GameEngineProps> = ({
  active, language, checkpoint, onCheckpoint, profile, loadout,
  gameState,
  setGameState,
  onStatsUpdate,
  pendingUpgrade,
  onUpgradeConsumed,
  movementSensitivity,
  restartToken
}) => {
  const clockRef = useRef(new SimulationClock());
  const phaseRef = useRef(gameState);
  phaseRef.current = gameState;
  const restoredRef = useRef(false);
  const [viewportRevision, setViewportRevision] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Player state ──────────────────────────────────────────────────────────
  const playerRef = useRef<Player>(createInitialPlayer());

  // Permanent per-run modifiers from wave upgrades
  const overclockLevelRef = useRef(0); // Each stack: 8% faster, up to 3
  const fastGcLevelRef = useRef(0); // Each stack: 10% shorter reload, up to 3

  // ── Entity arrays ─────────────────────────────────────────────────────────
  const projectilesRef = useRef<Projectile[]>([]);
  const enemyProjectilesRef = useRef<EnemyProjectile[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const bgParticlesRef = useRef<BackgroundParticle[]>([]);
  // Last active frame, kept while paused so the dim overlay has a stable source.
  const frozenFrameRef = useRef<HTMLCanvasElement | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const shakeRef = useRef<number>(0);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const statsRef = useRef<GameStats>(createInitialGameStats(t('logInit')));

  const lastFireTimeRef = useRef<number>(0);
  const lastSpawnTimeRef = useRef<number>(0);
  const frameIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lastStatsSyncTimeRef = useRef<number>(0);
  const lastRestartTokenRef = useRef<number>(restartToken);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const syncStatsToUI = useCallback(() => {
    const player = playerRef.current;
    onStatsUpdate({
      ...statsRef.current,
      weaponLevel: player.weaponLevel,
      ammo: player.ammo,
      maxAmmo: player.maxAmmo,
      specialCharge: player.specialCharge,
      shieldActive: player.shield > 0
    });
  }, [onStatsUpdate]);

  const triggerGameOver = useCallback(() => {
    statsRef.current.outcome = 'defeat';
    phaseRef.current = GameState.GAME_OVER;
    onCheckpoint?.(null);
    syncStatsToUI();
    setGameState(GameState.GAME_OVER);
  }, [syncStatsToUI, setGameState, onCheckpoint]);

  const createExplosion = (x: number, y: number, color: string, count: number) => {
    particlesRef.current.push(...createExplosionParticles(x, y, color, count));
  };

  const addFloatingText = (x: number, y: number, text: string, color: string, vy = -1) => {
    floatingTextsRef.current.push(createFloatingText(x, y, text, color, vy));
  };

  // ── Apply upgrade (called when pendingUpgrade prop fires) ─────────────────
  useEffect(() => {
    if (!pendingUpgrade) return;
    const modifiers = applyUpgrade(
      pendingUpgrade,
      playerRef.current,
      {
        fastGcLevel: fastGcLevelRef.current,
        overclockLevel: overclockLevelRef.current,
      },
      addFloatingText,
    );
    fastGcLevelRef.current = modifiers.fastGcLevel;
    overclockLevelRef.current = modifiers.overclockLevel;

    statsRef.current.pendingUpgrades = [];
    statsRef.current.levelProgress = 0;
    statsRef.current.upgradeHistory.push(pendingUpgrade);
    enemiesRef.current = [];
    projectilesRef.current = [];
    enemyProjectilesRef.current = [];
    powerUpsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    playerRef.current.x = PLAYFIELD_WIDTH / 2;
    playerRef.current.y = CANVAS_HEIGHT - 60;
    playerRef.current.isReloading = false;
    playerRef.current.reloadTimer = 0;
    lastSpawnTimeRef.current = clockRef.current.time;
    lastFireTimeRef.current = clockRef.current.time;
    playerRef.current.fireCadenceRemainderMs = 0;
    playerRef.current.wasFiring = false;
    phaseRef.current = GameState.PLAYING;
    keysRef.current.clear();
    onCheckpoint?.(createCheckpoint(playerRef.current, statsRef.current, modifiers));
    syncStatsToUI();
    onUpgradeConsumed();
    setGameState(GameState.PLAYING);
  }, [pendingUpgrade]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Spawn helpers ─────────────────────────────────────────────────────────
  const spawnEnemy = (type: EnemySpawnType, x?: number, y?: number, scaleHP = 1) => {
      enemiesRef.current.push(createEnemy(type, statsRef.current.wave, {
        x,
        y,
        hpScale: scaleHP,
      }));
  };

  const spawnBoss = () => {
      enemiesRef.current.push(createBoss(statsRef.current.wave));
      statsRef.current.bossActive = true;
      statsRef.current.lastLog = t('logBoss');
      addFloatingText(PLAYFIELD_WIDTH / 2, CANVAS_HEIGHT / 2, t('bossApproaching'), COLORS.error);
      shakeRef.current = 20;
      sfxBossAppear();
  };

  const handleEnemyDefeat = (enemy: Enemy, grantSpecialCharge = true) => {
      if (playerRef.current.hp <= 0 || phaseRef.current !== GameState.PLAYING) return;
      const result = resolveEnemyDefeat(enemy, {
        player: playerRef.current,
        stats: statsRef.current,
        spawnEnemy,
        createExplosion,
        addFloatingText,
        grantSpecialCharge,
      });
      if (!result.defeated) return;

      if (result.clearEnemyProjectiles) {
          enemyProjectilesRef.current = [];
      }
      if (result.droppedPowerUp) {
          powerUpsRef.current.push(result.droppedPowerUp);
      }
      if (result.shake > 0) {
          shakeRef.current = result.shake;
      }
      if (result.victory) {
          phaseRef.current = GameState.VICTORY;
          onCheckpoint?.(null);
          syncStatsToUI();
          setGameState(GameState.VICTORY);
      }
      if (result.upgradeChoices.length > 0) {
          statsRef.current.pendingUpgrades = result.upgradeChoices;
          syncStatsToUI();
          phaseRef.current = GameState.UPGRADE;
          setGameState(GameState.UPGRADE);
      }
  };

  const triggerRefactorUltimate = () => {
      const result = activateRefactorUltimate({
          player: playerRef.current,
          stats: statsRef.current,
          enemies: enemiesRef.current,
          createExplosion,
          addFloatingText,
          onActivate: () => {
              shakeRef.current = 30;
              enemyProjectilesRef.current = [];
          },
          handleEnemyDefeat,
      });
      if (!result.activated) return;
      if (result.particle) particlesRef.current.push(result.particle);
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetGame = useCallback(() => {
    overclockLevelRef.current = 0;
    fastGcLevelRef.current = 0;

    playerRef.current = createInitialPlayer();
    applyLoadout(playerRef.current, profile, loadout);
    projectilesRef.current = [];
    enemyProjectilesRef.current = [];
    enemiesRef.current = [];
    particlesRef.current = [];
    powerUpsRef.current = [];
    floatingTextsRef.current = [];
    shakeRef.current = 0;
    frozenFrameRef.current = null;
    keysRef.current.clear();
    statsRef.current = createInitialGameStats(t('logNewSession'));
    statsRef.current.pendingUpgrades = pickUpgradeChoices(3, Math.random, getExcludedUpgrades(playerRef.current, { fastGcLevel: 0, overclockLevel: 0 }));
    phaseRef.current = GameState.UPGRADE;
    lastFireTimeRef.current = 0;
    clockRef.current.reset();
    lastSpawnTimeRef.current = 0;
    lastTimeRef.current = 0;
    lastStatsSyncTimeRef.current = 0;
    syncStatsToUI();
  }, [syncStatsToUI, profile, loadout]);

  useEffect(() => {
    if (active && (gameState === GameState.PLAYING || gameState === GameState.PAUSED)) {
      canvasRef.current?.focus({ preventScroll: true });
    }
  }, [active, gameState]);

  // ── Input setup ───────────────────────────────────────────────────────────
  useGameInput(keysRef, setGameState, active);

  useEffect(() => {
    bgParticlesRef.current = Array.from({ length: 20 }, () => ({
      x: Math.random() * PLAYFIELD_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      text: BACKGROUND_STRINGS[Math.floor(Math.random() * BACKGROUND_STRINGS.length)],
      opacity: Math.random() * 0.1 + 0.02,
      speed: Math.random() * 1 + 0.5,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      if (resizeCanvasToDisplaySize(canvas)) setViewportRevision(value => value + 1);
    };
    resize();

    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(resize)
      : null;
    if (canvas.parentElement) observer?.observe(canvas.parentElement);
    window.addEventListener('resize', resize);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  // ── Game Loop ─────────────────────────────────────────────────────────────
  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;
    const ctx = prepareGameContext(canvas);
    if (!ctx) return;

    // Paused / upgrade frames redraw only on state, language, or viewport changes.
    if (gameState === GameState.PAUSED || gameState === GameState.UPGRADE) {
        // BUG FIX #5: Keep lastTimeRef in sync so the first active frame
        // doesn't inherit a large deltaTime spike from the idle period.
        lastTimeRef.current = timestamp;

        // Freeze the last active frame once; redraw only when invalidated. The
        // overlay used to be stacked onto the live canvas, so its alpha
        // accumulated and the paused scene faded to black within a second.
        if (!frozenFrameRef.current) {
          renderScene({ ctx, timestamp, frameScale: 0, player: playerRef.current, stats: statsRef.current,
            backgroundParticles: bgParticlesRef.current, enemyProjectiles: enemyProjectilesRef.current,
            enemies: enemiesRef.current, projectiles: projectilesRef.current, powerUps: powerUpsRef.current,
            particles: particlesRef.current, floatingTexts: floatingTextsRef.current, shake: 0 });
          frozenFrameRef.current = captureCanvasSnapshot(canvas);
        }
        renderPausedFrame(
          ctx,
          gameState === GameState.PAUSED,
          frozenFrameRef.current,
        );
        return;
    }

    frozenFrameRef.current = null;

    if (gameState !== GameState.PLAYING) {
        if (gameState === GameState.START) {
          renderStartFrame(ctx, bgParticlesRef.current);

        }
        return;
    }

    // ─ Active frame ─
    const deltaTime = lastTimeRef.current ? timestamp - lastTimeRef.current : FRAME_DURATION;
    lastTimeRef.current = timestamp;
    const frameScale = 1;
    statsRef.current.fps = Math.round(1000 / Math.max(1, deltaTime));
    statsRef.current.frameTimeMs = deltaTime;
    const player = playerRef.current;
    const updateStart = performance.now();
    clockRef.current.advance(deltaTime, simulationTime => {
    const timestamp = simulationTime;
    statsRef.current.elapsedMs += FRAME_DURATION;

    // 1. Background
    bgParticlesRef.current.forEach(p => {
        p.y += (p.speed + (player.speedBuff > 0 ? 4 : 0)) * frameScale;
        if (p.y > CANVAS_HEIGHT) {
            p.y = -20;
            p.x = Math.random() * PLAYFIELD_WIDTH;
            p.text = BACKGROUND_STRINGS[Math.floor(Math.random() * BACKGROUND_STRINGS.length)];
        }
    });

    // 2-4. Player movement, timers, reload, ultimate, and shooting
    const playerResult = updatePlayerSystem({
      player,
      stats: statsRef.current,
      keys: keysRef.current,
      frameScale,
      timestamp,
      lastFireTime: lastFireTimeRef.current,
      movementSensitivity,
      fastGcLevel: fastGcLevelRef.current,
      overclockLevel: overclockLevelRef.current,
      addFloatingText,
      triggerUltimate: triggerRefactorUltimate,
    });
    lastFireTimeRef.current = playerResult.lastFireTime;
    projectilesRef.current.push(...playerResult.projectiles);

    if (phaseRef.current !== GameState.PLAYING) return false;

    // 5. Enemy spawning; wave completion is resolved after combat.

    const spawnPlan = getAmbientSpawnPlan(statsRef.current.wave);
    const activeMinionCount = enemiesRef.current.filter(
      enemy => enemy.type !== 'MONOLITH',
    ).length;
    if (
      timestamp - lastSpawnTimeRef.current > spawnPlan.intervalMs
      && activeMinionCount < spawnPlan.maxConcurrentEnemies
      && !statsRef.current.bossActive
    ) {
        spawnEnemy('RANDOM');
        lastSpawnTimeRef.current = timestamp;
    }

    // 6. Move projectiles
    projectilesRef.current = advancePlayerProjectiles(projectilesRef.current, frameScale);
    enemyProjectilesRef.current = advanceEnemyProjectiles(enemyProjectilesRef.current, frameScale);

    // 7. Move enemies & AI
    enemiesRef.current.forEach(enemy => {
      updateEnemy(enemy, {
        player,
        frameScale,
        enemyProjectiles: enemyProjectilesRef.current,
        spawnEnemy,
        createExplosion,
        activeMinionCount,
      });
    });

    const combatResult = resolveCombat({
      frameScale,
      player,
      stats: statsRef.current,
      enemies: enemiesRef.current,
      projectiles: projectilesRef.current,
      enemyProjectiles: enemyProjectilesRef.current,
      powerUps: powerUpsRef.current,
      addFloatingText,
      createExplosion,
      handleEnemyDefeat,
      triggerGameOver,
    });
    enemiesRef.current = combatResult.enemies;
    projectilesRef.current = combatResult.projectiles;
    powerUpsRef.current = combatResult.powerUps;
    if (combatResult.shake > 0) shakeRef.current = combatResult.shake;

    if (phaseRef.current === GameState.PLAYING) {
      const transition = completeWave(player, statsRef.current);
      if (transition === 'upgrade') {
        statsRef.current.lastLog = t('waveDeployed', { wave: statsRef.current.wave - 1 });
        statsRef.current.pendingUpgrades = pickUpgradeChoices(3, Math.random, getExcludedUpgrades(player, {
          fastGcLevel: fastGcLevelRef.current, overclockLevel: overclockLevelRef.current,
        }));
        keysRef.current.clear();
        phaseRef.current = GameState.UPGRADE;
        syncStatsToUI();
        setGameState(GameState.UPGRADE);
      } else if (transition === 'boss') {
        enemiesRef.current = [];
        enemyProjectilesRef.current = [];
        projectilesRef.current = [];
        spawnBoss();
      }
    }

    particlesRef.current = advanceParticles(particlesRef.current, frameScale);
    floatingTextsRef.current = advanceFloatingTexts(floatingTextsRef.current, frameScale);

    return phaseRef.current === GameState.PLAYING;
    });
    statsRef.current.updateTimeMs = performance.now() - updateStart;
    statsRef.current.projectileCount = projectilesRef.current.length + enemyProjectilesRef.current.length;
    statsRef.current.entityCount = statsRef.current.projectileCount + enemiesRef.current.length
      + particlesRef.current.length + floatingTextsRef.current.length + powerUpsRef.current.length;

    // Throttled stats sync
    if (timestamp - lastStatsSyncTimeRef.current >= 100) {
        lastStatsSyncTimeRef.current = timestamp;
        syncStatsToUI();
    }

    if (phaseRef.current !== GameState.PLAYING) syncStatsToUI();

    // ── RENDER ──────────────────────────────────────────────────────────────
    const renderStart = performance.now();
    shakeRef.current = renderScene({
      ctx,
      timestamp,
      frameScale: Math.min(250, deltaTime) / FRAME_DURATION,
      player,
      stats: statsRef.current,
      backgroundParticles: bgParticlesRef.current,
      enemyProjectiles: enemyProjectilesRef.current,
      enemies: enemiesRef.current,
      projectiles: projectilesRef.current,
      powerUps: powerUpsRef.current,
      particles: particlesRef.current,
      floatingTexts: floatingTextsRef.current,
      shake: shakeRef.current,
    });

    statsRef.current.renderTimeMs = performance.now() - renderStart;
    if (phaseRef.current === GameState.PLAYING) frameIdRef.current = requestAnimationFrame(gameLoop);
  // Engine helpers mutate refs only. Adding their render-local identities here would
  // restart the animation loop every time the throttled stats UI re-renders.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, language, viewportRevision, gameState, movementSensitivity, onStatsUpdate, setGameState, syncStatsToUI, triggerGameOver]);

  useEffect(() => {
    if (!restoredRef.current && checkpoint) {
      const saved = structuredClone(checkpoint);
      playerRef.current = saved.player;
      statsRef.current = saved.stats;
      fastGcLevelRef.current = saved.modifiers.fastGcLevel;
      overclockLevelRef.current = saved.modifiers.overclockLevel;
      clockRef.current.reset(saved.stats.elapsedMs);
      lastSpawnTimeRef.current = clockRef.current.time;
      lastFireTimeRef.current = clockRef.current.time;
      restoredRef.current = true;
      syncStatsToUI();
    }
    const shouldReset = restartToken !== lastRestartTokenRef.current;
    if (shouldReset) {
      resetGame();
      lastRestartTokenRef.current = restartToken;
    }
    lastTimeRef.current = 0;
    if (active) frameIdRef.current = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(frameIdRef.current);
  }, [active, checkpoint, gameState, gameLoop, resetGame, restartToken, syncStatsToUI]);

  const handleTouchControl = useCallback((code: TouchControlCode, pressed: boolean) => {
    if (active || !pressed) setControlPressed(keysRef, code, pressed);
  }, [active]);

  const handlePauseToggle = useCallback(() => {
    if (!active) return;
    keysRef.current.clear();
    setGameState(previous => (
      previous === GameState.PLAYING ? GameState.PAUSED : GameState.PLAYING
    ));
  }, [active, setGameState]);

  return (
    <div className={`game-shell ${gameState === GameState.PLAYING || gameState === GameState.PAUSED ? 'game-shell--active' : ''}`}>
      {(gameState === GameState.PLAYING || gameState === GameState.PAUSED) && <div className="absolute top-1 left-1/2 z-10 -translate-x-1/2 bg-[#252526]/90 px-3 py-1 text-xs text-[#dcdcaa]" data-testid="run-stage">{statsRef.current.bossActive ? t('finalBossStage') : t('runStage', { wave: statsRef.current.wave })}</div>}
      <div className="game-canvas-stage">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          tabIndex={0}
          role="img"
          aria-label={t('gameCanvasLabel')}
          className="game-canvas cursor-none border border-[#333] shadow-2xl shadow-black"
        />
      </div>
      {(gameState === GameState.PLAYING || gameState === GameState.PAUSED) && (
        <TouchControls
          onControlChange={handleTouchControl}
          onPauseToggle={handlePauseToggle}
          paused={gameState === GameState.PAUSED}
        />
      )}
    </div>
  );
};

export default GameEngine;
