import React from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { SharedStats } from '../types/instagram';

interface Props {
  sharedStats: SharedStats;
  onCreateOwn: () => void;
}

const SharedPreview: React.FC<Props> = ({ sharedStats, onCreateOwn }) => {
  return (
    <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-grain opacity-20 mix-blend-overlay pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-insta-orange/5 via-transparent to-insta-pink/5 pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-insta-pink/10 blur-[100px] rounded-full pointer-events-none" />
      
      <motion.div 
        className="z-10 w-full max-w-2xl flex flex-col justify-between min-h-[70vh] py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="text-center md:text-left space-y-2">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-white/50">
            {sharedStats.ownerName ? `${sharedStats.ownerName}'s` : 'Their'}
          </h1>
          <h2 className="text-[3rem] md:text-[5rem] font-bold tracking-tighter leading-none mb-12">
            Instagram <br className="hidden md:block" /> Wrapped.
          </h2>
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-16 my-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 1 }}
            className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-8 border-b border-white/5 pb-8"
          >
            <div className="text-[4rem] md:text-[6rem] font-bold tracking-tighter leading-none">
              {sharedStats.showExactNumbers ? sharedStats.totalMessages.toLocaleString() : 'Thousands of'}
            </div>
            <div className="text-2xl text-white/50 font-medium">messages exchanged</div>
          </motion.div>

          {sharedStats.topConnection && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1 }}
              className="flex flex-col border-b border-white/5 pb-8"
            >
              <div className="text-2xl text-white/50 font-medium mb-2">#1 Connection</div>
              <div className="text-[3rem] md:text-[4rem] font-bold tracking-tighter leading-none break-words">
                {sharedStats.topConnection}
              </div>
              {sharedStats.showExactNumbers && sharedStats.topConnectionCount && (
                <div className="text-xl text-white/30 font-medium mt-4">
                  {sharedStats.topConnectionCount.toLocaleString()} interactions
                </div>
              )}
            </motion.div>
          )}

          {sharedStats.archetypeTitle && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 1 }}
              className="flex flex-col pb-8"
            >
              <div className="text-2xl text-white/50 font-medium mb-2">Archetype</div>
              <div className="text-[3rem] md:text-[4rem] font-bold tracking-tighter leading-none text-white/80">
                {sharedStats.archetypeTitle}
              </div>
            </motion.div>
          )}
        </div>

        <div className="mt-8">
          <button 
            onClick={onCreateOwn}
            className="w-full md:w-auto px-12 flex items-center justify-center gap-3 py-6 rounded-full bg-white text-black font-bold text-xl active:scale-[0.98] transition-transform group spatial-shadow"
          >
            Create My Wrapped
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SharedPreview;
