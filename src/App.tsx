import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Store,
  Trophy,
  Volume2,
  VolumeX,
  Coins,
  Flame,
  ShieldAlert,
  Compass,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CalendarCheck,
  Award,
  Zap,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { soundFX } from './audio/SoundEffects';
import { FlyingToupeeGameCanvas } from './components/FlyingToupeeGameCanvas';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ToupeeShopUI } from './components/ToupeeShopUI';
import { DailyModal } from './components/DailyModal';
import { AchievementsModal } from './components/AchievementsModal';
import AdOverlay from './components/AdOverlay';
import { Ads, registerAdUI } from './game/ads';
import type { AdKind } from './game/ads';
import {
  DEFAULT_SAVE_DATA,
  TOUPEE_STYLES,
  getGlideUpgradeCost,
  getMagnetUpgradeCost,
} from './data/toupeeData';
import {
  ACHIEVEMENTS,
  achievementsJustUnlocked,
  dailyState,
  localDayNumber,
  sanitizeSave,
} from './game/retention';
import { GameMode, LeaderboardEntry, PlayerSaveData, ToupeeStyleId } from './types/game';

const STORAGE_KEY = 'flying_toupee_glider_save_v1';

interface AdState {
  kind: AdKind;
  done: (ok: boolean) => void;
}

