import { COLORS, PARTICLE_CHARS, PLAYFIELD_WIDTH } from '../constants';
import type {
  Enemy,
  FloatingText,
  Particle,
  Player,
  PowerUp,
  Projectile,
} from '../types';
import {
  selectEnemyDefinition,
  selectPowerUpDefinition,
} from './contentSelection';
import type { EnemySpawnType } from './contentSelection';

type RandomSource = () => number;

interface EnemySpawnOptions {
  x?: number;
  y?: number;
  hpScale?: number;
}

export function createExplosionParticles(
  x: number,
  y: number,
  color: string,
  count: number,
  random: RandomSource = Math.random,
): Particle[] {
  return Array.from({ length: count }, () => {
    const angle = random() * Math.PI * 2;
    const speed = random() * 4 + 1;

    return {
      id: random().toString(),
      x,
      y,
      width: 10,
      height: 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      life: 1,
      maxLife: 1,
      alpha: 1,
      char: PARTICLE_CHARS[Math.floor(random() * PARTICLE_CHARS.length)],
    };
  });
}

export function createFloatingText(
  x: number,
  y: number,
  text: string,
  color: string,
  vy = -1,
  random: RandomSource = Math.random,
): FloatingText {
  return {
    id: random().toString(),
    x,
    y,
    text,
    color,
    life: 60,
    vy,
  };
}

export function createEnemy(
  type: EnemySpawnType,
  wave: number,
  options: EnemySpawnOptions = {},
  random: RandomSource = Math.random,
): Enemy {
  const definition = selectEnemyDefinition(type, wave, random);
  const waveIndex = Math.max(0, wave - 1);
  const hpScale = 1.15 * Math.pow(1.16, waveIndex);
  const hp = definition.hp * hpScale * (options.hpScale ?? 1);
  const speedScale = 1 + Math.min(0.35, waveIndex * 0.035);
  const bonusFallSpeed = Math.min(0.6, waveIndex * 0.04);
  const horizontalVelocity = definition.type === 'ERROR_404'
    ? (random() >= 0.5 ? 3.5 : -3.5)
    : (random() - 0.5) * 0.5;

  return {
    id: random().toString(),
    x: options.x ?? random() * (PLAYFIELD_WIDTH - definition.width),
    y: options.y ?? -60,
    width: definition.width,
    height: 24,
    vx: horizontalVelocity,
    vy: definition.speed * speedScale + bonusFallSpeed,
    color: definition.color,
    type: definition.type,
    hp,
    maxHp: hp,
    text: definition.text,
    scoreValue: Math.round(definition.score * (1 + waveIndex * 0.12)),
    age: 0,
    flashTimer: 0,
    wave,
    bossComboDamage: 0,
  };
}

export function createBoss(
  wave: number,
  random: RandomSource = Math.random,
): Enemy {
  const definition = selectEnemyDefinition('MONOLITH', wave, random);
  const hp = definition.hp * 1.75 * Math.pow(1.3, Math.max(0, wave - 1));

  return {
    id: `boss-${random()}`,
    x: PLAYFIELD_WIDTH / 2 - definition.width / 2,
    y: -150,
    width: definition.width,
    height: 60,
    vx: 0,
    vy: 2,
    color: definition.color,
    type: 'MONOLITH',
    hp,
    maxHp: hp,
    text: definition.text,
    scoreValue: Math.round(definition.score * (1 + Math.max(0, wave - 1) * 0.2)),
    age: 0,
    flashTimer: 0,
    wave,
    bossComboDamage: 0,
    bossSummonCooldown: 0,
  };
}

export function createPlayerProjectiles(
  player: Player,
  random: RandomSource = Math.random,
): Projectile[] {
  const damageScale = player.damageMultiplier * (player.ammo / player.maxAmmo <= 0.25 ? 1 + (player.lastStandLevel ?? 0) * 0.25 : 1);
  const weaponLevel = Math.min(
    5,
    player.weaponLevel + (player.weaponBuff > 0 ? 1 : 0),
  );
  const projectiles: Projectile[] = [{
    id: random().toString(),
    x: player.x + player.width / 2 - 2,
    y: player.y,
    width: 4,
    height: 12,
    vx: 0,
    vy: -12,
    color: COLORS.keyword,
    damage: (10 + (weaponLevel - 1) * 1.5) * damageScale,
    type: 'DEFAULT',
  }];

  if (weaponLevel >= 2 || (player.ricochetLevel ?? 0) > 0) {
    projectiles.push(
      {
        id: random().toString(),
        x: player.x,
        y: player.y + 10,
        width: 3,
        height: 10,
        vx: -1,
        vy: -10,
        color: COLORS.function,
        damage: (2.5 + (weaponLevel - 2) * 0.5) * damageScale,
        type: 'TS_BEAM',
      },
      {
        id: random().toString(),
        x: player.x + player.width,
        y: player.y + 10,
        width: 3,
        height: 10,
        vx: 1,
        vy: -10,
        color: COLORS.function,
        damage: (2.5 + (weaponLevel - 2) * 0.5) * damageScale,
        type: 'TS_BEAM',
      },
    );
  }

  if (weaponLevel >= 4) {
    projectiles.push(
      {
        id: random().toString(),
        x: player.x,
        y: player.y + 10,
        width: 4,
        height: 8,
        vx: -4,
        vy: -8,
        color: COLORS.string,
        damage: (4 + (weaponLevel - 4)) * damageScale,
        type: 'SUDO_BLAST',
      },
      {
        id: random().toString(),
        x: player.x + player.width,
        y: player.y + 10,
        width: 4,
        height: 8,
        vx: 4,
        vy: -8,
        color: COLORS.string,
        damage: (4 + (weaponLevel - 4)) * damageScale,
        type: 'SUDO_BLAST',
      },
    );
  }

  return projectiles.map(projectile => ({
    ...projectile,
    hitsRemaining: 1 + (player.pierceLevel ?? 0),
    bouncesRemaining: player.ricochetLevel ?? 0,
    hitEnemyIds: [],
  }));
}

export function createPowerUpDrop(
  enemy: Enemy,
  random: RandomSource = Math.random,
): PowerUp {
  const definition = selectPowerUpDefinition(random);

  return {
    id: random().toString(),
    x: enemy.x + enemy.width / 2 - 12,
    y: enemy.y,
    width: 24,
    height: 24,
    vx: 0,
    vy: 2,
    color: definition.color,
    type: definition.type,
    icon: definition.icon,
  };
}
