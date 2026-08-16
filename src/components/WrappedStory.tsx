import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import type { WrappedStats } from '../types/instagram';
import ShareCard from './ShareCard';
import ShareMenu from './ShareMenu';
import { VideoModal } from './VideoModal';
import { LayoutGrid, Eye, EyeOff, Volume2, VolumeX, Share, Film, RotateCcw, Sparkles } from 'lucide-react';
import { shareElementAsImage } from '../utils/shareUtils';
import { SlideSocialCircle, SlideCalendar, SlideStreak as SlideAdvancedStreak, SlideMonthly } from './WrappedStoryAdvancedSlides';

const SLIDE_THEMES = [
  '#3B5998', // 0: Intro (Royal Blue)
  '#E1306C', // 1: Total (Vibrant Pink)
  '#833AB4', // 2: Social Circle (Deep Purple)
  '#00897B', // 3: Top 1 (Teal)
  '#F56040', // 4: Top 5 (Orange)
  '#C13584', // 5: Calendar (Magenta)
  '#E53935', // 6: Peak (Red)
  '#5851DB', // 7: Streak (Indigo)
  '#4A154B', // 8: Monthly (Rich Plum)
  '#D81B60', // 10: Archetype (Crimson)
  '#1B0C2E'  // 11: Share/End (Deep Cosmic Purple with glow)
];

const SLIDE_MARQUEES = [
  'INSTA WRAPPED 2026',
  'TOTAL MESSAGES SENT',
  'YOUR SOCIAL CIRCLE',
  'YOUR TOP CONNECTION',
  'TOP FRIENDS',
  'SOCIAL CALENDAR',
  'PEAK ACTIVITY',
  'LONGEST STREAK',
  'MONTH BY MONTH',
  'YOUR ARCHETYPE',
  'YOUR WRAPPED IS READY'
];

const ScrollingMarquee = ({ text }: { text: string }) => {
  if (!text) return null;
  return (
    <div className="absolute inset-0 overflow-hidden flex flex-col justify-center opacity-[0.07] pointer-events-none select-none z-0 mix-blend-overlay">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="whitespace-nowrap font-black text-[15vw] uppercase leading-[0.85] tracking-tighter"
          initial={{ x: i % 2 === 0 ? '0%' : '-50%' }}
          animate={{ x: i % 2 === 0 ? '-50%' : '0%' }}
          transition={{ duration: 25 + i * 2, repeat: Infinity, ease: 'linear' }}
        >
          {text} � {text} � {text} � {text} � {text} � {text}
        </motion.div>
      ))}
    </div>
  );
};

const GeometricMotifs = () => (
  <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-30 mix-blend-overlay">
    <motion.div 
      className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-white blur-3xl"
      animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
    />
    <motion.div 
      className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-black blur-3xl"
      animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }}
      transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
    />
  </div>
);

