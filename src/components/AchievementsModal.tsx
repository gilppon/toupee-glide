import React from 'react';
import { X, Award, Check } from 'lucide-react';
import { ACHIEVEMENTS } from '../game/retention';
import { PlayerSaveData } from '../types/game';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  saveData: PlayerSaveData;
  onClaimAll: (ids: string[]) => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose,
  saveData,
  onClaimAll,
}) => {
  if (!isOpen) return null;

  const claimed = new Set(saveData.claimedAchievements ?? []);
  const rows = ACHIEVEMENTS.map((a) => ({
    ...a,
    value: Math.min(a.goal, Math.max(0, Math.floor(a.value(saveData)))),
  }));
  const doneCount = rows.filter((r) => r.value >= r.goal).length;
  const unclaimed = rows.filter((r) => r.value >= r.goal && !claimed.has(r.id)).map((r) => r.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-5">
      <div className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-3xl bg-[#FFFDF7] comic-panel overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="barber-awning h-5 w-full border-b-3 border-slate-800 shrink-0" />

        <div className="flex items-center justify-between px-5 py-3.5 bg-emerald-100 border-b-3 border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-400 comic-panel-sm flex items-center justify-center">
              <Award className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl text-slate-900">Hall of Fame</h2>
              <p className="text-xs font-bold text-slate-600">
                {doneCount}/{rows.length} unlocked · claim each one for a gold bonus
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-rose-500 hover:bg-rose-600 text-white comic-btn flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 space-y-3">
          {rows.map((a) => {
            const isClaimed = claimed.has(a.id);
            const done = a.value >= a.goal;
            return (
              <div
                key={a.id}
                className={`rounded-2xl border-2 border-slate-800 p-3 comic-panel-sm ${
                  done ? 'bg-emerald-50' : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-display text-base text-slate-900 flex items-center gap-1.5">
                      {done && <Check className="w-4 h-4 text-emerald-600" />}
                      {a.label}
                    </div>
                    <div className="text-[11px] font-bold text-slate-500">{a.hint}</div>
                  </div>
                  <div className="font-mono-num font-black text-sm text-slate-700 shrink-0">
                    {a.value}/{a.goal}
                  </div>
                </div>
                <div className="mt-2 w-full h-2.5 bg-slate-200 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${(a.value / a.goal) * 100}%` }}
                  />
                </div>
                <div className="mt-1.5 text-[10px] font-black">
                  {isClaimed ? (
                    <span className="text-emerald-600">CLAIMED</span>
                  ) : done ? (
                    <span className="text-amber-600">READY TO CLAIM · 200G</span>
                  ) : (
                    <span className="text-slate-400">IN PROGRESS</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 sm:px-6 sm:pb-6 shrink-0">
          <button
            onClick={() => onClaimAll(unclaimed)}
            disabled={unclaimed.length === 0}
            className={`w-full py-3 rounded-2xl font-display text-lg comic-btn cursor-pointer ${
              unclaimed.length === 0
                ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                : 'bg-amber-400 hover:bg-amber-300 text-slate-900'
            }`}
          >
            {unclaimed.length === 0
              ? 'Nothing to claim'
              : `Claim ${unclaimed.length} · +${(unclaimed.length * 200).toLocaleString('en-US')}G`}
          </button>
        </div>
      </div>
    </div>
  );
};