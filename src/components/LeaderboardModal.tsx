import React, { useState } from 'react';
import { Trophy, X, Flame, UserCheck } from 'lucide-react';
import { TOUPEE_STYLES } from '../data/toupeeData';
import { PlayerSaveData } from '../types/game';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  saveData: PlayerSaveData;
  onUpdatePlayerName: (name: string) => void;
  onStartEndless: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  saveData,
  onUpdatePlayerName,
  onStartEndless,
}) => {
  const [nameInput, setNameInput] = useState(saveData.playerName);

  if (!isOpen) return null;

  const sortedBoard = [...saveData.leaderboard].sort((a, b) => {
    if (b.hops !== a.hops) return b.hops - a.hops;
    return b.score - a.score;
  });

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (trimmed) {
      onUpdatePlayerName(trimmed);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-5">
      <div className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-3xl bg-[#FFFDF7] comic-panel overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="barber-awning h-4 w-full border-b-3 border-slate-800 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-amber-100 border-b-3 border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 comic-panel-sm flex items-center justify-center">
              <Trophy className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl text-slate-900">
                Endless Hop Hall of Fame
              </h2>
              <p className="text-xs font-bold text-slate-600">
                Chain hops from scalp to scalp without ever touching the ground!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-rose-500 hover:bg-rose-600 text-white comic-btn flex items-center justify-center cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Player Career Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-sky-100 p-3 comic-panel-sm text-center">
              <div className="text-xs font-bold text-slate-600">My best chain</div>
              <div className="font-mono-num font-black text-2xl text-sky-700 mt-0.5">
                {saveData.endlessBestHops} <span className="text-sm">hops</span>
              </div>
            </div>
            <div className="rounded-2xl bg-amber-100 p-3 comic-panel-sm text-center">
              <div className="text-xs font-bold text-slate-600">Honey landings (100%)</div>
              <div className="font-mono-num font-black text-2xl text-amber-600 mt-0.5">
                {saveData.totalHoneyLandings} <span className="text-sm">times</span>
              </div>
            </div>
            <div className="rounded-2xl bg-rose-100 p-3 comic-panel-sm text-center">
              <div className="text-xs font-bold text-slate-600">CEO boss kills</div>
              <div className="font-mono-num font-black text-2xl text-rose-600 mt-0.5">
                {saveData.bossDefeatedCount} <span className="text-sm">times</span>
              </div>
            </div>
          </div>

          {/* Pilot Name Input */}
          <form onSubmit={handleSaveName} className="flex items-center gap-2 bg-slate-100 p-3 rounded-2xl border-2 border-slate-800">
            <UserCheck className="w-5 h-5 text-slate-700 shrink-0 ml-1" />
            <input
              type="text"
              maxLength={14}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter pilot name"
              className="flex-1 bg-white px-3 py-1.5 rounded-xl border-2 border-slate-800 font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 font-display text-sm text-slate-900 comic-btn cursor-pointer"
            >
              SAVE NAME
            </button>
          </form>

          {/* Leaderboard Table */}
          <div className="space-y-2">
            {sortedBoard.slice(0, 8).map((entry, idx) => {
              const rank = idx + 1;
              const style = TOUPEE_STYLES[entry.styleId] || TOUPEE_STYLES.classic;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border-2 border-slate-800 ${
                    entry.isPlayer
                      ? 'bg-amber-200/90 shadow-sm'
                      : rank === 1
                      ? 'bg-yellow-50'
                      : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl font-mono-num font-black text-sm flex items-center justify-center border-2 border-slate-800 shrink-0 ${
                        rank === 1
                          ? 'bg-amber-400 text-slate-900'
                          : rank === 2
                          ? 'bg-slate-300 text-slate-900'
                          : rank === 3
                          ? 'bg-orange-300 text-slate-900'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {rank}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-display text-base text-slate-900 truncate">
                          {entry.name}
                        </span>
                        {entry.isPlayer && (
                          <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded bg-slate-900 text-amber-300">
                            MY
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-bold text-slate-500">
                        Equipped: {style.nameEn} · {entry.date}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="font-mono-num font-black text-base text-sky-700">
                        {entry.hops} HOPS
                      </div>
                      <div className="font-mono-num text-xs font-bold text-amber-700">
                        {entry.score.toLocaleString('en-US')} PTS
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => {
              onClose();
              onStartEndless();
            }}
            className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-display text-lg flex items-center justify-center gap-2 comic-btn cursor-pointer"
          >
            <Flame className="w-5 h-5" />
            <span>Start Endless Hopping now!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