interface SlideProps {
  stats: WrappedStats;
  showNames?: boolean;
  onReset?: () => void;
  onExplore?: () => void;
  onShareClick?: () => void;
  onDownloadVideoClick?: () => void;
  onReplay?: () => void;
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
      { id: 'social_circle', component: SlideSocialCircle },
      { id: 'top1', component: SlideTop1 },
      { id: 'top5', component: SlideTop5 },
      { id: 'calendar', component: SlideCalendar },
      { id: 'peak', component: SlidePeak },
    ];
    
    if (stats.longestDayStreak) slides.push({ id: 'streak', component: SlideAdvancedStreak });
    if (stats.monthlyTopConnections?.length > 0) slides.push({ id: 'monthly', component: SlideMonthly });
    
    
    // Optional extra density/midnight slides
    if (stats.fastestDensity) slides.push({ id: 'density', component: SlideDensity });
    if (stats.midnightConnection) slides.push({ id: 'midnight', component: SlideMidnight });
    
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
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [direction, setDirection] = useState(1);
  const [isSharingSlide, setIsSharingSlide] = useState(false);

  // Time tracking for progress bar
  const SLIDE_DURATION = 6000; // 6 seconds
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    if (currentSlide === TOTAL_SLIDES - 1) return; // Stop timer on last slide
    if (isPaused || showShareMenu || showVideoModal) {
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
          return 0;
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
  }, [currentSlide, isPaused, showShareMenu, showVideoModal]);

  // Keyboard Navigation
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

  const replayWrapped = () => {
    setDirection(-1);
    setCurrentSlide(0);
    setProgress(0);
  };

  const triggerSlideEffects = (slideIndex: number) => {
    const slideId = slides[slideIndex]?.id;
    if (slideId === 'top1' || slideId === 'archetype' || slideId === 'share') {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#833ab4', '#fd1d1d', '#fcb045', '#e1306c', '#405de6'],
        zIndex: 100
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
    if (isPaused || currentSlide === TOTAL_SLIDES - 1) return;
    const clickX = e.clientX;
    const width = window.innerWidth;
    if (clickX < width * 0.3) {
      prevSlide();
    } else {
      nextSlide();
    }
  };

  const CurrentSlideComponent = slides[currentSlide].component;
  const isFinalSlide = currentSlide === TOTAL_SLIDES - 1;

  // Subtle Parallax Effect on desktop
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth - 0.5) * 20;
    const y = (clientY / window.innerHeight - 0.5) * 20;
    setMousePos({ x, y });
  };

  return (
    <motion.div 
      className="fixed inset-0 text-white select-none overflow-hidden touch-none"
      animate={{ backgroundColor: SLIDE_THEMES[currentSlide % SLIDE_THEMES.length] }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest('.controls-layer')) return;
        if (!isFinalSlide) setIsPaused(true);
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
        {showVideoModal && (
          <VideoModal stats={stats} showNames={showNames} onClose={() => setShowVideoModal(false)} />
        )}
      </AnimatePresence>
      
      {/* Dynamic Background Ambience */}
      <motion.div 
        className="absolute inset-0 z-0"
        animate={{ x: mousePos.x, y: mousePos.y }}
        transition={{ type: 'spring', damping: 40, stiffness: 100 }}
      >
        <div className="absolute inset-0 bg-grain opacity-25 mix-blend-overlay" />
        <GeometricMotifs />
        <ScrollingMarquee text={SLIDE_MARQUEES[currentSlide % SLIDE_MARQUEES.length]} />
      </motion.div>

      {/* Progress Bars (Top) */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-10 md:pt-6 z-50 flex gap-1.5 opacity-85 pointer-events-none controls-layer max-w-2xl mx-auto">
        {slides.map((_, i) => (
          <div key={i} className={`progress-segment ${i === currentSlide && isPaused ? 'opacity-50' : ''}`}>
            {i < currentSlide && <div className="progress-segment-fill w-full" />}
            {i === currentSlide && (
              <div 
                className="progress-segment-fill"
                style={{ width: `${isFinalSlide ? 100 : progress}%` }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Controls (Top Left) */}
      <div className="absolute top-14 md:top-10 left-5 z-50 controls-layer">
        <button 
          onClick={onReset} 
          className="p-2.5 md:p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors text-white/90" 
          title="Exit to Home"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      {/* Controls (Top Right) */}
      <div className="absolute top-14 md:top-10 right-5 z-50 flex gap-2.5 controls-layer">
        <button 
          onClick={() => setShowShareMenu(true)} 
          className="p-2.5 md:p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors text-white/90" 
          title="Share Wrapped"
        >
          <Share className="w-4 h-4 md:w-5 md:h-5" />
        </button>
        <button 
          onClick={onExplore} 
          className="p-2.5 md:p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors text-white/90" 
          title="Explore Data"
        >
          <LayoutGrid className="w-4 h-4 md:w-5 md:h-5" />
        </button>
        <button 
          onClick={() => setShowNames(!showNames)} 
          className="p-2.5 md:p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors text-white/90"
        >
          {showNames ? <Eye className="w-4 h-4 md:w-5 md:h-5" /> : <EyeOff className="w-4 h-4 md:w-5 md:h-5 text-white/40" />}
        </button>
        <button 
          onClick={() => setSoundEnabled(!soundEnabled)} 
          className="p-2.5 md:p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors text-white/90 hidden md:block"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 md:w-5 md:h-5" /> : <VolumeX className="w-4 h-4 md:w-5 md:h-5 text-white/40" />}
        </button>
      </div>

      {/* Share to Story Button (Bottom Center) - Only on regular slides */}
      {!isFinalSlide && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 controls-layer">
          <button 
            onClick={async (e) => {
              e.stopPropagation();
              setIsPaused(true);
              setIsSharingSlide(true);
              await shareElementAsImage('slide-capture-zone');
              setIsSharingSlide(false);
              setIsPaused(false);
            }} 
            className="px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors text-white/90 flex items-center gap-2 text-xs md:text-sm font-semibold border border-white/10 shadow-lg"
          >
            {isSharingSlide ? <span className="animate-pulse">Capturing...</span> : (
              <>
                <Share className="w-3.5 h-3.5" /> Share to Story
              </>
            )}
          </button>
        </div>
      )}

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
              initial={{ opacity: 0, x: direction * 50, filter: 'blur(5px)', scale: 0.9 }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)', scale: 1 }}
              exit={{ opacity: 0, x: direction * -50, filter: 'blur(5px)', scale: 1.1 }}
              transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
              className={`w-full h-full flex flex-col items-center justify-center p-4 md:p-6 pointer-events-auto transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${isPaused && !isSharingSlide && !isFinalSlide ? 'scale-[0.98] opacity-90' : 'scale-100'}`}
              drag={isFinalSlide ? false : "x"}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, { offset, velocity }) => {
                if (isFinalSlide) return;
                const swipe = offset.x;
                if (swipe < -50 || velocity.x < -500) nextSlide();
                else if (swipe > 50 || velocity.x > 500) prevSlide();
              }}
            >
              {/* Slide Midground Parallax */}
              <motion.div 
                className="w-full h-full flex items-center justify-center pointer-events-none"
                animate={{ x: mousePos.x * 0.5, y: mousePos.y * 0.5 }}
                transition={{ type: 'spring', damping: 40, stiffness: 100 }}
              >
                <div className="w-full h-full flex items-center justify-center pointer-events-auto">
                  <CurrentSlideComponent 
                    stats={stats} 
                    showNames={showNames} 
                    onExplore={onExplore} 
                    onShareClick={() => setShowShareMenu(true)} 
                    onDownloadVideoClick={() => setShowVideoModal(true)}
                    onReplay={replayWrapped}
                  />
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// --- SLIDE COMPONENTS --- //

const SlideIntro = () => (
  <div className="text-center px-4">
    <motion.h1 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter mb-3 sm:mb-4 leading-tight text-white break-words"
    >
      Your Instagram, <br/> wrapped.
    </motion.h1>
    <motion.p 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8, duration: 1 }}
      className="text-2xl md:text-3xl font-extrabold text-white/40 tracking-widest uppercase"
    >
      2026 Edition
    </motion.p>
  </div>
);

const SlideTotal = ({ stats }: { stats: WrappedStats }) => (
  <div className="text-center px-4">
    <motion.p 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="text-lg md:text-2xl text-white/50 font-medium mb-6"
    >
      First things first...
    </motion.p>
    <motion.div 
      initial={{ y: 20, opacity: 0, filter: 'blur(10px)' }} 
      animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }} 
      transition={{ delay: 0.5, duration: 1.2, ease: [0.16, 1, 0.3, 1] }} 
      className="text-4xl sm:text-6xl md:text-8xl lg:text-[9rem] font-black leading-none tracking-tighter drop-shadow-2xl mb-3 text-white break-all max-w-full"
    >
      {stats.totalMessages.toLocaleString()}
    </motion.div>
    <motion.p 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 0.8 }}
      className="text-xl sm:text-2xl md:text-4xl font-bold text-white/70 tracking-tight"
    >
      messages exchanged
    </motion.p>
  </div>
);

