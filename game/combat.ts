import { CANVAS_HEIGHT, COLORS, COPILOT_BUFF_DURATION } from '../constants';
import type {
  Enemy,
  EnemyProjectile,
  GameStats,
  Player,
  PowerUp,
  Projectile,
} from '../types';
import { sfxHeal, sfxHit, sfxPlayerHit, sfxPowerUp } from '../utils/audio';
import { applyDamage } from '../utils/gameLogic';
import { t } from '../utils/i18n';
import { intersects } from './collision';
import { addBossDamageCombo, getComboBonuses, penalizeCombo } from './combo';

interface CombatCallbacks {
  addFloatingText: (
    x: number,
    y: number,
    text: string,
    color: string,
    vy?: number,
  ) => void;
  createExplosion: (x: number, y: number, color: string, count: number) => void;
  handleEnemyDefeat: (enemy: Enemy) => void;
  triggerGameOver: () => void;
}

interface CombatContext extends CombatCallbacks {
  frameScale: number;
  player: Player;
  stats: GameStats;
  enemies: Enemy[];
  projectiles: Projectile[];
  enemyProjectiles: EnemyProjectile[];
  powerUps: PowerUp[];
}

export interface CombatResult {
  enemies: Enemy[];
  projectiles: Projectile[];
  powerUps: PowerUp[];
  shake: number;
}

function markConsumed(entity: { y: number }): void {
  entity.y = CANVAS_HEIGHT + 100;
}

function showBossComboGain(
  enemy: Enemy,
  gained: number,
  addFloatingText: CombatCallbacks['addFloatingText'],
): void {
  if (gained <= 0) return;
  addFloatingText(
    enemy.x + enemy.width / 2 - 35,
    enemy.y + enemy.height,
    t('bossComboGain', { n: gained }),
    COLORS.warning,
  );
}

export function resolveCombat({
  frameScale,
  player,
  stats,
  enemies,
  projectiles,
  enemyProjectiles,
  powerUps,
  addFloatingText,
  createExplosion,
  handleEnemyDefeat,
  triggerGameOver,
}: CombatContext): CombatResult {
  let shake = 0;

  enemies.forEach((enemy) => {
    if (!intersects(player, enemy)) return;

    if (player.shield > 0) {
      const damage = Math.min(enemy.hp, 10);
      enemy.hp = applyDamage(enemy.hp, damage);
      showBossComboGain(
        enemy,
        addBossDamageCombo(enemy, stats, damage),
        addFloatingText,
      );
      createExplosion(enemy.x, enemy.y, '#0db7ed', 5);
      addFloatingText(player.x, player.y - 20, t('blocked'), '#0db7ed');
      handleEnemyDefeat(enemy);
      return;
    }

    if (player.invulnerable > 0) return;

    player.hp -= 20;
    player.invulnerable = 60;
    player.weaponLevel = Math.max(1, player.weaponLevel - 1);
    penalizeCombo(stats);
    createExplosion(player.x, player.y, COLORS.error, 15);
    shake = 15;
    addFloatingText(player.x, player.y - 40, t('exception'), COLORS.error);
    sfxPlayerHit();
    if (player.hp <= 0) triggerGameOver();
    if (enemy.type !== 'MONOLITH') enemy.hp = 0;
  });

  enemyProjectiles.forEach((projectile) => {
    if (player.invulnerable > 0 || !intersects(player, projectile)) return;

    if (player.shield > 0) {
      addFloatingText(player.x, player.y - 20, t('blocked'), '#0db7ed');
    } else {
      player.hp -= projectile.damage;
      player.invulnerable = 40;
      penalizeCombo(stats);
      shake = 15;
      createExplosion(player.x, player.y, COLORS.error, 8);
      addFloatingText(
        player.x,
        player.y - 30,
        t('dmgLabel', { n: projectile.damage }),
        COLORS.error,
      );
      sfxPlayerHit();
      if (player.hp <= 0) triggerGameOver();
    }

    markConsumed(projectile);
  });

  projectiles.forEach((projectile) => {
    if (projectile.damage <= 0) return;

    // A projectile is spent on the first enemy it touches. `some` stops the scan
    // there, so enemies overlapping the same point no longer take phantom hits
    // (white flash, particles and a hit sound for zero damage).
    enemies.some((enemy) => {
      if (enemy.hp <= 0 || !intersects(projectile, enemy)) return false;

      const damage = Math.min(
        enemy.hp,
        projectile.damage * getComboBonuses(stats.combo).damageMultiplier,
      );
      enemy.hp -= damage;
      showBossComboGain(
        enemy,
        addBossDamageCombo(enemy, stats, damage),
        addFloatingText,
      );
      enemy.flashTimer = 3;
      projectile.damage = 0;
      createExplosion(projectile.x, projectile.y, COLORS.text, 1);
      sfxHit();
      handleEnemyDefeat(enemy);
      return true;
    });
  });

  powerUps.forEach((powerUp) => {
    powerUp.y += 2 * frameScale;
    if (!intersects(player, powerUp)) return;

    if (powerUp.type === 'COFFEE') {
      player.speedBuff = 600;
      addFloatingText(player.x, player.y, t('speedUp'), powerUp.color);
      sfxPowerUp();
    } else if (powerUp.type === 'COPILOT') {
      player.weaponBuff = COPILOT_BUFF_DURATION;
      addFloatingText(player.x, player.y, t('weaponBoost'), powerUp.color);
      sfxPowerUp();
    } else if (powerUp.type === 'DOCKER') {
      player.shield = 300;
      addFloatingText(player.x, player.y, t('shield'), powerUp.color);
      sfxPowerUp();
    } else if (powerUp.type === 'HOTFIX') {
      const healed = Math.min(player.maxHp - player.hp, 30);
      player.hp = Math.min(player.maxHp, player.hp + 30);
      addFloatingText(player.x, player.y, t('hpGain', { n: healed }), powerUp.color);
      sfxHeal();
    }

    markConsumed(powerUp);
  });

  return {
    projectiles: projectiles.filter((projectile) => projectile.damage > 0),
    enemies: enemies.filter(
      (enemy) => enemy.y < CANVAS_HEIGHT && enemy.hp > 0,
    ),
    powerUps: powerUps.filter((powerUp) => powerUp.y < CANVAS_HEIGHT),
    shake,
  };
}
