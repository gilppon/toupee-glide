import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Wind,
  RotateCcw,
  Play,
  ArrowRight,
  Sparkles,
  Flame,
  ShieldAlert,
  Store,
} from 'lucide-react';
import { soundFX } from '../audio/SoundEffects';
import { Ads } from '../game/ads';
import { COACH_STEPS, CoachOverlay } from './CoachOverlay';
import {
  GENTLEMAN_PROFILES,
  TOUPEE_STYLES,
  getGlideRatioStat,
  getMagnetStat,
} from '../data/toupeeData';
import { LiftPhysics, ToupeeBody } from '../physics/LiftPhysics';
import { WindEngine } from '../physics/WindEngine';
import {
  BaldGentleman,
  BossHelicopter,
  FloatingCallout,
  GameMode,
  GamePhase,
  PigeonObstacle,
  PlayerSaveData,
} from '../types/game';
import {
  drawBaldGentleman,
  drawBossHelicopter,
  drawToupeeSprite,
  drawWindEnvironment,
} from './ToupeeSprites';

interface FlyingToupeeGameCanvasProps {
  mode: GameMode;
  saveData: PlayerSaveData;
  onEarnGold: (amount: number, isHoney: boolean) => void;
  onStageClear: (stage: number, goldEarned: number, accuracy: number, isHoney: boolean) => void;
  onBossDefeated: (goldEarned: number, accuracy: number, isHoney: boolean) => void;
  onEndlessRunEnd: (hops: number, score: number, goldEarned: number) => void;
  onOpenShop: () => void;
  onSwitchMode: (mode: GameMode) => void;
  onRunGoldEarned: (gold: number) => void;
  onTutorialDone: () => void;
  /** Poki: fired on the player's very first interaction with the game surface. */
  onFirstInput: () => void;
}

interface RunSummary {
  won: boolean;
  title: string;
  subtitle: string;
  accuracy: number;
  isHoney: boolean;
  goldEarned: number;
  hops?: number;
  score?: number;
}

const CANVAS_W = 960;
// 960x540 is exactly 16:9, which is Poki's required portal aspect ratio.
const CANVAS_H = 540;
const GROUND_Y = 452;