const formatHour = (h: number) => {
  if (h === 0) return '12 AM';
  if (h === 12) return '12 PM';
  return h > 12 ? `${h - 12} PM` : `${h} AM`;
};

const SlidePeak = ({ stats }: { stats: WrappedStats }) => (
  <div className="text-center flex flex-col items-center px-4">
    <p className="text-xs md:text-sm font-bold tracking-[0.25em] text-white/50 uppercase mb-8">Peak Activity</p>
    
    <div className="relative w-72 h-72 md:w-88 md:h-88 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" />
      </svg>
      
      <div className="z-10 flex flex-col items-center">
        <motion.div 
          initial={{ y: 15, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.3, duration: 0.8 }} 
          className="text-3xl md:text-4xl font-black text-white/70 mb-1"
        >
          {stats.peakDayOfWeek}s
        </motion.div>
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          transition={{ delay: 0.6, duration: 1, ease: [0.16, 1, 0.3, 1] }} 
          className="text-6xl md:text-8xl font-black tracking-tighter text-white"
        >
          {formatHour(stats.peakHour)}
        </motion.div>
      </div>
    </div>
  </div>
);

const SlideDensity = ({ stats, showNames }: any) => (
  <div className="text-center max-w-xl px-6">
    <p className="text-xs md:text-sm font-bold tracking-[0.25em] text-white/50 uppercase mb-8">Rapid-Fire Session</p>
    <motion.h2 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="text-6xl md:text-8xl font-black tracking-tighter mb-4 leading-none text-white"
    >
      {stats.fastestDensity.messages} msgs
    </motion.h2>
    <motion.p 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
      className="text-2xl md:text-4xl font-bold text-white/70 mb-8 tracking-tight"
    >
      in under {stats.fastestDensity.minutes} minutes
    </motion.p>
    <motion.p 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.1 }}
      className="text-lg md:text-2xl font-semibold text-white/40"
    >
      with <span className="text-white font-bold">{showNames ? stats.fastestDensity.name : "Someone"}</span>
    </motion.p>
  </div>
);