export function App() {
  const [saveData, setSaveData] = useState<PlayerSaveData>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = sanitizeSave(raw ? JSON.parse(raw) : null);
      if (!parsed.leaderboard.length) {
        parsed.leaderboard = DEFAULT_SAVE_DATA.leaderboard.map((e) => ({ ...e }));
      }
      return parsed;
    } catch {
      return { ...DEFAULT_SAVE_DATA, leaderboard: DEFAULT_SAVE_DATA.leaderboard.map((e) => ({ ...e })) };
    }
  });

  const [mode, setMode] = useState<GameMode>('stage');
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isDailyOpen, setIsDailyOpen] = useState(false);
  const [isAchOpen, setIsAchOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [ad, setAd] = useState<AdState | null>(null);
  const [adBusy, setAdBusy] = useState(false);
  const [rewardedGold, setRewardedGold] = useState<number | null>(null);
  const [runCount, setRunCount] = useState(0);
  const [armedReset, setArmedReset] = useState(false);

  const daily = useMemo(() => dailyState(saveData), [saveData]);
  const doneAchievements = useMemo(
    () => ACHIEVEMENTS.filter((a) => a.value(saveData) >= a.goal).length,
    [saveData]
  );
  const unclaimedCount = useMemo(
    () => achievementsJustUnlocked(saveData).length,
    [saveData]
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    } catch {
      // Ignore storage quota errors
    }
  }, [saveData]);

  // Portal SDK init + mock ad UI registration.
  // Poki requires gameLoadingFinished() on load but gameplayStart() only on the
  // player's first input, so gameplayStart is NOT fired here (see firstInput below).
  useEffect(() => {
    registerAdUI((kind, done) => setAd({ kind, done }));
    void Ads.init().then(() => {
      Ads.loadingFinished();
    });
    return () => {
      registerAdUI(null);
      Ads.gameplayStop();
    };
  }, []);

  /**
   * Poki rules this enforces:
   *  - gameplayStart() must fire on the player's first input, not on load
   *  - SDK events must never fire twice in succession
   *  - mode switch order is gameplayStop() -> commercialBreak() -> gameplayStart()
   */
  const gameplayRunningRef = useRef(false);

  /** Fires gameplayStart() exactly once, the first time the player does anything. */
  const ensureGameplayStarted = useCallback(() => {
    if (gameplayRunningRef.current) return;
    gameplayRunningRef.current = true;
    Ads.gameplayStart();
    // Music needs the same first gesture as the AudioContext itself.
    soundFX.startMusic();
  }, []);

  const endGameplay = useCallback(() => {
    if (!gameplayRunningRef.current) return;
    gameplayRunningRef.current = false;
    Ads.gameplayStop();
  }, []);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundFX.muted = next;
    // Unmuting is a gesture: (re)start the loop if it never got going.
    if (!next) soundFX.startMusic();
  };

  // Shop Actions
  const handleUpgradeGlide = useCallback(() => {
    setSaveData((prev) => {
      if (prev.glideRatioLevel >= 10) return prev;
      const cost = getGlideUpgradeCost(prev.glideRatioLevel);
      if (prev.gold < cost) return prev;
      soundFX.playShopPurchase();
      return {
        ...prev,
        gold: prev.gold - cost,
        glideRatioLevel: prev.glideRatioLevel + 1,
      };
    });
  }, []);

  const handleUpgradeMagnet = useCallback(() => {
    setSaveData((prev) => {
      if (prev.magnetAttachmentLevel >= 10) return prev;
      const cost = getMagnetUpgradeCost(prev.magnetAttachmentLevel);
      if (prev.gold < cost) return prev;
      soundFX.playShopPurchase();
      return {
        ...prev,
        gold: prev.gold - cost,
        magnetAttachmentLevel: prev.magnetAttachmentLevel + 1,
      };
    });
  }, []);

  const handleBuyOrEquipStyle = useCallback((styleId: ToupeeStyleId) => {
    setSaveData((prev) => {
      const isUnlocked = prev.collectedStyles.includes(styleId);
      if (isUnlocked) {
        soundFX.playFlapLift();
        return {
          ...prev,
          equippedStyle: styleId,
        };
      }
      const price = TOUPEE_STYLES[styleId].price;
      if (prev.gold < price) return prev;
      soundFX.playShopPurchase();
      return {
        ...prev,
        gold: prev.gold - price,
        collectedStyles: [...prev.collectedStyles, styleId],
        equippedStyle: styleId,
      };
    });
  }, []);

  // Gameplay Reward & Progression Callbacks
  const handleEarnGold = useCallback((amount: number, isHoney: boolean) => {
    setSaveData((prev) => ({
      ...prev,
      gold: prev.gold + amount,
      totalHoneyLandings: isHoney ? prev.totalHoneyLandings + 1 : prev.totalHoneyLandings,
    }));
  }, []);

  /** Records the unlock for every achievement the run just completed. */
  const settleAchievements = useCallback(() => {
    setSaveData((prev) => {
      const fresh = achievementsJustUnlocked(prev);
      if (!fresh.length) return prev;
      return { ...prev, claimedAchievements: [...prev.claimedAchievements, ...fresh] };
    });
  }, []);

  const handleStageClear = useCallback(
    (stage: number, _goldEarned: number, _accuracy: number, _isHoney: boolean) => {
      setRunCount((n) => n + 1);
      setSaveData((prev) => {
        const nextStage = stage + 1;
        return {
          ...prev,
          currentStage: nextStage,
          maxStageReached: Math.max(prev.maxStageReached, nextStage),
          totalFlights: prev.totalFlights + 1,
        };
      });
      setTimeout(settleAchievements, 0);
    },
    [settleAchievements]
  );

  const handleBossDefeated = useCallback(
    (goldEarned: number, _accuracy: number, isHoney: boolean) => {
      setRunCount((n) => n + 1);
      setSaveData((prev) => ({
        ...prev,
        gold: prev.gold + goldEarned,
        bossDefeatedCount: prev.bossDefeatedCount + 1,
        totalHoneyLandings: isHoney ? prev.totalHoneyLandings + 1 : prev.totalHoneyLandings,
        totalFlights: prev.totalFlights + 1,
      }));
      setTimeout(settleAchievements, 0);
    },
    [settleAchievements]
  );

  const handleEndlessRunEnd = useCallback(
    (hops: number, score: number, _goldEarned: number) => {
      if (hops <= 0) return;
      setRunCount((n) => n + 1);
      setSaveData((prev) => {
        const newEntry: LeaderboardEntry = {
          id: `player-${Date.now()}`,
          name: prev.playerName,
          hops,
          score,
          styleId: prev.equippedStyle,
          date: new Date().toISOString().slice(0, 10),
          isPlayer: true,
        };
        const updatedBoard = [...prev.leaderboard, newEntry]
          .sort((a, b) => (b.hops !== a.hops ? b.hops - a.hops : b.score - a.score))
          .slice(0, 12);

        return {
          ...prev,
          endlessBestHops: Math.max(prev.endlessBestHops, hops),
          endlessBestScore: Math.max(prev.endlessBestScore, score),
          leaderboard: updatedBoard,
          totalFlights: prev.totalFlights + 1,
        };
      });
      setTimeout(settleAchievements, 0);
    },
    [settleAchievements]
  );

  const handleUpdatePlayerName = useCallback((name: string) => {
    setSaveData((prev) => ({
      ...prev,
      playerName: name,
      leaderboard: prev.leaderboard.map((e) => (e.isPlayer ? { ...e, name } : e)),
    }));
  }, []);

  // Retention: daily check-in
  const handleClaimDaily = useCallback(() => {
    setSaveData((prev) => {
      const state = dailyState(prev);
      if (state.claimedToday) return prev;
      soundFX.playShopPurchase();
      return {
        ...prev,
        gold: prev.gold + state.reward,
        dailyStreak: (state.streak % 7) + 1,
        dailyLastClaimDay: localDayNumber(),
      };
    });
  }, []);

  const handleClaimAchievements = useCallback((ids: string[]) => {
    if (!ids.length) return;
    setSaveData((prev) => ({
      ...prev,
      gold: prev.gold + ids.length * 200,
      claimedAchievements: [...prev.claimedAchievements, ...ids],
    }));
    soundFX.playShopPurchase();
  }, []);

  const handleToggleLowFx = useCallback(() => {
    setSaveData((prev) => ({ ...prev, lowFx: !prev.lowFx }));
  }, []);

  const handleTutorialDone = useCallback(() => {
    setSaveData((prev) => ({ ...prev, tutorialDone: true }));
  }, []);

  // Rewarded ad: double the gold from the run that just ended
  const watchDoubleGold = useCallback(async () => {
    if (rewardedGold == null || rewardedGold <= 0 || adBusy) return;
    setAdBusy(true);
    try {
      if (await Ads.rewardedBreak()) {
        setSaveData((prev) => ({ ...prev, gold: prev.gold + rewardedGold }));
        setRewardedGold(null);
        soundFX.playShopPurchase();
      }
    } finally {
      setAdBusy(false);
    }
  }, [rewardedGold, adBusy]);

  /**
   * Interstitial only at the rest point between runs (every 2nd run).
   * Callers must already have fired gameplayStop(); Poki's order is
   * gameplayStop() -> commercialBreak() -> gameplayStart().
   */
  const leaveTo = useCallback(
    (next: () => void) => {
      if (runCount > 0 && runCount % 2 === 0) {
        void Ads.commercialBreak().then(next);
        return;
      }
      next();
    },
    [runCount]
  );

  const handleSwitchMode = useCallback(
    (next: GameMode) => {
      // Any tab click is a real player input, so it can be the first one.
      ensureGameplayStarted();
      endGameplay();
      leaveTo(() => {
        setMode(next);
        gameplayRunningRef.current = true;
        Ads.gameplayStart();
      });
    },
    [leaveTo, ensureGameplayStarted, endGameplay]
  );

  const canAffordUpgrade =
    (saveData.glideRatioLevel < 10 &&
      saveData.gold >= getGlideUpgradeCost(saveData.glideRatioLevel)) ||
    (saveData.magnetAttachmentLevel < 10 &&
      saveData.gold >= getMagnetUpgradeCost(saveData.magnetAttachmentLevel));

  const equippedConfig = TOUPEE_STYLES[saveData.equippedStyle] || TOUPEE_STYLES.classic;

  return (
    <div className="relative w-screen h-dvh bg-slate-900 flex flex-col overflow-hidden select-none">
      {/* Top Barbershop Striped Accent */}
      <div className="barber-awning h-2.5 w-full border-b-2 border-slate-900 shrink-0" />

      {/* Top Arcade HUD Header */}
      <header className="w-full bg-[#FFFDF7] border-b-3 border-slate-800 px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0 z-20">
        {/* Left: Game Brand & Equipped Style */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 comic-panel-sm flex items-center justify-center text-xl shrink-0">
            💈
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg sm:text-xl text-slate-900 leading-none">
                Toupee Glide
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 border border-slate-800 text-[11px] font-bold text-slate-800">
                <Sparkles className="w-3 h-3 text-amber-600" />
                {equippedConfig.nameEn}
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-500 hidden sm:block">
              Hybrid casual 2D flight physics puzzle
            </p>
          </div>
        </div>

        {/* Center: Mode Switcher Tabs (Stage / Endless Hopping / CEO Boss) */}
        <div className="flex items-center gap-1.5 bg-slate-200/90 p-1 rounded-2xl border-2 border-slate-800">
          <div className="flex items-center">
            <button
              onClick={() => handleSwitchMode('stage')}
              className={`px-3 py-1.5 rounded-xl font-display text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                mode === 'stage'
                  ? 'bg-sky-400 text-slate-900 border-2 border-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Stage {saveData.currentStage}</span>
            </button>
            {mode === 'stage' && saveData.maxStageReached > 1 && (
              <div className="flex items-center ml-1 gap-0.5">
                <button
                  onClick={() =>
                    setSaveData((p) => ({
                      ...p,
                      currentStage: Math.max(1, p.currentStage - 1),
                    }))
                  }
                  disabled={saveData.currentStage <= 1}
                  className="p-1 rounded-lg bg-white border border-slate-800 disabled:opacity-40 cursor-pointer"
                  title="Previous stage"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    setSaveData((p) => ({
                      ...p,
                      currentStage: Math.min(p.maxStageReached, p.currentStage + 1),
                    }))
                  }
                  disabled={saveData.currentStage >= saveData.maxStageReached}
                  className="p-1 rounded-lg bg-white border border-slate-800 disabled:opacity-40 cursor-pointer"
                  title="Next stage"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => handleSwitchMode('endless')}
            className={`px-3 py-1.5 rounded-xl font-display text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
              mode === 'endless'
                ? 'bg-emerald-400 text-slate-900 border-2 border-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Endless Hopping</span>
          </button>

          <button
            onClick={() => handleSwitchMode('boss')}
            className={`px-3 py-1.5 rounded-xl font-display text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
              mode === 'boss'
                ? 'bg-rose-500 text-white border-2 border-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>CEO Boss</span>
          </button>
        </div>

        {/* Right: Gold Counter, Toupee Shop, Retention, Low-Fx, Leaderboard & Mute */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-amber-100 px-3 py-1.5 rounded-xl comic-panel-sm">
            <Coins className="w-4 h-4 text-amber-600" />
            <span className="font-mono-num font-black text-sm sm:text-base text-slate-900">
              {saveData.gold.toLocaleString('en-US')} G
            </span>
          </div>

          <button
            onClick={() => setIsShopOpen(true)}
            className="relative px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-display text-xs sm:text-sm flex items-center gap-1.5 comic-btn cursor-pointer"
            title="Toupee Boutique"
          >
            <Store className="w-4 h-4" />
            <span className="hidden sm:inline">Boutique</span>
            {canAffordUpgrade && (
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-slate-900 animate-ping" />
            )}
            {canAffordUpgrade && (
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-slate-900" />
            )}
          </button>

          <button
            onClick={() => setIsDailyOpen(true)}
            className="relative p-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-slate-900 comic-btn cursor-pointer"
            title="Daily check-in"
          >
            <CalendarCheck className="w-4 h-4 text-amber-700" />
            {!daily.claimedToday && (
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-slate-900" />
            )}
          </button>

          <button
            onClick={() => setIsAchOpen(true)}
            className="relative p-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-slate-900 comic-btn cursor-pointer"
            title="Hall of Fame"
          >
            <Award className="w-4 h-4 text-emerald-700" />
            {unclaimedCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 px-1 min-w-[14px] h-3.5 rounded-full bg-rose-500 border-2 border-slate-900 font-display text-[10px] text-white leading-[10px]">
                {unclaimedCount}
              </span>
            )}
          </button>

          <button
            onClick={handleToggleLowFx}
            className={`p-2 rounded-xl comic-btn cursor-pointer ${
              saveData.lowFx ? 'bg-amber-300 text-slate-900' : 'bg-slate-100 text-slate-500'
            }`}
            title={saveData.lowFx ? 'Low effects: ON' : 'Low effects: OFF'}
          >
            <Zap className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsLeaderboardOpen(true)}
            className="p-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-slate-900 comic-btn cursor-pointer"
            title="Endless hopping ranking"
          >
            <Trophy className="w-4 h-4 text-amber-600" />
          </button>

          <button
            onClick={toggleMute}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 comic-btn cursor-pointer"
            title={isMuted ? 'Sound on' : 'Sound off'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-slate-800" />
            )}
          </button>
        </div>
      </header>

      {/* Center Interactive Viewport */}
      <main className="relative flex-1 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        <FlyingToupeeGameCanvas
          mode={mode}
          saveData={saveData}
          onEarnGold={handleEarnGold}
          onStageClear={handleStageClear}
          onBossDefeated={handleBossDefeated}
          onEndlessRunEnd={handleEndlessRunEnd}
          onOpenShop={() => setIsShopOpen(true)}
          onSwitchMode={handleSwitchMode}
          onRunGoldEarned={setRewardedGold}
          onTutorialDone={handleTutorialDone}
          onFirstInput={ensureGameplayStarted}
        />
      </main>

      {/* Bottom Compact Status & Quick Style Swapper Bar */}
      <footer className="w-full bg-[#FFFDF7] border-t-3 border-slate-800 px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded-md bg-slate-900 text-amber-300 font-display">CONTROLS</span>
          <span>
            CLICK / TAP / <kbd className="px-1.5 py-0.5 bg-slate-200 rounded border border-slate-400 font-mono-num">SPACE</kbd>: flap for lift, hold to glide
          </span>
          <span className="hidden md:inline text-slate-400">|</span>
          <span className="hidden md:inline">
            <kbd className="px-1.5 py-0.5 bg-slate-200 rounded border border-slate-400 font-mono-num">←</kbd>{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-200 rounded border border-slate-400 font-mono-num">→</kbd>: trim into the wind
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 hidden sm:inline">Quick swap:</span>
          <div className="flex items-center gap-1">
            {saveData.collectedStyles.map((stId) => {
              const st = TOUPEE_STYLES[stId as ToupeeStyleId];
              if (!st) return null;
              const active = saveData.equippedStyle === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => handleBuyOrEquipStyle(st.id)}
                  className={`px-2.5 py-0.5 rounded-lg border-2 border-slate-800 text-[11px] font-display cursor-pointer transition-all ${
                    active ? 'bg-amber-400 text-slate-900' : 'bg-white hover:bg-slate-100 text-slate-600'
                  }`}
                  title={st.nameEn}
                >
                  {st.nameEn.split(' ')[0]}
                </button>
              );
            })}
          </div>
          <span className="hidden sm:inline font-mono-num text-slate-500">
            {doneAchievements}/{ACHIEVEMENTS.length}
          </span>
          <button
            onClick={() => {
              if (!armedReset) {
                setArmedReset(true);
                window.setTimeout(() => setArmedReset(false), 4000);
                return;
              }
              setArmedReset(false);
              setSaveData({
                ...DEFAULT_SAVE_DATA,
                leaderboard: DEFAULT_SAVE_DATA.leaderboard.map((e) => ({ ...e })),
              });
            }}
            className={`p-1.5 rounded-lg border-2 border-slate-800 cursor-pointer ${
              armedReset ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500'
            }`}
            title={armedReset ? 'Click again to erase everything' : 'Reset progress'}
          >
            {armedReset ? <Trash2 className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
          </button>
        </div>
      </footer>

      <ToupeeShopUI
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        saveData={saveData}
        onUpgradeGlide={handleUpgradeGlide}
        onUpgradeMagnet={handleUpgradeMagnet}
        onBuyOrEquipStyle={handleBuyOrEquipStyle}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        saveData={saveData}
        onUpdatePlayerName={handleUpdatePlayerName}
        onStartEndless={() => handleSwitchMode('endless')}
      />

      <DailyModal
        isOpen={isDailyOpen}
        onClose={() => setIsDailyOpen(false)}
        daily={daily}
        onClaim={handleClaimDaily}
      />

      <AchievementsModal
        isOpen={isAchOpen}
        onClose={() => setIsAchOpen(false)}
        saveData={saveData}
        onClaimAll={handleClaimAchievements}
      />

      {ad && <AdOverlay kind={ad.kind} onDone={(ok) => { ad.done(ok); setAd(null); }} />}

      {rewardedGold != null && rewardedGold > 0 && !ad && (
        <RewardedGoldBar
          amount={rewardedGold}
          busy={adBusy}
          onWatch={watchDoubleGold}
          onDismiss={() => setRewardedGold(null)}
        />
      )}
    </div>
  );
}

const RewardedGoldBar: React.FC<{
  amount: number;
  busy: boolean;
  onWatch: () => void;
  onDismiss: () => void;
}> = ({ amount, busy, onWatch, onDismiss }) => (
  <div className="absolute left-1/2 bottom-4 z-30 -translate-x-1/2 w-[min(92vw,460px)] rounded-2xl bg-[#FFFDF7] comic-panel p-3 animate-in slide-in-from-bottom-4 duration-200">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="font-display text-base text-slate-900 leading-tight">
          {amount.toLocaleString('en-US')}G earned this run
        </div>
        <div className="text-[11px] font-bold text-slate-600">Watch one short video to double it.</div>
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 px-2 py-1 rounded-lg bg-slate-200 border-2 border-slate-800 font-display text-[11px] text-slate-600 cursor-pointer"
      >
        No thanks
      </button>
    </div>
    <button
      onClick={onWatch}
      disabled={busy}
      className={`mt-2.5 w-full py-2.5 rounded-xl border-[3px] border-slate-800 shadow-[0_4px_0_#1E293B] font-display text-base cursor-pointer active:translate-y-[3px] active:shadow-[0_1px_0_#1E293B] ${
        busy ? 'bg-slate-300 text-slate-600' : 'bg-emerald-400 hover:bg-emerald-300 text-slate-900'
      }`}
    >
      {busy ? 'LOADING...' : `🎬 DOUBLE TO ${(amount * 2).toLocaleString('en-US')}G`}
    </button>
  </div>
);

export default App;