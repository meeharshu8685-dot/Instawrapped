import React from 'react';
import { motion } from 'framer-motion';
import type { WrappedStats } from '../types/instagram';
import { Calendar, Flame, Clock, Sparkles } from 'lucide-react';

export const formatMonthTitle = (monthStr: string): string => {
  if (!monthStr) return '';
  if (monthStr.includes('-')) {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    if (!isNaN(date.getTime())) {
      const monthName = date.toLocaleString('default', { month: 'long' });
      return `${monthName} ${year}`;
    }
  }
  return monthStr;
};

export const SlideSocialCircle: React.FC<{ stats: WrappedStats, showNames?: boolean }> = ({ stats, showNames = true }) => {
  const top = (stats.topConnections || []).slice(0, 8);
  const maxMessages = top[0]?.messageCount || 1;
  const count = Math.max(top.length, 1);

  return (
    <div className="w-full px-4 flex flex-col justify-center items-center h-full max-w-lg mx-auto py-6 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="text-center mb-2"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 border border-white/10 text-[10px] md:text-xs font-bold tracking-widest text-white/80 uppercase mb-1.5 backdrop-blur-md">
          <Sparkles className="w-3 h-3 text-insta-yellow" /> Gravitational Pull
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter text-white">Your Social Circle</h2>
      </motion.div>
      
      {/* Visual Solar System Graph */}
      <div className="relative w-full max-w-[280px] sm:max-w-[340px] h-60 sm:h-72 my-2 sm:my-3 mx-auto flex items-center justify-center">
        {/* Orbital rings with ambient glow */}
        <div className="absolute w-[170px] sm:w-[200px] h-[170px] sm:h-[200px] rounded-full border border-white/15 pointer-events-none shadow-[0_0_20px_rgba(255,255,255,0.05)]" />
        <div className="absolute w-[230px] sm:w-[270px] h-[230px] sm:h-[270px] rounded-full border border-dashed border-white/10 pointer-events-none" />

        {/* Center Node (YOU) */}
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 14, stiffness: 140 }}
          className="absolute z-20 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-white via-white/95 to-white/70 text-black font-black flex items-center justify-center text-xs sm:text-sm shadow-[0_0_30px_rgba(255,255,255,0.8)] ring-4 ring-white/20"
        >
          YOU
        </motion.div>

        {/* Orbiting Satellite Nodes */}
        {top.map((conn, i) => {
          const ratio = maxMessages > 0 ? (conn.messageCount || 0) / maxMessages : 1;
          const nodeSize = Math.max(26, Math.min(48, 28 + ratio * 18)); 
          const angle = (i / count) * (2 * Math.PI) - (Math.PI / 2);
          const baseR = 82;
          const r = baseR + (i % 2) * 26;
          const targetX = Math.round(Math.cos(angle) * r);
          const targetY = Math.round(Math.sin(angle) * r);
          const displayName = showNames ? (conn.name ? conn.name.split(' ')[0] : 'Friend') : 'Friend';

          return (
            <motion.div
              key={`${conn.name || 'contact'}-${i}`}
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{ opacity: 1, scale: 1, x: targetX, y: targetY }}
              transition={{ delay: 0.15 + (i * 0.05), type: 'spring', damping: 15, stiffness: 120 }}
              className="absolute z-10 flex flex-col items-center pointer-events-none -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"
            >
              <div 
                style={{ width: `${nodeSize}px`, height: `${nodeSize}px` }}
                className="rounded-full bg-gradient-to-tr from-white/30 to-white/10 border border-white/40 flex items-center justify-center backdrop-blur-md shadow-[0_4px_15px_rgba(0,0,0,0.5)]"
              >
                <div 
                  style={{ width: `${nodeSize * 0.45}px`, height: `${nodeSize * 0.45}px` }}
                  className="rounded-full bg-white/90 shadow-sm"
                />
              </div>
              {ratio > 0.15 && (
                <span className="text-[9px] sm:text-[10px] font-black text-white px-1.5 py-0.5 rounded-full bg-black/75 border border-white/10 shadow mt-1 max-w-[65px] sm:max-w-[80px] truncate block text-center backdrop-blur-sm">
                  {displayName}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center mt-2"
      >
        <div className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter mb-0.5 text-white drop-shadow-md">
          {stats.uniqueContacts.toLocaleString()}
        </div>
        <div className="text-xs sm:text-sm md:text-xl text-white/60 font-medium">
          unique people in your universe
        </div>
      </motion.div>
    </div>
  );
};

export const SlideCalendar: React.FC<{ stats: WrappedStats }> = ({ stats }) => {
  const cal = stats.socialCalendar || [];
  if (cal.length === 0) return <div className="text-2xl font-bold text-center text-white/50">No calendar data available</div>;
  const mostActive = [...cal].sort((a, b) => b.total - a.total)[0] || { total: 1, date: 'N/A' };
  
  return (
    <div className="w-full px-4 md:px-8 flex flex-col justify-center h-full max-w-xl mx-auto py-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-4 sm:mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 border border-white/10 text-[10px] md:text-xs font-bold tracking-widest text-white/80 uppercase mb-1.5 backdrop-blur-md">
          <Calendar className="w-3 h-3 text-insta-pink" /> 365 Days of Chats
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter text-white">
          Your Social Calendar
        </h2>
      </motion.div>
      
      <div className="text-center mb-4 sm:mb-6">
        <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-wrap items-baseline justify-center gap-1.5 sm:gap-3">
          <span className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter leading-tight text-white drop-shadow-md">
            {stats.activeDaysCount}
          </span>
          <span className="text-white/50 text-xl sm:text-2xl md:text-4xl font-bold">active days</span>
        </motion.div>
        
        {mostActive && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-xs sm:text-sm md:text-base font-medium text-white/80 mt-1.5 truncate max-w-full px-2">
            Peak Intensity: <span className="text-white font-black bg-white/15 px-2 py-0.5 rounded-full">{mostActive.date}</span> ({mostActive.total.toLocaleString()} msgs)
          </motion.p>
        )}
      </div>

      {/* Heatmap Grid */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35 }}
        className="w-full max-w-[340px] sm:max-w-md mx-auto grid grid-cols-12 gap-1 sm:gap-1.5 justify-center p-3 sm:p-4 bg-black/30 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl"
      >
        {cal.slice(-108).map((day, i) => {
          const intensity = Math.min(day.total / (mostActive.total || 1), 1);
          let bgClass = "bg-white/5";
          if (intensity > 0.05) bgClass = "bg-white/20";
          if (intensity > 0.25) bgClass = "bg-insta-pink/60";
          if (intensity > 0.55) bgClass = "bg-insta-pink/90 shadow-[0_0_8px_rgba(225,48,108,0.5)]";
          if (intensity > 0.85) bgClass = "bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]";
          
          return (
            <motion.div 
              key={`${day.date}-${i}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 + (i * 0.003) }}
              className={`aspect-square w-full rounded-sm ${bgClass}`}
              title={`${day.date}: ${day.total} messages`}
            />
          );
        })}
      </motion.div>
      <p className="text-center text-white/40 text-[10px] sm:text-[11px] mt-3 uppercase tracking-widest font-semibold">
        Recent Activity Intensity
      </p>
    </div>
  );
};

export const SlideStreak: React.FC<{ stats: WrappedStats, showNames?: boolean }> = ({ stats, showNames = true }) => {
  const streak = stats.longestDayStreak;
  if (!streak) return <div className="text-xl sm:text-2xl px-8 text-center text-white/50">Not enough consistent back-and-forth for a streak.</div>;
  
  return (
    <div className="text-center w-full px-4 flex flex-col justify-center h-full max-w-xl mx-auto py-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-insta-orange/20 border border-insta-orange/30 text-[10px] md:text-xs font-bold tracking-widest text-insta-orange uppercase mb-2 backdrop-blur-md">
          <Flame className="w-3.5 h-3.5" /> Unbroken Connection
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ y: 20, opacity: 0, filter: 'blur(10px)' }} 
        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }} 
        transition={{ delay: 0.2, type: 'spring', damping: 15 }}
        className="text-6xl sm:text-7xl md:text-9xl font-black leading-none tracking-tighter drop-shadow-[0_10px_35px_rgba(245,96,64,0.4)] my-2 text-white break-all"
      >
        {streak.days}
      </motion.div>

      <motion.h2 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="text-xl sm:text-2xl md:text-4xl font-black tracking-tight mb-2 text-white/90"
      >
        consecutive days chatting
      </motion.h2>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-base sm:text-lg md:text-2xl text-white/80 font-semibold px-2 break-words"
      >
        with <span className="text-white font-black underline decoration-insta-orange decoration-2 underline-offset-4">{showNames ? (streak.name || 'Friend') : 'Friend'}</span>
      </motion.p>

      {streak.startDate && streak.endDate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs sm:text-sm text-white/60 font-semibold tracking-wider uppercase mx-auto"
        >
          <Clock className="w-3.5 h-3.5 text-white/50" />
          {streak.startDate} → {streak.endDate}
        </motion.div>
      )}
    </div>
  );
};

export const SlideMonthly: React.FC<{ stats: WrappedStats, showNames?: boolean }> = ({ stats, showNames = true }) => {
  const months = stats.monthlyTopConnections || [];
  if (months.length === 0) return null;
  const maxCount = Math.max(...months.map(m => m.count), 1);
  
  return (
    <div className="w-full px-4 md:px-8 flex flex-col justify-center h-full overflow-hidden max-w-lg mx-auto py-6">
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-4 sm:mb-6"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 border border-white/10 text-[10px] md:text-xs font-bold tracking-widest text-white/80 uppercase mb-1.5 backdrop-blur-md">
          <Calendar className="w-3 h-3 text-insta-yellow" /> Monthly Evolutions
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter text-white">
          Month by Month
        </h2>
      </motion.div>

      <div className="space-y-2.5 sm:space-y-3 overflow-y-auto max-h-[55vh] pr-1 hide-scrollbar">
        {months.slice(-5).map((m, i) => {
          const ratio = Math.min((m.count / maxCount) * 100, 100);
          const formattedMonth = formatMonthTitle(m.month);

          return (
            <motion.div 
              key={`${m.month}-${i}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-3 sm:p-4 rounded-2xl bg-white/[0.08] border border-white/15 backdrop-blur-xl shadow-lg flex flex-col gap-1.5 sm:gap-2 hover:bg-white/[0.12] transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] sm:text-xs md:text-sm font-black text-insta-yellow tracking-wider uppercase truncate">
                  {formattedMonth}
                </span>
                <span className="text-[11px] sm:text-xs md:text-sm font-black text-white/90 bg-white/10 px-2.5 py-0.5 rounded-full shrink-0">
                  {m.count.toLocaleString()} msgs
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-base sm:text-lg md:text-2xl font-black tracking-tight text-white truncate max-w-full">
                  {showNames ? (m.name || 'Top Contact') : 'Top Contact'}
                </span>
              </div>

              {/* Gradient Progress Bar */}
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${ratio}%` }} 
                  transition={{ delay: 0.2 + i * 0.08, duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-insta-yellow via-insta-pink to-insta-purple rounded-full shadow-[0_0_8px_rgba(225,48,108,0.6)]" 
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