const SlideMidnight = ({ stats, showNames }: any) => (
  <div className="text-center px-6 max-w-xl">
    <p className="text-xs md:text-sm font-bold tracking-[0.25em] text-white/50 uppercase mb-6">After Hours</p>
    <motion.h2 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
      className="text-2xl md:text-3xl font-bold tracking-tight mb-6 text-white/70"
    >
      Your late-night distraction:
    </motion.h2>
    <motion.div 
      initial={{ y: 20, opacity: 0, filter: 'blur(10px)' }} 
      animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }} 
      transition={{ delay: 0.8, duration: 1.2, ease: [0.16, 1, 0.3, 1] }} 
      className="text-4xl md:text-6xl font-black tracking-tighter leading-none text-white"
    >
      {showNames ? stats.midnightConnection.name : "Someone"}
    </motion.div>
  </div>
);

const SlideTop5 = ({ stats, showNames }: any) => (
  <div className="w-full max-w-lg px-4 md:px-8 flex flex-col h-full justify-center py-8 mx-auto">
    <div className="text-center mb-8">
      <p className="text-xs md:text-sm font-bold tracking-[0.25em] text-white/50 uppercase mb-1">Inner Circle</p>
      <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter text-white">Your Top Friends</h2>
    </div>

    <div className="space-y-3">
      {stats.topConnections.slice(0, 5).map((conn: any, i: number) => (
        <motion.div 
          key={conn.name} 
          initial={{ y: 15, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.2 + (i * 0.08), duration: 0.6 }} 
          className="flex items-center justify-between p-3.5 md:p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md"
        >
          <div className="flex items-center gap-3 md:gap-4 truncate mr-2">
            <span className="text-lg md:text-xl font-black text-white/30">0{i + 1}</span>
            <span className="text-sm sm:text-base md:text-xl font-bold tracking-tight truncate text-white max-w-[150px] sm:max-w-[200px]">
              {showNames ? conn.name : `Friend ${i + 1}`}
            </span>
          </div>
          <span className="text-xs md:text-sm font-semibold text-white/70 whitespace-nowrap bg-white/10 px-3 py-1 rounded-full">
            {conn.messageCount.toLocaleString()} msgs
          </span>
        </motion.div>
      ))}
    </div>
  </div>
);

const SlideTop1 = ({ stats, showNames }: any) => (
  <div className="text-center w-full px-4 max-w-xl mx-auto flex flex-col justify-center h-full py-8">
    <motion.p 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
      className="text-xs md:text-sm font-bold tracking-[0.25em] text-white/50 uppercase mb-4"
    >
      The Undisputed #1
    </motion.p>
    
    <motion.div 
      initial={{ scale: 0.85, opacity: 0, filter: 'blur(15px)' }} 
      animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }} 
      transition={{ delay: 0.8, duration: 1.2, ease: [0.16, 1, 0.3, 1] }} 
      className="relative mb-6"
    >
      <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter text-white break-words line-clamp-2 max-w-full px-2">
        {showNames ? (stats.topConnections[0]?.name || "Someone") : "Your Best Friend"}
      </h2>
    </motion.div>

    <motion.p 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}
      className="text-xl sm:text-2xl md:text-4xl text-white/80 font-extrabold tracking-tight mt-1"
    >
      {stats.topConnections[0]?.messageCount.toLocaleString()} messages
    </motion.p>
  </div>
);

