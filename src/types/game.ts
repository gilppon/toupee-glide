export type ToupeeStyleId = 'classic' | 'afro' | 'elvis' | 'rainbow' | 'golden';

export interface ToupeeShopData {
  glideRatioLevel: number;
  magnetAttachmentLevel: number;
  collectedStyles: string[];
}

export interface PlayerSaveData extends ToupeeShopData {
  gold: number;
  equippedStyle: ToupeeStyleId;
  currentStage: number;
  maxStageReached: number;
  endlessBestHops: number;
  endlessBestScore: number;
  bossDefeatedCount: number;
  totalHoneyLandings: number;
  playerName: string;
  leaderboard: LeaderboardEntry[];
  dailyStreak: number;
  dailyLastClaimDay: number | null;
  claimedAchievements: string[];
  lowFx: boolean;
  totalFlights: number;
  tutorialDone: boolean;
}

export interface ToupeeStyleConfig {
  id: ToupeeStyleId;
  nameEn: string;
  tagline: string;
  price: number;
  glideBonus: number;       // Extra glide lift multiplier
  magnetBonus: number;      // Extra magnet pull radius (px)
  goldBonusMultiplier: number;
  primaryColor: string;
  secondaryColor: string;
  badgeText: string;
}

export type GameMode = 'stage' | 'endless' | 'boss';

export type GamePhase =
  | 'ready'       // Standing on the barbershop launch balcony
  | 'flying'      // Gliding in mid-air
  | 'landed'      // Successfully seated on a bald gentleman (stage/boss win)
  | 'crashed'     // Hit the sidewalk or missed the target
  | 'paused';     // Auto-paused when the tab loses focus

export interface WindZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;     // Horizontal wind velocity (px/s)
  vy: number;     // Vertical wind velocity (px/s, negative = updraft, positive = downdraft)
  type: 'updraft' | 'downdraft' | 'gust' | 'boss_downdraft';
  label?: string;
}

export interface BaldGentleman {
  id: string;
  x: number;
  y: number;
  vx: number;
  headRadius: number;
  suitColor: string;
  tieColor: string;
  hasMustache: boolean;
  hasGlasses: boolean;
  name: string;
  quoteWaiting: string;
  quoteLanded: string;
  hasToupeeLanded: boolean;
  landedStyle?: ToupeeStyleId;
  landedAccuracy?: number; // 0 to 100
  landedOffsetX?: number;
  bounceCooldown?: number;
  isVip?: boolean;
}

export interface BossHelicopter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotorAngle: number;
  downdraftStrength: number;
  downdraftWidth: number;
  /**
   * 3-second timing window cycle:
   * When > 0, the CEO leans his shiny head out and the downdraft briefly weakens,
   * so the player must land inside that 3.0s window.
   */
  landingWindowTimer: number;
  cooldownTimer: number;
  maxWindowDuration: number;
  hp: number;
  maxHp: number;
  isVulnerable: boolean;
  headOffsetX: number;
  headOffsetY: number;
  headRadius: number;
  hasToupeeLanded: boolean;
  landedStyle?: ToupeeStyleId;
}

export interface PigeonObstacle {
  id: string;
  x: number;
  y: number;
  vx: number;
  wingPhase: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  hops: number;
  score: number;
  styleId: ToupeeStyleId;
  date: string;
  isPlayer?: boolean;
}

export interface FloatingCallout {
  id: string;
  x: number;
  y: number;
  text: string;
  subtext?: string;
  color: string;
  scale: number;
  alpha: number;
  vy: number;
}