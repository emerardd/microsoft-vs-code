import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COLORS,
  COPILOT_BUFF_DURATION,
  MAX_SPECIAL_CHARGE,
  PLAYFIELD_WIDTH,
} from '../constants';
import type {
  Enemy,
  EnemyProjectile,
  FloatingText,
  GameStats,
  Particle,
  Player,
  PowerUp,
  Projectile,
} from '../types';
import { t } from '../utils/i18n';
import { renderMinimap } from './minimap';
import { getComboBonuses } from './combo';

const GAME_FONT = '"Cascadia Code", Consolas, monospace';

export interface BackgroundParticle {
  x: number;
  y: number;
  text: string;
  opacity: number;
  speed: number;
}

interface RenderSceneInput {
  ctx: CanvasRenderingContext2D;
  timestamp: number;
  frameScale: number;
  player: Player;
  stats: GameStats;
  backgroundParticles: readonly BackgroundParticle[];
  enemyProjectiles: readonly EnemyProjectile[];
  enemies: readonly Enemy[];
  projectiles: readonly Projectile[];
  powerUps: readonly PowerUp[];
  particles: readonly Particle[];
  floatingTexts: readonly FloatingText[];
  shake: number;
}

function renderHealthHud(
  ctx: CanvasRenderingContext2D,
  player: Player,
): void {
  const hpPct = Math.max(0, player.hp / player.maxHp);
  const hudX = 12;
  const hudY = 12;
  const hudWidth = 198;
  const hudHeight = 22;
  const barX = hudX + 38;
  const barY = hudY + 6;
  const barWidth = 88;
  const barHeight = 10;

  ctx.save();
  ctx.fillStyle = 'rgba(37,37,38,0.96)';
  ctx.fillRect(hudX, hudY, hudWidth, hudHeight);
  ctx.strokeStyle = '#454545';
  ctx.strokeRect(hudX + 0.5, hudY + 0.5, hudWidth - 1, hudHeight - 1);

  ctx.font = `600 11px ${GAME_FONT}`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#b8b8b8';
  ctx.fillText(t('hpLabel'), hudX + 7, hudY + hudHeight / 2 + 0.5);

  ctx.fillStyle = '#333333';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  ctx.fillStyle = hpPct > 0.6
    ? COLORS.class
    : hpPct > 0.3
      ? COLORS.warning
      : COLORS.error;
  ctx.fillRect(barX, barY, Math.round(barWidth * hpPct), barHeight);

  ctx.fillStyle = '#e7e7e7';
  ctx.textAlign = 'right';
  ctx.fillText(
    `${Math.max(0, Math.ceil(player.hp))}/${player.maxHp}`,
    hudX + hudWidth - 7,
    hudY + hudHeight / 2 + 0.5,
  );
  ctx.restore();
}

function renderComboHud(
  ctx: CanvasRenderingContext2D,
  stats: GameStats,
): void {
  if (stats.combo <= 0) return;

  const bonuses = getComboBonuses(stats.combo);
  const x = PLAYFIELD_WIDTH - 192;
  const y = stats.bossActive ? 42 : 12;
  const width = 180;
  const height = 38;

  ctx.save();
  ctx.fillStyle = 'rgba(37,37,38,0.94)';
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = COLORS.warning;
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
  ctx.font = `bold 12px ${GAME_FONT}`;
  ctx.fillStyle = COLORS.warning;
  ctx.fillText(t('comboHud', { combo: stats.combo }), x + 8, y + 14);
  ctx.font = `10px ${GAME_FONT}`;
  ctx.fillStyle = COLORS.text;
  ctx.fillText(
    t('comboBonusHud', {
      damage: Math.round((bonuses.damageMultiplier - 1) * 100),
      rate: Math.round((1 - bonuses.fireRateMultiplier) * 100),
    }),
    x + 8,
    y + 28,
  );
  ctx.restore();
}