const SlideArchetype = ({ stats }: any) => (
  <div className="text-center max-w-xl px-6 flex flex-col justify-center h-full mx-auto py-8">
    <p className="text-xs md:text-sm font-bold tracking-[0.25em] text-white/50 uppercase mb-4">Your 2026 Personality</p>
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}>
      <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter leading-tight mb-3 drop-shadow-2xl text-white break-words">
        {stats.archetype.title}
      </h2>
      <p className="text-sm sm:text-base md:text-xl text-white/70 leading-relaxed font-medium break-words px-2 max-w-md mx-auto">
        {stats.archetype.description}
      </p>
    </motion.div>
  </div>
);

// --- REDESIGNED FINAL WRAPPED PAGE --- //
const SlideShare = ({ stats, showNames, onExplore, onShareClick, onDownloadVideoClick, onReplay }: SlideProps) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-between px-4 pt-14 pb-6 md:py-12 overflow-y-auto hide-scrollbar controls-layer max-w-md mx-auto">
      {/* 1. Header (Fades in first) */}
      <motion.div 
        initial={{ opacity: 0, y: -15 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mt-2 md:mt-4 shrink-0"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] md:text-xs font-bold tracking-widest text-white/80 uppercase mb-2">
          <Sparkles className="w-3 h-3 text-insta-yellow" /> Complete
        </div>
        <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-white uppercase">
          YOUR WRAPPED IS READY.
        </h2>
        <p className="text-xs md:text-sm font-medium text-white/50 mt-0.5">
          That was your Instagram, wrapped.
        </p>
      </motion.div>

      {/* 2. Visual Centerpiece Preview Card (Smooth scale & glow entrance) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.92, y: 15 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        transition={{ delay: 0.25, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative my-auto shrink-0 group cursor-pointer"
        onClick={onDownloadVideoClick}
      >
        <div className="relative rounded-3xl transition-transform duration-300 group-hover:scale-[1.02] shadow-[0_15px_45px_rgba(0,0,0,0.6)]">
          <ShareCard stats={stats} showNames={showNames} />

          {/* Hover / Touch Action Overlay */}
          <div className="absolute inset-0 bg-black/30 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
            <div className="p-4 rounded-full bg-white text-black shadow-2xl scale-95 group-hover:scale-100 transition-transform">
              <Film className="w-7 h-7 fill-black" />
            </div>
            <span className="text-xs font-black tracking-wider uppercase text-white bg-black/60 px-3 py-1 rounded-full">
              Click to Export Video
            </span>
          </div>
        </div>
      </motion.div>
      
      {/* 3. Action Hierarchy (Download > Share > Replay/Explore) */}
      <div className="w-full flex flex-col gap-2.5 shrink-0 mb-2">
        {/* PRIMARY CTA: Download Video */}
        <motion.button 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.45, duration: 0.6 }}
          onClick={onDownloadVideoClick} 
          className="w-full py-3.5 md:py-4 px-6 bg-gradient-to-r from-insta-pink via-red-500 to-insta-orange text-white font-black text-sm md:text-base rounded-full active:scale-95 transition-all flex items-center justify-center gap-2.5 shadow-[0_8px_30px_rgba(225,48,108,0.45)] hover:shadow-[0_8px_40px_rgba(225,48,108,0.65)]"
        >
          <Film className="w-4 h-4 md:w-5 md:h-5" /> Download Wrapped ??
        </motion.button>

        {/* SECONDARY CTA: Share Link */}
        <motion.button 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.6, duration: 0.6 }}
          onClick={onShareClick} 
          className="w-full py-3 md:py-3.5 px-6 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs md:text-sm rounded-full active:scale-95 transition-all flex items-center justify-center gap-2 backdrop-blur-md"
        >
          <Share className="w-4 h-4" /> Share Wrapped ?
        </motion.button>

        {/* TERTIARY ACTIONS: Subtle Row */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.75, duration: 0.6 }}
          className="flex items-center justify-center gap-5 pt-1 text-xs text-white/50 font-semibold"
        >
          <button 
            onClick={onReplay}
            className="hover:text-white transition-colors flex items-center gap-1.5 py-1 px-2"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Replay
          </button>

          <span className="text-white/20">�</span>

          <button 
            onClick={onExplore}
            className="hover:text-white transition-colors flex items-center gap-1.5 py-1 px-2"
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Explore Data
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default WrappedStory;
