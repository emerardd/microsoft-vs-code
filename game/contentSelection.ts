import { ENEMY_TYPES, POWER_UPS, UPGRADE_OPTIONS } from '../constants';
import type { EnemyType, UpgradeId, UpgradeOption } from '../types';

type RandomSource = () => number;
export type EnemySpawnType = EnemyType | 'RANDOM';

export function pickUpgradeChoices(
  count = 3,
  random: RandomSource = Math.random,
  excluded: readonly UpgradeId[] = [],
): UpgradeOption[] {
  const excludedIds = new Set(excluded);
  const pool: UpgradeOption[] = UPGRADE_OPTIONS
    .filter(option => !excludedIds.has(option.id))
    .map(option => ({ ...option }));
  const result: UpgradeOption[] = [];

  while (result.length < count && pool.length > 0) {
    const index = Math.floor(random() * pool.length);
    result.push(pool.splice(index, 1)[0]);
  }

  return result;
}

export function selectEnemyDefinition(
  type: EnemySpawnType,
  wave: number,
  random: RandomSource = Math.random,
): typeof ENEMY_TYPES[number] {
  if (type !== 'RANDOM') {
    return ENEMY_TYPES.find(enemy => enemy.type === type) ?? ENEMY_TYPES[0];
  }

  const roll = random();
  if (wave === 1) {
    return roll > 0.8 ? ENEMY_TYPES[1] : ENEMY_TYPES[0];
  }

  if (wave === 2) {
    if (roll > 0.82) return ENEMY_TYPES[2];
    if (roll > 0.55) return ENEMY_TYPES[1];
    return ENEMY_TYPES[0];
  }

  if (wave === 3) {
    if (roll > 0.9) return ENEMY_TYPES[3];
    if (roll > 0.72) return ENEMY_TYPES[7];
    if (roll > 0.48) return ENEMY_TYPES[2];
    if (roll > 0.2) return ENEMY_TYPES[1];
    return ENEMY_TYPES[0];
  }

  if (wave === 4) {
    if (roll > 0.9) return ENEMY_TYPES[4];
    if (roll > 0.78) return ENEMY_TYPES[6];
    if (roll > 0.62) return ENEMY_TYPES[3];
    if (roll > 0.42) return ENEMY_TYPES[7];
    if (roll > 0.2) return ENEMY_TYPES[2];
    return ENEMY_TYPES[0];
  }

  if (roll > 0.92) return ENEMY_TYPES[5];
  if (roll > 0.78) return ENEMY_TYPES[4];
  if (roll > 0.64) return ENEMY_TYPES[3];
  if (roll > 0.49) return ENEMY_TYPES[6];
  if (roll > 0.34) return ENEMY_TYPES[7];
  if (roll > Math.max(0.12, 0.26 - (wave - 5) * 0.015)) return ENEMY_TYPES[2];
  return ENEMY_TYPES[0];
}

export function selectPowerUpDefinition(
  random: RandomSource = Math.random,
): typeof POWER_UPS[number] {
  const totalWeight = POWER_UPS.reduce((sum, powerUp) => sum + powerUp.chance, 0);
  let roll = random() * totalWeight;

  for (const powerUp of POWER_UPS) {
    roll -= powerUp.chance;
    if (roll <= 0) return powerUp;
  }

  return POWER_UPS[POWER_UPS.length - 1];
}
