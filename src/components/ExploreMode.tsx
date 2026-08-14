import React from 'react';
import type { WrappedStats } from '../types/instagram';
import { ChevronLeft, Zap, Users, BarChart3, MessageSquare, Image as ImageIcon, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  stats: WrappedStats;
  onBack: () => void;
  onReset: () => void;
}

const ExploreMode: React.FC<Props> = ({ stats, onBack, onReset }) => {
  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: 'spring' as const, damping: 25, stiffness: 200 }
    }
  };

  const BentoCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <motion.div 
      variants={itemVariants}
      whileHover={{ y: -4, scale: 1.01, transition: { type: 'spring' as const, damping: 20, stiffness: 300 } }}
      className={`bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl rounded-[2rem] p-8 md:p-10 spatial-shadow flex flex-col relative overflow-hidden group ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      {children}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-12 font-sans relative overflow-x-hidden selection:bg-white/20">
      <div className="absolute inset-0 bg-grain opacity-[0.15] pointer-events-none fixed z-0" />
      
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center">
        <div className="w-[80vw] h-[80vw] max-w-4xl max-h-4xl bg-white/[0.02] rounded-full blur-[100px]" />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16 pt-4">
          <div className="flex gap-4 items-center">
            <button 
              onClick={onReset}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 transition-colors text-white"
              title="Exit to Home"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <button 
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 transition-colors text-sm font-semibold tracking-wide"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Wrapped
            </button>
          </div>
          
          <h1 className="text-3xl font-bold tracking-tighter text-white/90">Data Explorer</h1>
        </header>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          {/* Main overview stat */}
          <BentoCard className="md:col-span-4 flex flex-col md:flex-row md:items-end justify-between gap-12 border-t border-white/[0.15]">
            <div className="max-w-2xl">
              <p className="text-white/40 font-semibold uppercase tracking-[0.2em] text-xs mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Lifetime Output
              </p>
              <h2 className="text-7xl md:text-[8rem] font-bold tracking-tighter leading-none mb-4">{stats.totalMessages.toLocaleString()}</h2>
              <p className="text-xl md:text-2xl text-white/50 font-medium tracking-tight">Total interactions across <span className="text-white font-semibold">{stats.uniqueContacts.toLocaleString()}</span> unique conversations.</p>
            </div>
            
            <div className="flex gap-4 shrink-0">
              <div className="flex flex-col justify-end p-6 bg-black/40 rounded-3xl border border-white/5 w-32 md:w-40 aspect-square">
                <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Sent</p>
                <p className="text-white font-bold text-3xl md:text-4xl tracking-tighter">{stats.messagesSent.toLocaleString()}</p>
              </div>
              <div className="flex flex-col justify-end p-6 bg-white rounded-3xl w-32 md:w-40 aspect-square">
                <p className="text-black/50 text-xs font-bold uppercase tracking-wider mb-2">Received</p>
                <p className="text-black font-bold text-3xl md:text-4xl tracking-tighter">{stats.messagesReceived.toLocaleString()}</p>
              </div>
            </div>
          </BentoCard>

          {/* Inner Circle Table */}
          <BentoCard className="md:col-span-3">
            <div className="flex items-center gap-3 mb-10 border-b border-white/5 pb-6">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-white/80" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight">Inner Circle</h3>
            </div>
            
            <div className="space-y-2">
              {stats.topConnections.map((conn, idx) => (
                <div key={conn.name} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors group/item">
                  <div className="flex items-center gap-5">
                    <span className="text-lg font-bold text-white/20 w-6 group-hover/item:text-white/40 transition-colors">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center shadow-inner">
                      <span className="font-bold text-white/70">{conn.name.substring(0, 2).toUpperCase()}</span>
                    </div>
                    <span className="text-xl font-semibold tracking-tight">{conn.name}</span>
                  </div>
                  <div className="text-right flex items-center gap-6">
                    <div className="hidden md:block text-right">
                      <p className="text-sm font-semibold text-white/40">Media</p>
                      <p className="font-medium text-white/80">{conn.mediaShared}</p>
                    </div>
                    <div className="w-24 text-right">
                      <p className="text-sm font-semibold text-white/40">Msgs</p>
                      <p className="font-bold text-xl">{conn.messageCount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>

          {/* Quick Stats Column */}
          <div className="md:col-span-1 flex flex-col gap-6">
            <BentoCard className="flex-1 flex justify-center">
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Peak Day
              </p>
              <h3 className="text-4xl md:text-5xl font-bold tracking-tighter leading-none">{stats.peakDayOfWeek}</h3>
            </BentoCard>
            
            <BentoCard className="flex-1 flex justify-center bg-white text-black border-transparent">
              <p className="text-black/50 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Peak Hour
              </p>
              <h3 className="text-4xl md:text-5xl font-bold tracking-tighter leading-none">
                {stats.peakHour > 12 ? `${stats.peakHour - 12} PM` : stats.peakHour === 0 ? '12 AM' : `${stats.peakHour} AM`}
              </h3>
            </BentoCard>

            <BentoCard className="flex-1 flex justify-center">
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Media Sent
              </p>
              <h3 className="text-4xl md:text-5xl font-bold tracking-tighter leading-none">{stats.mediaShared.toLocaleString()}</h3>
            </BentoCard>

            <BentoCard className="flex-1 flex justify-center">
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                <CalendarDays className="w-4 h-4" /> Active Days
              </p>
              <h3 className="text-4xl md:text-5xl font-bold tracking-tighter leading-none">{stats.activeDaysCount}</h3>
            </BentoCard>
          </div>
          
        </motion.div>
      </div>
    </div>
  );
};

export default ExploreMode;
