import React, { useRef } from 'react';
import type { WrappedStats } from '../types/instagram';

interface Props {
  stats: WrappedStats;
  showNames: boolean;
}

const ShareCard: React.FC<Props> = ({ stats, showNames }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col items-center">
      <div 
        ref={cardRef}
        className="w-[300px] h-[533px] bg-background relative overflow-hidden flex flex-col justify-between p-6 rounded-3xl"
        style={{ aspectRatio: '9/16' }}
      >
        {/* Background elements */}
        <div className="absolute inset-0 bg-grain opacity-30 mix-blend-overlay" />
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-insta-pink rounded-full blur-[80px] opacity-40" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-insta-orange rounded-full blur-[80px] opacity-40" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div>
            <div className="text-white/60 font-black tracking-widest text-xs uppercase mb-1">InstaWrapped 2026</div>
            <h2 className="text-3xl font-black text-white leading-tight">I am<br/><span className="text-gradient">{stats.archetype.title}</span></h2>
          </div>
          
          <div className="space-y-4 my-auto">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
              <p className="text-[10px] text-white/50 font-bold uppercase mb-1">Total Output</p>
              <p className="text-2xl font-black">{stats.totalMessages.toLocaleString()} msgs</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
              <p className="text-[10px] text-white/50 font-bold uppercase mb-1">Top Connection</p>
              <p className="text-xl font-bold truncate">{showNames ? stats.topConnections[0]?.name : "Secret"}</p>
              <p className="text-sm text-insta-pink font-medium">{stats.topConnections[0]?.messageCount.toLocaleString()} msgs</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
              <p className="text-[10px] text-white/50 font-bold uppercase mb-1">Media Shared</p>
              <p className="text-2xl font-black">{stats.mediaShared.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Generate yours at</div>
            <div className="font-bold text-white/80 text-sm">instawrapped.com</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareCard;
