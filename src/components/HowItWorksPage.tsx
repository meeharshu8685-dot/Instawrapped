import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  onClose: () => void;
}

const HowItWorksPage: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-[#050505] overflow-y-auto overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-8 py-8 flex justify-between items-center relative z-50">
        <button onClick={onClose} className="text-white/40 hover:text-white font-bold transition-colors">
          ← Back
        </button>
        <span className="font-bold text-lg tracking-tight">How it works</span>
        <div className="w-16" /> {/* Spacer */}
      </div>

      <section className="w-full min-h-[80vh] flex items-center py-24">
        <div className="max-w-7xl mx-auto px-8 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="grid lg:grid-cols-3 gap-24 lg:gap-16 xl:gap-24"
          >
            <div className="space-y-12">
              <div className="text-[10rem] leading-none font-bold text-white/5 tracking-tighter">01</div>
              <div className="space-y-4">
                <h3 className="text-4xl font-bold tracking-tight">Download</h3>
                <p className="text-2xl text-white/40 leading-snug font-medium">Request your Instagram information in JSON format.</p>
              </div>
            </div>
            <div className="space-y-12">
              <div className="text-[10rem] leading-none font-bold text-white/5 tracking-tighter">02</div>
              <div className="space-y-4">
                <h3 className="text-4xl font-bold tracking-tight">Upload</h3>
                <p className="text-2xl text-white/40 leading-snug font-medium">Drop your entire ZIP directly here. No extraction needed.</p>
              </div>
            </div>
            <div className="space-y-12">
              <div className="text-[10rem] leading-none font-bold text-white/5 tracking-tighter">03</div>
              <div className="space-y-4">
                <h3 className="text-4xl font-bold tracking-tight">Discover</h3>
                <p className="text-2xl text-white/40 leading-snug font-medium">Experience your year in a beautiful, cinematic format.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorksPage;
