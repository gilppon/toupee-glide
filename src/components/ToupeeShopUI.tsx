import React, { useEffect, useRef } from 'react';
import { X, Wind, Magnet, Sparkles, Check, Lock, Coins, ArrowUpCircle } from 'lucide-react';
import {
  STYLE_ORDER,
  TOUPEE_STYLES,
  getGlideRatioStat,
  getGlideUpgradeCost,
  getMagnetStat,
  getMagnetUpgradeCost,
} from '../data/toupeeData';
import { PlayerSaveData, ToupeeStyleId } from '../types/game';
import { drawToupeeSprite } from './ToupeeSprites';

interface ToupeeShopUIProps {
  isOpen: boolean;
  onClose: () => void;
  saveData: PlayerSaveData;
  onUpgradeGlide: () => void;
  onUpgradeMagnet: () => void;
  onBuyOrEquipStyle: (styleId: ToupeeStyleId) => void;
}

const StylePreviewCanvas: React.FC<{ styleId: ToupeeStyleId; size?: number }> = ({
  styleId,
  size = 76,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId = 0;
    let phase = Math.random() * 10;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      phase += 0.08;
      ctx.clearRect(0, 0, size, size);

      // Draw a cute wooden barber mannequin head underneath the toupee
      const cx = size / 2;
      const cy = size * 0.62;
      ctx.save();
      ctx.fillStyle = '#FDBA74';
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(cx, cy, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Mannequin stand base
      ctx.fillStyle = '#78350F';
      ctx.beginPath();
      ctx.roundRect(cx - 10, cy + 14, 20, 7, 3);
      ctx.fill();
      ctx.stroke();

      // Draw Toupee on top
      ctx.translate(cx, cy - 12);
      drawToupeeSprite(ctx, styleId, phase, 0.92);
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [styleId, size]);

  return <canvas ref={canvasRef} width={size} height={size} className="shrink-0" />;
};

export const ToupeeShopUI: React.FC<ToupeeShopUIProps> = ({
  isOpen,
  onClose,
  saveData,
  onUpgradeGlide,
  onUpgradeMagnet,
  onBuyOrEquipStyle,
}) => {
  if (!isOpen) return null;

  const glideCost = getGlideUpgradeCost(saveData.glideRatioLevel);
  const magnetCost = getMagnetUpgradeCost(saveData.magnetAttachmentLevel);
  const glideStat = getGlideRatioStat(saveData.glideRatioLevel, saveData.equippedStyle);
  const magnetStat = getMagnetStat(saveData.magnetAttachmentLevel, saveData.equippedStyle);

  const isGlideMax = saveData.glideRatioLevel >= 10;
  const isMagnetMax = saveData.magnetAttachmentLevel >= 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-5">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-[#FFFDF7] comic-panel overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Barbershop Striped Awning Header */}
        <div className="barber-awning h-5 w-full border-b-3 border-slate-800 shrink-0" />

        <div className="flex items-center justify-between px-5 py-3.5 bg-[#FEF3C7] border-b-3 border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 comic-panel-sm flex items-center justify-center text-2xl">
              💈
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl text-slate-900 tracking-tight">
                Toupee Boutique
              </h2>
              <p className="text-xs sm:text-sm font-bold text-slate-600">
                Lift engineering upgrades &amp; legendary toupee collection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-amber-100 px-3.5 py-1.5 rounded-full comic-panel-sm">
              <Coins className="w-5 h-5 text-amber-600" />
              <span className="font-mono-num font-extrabold text-base sm:text-lg text-slate-900">
                {saveData.gold.toLocaleString('en-US')} G
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-rose-500 hover:bg-rose-600 text-white comic-btn flex items-center justify-center cursor-pointer"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Section 1: Core Physics Upgrades (Glide Ratio & Magnet Attachment) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ArrowUpCircle className="w-5 h-5 text-sky-600" />
              <h3 className="font-display text-lg text-slate-900">
                Flight Aerodynamics &amp; Magnet Research Lab
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Upgrade Card 1: Glide Ratio */}
              <div className="rounded-2xl bg-sky-50 p-4 comic-panel-sm flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-400 text-white comic-panel-sm flex items-center justify-center shrink-0">
                      <Wind className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-base sm:text-lg text-slate-900">
                          Lift &amp; Glide Ratio
                        </span>
                        <span className="px-2 py-0.5 text-xs font-mono-num font-extrabold rounded-full bg-sky-200 text-sky-900 border border-slate-800">
                          Lv.{saveData.glideRatioLevel}/10
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">
                        More hang time, slower sink, stronger headwind lift
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar & Numeric Readout */}
                <div className="bg-white/90 rounded-xl p-2.5 border-2 border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Current ratio: <strong className="font-mono-num text-sky-700">{glideStat.ratioText}</strong></span>
                    <span>Sink cut: <strong className="font-mono-num text-emerald-600">-{glideStat.sinkReductionPct}%</strong></span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-sky-500 transition-all duration-300"
                      style={{ width: `${(saveData.glideRatioLevel / 10) * 100}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={onUpgradeGlide}
                  disabled={isGlideMax || saveData.gold < glideCost}
                  className={`w-full py-2.5 px-4 rounded-xl font-display text-base flex items-center justify-center gap-2 comic-btn cursor-pointer ${
                    isGlideMax
                      ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                      : saveData.gold >= glideCost
                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-900'
                      : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isGlideMax ? (
                    <span>MAX LEVEL</span>
                  ) : (
                    <>
                      <span>Boost lift</span>
                      <span className="font-mono-num font-extrabold bg-white/80 px-2 py-0.5 rounded-lg border border-slate-800 text-sm">
                        {glideCost} G
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Upgrade Card 2: Magnet Attachment Force */}
              <div className="rounded-2xl bg-rose-50 p-4 comic-panel-sm flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white comic-panel-sm flex items-center justify-center shrink-0">
                      <Magnet className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-base sm:text-lg text-slate-900">
                          Magnet Force
                        </span>
                        <span className="px-2 py-0.5 text-xs font-mono-num font-extrabold rounded-full bg-rose-200 text-rose-900 border border-slate-800">
                          Lv.{saveData.magnetAttachmentLevel}/10
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">
                        Static charge that yanks the toupee onto a nearby scalp
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar & Numeric Readout */}
                <div className="bg-white/90 rounded-xl p-2.5 border-2 border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Pull radius: <strong className="font-mono-num text-rose-600">{magnetStat.radiusPx} px</strong></span>
                    <span>Pull force: <strong className="font-mono-num text-purple-700">{magnetStat.pullStrength} N</strong></span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-rose-500 transition-all duration-300"
                      style={{ width: `${(saveData.magnetAttachmentLevel / 10) * 100}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={onUpgradeMagnet}
                  disabled={isMagnetMax || saveData.gold < magnetCost}
                  className={`w-full py-2.5 px-4 rounded-xl font-display text-base flex items-center justify-center gap-2 comic-btn cursor-pointer ${
                    isMagnetMax
                      ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                      : saveData.gold >= magnetCost
                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-900'
                      : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isMagnetMax ? (
                    <span>MAX LEVEL</span>
                  ) : (
                    <>
                      <span>Boost magnet</span>
                      <span className="font-mono-num font-extrabold bg-white/80 px-2 py-0.5 rounded-lg border border-slate-800 text-sm">
                        {magnetCost} G
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Collectible Toupee Styles */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-display text-lg text-slate-900">
                  Toupee Collection ({saveData.collectedStyles.length}/{STYLE_ORDER.length} collected)
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500">
                Each toupee grants its own lift, magnet and tip bonus!
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {STYLE_ORDER.map((styleId) => {
                const style = TOUPEE_STYLES[styleId];
                const isUnlocked = saveData.collectedStyles.includes(styleId);
                const isEquipped = saveData.equippedStyle === styleId;
                const canAfford = saveData.gold >= style.price;

                return (
                  <div
                    key={styleId}
                    className={`rounded-2xl p-3.5 comic-panel-sm flex flex-col justify-between gap-3 transition-all ${
                      isEquipped
                        ? 'bg-amber-100/90 ring-3 ring-amber-400'
                        : isUnlocked
                        ? 'bg-white'
                        : 'bg-slate-100/90'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-sky-100/80 border-2 border-slate-800 p-1 flex items-center justify-center">
                        <StylePreviewCanvas styleId={styleId} size={72} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 text-[11px] font-extrabold rounded-full bg-slate-800 text-amber-300">
                            {style.badgeText}
                          </span>
                          {isEquipped && (
                            <span className="px-2 py-0.5 text-[11px] font-extrabold rounded-full bg-emerald-500 text-white border border-slate-800">
                              EQUIPPED
                            </span>
                          )}
                        </div>
                        <h4 className="font-display text-base text-slate-900 mt-1 truncate">
                          {style.nameEn}
                        </h4>
                        <p className="text-[11px] font-bold text-slate-600 line-clamp-2 leading-snug mt-0.5">
                          {style.tagline}
                        </p>
                      </div>
                    </div>

                    {/* Style Bonus Pills */}
                    <div className="grid grid-cols-3 gap-1.5 text-center bg-slate-900/5 rounded-xl p-1.5 border border-slate-800/20 text-[11px] font-bold">
                      <div className="bg-white rounded-lg py-1 border border-slate-300">
                        <div className="text-slate-500 text-[10px]">Lift</div>
                        <div className="font-mono-num text-sky-700">x{style.glideBonus.toFixed(2)}</div>
                      </div>
                      <div className="bg-white rounded-lg py-1 border border-slate-300">
                        <div className="text-slate-500 text-[10px]">Magnet</div>
                        <div className="font-mono-num text-rose-600">+{style.magnetBonus}px</div>
                      </div>
                      <div className="bg-white rounded-lg py-1 border border-slate-300">
                        <div className="text-slate-500 text-[10px]">Tip</div>
                        <div className="font-mono-num text-amber-600">x{style.goldBonusMultiplier.toFixed(1)}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => onBuyOrEquipStyle(styleId)}
                      disabled={!isUnlocked && !canAfford}
                      className={`w-full py-2 px-3 rounded-xl font-display text-sm flex items-center justify-center gap-1.5 comic-btn cursor-pointer ${
                        isEquipped
                          ? 'bg-emerald-500 text-white'
                          : isUnlocked
                          ? 'bg-sky-400 hover:bg-sky-300 text-slate-900'
                          : canAfford
                          ? 'bg-amber-400 hover:bg-amber-300 text-slate-900'
                          : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isEquipped ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Equipped right now</span>
                        </>
                      ) : isUnlocked ? (
                        <span>Equip this toupee</span>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>UNLOCK</span>
                          <span className="font-mono-num font-extrabold bg-white/80 px-2 py-0.5 rounded-md border border-slate-800 text-xs">
                            {style.price} G
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
