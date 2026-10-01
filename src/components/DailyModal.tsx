import React from 'react';
import { X, CalendarCheck, Coins } from 'lucide-react';
import { DAILY_REWARDS, DailyState } from '../game/retention';

interface DailyModalProps {
  isOpen: boolean;
  onClose: () => void;
  daily: DailyState;
  onClaim: () => void;
}

export const DailyModal: React.FC<DailyModalProps> = ({ isOpen, onClose, daily, onClaim }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-5">
      <div className="relative w-full max-w-lg flex flex-col rounded-3xl bg-[#FFFDF7] comic-panel overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="barber-awning h-5 w-full border-b-3 border-slate-800 shrink-0" />

        <div className="flex items-center justify-between px-5 py-3.5 bg-amber-100 border-b-3 border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 comic-panel-sm flex items-center justify-center">
              <CalendarCheck className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl text-slate-900">Daily Check-In</h2>
              <p className="text-xs font-bold text-slate-600">
                Streak: {daily.streak} day{daily.streak === 1 ? '' : 's'} · Best tip in the shop today
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

        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {DAILY_REWARDS.map((amount, i) => {
              const day = i + 1;
              const claimed = daily.streak > i || daily.claimedToday;
              const isNext = !daily.claimedToday && daily.nextDay === day;
              return (
                <div
                  key={day}
                  className={`rounded-xl border-2 border-slate-800 p-2 text-center comic-panel-sm ${
                    isNext ? 'bg-amber-300 ring-3 ring-amber-500' : claimed ? 'bg-emerald-100' : 'bg-slate-100'
                  }`}
                >
                  <div className="text-[10px] font-black text-slate-500">D{day}</div>
                  <div className="font-mono-num font-black text-sm text-amber-600">{amount.toLocaleString('en-US')}G</div>
                  <div className="text-[9px] font-bold text-slate-500">{claimed ? 'DONE' : isNext ? 'CLAIM' : '—'}</div>
                </div>
              );
            })}
          </div>

          <button
            onClick={onClaim}
            disabled={daily.claimedToday}
            className={`w-full py-3 rounded-2xl font-display text-lg flex items-center justify-center gap-2 comic-btn cursor-pointer ${
              daily.claimedToday
                ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                : 'bg-amber-400 hover:bg-amber-300 text-slate-900'
            }`}
          >
            <Coins className="w-5 h-5" />
            <span>
              {daily.claimedToday
                ? 'Already collected today'
                : `Day ${daily.nextDay} · Claim ${daily.reward.toLocaleString('en-US')}G`}
            </span>
          </button>

          <p className="text-[11px] font-bold text-slate-500 text-center leading-relaxed">
            A miss resets the streak to day 1. Day 7 pays{' '}
            {DAILY_REWARDS[DAILY_REWARDS.length - 1].toLocaleString('en-US')}G, twice day 1.
          </p>
        </div>
      </div>
    </div>
  );
};