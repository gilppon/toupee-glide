import { TOUPEE_STYLES, getGlideRatioStat, getMagnetStat } from '../data/toupeeData';
import { BaldGentleman, BossHelicopter, ToupeeStyleId } from '../types/game';

export interface ToupeeBody {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;          // Radians
  angularVelocity: number;
  isHoldingLift: boolean;
  flapCooldown: number;
  hairRipplePhase: number;
  magnetTarget: { x: number; y: number; dist: number } | null;
  trail: Array<{ x: number; y: number; alpha: number; angle: number }>;
}

export class LiftPhysics {
  private readonly baseGravity = 480; // px/s^2

  public createBody(startX: number, startY: number): ToupeeBody {
    return {
      x: startX,
      y: startY,
      vx: 115,
      vy: -60,
      angle: -0.08,
      angularVelocity: 0,
      isHoldingLift: false,
      flapCooldown: 0,
      hairRipplePhase: 0,
      magnetTarget: null,
      trail: [],
    };
  }

  /**
   * Flappy-style upward lift impulse + forward glide kick
   */
  public applyLiftTap(
    body: ToupeeBody,
    glideLevel: number,
    styleId: ToupeeStyleId
  ) {
    const stat = getGlideRatioStat(glideLevel, styleId);
    // Crisp upward lift impulse
    body.vy = Math.max(-340, Math.min(-185, body.vy * 0.35 - stat.liftForce * 0.76));
    // Forward aerodynamic surge
    body.vx = Math.min(240, Math.max(105, body.vx + 28 * TOUPEE_STYLES[styleId].glideBonus));
    body.angle = -0.32;
    body.flapCooldown = 0.12;
  }

