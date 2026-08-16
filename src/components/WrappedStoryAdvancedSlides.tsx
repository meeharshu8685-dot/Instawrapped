import { motion } from 'framer-motion';
import type { WrappedStats } from '../types/instagram';

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

export const SlideSocialCircle = ({ stats, showNames }: { stats: WrappedStats, showNames?: boolean }) => {
  const top = (stats.topConnections || []).slice(0, 8);
  const maxMessages = top[0]?.messageCount || 1;

  return (
    <div className="w-full px-4 flex flex-col justify-center items-center h-full max-w-lg mx-auto py-6 overflow-hidden">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-2">
        <p className="text-xs md:text-sm font-bold tracking-[0.25em] text-white/50 uppercase mb-1">Gravity & Orbit</p>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter text-white">Your Social Circle</h2>
      </motion.div>
      
      {/* Visual Solar System Graph - Responsive Radius */}
      <div className="relative w-full max-w-[270px] sm:max-w-[320px] h-56 sm:h-64 my-2 sm:my-4 mx-auto flex items-center justify-center">
        {/* Orbital rings */}
        <div className="absolute w-[180px] sm:w-[220px] h-[180px] sm:h-[220px] rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute w-[240px] sm:w-[290px] h-[240px] sm:h-[290px] rounded-full border border-dashed border-white/5 pointer-events-none" />

        {/* Center Node (YOU) */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white text-black font-black flex items-center justify-center text-xs sm:text-sm shadow-[0_0_25px_rgba(255,255,255,0.7)] z-20"
        >
          YOU
        </motion.div>

        {/* Orbiting Satellite Nodes */}
        {top.map((conn, i) => {
          const ratio = conn.messageCount / maxMessages;
          const nodeSize = 30 + ratio * 20; 
          const angle = (i / top.length) * (2 * Math.PI) - (Math.PI / 2);
          const baseR = 90;
          const r = baseR + (i % 2) * 32;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;

          return (
            <motion.div
              key={conn.name}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + (i * 0.08), type: 'spring' }}
              className="absolute z-10 flex flex-col items-center pointer-events-none"
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
            >
              <div 
                style={{ width: `${nodeSize}px`, height: `${nodeSize}px` }}
                className="rounded-full bg-white/20 border border-white/40 flex items-center justify-center backdrop-blur-md shadow-lg"
              >
                <div 
                  style={{ width: `${nodeSize * 0.45}px`, height: `${nodeSize * 0.45}px` }}
                  className="rounded-full bg-white/80"
                />
              </div>
              {ratio > 0.25 && (
                <span className="text-[9px] sm:text-[10px] font-black text-white px-1.5 py-0.5 rounded bg-black/60 shadow mt-0.5 max-w-[65px] sm:max-w-[80px] truncate block text-center">
                  {showNames ? conn.name.split(' ')[0] : 'HIDDEN'}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-center mt-2"
      >
        <div className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter mb-0.5 text-white">
          {stats.uniqueContacts.toLocaleString()}
        </div>
        <div className="text-xs sm:text-sm md:text-xl text-white/60 font-medium">
          unique people in your world
        </div>
      </motion.div>
    </div>
  );
};

export const SlideCalendar = ({ stats }: { stats: WrappedStats }) => {
  const cal = stats.socialCalendar || [];
  if (cal.length === 0) return <div className="text-2xl font-bold">No calendar data</div>;
  const mostActive = [...cal].sort((a, b) => b.total - a.total)[0] || { total: 1, date: 'N/A' };
  
  return (
    <div className="w-full px-4 md:px-8 flex flex-col justify-center h-full max-w-xl mx-auto py-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-4 sm:mb-6">
        <p className="text-xs md:text-sm font-bold tracking-[0.25em] text-white/50 uppercase mb-1">Activity Rhythm</p>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter text-white">
          Your Social Calendar
        </h2>
      </motion.div>
      
      <div className="text-center mb-4 sm:mb-6">
        <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-wrap items-baseline justify-center gap-1.5 sm:gap-3">
          <span className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter leading-tight text-white">
            {stats.activeDaysCount}
          </span>
          <span className="text-white/50 text-xl sm:text-2xl md:text-4xl font-bold">active days</span>
        </motion.div>
        
        {mostActive && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-xs sm:text-sm md:text-base font-medium text-white/70 mt-1.5 truncate max-w-full px-2">
            Busiest Day: <span className="text-white font-bold">{mostActive.date}</span> ({mostActive.total} msgs)
          </motion.p>
        )}
      </div>

      {/* Heatmap Grid - Responsive Fit */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-[340px] sm:max-w-md mx-auto grid grid-cols-12 gap-1 sm:gap-1.5 justify-center p-2.5 sm:p-3 bg-black/20 rounded-2xl border border-white/10"
      >
        {cal.slice(-108).map((day, i) => {
          const intensity = Math.min(day.total / (mostActive.total || 1), 1);
          let bgClass = "bg-white/5";
          if (intensity > 0.05) bgClass = "bg-white/25";
          if (intensity > 0.3) bgClass = "bg-white/50";
          if (intensity > 0.6) bgClass = "bg-white/80";
          if (intensity > 0.85) bgClass = "bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]";
          
          return (
            <motion.div 
              key={day.date}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 + (i * 0.003) }}
              className={`aspect-square w-full rounded-sm ${bgClass}`}
              title={`${day.date}: ${day.total} messages`}
            />
          );
        })}
      </motion.div>
      <p className="text-center text-white/40 text-[10px] sm:text-[11px] mt-3 uppercase tracking-widest font-semibold">
        Recent Daily Intensity
      </p>
    </div>
  );
};

export const SlideStreak = ({ stats, showNames }: { stats: WrappedStats, showNames?: boolean }) => {
  const streak = stats.longestDayStreak;
  if (!streak) return <div className="text-xl sm:text-2xl px-8 text-center text-white/50">Not enough consistent back-and-forth for a streak.</div>;
  
  return (
    <div className="text-center w-full px-4 flex flex-col justify-center h-full max-w-xl mx-auto py-6">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xs md:text-sm font-bold tracking-[0.25em] text-white/50 uppercase mb-2"
      >
        Unbroken Connection
      </motion.p>
      
      <motion.div 
        initial={{ y: 20, opacity: 0, filter: 'blur(10px)' }} 
        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }} 
        transition={{ delay: 0.2, type: 'spring', damping: 15 }}
        className="text-5xl sm:text-7xl md:text-9xl font-black leading-none tracking-tighter drop-shadow-2xl my-2 text-white break-all"
      >
        {streak.days}
      </motion.div>

      <motion.h2 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xl sm:text-2xl md:text-4xl font-bold tracking-tight mb-2 text-white/90"
      >
        consecutive days chatting
      </motion.h2>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-base sm:text-lg md:text-2xl text-white/70 font-medium px-2 break-words"
      >
        with <span className="text-white font-bold">{showNames ? streak.name : 'Hidden'}</span>
      </motion.p>

      {streak.startDate && streak.endDate && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="text-[11px] sm:text-xs md:text-sm text-white/40 mt-6 tracking-widest uppercase font-semibold break-words px-2"
        >
          {streak.startDate} → {streak.endDate}
        </motion.p>
      )}
    </div>
  );
};

export const SlideMonthly = ({ stats, showNames }: { stats: WrappedStats, showNames?: boolean }) => {
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
        <p className="text-xs md:text-sm font-bold tracking-[0.25em] text-white/50 uppercase mb-1">Timeline</p>
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
              key={m.month}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-3 sm:p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md flex flex-col gap-1.5 sm:gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] sm:text-xs md:text-sm font-black text-white/70 tracking-wider uppercase truncate">
                  {formattedMonth}
                </span>
                <span className="text-[11px] sm:text-xs md:text-sm font-bold text-white/80 shrink-0">
                  {m.count.toLocaleString()} msgs
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-base sm:text-lg md:text-2xl font-bold tracking-tight text-white truncate max-w-full">
                  {showNames ? m.name : 'Top Contact'}
                </span>
              </div>

              {/* Gradient Progress Bar */}
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${ratio}%` }} 
                  transition={{ delay: 0.2 + i * 0.08, duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-insta-yellow via-insta-pink to-insta-purple rounded-full" 
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
