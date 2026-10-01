import { LeaderboardEntry, PlayerSaveData, ToupeeStyleConfig, ToupeeStyleId } from '../types/game';

/**
 * All display strings are ASCII English on purpose.
 * Keep this file ASCII-only: PowerShell round-trips mangle Hangul (mojibake).
 * The numeric block (price, glideBonus, magnetBonus, goldBonusMultiplier) is the
 * balance layer and must stay untouched.
 */
export const TOUPEE_STYLES: Record<ToupeeStyleId, ToupeeStyleConfig> = {
  classic: {
    id: 'classic',
    nameEn: 'Classic Gentleman',
    tagline: 'The 2:8 side part, perfected. Sits on any bald head.',
    price: 0,
    glideBonus: 1.0,
    magnetBonus: 0,
    goldBonusMultiplier: 1.0,
    primaryColor: '#4A2E1B',
    secondaryColor: '#7C5135',
    badgeText: 'STANDARD',
  },
  afro: {
    id: 'afro',
    nameEn: 'Afro Funk Cloud',
    tagline: 'Volume turns drag into a parachute. Updraft lift +20%',
    price: 250,
    glideBonus: 1.22,
    magnetBonus: 12,
    goldBonusMultiplier: 1.2,
    primaryColor: '#1E1B18',
    secondaryColor: '#F59E0B',
    badgeText: 'LIFT',
  },
  elvis: {
    id: 'elvis',
    nameEn: 'Elvis Pompadour',
    tagline: 'Steel-strong wax. Punches straight through headwinds.',
    price: 550,
    glideBonus: 1.35,
    magnetBonus: 22,
    goldBonusMultiplier: 1.35,
    primaryColor: '#0F172A',
    secondaryColor: '#38BDF8',
    badgeText: 'GALE BREAKER',
  },
  rainbow: {
    id: 'rainbow',
    nameEn: 'Rainbow Prism Wig',
    tagline: 'Static charge: huge magnet pull, 50% bigger tips.',
    price: 950,
    glideBonus: 1.48,
    magnetBonus: 38,
    goldBonusMultiplier: 1.5,
    primaryColor: '#EC4899',
    secondaryColor: '#8B5CF6',
    badgeText: 'MAGNET + TIPS',
  },
  golden: {
    id: 'golden',
    nameEn: '24K Golden Crown',
    tagline: '24K weft the CEO admired. Best hang time, honey landings.',
    price: 1600,
    glideBonus: 1.65,
    magnetBonus: 52,
    goldBonusMultiplier: 2.0,
    primaryColor: '#F59E0B',
    secondaryColor: '#FEF08A',
    badgeText: 'LEGEND',
  },
};

export const STYLE_ORDER: ToupeeStyleId[] = ['classic', 'afro', 'elvis', 'rainbow', 'golden'];

export function getGlideUpgradeCost(level: number): number {
  return Math.round(100 * Math.pow(1.42, level - 1));
}

export function getMagnetUpgradeCost(level: number): number {
  return Math.round(120 * Math.pow(1.45, level - 1));
}

export function getGlideRatioStat(level: number, styleId: ToupeeStyleId): {
  ratioText: string;
  sinkReductionPct: number;
  liftForce: number;
} {
  const styleBonus = TOUPEE_STYLES[styleId]?.glideBonus ?? 1.0;
  const rawRatio = (3.2 + (level - 1) * 0.55) * styleBonus;
  const sinkReductionPct = Math.min(68, Math.round((level - 1) * 6.5 + (styleBonus - 1) * 35));
  const liftForce = Math.round((270 + (level - 1) * 20) * Math.sqrt(styleBonus));
  return {
    ratioText: `${rawRatio.toFixed(1)} : 1`,
    sinkReductionPct,
    liftForce,
  };
}

export function getMagnetStat(level: number, styleId: ToupeeStyleId): {
  radiusPx: number;
  pullStrength: number;
} {
  const styleBonus = TOUPEE_STYLES[styleId]?.magnetBonus ?? 0;
  const radiusPx = 58 + (level - 1) * 14 + styleBonus;
  const pullStrength = 180 + (level - 1) * 48 + styleBonus * 2.5;
  return {
    radiusPx: Math.round(radiusPx),
    pullStrength: Math.round(pullStrength),
  };
}

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'npc-1',
    name: 'Mr. Park, Wig Artisan',
    hops: 18,
    score: 4850,
    styleId: 'golden',
    date: '2026-03-19',
  },
  {
    id: 'npc-2',
    name: 'Kim, Son of the Wind',
    hops: 14,
    score: 3420,
    styleId: 'rainbow',
    date: '2026-03-20',
  },
  {
    id: 'npc-3',
    name: 'Elvis Kang, Pomade Man',
    hops: 11,
    score: 2680,
    styleId: 'elvis',
    date: '2026-03-21',
  },
  {
    id: 'npc-4',
    name: 'Disco King Afro-Man',
    hops: 8,
    score: 1890,
    styleId: 'afro',
    date: '2026-03-21',
  },
  {
    id: 'npc-5',
    name: 'Jongno Barber Apprentice',
    hops: 5,
    score: 1050,
    styleId: 'classic',
    date: '2026-03-22',
  },
];

export const GENTLEMAN_PROFILES = [
  {
    name: 'Mr. Kim',
    quoteWaiting: 'Losing my hair in this wind is a pain...',
    quoteLanded: 'Oh! I look ten years younger!',
    suitColor: '#1E293B',
    tieColor: '#EF4444',
    hasMustache: true,
    hasGlasses: true,
  },
  {
    name: 'Mr. Park',
    quoteWaiting: 'Big meeting today and my scalp is showing!',
    quoteLanded: 'That is a perfect fit. Approved!',
    suitColor: '#1E3A8A',
    tieColor: '#F59E0B',
    hasMustache: false,
    hasGlasses: true,
  },
  {
    name: 'Mr. Choi',
    quoteWaiting: 'Where did the wind take my toupee?!',
    quoteLanded: 'Found it. My youth again. Thank you!',
    suitColor: '#3F2E21',
    tieColor: '#10B981',
    hasMustache: true,
    hasGlasses: false,
  },
  {
    name: 'Capt. Jung',
    quoteWaiting: 'All that sunlight, and it is my scalp...',
    quoteLanded: 'Wow! Magnificent volume up there!',
    suitColor: '#334155',
    tieColor: '#EC4899',
    hasMustache: false,
    hasGlasses: false,
  },
  {
    name: 'Dr. Kang',
    quoteWaiting: 'A bald barber. How embarrassing.',
    quoteLanded: 'You saved my reputation. Take a bow!',
    suitColor: '#4C1D95',
    tieColor: '#38BDF8',
    hasMustache: true,
    hasGlasses: true,
  },
];

export const DEFAULT_SAVE_DATA: PlayerSaveData = {
  glideRatioLevel: 1,
  magnetAttachmentLevel: 1,
  collectedStyles: ['classic'],
  gold: 150,
  equippedStyle: 'classic',
  currentStage: 1,
  maxStageReached: 1,
  endlessBestHops: 0,
  endlessBestScore: 0,
  bossDefeatedCount: 0,
  totalHoneyLandings: 0,
  playerName: 'Toupee Pilot',
  leaderboard: INITIAL_LEADERBOARD,
  dailyStreak: 0,
  dailyLastClaimDay: null,
  claimedAchievements: [],
  lowFx: false,
  totalFlights: 0,
  tutorialDone: false,
};