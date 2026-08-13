import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import type { WrappedStats } from '../types/instagram';
import ShareCard from './ShareCard';
import ShareMenu from './ShareMenu';
import { LayoutGrid, Eye, EyeOff, Volume2, VolumeX, Share } from 'lucide-react';
import { shareElementAsImage } from '../utils/shareUtils';
interface SlideProps {
  stats: WrappedStats;
  showNames?: boolean;
  onReset?: () => void;
  onExplore?: () => void;
  onShareClick?: () => void;
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
    
    slides.push({ id: 'top5', component: SlideTop5 });
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
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [direction, setDirection] = useState(1);
  const [isSharingSlide, setIsSharingSlide] = useState(false);

  // Time tracking for progress bar
  const SLIDE_DURATION = 6000; // 6 seconds
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    if (currentSlide === TOTAL_SLIDES - 1) return; // Stop on last slide
    if (isPaused || showShareMenu) {
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
  }, [currentSlide, isPaused, showShareMenu]);

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
      setDirection(1);
      setCurrentSlide(p => p + 1);
      setProgress(0);
      triggerSlideEffects(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setDirection(-1);
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

  // Subtle Parallax Effect based on pointer movement (if desktop)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth - 0.5) * 20; // max 20px shift
    const y = (clientY / window.innerHeight - 0.5) * 20;
    setMousePos({ x, y });
  };

  return (
    <div 
      className="fixed inset-0 bg-[#020202] text-white select-none overflow-hidden touch-none"
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest('.controls-layer')) return;
        setIsPaused(true);
      }}
      onPointerUp={() => setIsPaused(false)}
      onPointerCancel={() => setIsPaused(false)}
      onContextMenu={(e) => e.preventDefault()}
      onMouseMove={handleMouseMove}
    >
      <AnimatePresence>
        {showShareMenu && (
          <ShareMenu stats={stats} onClose={() => setShowShareMenu(false)} />
        )}
      </AnimatePresence>
      
      {/* Background Ambience (Parallax) */}
      <motion.div 
        className="absolute inset-0 z-0"
        animate={{ x: mousePos.x, y: mousePos.y }}
        transition={{ type: 'spring', damping: 40, stiffness: 100 }}
      >
        <div className="absolute inset-0 bg-grain opacity-20 mix-blend-overlay" />
        <motion.div 
          animate={{ 
            background: [
              'radial-gradient(circle at 0% 0%, rgba(131,58,180,0.15) 0%, transparent 60%)',
              'radial-gradient(circle at 100% 100%, rgba(253,29,29,0.15) 0%, transparent 60%)',
              'radial-gradient(circle at 0% 100%, rgba(252,176,69,0.15) 0%, transparent 60%)',
              'radial-gradient(circle at 100% 0%, rgba(225,48,108,0.15) 0%, transparent 60%)'
            ]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0"
        />
      </motion.div>

      {/* Progress Bars (Top) */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-12 md:pt-8 z-50 flex gap-1.5 opacity-80 pointer-events-none controls-layer max-w-2xl mx-auto">
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

      {/* Controls (Top Left) */}
      <div className="absolute top-16 md:top-12 left-6 z-50 controls-layer">
        <button onClick={onReset} className="p-3 rounded-full bg-white/5 backdrop-blur-md hover:bg-white/10 transition-colors" title="Exit to Home">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      {/* Controls (Top Right) */}
      <div className="absolute top-16 md:top-12 right-6 z-50 flex gap-3 controls-layer">
        <button onClick={() => setShowShareMenu(true)} className="p-3 rounded-full bg-white/5 backdrop-blur-md hover:bg-white/10 transition-colors text-white/80 hover:text-white" title="Share Wrapped">
          <Share className="w-5 h-5" />
        </button>
        <button onClick={onExplore} className="p-3 rounded-full bg-white/5 backdrop-blur-md hover:bg-white/10 transition-colors text-white/80 hover:text-white" title="Explore Data">
          <LayoutGrid className="w-5 h-5" />
        </button>
        <button onClick={() => setShowNames(!showNames)} className="p-3 rounded-full bg-white/5 backdrop-blur-md hover:bg-white/10 transition-colors text-white/80 hover:text-white">
          {showNames ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5 text-white/40" />}
        </button>
        <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-3 rounded-full bg-white/5 backdrop-blur-md hover:bg-white/10 transition-colors text-white/80 hover:text-white hidden md:block">
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-white/40" />}
        </button>
      </div>

      {/* Share to Story Button (Bottom Center) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 controls-layer">
        <button 
          onClick={async (e) => {
            e.stopPropagation();
            setIsPaused(true);
            setIsSharingSlide(true);
            await shareElementAsImage('slide-capture-zone');
            setIsSharingSlide(false);
            setIsPaused(false);
          }} 
          className="px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors text-white/80 hover:text-white flex items-center gap-2 text-sm font-medium border border-white/5"
        >
          {isSharingSlide ? <span className="animate-pulse">Capturing...</span> : (
            <>
              <Share className="w-4 h-4" /> Share to Story
            </>
          )}
        </button>
      </div>

      {/* Slide Content Area */}
      <div 
        className="absolute inset-0 flex items-center justify-center z-10"
        onClick={handleTap}
      >
        <div id="slide-capture-zone" className="absolute inset-0 flex items-center justify-center pointer-events-none bg-transparent">
          <AnimatePresence mode="popLayout" custom={direction}>
            <motion.div
              key={currentSlide}
              custom={direction}
              initial={{ opacity: 0, x: direction * 50, filter: 'blur(10px)', scale: 0.95 }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)', scale: 1 }}
              exit={{ opacity: 0, x: direction * -50, filter: 'blur(10px)', scale: 1.05 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={`w-full h-full flex flex-col items-center justify-center p-6 pointer-events-auto transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isPaused && !isSharingSlide ? 'scale-[0.96] opacity-90' : 'scale-100'}`}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, { offset, velocity }) => {
                const swipe = offset.x;
                if (swipe < -50 || velocity.x < -500) nextSlide();
                else if (swipe > 50 || velocity.x > 500) prevSlide();
              }}
            >
              {/* Slide Midground Parallax */}
              <motion.div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                animate={{ x: mousePos.x * 0.5, y: mousePos.y * 0.5 }}
                transition={{ type: 'spring', damping: 40, stiffness: 100 }}
              >
                <CurrentSlideComponent stats={stats} showNames={showNames} onExplore={onExplore} onShareClick={() => setShowShareMenu(true)} />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// --- SLIDE COMPONENTS --- //
// Every slide follows the "Less UI, More Experience" principle. High contrast typography. Staged reveals.

const SlideIntro = () => (
  <div className="text-center">
    <motion.h1 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="text-6xl md:text-[8rem] font-bold tracking-tighter mb-4 leading-none"
    >
      Your Instagram, <br/> wrapped.
    </motion.h1>
    <motion.p 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 1 }}
      className="text-3xl font-bold text-white/30 tracking-widest"
    >
      2026
    </motion.p>
  </div>
);

const SlideTotal = ({ stats }: { stats: WrappedStats }) => (
  <div className="text-center">
    <motion.p 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="text-xl md:text-3xl text-white/40 font-medium mb-8"
    >
      First things first...
    </motion.p>
    <motion.div 
      initial={{ y: 20, opacity: 0, filter: 'blur(10px)' }} 
      animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }} 
      transition={{ delay: 1, duration: 1.5, ease: [0.16, 1, 0.3, 1] }} 
      className="text-[6rem] md:text-[12rem] font-bold leading-none tracking-tighter drop-shadow-2xl mb-4"
    >
      {stats.totalMessages.toLocaleString()}
    </motion.div>
    <motion.p 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5, duration: 1 }}
      className="text-3xl md:text-5xl font-medium text-white/60 tracking-tight"
    >
      messages exchanged
    </motion.p>
  </div>
);

