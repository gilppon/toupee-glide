import { BaldGentleman, BossHelicopter, ToupeeStyleId, WindZone } from '../types/game';
import { WindParticle } from '../physics/WindEngine';

/**
 * Draws a stylized cartoon toupee / wig centered at (0, 0) in local canvas coordinates
 */
export function drawToupeeSprite(
  ctx: CanvasRenderingContext2D,
  styleId: ToupeeStyleId,
  ripplePhase: number,
  scale: number = 1
) {
  ctx.save();
  ctx.scale(scale, scale);
  const wave = Math.sin(ripplePhase) * 2.5;
  const wave2 = Math.cos(ripplePhase * 1.3) * 2;

  ctx.lineWidth = 2.6;
  ctx.strokeStyle = '#1E293B';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (styleId === 'classic') {
    // Rich Chestnut Gentleman 2:8 Parted Toupee
    ctx.fillStyle = '#5A3821';
    ctx.beginPath();
    ctx.moveTo(-24, 6);
    ctx.quadraticCurveTo(-26, -12 + wave * 0.4, -6, -14);
    ctx.quadraticCurveTo(10, -17 + wave2 * 0.5, 24, -4);
    ctx.quadraticCurveTo(28, 5 + wave, 22, 9);
    ctx.quadraticCurveTo(0, 4, -24, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Side-part highlight swoosh
    ctx.strokeStyle = '#8B5A36';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-12, -8);
    ctx.quadraticCurveTo(4, -12 + wave * 0.5, 16, -3);
    ctx.stroke();

    // Fluttering rear hair tuft
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-23, 3);
    ctx.quadraticCurveTo(-31, -2 + wave, -34, 4 + wave2);
    ctx.stroke();
  } else if (styleId === 'afro') {
    // Voluminous Funky Cloud Afro with Disco Star Pick
    ctx.fillStyle = '#1E1B18';
    const puffs = [
      { x: -16, y: -4, r: 13 },
      { x: 0, y: -12 + wave * 0.4, r: 16 },
      { x: 16, y: -4 - wave * 0.4, r: 13 },
      { x: -8, y: -15, r: 13 },
      { x: 10, y: -14, r: 13 },
      { x: -20, y: 3 + wave * 0.5, r: 10 },
      { x: 20, y: 3 - wave * 0.5, r: 10 },
    ];
    ctx.beginPath();
    puffs.forEach((p) => {
      ctx.moveTo(p.x + p.r, p.y);
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    });
    ctx.fill();

    // Outer comic contour
    ctx.beginPath();
    ctx.arc(0, -7, 23, Math.PI * 0.88, Math.PI * 0.12, false);
    ctx.quadraticCurveTo(0, 4, -21, 2);
    ctx.stroke();

    // Golden Afro Comb Pick sticking out
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(-20, -16);
    ctx.lineTo(-32, -26 + wave * 0.5);
    ctx.lineTo(-25, -29 + wave * 0.5);
    ctx.lineTo(-15, -19);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (styleId === 'elvis') {
    // Rock-n-Roll Pompadour with Huge Forward Wave
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.moveTo(-25, 8);
    ctx.quadraticCurveTo(-28, -6, -12, -14);
    // Iconic towering front pompadour roll
    ctx.bezierCurveTo(6, -24, 32, -26 + wave, 30, -6 + wave2);
    ctx.quadraticCurveTo(28, 6, 18, 7);
    ctx.quadraticCurveTo(-4, 3, -25, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glossy cyan pomade shine streak
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.quadraticCurveTo(12, -18 + wave * 0.5, 23, -10);
    ctx.stroke();
  } else if (styleId === 'rainbow') {
    // 7-Color Prismatic Superstar Wig
    const bands = [
      { color: '#EF4444', x: -18, y: -4, r: 12 },
      { color: '#F97316', x: -11, y: -10, r: 13 },
      { color: '#FACC15', x: -3, y: -14 + wave * 0.4, r: 14 },
      { color: '#22C55E', x: 5, y: -13 - wave * 0.4, r: 13 },
      { color: '#3B82F6', x: 13, y: -9, r: 12 },
      { color: '#A855F7', x: 19, y: -3, r: 11 },
    ];
    for (const b of bands) {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, Math.PI * 0.95, Math.PI * 2.05);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    // Starry headband base
    ctx.fillStyle = '#FFFDF7';
    ctx.beginPath();
    ctx.roundRect(-22, 1, 44, 6, 3);
    ctx.fill();
    ctx.stroke();
  } else if (styleId === 'golden') {
    // 24K Royal Golden CEO Toupee with Crown Gleam
    const grad = ctx.createLinearGradient(-24, -20, 24, 8);
    grad.addColorStop(0, '#F59E0B');
    grad.addColorStop(0.5, '#FEF08A');
    grad.addColorStop(1, '#D97706');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-26, 7);
    ctx.quadraticCurveTo(-28, -14, -8, -18 + wave * 0.4);
    ctx.bezierCurveTo(8, -24, 28, -20 + wave, 26, -2);
    ctx.quadraticCurveTo(25, 7, 18, 8);
    ctx.quadraticCurveTo(0, 3, -26, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Mini crown jewel on the side
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(6, -9, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws a walking Bald Gentleman on the sidewalk
 */
export function drawBaldGentleman(
  ctx: CanvasRenderingContext2D,
  g: BaldGentleman,
  time: number,
  isPrimaryTarget: boolean
) {
  ctx.save();
  const walkBounce = Math.abs(Math.sin(time * 6 + g.x * 0.05)) * 3.5;
  const cx = g.x;
  const cy = g.y - walkBounce;

  // 1. Target bullseye indicator above the gentleman's shiny head if not yet landed
  if (!g.hasToupeeLanded && isPrimaryTarget) {
    const pulse = 1 + Math.sin(time * 7) * 0.12;
    const crownY = cy - g.headRadius * 0.78;

    // Magnetic landing zone ring
    ctx.save();
    ctx.translate(cx, crownY - 12);
    ctx.scale(pulse, pulse * 0.45);
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, g.headRadius * 1.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Downward bouncing arrow
    const arrowY = crownY - 30 + Math.sin(time * 8) * 4;
    ctx.fillStyle = '#F59E0B';
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, arrowY + 9);
    ctx.lineTo(cx - 8, arrowY - 3);
    ctx.lineTo(cx + 8, arrowY - 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // 2. Suit Shoulders & Torso
  ctx.lineWidth = 2.8;
  ctx.strokeStyle = '#1E293B';
  ctx.fillStyle = g.suitColor;
  ctx.beginPath();
  ctx.roundRect(cx - 24, cy + 16, 48, 38, [14, 14, 4, 4]);
  ctx.fill();
  ctx.stroke();

  // White Shirt V-neck & Tie
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(cx - 9, cy + 16);
  ctx.lineTo(cx + 9, cy + 16);
  ctx.lineTo(cx, cy + 34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = g.tieColor;
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy + 18);
  ctx.lineTo(cx + 3, cy + 18);
  ctx.lineTo(cx + 4, cy + 38);
  ctx.lineTo(cx, cy + 43);
  ctx.lineTo(cx - 4, cy + 38);
  ctx.closePath();
  ctx.fill();

  // Walking legs
  const legSwing = Math.sin(time * 7 + g.x * 0.05) * 7;
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 9, cy + 52);
  ctx.lineTo(cx - 9 + legSwing, cy + 66);
  ctx.moveTo(cx + 9, cy + 52);
  ctx.lineTo(cx + 9 - legSwing, cy + 66);
  ctx.stroke();

  // 3. Ears
  ctx.lineWidth = 2.5;
  ctx.fillStyle = '#FDBA74';
  ctx.beginPath();
  ctx.arc(cx - g.headRadius + 1, cy + 2, 6, 0, Math.PI * 2);
  ctx.arc(cx + g.headRadius - 1, cy + 2, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 4. Head Cranium
  const headGrad = ctx.createRadialGradient(cx - 7, cy - 10, 3, cx, cy, g.headRadius);
  headGrad.addColorStop(0, '#FFEDD5');
  headGrad.addColorStop(0.55, '#FDBA74');
  headGrad.addColorStop(1, '#FB923C');

  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, g.headRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Side fringe hair (classic bald-on-top gentleman horseshoe hair)
  ctx.fillStyle = '#64748B';
  ctx.beginPath();
  ctx.arc(cx - g.headRadius + 4, cy - 1, 5.5, 0, Math.PI * 2);
  ctx.arc(cx + g.headRadius - 4, cy - 1, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 5. Specular Bald Shine (only visible before a toupee lands!)
  if (!g.hasToupeeLanded) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.ellipse(cx - 7, cy - 12, 8, 4.2, -0.35, 0, Math.PI * 2);
    ctx.fill();

    // Twinkling star on the bald spot
    const starScale = 0.7 + Math.sin(time * 8 + g.x) * 0.35;
    ctx.save();
    ctx.translate(cx - 10, cy - 15);
    ctx.scale(starScale, starScale);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(6, 0);
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 6);
    ctx.stroke();
    ctx.restore();
  }

  // 6. Facial Expression (Worried/Cold before landing -> Radiant Joy after landing!)
  const faceDir = g.vx >= 0 ? 2 : -2;
  const eyeY = cy + 1;

  if (g.hasGlasses) {
    ctx.strokeStyle = '#1E293B';
    ctx.fillStyle = 'rgba(224, 242, 254, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cx - 13 + faceDir, eyeY - 5, 11, 9, 2);
    ctx.roundRect(cx + 2 + faceDir, eyeY - 5, 11, 9, 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 2 + faceDir, eyeY - 1);
    ctx.lineTo(cx + 2 + faceDir, eyeY - 1);
    ctx.stroke();
  }

  // Eyes
  ctx.fillStyle = '#1E293B';
  if (g.hasToupeeLanded) {
    // Happy curved eyes (^ ^)
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(cx - 7 + faceDir, eyeY, 3.5, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 7 + faceDir, eyeY, 3.5, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(cx - 7 + faceDir, eyeY, 2.3, 0, Math.PI * 2);
    ctx.arc(cx + 7 + faceDir, eyeY, 2.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mustache or Mouth
  if (g.hasMustache) {
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.ellipse(cx - 4 + faceDir, cy + 9, 6, 3, -0.2, 0, Math.PI * 2);
    ctx.ellipse(cx + 4 + faceDir, cy + 9, 6, 3, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  if (g.hasToupeeLanded) {
    // Big confident smile
    ctx.arc(cx + faceDir, cy + 10, 5.5, 0.1, Math.PI - 0.1);
  } else {
    // Slightly shivering / embarrassed o-mouth
    ctx.arc(cx + faceDir, cy + 12, 2.8, 0, Math.PI * 2);
  }
  ctx.stroke();

  // 7. If Toupee has landed on this gentleman, draw the landed toupee snugly on his head!
  if (g.hasToupeeLanded && g.landedStyle) {
    ctx.save();
    ctx.translate(cx + (g.landedOffsetX ?? 0), cy - g.headRadius * 0.72);
    drawToupeeSprite(ctx, g.landedStyle, time * 4, 1.02);
    ctx.restore();
  }

  // 8. Name & status tag below feet
  ctx.font = '700 11px "Nunito", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
  ctx.beginPath();
  ctx.roundRect(cx - 38, cy + 68, 76, 18, 6);
  ctx.fill();
  ctx.fillStyle = g.hasToupeeLanded ? '#FDE047' : '#FFFFFF';
  ctx.fillText(g.name, cx, cy + 81);

  ctx.restore();
}

/**
 * Draws the CEO Bald Boss riding his Executive Helicopter & generating extreme downdrafts
 */
export function drawBossHelicopter(
  ctx: CanvasRenderingContext2D,
  boss: BossHelicopter,
  time: number
) {
  ctx.save();
  const bx = boss.x;
  const by = boss.y;

  // 1. Extreme Downdraft Cone Visualization underneath the helicopter
  if (!boss.hasToupeeLanded) {
    const halfW = boss.downdraftWidth * 0.5;
    const coneGrad = ctx.createLinearGradient(bx, by + 20, bx, by + 390);
    if (boss.isVulnerable) {
      // During the 3-second target window, cone turns Emerald/Gold (landing window open)
      coneGrad.addColorStop(0, 'rgba(16, 185, 129, 0.32)');
      coneGrad.addColorStop(1, 'rgba(16, 185, 129, 0.02)');
    } else {
      coneGrad.addColorStop(0, 'rgba(244, 63, 94, 0.36)');
      coneGrad.addColorStop(0.6, 'rgba(139, 92, 246, 0.18)');
      coneGrad.addColorStop(1, 'rgba(139, 92, 246, 0.0)');
    }

    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(bx - 55, by + 18);
    ctx.lineTo(bx + 55, by + 18);
    ctx.lineTo(bx + halfW, by + 390);
    ctx.lineTo(bx - halfW, by + 390);
    ctx.closePath();
    ctx.fill();

    // Animated downward wind chevrons inside the cone
    ctx.strokeStyle = boss.isVulnerable ? 'rgba(16, 185, 129, 0.65)' : 'rgba(244, 63, 94, 0.7)';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 4; i++) {
      const offsetY = ((time * (boss.isVulnerable ? 90 : 280) + i * 85) % 320) + 40;
      ctx.beginPath();
      ctx.moveTo(bx - 28, by + offsetY - 10);
      ctx.lineTo(bx, by + offsetY + 6);
      ctx.lineTo(bx + 28, by + offsetY - 10);
      ctx.stroke();
    }
  }

  // 2. Helicopter Tail Boom & Skids
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#1E293B';

  // Landing skids
  ctx.beginPath();
  ctx.moveTo(bx - 48, by + 34);
  ctx.lineTo(bx + 48, by + 34);
  ctx.moveTo(bx - 26, by + 20);
  ctx.lineTo(bx - 26, by + 34);
  ctx.moveTo(bx + 26, by + 20);
  ctx.lineTo(bx + 26, by + 34);
  ctx.stroke();

  // Tail boom
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.moveTo(bx + 42, by - 8);
  ctx.lineTo(bx + 98, by - 16);
  ctx.lineTo(bx + 98, by - 4);
  ctx.lineTo(bx + 42, by + 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Tail rotor
  ctx.save();
  ctx.translate(bx + 98, by - 12);
  ctx.rotate(time * 28);
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.lineTo(14, 0);
  ctx.stroke();
  ctx.restore();

  // 3. Helicopter Cabin Body (Luxury Gold & Slate)
  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.roundRect(bx - 54, by - 24, 104, 46, [24, 20, 16, 16]);
  ctx.fill();
  ctx.stroke();

  // Gold Executive Stripe & "$CEO" Emblem
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(bx - 50, by + 4, 96, 8);
  ctx.font = '900 11px "JetBrains Mono", monospace';
  ctx.fillStyle = '#FEF08A';
  ctx.textAlign = 'center';
  ctx.fillText('CEO-VIP', bx + 16, by - 4);

  // 4. CEO Bald Boss leaning his head out of the open top/side skylight!
  const headX = bx + boss.headOffsetX;
  const headY = by + boss.headOffsetY;

  // Boss Suit Collar
  ctx.fillStyle = '#312E81';
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(headX - 20, headY + 12, 40, 20, 8);
  ctx.fill();
  ctx.stroke();

  // Boss Shiny Bald Head
  const headGrad = ctx.createRadialGradient(headX - 6, headY - 10, 2, headX, headY, boss.headRadius);
  headGrad.addColorStop(0, '#FEF3C7');
  headGrad.addColorStop(0.55, '#FDBA74');
  headGrad.addColorStop(1, '#EA580C');

  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.arc(headX, headY, boss.headRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Boss Sunglasses & Cigar/Mustache
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(headX - 16, headY - 4, 13, 7);
  ctx.fillRect(headX + 3, headY - 4, 13, 7);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(headX - 3, headY - 1);
  ctx.lineTo(headX + 3, headY - 1);
  ctx.stroke();

  // White bushy CEO mustache
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.ellipse(headX - 5, headY + 8, 7, 3.5, -0.2, 0, Math.PI * 2);
  ctx.ellipse(headX + 5, headY + 8, 7, 3.5, 0.2, 0, Math.PI * 2);
  ctx.fill();

  if (boss.hasToupeeLanded && boss.landedStyle) {
    ctx.save();
    ctx.translate(headX, headY - boss.headRadius * 0.72);
    drawToupeeSprite(ctx, boss.landedStyle, time * 4, 1.12);
    ctx.restore();
  } else {
    // Target Bullseye & 3.0s Countdown Ring directly around the CEO's bald head!
    const crownY = headY - boss.headRadius * 0.75;
    if (boss.isVulnerable) {
      const ratio = Math.max(0, boss.landingWindowTimer / boss.maxWindowDuration);
      ctx.save();
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(headX, headY, boss.headRadius + 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
      ctx.stroke();

      // Floating "3.0s landing window" badge
      ctx.fillStyle = '#10B981';
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(headX - 56, crownY - 44, 112, 24, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 12px "Jua", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`WINDOW! ${boss.landingWindowTimer.toFixed(1)}s`, headX, crownY - 28);
      ctx.restore();
    } else {
      // Warning badge when rotor downdraft is at full blast
      ctx.save();
      ctx.fillStyle = '#F43F5E';
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(headX - 52, crownY - 42, 104, 22, 7);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 11px "Jua", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`WINDOW IN ${boss.cooldownTimer.toFixed(1)}s`, headX, crownY - 27);
      ctx.restore();
    }
  }

  // 5. Spinning Main Rotor Blades (offset to the right side of the cabin so the CEO's head on the left is open to the sky!)
  const mastX = bx + 20;
  const mastY = by - 24;
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(mastX, mastY);
  ctx.lineTo(mastX, mastY - 12);
  ctx.stroke();

  const bladeSpan = Math.cos(boss.rotorAngle) * 82;
  ctx.strokeStyle = boss.isVulnerable ? 'rgba(226, 232, 240, 0.55)' : '#1E293B';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(mastX - bladeSpan, mastY - 12);
  ctx.lineTo(mastX + bladeSpan, mastY - 12);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws wind zones (Updraft Vents & Gust Pockets) and Wind Stream Ribbons
 */
export function drawWindEnvironment(
  ctx: CanvasRenderingContext2D,
  zones: WindZone[],
  particles: WindParticle[],
  groundY: number,
  time: number
) {
  // 1. Draw localized wind zones
  for (const z of zones) {
    ctx.save();
    if (z.type === 'updraft') {
      const grad = ctx.createLinearGradient(z.x, z.y + z.height, z.x, z.y);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.34)');
      grad.addColorStop(0.7, 'rgba(103, 232, 249, 0.14)');
      grad.addColorStop(1, 'rgba(103, 232, 249, 0.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(z.x, z.y, z.width, z.height);

      // Rising air chevrons
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 2.2;
      const centerX = z.x + z.width / 2;
      for (let i = 0; i < 4; i++) {
        const yPos = z.y + z.height - (((time * 120 + i * 70) % z.height));
        ctx.beginPath();
        ctx.moveTo(centerX - 16, yPos + 6);
        ctx.lineTo(centerX, yPos - 6);
        ctx.lineTo(centerX + 16, yPos + 6);
        ctx.stroke();
      }

      // Street grate / fan housing on the sidewalk
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(z.x + 6, groundY - 8, z.width - 12, 12, 4);
      ctx.fill();
      ctx.stroke();

      if (z.label) {
        ctx.font = '700 11px "Jua", sans-serif';
        ctx.fillStyle = '#0284C7';
        ctx.textAlign = 'center';
        ctx.fillText(z.label, centerX, groundY - 14);
      }
    } else if (z.type === 'downdraft' || z.type === 'gust') {
      const isDown = z.type === 'downdraft';
      ctx.fillStyle = isDown ? 'rgba(244, 63, 94, 0.14)' : 'rgba(250, 204, 21, 0.16)';
      ctx.strokeStyle = isDown ? 'rgba(244, 63, 94, 0.45)' : 'rgba(234, 179, 8, 0.55)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.roundRect(z.x, z.y, z.width, z.height, 16);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);

      if (z.label) {
        ctx.font = '700 12px "Jua", sans-serif';
        ctx.fillStyle = isDown ? '#E11D48' : '#B45309';
        ctx.textAlign = 'center';
        ctx.fillText(z.label, z.x + z.width / 2, z.y + 20);
      }
    }
    ctx.restore();
  }

  // 2. Draw flowing wind ribbon particles
  ctx.save();
  ctx.lineCap = 'round';
  for (const p of particles) {
    ctx.strokeStyle = p.color;
    ctx.globalAlpha = p.alpha;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    const angle = Math.atan2(p.vy, p.vx);
    ctx.lineTo(
      p.x - Math.cos(angle) * p.length,
      p.y - Math.sin(angle) * p.length
    );
    ctx.stroke();
  }
  ctx.restore();
}
