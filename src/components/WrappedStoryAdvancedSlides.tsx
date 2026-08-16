import React from 'react';
import { motion } from 'framer-motion';
import type { WrappedStats } from '../types/instagram';

export const SlideSocialCircle = ({ stats, showNames }: { stats: WrappedStats, showNames?: boolean }) => {
  const top10 = stats.allConnections?.slice(0, 10) || [];
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl md:text-5xl font-bold tracking-tighter absolute top-[15%]"
      >
        Your Social Circle
      </motion.h2>
      
      <div className="relative w-full aspect-square max-w-lg mt-20">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-white flex items-center justify-center text-black font-black text-xl z-10 shadow-[0_0_50px_rgba(255,255,255,0.3)]"
        >
          YOU
        </motion.div>
        
        {top10.map((conn, i) => {
          const angle = (i / top10.length) * Math.PI * 2;
          const radius = 100 + (Math.random() * 60); 
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          const maxMsgs = top10[0].messageCount;
          const size = 30 + (conn.messageCount / maxMsgs) * 50;
          
          return (
            <motion.div
              key={conn.name}
              initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
              animate={{ opacity: 1, x, y, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1, type: "spring", stiffness: 100 }}
              className="absolute top-1/2 left-1/2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 shadow-xl"
              style={{ width: size, height: size }}
            >
              {size > 50 && (
                <span className="text-[10px] md:text-xs font-bold text-center leading-tight truncate w-full px-1">
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
        transition={{ delay: 2 }}
        className="absolute bottom-[15%] text-center"
      >
        <div className="text-6xl md:text-8xl font-black tracking-tighter mb-2">{stats.uniqueContacts.toLocaleString()}</div>
        <div className="text-xl md:text-2xl text-white/50 font-medium">people you interacted with</div>
      </motion.div>
    </div>
  );
};

export const SlideCalendar = ({ stats }: { stats: WrappedStats }) => {
  const cal = stats.socialCalendar || [];
  if (cal.length === 0) return <div className="text-2xl font-bold">No calendar data</div>;
  const mostActive = [...cal].sort((a, b) => b.total - a.total)[0];
  
  return (
    <div className="w-full px-4 md:px-12 flex flex-col justify-center h-full max-w-4xl mx-auto">
      <motion.p initial={{opacity:0}} animate={{opacity:1}} className="text-xl md:text-3xl text-white/40 font-medium mb-4">
        Your Social Calendar
      </motion.p>
      
      <div className="flex flex-col gap-6 mb-16">
        <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight">
          {stats.activeDaysCount} <span className="text-white/40">active days</span>
        </motion.div>
        
        {mostActive && (
          <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.3}} className="text-2xl md:text-4xl font-medium text-white/70">
            Peak: <span className="text-white font-bold">{mostActive.date}</span> ({mostActive.total} messages)
          </motion.div>
        )}
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="w-full flex flex-wrap gap-[3px] md:gap-1.5 justify-start md:justify-center"
      >
        {cal.slice(-150).map((day, i) => {
          const intensity = Math.min(day.total / (mostActive.total || 1), 1);
          let bgClass = "bg-white/5";
          if (intensity > 0.1) bgClass = "bg-white/20";
          if (intensity > 0.4) bgClass = "bg-white/40";
          if (intensity > 0.7) bgClass = "bg-white/70";
          if (intensity > 0.9) bgClass = "bg-white";
          
          return (
            <motion.div 
              key={day.date}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1 + (i * 0.01) }}
              className={`w-3 h-3 md:w-5 md:h-5 rounded-sm ${bgClass}`}
            />
          );
        })}
      </motion.div>
    </div>
  );
};

export const SlideTopRankings = ({ stats, showNames }: { stats: WrappedStats, showNames?: boolean }) => {
  const [activeRank, setActiveRank] = React.useState(0);
  
  React.useEffect(() => {
    const i = setInterval(() => {
      setActiveRank(prev => (prev + 1) % 3);
    }, 2500); 
    return () => clearInterval(i);
  }, []);

  const rankings = [
    { title: "MOST MESSAGED", data: stats.top5Messaged, val: (c: any) => `${c.messageCount.toLocaleString()} msgs` },
    { title: "MOST CONSISTENT", data: stats.top5Consistent, val: (c: any) => `${c.activeDays} days` },
    { title: "MOST SHARED MEDIA", data: stats.top5Media, val: (c: any) => `${c.mediaShared.toLocaleString()} media` }
  ];

  const current = rankings[activeRank];

  return (
    <div className="w-full px-6 md:px-12 flex flex-col justify-center h-full max-w-2xl mx-auto">
      <motion.div 
        key={current.title}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-white/40 text-sm font-bold tracking-[0.2em] mb-12"
      >
        {current.title}
      </motion.div>

      <div className="space-y-6">
        {current.data.slice(0,5).map((conn, idx) => (
          <motion.div 
            key={conn.name + current.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-center justify-between border-b border-white/5 pb-4"
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl font-black text-white/20">#{idx + 1}</span>
              <span className="text-2xl md:text-3xl font-bold tracking-tight">{showNames ? conn.name : 'Hidden'}</span>
            </div>
            <span className="text-lg md:text-xl font-medium text-white/60">{current.val(conn)}</span>
          </motion.div>
        ))}
      </div>
      
      <div className="flex justify-center gap-2 mt-12">
        {rankings.map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === activeRank ? 'w-8 bg-white' : 'w-2 bg-white/20'}`} />
        ))}
      </div>
    </div>
  );
};

export const SlideStreak = ({ stats, showNames }: { stats: WrappedStats, showNames?: boolean }) => {
  const streak = stats.longestDayStreak;
  if (!streak) return <div className="text-2xl px-8 text-center text-white/50">Not enough consistent back-and-forth for a streak.</div>;
  
  return (
    <div className="text-center w-full px-4">
      <motion.div 
        initial={{ y: 20, opacity: 0, filter: 'blur(10px)' }} 
        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }} 
        transition={{ delay: 0.5, type: 'spring', damping: 15 }}
        className="text-[8rem] md:text-[12rem] font-bold leading-none tracking-tighter drop-shadow-2xl mb-6 text-white"
      >
        {streak.days}
      </motion.div>
      <motion.h2 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-3xl md:text-5xl font-medium tracking-tight mb-4"
      >
        day conversation streak
      </motion.h2>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="text-xl md:text-3xl text-white/60 font-medium"
      >
        with <span className="text-white font-bold">{showNames ? streak.name : 'Hidden'}</span>
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="text-sm text-white/40 mt-12 tracking-widest uppercase font-bold"
      >
        {streak.startDate} to {streak.endDate}
      </motion.p>
    </div>
  );
};

export const SlideMonthly = ({ stats, showNames }: { stats: WrappedStats, showNames?: boolean }) => {
  const months = stats.monthlyTopConnections || [];
  if (months.length === 0) return null;
  
  return (
    <div className="w-full px-6 md:px-12 flex flex-col justify-center h-full overflow-hidden max-w-2xl mx-auto">
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl md:text-5xl font-bold tracking-tighter mb-12"
      >
        Month by Month
      </motion.h2>

      <div className="relative border-l-2 border-white/10 ml-4 pl-8 space-y-8 md:space-y-12">
        {months.slice(-6).map((m, i) => (
          <motion.div 
            key={m.month}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.2 }}
            className="relative"
          >
            <div className="absolute -left-[41px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
            
            <p className="text-white/40 text-xs font-bold tracking-[0.2em] uppercase mb-1">{m.month}</p>
            <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4">
              <span className="text-3xl md:text-4xl font-bold tracking-tight">{showNames ? m.name : 'Hidden'}</span>
              <span className="text-white/40 font-medium">{m.count.toLocaleString()} msgs</span>
            </div>
            <div className="mt-3 h-1 bg-white/10 rounded-full w-full max-w-[200px] overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }} 
                 animate={{ width: `${Math.min((m.count / 3000) * 100, 100)}%` }} 
                 transition={{ delay: 1 + i * 0.1, duration: 1 }}
                 className="h-full bg-white" 
               />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
