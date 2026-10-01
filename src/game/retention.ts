import type { PlayerSaveData } from '../types/game';

/**
 * Daily check-in ladder. Day 7 pays out twice the day-1 reward, which is the
 * retention hook: the cycle restarts so there is always a next-day pull.
 */
export const DAILY_REWARDS = [40, 60, 90, 130, 180, 250, 400] as const;

export interface DailyState {
  lastClaimDay: number | null;
  streak: number;
  claimedToday: boolean;
  nextDay: number;
  reward: number;
}

export function localDayNumber(now: Date = new Date()): number {
  return Math.floor(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(1970, 0, 1).getTime()) /
      86400000
  );
}

export function dailyState(save: PlayerSaveData, now: Date = new Date()): DailyState {
  const today = localDayNumber(now);
  const last = save.dailyLastClaimDay ?? null;
  const claimedToday = last === today;
  let streak = save.dailyStreak ?? 0;
  if (last !== null && last !== today && last < today) {
    if (today - last > 1) streak = 0;
  }
  const reward = DAILY_REWARDS[Math.min(streak, DAILY_REWARDS.length - 1)];
  return {
    lastClaimDay: last,
    streak,
    claimedToday,
    nextDay: (streak % DAILY_REWARDS.length) + 1,
    reward,
  };
}

export interface AchievementDef {
  id: string;
  label: string;
  hint: string;
  goal: number;
  value: (s: PlayerSaveData) => number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'land1', label: 'First Landing', hint: 'Seat one toupee', goal: 1, value: (s) => Math.min(1, s.maxStageReached - 1) },
  { id: 'land10', label: 'Regular Client', hint: 'Clear 10 stages', goal: 10, value: (s) => Math.max(0, s.maxStageReached - 1) },
  { id: 'honey5', label: 'Honey Calls', hint: 'Land 5 perfect fits', goal: 5, value: (s) => s.totalHoneyLandings },
  { id: 'honey25', label: 'Toupee Legend', hint: 'Land 25 perfect fits', goal: 25, value: (s) => s.totalHoneyLandings },
  { id: 'hop5', label: 'Five Hops', hint: 'Reach a 5-hop chain', goal: 5, value: (s) => s.endlessBestHops },
  { id: 'hop12', label: 'Stilt Walker', hint: 'Reach a 12-hop chain', goal: 12, value: (s) => s.endlessBestHops },
  { id: 'boss1', label: 'Boarder', hint: 'Beat the CEO chopper', goal: 1, value: (s) => s.bossDefeatedCount },
  { id: 'style3', label: 'Collector', hint: 'Own 3 toupees', goal: 3, value: (s) => s.collectedStyles.length },
  { id: 'style5', label: 'Full Wardrobe', hint: 'Own all 5 toupees', goal: 5, value: (s) => s.collectedStyles.length },
  { id: 'runs50', label: 'Fifty Flights', hint: 'Launch 50 flights', goal: 50, value: (s) => s.totalFlights },
];

export function achievementProgress(save: PlayerSaveData) {
  return ACHIEVEMENTS.map((a) => {
    const claimed = (save.claimedAchievements ?? []).includes(a.id);
    const value = Math.min(a.goal, Math.max(0, Math.floor(a.value(save))));
    return { ...a, value, claimed, done: value >= a.goal };
  });
}

export function achievementsJustUnlocked(save: PlayerSaveData) {
  const claimed = new Set(save.claimedAchievements ?? []);
  return achievementProgress(save)
    .filter((a) => a.done && !claimed.has(a.id))
    .map((a) => a.id);
}

const num = (v: unknown, fallback: number, min: number, max: number) => {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

/** Guards against corrupted or hand-edited localStorage payloads. */
export function sanitizeSave(raw: unknown): PlayerSaveData {
  const base: PlayerSaveData = {
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
    leaderboard: [],
    dailyStreak: 0,
    dailyLastClaimDay: null,
    claimedAchievements: [],
    lowFx: false,
    totalFlights: 0,
    tutorialDone: false,
  };
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;

  const styles = Array.isArray(r.collectedStyles)
    ? (r.collectedStyles.filter((s) => typeof s === 'string') as string[])
    : base.collectedStyles;
  if (!styles.includes('classic')) styles.unshift('classic');

  return {
    ...base,
    glideRatioLevel: Math.round(num(r.glideRatioLevel, 1, 1, 10)),
    magnetAttachmentLevel: Math.round(num(r.magnetAttachmentLevel, 1, 1, 10)),
    collectedStyles: styles,
    gold: Math.round(num(r.gold, 150, 0, 999999999)),
    equippedStyle: (typeof r.equippedStyle === 'string' ? r.equippedStyle : 'classic') as PlayerSaveData['equippedStyle'],
    currentStage: Math.round(num(r.currentStage, 1, 1, 999)),
    maxStageReached: Math.round(num(r.maxStageReached, 1, 1, 999)),
    endlessBestHops: Math.round(num(r.endlessBestHops, 0, 0, 999999)),
    endlessBestScore: Math.round(num(r.endlessBestScore, 0, 0, 999999999)),
    bossDefeatedCount: Math.round(num(r.bossDefeatedCount, 0, 0, 999999)),
    totalHoneyLandings: Math.round(num(r.totalHoneyLandings, 0, 0, 999999)),
    totalFlights: Math.round(num(r.totalFlights, 0, 0, 999999)),
    playerName:
      typeof r.playerName === 'string' && r.playerName.trim() ? r.playerName.trim().slice(0, 14) : base.playerName,
    leaderboard: Array.isArray(r.leaderboard) ? (r.leaderboard as PlayerSaveData['leaderboard']) : [],
    dailyStreak: Math.round(num(r.dailyStreak, 0, 0, 99)),
    dailyLastClaimDay: typeof r.dailyLastClaimDay === 'number' && Number.isFinite(r.dailyLastClaimDay) ? r.dailyLastClaimDay : null,
    claimedAchievements: Array.isArray(r.claimedAchievements)
      ? (r.claimedAchievements.filter((a) => typeof a === 'string') as string[])
      : [],
    lowFx: r.lowFx === true,
    tutorialDone: r.tutorialDone === true,
  };
}