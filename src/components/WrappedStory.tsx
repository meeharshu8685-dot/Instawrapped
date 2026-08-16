import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import type { WrappedStats } from '../types/instagram';
import ShareCard from './ShareCard';
import ShareMenu from './ShareMenu';
import { LayoutGrid, Eye, EyeOff, Volume2, VolumeX, Share2, RotateCcw, Sparkles, Download, ArrowRight, Heart } from 'lucide-react';
import { shareElementAsImage } from '../utils/shareUtils';
import { soundEngine } from '../utils/soundEngine';
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
  '#833AB4', // 9: Reels Watched (Instagram Purple/Pink)
  '#D81B60', // 10: Archetype (Crimson)
  '#150826'  // 11: Share/End (Deep Cosmic Purple with glow)
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
  'REEL ERA',
  'YOUR ARCHETYPE',
  'YOUR WRAPPED IS READY'
];

const ScrollingMarquee = ({ text }: { text: string }) => {
  if (!text) return null;
  return (
    <div className="absolute inset-0 overflow-hidden flex flex-col justify-center opacity-[0.06] pointer-events-none select-none z-0 mix-blend-overlay">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="whitespace-nowrap font-black text-[15vw] uppercase leading-[0.85] tracking-tighter"
          initial={{ x: i % 2 === 0 ? '0%' : '-50%' }}
          animate={{ x: i % 2 === 0 ? '-50%' : '0%' }}
          transition={{ duration: 25 + i * 2, repeat: Infinity, ease: 'linear' }}
        >
          {text} • {text} • {text} • {text} • {text} • {text}
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
    if (stats.monthlyTopConnections && stats.monthlyTopConnections.length > 0) slides.push({ id: 'monthly', component: SlideMonthly });
    
    // Optional extra density/midnight slides
    if (stats.fastestDensity) slides.push({ id: 'density', component: SlideDensity });
    if (stats.midnightConnection) slides.push({ id: 'midnight', component: SlideMidnight });
    if (stats.reelsWatchedStats && stats.reelsWatchedStats.totalWatched > 0) slides.push({ id: 'reels_watched', component: SlideReelsWatched });
    
    slides.push({ id: 'archetype', component: SlideArchetype });
    slides.push({ id: 'share', component: SlideShare });
    
    return slides;
  };

  const slides = useRef(buildSlides()).current;
  const TOTAL_SLIDES = slides.length;
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEngine.setMuted(!next);
  };
  const [showNames, setShowNames] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [progress, setProgress] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSharingSlide, setIsSharingSlide] = useState(false);

  const SLIDE_DURATION = 7000; // 7 seconds per slide

  // Confetti on final slide
  useEffect(() => {
    soundEngine.playSlideTransition(currentSlide);
    if (currentSlide === TOTAL_SLIDES - 1) {
      soundEngine.playCelebrationFanfare();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E1306C', '#F56040', '#FCAF45', '#833AB4', '#ffffff']
      });
    }
  }, [currentSlide, TOTAL_SLIDES]);

  // Main Story Timer
  useEffect(() => {
    if (currentSlide === TOTAL_SLIDES - 1) return; // Stop timer on last slide
    if (isPaused) return;

    const interval = 50; 
    const step = (interval / SLIDE_DURATION) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentSlide, isPaused, TOTAL_SLIDES]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const nextSlide = () => {
    if (currentSlide < TOTAL_SLIDES - 1) {
      setDirection(1);
      setCurrentSlide((prev) => prev + 1);
      setProgress(0);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide((prev) => prev - 1);
      setProgress(0);
    }
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
    setProgress(0);
  };

  const replayWrapped = () => {
    setDirection(-1);
    setCurrentSlide(0);
    setProgress(0);
  };

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('.controls-layer')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width * 0.3) {
      prevSlide();
    } else {
      nextSlide();
    }
  };

  // Parallax Tilt for Desktop
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    setMousePos({
      x: (clientX / innerWidth - 0.5) * 20,
      y: (clientY / innerHeight - 0.5) * 20,
    });
  };

  const CurrentSlideComponent = slides[currentSlide].component;
  const isFinalSlide = currentSlide === TOTAL_SLIDES - 1;

  return (
    <motion.div 
      className="fixed inset-0 w-full h-full flex flex-col justify-between overflow-hidden select-none bg-black"
      animate={{ backgroundColor: SLIDE_THEMES[currentSlide % SLIDE_THEMES.length] }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      onMouseDown={() => { if (!isFinalSlide) setIsPaused(true); }}
      onMouseUp={() => { if (!isFinalSlide) setIsPaused(false); }}
      onTouchStart={() => { if (!isFinalSlide) setIsPaused(true); }}
      onTouchEnd={() => { if (!isFinalSlide) setIsPaused(false); }}
      onMouseMove={handleMouseMove}
    >
      {/* Background Ambience Elements */}
      <GeometricMotifs />
      <ScrollingMarquee text={SLIDE_MARQUEES[currentSlide % SLIDE_MARQUEES.length]} />
      <div className="absolute inset-0 bg-grain opacity-25 mix-blend-overlay pointer-events-none" />

      {/* Share Menu Modal */}
      <AnimatePresence>
        {showShareMenu && (
          <ShareMenu 
            stats={stats} 
            onClose={() => setShowShareMenu(false)} 
          />
        )}
      </AnimatePresence>

      {/* Progress Bars (Instagram Stories Style) */}
      <div className="relative z-50 px-4 pt-3.5 pb-2 flex gap-1.5 max-w-2xl mx-auto w-full controls-layer">
        {slides.map((_, i) => (
          <div 
            key={i} 
            onClick={(e) => { e.stopPropagation(); goToSlide(i); }}
            className="h-1 sm:h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-md cursor-pointer relative py-1 -my-1"
          >
            <div 
              className="h-full bg-white rounded-full transition-all duration-75 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              style={{
                width: i === currentSlide ? `${progress}%` : i < currentSlide ? '100%' : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Top Controls Overlay */}
      <div className="relative z-50 px-4 py-1 flex items-center justify-between max-w-2xl mx-auto w-full controls-layer">
        {/* Left Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] sm:text-xs font-black tracking-widest text-white/70 bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 uppercase">
            {currentSlide + 1} / {TOTAL_SLIDES}
          </span>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowNames(!showNames)} 
            className="p-2 sm:p-2.5 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50 border border-white/10 transition-colors text-white/90 active:scale-95"
            title={showNames ? "Hide names for privacy" : "Show names"}
          >
            {showNames ? <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/40" />}
          </button>
          <button 
            onClick={handleToggleSound} 
            className="p-2 sm:p-2.5 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50 border border-white/10 transition-colors text-white/90 active:scale-95 flex items-center justify-center"
            title={soundEnabled ? "Mute audio" : "Enable sound & music"}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-insta-yellow animate-pulse" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/50" />}
          </button>
        </div>
      </div>

      {/* Share to Story Button (Bottom Center) - Regular slides */}
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
            className="px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-xl hover:bg-white/25 transition-all text-white flex items-center gap-2 text-xs sm:text-sm font-black border border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.5)] active:scale-95"
          >
            {isSharingSlide ? <span className="animate-pulse">Capturing...</span> : (
              <>
                <Share2 className="w-3.5 h-3.5" /> Share to Story
              </>
            )}
          </button>
        </div>
      )}

      {/* Slide Content Zone */}
      <div 
        className="absolute inset-0 flex items-center justify-center z-10"
        onClick={handleTap}
      >
        <div id="slide-capture-zone" className="absolute inset-0 flex items-center justify-center pointer-events-none bg-transparent">
          <AnimatePresence mode="popLayout" custom={direction}>
            <motion.div
              key={currentSlide}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40, filter: 'blur(6px)', scale: 0.94 }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)', scale: 1 }}
              exit={{ opacity: 0, x: direction * -40, filter: 'blur(6px)', scale: 1.06 }}
              transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
              className={`w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 pointer-events-auto transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${isPaused && !isSharingSlide && !isFinalSlide ? 'scale-[0.98] opacity-90' : 'scale-100'}`}
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
              {/* Midground Parallax Tilt */}
              <motion.div 
                className="w-full h-full flex items-center justify-center pointer-events-none"
                animate={{ x: mousePos.x * 0.4, y: mousePos.y * 0.4 }}
                transition={{ type: 'spring', damping: 40, stiffness: 100 }}
              >
                <div className="w-full h-full flex items-center justify-center pointer-events-auto">
                  <CurrentSlideComponent 
                    stats={stats} 
                    showNames={showNames} 
                    onReset={onReset}
                    onExplore={onExplore} 
                    onShareClick={() => setShowShareMenu(true)} 
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
  <div className="text-center px-4 max-w-xl mx-auto flex flex-col items-center justify-center h-full">
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs font-black tracking-widest text-white uppercase mb-4 shadow-lg"
    >
      <Sparkles className="w-3.5 h-3.5 text-insta-yellow" /> 2026 EDITION
    </motion.div>
    
    <motion.h1 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter mb-4 leading-tight text-white break-words drop-shadow-2xl"
    >
      Your Instagram, <br/> 
      <span className="bg-gradient-to-r from-insta-yellow via-white to-insta-pink bg-clip-text text-transparent">
        wrapped.
      </span>
    </motion.h1>

    <motion.p 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7, duration: 0.8 }}
      className="text-sm sm:text-base md:text-lg font-bold text-white/50 tracking-wide uppercase mt-2"
    >
      A look back at your year in chats
    </motion.p>
  </div>
);

