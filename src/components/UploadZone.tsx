import React, { useState, useRef } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseInstagramZip } from '../analytics/instagramParser';
import { calculateStats } from '../analytics/statistics';

import type { ExportRange, WrappedStats } from '../types/instagram';

interface Props {
  onDataLoaded: (stats: WrappedStats) => void;
  exportRange: ExportRange;
}

const PROCESSING_STEPS = [
  "Looking through your year...",
  "Finding your conversations...",
  "Finding your people...",
  "Finding your patterns...",
  "Your Wrapped is ready."
];

const UploadZone: React.FC<Props> = ({ onDataLoaded, exportRange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'ready' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [analyzedStats, setAnalyzedStats] = useState<WrappedStats | null>(null);
  const [processingStepIndex, setProcessingStepIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.zip')) {
      setStatus('error');
      setErrorMsg('Please upload a .zip file.');
      return;
    }

    setStatus('processing');
    setProcessingStepIndex(0);
    setErrorMsg('');
    
    try {
      // Step 0: "Looking through your year..."
      setProcessingStepIndex(0);
      const { conversations, reelsEvents } = await parseInstagramZip(file, () => {});
      
      // Step 1: "Finding your conversations..."
      setProcessingStepIndex(1);
      await new Promise(r => setTimeout(r, 1000));
      
      // Step 2: "Finding your people..."
      setProcessingStepIndex(2);
      const stats = calculateStats(conversations, exportRange, reelsEvents);
      await new Promise(r => setTimeout(r, 1000));
      
      // Step 3: "Finding your patterns..."
      setProcessingStepIndex(3);
      await new Promise(r => setTimeout(r, 1200));
      
      // Step 4: "Your Wrapped is ready."
      setProcessingStepIndex(4);
      setAnalyzedStats(stats);
      await new Promise(r => setTimeout(r, 800));
      
      setStatus('ready');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Failed to process the ZIP file.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      className={`relative w-full max-w-3xl mx-auto rounded-[3rem] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isDragging 
          ? 'scale-[1.02] bg-[#1a1a1a] shadow-[0_0_120px_rgba(225,48,108,0.15)] ring-1 ring-white/20' 
          : 'scale-100 bg-[#111] hover:bg-[#161616] shadow-2xl ring-1 ring-white/5'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="p-12 md:p-24 text-center flex flex-col items-center justify-center min-h-[450px]">
        <AnimatePresence mode="wait">
          
          {status === 'idle' && (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center"
            >
              <h3 className="text-[2.5rem] font-bold tracking-tight mb-4 leading-tight text-white">
                Drop your Instagram <br/> export here
              </h3>
              <p className="text-xl text-white/40 mb-12 font-medium">
                100% local processing. No cloud uploads.
              </p>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-10 py-5 bg-white text-black text-lg font-bold rounded-full active:scale-95 transition-transform spatial-shadow"
              >
                Choose ZIP File
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => e.target.files && processFile(e.target.files[0])}
                className="hidden" 
                accept=".zip" 
              />
            </motion.div>
          )}

          {status === 'processing' && (
            <motion.div 
              key="processing"
              initial={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center w-full relative"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-insta-pink/10 blur-[80px] rounded-full animate-pulse" />
              
              <AnimatePresence mode="wait">
                <motion.h3 
                  key={processingStepIndex}
                  initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="text-3xl font-bold tracking-tight text-white relative z-10"
                >
                  {PROCESSING_STEPS[processingStepIndex]}
                </motion.h3>
              </AnimatePresence>
            </motion.div>
          )}

          {status === 'ready' && analyzedStats && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center w-full max-w-sm"
            >
              <h3 className="text-5xl font-bold tracking-tighter mb-4 text-white">Ready.</h3>
              <p className="text-xl text-white/50 font-medium mb-12">
                {analyzedStats.actualDateRange 
                  ? `${analyzedStats.actualDateRange.formattedDuration} of data discovered.` 
                  : `Your Instagram export has been analyzed.`}
              </p>

              <button 
                onClick={() => onDataLoaded(analyzedStats)}
                className="w-full flex items-center justify-center gap-3 py-5 rounded-full bg-white text-black font-bold text-xl active:scale-95 transition-transform spatial-shadow group"
              >
                Show my Wrapped
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>

              {import.meta.env.DEV && (
                <div className="mt-12 p-6 bg-black/80 rounded-2xl w-full text-left text-xs font-mono text-white/50">
                  <div className="text-white mb-2">DEBUG INFO</div>
                  <div>Total messages: {analyzedStats.totalMessages}</div>
                  <div>Unique participants: {analyzedStats.uniqueContacts}</div>
                </div>
              )}
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div 
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              <AlertCircle className="w-12 h-12 text-red-500 mb-6" />
              <h3 className="text-3xl font-bold mb-4 text-white tracking-tight">Something went wrong</h3>
              <p className="text-xl text-red-400/80 mb-12 max-w-sm font-medium">{errorMsg}</p>
              
              <button 
                onClick={() => setStatus('idle')}
                className="px-8 py-4 bg-white/10 text-white font-bold rounded-full active:scale-95 transition-transform"
              >
                Try Again
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default UploadZone;
