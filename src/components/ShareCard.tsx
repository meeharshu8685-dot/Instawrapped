import React from 'react';
import type { WrappedStats } from '../types/instagram';

interface Props {
  stats: WrappedStats;
  showNames?: boolean;
}

const ShareCard: React.FC<Props> = ({ stats, showNames = true }) => {
  const top1 = stats.topConnections[0];
  const topName = top1 ? (showNames ? top1.name : 'Top Friend') : 'Nobody';

  return (
    <div className="relative w-full max-w-[280px] sm:max-w-[300px] aspect-[9/16] bg-gradient-to-b from-[#2B1055] via-[#1B0C2E] to-[#0A0515] rounded-3xl overflow-hidden select-none mx-auto border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col justify-between p-6">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute -top-16 -right-16 w-44 h-44 bg-insta-pink/30 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-insta-orange/25 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-grain opacity-25 mix-blend-overlay pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black tracking-[0.25em] text-white/50 uppercase">
            Official Summary
          </p>
          <p className="text-sm font-extrabold tracking-tight text-white">
            INSTAWRAPPED <span className="text-insta-pink">2026</span>
          </p>
        </div>
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
      </div>

      {/* Main Metric */}
      <div className="relative z-10 my-auto text-left">
        <p className="text-[3.2rem] font-black tracking-tighter leading-[0.85] text-white mb-2">
          {stats.totalMessages.toLocaleString()}
        </p>
        <p className="text-sm font-bold text-white/60 tracking-tight leading-tight">
          messages exchanged across {stats.activeDaysCount} active days
        </p>

        {/* Highlight Pills */}
        <div className="mt-4 space-y-2">
          <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md">
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">#1 Connection</p>
            <p className="text-xs font-black text-white truncate">{topName}</p>
          </div>

          {stats.longestDayStreak && (
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md">
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Longest Streak</p>
              <p className="text-xs font-black text-white">
                {stats.longestDayStreak.days} days with {showNames ? stats.longestDayStreak.name : 'Bestie'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Archetype Badge */}
      <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Archetype</p>
          <p className="text-xs font-black text-insta-yellow truncate max-w-[170px]">
            {stats.archetype.title}
          </p>
        </div>
        <div className="text-[9px] font-bold text-white/30 tracking-widest uppercase">
          InstaWrapped
        </div>
      </div>
    </div>
  );
};

export default ShareCard;
