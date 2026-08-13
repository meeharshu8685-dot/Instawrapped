import React, { useState } from 'react';
import { Share, Copy, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import type { WrappedStats, SharedStats } from '../types/instagram';

interface Props {
  stats: WrappedStats;
  onClose: () => void;
}

const ShareMenu: React.FC<Props> = ({ stats, onClose }) => {
  const [showNames, setShowNames] = useState(true);
  const [showNumbers, setShowNumbers] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareName, setShareName] = useState('My');

  const generateShareLink = () => {
    const sharedData: SharedStats = {
      ownerName: shareName.trim() || 'My',
      year: new Date().getFullYear(),
      totalMessages: stats.totalMessages,
      topConnection: showNames ? stats.longestChat.name : 'Someone special',
      topConnectionCount: stats.longestChat.count,
      peakMonth: stats.mostActiveMonth.month,
      archetypeTitle: stats.archetype.title,
      showExactNumbers: showNumbers,
    };

    const payload = btoa(encodeURIComponent(JSON.stringify(sharedData)));
    const url = new URL(window.location.href);
    url.hash = `share=${payload}`;
    return url.toString();
  };

  const handleShare = async () => {
    const link = generateShareLink();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Instagram Wrapped",
          text: "Check out my Instagram Wrapped!",
          url: link,
        });
        return;
      } catch (e) {
        console.log("Share failed or aborted", e);
      }
    }
    
    handleCopy(link);
  };

  const handleCopy = (link?: string) => {
    navigator.clipboard.writeText(link || generateShareLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4 pointer-events-auto">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Bottom Sheet / Modal */}
      <motion.div 
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full max-w-md bg-[#161616] sm:rounded-[2rem] rounded-t-[2.5rem] p-8 relative z-10 spatial-shadow flex flex-col"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, { offset }) => {
          if (offset.y > 100) onClose();
        }}
      >
        {/* Drag Handle for mobile */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8 sm:hidden" />

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors hidden sm:block"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-3xl font-bold tracking-tight mb-8">Share Wrapped</h3>
        
        <div className="space-y-4 mb-10">
          <div>
            <label className="block text-sm font-bold text-white/50 mb-3 tracking-wide uppercase">Your Name</label>
            <input 
              type="text" 
              placeholder="e.g. Harshu"
              value={shareName}
              onChange={(e) => setShareName(e.target.value)}
              className="w-full bg-black/50 border border-white/5 rounded-2xl px-5 py-4 text-white text-lg font-medium focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          <label className="flex items-center justify-between p-5 rounded-2xl bg-white/5 cursor-pointer active:scale-[0.98] transition-transform">
            <span className="font-bold text-lg">Show top connection's name</span>
            <div className={`w-12 h-7 rounded-full transition-colors relative ${showNames ? 'bg-white text-black' : 'bg-white/10'}`}>
              <motion.div layout className={`w-6 h-6 rounded-full bg-black shadow-sm absolute top-0.5 ${showNames ? 'right-0.5 bg-black' : 'left-0.5 bg-white/50'}`} />
            </div>
            {/* Hidden actual checkbox to keep state simple without modifying logic */}
            <input type="checkbox" checked={showNames} onChange={(e) => setShowNames(e.target.checked)} className="hidden" />
          </label>
          
          <label className="flex items-center justify-between p-5 rounded-2xl bg-white/5 cursor-pointer active:scale-[0.98] transition-transform">
            <span className="font-bold text-lg">Show exact numbers</span>
            <div className={`w-12 h-7 rounded-full transition-colors relative ${showNumbers ? 'bg-white text-black' : 'bg-white/10'}`}>
              <motion.div layout className={`w-6 h-6 rounded-full bg-black shadow-sm absolute top-0.5 ${showNumbers ? 'right-0.5 bg-black' : 'left-0.5 bg-white/50'}`} />
            </div>
            <input type="checkbox" checked={showNumbers} onChange={(e) => setShowNumbers(e.target.checked)} className="hidden" />
          </label>
        </div>

        <p className="text-sm text-white/30 font-medium mb-8 text-center px-4 leading-relaxed">
          Your private messages remain on your device. Only these stats are included in your shareable link.
        </p>

        <div className="flex gap-4">
          <button 
            onClick={() => handleCopy()}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all font-bold text-lg"
          >
            {copied ? <Check className="w-5 h-5 text-white" /> : <Copy className="w-5 h-5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          
          <button 
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-full bg-white text-black active:scale-95 transition-all font-bold text-lg"
          >
            <Share className="w-5 h-5" />
            Share
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ShareMenu;
