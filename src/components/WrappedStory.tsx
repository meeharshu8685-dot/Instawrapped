import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import type { WrappedStats } from '../types/instagram';
import ShareCard from './ShareCard';
import { LayoutGrid, Eye, EyeOff, Volume2, VolumeX } from 'lucide-react';

interface SlideProps {
  stats: WrappedStats;
  showNames?: boolean;
  onReset?: () => void;
  onExplore?: () => void;
}

interface Slide {
  id: string;
  component: React.FC<SlideProps>;
}

interface Props {
  stats: WrappedStats;
  onReset: () => void;
  onExplore: () => void;
}

const WrappedStory: React.FC<Props> = ({ stats, onReset, onExplore }) => {
  // Build slide array based on capabilities
  const buildSlides = (): Slide[] => {
    const slides: Slide[] = [
      { id: 'intro', component: SlideIntro },
      { id: 'total', component: SlideTotal },
      { id: 'ratio', component: SlideRatio },
      { id: 'month', component: SlideMonth },
      { id: 'peak', component: SlidePeak },
    ];
    
    if (stats.fastestDensity) slides.push({ id: 'density', component: SlideDensity });
    if (stats.longestStreak) slides.push({ id: 'streak', component: SlideStreak });
    if (stats.comeback) slides.push({ id: 'comeback', component: SlideComeback });
    if (stats.midnightConnection) slides.push({ id: 'midnight', component: SlideMidnight });
    if (stats.consistentConnection) slides.push({ id: 'consistent', component: SlideConsistent });
    if (stats.capabilities.media) slides.push({ id: 'media', component: SlideMedia });
    
    slides.push({ id: 'top3', component: SlideTop3 });
    slides.push({ id: 'top1', component: SlideTop1 });
    slides.push({ id: 'archetype', component: SlideArchetype });
    slides.push({ id: 'share', component: SlideShare });
    
    return slides;
  };

  const slides = useRef(buildSlides()).current;
  const TOTAL_SLIDES = slides.length;
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showNames, setShowNames] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Time tracking for progress bar
  const SLIDE_DURATION = 6000; // 6 seconds
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    if (currentSlide === TOTAL_SLIDES - 1) return; // Stop on last slide
    if (isPaused) {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
      lastUpdateRef.current = Date.now();
      return;
    }

    const animateProgress = () => {
      const now = Date.now();
      const delta = now - lastUpdateRef.current;
      setProgress((prev) => {
        const next = prev + (delta / SLIDE_DURATION) * 100;
        if (next >= 100) {
          nextSlide();
          return 0; // Handled by nextSlide, but just in case
        }
        return next;
      });
      lastUpdateRef.current = now;
      timerRef.current = requestAnimationFrame(animateProgress);
    };

    lastUpdateRef.current = Date.now();
    timerRef.current = requestAnimationFrame(animateProgress);

    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [currentSlide, isPaused]);

  // Keyboard Nav
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const nextSlide = () => {
    if (currentSlide < TOTAL_SLIDES - 1) {
      setCurrentSlide(p => p + 1);
      setProgress(0);
      triggerSlideEffects(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(p => p - 1);
      setProgress(0);
    }
  };

  const triggerSlideEffects = (slideIndex: number) => {
    const slideId = slides[slideIndex].id;
    if (slideId === 'top1' || slideId === 'archetype') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#833ab4', '#fd1d1d', '#fcb045', '#e1306c'],
        zIndex: 100 // Ensure it's over everything
      });
    }
    
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
      console.warn("Audio not supported", e);
    }
  };

  const handleTap = (e: React.MouseEvent) => {
    if (isPaused) return; // Prevent tap triggering if we were holding
    const clickX = e.clientX;
    const width = window.innerWidth;
    if (clickX < width * 0.3) {
      prevSlide();
    } else {
      nextSlide();
    }
  };

  const CurrentSlideComponent = slides[currentSlide].component;

  return (
    <div 
      className="fixed inset-0 bg-background text-white select-none overflow-hidden touch-none"
      onPointerDown={(e) => {
        // Only pause if clicking main area, not controls
        if ((e.target as HTMLElement).closest('.controls-layer')) return;
        setIsPaused(true);
      }}
      onPointerUp={() => {
        setIsPaused(false);
        // We use onClick for tap handling to avoid double firing with pointer events on mobile
      }}
      onPointerCancel={() => setIsPaused(false)}
      onContextMenu={(e) => e.preventDefault()} // Disable right click context
    >
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-grain opacity-30 pointer-events-none z-0" />
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
        className="absolute inset-0 pointer-events-none transition-colors duration-1000 z-0"
      />

      {/* Progress Bars (Top) */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-6 z-50 flex gap-1.5 opacity-80 pointer-events-none controls-layer">
        {slides.map((_, i) => (
          <div key={i} className={`progress-segment ${i === currentSlide && isPaused ? 'opacity-50' : ''}`}>
            {i < currentSlide && <div className="progress-segment-fill w-full" />}
            {i === currentSlide && (
              <div 
                className="progress-segment-fill"
                style={{ width: `${progress}%` }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Controls (Top Right) */}
      <div className="absolute top-12 right-6 z-50 flex gap-3 controls-layer">
        <button onClick={onExplore} className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/10 transition" title="Explore Data">
          <LayoutGrid className="w-5 h-5" />
        </button>
        <button onClick={() => setShowNames(!showNames)} className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/10 transition">
          {showNames ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5 text-white/50" />}
        </button>
        <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/10 transition">
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-white/50" />}
        </button>
      </div>

      {/* Slide Content Area */}
      <div 
        className="absolute inset-0 flex items-center justify-center z-10 pt-10"
        onClick={handleTap}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4 }}
            className={`w-full h-full flex flex-col items-center justify-center p-6 ${isPaused ? 'scale-[0.98]' : 'scale-100'} transition-transform duration-300`}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, { offset }) => {
              const swipe = offset.x;
              if (swipe < -50) nextSlide();
              else if (swipe > 50) prevSlide();
            }}
          >
            <CurrentSlideComponent stats={stats} showNames={showNames} onReset={onReset} onExplore={onExplore} />
          </motion.div>
        </AnimatePresence>
      </div>

      {isPaused && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold tracking-widest z-50 pointer-events-none animate-pulse">
          PAUSED
        </div>
      )}
    </div>
  );
};

// --- SLIDE COMPONENTS --- //

const SlideIntro = () => (
  <div className="text-center">
    <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-4 text-gradient">Your Instagram, <br/> wrapped.</h1>
    <p className="text-2xl font-bold text-white/50 mb-12">2026</p>
  </div>
);

const SlideTotal = ({ stats }: { stats: WrappedStats }) => (
  <div className="text-center max-w-lg">
    <p className="text-xl md:text-2xl text-white/60 font-bold mb-8 uppercase tracking-widest">First things first...</p>
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-[5rem] md:text-[8rem] font-black leading-none text-insta-pink mb-4">
      {stats.totalMessages.toLocaleString()}
    </motion.div>
    <p className="text-2xl md:text-4xl font-bold">messages exchanged</p>
  </div>
);

const SlideRatio = ({ stats }: { stats: WrappedStats }) => (
  <div className="w-full max-w-2xl px-6">
    <h2 className="text-3xl md:text-5xl font-black mb-16 text-center text-gradient">You had a lot to say.</h2>
    <div className="space-y-12">
      <div>
        <div className="flex justify-between text-2xl font-bold mb-4">
          <span className="text-white/70">Sent</span>
          <span>{stats.messagesSent.toLocaleString()}</span>
        </div>
        <div className="h-6 bg-white/10 rounded-full overflow-hidden shadow-inner">
          <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.messagesSent / stats.totalMessages) * 100}%` }} transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }} className="h-full bg-insta-pink" />
        </div>
      </div>
      <div>
        <div className="flex justify-between text-2xl font-bold mb-4">
          <span className="text-white/70">Received</span>
          <span>{stats.messagesReceived.toLocaleString()}</span>
        </div>
        <div className="h-6 bg-white/10 rounded-full overflow-hidden shadow-inner">
          <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.messagesReceived / stats.totalMessages) * 100}%` }} transition={{ duration: 1.5, delay: 0.8, ease: 'easeOut' }} className="h-full bg-insta-orange" />
        </div>
      </div>
    </div>
  </div>
);