const SlideRatio = ({ stats }: { stats: WrappedStats }) => {
  const sentPercent = (stats.messagesSent / stats.totalMessages) * 100;
  const receivedPercent = (stats.messagesReceived / stats.totalMessages) * 100;
  
  return (
    <div className="w-full max-w-4xl px-8 flex flex-col justify-center h-full">
      <h2 className="text-4xl md:text-6xl font-bold mb-32 tracking-tighter">You had a lot to say.</h2>
      
      <div className="space-y-16">
        <div>
          <div className="flex justify-between text-2xl font-bold mb-6">
            <span className="text-white/40">Sent</span>
            <span>{stats.messagesSent.toLocaleString()}</span>
          </div>
          <div className="h-1 bg-white/5 w-full relative">
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${sentPercent}%` }} 
              transition={{ duration: 2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }} 
              className="absolute top-0 left-0 h-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]" 
            />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-2xl font-bold mb-6">
            <span className="text-white/40">Received</span>
            <span>{stats.messagesReceived.toLocaleString()}</span>
          </div>
          <div className="h-1 bg-white/5 w-full relative">
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${receivedPercent}%` }} 
              transition={{ duration: 2, delay: 0.8, ease: [0.16, 1, 0.3, 1] }} 
              className="absolute top-0 left-0 h-full bg-white/40" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const SlideMonth = ({ stats }: { stats: WrappedStats }) => (
  <div className="text-center">
    <p className="text-2xl text-white/40 font-medium mb-12">Your most active month</p>
    <motion.div 
      initial={{ scale: 0.9, opacity: 0, filter: 'blur(20px)' }} 
      animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }} 
      transition={{ delay: 0.5, duration: 1.5, ease: [0.16, 1, 0.3, 1] }} 
      className="text-[7rem] md:text-[14rem] font-bold tracking-tighter leading-none"
    >
      {stats.mostActiveMonth.month}
    </motion.div>
    <motion.p 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ delay: 1.5, duration: 1 }} 
      className="mt-12 text-3xl font-medium text-white/50"
    >
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
  <div className="text-center flex flex-col items-center">
    <p className="text-2xl text-white/40 font-medium mb-16">When you were online</p>
    
    <div className="relative w-80 h-80 md:w-96 md:h-96 flex items-center justify-center">
      {/* Abstract Clock/Time visualization */}
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 4" />
      </svg>
      
      <div className="z-10 flex flex-col items-center">
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.5, duration: 1 }} 
          className="text-4xl md:text-5xl font-bold text-white/60 mb-2"
        >
          {stats.peakDayOfWeek}s
        </motion.div>
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          transition={{ delay: 1, duration: 1.5, ease: [0.16, 1, 0.3, 1] }} 
          className="text-7xl md:text-9xl font-bold tracking-tighter"
        >
          {formatHour(stats.peakHour)}
        </motion.div>
      </div>
    </div>
  </div>
);

