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
  const top10 = stats.allConnections?.slice(0, 8) || [];
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-between py-12 md:py-16 px-4 relative overflow-hidden max-w-xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mt-4"
      >
        <p className="text-xs md:text-sm font-bold tracking-[0.25em] text-white/50 uppercase mb-2">Network Map</p>
        <h2 className="text-3xl md:text-5xl font-black tracking-tighter">
          Your Social Circle
        </h2>
      </motion.div>
      
      {/* Node Graph Orbit */}
      <div className="relative w-72 h-72 md:w-80 md:h-80 my-auto flex items-center justify-center">
        {/* Center Node */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white flex items-center justify-center text-black font-black text-lg md:text-xl z-20 shadow-[0_0_50px_rgba(255,255,255,0.4)]"
        >
          YOU
        </motion.div>

        {/* Orbit Rings */}
        <div className="absolute inset-0 rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute inset-6 rounded-full border border-white/5 pointer-events-none" />
        
        {/* Orbiting Connections */}
        {top10.map((conn, i) => {
          const angle = (i / top10.length) * Math.PI * 2;
          const radius = 105 + (i % 2) * 25; // 105 to 130px radius
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          const maxMsgs = top10[0]?.messageCount || 1;
          const size = 32 + (conn.messageCount / maxMsgs) * 32;
          
          return (
            <motion.div
              key={conn.name}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, x, y, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 120 }}
              className="absolute rounded-full bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 shadow-lg z-10"
              style={{ width: size, height: size }}
            >
              {size > 42 && (
                <span className="text-[9px] md:text-[11px] font-bold text-center leading-tight truncate w-full px-1 text-white">
                  {showNames ? conn.name.split(' ')[0] : 'HIDDEN'}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="text-center mb-6"
      >
        <div className="text-5xl md:text-7xl font-black tracking-tighter mb-1 text-white">
          {stats.uniqueContacts.toLocaleString()}
        </div>
        <div className="text-base md:text-xl text-white/60 font-medium">
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
    <div className="w-full px-4 md:px-8 flex flex-col justify-center h-full max-w-xl mx-auto py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
        <p className="text-xs md:text-sm font-bold tracking-[0.25em] text-white/50 uppercase mb-2">Activity Rhythm</p>
        <h2 className="text-3xl md:text-5xl font-black tracking-tighter">
          Your Social Calendar
        </h2>
      </motion.div>
      
      <div className="text-center mb-6">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-5xl md:text-7xl font-black tracking-tighter leading-tight text-white">
          {stats.activeDaysCount} <span className="text-white/40 text-3xl md:text-5xl font-bold">active days</span>
        </motion.div>
        
        {mostActive && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-sm md:text-base font-medium text-white/70 mt-2">
            Busiest Day: <span className="text-white font-bold">{mostActive.date}</span> ({mostActive.total} msgs)
          </motion.p>
        )}
      </div>

      {/* Heatmap Grid */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full flex flex-wrap gap-1 md:gap-1.5 justify-center max-h-[300px] overflow-hidden p-3 bg-black/20 rounded-2xl border border-white/10"
      >
        {cal.slice(-112).map((day, i) => {
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
              transition={{ delay: 0.4 + (i * 0.005) }}
              className={`w-3.5 h-3.5 md:w-5 md:h-5 rounded-sm ${bgClass}`}
              title={`${day.date}: ${day.total} messages`}
            />
          );
        })}
      </motion.div>
      <p className="text-center text-white/40 text-[11px] mt-4 uppercase tracking-widest font-semibold">
        Recent Daily Intensity
      </p>
    </div>
  );
};

export const SlideStreak = ({ stats, showNames }: { stats: WrappedStats, showNames?: boolean }) => {
  const streak = stats.longestDayStreak;
  if (!streak) return <div className="text-2xl px-8 text-center text-white/50">Not enough consistent back-and-forth for a streak.</div>;
  
  return (
    <div className="text-center w-full px-4 flex flex-col justify-center h-full max-w-xl mx-auto">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xs md:text-sm font-bold tracking-[0.25em] text-white/50 uppercase mb-4"
      >
        Unbroken Connection
      </motion.p>
      
      <motion.div 
        initial={{ y: 20, opacity: 0, filter: 'blur(10px)' }} 
        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }} 
        transition={{ delay: 0.2, type: 'spring', damping: 15 }}
        className="text-[6.5rem] md:text-[10rem] font-black leading-none tracking-tighter drop-shadow-2xl mb-2 text-white"
      >
        {streak.days}
      </motion.div>

      <motion.h2 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-2xl md:text-4xl font-bold tracking-tight mb-2 text-white/90"
      >
        consecutive days chatting
      </motion.h2>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="text-lg md:text-2xl text-white/70 font-medium"
      >
        with <span className="text-white font-bold">{showNames ? streak.name : 'Hidden'}</span>
      </motion.p>

      {streak.startDate && streak.endDate && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-xs md:text-sm text-white/40 mt-8 tracking-widest uppercase font-semibold"
        >
          {streak.startDate} ? {streak.endDate}
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
        className="text-center mb-6"
      >
        <p className="text-xs md:text-sm font-bold tracking-[0.25em] text-white/50 uppercase mb-1">Timeline</p>
        <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
          Month by Month
        </h2>
      </motion.div>

      <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-1 hide-scrollbar">
        {months.slice(-5).map((m, i) => {
          const ratio = Math.min((m.count / maxCount) * 100, 100);
          const formattedMonth = formatMonthTitle(m.month);

          return (
            <motion.div 
              key={m.month}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-3.5 md:p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm font-black text-white/70 tracking-wider uppercase">
                  {formattedMonth}
                </span>
                <span className="text-xs md:text-sm font-bold text-white/80">
                  {m.count.toLocaleString()} msgs
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-lg md:text-2xl font-bold tracking-tight text-white truncate">
                  {showNames ? m.name : 'Top Contact'}
                </span>
              </div>

              {/* Gradient Progress Bar */}
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${ratio}%` }} 
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: "easeOut" }}
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