function renderRefactorHud(
  ctx: CanvasRenderingContext2D,
  player: Player,
  timestamp: number,
): void {
  const x = 12;
  const y = 40;
  const width = 198;
  const height = 38;
  const keyWidth = 34;
  const chargeRatio = Math.max(
    0,
    Math.min(1, player.specialCharge / MAX_SPECIAL_CHARGE),
  );
  const ready = chargeRatio >= 1;

  ctx.save();
  ctx.fillStyle = 'rgba(24,24,27,0.96)';
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = ready ? COLORS.function : '#454545';
  ctx.lineWidth = ready ? 2 : 1;
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);

  ctx.fillStyle = ready ? COLORS.function : '#68217a';
  ctx.fillRect(x + 1, y + 1, keyWidth, height - 2);
  ctx.fillStyle = ready ? '#1e1e1e' : '#ffffff';
  ctx.font = `bold 20px ${GAME_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('R', x + keyWidth / 2 + 1, y + height / 2);

  ctx.textAlign = 'left';
  ctx.font = `bold 10px ${GAME_FONT}`;
  ctx.fillStyle = ready ? COLORS.function : '#d8d8d8';
  ctx.fillText(
    ready ? t('refactorHudReady') : t('refactorHudCharging'),
    x + keyWidth + 8,
    y + 11,
  );
  ctx.textAlign = 'right';
  ctx.fillText(
    `${Math.round(chargeRatio * 100)}%`,
    x + width - 7,
    y + 11,
  );

  const barX = x + keyWidth + 8;
  const barY = y + 22;
  const barWidth = width - keyWidth - 15;
  const barHeight = 9;
  ctx.fillStyle = '#333333';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  ctx.fillStyle = ready ? COLORS.function : COLORS.accent;
  ctx.fillRect(barX, barY, Math.round(barWidth * chargeRatio), barHeight);

  if (ready) {
    ctx.globalAlpha = 0.45 + Math.sin(timestamp * 0.012) * 0.2;
    ctx.strokeStyle = COLORS.function;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 2.5, y - 2.5, width + 5, height + 5);
  }
  ctx.restore();
}

export function renderPausedFrame(
  ctx: CanvasRenderingContext2D,
  showPauseMessage: boolean,
  frozenFrame: CanvasImageSource | null = null,
): void {
  ctx.save();
  // Repaint the frozen frame first. Without it the dim layer below is stacked on
  // top of the previous paused frame every tick, which faded the scene to black.
  if (frozenFrame) {
    ctx.drawImage(frozenFrame, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (showPauseMessage) {
    ctx.fillStyle = '#fff';
    ctx.font = `bold 40px ${GAME_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(t('breakpointHit'), PLAYFIELD_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.font = `20px ${GAME_FONT}`;
    ctx.fillStyle = '#cccccc';
    ctx.fillText(t('pressToContinue'), PLAYFIELD_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    ctx.textAlign = 'left';
  }

  ctx.restore();
}

export function renderStartFrame(
  ctx: CanvasRenderingContext2D,
  backgroundParticles: BackgroundParticle[],
  random: () => number = Math.random,
): void {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = '#2e2e2e';
  ctx.font = `14px ${GAME_FONT}`;

  backgroundParticles.forEach(particle => {
    particle.y += particle.speed;
    if (particle.y > CANVAS_HEIGHT) {
      particle.y = -20;
      particle.x = random() * PLAYFIELD_WIDTH;
    }
    ctx.globalAlpha = particle.opacity;
    ctx.fillText(particle.text, particle.x, particle.y);
  });

  ctx.globalAlpha = 1;
}

export function renderScene({
  ctx,
  timestamp,
  frameScale,
  player,
  stats,
  backgroundParticles,
  enemyProjectiles,
  enemies,
  projectiles,
  powerUps,
  particles,
  floatingTexts,
  shake,
}: RenderSceneInput): number {
  let nextShake = shake;

  ctx.save();
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.beginPath();
  ctx.rect(0, 0, PLAYFIELD_WIDTH, CANVAS_HEIGHT);
  ctx.clip();

  if (nextShake > 0) {
    ctx.translate(
      (Math.random() - 0.5) * nextShake,
      (Math.random() - 0.5) * nextShake,
    );
    nextShake *= Math.pow(0.9, frameScale);
    if (nextShake < 0.5) nextShake = 0;
  }

  ctx.font = `12px ${GAME_FONT}`;
  backgroundParticles.forEach(particle => {
    ctx.fillStyle = '#2e2e2e';
    ctx.globalAlpha = particle.opacity;
    ctx.fillText(particle.text, particle.x, particle.y);
  });
  ctx.globalAlpha = 1;

  if (stats.combo >= 5) {
    ctx.save();
    ctx.translate(PLAYFIELD_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = COLORS.text;
    ctx.font = `bold 120px ${GAME_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${stats.combo}x`, 0, 0);
    ctx.restore();
  }

  ctx.strokeStyle = '#2e2e2e';
  ctx.lineWidth = 1;
  for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(PLAYFIELD_WIDTH, y);
    ctx.stroke();
  }

  if (player.invulnerable <= 0 || Math.floor(Date.now() / 50) % 2 === 0) {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

    if (player.shield > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, 35, 0, Math.PI * 2);
      ctx.strokeStyle = '#0db7ed';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (player.specialCharge >= MAX_SPECIAL_CHARGE) {
      const pulsate = Math.sin(timestamp * 0.01) * 5;
      ctx.beginPath();
      ctx.arc(0, 0, 40 + pulsate, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.class;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(15, 15);
    ctx.lineTo(0, 10);
    ctx.lineTo(-15, 15);
    ctx.closePath();
    ctx.fillStyle = player.speedBuff > 0
      ? COLORS.warning
      : player.weaponBuff > 0
        ? COLORS.class
        : COLORS.statusBar;
    ctx.fill();

    const ammoPct = player.ammo / player.maxAmmo;
    ctx.fillStyle = '#333';
    ctx.fillRect(-20, 25, 40, 4);
    ctx.fillStyle = player.isReloading ? COLORS.error : COLORS.class;
    ctx.fillRect(-20, 25, 40 * ammoPct, 4);
    if (player.weaponBuff > 0) {
      const buffPct = Math.min(1, player.weaponBuff / COPILOT_BUFF_DURATION);
      ctx.fillStyle = '#333';
      ctx.fillRect(-20, 32, 40, 3);
      ctx.fillStyle = COLORS.class;
      ctx.fillRect(-20, 32, 40 * buffPct, 3);
    }
    ctx.restore();
  }

  ctx.font = `20px ${GAME_FONT}`;
  enemyProjectiles.forEach(projectile => {
    if (projectile.label === '};') {
      const centerX = projectile.x + projectile.width / 2;
      const centerY = projectile.y + projectile.height / 2;
      const pulse = 12 + Math.sin(timestamp * 0.02) * 2;
      ctx.save();
      ctx.shadowColor = projectile.color;
      ctx.shadowBlur = 16;
      ctx.fillStyle = 'rgba(255,107,107,0.28)';
      ctx.strokeStyle = projectile.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold 18px ${GAME_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(projectile.label, centerX, centerY);
      ctx.restore();
      return;
    }

    ctx.fillStyle = projectile.color;
    ctx.fillText(projectile.label, projectile.x - 10, projectile.y);
  });

  enemies.forEach(enemy => {
    ctx.save();
    ctx.fillStyle = enemy.flashTimer > 0 ? '#ffffff' : enemy.color;
    ctx.font = `bold ${enemy.type === 'MONOLITH' ? '24px' : '16px'} ${GAME_FONT}`;
    ctx.fillText(enemy.text, enemy.x, enemy.y + 20);
    ctx.restore();

    const hpRatio = enemy.hp / enemy.maxHp;
    if (hpRatio < 1) {
      ctx.fillStyle = '#333';
      ctx.fillRect(enemy.x, enemy.y - 5, enemy.width, 3);
      ctx.fillStyle = enemy.flashTimer > 0 ? '#ffffff' : enemy.color;
      ctx.fillRect(enemy.x, enemy.y - 5, enemy.width * hpRatio, 3);
    }
  });

  projectiles.forEach(projectile => {
    ctx.fillStyle = projectile.color;
    if (projectile.type === 'SUDO_BLAST') {
      ctx.font = `10px ${GAME_FONT}`;
      ctx.fillText('sudo', projectile.x - 5, projectile.y);
    } else {
      ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
    }
  });

  ctx.font = '20px sans-serif';
  powerUps.forEach(powerUp => ctx.fillText(powerUp.icon, powerUp.x, powerUp.y + 20));

  particles.forEach(particle => {
    if (particle.id === 'shockwave') {
      ctx.save();
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, (1 - particle.life) * 600, 0, Math.PI * 2);
      ctx.strokeStyle = particle.color;
      ctx.lineWidth = 10 * particle.life;
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.fillText(particle.char, particle.x, particle.y);
    }
  });
  ctx.globalAlpha = 1;

  ctx.font = `bold 14px ${GAME_FONT}`;
  floatingTexts.forEach(text => {
    ctx.fillStyle = text.color;
    ctx.fillText(text.text, text.x, text.y);
  });

  const monolith = enemies.find(enemy => enemy.type === 'MONOLITH');
  if (monolith) {
    const barWidth = PLAYFIELD_WIDTH * 0.6;
    const barX = (PLAYFIELD_WIDTH - barWidth) / 2;
    const hpRatio = Math.max(0, monolith.hp / monolith.maxHp);
    const phase = hpRatio <= 0.25 ? 3 : hpRatio <= 0.6 ? 2 : 1;

    ctx.fillStyle = '#333';
    ctx.fillRect(barX, 20, barWidth, 15);
    ctx.fillStyle = phase >= 2 ? COLORS.error : '#f14c4c';
    ctx.fillRect(barX, 20, barWidth * hpRatio, 15);
    ctx.strokeStyle = phase >= 2 ? COLORS.warning : '#fff';
    ctx.strokeRect(barX, 20, barWidth, 15);
    ctx.fillStyle = phase >= 2 ? COLORS.warning : '#fff';
    ctx.textAlign = 'center';
    ctx.font = `bold 12px ${GAME_FONT}`;
    ctx.fillText(
      phase === 3
        ? t('bossBarPhase3', { wave: stats.wave })
        : phase === 2
          ? t('bossBarPhase2', { wave: stats.wave })
          : t('bossBar', { wave: stats.wave }),
      PLAYFIELD_WIDTH / 2,
      15,
    );
    ctx.textAlign = 'left';
  }

  if (player.invulnerable > 0 && player.invulnerable % 10 > 5) {
    const gradient = ctx.createRadialGradient(
      PLAYFIELD_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      CANVAS_HEIGHT / 3,
      PLAYFIELD_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      CANVAS_HEIGHT,
    );
    gradient.addColorStop(0, 'rgba(255,0,0,0)');
    gradient.addColorStop(1, 'rgba(255,0,0,0.3)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, PLAYFIELD_WIDTH, CANVAS_HEIGHT);
  }

  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  for (let y = 0; y < CANVAS_HEIGHT; y += 4) {
    ctx.fillRect(0, y, PLAYFIELD_WIDTH, 1);
  }

  ctx.restore();
  renderHealthHud(ctx, player);
  renderRefactorHud(ctx, player, timestamp);
  renderComboHud(ctx, stats);
  renderMinimap(ctx, player, enemies);
  return nextShake;
}