const SlideDensity = ({ stats, showNames }: any) => (
  <div className="text-center max-w-4xl px-8">
    <p className="text-2xl text-white/40 font-medium mb-16">The Rapid-Fire Session</p>
    <motion.h2 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="text-7xl md:text-9xl font-bold tracking-tighter mb-8 leading-none"
    >
      {stats.fastestDensity.messages} msgs
    </motion.h2>
    <motion.p 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2 }}
      className="text-4xl md:text-5xl font-medium text-white/60 mb-12 tracking-tight"
    >
      in under {stats.fastestDensity.minutes} minutes
    </motion.p>
    <motion.p 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2 }}
      className="text-3xl font-medium text-white/30"
    >
      with <span className="text-white">{showNames ? stats.fastestDensity.name : "Someone"}</span>
    </motion.p>
  </div>
);

const SlideStreak = ({ stats, showNames }: any) => (
  <div className="text-center max-w-4xl px-8">
    <p className="text-2xl text-white/40 font-medium mb-16">The Monologue</p>
    <motion.h2 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }}
      className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 leading-tight"
    >
      You sent <br/>
      <span className="text-[6rem] md:text-[9rem] block mt-4">{stats.longestStreak.count}</span> <br/>
      messages in a row.
    </motion.h2>
    <motion.p 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
      className="text-2xl text-white/40 font-medium mt-12"
    >
      To {showNames ? stats.longestStreak.name : "Someone"}. They eventually replied.
    </motion.p>
  </div>
);

const SlideComeback = ({ stats, showNames }: any) => (
  <div className="text-center max-w-4xl px-8">
    <p className="text-2xl text-white/40 font-medium mb-16">The Comeback</p>
    <motion.h2 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }}
      className="text-4xl md:text-6xl font-bold tracking-tighter mb-12 leading-tight text-white/60"
    >
      After <span className="text-white">{stats.comeback.gapDays} days</span> of silence...
    </motion.h2>
    <motion.p 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}
      className="text-5xl md:text-7xl font-bold tracking-tighter"
    >
      You and {showNames ? stats.comeback.name : "Someone"} <br/> reconnected.
    </motion.p>
  </div>
);

const SlideMidnight = ({ stats, showNames }: any) => (
  <div className="text-center">
    <p className="text-2xl text-white/40 font-medium mb-16">After Hours</p>
    <motion.h2 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
      className="text-4xl md:text-5xl font-medium tracking-tight mb-8 text-white/60"
    >
      Your favorite late-night distraction:
    </motion.h2>
    <motion.div 
      initial={{ y: 20, opacity: 0, filter: 'blur(10px)' }} 
      animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }} 
      transition={{ delay: 1.5, duration: 1.5, ease: [0.16, 1, 0.3, 1] }} 
      className="text-[5rem] md:text-[8rem] font-bold tracking-tighter leading-none"
    >
      {showNames ? stats.midnightConnection.name : "Someone"}
    </motion.div>
  </div>
);

const SlideConsistent = ({ stats, showNames }: any) => (
  <div className="text-center max-w-4xl px-8">
    <p className="text-2xl text-white/40 font-medium mb-16">The Daily Habit</p>
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-3xl font-medium text-white/60 mb-6">
      You talked to
    </motion.p>
    <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="text-6xl md:text-8xl font-bold tracking-tighter mb-16">
      {showNames ? stats.consistentConnection.name : "Someone"}
    </motion.h2>
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="text-4xl md:text-5xl font-medium text-white/40 tracking-tight">
      <span className="text-white">{stats.consistentConnection.activeDays}</span> different days this year.
    </motion.p>
  </div>
);

