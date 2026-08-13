import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Lock } from 'lucide-react';
import UploadZone from './UploadZone';
import ExportRangeSelection from './ExportRangeSelection';
import type { ExportRange } from '../types/instagram';

interface Props {
  onDataLoaded: (stats: any) => void;
  onDemoLoaded: () => void;
}

const LandingPage: React.FC<Props> = ({ onDataLoaded, onDemoLoaded }) => {
  const [step, setStep] = React.useState<'selection' | 'upload'>('selection');
  const [exportRange, setExportRange] = React.useState<ExportRange>('all');

  const handleSelection = (range: ExportRange) => {
    setExportRange(range);
    setStep('upload');
  };
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-insta-purple rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-blob" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-insta-orange rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-insta-pink rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-blob animation-delay-4000" />
      
      <div className="relative z-10 container mx-auto px-6 py-20 max-w-5xl">
        <header className="flex justify-between items-center mb-24">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-insta-gradient flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">InstaWrapped</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/50 bg-white/5 px-4 py-2 rounded-full border border-white/5">
            <Lock className="w-4 h-4" />
            <span>100% Local</span>
          </div>
        </header>

        <main className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-block mb-4 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-medium uppercase tracking-widest text-insta-pink">
                Your Instagram, told differently
              </div>
              <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[1.1] mb-6">
                Meet your <br />
                <span className="text-gradient">Instagram Wrapped.</span>
              </h1>
              <p className="text-lg text-white/60 leading-relaxed max-w-md">
                See who you talked to the most, who received your reels, where your time went, and the connections that quietly mattered.
              </p>
            </motion.div>

            {step === 'selection' ? (
              <motion.div 
                key="selection"
                className="pt-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ExportRangeSelection onContinue={handleSelection} />
              </motion.div>
            ) : (
              <motion.div 
                key="upload"
                className="space-y-4 pt-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <button 
                  onClick={() => setStep('selection')}
                  className="text-white/40 text-sm hover:text-white mb-2 underline underline-offset-4"
                >
                  ← Change export range
                </button>
                <UploadZone onDataLoaded={onDataLoaded} exportRange={exportRange} />
                
                <div className="flex items-center justify-center gap-4 text-sm text-white/40 pt-4">
                  <span className="h-px flex-1 bg-white/10"></span>
                  <span>or</span>
                  <span className="h-px flex-1 bg-white/10"></span>
                </div>

                <button 
                  onClick={onDemoLoaded}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-white font-medium group"
                >
                  <Sparkles className="w-5 h-5 text-insta-orange group-hover:scale-110 transition-transform" />
                  Try Demo with Sample Data
                </button>
              </motion.div>
            )}
          </div>

          <motion.div 
            className="relative lg:h-[600px] flex items-center justify-center hidden lg:flex"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            {/* Floating Mockup Cards */}
            <motion.div 
              className="absolute z-20 glass-card p-6 pr-12 rounded-3xl -rotate-6 shadow-2xl border-white/20"
              animate={{ y: [-10, 10, -10], rotate: [-6, -4, -6] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <p className="text-xs text-white/50 font-bold uppercase tracking-wider mb-2">Your #1 Connection</p>
              <p className="text-3xl font-black mb-1">Rahul</p>
              <p className="text-insta-pink font-medium">4,832 interactions</p>
            </motion.div>

            <motion.div 
              className="absolute z-10 glass-card p-6 pl-12 rounded-3xl rotate-12 top-20 right-0 shadow-2xl border-white/10 opacity-80"
              animate={{ y: [10, -10, 10], rotate: [12, 14, 12] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <p className="text-4xl font-black mb-1">18,492</p>
              <p className="text-white/60 font-medium">messages sent</p>
            </motion.div>
            
            <motion.div 
              className="absolute z-30 glass-card p-5 rounded-full bottom-32 left-10 shadow-2xl border-white/20 bg-gradient-to-r from-insta-orange to-insta-pink"
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            >
              <p className="text-white font-bold px-4">1,284 reels shared 🎬</p>
            </motion.div>
          </motion.div>
        </main>
        
        <section className="mt-40 border-t border-white/10 pt-20">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl font-black">01</div>
              <h3 className="text-xl font-bold">Download your data</h3>
              <p className="text-white/50 leading-relaxed">Request your Instagram data export from the Accounts Center (ensure it includes Messages in JSON format).</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl font-black">02</div>
              <h3 className="text-xl font-bold">Drop the ZIP here</h3>
              <p className="text-white/50 leading-relaxed">No need to unzip. Just drag and drop the file directly into your browser.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-insta-gradient flex items-center justify-center text-xl font-black text-white">03</div>
              <h3 className="text-xl font-bold">Meet your Wrapped</h3>
              <p className="text-white/70 leading-relaxed">Your data is parsed instantly on your device to build a beautiful, private cinematic story.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LandingPage;
