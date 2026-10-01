import React from 'react';

export interface CoachStep {
  title: string;
  body: string;
  anchor: 'canvas' | 'flap' | 'hud';
}

export const COACH_STEPS: CoachStep[] = [
  {
    title: '1. Hold to flap',
    body: 'Press and hold anywhere on the sky to keep climbing. Tap for a quick beat, hold for real lift.',
    anchor: 'canvas',
  },
  {
    title: '2. Steer with the arrows',
    body: 'Left and right arrows trim you into the wind. You do not need a perfect arc, just a landing.',
    anchor: 'hud',
  },
  {
    title: '3. Land on a bald head',
    body: 'Aim at a shiny scalp. The closer to dead centre, the bigger the tip and the honey bonus.',
    anchor: 'flap',
  },
];

/**
 * First-run coach. Renders as a bottom sheet on phones and as a floating card
 * next to the target zone on desktop, so it never covers the launch area.
 */
export const CoachOverlay: React.FC<{
  step: number;
  onNext: () => void;
  onSkip: () => void;
}> = ({ step, onNext, onSkip }) => {
  const s = COACH_STEPS[Math.min(step, COACH_STEPS.length - 1)];
  const isLast = step >= COACH_STEPS.length - 1;

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-3 sm:pb-5 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-lg rounded-2xl bg-[#FFFDF7] comic-panel p-4 animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] tracking-[0.2em] font-black text-amber-600">
              FIRST FLIGHT {step + 1}/{COACH_STEPS.length}
            </div>
            <h4 className="font-display text-lg text-slate-900 leading-tight">{s.title}</h4>
            <p className="text-xs font-bold text-slate-600 leading-snug mt-0.5">{s.body}</p>
          </div>
          <button
            onClick={onSkip}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 border-2 border-slate-800 font-display text-[11px] text-slate-700 cursor-pointer"
          >
            Skip
          </button>
        </div>
        <button
          onClick={onNext}
          className="mt-3 w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-300 border-[3px] border-slate-800 shadow-[0_4px_0_#1E293B] font-display text-base text-slate-900 cursor-pointer active:translate-y-[3px] active:shadow-[0_1px_0_#1E293B]"
        >
          {isLast ? 'Launch it' : 'Got it'}
        </button>
      </div>
    </div>
  );
};