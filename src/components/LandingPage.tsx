import React, { useState, useRef } from 'react';
import { ArrowRight, Lock, Shield, Eye, Heart, BarChart3, Clock, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UploadZone from './UploadZone';
import ExportRangeSelection from './ExportRangeSelection';
import type { ExportRange, WrappedStats } from '../types/instagram';
import ShareMenu from './ShareMenu';

interface Props {
  stats: WrappedStats | null;
  onViewWrapped: () => void;
  onDataLoaded: (stats: WrappedStats) => void;
  onDemoLoaded: () => void;
}

import HowItWorksPage from './HowItWorksPage';
import PrivacyPage from './PrivacyPage';

const LandingPage: React.FC<Props> = ({ stats, onViewWrapped, onDataLoaded, onDemoLoaded }) => {
  const [step, setStep] = useState<'selection' | 'upload'>('selection');
  const [exportRange, setExportRange] = useState<ExportRange>('all');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [activePage, setActivePage] = useState<'home' | 'how-it-works' | 'privacy'>('home');
  const uploadRef = useRef<HTMLDivElement>(null);

  const handleSelection = (range: ExportRange) => {
    setExportRange(range);
    setStep('upload');
  };

  const scrollToUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (activePage === 'how-it-works') {
    return <HowItWorksPage onClose={() => setActivePage('home')} />;
  }

  if (activePage === 'privacy') {
    return <PrivacyPage onClose={() => setActivePage('home')} />;
  }

  return (
    <div className="w-full flex flex-col min-h-screen bg-[#050505] selection:bg-white/20">
      <AnimatePresence>
        {showShareMenu && stats && (
          <ShareMenu stats={stats} onClose={() => setShowShareMenu(false)} />
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="w-full px-8 py-8 max-w-7xl mx-auto flex justify-between items-center z-50 relative">
        <span className="font-bold text-lg tracking-tight">InstaWrapped</span>
        <div className="text-xs font-bold tracking-widest uppercase text-white/40">
          Local Processing
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="w-full max-w-7xl mx-auto px-8 pt-24 pb-48 relative z-10 flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-[4rem] lg:text-[7rem] font-bold tracking-tighter leading-[0.9] mb-8">
              Your Instagram, <br />
              told differently.
            </h1>
            <p className="text-2xl text-white/50 leading-tight max-w-lg font-medium">
              Find the people, moments, and patterns hidden inside your Instagram export.
            </p>
          </motion.div>

          <motion.div 
            className="flex flex-col sm:flex-row gap-6 pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            {stats ? (
              <>
                <button 
                  onClick={onViewWrapped}
                  className="px-10 py-5 rounded-full bg-white text-black font-bold text-xl active:scale-95 transition-transform flex items-center justify-center gap-3 spatial-shadow"
                >
                  View My Wrapped <ArrowRight className="w-6 h-6" />
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={scrollToUpload}
                  className="px-10 py-5 rounded-full bg-white text-black font-bold text-xl active:scale-95 transition-transform flex items-center justify-center gap-3 spatial-shadow group"
                >
                  Create My Wrapped <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              </>
            )}
          </motion.div>
        </div>

        {/* Abstract Spatial Preview */}
        <motion.div 
          className="flex-1 relative h-[600px] hidden lg:flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
        >
          {/* Deep Atmosphere */}
          <div className="absolute w-[500px] h-[500px] bg-gradient-to-tr from-insta-pink/10 to-insta-orange/5 blur-[120px] rounded-full pointer-events-none" />
          
          <motion.div 
            className="absolute z-20"
            animate={{ y: [-15, 15, -15] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            <p className="text-[8rem] font-bold tracking-tighter leading-none text-white drop-shadow-2xl">18,492</p>
          </motion.div>

          <motion.div 
            className="absolute z-10 top-20 right-10 opacity-40 blur-[2px]"
            animate={{ y: [10, -10, 10], x: [-5, 5, -5] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <p className="text-3xl font-bold tracking-tight">July</p>
          </motion.div>
          
          <motion.div 
            className="absolute z-30 bottom-32 left-10 opacity-70"
            animate={{ y: [-5, 5, -5], x: [5, -5, 5] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          >
            <p className="text-2xl font-bold tracking-tight text-insta-pink">#1 Connection</p>
          </motion.div>
        </motion.div>
      </section>

      {/* UPLOAD SECTION */}
      <section ref={uploadRef} className="w-full bg-[#0a0a0a] py-48 flex-1">
        <div className="max-w-4xl mx-auto px-8">
          {!stats && (
            <div className="relative">
              {step === 'selection' ? (
                <div className="text-center">
                  <h2 className="text-4xl font-bold mb-16">How much history?</h2>
                  <ExportRangeSelection onContinue={handleSelection} />
                </div>
              ) : (
                <div className="space-y-12">
                  <button 
                    onClick={() => setStep('selection')}
                    className="text-white/30 text-sm hover:text-white font-medium flex items-center gap-2 transition-colors mx-auto"
                  >
                    ← Change export range
                  </button>
                  <UploadZone onDataLoaded={onDataLoaded} exportRange={exportRange} />
                  
                  <div className="pt-24 text-center">
                    <button 
                      onClick={onDemoLoaded}
                      className="text-white/40 font-bold hover:text-white transition-colors"
                    >
                      Try with sample data instead
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-24 text-center bg-[#0a0a0a]">
        <div className="flex flex-wrap justify-center items-center gap-12 mb-16 text-lg font-bold text-white/30">
          <button onClick={() => setActivePage('how-it-works')} className="hover:text-white transition-colors">How it works</button>
          <button onClick={() => setActivePage('privacy')} className="hover:text-white transition-colors">Privacy</button>
          <button onClick={() => { if(stats) setShowShareMenu(true); else scrollToUpload(); }} className="hover:text-white transition-colors">Share</button>
        </div>
        <p className="text-white/20 font-medium">Made by Harshu with love 🤎</p>
      </footer>
    </div>
  );
};

export default LandingPage;