const SlideMedia = ({ stats }: any) => (
  <div className="text-center">
    <p className="text-2xl text-white/40 font-medium mb-12">Media Distribution</p>
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }} 
      animate={{ scale: 1, opacity: 1 }} 
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 }} 
      className="text-[7rem] md:text-[12rem] font-bold tracking-tighter leading-none mb-8"
    >
      {stats.mediaShared.toLocaleString()}
    </motion.div>
    <motion.p 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
      className="text-3xl md:text-5xl font-medium text-white/50 tracking-tight"
    >
      photos & videos shared
    </motion.p>
  </div>
);

// Vertical Cascade for Top 5
const SlideTop5 = ({ stats, showNames }: any) => (
  <div className="w-full max-w-3xl px-8 flex flex-col h-full justify-center">
    <h2 className="text-4xl md:text-6xl font-bold mb-16 tracking-tighter">Your Inner Circle.</h2>
    <div className="space-y-8">
      {stats.topConnections.slice(1, 5).reverse().map((conn: any, i: number) => {
        const rank = 5 - i;
        return (
          <motion.div 
            key={i} 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 0.5 + (i * 0.4), duration: 0.8, ease: [0.16, 1, 0.3, 1] }} 
            className="flex items-baseline gap-6 border-b border-white/5 pb-6"
          >
            <div className="text-2xl font-bold text-white/20">0{rank}</div>
            <div className="text-3xl md:text-5xl font-bold tracking-tight truncate flex-1">
              {showNames ? conn.name : `Connection ${rank}`}
            </div>
            <div className="text-xl md:text-2xl font-medium text-white/40">
              {conn.messageCount.toLocaleString()}
            </div>
          </motion.div>
        );
      })}
    </div>
  </div>
);

const SlideTop1 = ({ stats, showNames }: any) => (
  <div className="text-center w-full px-4">
    <motion.p 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
      className="text-2xl text-white/40 font-medium mb-16"
    >
      But your #1 was...
    </motion.p>
    
    <motion.div 
      initial={{ scale: 0.9, opacity: 0, filter: 'blur(20px)' }} 
      animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }} 
      transition={{ delay: 2, duration: 1.5, ease: [0.16, 1, 0.3, 1] }} 
      className="relative"
    >
      <h2 className="text-[5rem] md:text-[10rem] font-bold tracking-tighter mb-8 leading-none drop-shadow-2xl max-w-full break-words">
        {showNames ? stats.topConnections[0]?.name : "Someone"}
      </h2>
    </motion.div>

    <motion.p 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.5 }}
      className="text-3xl md:text-5xl text-white/60 font-medium tracking-tight"
    >
      {stats.topConnections[0]?.messageCount.toLocaleString()} messages
    </motion.p>
  </div>
);

const SlideArchetype = ({ stats }: any) => (
  <div className="text-center max-w-4xl px-8">
    <p className="text-2xl text-white/40 font-medium mb-16">Your 2026 Archetype</p>
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}>
      <h2 className="text-[4rem] md:text-[7rem] font-bold tracking-tighter leading-none mb-12 drop-shadow-2xl">
        {stats.archetype.title}
      </h2>
      <p className="text-2xl md:text-4xl text-white/50 leading-snug font-medium">
        {stats.archetype.description}
      </p>
    </motion.div>
  </div>
);

const SlideShare = ({ stats, showNames, onExplore, onShareClick }: any) => (
  <div className="w-full h-full flex flex-col items-center justify-center px-4 py-12 overflow-y-auto hide-scrollbar controls-layer">
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="text-center mb-12 shrink-0 mt-8"
    >
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">Your Wrapped is ready.</h2>
    </motion.div>

    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="shrink-0 mb-12"
    >
      <ShareCard stats={stats} showNames={showNames} />
    </motion.div>
    
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
      className="flex flex-col md:flex-row gap-4 shrink-0 mb-8 w-full max-w-2xl justify-center"
    >
      <button onClick={onShareClick} className="px-8 py-5 bg-white text-black font-bold text-lg rounded-full active:scale-95 transition-transform flex items-center justify-center gap-3 spatial-shadow">
        <Share className="w-6 h-6" /> Share Link
      </button>
      <button onClick={onExplore} className="px-8 py-5 bg-white/10 text-white font-bold text-lg rounded-full active:scale-95 transition-transform hover:bg-white/20 flex items-center justify-center gap-3">
        <LayoutGrid className="w-6 h-6" /> Explore Dashboard
      </button>
    </motion.div>
  </div>
);

export default WrappedStory;