const SlideTotal = ({ stats }: { stats: WrappedStats }) => {
  const sentRatio = stats.totalMessages > 0 ? (stats.messagesSent / stats.totalMessages) * 100 : 50;
  const recvRatio = 100 - sentRatio;

  return (
    <div className="text-center px-4 max-w-xl mx-auto flex flex-col items-center justify-center h-full py-6">
      <motion.p 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="text-sm sm:text-base md:text-xl text-white/60 font-bold tracking-widest uppercase mb-2"
      >
        FIRST THINGS FIRST...
      </motion.p>

      <motion.div 
        initial={{ y: 20, opacity: 0, filter: 'blur(10px)' }} 
        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }} 
        transition={{ delay: 0.25, duration: 1, ease: [0.16, 1, 0.3, 1] }} 
        className="text-5xl sm:text-7xl md:text-9xl font-black leading-none tracking-tighter drop-shadow-[0_10px_40px_rgba(225,48,108,0.5)] my-2 text-white break-all max-w-full"
      >
        {stats.totalMessages.toLocaleString()}
      </motion.div>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="text-xl sm:text-2xl md:text-4xl font-extrabold text-white/80 tracking-tight mb-6"
      >
        messages exchanged
      </motion.p>

      {/* Dual Sent vs Received Visualizer */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="w-full max-w-md p-4 rounded-2xl bg-white/[0.08] border border-white/15 backdrop-blur-xl shadow-xl"
      >
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden flex gap-1 p-0.5 mb-3">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${sentRatio}%` }}
            transition={{ delay: 1, duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-insta-yellow to-insta-pink rounded-full shadow-[0_0_10px_rgba(225,48,108,0.8)]"
          />
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${recvRatio}%` }}
            transition={{ delay: 1, duration: 1, ease: "easeOut" }}
            className="h-full bg-white/70 rounded-full"
          />
        </div>

        <div className="flex items-center justify-between text-xs sm:text-sm font-black">
          <span className="text-insta-yellow flex items-center gap-1">
            Sent: {stats.messagesSent.toLocaleString()} ({Math.round(sentRatio)}%)
          </span>
          <span className="text-white/80 flex items-center gap-1">
            Received: {stats.messagesReceived.toLocaleString()} ({Math.round(recvRatio)}%)
          </span>
        </div>
      </motion.div>
    </div>
  );
};

const formatHour = (h: number) => {
  if (h === 0) return '12 AM';
  if (h === 12) return '12 PM';
  return h > 12 ? `${h - 12} PM` : `${h} AM`;
};

const SlidePeak = ({ stats }: { stats: WrappedStats }) => (
  <div className="text-center flex flex-col items-center justify-center h-full px-4 max-w-xl mx-auto py-6">
    <p className="text-xs md:text-sm font-bold tracking-[0.25em] text-white/50 uppercase mb-4">Peak Activity</p>
    
    <div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 flex items-center justify-center my-2">
      <svg className="absolute inset-0 w-full h-full opacity-30 animate-spin-slow" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 6" />
      </svg>
      
      <div className="z-10 flex flex-col items-center">
        <motion.div 
          initial={{ y: 15, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.25, duration: 0.8 }} 
          className="text-2xl sm:text-3xl md:text-4xl font-black text-white/70 mb-1"
        >
          {stats.peakDayOfWeek}s
        </motion.div>
        <motion.div 
          initial={{ scale: 0.85, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          transition={{ delay: 0.45, duration: 0.8, type: 'spring' }} 
          className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-none tracking-tighter drop-shadow-[0_10px_35px_rgba(255,255,255,0.4)] my-1"
        >
          {formatHour(stats.peakHour)}
        </motion.div>
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.7 }} 
          className="text-xs sm:text-sm font-bold text-white/40 tracking-wider uppercase mt-2"
        >
          Your prime messaging window
        </motion.div>
      </div>
    </div>
  </div>
);

const SlideTop5 = ({ stats, showNames }: any) => (
  <div className="w-full max-w-lg px-4 md:px-8 flex flex-col h-full justify-center py-6 mx-auto">
    <div className="text-center mb-6">
      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 border border-white/10 text-[10px] md:text-xs font-bold tracking-widest text-white/80 uppercase mb-1.5 backdrop-blur-md">
        <Heart className="w-3 h-3 text-insta-pink" /> Inner Circle
      </div>
      <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter text-white">Your Top Friends</h2>
    </div>

    <div className="space-y-2.5 sm:space-y-3">
      {stats.topConnections.slice(0, 5).map((conn: any, i: number) => {
        const rankColors = [
          'bg-gradient-to-r from-amber-400 to-yellow-500 text-black',
          'bg-gradient-to-r from-slate-200 to-slate-400 text-black',
          'bg-gradient-to-r from-amber-600 to-amber-700 text-white',
          'bg-white/15 text-white/80',
          'bg-white/15 text-white/80'
        ];

        return (
          <motion.div 
            key={conn.name} 
            initial={{ y: 15, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 0.15 + (i * 0.08), duration: 0.6 }} 
            className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-white/[0.08] border border-white/15 backdrop-blur-xl shadow-lg hover:bg-white/[0.12] transition-colors"
          >
            <div className="flex items-center gap-3 truncate mr-2 min-w-0 flex-1">
              <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow ${rankColors[i]}`}>
                0{i + 1}
              </span>
              <span className="text-sm sm:text-base md:text-xl font-bold tracking-tight truncate text-white">
                {showNames ? conn.name : `Friend ${i + 1}`}
              </span>
            </div>
            <span className="text-xs sm:text-sm font-black text-white/90 bg-white/10 px-3 py-1 rounded-full shrink-0 border border-white/5">
              {conn.messageCount.toLocaleString()} msgs
            </span>
          </motion.div>
        );
      })}
    </div>
  </div>
);

