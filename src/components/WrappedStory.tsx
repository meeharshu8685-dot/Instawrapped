import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import type { WrappedStats } from '../types/instagram';
import ShareCard from './ShareCard';
import { Volume2, VolumeX, Eye, EyeOff } from 'lucide-react';

interface Props {
  stats: WrappedStats;
  onReset: () => void;
}

const TOTAL_SLIDES = 13;

const WrappedStory: React.FC<Props> = ({ stats, onReset }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showNames, setShowNames] = useState(true);

  // Auto-advance progress
  useEffect(() => {
    if (currentSlide === TOTAL_SLIDES - 1) return; // Stop on last slide (Share card)
    
    const timer = setTimeout(() => {
      nextSlide();
    }, 6000); // 6 seconds per slide

    return () => clearTimeout(timer);
  }, [currentSlide]);

  const nextSlide = () => {
    if (currentSlide < TOTAL_SLIDES - 1) {
      setCurrentSlide(p => p + 1);
      triggerSlideEffects(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) setCurrentSlide(p => p - 1);
  };

  const triggerSlideEffects = (slideIndex: number) => {
    // Confetti on big reveals
    if (slideIndex === 3 || slideIndex === 11) { // #1 connection reveals
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#833ab4', '#fd1d1d', '#fcb045', '#e1306c']
      });
    }
    
    // Play synth sound if enabled
    if (soundEnabled) {
      playSynthChime();
    }
  };

  const playSynthChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440 * Math.pow(2, (currentSlide % 7) / 12), ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1);
    } catch (e) {
      console.warn("Audio not supported or allowed", e);
    }
  };

  const handleTap = (e: React.MouseEvent) => {
    const clickX = e.clientX;
    const width = window.innerWidth;
    if (clickX < width / 3) {
      prevSlide();
    } else {
      nextSlide();
    }
  };

  const formatHour = (h: number) => {
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    return h > 12 ? `${h - 12} PM` : `${h} AM`;
  };

  const topConnection = stats.topConnections[0] || { name: 'Nobody', messageCount: 0 };

  const renderSlide = () => {
    const slideVariants = {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.05 }
    };

    switch(currentSlide) {
      case 0:
        return (
          <motion.div key="s0" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="text-center">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 text-gradient">Your Instagram, <br/> wrapped.</h1>
            <p className="text-2xl font-bold text-white/50 mb-12">2026</p>
            <button onClick={(e) => { e.stopPropagation(); nextSlide(); }} className="px-8 py-4 bg-white text-black font-bold rounded-full text-lg">Let's go →</button>
          </motion.div>
        );
      
      case 1:
        return (
          <motion.div key="s1" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="text-center max-w-lg">
            <p className="text-2xl text-white/60 font-bold mb-8 uppercase tracking-widest">First things first...</p>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-[5rem] md:text-[8rem] font-black leading-none text-insta-pink mb-4">
              {stats.totalMessages.toLocaleString()}
            </motion.div>
            <p className="text-2xl md:text-4xl font-bold">messages exchanged</p>
          </motion.div>
        );

      case 2:
        return (
          <motion.div key="s2" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-2xl px-6">
            <h2 className="text-4xl md:text-6xl font-black mb-16 text-center">You had a lot to say.</h2>
            
            <div className="space-y-12">
              <div>
                <div className="flex justify-between text-2xl font-bold mb-4">
                  <span className="text-white/70">Sent</span>
                  <span>{stats.messagesSent.toLocaleString()}</span>
                </div>
                <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.messagesSent / stats.totalMessages) * 100}%` }} transition={{ duration: 1, delay: 0.5 }} className="h-full bg-insta-pink" />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-2xl font-bold mb-4">
                  <span className="text-white/70">Received</span>
                  <span>{stats.messagesReceived.toLocaleString()}</span>
                </div>
                <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.messagesReceived / stats.totalMessages) * 100}%` }} transition={{ duration: 1, delay: 0.8 }} className="h-full bg-insta-orange" />
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div key="s3" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="text-center">
            <p className="text-2xl text-white/60 font-bold mb-12">But who did you talk to the most?</p>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', delay: 1 }} className="glass-card p-12 md:p-20 border-white/20 relative">
              <div className="absolute -top-6 -right-6 w-12 h-12 bg-insta-orange rounded-full flex items-center justify-center font-black text-2xl shadow-xl">#1</div>
              <h2 className="text-5xl md:text-8xl font-black mb-6 text-gradient">{showNames ? topConnection.name : "Someone"}</h2>
              <p className="text-2xl text-white/70 font-medium">{topConnection.messageCount.toLocaleString()} messages</p>
            </motion.div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div key="s4" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-md px-6">
            <h2 className="text-3xl md:text-4xl font-black mb-12 text-center">Your Instagram has a favorite person.</h2>
            <div className="space-y-4">
              {stats.topConnections.slice(0, 3).map((conn, i) => (
                <motion.div key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 + (i * 0.2) }} className="glass-card p-6 flex items-center gap-6">
                  <div className="text-3xl font-black text-white/30">#{i+1}</div>
                  <div>
                    <div className="text-2xl font-bold">{showNames ? conn.name : `Connection ${i+1}`}</div>
                    <div className="text-insta-pink font-medium">{conn.messageCount.toLocaleString()} interactions</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div key="s5" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="text-center">
            <h2 className="text-4xl font-black mb-16">Okay... now the reels.</h2>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }} className="text-8xl font-black text-insta-orange mb-4">
              {stats.reelsShared.toLocaleString()}
            </motion.div>
            <p className="text-3xl font-bold text-white/70">shared media</p>
          </motion.div>
        );

      case 6:
        // Find top media sharing partner
        const topMediaPartner = [...stats.topConnections].sort((a,b) => b.mediaShared - a.mediaShared)[0];
        return (
          <motion.div key="s6" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="text-center max-w-lg px-6">
            <h2 className="text-3xl md:text-5xl font-black mb-8 leading-tight">You two were basically a distribution network.</h2>
            <div className="glass-card p-8">
              <p className="text-xl mb-4 text-white/70">You shared the most content with</p>
              <p className="text-5xl font-black text-gradient mb-4">{showNames ? topMediaPartner?.name : "Someone"}</p>
              <p className="text-2xl font-bold">{topMediaPartner?.mediaShared.toLocaleString()} items</p>
            </div>
          </motion.div>
        );

      case 7:
        return (
          <motion.div key="s7" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="text-center">
            <p className="text-2xl text-white/60 font-bold mb-8 uppercase tracking-widest">Your most active month</p>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-7xl md:text-9xl font-black text-gradient">
              {stats.mostActiveMonth}
            </motion.div>
          </motion.div>
        );

      case 8:
        return (
          <motion.div key="s8" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="text-center px-6">
            <p className="text-2xl text-white/60 font-bold mb-8 uppercase tracking-widest">Your peak Instagram hour</p>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }} className="text-7xl md:text-9xl font-black mb-8">
              {formatHour(stats.peakHour)}
            </motion.div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-xl md:text-2xl text-white/50 italic font-medium">
              Apparently, sleep was optional.
            </motion.p>
          </motion.div>
        );

      case 9:
        return (
          <motion.div key="s9" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="text-center px-6">
            <p className="text-2xl text-white/60 font-bold mb-8 uppercase tracking-widest">Your longest conversation</p>
            <motion.div className="glass-card p-12 border-insta-purple/30">
              <div className="text-6xl md:text-8xl font-black mb-4">{stats.longestChat.count}</div>
              <div className="text-2xl font-bold text-white/70 mb-4">messages in a row</div>
              <div className="text-xl font-medium">with <span className="text-insta-pink font-bold">{showNames ? stats.longestChat.name : "Someone"}</span></div>
            </motion.div>
          </motion.div>
        );

      case 10:
        return (
          <motion.div key="s10" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="text-center max-w-xl px-6">
            <p className="text-xl text-white/60 font-bold mb-12 uppercase tracking-widest">Your Instagram Personality</p>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
              <h2 className="text-5xl md:text-7xl font-black text-gradient mb-8 leading-none">{stats.archetype.title}</h2>
              <p className="text-xl md:text-2xl text-white/80 leading-relaxed font-medium">{stats.archetype.description}</p>
            </motion.div>
          </motion.div>
        );

      case 11:
        return (
          <motion.div key="s11" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="text-center px-6">
            <p className="text-2xl md:text-4xl font-black text-white/50 mb-12">Some people just show up more often.</p>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, type: 'spring' }}>
              <h2 className="text-5xl md:text-8xl font-black text-white mb-6">{showNames ? topConnection.name : "Top Connection"}</h2>
              <p className="text-3xl text-insta-pink font-bold">{topConnection.messageCount.toLocaleString()} interactions</p>
            </motion.div>
          </motion.div>
        );

      case 12:
        return (
          <motion.div key="s12" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="w-full flex justify-center px-4" onClick={(e) => e.stopPropagation()}>
            <ShareCard stats={stats} showNames={showNames} onRestart={onReset} />
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-background text-white select-none overflow-hidden" onClick={handleTap}>
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-grain opacity-20 pointer-events-none" />
      <motion.div 
        animate={{ 
          background: [
            'radial-gradient(circle at 0% 0%, #833ab430 0%, transparent 50%)',
            'radial-gradient(circle at 100% 100%, #fd1d1d30 0%, transparent 50%)',
            'radial-gradient(circle at 0% 100%, #fcb04530 0%, transparent 50%)',
            'radial-gradient(circle at 100% 0%, #e1306c30 0%, transparent 50%)'
          ]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 pointer-events-none transition-colors duration-1000"
      />

      {/* Progress Bars (Top) */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-6 z-50 flex gap-1.5 opacity-80 pointer-events-none">
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
          <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden relative">
            {i < currentSlide && <div className="absolute inset-0 bg-white" />}
            {i === currentSlide && (
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 6, ease: "linear" }}
                className="absolute inset-y-0 left-0 bg-white"
              />
            )}
          </div>
        ))}
      </div>

      {/* Controls (Top Right) */}
      <div className="absolute top-12 right-6 z-50 flex gap-4" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setShowNames(!showNames)} className="p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 hover:bg-white/10 transition">
          {showNames ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5 text-white/50" />}
        </button>
        <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 hover:bg-white/10 transition">
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-white/50" />}
        </button>
      </div>

      {/* Slide Content Area */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pt-10">
        <AnimatePresence mode="wait">
          {renderSlide()}
        </AnimatePresence>
      </div>

      {/* Navigation hints for desktop */}
      <div className="absolute bottom-6 w-full text-center text-white/20 text-sm font-medium tracking-widest hidden md:block pointer-events-none z-50">
        CLICK SIDES OR USE ARROW KEYS TO NAVIGATE
      </div>
    </div>
  );
};

export default WrappedStory;
