
export enum GameState {
  START,
  PLAYING,
  GAME_OVER,
  PAUSED,
  UPGRADE
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  color: string;
}

export interface Player extends Entity {
  hp: number;
  maxHp: number;
  invulnerable: number;
  weaponLevel: number;
  speedBuff: number; // Frames remaining for speed boost
  weaponBuff: number; // Frames remaining for temporary Copilot weapon boost
  shield: number; // Frames remaining for shield
  pierceLevel?: number;
  ricochetLevel?: number;
  lastStandLevel?: number;
  damageMultiplier: number; // Permanent, gradual per-wave damage growth
  // Ammo Mechanics
  ammo: number;
  maxAmmo: number;
  isReloading: boolean;
  reloadTimer: number;
  // Special Ability
  specialCharge: number; // 0-100
}

export interface Projectile extends Entity {
  damage: number;
  hitsRemaining?: number;
  hitEnemyIds?: string[];
  bouncesRemaining?: number;
  type: 'DEFAULT' | 'TS_BEAM' | 'SUDO_BLAST';
}

export interface EnemyProjectile extends Entity {
  source?: EnemyType;
  damage: number;
  label: string; // e.g. "⚠" or "Error"
}

export type EnemyType = 
  | 'BUG' 
  | 'SYNTAX_ERROR' 
  | 'SPAGHETTI' 
  | 'MONOLITH' 
  | 'MEMORY_LEAK' 
  | 'ERROR_404'
  | 'MERGE_CONFLICT'
  | 'INFINITE_LOOP'
  | 'RACE_CONDITION';

export interface Enemy extends Entity {
  hp: number;
  maxHp: number;
  type: EnemyType;
  text: string;
  scoreValue: number;
  age: number;
  flashTimer: number; // For hit feedback
  wave?: number; // Spawn wave, used to scale enemy abilities
  bossComboDamage?: number; // Unbanked damage toward the next Boss combo stack
  shieldContactTimer?: number;
  bossSummonCooldown?: number; // Frames until the Monolith can summon again
}

export interface Particle extends Entity {
  life: number;
  maxLife: number;
  alpha: number;
  char: string;
}

export type PowerUpType = 'COFFEE' | 'COPILOT' | 'DOCKER' | 'HOTFIX';

export interface PowerUp extends Entity {
  type: PowerUpType;
  icon: string;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  vy: number;
}

export type UpgradeId = 'WEAPON' | 'MAX_HP' | 'MAX_AMMO' | 'RELOAD' | 'OVERCLOCK' | 'PIERCE' | 'RICOCHET' | 'LAST_STAND';

export interface UpgradeOption {
  id: UpgradeId;
  icon: string;
}

export interface GameStats {
  elapsedMs: number;
  entityCount: number;
  projectileCount: number;
  frameTimeMs: number;
  updateTimeMs: number;
  renderTimeMs: number;
  upgradeHistory: UpgradeId[];
  damageTaken: Record<string, number>;
  deathCause: string;
  score: number;
  bugsFixed: number;
  linesOfCode: number;
  wave: number;
  fps: number;
  lastLog: string;
  levelProgress: number;
  levelTarget: number;
  bossActive: boolean;
  combo: number;
  comboTimer: number;
  maxCombo: number;
  // Detailed stats for UI
  weaponLevel: number;
  ammo: number;
  maxAmmo: number;
  specialCharge: number;
  shieldActive: boolean;
  // Wave upgrade
  pendingUpgrades: UpgradeOption[];
}

export type SidebarView = 'EXPLORER' | 'SEARCH' | 'GIT' | 'DEBUG' | 'EXTENSIONS' | 'SETTINGS';
