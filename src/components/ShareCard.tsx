import React from 'react';
import type { WrappedStats } from '../types/instagram';

interface Props {
  stats: WrappedStats;
  showNames?: boolean;
}

const ShareCard: React.FC<Props> = ({ stats }) => {
  // A 9:16 shareable card component - Purely editorial, one powerful idea.
  return (
    <div 
      className="relative w-full max-w-[320px] aspect-[9/16] bg-[#020202] overflow-hidden select-none mx-auto border-4 border-black"
    >
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-insta-orange/10 via-transparent to-insta-pink/10" />
      <div className="absolute top-1/4 right-0 w-64 h-64 bg-insta-pink/20 blur-[80px] rounded-full" />
      <div className="absolute inset-0 bg-grain opacity-20 mix-blend-overlay" />

      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between p-8">
        
        <div className="mt-16">
          <p className="text-[5rem] font-bold tracking-tighter leading-[0.8] mb-6">
            {stats.totalMessages.toLocaleString()}
          </p>
          <p className="text-2xl font-medium text-white/60 tracking-tight leading-snug">
            messages <br/> exchanged
          </p>
        </div>

        <div className="mb-4">
          <p className="text-xl font-bold tracking-tight text-white/40 mb-1">
            InstaWrapped
          </p>
          <p className="text-sm font-bold tracking-widest text-white/20 uppercase">
            2026
          </p>
        </div>

      </div>
    </div>
  );
};

export default ShareCard;