const SlideMonth = ({ stats }: { stats: WrappedStats }) => (
  <div className="text-center">
    <p className="text-xl md:text-2xl text-white/60 font-bold mb-8 uppercase tracking-widest">Your most active month</p>
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: 'spring' }} className="text-6xl md:text-9xl font-black text-gradient">
      {stats.mostActiveMonth.month}
    </motion.div>
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-8 text-2xl font-bold text-white/70">
      {stats.mostActiveMonth.count.toLocaleString()} messages
    </motion.p>
  </div>
);

const formatHour = (h: number) => {
  if (h === 0) return '12 AM';
  if (h === 12) return '12 PM';
  return h > 12 ? `${h - 12} PM` : `${h} AM`;
};

const SlidePeak = ({ stats }: { stats: WrappedStats }) => (
  <div className="text-center">
    <p className="text-xl md:text-2xl text-white/60 font-bold mb-8 uppercase tracking-widest">When you were online</p>
    <div className="glass-card p-12 border-insta-purple/30">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-5xl md:text-7xl font-black mb-4">
        {stats.peakDayOfWeek}s
      </motion.div>
      <div className="text-2xl text-white/50 font-bold mb-2">at</div>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="text-6xl md:text-8xl font-black text-insta-pink">
        {formatHour(stats.peakHour)}
      </motion.div>
    </div>
  </div>
);