const SlideTop1 = ({ stats, showNames }: any) => {
  const top1 = stats.topConnections[0];
  const pct = Math.round(((top1?.messageCount || 0) / (stats.totalMessages || 1)) * 100);

  return (
    <div className="text-center w-full px-4 max-w-xl mx-auto flex flex-col justify-center items-center h-full py-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400/20 to-insta-orange/20 border border-amber-400/30 text-xs font-black tracking-widest text-amber-300 uppercase mb-3 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" /> THE UNDISPUTED #1
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ scale: 0.8, opacity: 0, filter: 'blur(15px)' }} 
        animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }} 
        transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }} 
        className="relative my-2 sm:my-4 w-full"
      >
        <h2 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter text-white break-words line-clamp-2 max-w-full px-2 drop-shadow-[0_10px_35px_rgba(255,255,255,0.4)]">
          {showNames ? (top1?.name || "Someone") : "Your Best Friend"}
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.8, duration: 0.8 }}
        className="mt-2 flex flex-col items-center"
      >
        <p className="text-2xl sm:text-3xl md:text-5xl font-black text-white drop-shadow-md">
          {top1?.messageCount.toLocaleString()} messages
        </p>
        <p className="text-xs sm:text-sm font-bold text-white/50 tracking-wider uppercase mt-1">
          Made up {pct}% of all your messages
        </p>
      </motion.div>
    </div>
  );
};

