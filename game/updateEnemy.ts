import { COLORS, PLAYFIELD_WIDTH } from '../constants';
import type { Enemy, EnemyProjectile, EnemyType, Player } from '../types';
import { crossedFrameInterval } from '../utils/gameLogic';

interface EnemyUpdateContext {
  player: Player;
  frameScale: number;
  enemyProjectiles: EnemyProjectile[];
  spawnEnemy: (type: EnemyType, x?: number, y?: number) => void;
  createExplosion: (x: number, y: number, color: string, count: number) => void;
  random?: () => number;
}

function clampEnemyToPlayfield(enemy: Enemy): void {
  const maxX = Math.max(0, PLAYFIELD_WIDTH - enemy.width);
  enemy.x = Math.max(0, Math.min(maxX, enemy.x));
}

function pushEnemyProjectile(
  projectiles: EnemyProjectile[],
  random: () => number,
  x: number,
  y: number,
  vx: number,
  vy: number,
  damage: number,
  label: string,
  color: string,
  size = 12,
): void {
  projectiles.push({
    id: `ep-${random()}`,
    x,
    y,
    width: size,
    height: size,
    vx,
    vy,
    color,
    damage,
    label,
  });
}

function fireAimedProjectile(
  enemy: Enemy,
  player: Player,
  projectiles: EnemyProjectile[],
  random: () => number,
  speed: number,
  damage: number,
  label = '!',
  color = COLORS.warning,
  size = 12,
): void {
  const x = enemy.x + enemy.width / 2;
  const y = enemy.y + enemy.height;
  const dx = player.x + player.width / 2 - x;
  const dy = player.y + player.height / 2 - y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  pushEnemyProjectile(
    projectiles,
    random,
    x,
    y,
    dx / distance * speed,
    dy / distance * speed,
    damage,
    label,
    color,
    size,
  );
}