const SlideDensity = ({ stats, showNames }: any) => (
  <div className="text-center max-w-lg">
    <p className="text-xl text-white/60 font-bold mb-8 uppercase tracking-widest">The Rapid-Fire Session</p>
    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="glass-card p-10 border-red-500/30">
      <h2 className="text-6xl font-black mb-4">{stats.fastestDensity.messages} messages</h2>
      <p className="text-2xl font-bold text-white/70 mb-8">in under {stats.fastestDensity.minutes} minutes</p>
      <p className="text-xl font-medium">with <span className="text-insta-pink font-black">{showNames ? stats.fastestDensity.name : "Someone"}</span></p>
    </motion.div>
  </div>
);

const SlideStreak = ({ stats, showNames }: any) => (
  <div className="text-center">
    <p className="text-xl text-white/60 font-bold mb-12 uppercase tracking-widest">The Monologue</p>
    <h2 className="text-5xl md:text-7xl font-black mb-6">You sent <span className="text-gradient">{stats.longestStreak.count} messages</span> in a row.</h2>
    <p className="text-2xl font-bold text-white/70">To {showNames ? stats.longestStreak.name : "Someone"}.</p>
    <p className="mt-8 text-xl text-white/50 italic">They eventually replied. We hope.</p>
  </div>
);

const SlideComeback = ({ stats, showNames }: any) => (
  <div className="text-center max-w-lg">
    <p className="text-xl text-white/60 font-bold mb-12 uppercase tracking-widest">The Comeback</p>
    <h2 className="text-4xl md:text-6xl font-black mb-6">After <span className="text-insta-orange">{stats.comeback.gapDays} days</span> of silence...</h2>
    <p className="text-2xl font-bold text-white/70">You and {showNames ? stats.comeback.name : "Someone"} reconnected.</p>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-8 glass-card p-6 border-white/10">
      <p className="font-bold">{stats.comeback.returnMessages} messages since.</p>
    </motion.div>
  </div>
);

const SlideMidnight = ({ stats, showNames }: any) => (
  <div className="text-center">
    <p className="text-xl text-white/60 font-bold mb-8 uppercase tracking-widest">After Hours</p>
    <h2 className="text-4xl md:text-6xl font-black mb-12">Your favorite 3AM distraction:</h2>
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="text-6xl md:text-8xl font-black text-gradient">
      {showNames ? stats.midnightConnection.name : "Someone"}
    </motion.div>
    <p className="mt-8 text-2xl font-bold text-white/50">{stats.midnightConnection.count} midnight messages</p>
  </div>
);

