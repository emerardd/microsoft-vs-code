import {
  CANVAS_HEIGHT,
  COLORS,
  MAX_SPECIAL_CHARGE,
  PLAYFIELD_WIDTH,
  SPECIAL_CHARGE_PER_KILL,
} from '../constants';
import type {
  Enemy,
  GameStats,
  Player,
  PowerUp,
  UpgradeOption,
} from '../types';
import { sfxExplosion, sfxWaveClear } from '../utils/audio';
import { t } from '../utils/i18n';
import { createPowerUpDrop } from './entityFactory';
import type { EnemySpawnType } from './contentSelection';
import { addComboStacks, getComboBonuses } from './combo';

type RandomSource = () => number;

interface EnemyDefeatContext {
  player: Player;
  stats: GameStats;
  spawnEnemy: (
    type: EnemySpawnType,
    x?: number,
    y?: number,
    hpScale?: number,
  ) => void;
  createExplosion: (x: number, y: number, color: string, count: number) => void;
  addFloatingText: (
    x: number,
    y: number,
    text: string,
    color: string,
    vy?: number,
  ) => void;
  random?: RandomSource;
  grantSpecialCharge?: boolean;
}

export interface EnemyDefeatResult {
  defeated: boolean;
  victory: boolean;
  clearEnemyProjectiles: boolean;
  droppedPowerUp: PowerUp | null;
  shake: number;
  upgradeChoices: UpgradeOption[];
}

const notDefeated = (): EnemyDefeatResult => ({
  defeated: false,
  victory: false,
  clearEnemyProjectiles: false,
  droppedPowerUp: null,
  shake: 0,
  upgradeChoices: [],
});

export function resolveEnemyDefeat(
  enemy: Enemy,
  {
    player,
    stats,
    spawnEnemy,
    createExplosion,
    addFloatingText,
    random = Math.random,
    grantSpecialCharge = true,
  }: EnemyDefeatContext,
): EnemyDefeatResult {
  if (enemy.hp > 0) return notDefeated();

  enemy.hp = 0;
  createExplosion(
    enemy.x + enemy.width / 2,
    enemy.y + enemy.height / 2,
    enemy.color,
    12,
  );
  sfxExplosion();

  if (enemy.type === 'MERGE_CONFLICT') {
    spawnEnemy('BUG', enemy.x - 20, enemy.y, 0.5);
    spawnEnemy('BUG', enemy.x + 20, enemy.y, 0.5);
    addFloatingText(enemy.x, enemy.y, t('split'), COLORS.gitModified);
  }

  const comboBonuses = getComboBonuses(stats.combo);
  stats.score += Math.floor(enemy.scoreValue * comboBonuses.scoreMultiplier);
  stats.bugsFixed++;
  addComboStacks(stats);

  if (grantSpecialCharge) {
    player.specialCharge = Math.min(
      MAX_SPECIAL_CHARGE,
      player.specialCharge + SPECIAL_CHARGE_PER_KILL * comboBonuses.chargeMultiplier,
    );
  }

  if (stats.combo > 1 && stats.combo % 5 === 0) {
    addFloatingText(
      player.x,
      player.y - 50,
      t('comboLabel', { n: stats.combo }),
      COLORS.warning,
    );
  }

  let clearEnemyProjectiles = false;
  let shake = 0;
  const upgradeChoices: UpgradeOption[] = [];

  if (enemy.type === 'MONOLITH') {
    stats.bossActive = false;
    stats.outcome = 'victory';
    stats.deathCause = '';
    stats.lastLog = t('runVictory');
    addFloatingText(
      PLAYFIELD_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      t('deploySuccess'),
      COLORS.class,
    );
    clearEnemyProjectiles = true;
    shake = 20;
    sfxWaveClear();
  } else if (!stats.bossActive) {
    stats.levelProgress = Math.min(stats.levelTarget, stats.levelProgress + 1);
  }

  return {
    defeated: true,
    victory: enemy.type === 'MONOLITH',
    clearEnemyProjectiles,
    droppedPowerUp: random() < 0.15
      ? createPowerUpDrop(enemy, random)
      : null,
    shake,
    upgradeChoices,
  };
}
