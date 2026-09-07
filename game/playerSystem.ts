import {
  AMMO_REGEN,
  AMMO_REGEN_DELAY_MS,
  CANVAS_HEIGHT,
  COLORS,
  MAX_SPECIAL_CHARGE,
  PLAYFIELD_WIDTH,
  PLAYER_BOOST_SPEED,
  PLAYER_SPEED,
  RELOAD_TIME,
} from '../constants';
import type { GameStats, Player, Projectile } from '../types';
import { sfxShoot } from '../utils/audio';
import { FRAME_DURATION, regenerateAmmo } from '../utils/gameLogic';
import { t } from '../utils/i18n';
import { getComboBonuses, tickComboDecay } from './combo';
import { createPlayerProjectiles } from './entityFactory';

interface PlayerSystemContext {
  player: Player;
  stats: GameStats;
  keys: ReadonlySet<string>;
  frameScale: number;
  timestamp: number;
  lastFireTime: number;
  movementSensitivity: number;
  fastGcLevel: number;
  overclockLevel: number;
  addFloatingText: (
    x: number,
    y: number,
    text: string,
    color: string,
    vy?: number,
  ) => void;
  triggerUltimate: () => void;
}

export interface PlayerSystemResult {
  lastFireTime: number;
  projectiles: Projectile[];
}

export function updatePlayerSystem({
  player,
  stats,
  keys,
  frameScale,
  timestamp,
  lastFireTime,
  movementSensitivity,
  fastGcLevel,
  overclockLevel,
  addFloatingText,
  triggerUltimate,
}: PlayerSystemContext): PlayerSystemResult {
  const sensitivity = Math.max(0.5, Math.min(2, movementSensitivity || 1));
  const currentSpeed = (
    player.speedBuff > 0 ? PLAYER_BOOST_SPEED : PLAYER_SPEED
  ) * sensitivity;

  player.speedBuff = Math.max(0, player.speedBuff - frameScale);
  player.weaponBuff = Math.max(0, player.weaponBuff - frameScale);
  player.shield = Math.max(0, player.shield - frameScale);
  player.invulnerable = Math.max(0, player.invulnerable - frameScale);

  if (tickComboDecay(stats, frameScale)) {
    stats.lastLog = stats.combo > 0
      ? t('logComboDecay', { combo: stats.combo })
      : t('logComboBreak');
  }

  if (
    (keys.has('KeyR') || keys.has('ShiftLeft'))
    && player.specialCharge >= MAX_SPECIAL_CHARGE
  ) {
    triggerUltimate();
  }

  const dx = Number(keys.has('ArrowRight') || keys.has('KeyD')) - Number(keys.has('ArrowLeft') || keys.has('KeyA'));
  const dy = Number(keys.has('ArrowDown') || keys.has('KeyS')) - Number(keys.has('ArrowUp') || keys.has('KeyW'));
  const magnitude = Math.hypot(dx, dy) || 1;
  player.x += dx / magnitude * currentSpeed * frameScale;
  player.y += dy / magnitude * currentSpeed * frameScale;

  player.x = Math.max(0, Math.min(PLAYFIELD_WIDTH - player.width, player.x));
  player.y = Math.max(0, Math.min(CANVAS_HEIGHT - player.height, player.y));

  const reloadDuration = RELOAD_TIME * (1 - Math.min(3, fastGcLevel) * 0.1);
  const startReload = () => {
    player.isReloading = true;
    player.reloadTimer = reloadDuration;
    player.fireCadenceRemainderMs = 0;
    player.wasFiring = false;
    stats.lastLog = t('logGcPause');
    addFloatingText(player.x, player.y - 40, t('gcPause'), COLORS.warning);
  };
  const continuedFire = player.wasFiring === true && !player.isReloading && keys.has('Space');
  if (!continuedFire) player.fireCadenceRemainderMs = 0;
  if (player.isReloading) {
    player.reloadTimer -= frameScale;
    if (player.reloadTimer <= 0) {
      player.isReloading = false;
      player.ammo = player.maxAmmo;
      addFloatingText(player.x, player.y - 20, t('gcComplete'), COLORS.class);
    }
  } else if (keys.has('Space') && player.ammo < 1) {
    startReload();
  } else if (
    !keys.has('Space')
    && player.ammo < player.maxAmmo
    && timestamp - lastFireTime >= AMMO_REGEN_DELAY_MS
  ) {
    player.ammo = regenerateAmmo(
      player.ammo,
      player.maxAmmo,
      AMMO_REGEN,
      frameScale,
    );
  }

  const baseFireRate = player.weaponLevel >= 3 ? 110 : 150;
  const overclockMultiplier = 1 - Math.min(3, overclockLevel) * 0.08;
  const fireRate = baseFireRate
    * overclockMultiplier
    * getComboBonuses(stats.combo).fireRateMultiplier;
  const canShoot = !player.isReloading && player.ammo >= 1;
  const elapsed = timestamp - lastFireTime + (player.fireCadenceRemainderMs ?? 0);
  const shouldShoot = keys.has('Space') && elapsed + 1e-7 >= fireRate;
  player.wasFiring = keys.has('Space') && canShoot;

  if (!shouldShoot || !canShoot) {
    return { lastFireTime, projectiles: [] };
  }

  // Carry only normal fixed-step overshoot. Idle time and reloads never bank bursts.
  const overshoot = Math.max(0, elapsed - fireRate);
  player.fireCadenceRemainderMs = continuedFire && overshoot <= FRAME_DURATION * frameScale + 1e-7
    ? overshoot : 0;
  player.ammo -= 1;
  if (player.ammo < 1) startReload();

  stats.linesOfCode++;
  sfxShoot();

  return {
    lastFireTime: timestamp,
    projectiles: createPlayerProjectiles(player),
  };
}
