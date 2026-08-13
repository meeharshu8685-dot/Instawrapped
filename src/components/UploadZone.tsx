import React, { useState, useRef } from 'react';
import { UploadCloud, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseInstagramZip } from '../analytics/instagramParser';
import { calculateStats } from '../analytics/statistics';

interface Props {
  onDataLoaded: (stats: any) => void;
}

const UploadZone: React.FC<Props> = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'error'>('idle');
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.zip')) {
      setStatus('error');
      setErrorMsg('Please upload a .zip file.');
      return;
    }

    setStatus('processing');
    setErrorMsg('');
    
    try {
      const conversations = await parseInstagramZip(file, setProgressMsg);
      setProgressMsg('Counting interactions & ranking connections...');
      
      await new Promise(r => setTimeout(r, 800));
      const stats = calculateStats(conversations);
      
      setProgressMsg('Rendering cinematic experience...');
      await new Promise(r => setTimeout(r, 1200));
      
      onDataLoaded(stats);
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
      className={`relative w-full rounded-3xl transition-all duration-300 ${
        isDragging ? 'scale-[1.02] shadow-2xl shadow-insta-purple/20' : 'scale-100'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r from-insta-purple via-insta-pink to-insta-orange blur-xl transition-opacity duration-500 ${isDragging || status === 'processing' ? 'opacity-30' : 'opacity-0 hover:opacity-10'}`} />
      
      <div className={`relative glass-card overflow-hidden border-2 transition-colors duration-300 ${
        isDragging ? 'border-insta-pink bg-white/10' : 
        status === 'error' ? 'border-red-500/50' : 
        'border-white/10 hover:border-white/20'
      }`}>
        
        <div className="p-8 md:p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <AnimatePresence mode="wait">
            
            {status === 'idle' && (
              <motion.div 
                key="idle"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 text-white/50">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Drop your Instagram export here</h3>
                <p className="text-white/50 mb-8">Supports official Instagram data .zip files. Everything is processed safely on your device.</p>
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform"
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center w-full max-w-sm"
              >
                <Loader2 className="w-12 h-12 text-insta-pink animate-spin mb-6" />
                <h3 className="text-xl font-bold mb-2">Building your Wrapped...</h3>
                <div className="w-full bg-white/5 rounded-full h-1.5 mb-4 overflow-hidden relative">
                  <div className="absolute inset-y-0 left-0 bg-insta-gradient w-1/2 rounded-full animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_10px_rgba(225,48,108,0.5)]" />
                </div>
                <p className="text-white/70 font-medium text-center">{progressMsg}</p>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div 
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 text-red-400">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white">Something went wrong</h3>
                <p className="text-red-400 mb-8 max-w-sm">{errorMsg}</p>
                
                <button 
                  onClick={() => setStatus('idle')}
                  className="px-6 py-3 bg-white/10 text-white font-medium rounded-full hover:bg-white/20 transition-colors"
                >
                  Try Again
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default UploadZone;