const SlideDensity = ({ stats }: any) => {
  if (!stats.fastestDensity) return null;
  return (
    <div className="text-center max-w-xl px-4 flex flex-col justify-center h-full mx-auto py-6">
      <p className="text-xs md:text-sm font-bold tracking-[0.25em] text-white/50 uppercase mb-4">Rapid-Fire Session</p>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tighter mb-2 break-words">
          {stats.fastestDensity.messages} messages in {stats.fastestDensity.minutes} mins
        </h2>
        <p className="text-sm sm:text-base md:text-xl text-white/70 font-medium">
          with {stats.fastestDensity.name}
        </p>
      </motion.div>
    </div>
  );
};

const SlideMidnight = ({ stats }: any) => {
  if (!stats.midnightConnection) return null;
  return (
    <div className="text-center max-w-xl px-4 flex flex-col justify-center h-full mx-auto py-6">
      <p className="text-xs md:text-sm font-bold tracking-[0.25em] text-white/50 uppercase mb-4">After Hours</p>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tighter mb-2 break-words">
          {stats.midnightConnection.count} Late Night Chats
        </h2>
        <p className="text-sm sm:text-base md:text-xl text-white/70 font-medium">
          with {stats.midnightConnection.name}
        </p>
      </motion.div>
    </div>
  );
};