  /**
   * Updates the toupee's physics step: gravity, aerodynamic glide lift, wind coupling, and magnetic scalp attraction
   */
  public step(
    dt: number,
    body: ToupeeBody,
    wind: { wx: number; wy: number },
    glideLevel: number,
    magnetLevel: number,
    styleId: ToupeeStyleId,
    gentlemen: BaldGentleman[],
    boss: BossHelicopter | null,
    canvasWidth: number
  ) {
    const glideStat = getGlideRatioStat(glideLevel, styleId);
    const magnetStat = getMagnetStat(magnetLevel, styleId);
    const style = TOUPEE_STYLES[styleId];

    body.hairRipplePhase += dt * (9 + Math.hypot(body.vx, body.vy) * 0.04);
    if (body.flapCooldown > 0) body.flapCooldown -= dt;

    // 1. Reduced effective gravity when gliding or holding lift
    const holdGlideFactor = body.isHoldingLift ? 0.58 : 0.85;
    const sinkReduction = 1 - glideStat.sinkReductionPct / 100;
    const effectiveGravity = this.baseGravity * sinkReduction * holdGlideFactor;

    body.vy += effectiveGravity * dt;

    // 2. Aerodynamic Lift from forward speed (Glide Ratio effect)
    const forwardSpeed = Math.max(0, body.vx);
    const aerodynamicLift = forwardSpeed * (0.48 + glideLevel * 0.055) * style.glideBonus;
    if (body.vy > -40) {
      body.vy -= aerodynamicLift * dt;
    }

    // Continuous gentle lift if holding button/space/touch
    if (body.isHoldingLift) {
      body.vy -= (135 + glideLevel * 14) * style.glideBonus * dt;
      body.vx += 24 * dt;
    }

    // 3. Wind coupling
    const windResponseX = 1.65;
    const windResponseY = 1.35;
    body.vx += (wind.wx - (body.vx - 95)) * windResponseX * dt;
    body.vy += wind.wy * windResponseY * dt;

    // 4. Magnetic Scalp Attachment Pull
    body.magnetTarget = null;
    let closestDist = magnetStat.radiusPx;
    let targetX = 0;
    let targetY = 0;

    for (const g of gentlemen) {
      if (g.hasToupeeLanded && (g.bounceCooldown ?? 0) > 0) continue;
      const headTopX = g.x;
      const headTopY = g.y - g.headRadius * 0.72;
      const d = Math.hypot(headTopX - body.x, headTopY - body.y);
      if (d < closestDist) {
        closestDist = d;
        targetX = headTopX;
        targetY = headTopY;
      }
    }

    // Check Boss head magnet if boss is present
    if (boss && !boss.hasToupeeLanded) {
      const bossHeadX = boss.x + boss.headOffsetX;
      const bossHeadY = boss.y + boss.headOffsetY - boss.headRadius * 0.7;
      const d = Math.hypot(bossHeadX - body.x, bossHeadY - body.y);
      const effectiveRadius = boss.isVulnerable ? magnetStat.radiusPx * 1.35 : magnetStat.radiusPx * 0.75;
      if (d < effectiveRadius) {
        closestDist = d;
        targetX = bossHeadX;
        targetY = bossHeadY;
      }
    }

    if (closestDist < magnetStat.radiusPx) {
      body.magnetTarget = { x: targetX, y: targetY, dist: closestDist };
      const pullNorm = 1 - closestDist / magnetStat.radiusPx;
      const angleToHead = Math.atan2(targetY - body.y, targetX - body.x);
      const force = magnetStat.pullStrength * (0.45 + 0.85 * pullNorm);
      body.vx += Math.cos(angleToHead) * force * dt;
      body.vy += Math.sin(angleToHead) * force * dt;
    }

    // Clamp velocities for responsive, readable arcade feel
    body.vx = Math.max(-140, Math.min(275, body.vx));
    const maxSinkSpeed = body.isHoldingLift ? 155 * sinkReduction : 265 * sinkReduction;
    body.vy = Math.max(-360, Math.min(Math.max(115, maxSinkSpeed + Math.max(0, wind.wy * 0.45)), body.vy));

    // Integrate position
    body.x += body.vx * dt;
    body.y += body.vy * dt;

    // Horizontal wrap or soft bounce at screen edges so the toupee never gets lost off-screen
    if (body.x > canvasWidth - 32) {
      body.x = 42; // Wrap around smoothly with the street!
      body.trail = [];
    } else if (body.x < 24) {
      body.x = 24;
      body.vx = Math.abs(body.vx) * 0.6 + 60;
    }

    // Ceiling clamp
    if (body.y < 34) {
      body.y = 34;
      body.vy = Math.max(15, body.vy * 0.2);
    }

    // Smooth pitch angle based on velocity vector
    const targetAngle = Math.max(-0.52, Math.min(0.58, body.vy * 0.0022));
    body.angle += (targetAngle - body.angle) * Math.min(1, dt * 10);

    // Record motion trail
    body.trail.unshift({ x: body.x, y: body.y, alpha: 0.7, angle: body.angle });
    if (body.trail.length > 14) body.trail.pop();
    for (const t of body.trail) {
      t.alpha *= 0.88;
    }
  }

  /**
   * Evaluates whether the toupee has landed on a bald head and returns accuracy (0~100)
   */
  public checkHeadLanding(
    body: ToupeeBody,
    headX: number,
    headY: number,
    headRadius: number
  ): { landed: boolean; accuracy: number; isHoney: boolean; offsetX: number } {
    const crownY = headY - headRadius * 0.72;
    const dx = body.x - headX;
    const dy = body.y - crownY;

    // Forgiving landing hitbox around the shiny top of the head
    const hitWidth = headRadius * 1.32;
    const hitHeight = headRadius * 0.92;

    if (Math.abs(dx) <= hitWidth && Math.abs(dy) <= hitHeight && body.vy >= -95) {
      const normalizedError = Math.min(1, Math.abs(dx) / hitWidth);
      const accuracy = Math.round((1 - normalizedError * 0.65) * 100);
      const isHoney = Math.abs(dx) <= headRadius * 0.48;
      return {
        landed: true,
        accuracy: isHoney ? Math.max(95, accuracy) : accuracy,
        isHoney,
        offsetX: Math.max(-headRadius * 0.45, Math.min(headRadius * 0.45, dx)),
      };
    }

    return { landed: false, accuracy: 0, isHoney: false, offsetX: 0 };
  }
}
