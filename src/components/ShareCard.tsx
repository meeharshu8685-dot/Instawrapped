import React from 'react';
import type { WrappedStats } from '../types/instagram';
import { Sparkles, Flame, MessageCircle } from 'lucide-react';

interface Props {
  stats: WrappedStats;
  showNames?: boolean;
}

const ShareCard: React.FC<Props> = ({ stats, showNames = true }) => {
  const top1 = stats.topConnections[0];
  const topName = top1 ? (showNames ? top1.name : 'Top Friend') : 'Nobody';

  return (
    <div 
      id="share-card-capture"
      className="relative w-full max-w-[270px] sm:max-w-[290px] aspect-[9/16] bg-gradient-to-b from-[#1E0B36] via-[#120724] to-[#080210] rounded-[2rem] overflow-hidden select-none mx-auto border border-white/20 shadow-[0_25px_70px_rgba(0,0,0,0.8)] flex flex-col justify-between p-5 sm:p-6"
    >
      {/* Vibrant Ambient Glow Meshes */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-insta-pink/40 to-insta-purple/20 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-gradient-to-tr from-insta-orange/30 to-insta-yellow/20 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-grain opacity-20 mix-blend-overlay pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-insta-yellow via-insta-pink to-insta-purple flex items-center justify-center shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-[9px] font-black tracking-[0.25em] text-white/50 uppercase leading-none">
              OFFICIAL WRAPPED
            </p>
            <p className="text-xs sm:text-sm font-black tracking-tight text-white mt-0.5">
              INSTAGRAM <span className="bg-gradient-to-r from-insta-yellow to-insta-pink bg-clip-text text-transparent">2026</span>
            </p>
          </div>
        </div>
        <span className="text-[9px] font-extrabold tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.3)]">
          VERIFIED
        </span>
      </div>

      {/* Main Metric Spotlight */}
      <div className="relative z-10 my-auto text-left w-full overflow-hidden">
        <p className="text-[9px] font-black tracking-[0.25em] text-white/40 uppercase mb-1">
          TOTAL CONNECTIONS
        </p>
        <p className="text-4xl sm:text-5xl font-black tracking-tighter leading-[0.88] text-white mb-1.5 break-all drop-shadow-[0_4px_20px_rgba(255,255,255,0.25)]">
          {stats.totalMessages.toLocaleString()}
        </p>
        <p className="text-xs font-bold text-white/60 tracking-tight leading-snug">
          messages exchanged across <span className="text-white font-extrabold">{stats.activeDaysCount} active days</span>
        </p>

        {/* Highlight Insights Cards */}
        <div className="mt-3.5 space-y-2 w-full">
          {/* Top Connection */}
          <div className="p-2.5 rounded-xl bg-white/[0.08] border border-white/10 backdrop-blur-md overflow-hidden flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-[8px] font-black text-insta-yellow uppercase tracking-widest">
                <MessageCircle className="w-2.5 h-2.5" /> #1 Connection
              </div>
              <p className="text-xs font-black text-white truncate max-w-full mt-0.5">{topName}</p>
            </div>
            {top1 && (
              <span className="text-[10px] font-bold text-white/60 bg-white/10 px-2 py-0.5 rounded-full shrink-0">
                {top1.messageCount.toLocaleString()} msgs
              </span>
            )}
          </div>

          {/* Longest Streak or Active Peak */}
          {stats.longestDayStreak ? (
            <div className="p-2.5 rounded-xl bg-white/[0.08] border border-white/10 backdrop-blur-md overflow-hidden flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-[8px] font-black text-insta-orange uppercase tracking-widest">
                  <Flame className="w-2.5 h-2.5" /> Unbroken Streak
                </div>
                <p className="text-xs font-black text-white truncate max-w-full mt-0.5">
                  {stats.longestDayStreak.days} days with {showNames ? stats.longestDayStreak.name : 'Bestie'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-white/[0.08] border border-white/10 backdrop-blur-md overflow-hidden flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-[8px] font-black text-white/40 uppercase tracking-widest">
                  Peak Rhythm
                </div>
                <p className="text-xs font-black text-white truncate max-w-full mt-0.5">
                  {stats.peakDayOfWeek}s at {stats.peakHour > 12 ? (stats.peakHour - 12) + ' PM' : stats.peakHour + ' AM'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Archetype Badge */}
      <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
        <div className="overflow-hidden min-w-0 flex-1">
          <p className="text-[8px] font-black text-white/40 uppercase tracking-wider">2026 ARCHETYPE</p>
          <p className="text-xs font-black bg-gradient-to-r from-insta-yellow via-white to-insta-pink bg-clip-text text-transparent truncate">
            {stats.archetype.title}
          </p>
        </div>
        <div className="text-[8px] font-bold text-white/30 tracking-widest uppercase shrink-0">
          instawrapped
        </div>
      </div>
    </div>
  );
};

export default ShareCard;