const SlideReelsWatched = ({ stats }: { stats: WrappedStats }) => {
  const reels = stats.reelsWatchedStats;
  if (!reels || reels.totalWatched <= 0) return null;

  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    let animId: number;
    const end = reels.totalWatched;
    const duration = 1600;
    const startTime = performance.now();

    const updateCounter = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayCount(Math.floor(easeOut * end));

      if (progress < 1) {
        animId = requestAnimationFrame(updateCounter);
      } else {
        setDisplayCount(end);
      }
    };

    animId = requestAnimationFrame(updateCounter);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [reels.totalWatched]);

  return (
    <div className="text-center max-w-xl px-4 sm:px-6 flex flex-col justify-center items-center h-full mx-auto py-6">
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-[11px] sm:text-xs md:text-sm font-black tracking-[0.3em] text-white/50 uppercase mb-2 sm:mb-3"
      >
        AND FINALLY...
      </motion.p>

      <motion.h2
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter leading-tight mb-3 sm:mb-4 text-white uppercase"
      >
        WE NEED TO TALK <br/>
        <span className="bg-gradient-to-r from-insta-pink via-red-400 to-insta-orange bg-clip-text text-transparent">
          ABOUT YOUR REEL ERA.
        </span>
      </motion.h2>

      <motion.div
        initial={{ scale: 0.75, opacity: 0, filter: 'blur(15px)' }}
        animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
        transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="my-2 sm:my-3"
      >
        <div className="text-6xl sm:text-7xl md:text-9xl font-black tracking-tighter text-white leading-none drop-shadow-[0_10px_35px_rgba(225,48,108,0.5)]">
          {displayCount.toLocaleString()}
        </div>
        <p className="text-base sm:text-xl md:text-2xl font-extrabold text-white/70 tracking-tight mt-1">
          Reels watched
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="mt-4 sm:mt-6 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md max-w-md mx-auto"
      >
        <p className="text-sm sm:text-base md:text-lg font-bold text-white leading-snug">
          "{reels.headlineJoke}"
        </p>
      </motion.div>

      {(reels.peakMonth || reels.peakHour !== undefined || reels.peakDayOfWeek) && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          className="text-xs sm:text-sm text-white/50 mt-4 font-semibold tracking-wide"
        >
          {reels.peakMonth 
            ? `Peak Reel month: ${reels.peakMonth}` 
            : (reels.peakHour !== undefined 
                ? `Peak Reel hour: ${reels.peakHour > 12 ? (reels.peakHour - 12) + ' PM' : (reels.peakHour === 0 ? '12 AM' : reels.peakHour + ' AM')}`
                : `Most Reel-heavy day: ${reels.peakDayOfWeek}`)}
        </motion.p>
      )}
    </div>
  );
};

