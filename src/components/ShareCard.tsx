import React, { useRef } from 'react';
import { toPng } from 'html-to-image';
import { Download, CheckCircle2 } from 'lucide-react';
import type { WrappedStats } from '../types/instagram';

interface Props {
  stats: WrappedStats;
  showNames: boolean;
  onRestart: () => void;
}

const ShareCard: React.FC<Props> = ({ stats, showNames, onRestart }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = React.useState(false);
  const [downloaded, setDownloaded] = React.useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setDownloading(true);
      const dataUrl = await toPng(cardRef.current, { 
        quality: 1, 
        pixelRatio: 3, // High-res export for stories
      });
      const link = document.createElement('a');
      link.download = 'InstaWrapped2026.png';
      link.href = dataUrl;
      link.click();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error('Failed to generate image', err);
    } finally {
      setDownloading(false);
    }
  };

  const topConnection = stats.topConnections[0];

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto z-10 relative">
      
      {/* 9:16 Card for Export */}
      <div 
        ref={cardRef}
        className="w-full aspect-[9/16] rounded-[2.5rem] bg-background relative overflow-hidden flex flex-col p-8 mb-8"
        style={{
          background: 'linear-gradient(135deg, #09090b 0%, #1a1a2e 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Decorative Gradients for the exported card */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-insta-purple rounded-full mix-blend-screen filter blur-[80px] opacity-40" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-insta-orange rounded-full mix-blend-screen filter blur-[80px] opacity-40" />

        <div className="relative z-10 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-12">
            <span className="font-black text-xl tracking-tighter">InstaWrapped</span>
            <span className="text-white/40 font-bold">2026</span>
          </div>

          <div className="space-y-8 flex-1">
            <div>
              <p className="text-white/60 text-sm font-bold uppercase tracking-wider mb-1">Messages</p>
              <p className="text-4xl font-black">{stats.totalMessages.toLocaleString()}</p>
            </div>

            <div>
              <p className="text-white/60 text-sm font-bold uppercase tracking-wider mb-1">Shared Media</p>
              <p className="text-4xl font-black">{stats.reelsShared.toLocaleString()}</p>
            </div>

            <div>
              <p className="text-white/60 text-sm font-bold uppercase tracking-wider mb-1">Peak Hour</p>
              <p className="text-4xl font-black">{stats.peakHour === 0 ? 12 : stats.peakHour > 12 ? stats.peakHour - 12 : stats.peakHour} {stats.peakHour >= 12 ? 'PM' : 'AM'}</p>
            </div>

            <div className="pt-4 mt-auto">
              <p className="text-insta-pink text-xs font-bold uppercase tracking-wider mb-2">#1 Connection</p>
              <p className="text-5xl font-black leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                {showNames ? (topConnection?.name || "Someone") : "Top Connection"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons (Not exported in image) */}
      <div className="flex flex-col gap-4 w-full">
        <button 
          onClick={handleDownload}
          disabled={downloading}
          className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 bg-white text-black hover:scale-[1.02] transition-transform disabled:opacity-50"
        >
          {downloaded ? (
            <><CheckCircle2 className="w-5 h-5 text-green-500" /> Saved to Device</>
          ) : downloading ? (
            "Generating Image..."
          ) : (
            <><Download className="w-5 h-5" /> Download Story</>
          )}
        </button>

        <button 
          onClick={onRestart}
          className="w-full py-4 rounded-2xl font-bold flex items-center justify-center bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
        >
          Start Again
        </button>
      </div>
    </div>
  );
};

export default ShareCard;
