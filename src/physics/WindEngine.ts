import { BossHelicopter, WindZone } from '../types/game';

export interface WindParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  alpha: number;
  color: string;
}

export class WindEngine {
  public ambientWindX: number = 22;
  public ambientWindY: number = 0;
  public gustTime: number = 0;
  public zones: WindZone[] = [];
  public particles: WindParticle[] = [];
  public lowFx: boolean = false;

  constructor(width: number, height: number) {
    this.initParticles(width, height, 48);
  }

  /** Halves the wind streak count for low-end devices. */
  public setLowFx(on: boolean, width: number, height: number) {
    this.lowFx = on;
    this.initParticles(width, height, on ? 20 : 48);
  }

  public initParticles(width: number, height: number, count: number = 48) {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * (height - 100),
        vx: 60 + Math.random() * 80,
        vy: (Math.random() - 0.5) * 20,
        length: 22 + Math.random() * 34,
        alpha: 0.22 + Math.random() * 0.38,
        color: '#FFFFFF',
      });
    }
  }

  public configureStageZones(stage: number, width: number, groundY: number, mode: string) {
    this.zones = [];

    if (mode === 'boss') {
      // In Boss mode, provide two side thermal updraft vents so the player can climb back up against the helicopter downdraft!
      this.ambientWindX = 12;
      this.zones.push(
        {
          id: 'boss-updraft-left',
          x: width * 0.12,
          y: groundY - 340,
          width: 96,
          height: 340,
          vx: 25,
          vy: -255,
          type: 'updraft',
          label: 'LIFT VENT',
        },
        {
          id: 'boss-updraft-right',
          x: width * 0.78,
          y: groundY - 340,
          width: 96,
          height: 340,
          vx: -25,
          vy: -255,
          type: 'updraft',
          label: 'LIFT VENT',
        }
      );
      return;
    }

    if (mode === 'endless') {
      this.ambientWindX = 35;
      // Periodic street steam vents
      this.zones.push({
        id: 'endless-vent-1',
        x: width * 0.46,
        y: groundY - 260,
        width: 85,
        height: 260,
        vx: 30,
        vy: -195,
        type: 'updraft',
        label: 'STATION HEAT',
      });
      return;
    }

    // Stage mode: progressive wind puzzles
    this.ambientWindX = 20 + Math.sin(stage * 1.3) * 28;

    // Always place at least one helpful updraft vent
    const ventX = width * (0.28 + ((stage * 0.17) % 0.38));
    this.zones.push({
      id: `stage-vent-${stage}`,
      x: ventX,
      y: groundY - 290,
      width: 88,
      height: 290,
      vx: 20,
      vy: -220,
      type: 'updraft',
      label: 'UPDRAFT',
    });

    if (stage >= 2) {
      // Add a mid-air crosswind or downdraft pocket to make gliding a fun puzzle
      const gustX = width * (0.56 + ((stage * 0.11) % 0.22));
      const isDowndraft = stage % 2 === 0;
      this.zones.push({
        id: `stage-gust-${stage}`,
        x: gustX,
        y: 110,
        width: 110,
        height: 210,
        vx: isDowndraft ? -35 : 95,
        vy: isDowndraft ? 165 : -75,
        type: isDowndraft ? 'downdraft' : 'gust',
        label: isDowndraft ? 'BUILDING DOWNWIND' : 'JET GALE',
      });
    }
  }

  /**
   * Computes total wind velocity (wx, wy) at world position (x, y)
   */
  public getWindAt(
    x: number,
    y: number,
    boss: BossHelicopter | null
  ): { wx: number; wy: number; activeZoneType: WindZone['type'] | null } {
    let wx = this.ambientWindX + Math.sin(this.gustTime * 1.8 + y * 0.015) * 18;
    let wy = this.ambientWindY + Math.cos(this.gustTime * 2.2 + x * 0.01) * 8;
    let activeZoneType: WindZone['type'] | null = null;

    for (const z of this.zones) {
      if (x >= z.x && x <= z.x + z.width && y >= z.y && y <= z.y + z.height) {
        wx += z.vx;
        wy += z.vy;
        activeZoneType = z.type;
      }
    }

    // Check CEO Helicopter Boss extreme downdraft cone!
    if (boss && !boss.hasToupeeLanded) {
      const coneHalfW = boss.downdraftWidth * 0.5;
      const dx = x - boss.x;
      const dy = y - boss.y;
      if (dy > -20 && dy < 440 && Math.abs(dx) < coneHalfW) {
        const proximityFactor = 1 - Math.abs(dx) / coneHalfW;
        // During the 3-second vulnerable window, downdraft softens so a skilled glider can land on his head!
        const windowMult = boss.isVulnerable ? 0.22 : 1.0;
        wy += boss.downdraftStrength * windowMult * (0.55 + 0.45 * proximityFactor);
        // Slight outward push near rotor edges
        wx += (dx / coneHalfW) * 65 * windowMult;
        activeZoneType = 'boss_downdraft';
      }
    }

    return { wx, wy, activeZoneType };
  }

  public update(dt: number, width: number, height: number, boss: BossHelicopter | null) {
    this.gustTime += dt;

    for (const p of this.particles) {
      const localWind = this.getWindAt(p.x, p.y, boss);
      p.vx = 55 + localWind.wx * 0.85;
      p.vy = localWind.wy * 0.65;

      if (localWind.activeZoneType === 'updraft') {
        p.color = '#67E8F9';
      } else if (localWind.activeZoneType === 'boss_downdraft' || localWind.activeZoneType === 'downdraft') {
        p.color = '#FDA4AF';
      } else {
        p.color = '#FFFFFF';
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.x > width + 40) p.x = -30;
      if (p.x < -40) p.x = width + 30;
      if (p.y > height - 50) p.y = 40;
      if (p.y < 20) p.y = height - 90;
    }
  }
}
