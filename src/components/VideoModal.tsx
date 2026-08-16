import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, X, CheckCircle2, AlertCircle, RefreshCw, Play, Pause } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { WrappedStats } from '../types/instagram';
import { exportWrappedVideo, type ExportProgress, type ExportResult } from '../utils/videoExporter';

interface Props {
  stats: WrappedStats;
  showNames?: boolean;
  onClose: () => void;
}

export const VideoModal: React.FC<Props> = ({ stats, showNames = true, onClose }) => {
  const [status, setStatus] = useState<'idle' | 'generating' | 'completed' | 'error'>('generating');
  const [progress, setProgress] = useState<ExportProgress>({ percent: 0, stage: 'Starting export engine...' });
  const [videoResult, setVideoResult] = useState<ExportResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    startExport();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (videoResult?.url) {
        URL.revokeObjectURL(videoResult.url);
      }
    };
  }, []);

  const startExport = async () => {
    setStatus('generating');
    setProgress({ percent: 0, stage: 'Starting export engine...' });
    abortControllerRef.current = new AbortController();

    try {
      const result = await exportWrappedVideo(
        stats,
        showNames,
        (p) => setProgress(p),
        abortControllerRef.current.signal
      );

      setVideoResult(result);
      setStatus('completed');

      // Trigger celebration confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#833ab4', '#fd1d1d', '#fcb045', '#e1306c', '#405de6'],
        zIndex: 200
      });
    } catch (err: any) {
      if (err.message !== 'Export canceled by user') {
        console.error('Video generation error', err);
        setStatus('error');
      }
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    onClose();
  };

  const handleDownload = () => {
    if (!videoResult) return;
    const a = document.createElement('a');
    a.href = videoResult.url;
    a.download = videoResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl text-white select-none overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && status !== 'generating') {
          onClose();
        }
      }}
    >
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-gradient-to-br from-insta-pink/30 to-insta-purple/30 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
            rotate: [360, 180, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-gradient-to-tl from-insta-orange/20 to-blue-600/30 rounded-full blur-[100px]"
        />
      </div>

      {/* Main Modal Card */}
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-lg bg-neutral-900/90 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center z-10 my-auto"
      >
        {/* Close Button */}
        <button
          onClick={handleCancel}
          className="absolute top-5 right-5 p-2.5 rounded-full bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. GENERATING STATE */}
        {status === 'generating' && (
          <div className="w-full flex flex-col items-center text-center py-6">
            {/* Spinning glowing ring */}
            <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full bg-gradient-to-tr from-insta-yellow via-insta-pink to-insta-purple p-1 shadow-[0_0_30px_rgba(225,48,108,0.4)]"
              >
                <div className="w-full h-full bg-neutral-950 rounded-full" />
              </motion.div>

              <div className="relative z-10 flex flex-col items-center">
                <span className="text-3xl font-black tracking-tighter text-white">
                  {progress.percent}%
                </span>
                <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase mt-0.5">
                  Rendering
                </span>
              </div>
            </div>

            {/* Stage text */}
            <motion.h3
              key={progress.stage}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold tracking-tight mb-2 text-white"
            >
              {progress.stage}
            </motion.h3>
            <p className="text-sm text-white/50 mb-8 max-w-xs">
              Generating your full Wrapped video in high definition directly on your device.
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden mb-8 border border-white/5">
              <motion.div
                className="h-full bg-gradient-to-r from-insta-yellow via-insta-pink to-insta-purple rounded-full"
                animate={{ width: `${progress.percent}%` }}
                transition={{ ease: 'easeOut', duration: 0.3 }}
              />
            </div>

            <button
              onClick={handleCancel}
              className="px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm font-medium transition-colors"
            >
              Cancel Generation
            </button>
          </div>
        )}

        {/* 2. COMPLETED STATE */}
        {status === 'completed' && videoResult && (
          <div className="w-full flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-2 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-xs font-bold tracking-widest uppercase">Video Generated</span>
            </div>

            <h3 className="text-2xl md:text-3xl font-bold tracking-tighter mb-4 text-white">
              Your Wrapped is ready ??
            </h3>

            {/* 9:16 Video Player Preview */}
            <div className="relative w-48 aspect-[9/16] rounded-2xl overflow-hidden bg-black border border-white/15 shadow-2xl mb-6 group cursor-pointer" onClick={togglePlay}>
              <video
                ref={videoRef}
                src={videoResult.url}
                className="w-full h-full object-cover"
                autoPlay
                loop
                playsInline
              />
              
              {/* Play / Pause overlay */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="p-3 rounded-full bg-white/20 backdrop-blur-md text-white">
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-white" />}
                </div>
              </div>
            </div>

            <p className="text-xs text-white/40 mb-6">
              1080 × 1920 HD • Ready for Instagram Stories & Reels
            </p>

            {/* Actions */}
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={handleDownload}
                className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-insta-pink via-red-500 to-insta-orange text-white font-bold text-base shadow-[0_0_30px_rgba(225,48,108,0.4)] hover:shadow-[0_0_40px_rgba(225,48,108,0.6)] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
              >
                <Download className="w-5 h-5" />
                Download Video ({videoResult.filename.endsWith('.mp4') ? 'MP4' : 'WebM'})
              </button>

              <button
                onClick={onClose}
                className="w-full py-3.5 px-6 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition-colors"
              >
                Back to Wrapped
              </button>
            </div>
          </div>
        )}

        {/* 3. ERROR STATE */}
        {status === 'error' && (
          <div className="w-full flex flex-col items-center text-center py-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-400">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold tracking-tight mb-2 text-white">
              Couldn't create the video
            </h3>
            <p className="text-sm text-white/50 mb-8 max-w-xs">
              We couldn't generate the video on this browser or device. Try again or view your slides directly.
            </p>

            <div className="w-full flex flex-col gap-3">
              <button
                onClick={startExport}
                className="w-full py-3.5 px-6 rounded-full bg-white text-black font-bold text-sm hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>

              <button
                onClick={onClose}
                className="w-full py-3 px-6 rounded-full bg-white/5 hover:bg-white/10 text-white/60 text-sm transition-colors"
              >
                Back to Wrapped
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
