import { CANVAS_HEIGHT, COLORS, MAX_RICOCHET_LEVEL, PLAYFIELD_WIDTH } from '../constants';
import type { Player, UpgradeId } from '../types';
import { t } from '../utils/i18n';

export interface RunModifiers {
  fastGcLevel: number;
  overclockLevel: number;
}

type AddFloatingText = (
  x: number,
  y: number,
  text: string,
  color: string,
  vy?: number,
) => void;

export function applyUpgrade(
  upgrade: UpgradeId,
  player: Player,
  modifiers: RunModifiers,
  addFloatingText: AddFloatingText,
): RunModifiers {
  const nextModifiers = { ...modifiers };
  const x = PLAYFIELD_WIDTH / 2;
  const y = CANVAS_HEIGHT / 2;

  switch (upgrade) {
    case 'PIERCE':
      player.pierceLevel = Math.min(2, (player.pierceLevel ?? 0) + 1);
      break;
    case 'RICOCHET':
      player.ricochetLevel = Math.min(MAX_RICOCHET_LEVEL, (player.ricochetLevel ?? 0) + 1);
      break;
    case 'LAST_STAND':
      player.lastStandLevel = Math.min(2, (player.lastStandLevel ?? 0) + 1);
      break;
    case 'WEAPON':
      player.weaponLevel = Math.min(5, player.weaponLevel + 1);
      addFloatingText(x, y, t('compilerUpgraded'), COLORS.class);
      break;
    case 'MAX_HP':
      player.maxHp += 12;
      player.hp = Math.min(player.maxHp, player.hp + 12);
      addFloatingText(x, y, t('heapExpanded'), COLORS.gitAdded);
      break;
    case 'MAX_AMMO':
      player.maxAmmo += 5;
      player.ammo = Math.min(player.maxAmmo, player.ammo + 5);
      addFloatingText(x, y, t('bufferOverflow'), COLORS.keyword);
      break;
    case 'RELOAD':
      nextModifiers.fastGcLevel = Math.min(3, modifiers.fastGcLevel + 1);
      addFloatingText(x, y, t('fastGcEnabled'), COLORS.function);
      break;
    case 'OVERCLOCK':
      nextModifiers.overclockLevel = Math.min(3, modifiers.overclockLevel + 1);
      addFloatingText(x, y, t('overclocked'), COLORS.warning);
      break;
  }

  return nextModifiers;
}
