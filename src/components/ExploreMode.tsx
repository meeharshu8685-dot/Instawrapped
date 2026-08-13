import React from 'react';
import type { WrappedStats } from '../types/instagram';
import { ChevronLeft, Zap, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  stats: WrappedStats;
  onBack: () => void;
}

const ExploreMode: React.FC<Props> = ({ stats, onBack }) => {
  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background text-white p-6 md:p-12 font-sans relative overflow-x-hidden">
      <div className="absolute inset-0 bg-grain opacity-20 pointer-events-none fixed" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <header className="flex items-center justify-between mb-12">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition text-sm font-bold"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Wrapped
          </button>
          
          <h1 className="text-2xl font-black text-gradient">InstaWrapped Data</h1>
        </header>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Main overview stat */}
          <motion.div variants={itemVariants} className="md:col-span-3 glass-card p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 border-insta-purple/30">
            <div>
              <p className="text-white/60 font-bold uppercase tracking-widest mb-2">Total Output</p>
              <h2 className="text-6xl md:text-8xl font-black">{stats.totalMessages.toLocaleString()}</h2>
              <p className="text-2xl text-white/80 mt-2">Messages across {stats.uniqueContacts.toLocaleString()} chats</p>
            </div>
            <div className="flex gap-4">
              <div className="text-center p-6 bg-white/5 rounded-2xl">
                <p className="text-insta-pink font-black text-3xl">{stats.messagesSent.toLocaleString()}</p>
                <p className="text-sm font-bold text-white/50 uppercase">Sent</p>
              </div>
              <div className="text-center p-6 bg-white/5 rounded-2xl">
                <p className="text-insta-orange font-black text-3xl">{stats.messagesReceived.toLocaleString()}</p>
                <p className="text-sm font-bold text-white/50 uppercase">Received</p>
              </div>
            </div>
          </motion.div>

          {/* Inner Circle Table */}
          <motion.div variants={itemVariants} className="md:col-span-2 glass-card p-8">
            <div className="flex items-center gap-3 mb-8">
              <Users className="text-insta-pink" />
              <h3 className="text-2xl font-bold">The Inner Circle</h3>
            </div>
            
            <div className="space-y-4">
              {stats.topConnections.map((conn, idx) => (
                <div key={conn.name} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition">
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-black text-white/30 w-6">#{idx + 1}</span>
                    <span className="text-lg font-bold">{conn.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{conn.messageCount.toLocaleString()}</p>
                    <p className="text-xs text-white/50">{conn.mediaShared} media shared</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Stats Column */}
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="glass-card p-6 h-full">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="text-insta-orange" />
                <h3 className="text-xl font-bold">Highlights</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <p className="text-white/50 text-sm font-bold uppercase">Peak Day</p>
                  <p className="text-2xl font-black">{stats.peakDayOfWeek}</p>
                </div>
                <div>
                  <p className="text-white/50 text-sm font-bold uppercase">Peak Time</p>
                  <p className="text-2xl font-black">{stats.peakHour > 12 ? `${stats.peakHour - 12} PM` : stats.peakHour === 0 ? '12 AM' : `${stats.peakHour} AM`}</p>
                </div>
                <div>
                  <p className="text-white/50 text-sm font-bold uppercase">Media Sent</p>
                  <p className="text-2xl font-black">{stats.mediaShared.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-white/50 text-sm font-bold uppercase">Active Days</p>
                  <p className="text-2xl font-black">{stats.activeDaysCount}</p>
                </div>
              </div>
            </div>
          </motion.div>
          
        </motion.div>
      </div>
    </div>
  );
};

export default ExploreMode;