export const FlyingToupeeGameCanvas: React.FC<FlyingToupeeGameCanvasProps> = ({
  mode,
  saveData,
  onEarnGold,
  onStageClear,
  onBossDefeated,
  onEndlessRunEnd,
  onOpenShop,
  onSwitchMode,
  onRunGoldEarned,
  onTutorialDone,
  onFirstInput,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [phase, setPhase] = useState<GamePhase>('ready');
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [liveHops, setLiveHops] = useState(0);
  const [liveScore, setLiveScore] = useState(0);
  const [bossWindowState, setBossWindowState] = useState<{
    isVulnerable: boolean;
    timer: number;
  }>({ isVulnerable: false, timer: 0 });
  const [windHud, setWindHud] = useState<{ wx: number; wy: number }>({ wx: 22, wy: 0 });
  const [coachStep, setCoachStep] = useState<number | null>(
    saveData.tutorialDone ? null : 0
  );

  // Mutable engine refs for 60fps loop without React re-render overhead
  const liftPhysicsRef = useRef(new LiftPhysics());
  const windEngineRef = useRef(new WindEngine(CANVAS_W, CANVAS_H));
  const bodyRef = useRef<ToupeeBody>(liftPhysicsRef.current.createBody(120, 175));
  const gentlemenRef = useRef<BaldGentleman[]>([]);
  const bossRef = useRef<BossHelicopter | null>(null);
  const pigeonsRef = useRef<PigeonObstacle[]>([]);
  const calloutsRef = useRef<FloatingCallout[]>([]);
  const phaseRef = useRef<GamePhase>('ready');
  const timeRef = useRef<number>(0);
  const hopsRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const runGoldRef = useRef<number>(0);
  const stageTargetsRemainingRef = useRef<number>(1);
  const keySteerXRef = useRef<number>(0);
  const heliSoundCooldownRef = useRef<number>(0);
  /** True while the browser tab is hidden or the window lost focus. */
  const tabHiddenRef = useRef<boolean>(false);

  // Low-spec mode trims the ambient wind streaks.
  useEffect(() => {
    windEngineRef.current.setLowFx(saveData.lowFx, CANVAS_W, CANVAS_H);
  }, [saveData.lowFx]);

  // Keep latest props in ref for callbacks inside RAF
  const propsRef = useRef({
    mode,
    saveData,
    onEarnGold,
    onStageClear,
    onBossDefeated,
    onEndlessRunEnd,
    onRunGoldEarned,
  });
  useEffect(() => {
    propsRef.current = {
      mode,
      saveData,
      onEarnGold,
      onStageClear,
      onBossDefeated,
      onEndlessRunEnd,
      onRunGoldEarned,
    };
  }, [mode, saveData, onEarnGold, onStageClear, onBossDefeated, onEndlessRunEnd, onRunGoldEarned]);

  const spawnCallout = useCallback(
    (x: number, y: number, text: string, color: string = '#F59E0B', subtext?: string) => {
      calloutsRef.current.push({
        id: `${Date.now()}-${Math.random()}`,
        x,
        y,
        text,
        subtext,
        color,
        scale: 1.15,
        alpha: 1,
        vy: -55,
      });
    },
    []
  );

  const createGentleman = useCallback(
    (index: number, xPos: number, speedMultiplier: number = 1): BaldGentleman => {
      const profile = GENTLEMAN_PROFILES[index % GENTLEMAN_PROFILES.length];
      const dir = index % 2 === 0 ? 1 : -1;
      const baseSpeed = (34 + (index % 3) * 14) * speedMultiplier * dir;
      return {
        id: `gent-${Date.now()}-${index}-${Math.random()}`,
        x: xPos,
        y: GROUND_Y - 66,
        vx: baseSpeed,
        headRadius: 23,
        suitColor: profile.suitColor,
        tieColor: profile.tieColor,
        hasMustache: profile.hasMustache,
        hasGlasses: profile.hasGlasses,
        name: profile.name,
        quoteWaiting: profile.quoteWaiting,
        quoteLanded: profile.quoteLanded,
        hasToupeeLanded: false,
      };
    },
    []
  );

  /**
   * Resets & initializes entities for the selected mode and stage
   */
  const initEncounter = useCallback(
    (autoLaunch: boolean = false) => {
      const currentMode = propsRef.current.mode;
      const stage = propsRef.current.saveData.currentStage;

      bodyRef.current = liftPhysicsRef.current.createBody(118, 172);
      calloutsRef.current = [];
      pigeonsRef.current = [];
      hopsRef.current = 0;
      scoreRef.current = 0;
      runGoldRef.current = 0;
      setLiveHops(0);
      setLiveScore(0);
      setSummary(null);

      windEngineRef.current.configureStageZones(stage, CANVAS_W, GROUND_Y, currentMode);

      if (currentMode === 'boss') {
        // CEO Helicopter Boss Mode
        gentlemenRef.current = [];
        bossRef.current = {
          x: CANVAS_W * 0.62,
          y: 165,
          vx: -88,
          vy: 0,
          rotorAngle: 0,
          downdraftStrength: 310,
          downdraftWidth: 220,
          landingWindowTimer: 0,
          cooldownTimer: 2.2, // First 3-second chance opens soon!
          maxWindowDuration: 3.0,
          hp: 1,
          maxHp: 1,
          isVulnerable: false,
          headOffsetX: -38,
          headOffsetY: -6,
          headRadius: 25,
          hasToupeeLanded: false,
        };
        setBossWindowState({ isVulnerable: false, timer: 2.2 });
      } else if (currentMode === 'endless') {
        // Endless Hopping Mode: 3 walking bald gentlemen always patrolling the street
        bossRef.current = null;
        gentlemenRef.current = [
          createGentleman(0, 340, 1.1),
          createGentleman(1, 560, 1.2),
          createGentleman(2, 780, 1.15),
        ];
        // Add a mischievous pigeon high up
        pigeonsRef.current = [
          { id: 'pig-1', x: 680, y: 145, vx: -65, wingPhase: 0 },
        ];
      } else {
        // Stage Mode
        bossRef.current = null;
        const targetCount = stage === 1 ? 1 : stage <= 3 ? 2 : 3;
        stageTargetsRemainingRef.current = targetCount;

        const gList: BaldGentleman[] = [];
        for (let i = 0; i < targetCount; i++) {
          const xStart = 390 + i * 210;
          gList.push(createGentleman(stage + i - 1, Math.min(CANVAS_W - 110, xStart), 1 + stage * 0.08));
        }
        gentlemenRef.current = gList;

        if (stage >= 2) {
          pigeonsRef.current = [
            {
              id: 'stage-pigeon-1',
              x: 620,
              y: 155 + (stage % 2) * 55,
              vx: -(55 + stage * 8),
              wingPhase: 0,
            },
          ];
        }
      }

      if (autoLaunch) {
        phaseRef.current = 'flying';
        setPhase('flying');
        soundFX.playFlapLift();
        spawnCallout(150, 145, 'UP AND AWAY!', '#38BDF8');
      } else {
        phaseRef.current = 'ready';
        setPhase('ready');
      }
    },
    [createGentleman, spawnCallout]
  );

  // Re-initialize when mode or stage changes
  useEffect(() => {
    initEncounter(false);
  }, [mode, saveData.currentStage, initEncounter]);

  /**
   * Triggers upward lift impulse (Flappy-style tap) & starts flight if in 'ready' phase
   */
  const handleTriggerLift = useCallback(() => {
    const p = phaseRef.current;
    if (p === 'landed' || p === 'crashed' || p === 'paused') return;
    onFirstInput();

    if (p === 'ready') {
      phaseRef.current = 'flying';
      setPhase('flying');
    }

    const { glideRatioLevel, equippedStyle } = propsRef.current.saveData;
    liftPhysicsRef.current.applyLiftTap(bodyRef.current, glideRatioLevel, equippedStyle);
    bodyRef.current.isHoldingLift = true;
    soundFX.playFlapLift();
  }, []);

  const handleReleaseLift = useCallback(() => {
    bodyRef.current.isHoldingLift = false;
  }, []);

  /**
   * Portal compliance: portals reject games that keep simulating (and counting
   * gameplay time) in the background. Freeze the flight and drop stuck input.
   */
  useEffect(() => {
    const freeze = () => {
      tabHiddenRef.current = true;
      bodyRef.current.isHoldingLift = false;
      keySteerXRef.current = 0;
      if (phaseRef.current === 'flying') {
        phaseRef.current = 'paused';
        setPhase('paused');
      }
      Ads.gameplayStop();
    };
    const thaw = () => {
      if (!tabHiddenRef.current) return;
      tabHiddenRef.current = false;
      if (phaseRef.current === 'paused') {
        phaseRef.current = 'flying';
        setPhase('flying');
      }
      Ads.gameplayStart();
    };
    const onVisibility = () => (document.hidden ? freeze() : thaw());

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', freeze);
    window.addEventListener('focus', thaw);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', freeze);
      window.removeEventListener('focus', thaw);
    };
  }, []);

  // Coach: 3 steps, then persisted so it never shows up twice.
  const advanceCoach = useCallback(() => {
    onFirstInput();
    setCoachStep((prev) => {
      if (prev == null) return null;
      if (prev >= COACH_STEPS.length - 1) {
        onTutorialDone();
        return null;
      }
      return prev + 1;
    });
  }, [onTutorialDone]);

  const skipCoach = useCallback(() => {
    onFirstInput();
    setCoachStep(null);
    onTutorialDone();
  }, [onTutorialDone, onFirstInput]);

  // Keyboard controls (Space / Up Arrow / W for Lift, Left/Right for aerodynamic trim)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (!e.repeat) {
          handleTriggerLift();
        } else {
          bodyRef.current.isHoldingLift = true;
        }
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keySteerXRef.current = -1;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keySteerXRef.current = 1;
      } else if (e.code === 'KeyR') {
        initEncounter(true);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        handleReleaseLift();
      } else if (
        e.code === 'ArrowLeft' ||
        e.code === 'KeyA' ||
        e.code === 'ArrowRight' ||
        e.code === 'KeyD'
      ) {
        keySteerXRef.current = 0;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [handleTriggerLift, handleReleaseLift, initEncounter]);

  // Main 60fps Game Loop
  useEffect(() => {
    let animId = 0;
    let lastTime = performance.now();

    const updateAndDraw = (now: number) => {
      const dt = Math.min(0.04, (now - lastTime) / 1000);
      lastTime = now;
      timeRef.current += dt;
      const t = timeRef.current;

      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(updateAndDraw);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(updateAndDraw);
        return;
      }

      const { mode: curMode, saveData: curSave } = propsRef.current;
      const styleCfg = TOUPEE_STYLES[curSave.equippedStyle] || TOUPEE_STYLES.classic;

      // Paused/hidden: keep the last drawn frame and skip the whole simulation.
      if (phaseRef.current === 'paused' || tabHiddenRef.current) {
        animId = requestAnimationFrame(updateAndDraw);
        return;
      }

      // 1. Update Wind Engine
      windEngineRef.current.update(dt, CANVAS_W, CANVAS_H, bossRef.current);
      const localWind = windEngineRef.current.getWindAt(
        bodyRef.current.x,
        bodyRef.current.y,
        bossRef.current
      );

      if (Math.floor(t * 5) !== Math.floor((t - dt) * 5)) {
        setWindHud({ wx: Math.round(localWind.wx), wy: Math.round(localWind.wy) });
      }

      // 2. Update Walking Bald Gentlemen
      for (const g of gentlemenRef.current) {
        if ((g.bounceCooldown ?? 0) > 0) {
          g.bounceCooldown = Math.max(0, (g.bounceCooldown ?? 0) - dt);
          if (g.bounceCooldown === 0 && curMode === 'endless') {
            // Reset his shiny bald head for another future hop!
            g.hasToupeeLanded = false;
          }
        }
        g.x += g.vx * dt;
        const minX = 240;
        const maxX = CANVAS_W - 70;
        if (g.x < minX) {
          g.x = minX;
          g.vx = Math.abs(g.vx);
        } else if (g.x > maxX) {
          g.x = maxX;
          g.vx = -Math.abs(g.vx);
        }
      }

      // 3. Update City Pigeons
      for (const pig of pigeonsRef.current) {
        pig.x += pig.vx * dt;
        pig.wingPhase += dt * 14;
        if (pig.x < -40) pig.x = CANVAS_W + 40;
        if (pig.x > CANVAS_W + 45) pig.x = -35;
      }

      // 4. Update CEO Helicopter Boss
      if (bossRef.current && !bossRef.current.hasToupeeLanded) {
        const b = bossRef.current;
        b.rotorAngle += dt * (b.isVulnerable ? 12 : 34);

        // Helicopter rotor audio pulse
        if (phaseRef.current === 'flying') {
          heliSoundCooldownRef.current -= dt;
          if (heliSoundCooldownRef.current <= 0) {
            soundFX.playHelicopterChop();
            heliSoundCooldownRef.current = b.isVulnerable ? 0.24 : 0.13;
          }
        }

        // Patrol horizontally across the mid-upper sky
        b.x += b.vx * dt;
        b.y = 160 + Math.sin(t * 2.1) * 22;
        if (b.x < 290) {
          b.x = 290;
          b.vx = Math.abs(b.vx);
        } else if (b.x > CANVAS_W - 180) {
          b.x = CANVAS_W - 180;
          b.vx = -Math.abs(b.vx);
        }

        // 3.0-second Timing Window State Machine
        if (b.isVulnerable) {
          b.landingWindowTimer -= dt;
          if (b.landingWindowTimer <= 0) {
            b.isVulnerable = false;
            b.cooldownTimer = 3.2;
            spawnCallout(b.x, b.y - 55, 'ROTOR GALE IS BACK!', '#F43F5E');
          }
          setBossWindowState({
            isVulnerable: b.isVulnerable,
            timer: Math.max(0, b.landingWindowTimer),
          });
        } else {
          b.cooldownTimer -= dt;
          if (b.cooldownTimer <= 0) {
            b.isVulnerable = true;
            b.landingWindowTimer = b.maxWindowDuration; // 3.0 seconds!
            soundFX.playBossWindowOpen();
            spawnCallout(
              b.x + b.headOffsetX,
              b.y - 60,
              'LANDING WINDOW OPEN!',
              '#10B981',
              'Rotor wind weak. Hit the scalp!'
            );
          }
          setBossWindowState({
            isVulnerable: b.isVulnerable,
            timer: Math.max(0, b.cooldownTimer),
          });
        }
      }

      // 5. Update Toupee Physics if in 'flying' phase
      const body = bodyRef.current;
      if (phaseRef.current === 'ready') {
        // Gentle bobbing on the barbershop launch mannequin
        body.x = 118;
        body.y = 172 + Math.sin(t * 4) * 3;
        body.hairRipplePhase += dt * 6;
      } else if (phaseRef.current === 'flying') {
        // Apply optional horizontal keyboard trim
        if (keySteerXRef.current !== 0) {
          body.vx += keySteerXRef.current * 210 * dt;
        }

        liftPhysicsRef.current.step(
          dt,
          body,
          localWind,
          curSave.glideRatioLevel,
          curSave.magnetAttachmentLevel,
          curSave.equippedStyle,
          gentlemenRef.current,
          bossRef.current,
          CANVAS_W
        );

        // Check Pigeon Boop (bounces toupee playfully upward/backward without instant death!)
        for (const pig of pigeonsRef.current) {
          const distPig = Math.hypot(body.x - pig.x, body.y - pig.y);
          if (distPig < 28) {
            body.vy = -210;
            body.vx = -90;
            pig.vx *= 1.3;
            soundFX.playBounceHop(1);
            spawnCallout(pig.x, pig.y - 20, 'Coo! Pigeon bump!', '#38BDF8');
          }
        }

        // Check Landing on Bald Gentlemen
        for (const g of gentlemenRef.current) {
          if (g.hasToupeeLanded && (g.bounceCooldown ?? 0) > 0) continue;

          const check = liftPhysicsRef.current.checkHeadLanding(
            body,
            g.x,
            g.y,
            g.headRadius
          );

          if (check.landed) {
            g.hasToupeeLanded = true;
            g.landedStyle = curSave.equippedStyle;
            g.landedOffsetX = check.offsetX;
            g.landedAccuracy = check.accuracy;

            const baseTip = check.isHoney ? 90 : 50;
            const goldTip = Math.round(
              baseTip * styleCfg.goldBonusMultiplier * (1 + (curSave.currentStage - 1) * 0.15)
            );
            runGoldRef.current += goldTip;
            propsRef.current.onEarnGold(goldTip, check.isHoney);

            if ( curMode === 'endless') {
              // ENDLESS HOPPING MODE: Spring off the gentleman's head into the next hop!
              g.bounceCooldown = 2.4;
              hopsRef.current += 1;
              const hopBonus = hopsRef.current * (check.isHoney ? 150 : 95);
              scoreRef.current += hopBonus;
              setLiveHops(hopsRef.current);
              setLiveScore(scoreRef.current);

              body.vy = -310;
              body.vx = Math.max(130, body.vx + 35);
              soundFX.playBounceHop(hopsRef.current);

              spawnCallout(
                g.x,
                g.y - 55,
                check.isHoney
                  ? `HONEY HOP! x${hopsRef.current}`
                  : `HOP! ${hopsRef.current} in a row`,
                check.isHoney ? '#F59E0B' : '#10B981',
                `+${goldTip.toLocaleString('en-US')}G · +${hopBonus.toLocaleString('en-US')} PTS`
              );
            } else {
              // STAGE MODE
              stageTargetsRemainingRef.current -= 1;

              if (stageTargetsRemainingRef.current > 0) {
                // Multi-gentleman stage: hop from this gentleman to the remaining bald gentleman!
                g.bounceCooldown = 99;
                body.vy = -295;
                body.vx = 145;
                soundFX.playBounceHop(2);
                spawnCallout(
                  g.x,
                  g.y - 55,
                  `Client seated! (+${goldTip.toLocaleString('en-US')}G)`,
                  '#10B981',
                  'Now hop to the next scalp!'
                );
              } else {
                // Final target landed! Stage Clear!
                phaseRef.current = 'landed';
                setPhase('landed');
                if (check.isHoney) {
                  soundFX.playHoneyLanding();
                  confetti({ particleCount: 55, spread: 65, origin: { y: 0.6 } });
                } else {
                  soundFX.playNormalLanding();
                }

                spawnCallout(
                  g.x,
                  g.y - 64,
                  check.isHoney ? 'HONEY LANDING! 100%' : `SEATED! ${check.accuracy}%`,
                  check.isHoney ? '#F59E0B' : '#10B981',
                  `"${g.quoteLanded}"`
                );

                setSummary({
                  won: true,
                  title: check.isHoney ? 'PERFECT HONEY LANDING!' : 'SEATED ON A BALD GENTLEMAN!',
                  subtitle: `${g.name}: "${g.quoteLanded}"`,
                  accuracy: check.accuracy,
                  isHoney: check.isHoney,
                  goldEarned: runGoldRef.current,
                });

                propsRef.current.onRunGoldEarned(runGoldRef.current);
                propsRef.current.onStageClear(
                  curSave.currentStage,
                  runGoldRef.current,
                  check.accuracy,
                  check.isHoney
                );
              }
            }
            break;
          }
        }

        // Check Landing on CEO Helicopter Boss!
        if (bossRef.current && !bossRef.current.hasToupeeLanded && phaseRef.current === 'flying') {
          const b = bossRef.current;
          const bossHeadX = b.x + b.headOffsetX;
          const bossHeadY = b.y + b.headOffsetY;
          const check = liftPhysicsRef.current.checkHeadLanding(
            body,
            bossHeadX,
            bossHeadY,
            b.headRadius * (b.isVulnerable ? 1.25 : 0.95)
          );

          if (check.landed) {
            b.hasToupeeLanded = true;
            b.landedStyle = curSave.equippedStyle;
            phaseRef.current = 'landed';
            setPhase('landed');

            const bossReward = Math.round(
              (check.isHoney ? 450 : 300) * styleCfg.goldBonusMultiplier
            );
            runGoldRef.current += bossReward;

            soundFX.playHoneyLanding();
            confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });

            spawnCallout(
              bossHeadX,
              bossHeadY - 60,
              'CEO SCALP TAKEDOWN!',
              '#F59E0B',
              `"Fitted a wig in a hurricane. Impressive!" (+${bossReward.toLocaleString('en-US')}G)`
            );

            setSummary({
              won: true,
              title: 'CEO BOSS SCALP TAKEDOWN!',
              subtitle: 'You flew straight through the rotor gale and seated it perfectly.',
              accuracy: check.accuracy,
              isHoney: check.isHoney,
              goldEarned: runGoldRef.current,
            });

            propsRef.current.onRunGoldEarned(runGoldRef.current);
            propsRef.current.onBossDefeated(runGoldRef.current, check.accuracy, check.isHoney);
          }
        }

        // Check Ground Crash
        if (body.y >= GROUND_Y - 10 && phaseRef.current === 'flying') {
          body.y = GROUND_Y - 10;
          phaseRef.current = 'crashed';
          setPhase('crashed');
          soundFX.playGroundCrash();

          if (curMode === 'endless') {
            spawnCallout(
              body.x,
              body.y - 30,
              `RUN OVER (${hopsRef.current} HOPS)`,
              '#F43F5E',
              `Gold banked: +${runGoldRef.current.toLocaleString('en-US')}G`
            );
            setSummary({
              won: hopsRef.current > 0,
              title: `${hopsRef.current}-HOP CHAIN!`,
              subtitle:
                hopsRef.current >= 5
                  ? 'Outstanding hang time. This is going on the board.'
                  : 'Upgrade your lift & glide ratio or magnet force to chain more hops.',
              accuracy: 100,
              isHoney: hopsRef.current >= 5,
              goldEarned: runGoldRef.current,
              hops: hopsRef.current,
              score: scoreRef.current,
            });
            propsRef.current.onRunGoldEarned(runGoldRef.current);
            propsRef.current.onEndlessRunEnd(
              hopsRef.current,
              scoreRef.current,
              runGoldRef.current
            );
          } else {
            spawnCallout(
              body.x,
              body.y - 30,
              'The toupee hit the sidewalk...',
              '#F43F5E',
              'Dust it off and launch again!'
            );
            setSummary({
              won: false,
              title: 'Toupee crashed into the sidewalk',
              subtitle:
                curMode === 'boss'
                  ? 'Ride the lift vents on both sides and time the 3-second landing window.'
                  : 'Holding the click gives you a lot more lift.',
              accuracy: 0,
              isHoney: false,
              goldEarned: runGoldRef.current,
            });
          }
        }
      }

      // 6. Update Floating Comic Callouts
      for (const c of calloutsRef.current) {
        c.y += c.vy * dt;
        c.vy *= 0.94;
        c.alpha -= dt * 0.48;
      }
      calloutsRef.current = calloutsRef.current.filter((c) => c.alpha > 0.05);

      // ========================================================================
      // RENDERING PIPELINE
      // ========================================================================
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // A. Sky Gradient Backdrop
      const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      if (curMode === 'boss') {
        skyGrad.addColorStop(0, '#1E1B4B');
        skyGrad.addColorStop(0.5, '#4C1D95');
        skyGrad.addColorStop(1, '#FDE68A');
      } else if (curMode === 'endless') {
        skyGrad.addColorStop(0, '#0284C7');
        skyGrad.addColorStop(0.55, '#7DD3FC');
        skyGrad.addColorStop(1, '#FEF3C7');
      } else {
        skyGrad.addColorStop(0, '#38BDF8');
        skyGrad.addColorStop(0.6, '#BAE6FD');
        skyGrad.addColorStop(1, '#FEF3C7');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

      // Fluffy Cartoon Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      const cloudPositions = [180, 460, 760];
      cloudPositions.forEach((baseX, idx) => {
        const cx = ((baseX + t * (8 + idx * 3)) % (CANVAS_W + 160)) - 80;
        const cy = 68 + idx * 28;
        ctx.beginPath();
        ctx.arc(cx, cy, 24, 0, Math.PI * 2);
        ctx.arc(cx + 22, cy - 6, 28, 0, Math.PI * 2);
        ctx.arc(cx + 46, cy, 22, 0, Math.PI * 2);
        ctx.fill();
      });

      // B. Distant City Skyline Silhouettes
      ctx.fillStyle = curMode === 'boss' ? 'rgba(30, 27, 75, 0.45)' : 'rgba(148, 163, 184, 0.35)';
      const buildings = [
        { x: 210, w: 95, h: 190 },
        { x: 320, w: 115, h: 240 },
        { x: 455, w: 85, h: 165 },
        { x: 560, w: 130, h: 220 },
        { x: 710, w: 105, h: 185 },
        { x: 835, w: 110, h: 210 },
      ];
      for (const bld of buildings) {
        ctx.fillRect(bld.x, GROUND_Y - bld.h, bld.w, bld.h);
      }

      // C. Left-side Barbershop Building & 2nd-Floor Launch Balcony
      ctx.save();
      ctx.fillStyle = '#FFFBEB';
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(16, 195, 148, GROUND_Y - 195, [12, 12, 0, 0]);
      ctx.fill();
      ctx.stroke();

      // Barbershop striped awning
      const stripeColors = ['#EF4444', '#FFFFFF', '#2563EB', '#FFFFFF'];
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = stripeColors[i % stripeColors.length];
        ctx.fillRect(12 + i * 26, 192, 26, 18);
        ctx.strokeRect(12 + i * 26, 192, 26, 18);
      }

      // Signboard
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.roundRect(26, 220, 128, 28, 6);
      ctx.fill();
      ctx.fillStyle = '#FDE047';
      ctx.font = '800 13px "Jua", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TUPEE BOUTIQUE', 90, 239);

      // Launch Mannequin Stand on Balcony Roof
      ctx.fillStyle = '#FDBA74';
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(118, 182, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // D. Wind Zones & Stream Ribbons
      drawWindEnvironment(
        ctx,
        windEngineRef.current.zones,
        windEngineRef.current.particles,
        GROUND_Y,
        t
      );

      // E. Ground Sidewalk & Cobblestone Avenue
      ctx.fillStyle = '#CBD5E1';
      ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(CANVAS_W, GROUND_Y);
      ctx.stroke();

      // Curb tiles
      ctx.fillStyle = '#94A3B8';
      for (let x = 0; x < CANVAS_W; x += 64) {
        ctx.fillRect(x, GROUND_Y + 4, 34, 8);
      }

      // F. Draw City Pigeons
      for (const pig of pigeonsRef.current) {
        ctx.save();
        ctx.translate(pig.x, pig.y);
        if (pig.vx > 0) ctx.scale(-1, 1);
        ctx.fillStyle = '#94A3B8';
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Flapping wing
        const wingY = Math.sin(pig.wingPhase) * 10;
        ctx.fillStyle = '#CBD5E1';
        ctx.beginPath();
        ctx.moveTo(-4, -2);
        ctx.lineTo(6, -12 + wingY);
        ctx.lineTo(10, -2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Beak
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.moveTo(-14, -2);
        ctx.lineTo(-20, 1);
        ctx.lineTo(-14, 3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // G. Draw Walking Bald Gentlemen
      gentlemenRef.current.forEach((g) => {
        drawBaldGentleman(ctx, g, t, !g.hasToupeeLanded);
      });

      // H. Draw CEO Helicopter Boss
      if (bossRef.current) {
        drawBossHelicopter(ctx, bossRef.current, t);
      }

      // I. Magnetic Scalp Attraction Arc when in range!
      if (phaseRef.current === 'flying' && body.magnetTarget) {
        ctx.save();
        ctx.strokeStyle = '#EC4899';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(body.x, body.y);
        ctx.lineTo(body.magnetTarget.x, body.magnetTarget.y);
        ctx.stroke();

        ctx.fillStyle = '#EC4899';
        ctx.font = '800 11px "Jua", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          'MAGNET FORCE ON',
          (body.x + body.magnetTarget.x) / 2,
          (body.y + body.magnetTarget.y) / 2 - 8
        );
        ctx.restore();
      }

      // J. Draw Toupee Motion Trail & Player Toupee Sprite (unless already landed on gentleman)
      if (phaseRef.current !== 'landed') {
        // Motion trail
        for (let i = 1; i < body.trail.length; i += 2) {
          const tr = body.trail[i];
          ctx.save();
          ctx.globalAlpha = tr.alpha * 0.28;
          ctx.translate(tr.x, tr.y);
          ctx.rotate(tr.angle);
          drawToupeeSprite(ctx, curSave.equippedStyle, body.hairRipplePhase - i * 0.3, 0.88);
          ctx.restore();
        }

        // Main Player Toupee
        ctx.save();
        ctx.translate(body.x, body.y);
        ctx.rotate(body.angle);
        drawToupeeSprite(ctx, curSave.equippedStyle, body.hairRipplePhase, 1.12);
        ctx.restore();
      }

      // K. Ready Prompt Callout right above the Barbershop Balcony
      if (phaseRef.current === 'ready') {
        ctx.save();
        const bob = Math.sin(t * 6) * 4;
        ctx.fillStyle = '#F59E0B';
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(45, 92 + bob, 235, 46, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#1E293B';
        ctx.font = '800 15px "Jua", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TAP / SPACE TO LAUNCH', 162, 113 + bob);
        ctx.font = '700 11px "Nunito", sans-serif';
        ctx.fillText('Tap to climb · hold to glide', 162, 130 + bob);
        ctx.restore();
      }

      // L. Floating Comic Callouts ("HOP!", "+120G", etc.)
      for (const c of calloutsRef.current) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, c.alpha);
        ctx.translate(c.x, c.y);
        ctx.font = '900 20px "Jua", sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#1E293B';
        ctx.strokeText(c.text, 0, 0);
        ctx.fillStyle = c.color;
        ctx.fillText(c.text, 0, 0);

        if (c.subtext) {
          ctx.font = '800 13px "Nunito", sans-serif';
          ctx.lineWidth = 3;
          ctx.strokeText(c.subtext, 0, 20);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(c.subtext, 0, 20);
        }
        ctx.restore();
      }

      animId = requestAnimationFrame(updateAndDraw);
    };

    animId = requestAnimationFrame(updateAndDraw);
    return () => cancelAnimationFrame(animId);
  }, [spawnCallout]);

  const glideStat = getGlideRatioStat(saveData.glideRatioLevel, saveData.equippedStyle);
  const magnetStat = getMagnetStat(saveData.magnetAttachmentLevel, saveData.equippedStyle);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Main Interactive Game Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        onPointerDown={handleTriggerLift}
        onPointerUp={handleReleaseLift}
        onPointerCancel={handleReleaseLift}
        onPointerLeave={handleReleaseLift}
        className="w-full h-full object-contain cursor-pointer touch-none select-none"
      />

      {/* Top-Center Live Mode & Wind Status Pill */}
      <div className="pointer-events-none absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        <div className="bg-slate-900/85 text-white px-3.5 py-1.5 rounded-full border-2 border-slate-700 flex items-center gap-3 text-xs font-bold shadow-md">
          <span className="flex items-center gap-1 text-sky-300">
            <Wind className="w-3.5 h-3.5" />
            WIND{' '}
            <strong className="font-mono-num">
              {windHud.wx >= 0 ? `+${windHud.wx}` : windHud.wx}px/s
            </strong>
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-amber-300">
            GLIDE <strong className="font-mono-num">{glideStat.ratioText}</strong>
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-rose-300">
            MAGNET <strong className="font-mono-num">{magnetStat.radiusPx}px</strong>
          </span>
        </div>

        {/* Endless Hopping Live Counter */}
        {mode === 'endless' && (
          <div className="bg-emerald-500 text-white px-4 py-1.5 rounded-full comic-panel-sm flex items-center gap-2 text-sm font-display">
            <Flame className="w-4 h-4 fill-amber-300 text-amber-300" />
            <span>CHAIN: {liveHops} HOPS</span>
            <span className="font-mono-num text-xs bg-slate-900/30 px-2 py-0.5 rounded-full">
              {liveScore.toLocaleString('en-US')} PTS
            </span>
          </div>
        )}

        {/* CEO Boss 3.0s Precision Timing Banner */}
        {mode === 'boss' && phase === 'flying' && (
          <div
            className={`px-4 py-1.5 rounded-full comic-panel-sm flex items-center gap-2 text-sm font-display ${
              bossWindowState.isVulnerable
                ? 'bg-emerald-500 text-white animate-pulse-urgent'
                : 'bg-rose-600 text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            {bossWindowState.isVulnerable ? (
              <span>
                CEO LANDING WINDOW! {bossWindowState.timer.toFixed(1)}s
              </span>
            ) : (
              <span>
                ROTOR GALE! Window in {bossWindowState.timer.toFixed(1)}s
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom-Right Quick Flight Boost & Retry Controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2.5 z-10">
        <button
          onClick={() => initEncounter(true)}
          className="px-3.5 py-2.5 rounded-2xl bg-white/95 hover:bg-white text-slate-900 font-display text-sm flex items-center gap-1.5 comic-btn cursor-pointer"
          title="Relaunch now (R)"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Relaunch</span>
        </button>

        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            handleTriggerLift();
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            handleReleaseLift();
          }}
          className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-900 font-display text-base sm:text-lg flex items-center gap-2 comic-btn cursor-pointer"
        >
          <Wind className="w-5 h-5" />
          <span>FLAP! (SPACE)</span>
        </button>
      </div>

      {/* Auto-pause veil: the portal tab switcher never gets a running game */}
      {phase === 'paused' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/70 backdrop-blur-[2px]">
          <div className="rounded-3xl bg-[#FFFDF7] comic-panel px-6 py-5 text-center">
            <div className="font-display text-2xl text-slate-900">PAUSED</div>
            <p className="mt-1 text-xs font-bold text-slate-600">
              Bring the game back into focus to resume your flight.
            </p>
          </div>
        </div>
      )}

      {coachStep != null && (
        <CoachOverlay step={coachStep} onNext={advanceCoach} onSkip={skipCoach} />
      )}

      {/* Post-Landing / Crash Summary Card Overlay */}
      {summary && (phase === 'landed' || phase === 'crashed') && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/55 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#FFFDF7] comic-panel overflow-hidden animate-in zoom-in-95 duration-150">
            <div
              className={`px-5 py-4 border-b-3 border-slate-800 flex items-center justify-between ${
                summary.won ? 'bg-amber-300' : 'bg-rose-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{summary.won ? '💈' : '💨'}</span>
                <h3 className="font-display text-xl text-slate-900">{summary.title}</h3>
              </div>
              {summary.isHoney && (
                <span className="px-2.5 py-1 rounded-full bg-slate-900 text-amber-300 font-display text-xs flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  HONEY x2 BONUS!
                </span>
              )}
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm font-bold text-slate-700 bg-slate-100 p-3 rounded-2xl border-2 border-slate-800 text-center">
                {summary.subtitle}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-amber-50 p-3 border-2 border-slate-800 text-center">
                  <div className="text-xs font-bold text-slate-500">Flight earnings</div>
                  <div className="font-mono-num font-black text-xl text-amber-600 mt-0.5">
                    +{summary.goldEarned.toLocaleString('en-US')} G
                  </div>
                </div>

                {mode === 'endless' ? (
                  <div className="rounded-2xl bg-sky-50 p-3 border-2 border-slate-800 text-center">
                    <div className="text-xs font-bold text-slate-500">Hop chain record</div>
                    <div className="font-mono-num font-black text-xl text-sky-700 mt-0.5">
                      {summary.hops ?? 0} HOPS
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-emerald-50 p-3 border-2 border-slate-800 text-center">
                    <div className="text-xs font-bold text-slate-500">Scalp accuracy</div>
                    <div className="font-mono-num font-black text-xl text-emerald-600 mt-0.5">
                      {summary.accuracy}%
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  onClick={onOpenShop}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-900 font-display text-base flex items-center justify-center gap-1.5 comic-btn cursor-pointer"
                >
                  <Store className="w-4 h-4" />
                  <span>Boutique (upgrades)</span>
                </button>

                {summary.won && mode === 'stage' ? (
                  <button
                    onClick={() => {
                      if (saveData.currentStage % 3 === 0) {
                        onSwitchMode('boss');
                      } else {
                        initEncounter(true);
                      }
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-display text-base flex items-center justify-center gap-1.5 comic-btn cursor-pointer"
                  >
                    <span>
                      {saveData.currentStage % 3 === 0
                        ? 'FACE THE CEO BOSS!'
                        : `LAUNCH STAGE ${saveData.currentStage}`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => initEncounter(true)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-display text-base flex items-center justify-center gap-1.5 comic-btn cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    <span>Relaunch</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