const SlideArchetype = ({ stats }: any) => (
  <div className="text-center max-w-xl px-6 flex flex-col justify-center h-full mx-auto py-8">
    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs font-black tracking-widest text-white/70 uppercase mb-3 mx-auto shadow-md">
      <Sparkles className="w-3.5 h-3.5 text-insta-yellow" /> 2026 ARCHETYPE
    </div>
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25, duration: 1, ease: [0.16, 1, 0.3, 1] }}>
      <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter leading-tight mb-3 drop-shadow-[0_10px_35px_rgba(216,27,96,0.5)] text-white break-words">
        {stats.archetype.title}
      </h2>
      <p className="text-sm sm:text-base md:text-xl text-white/75 leading-relaxed font-medium break-words px-2 max-w-md mx-auto mt-2">
        {stats.archetype.description}
      </p>
    </motion.div>
  </div>
);

// --- CROWN JEWEL FINAL WRAPPED PAGE --- //
const SlideShare = ({ stats, showNames, onExplore, onShareClick, onReplay }: SlideProps) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveCard = async () => {
    setIsSaving(true);
    await shareElementAsImage('share-card-capture');
    setIsSaving(false);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between px-4 pt-12 pb-6 md:py-10 overflow-y-auto hide-scrollbar controls-layer max-w-md mx-auto">
      {/* 1. Header */}
      <motion.div 
        initial={{ opacity: 0, y: -15 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center shrink-0"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] md:text-xs font-black tracking-widest text-white uppercase mb-1.5 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-insta-yellow" /> COMPLETE
        </div>
        <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-white uppercase">
          YOUR WRAPPED IS READY.
        </h2>
        <p className="text-xs md:text-sm font-semibold text-white/50 mt-0.5">
          That was your Instagram, wrapped.
        </p>
      </motion.div>

      {/* 2. Visual Centerpiece Preview Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.92, y: 15 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        transition={{ delay: 0.25, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative my-auto shrink-0 group cursor-pointer"
        onClick={onShareClick}
      >
        <div className="relative rounded-[2rem] transition-transform duration-300 group-hover:scale-[1.02] shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          <ShareCard stats={stats} showNames={showNames} />

          {/* Interactive Tap Hint Overlay */}
          <div className="absolute inset-0 bg-black/25 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
            <div className="p-3.5 rounded-full bg-white text-black shadow-2xl scale-95 group-hover:scale-100 transition-transform">
              <Share2 className="w-6 h-6 fill-black" />
            </div>
            <span className="text-xs font-black tracking-wider uppercase text-white bg-black/70 px-3 py-1 rounded-full border border-white/10">
              Click to Share Card
            </span>
          </div>
        </div>
      </motion.div>
      
      {/* 3. Action Hierarchy */}
      <div className="w-full flex flex-col gap-2.5 shrink-0 mb-2">
        {/* PRIMARY CTA: Share Wrapped Link / Story */}
        <motion.button 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.45, duration: 0.6 }}
          onClick={onShareClick} 
          className="w-full py-3.5 md:py-4 px-6 bg-gradient-to-r from-insta-pink via-red-500 to-insta-orange text-white font-black text-sm md:text-base rounded-full active:scale-95 transition-all flex items-center justify-center gap-2.5 shadow-[0_8px_30px_rgba(225,48,108,0.5)] hover:shadow-[0_8px_40px_rgba(225,48,108,0.7)] group"
        >
          <Share2 className="w-4 h-4 md:w-5 md:h-5" /> Share Your Wrapped
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </motion.button>

        {/* SECONDARY CTA: Save Card Image */}
        <motion.button 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.6, duration: 0.6 }}
          onClick={handleSaveCard} 
          className="w-full py-3 md:py-3.5 px-6 bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-white font-bold text-xs md:text-sm rounded-full active:scale-95 transition-all flex items-center justify-center gap-2 backdrop-blur-xl shadow-md"
        >
          <Download className="w-4 h-4" /> {isSaving ? 'Saving Card...' : 'Save Story Card 📸'}
        </motion.button>

        {/* TERTIARY ACTIONS: Replay & Explore */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.75, duration: 0.6 }}
          className="flex items-center justify-center gap-6 pt-1 text-xs text-white/50 font-semibold"
        >
          <button 
            onClick={onReplay}
            className="hover:text-white transition-colors flex items-center gap-1.5 py-1 px-2"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Replay Story
          </button>

          <span className="text-white/20">•</span>

          <button 
            onClick={onExplore}
            className="hover:text-white transition-colors flex items-center gap-1.5 py-1 px-2"
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Explore Insights
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default WrappedStory;
