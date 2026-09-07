import { CANVAS_HEIGHT, PLAYFIELD_WIDTH } from '../constants';
import type {
  EnemyProjectile,
  FloatingText,
  Particle,
  Projectile,
} from '../types';

export function advancePlayerProjectiles(
  projectiles: Projectile[],
  frameScale: number,
): Projectile[] {
  projectiles.forEach((projectile) => {
    projectile.x += projectile.vx * frameScale;
    projectile.y += projectile.vy * frameScale;
    if ((projectile.bouncesRemaining ?? 0) > 0
      && (projectile.x < 0 || projectile.x + projectile.width > PLAYFIELD_WIDTH)) {
      projectile.vx *= -1;
      projectile.x = Math.max(0, Math.min(PLAYFIELD_WIDTH - projectile.width, projectile.x));
      projectile.bouncesRemaining = (projectile.bouncesRemaining ?? 0) - 1;
    }
  });

  return projectiles.filter(
    isProjectileInBounds,
  );
}

export function advanceEnemyProjectiles(
  projectiles: EnemyProjectile[],
  frameScale: number,
): EnemyProjectile[] {
  projectiles.forEach((projectile) => {
    projectile.x += projectile.vx * frameScale;
    projectile.y += projectile.vy * frameScale;
  });

  return projectiles.filter(isProjectileInBounds);
}

export function advanceParticles(
  particles: Particle[],
  frameScale: number,
): Particle[] {
  particles.forEach((particle) => {
    particle.x += particle.vx * frameScale;
    particle.y += particle.vy * frameScale;
    particle.life -= 0.02 * frameScale;
    particle.alpha = particle.life;
  });

  return particles.filter((particle) => particle.life > 0);
}

export function advanceFloatingTexts(
  floatingTexts: FloatingText[],
  frameScale: number,
): FloatingText[] {
  floatingTexts.forEach((floatingText) => {
    floatingText.y += floatingText.vy * frameScale;
    floatingText.life -= frameScale;
  });

  return floatingTexts.filter((floatingText) => floatingText.life > 0);
}

function isProjectileInBounds(projectile: Projectile | EnemyProjectile): boolean {
  return projectile.x >= -50 && projectile.x <= PLAYFIELD_WIDTH + 50
    && projectile.y >= -50 && projectile.y <= CANVAS_HEIGHT + 50;
}