const SlideConsistent = ({ stats, showNames }: any) => (
  <div className="text-center max-w-lg">
    <p className="text-xl text-white/60 font-bold mb-12 uppercase tracking-widest">The Daily Habit</p>
    <div className="glass-card p-10 border-insta-pink/30">
      <p className="text-2xl font-bold mb-6">You talked to</p>
      <h2 className="text-5xl font-black text-insta-pink mb-6">{showNames ? stats.consistentConnection.name : "Someone"}</h2>
      <p className="text-3xl font-black">{stats.consistentConnection.activeDays} <span className="text-xl text-white/70">different days this year.</span></p>
    </div>
  </div>
);

const SlideMedia = ({ stats }: any) => (
  <div className="text-center">
    <p className="text-xl text-white/60 font-bold mb-8 uppercase tracking-widest">Media Distribution</p>
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }} className="text-[6rem] md:text-[9rem] font-black text-insta-orange mb-4 leading-none">
      {stats.mediaShared.toLocaleString()}
    </motion.div>
    <p className="text-3xl font-bold text-white/70">reels, photos & posts shared</p>
  </div>
);

const SlideTop3 = ({ stats, showNames }: any) => (
  <div className="w-full max-w-md px-6">
    <h2 className="text-3xl md:text-5xl font-black mb-12 text-center text-gradient">Your Inner Circle.</h2>
    <div className="space-y-4">
      {stats.topConnections.slice(1, 4).map((conn: any, i: number) => (
        <motion.div key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 + (i * 0.2) }} className="glass-card p-6 flex items-center gap-6">
          <div className="text-3xl font-black text-white/30">#{i+2}</div>
          <div>
            <div className="text-2xl font-bold">{showNames ? conn.name : `Connection ${i+2}`}</div>
            <div className="text-insta-pink font-medium">{conn.messageCount.toLocaleString()} interactions</div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

const SlideTop1 = ({ stats, showNames }: any) => (
  <div className="text-center">
    <p className="text-xl md:text-2xl text-white/60 font-bold mb-12 uppercase tracking-widest">But your #1 was...</p>
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', delay: 1 }} className="glass-card p-12 md:p-20 border-white/20 relative">
      <div className="absolute -top-8 -right-8 w-16 h-16 bg-insta-orange rounded-full flex items-center justify-center font-black text-3xl shadow-xl rotate-12">#1</div>
      <h2 className="text-6xl md:text-9xl font-black mb-6 text-gradient">{showNames ? stats.topConnections[0]?.name : "Someone"}</h2>
      <p className="text-2xl text-white/70 font-medium">{stats.topConnections[0]?.messageCount.toLocaleString()} messages</p>
    </motion.div>
  </div>
);

const SlideArchetype = ({ stats }: any) => (
  <div className="text-center max-w-2xl px-6">
    <p className="text-xl text-white/60 font-bold mb-12 uppercase tracking-widest">Your 2026 Archetype</p>
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
      <h2 className="text-5xl md:text-7xl font-black text-gradient mb-8 leading-none">{stats.archetype.title}</h2>
      <p className="text-xl md:text-3xl text-white/80 leading-relaxed font-bold">{stats.archetype.description}</p>
    </motion.div>
  </div>
);

const SlideShare = ({ stats, showNames, onReset, onExplore }: any) => (
  <div className="w-full h-full flex flex-col items-center justify-center px-4 controls-layer">
    <ShareCard stats={stats} showNames={showNames} />
    
    <div className="mt-8 flex flex-col md:flex-row gap-4">
      <button onClick={onExplore} className="px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform flex items-center gap-2">
        <LayoutGrid className="w-5 h-5" /> Explore Data Dashboard
      </button>
      <button onClick={onReset} className="px-8 py-4 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 transition-colors">
        Start Over
      </button>
    </div>
  </div>
);

export default WrappedStory;