export function updateEnemy(enemy: Enemy, context: EnemyUpdateContext): void {
  const {
    player,
    frameScale,
    enemyProjectiles,
    spawnEnemy,
    createExplosion,
    random = Math.random,
  } = context;
  const previousAge = enemy.age;
  const wave = Math.max(1, enemy.wave ?? 1);
  enemy.age += frameScale;
  if (enemy.flashTimer > 0) {
    enemy.flashTimer = Math.max(0, enemy.flashTimer - frameScale);
  }

  if (enemy.type === 'BUG') {
    const targetX = player.x + player.width / 2 - enemy.width / 2;
    enemy.vx = enemy.vx * 0.96 + Math.sign(targetX - enemy.x) * 0.035;
    enemy.x += enemy.vx * frameScale;
    enemy.y += enemy.vy * frameScale;
    clampEnemyToPlayfield(enemy);
    return;
  }

  if (enemy.type === 'SYNTAX_ERROR') {
    enemy.x += enemy.vx * frameScale;
    enemy.y += enemy.vy * frameScale;
    const interval = Math.max(105, 185 - wave * 8);
    if (crossedFrameInterval(previousAge, enemy.age, interval)) {
      fireAimedProjectile(
        enemy,
        player,
        enemyProjectiles,
        random,
        3.2 + Math.min(1.2, wave * 0.08),
        5 + Math.min(8, wave),
        '};',
        '#ff6b6b',
        20,
      );
    }
    clampEnemyToPlayfield(enemy);
    return;
  }

  if (enemy.type === 'INFINITE_LOOP') {
    enemy.x += Math.cos(enemy.age * 0.1) * 3 * frameScale;
    enemy.y += enemy.vy * frameScale;
    const interval = Math.max(110, 210 - wave * 10);
    if (crossedFrameInterval(previousAge, enemy.age, interval)) {
      const x = enemy.x + enemy.width / 2;
      const y = enemy.y + enemy.height / 2;
      [-2.8, -1.2, 1.2, 2.8].forEach(vx => {
        pushEnemyProjectile(
          enemyProjectiles,
          random,
          x,
          y,
          vx,
          3.8,
          5 + Math.min(7, wave),
          '∞',
          COLORS.keyword,
          10,
        );
      });
    }
    clampEnemyToPlayfield(enemy);
    return;
  }

  if (enemy.type === 'RACE_CONDITION') {
    enemy.y += enemy.vy * frameScale;
    if (crossedFrameInterval(previousAge, enemy.age, 60) && random() > 0.5) {
      createExplosion(enemy.x + enemy.width / 2, enemy.y, enemy.color, 3);
      enemy.x = random() * (PLAYFIELD_WIDTH - enemy.width);
      if (wave >= 5) {
        fireAimedProjectile(
          enemy,
          player,
          enemyProjectiles,
          random,
          4.2,
          7 + Math.min(8, wave),
          '⇄',
          COLORS.class,
        );
      }
    }
    clampEnemyToPlayfield(enemy);
    return;
  }

  if (enemy.type === 'MERGE_CONFLICT') {
    enemy.x += Math.sin(enemy.age * 0.05) * frameScale;
    enemy.y += enemy.vy * frameScale;
    clampEnemyToPlayfield(enemy);
    return;
  }

  if (enemy.type === 'MEMORY_LEAK') {
    if (crossedFrameInterval(previousAge, enemy.age, 40)) {
      const growth = Math.max(1, enemy.maxHp * 0.015);
      enemy.width += 2;
      enemy.height += 1;
      enemy.x -= 1;
      enemy.maxHp += growth;
      enemy.hp += growth;
      enemy.vy = Math.max(0.6, enemy.vy * 0.985);
    }
    enemy.y += enemy.vy * frameScale;
    clampEnemyToPlayfield(enemy);
    return;
  }

  if (enemy.type === 'SPAGHETTI') {
    enemy.x += Math.sin(enemy.age * 0.1) * 2 * frameScale;
    enemy.y += enemy.vy * frameScale;
    clampEnemyToPlayfield(enemy);
    return;
  }

  if (enemy.type === 'ERROR_404') {
    enemy.x += enemy.vx * frameScale;
    enemy.y += enemy.vy * frameScale;
    if (enemy.x <= 0 || enemy.x + enemy.width >= PLAYFIELD_WIDTH) {
      enemy.vx *= -1;
    }
    if (crossedFrameInterval(previousAge, enemy.age, 90)) {
      enemy.vx = Math.sign(player.x - enemy.x || enemy.vx)
        * (4 + Math.min(2, wave * 0.12));
    }
    clampEnemyToPlayfield(enemy);
    return;
  }

  if (enemy.type !== 'MONOLITH') {
    enemy.x += enemy.vx * frameScale;
    enemy.y += enemy.vy * frameScale;
    clampEnemyToPlayfield(enemy);
    return;
  }

  if (enemy.y < 60) {
    enemy.y += enemy.vy * frameScale;
    clampEnemyToPlayfield(enemy);
    return;
  }

  const hpRatio = enemy.hp / enemy.maxHp;
  const phase = hpRatio <= 0.25 ? 3 : hpRatio <= 0.6 ? 2 : 1;
  const hoverSpeed = phase === 3 ? 0.075 : phase === 2 ? 0.05 : 0.025;
  const moveSpeed = phase === 3 ? 4 : phase === 2 ? 2.4 : 1.2;

  enemy.y = 60 + Math.sin(enemy.age * hoverSpeed) * (phase === 3 ? 28 : 20);
  const dx = player.x + player.width / 2 - (enemy.x + enemy.width / 2);
  if (Math.abs(dx) > 16) {
    enemy.x += Math.sign(dx) * moveSpeed * 0.5 * frameScale;
  }
  clampEnemyToPlayfield(enemy);

  if (
    phase >= 2
    && crossedFrameInterval(previousAge, enemy.age, phase === 3 ? 8 : 12)
  ) {
    enemy.color = enemy.color === COLORS.error ? COLORS.keyword : COLORS.error;
  }

  const aimedInterval = Math.max(
    28,
    (phase === 3 ? 42 : phase === 2 ? 60 : 88) - wave * 2,
  );
  if (crossedFrameInterval(previousAge, enemy.age, aimedInterval)) {
    fireAimedProjectile(
      enemy,
      player,
      enemyProjectiles,
      random,
      4.8 + phase * 0.45,
      11 + wave * 1.5,
      '⚠',
      phase === 3 ? COLORS.error : COLORS.warning,
    );
  }

  if (
    phase >= 2
    && crossedFrameInterval(previousAge, enemy.age, phase === 3 ? 68 : 105)
  ) {
    const centerX = enemy.x + enemy.width / 2;
    const centerY = enemy.y + enemy.height;
    const velocities = phase === 3 ? [-4, -2, 0, 2, 4] : [-3, 0, 3];
    velocities.forEach(vx => {
      pushEnemyProjectile(
        enemyProjectiles,
        random,
        centerX,
        centerY,
        vx,
        5.5,
        8 + wave,
        '✖',
        COLORS.error,
        14,
      );
    });
  }

  const summonInterval = phase === 3 ? 135 : phase === 2 ? 180 : 250;
  if (crossedFrameInterval(previousAge, enemy.age, summonInterval)) {
    const leftType: EnemyType = wave >= 4 ? 'SPAGHETTI' : 'BUG';
    const rightType: EnemyType = phase >= 2 && wave >= 3
      ? 'MERGE_CONFLICT'
      : 'SYNTAX_ERROR';
    spawnEnemy(leftType, enemy.x, enemy.y + 80);
    spawnEnemy(rightType, enemy.x + enemy.width, enemy.y + 80);
  }
}
