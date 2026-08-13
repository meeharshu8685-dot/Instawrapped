import React from 'react';
import { ArrowRight, Lock, Shield, Eye, Heart, BarChart3, Clock, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  onClose: () => void;
}

const PrivacyPage: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-[#050505] overflow-y-auto overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-8 py-8 flex justify-between items-center relative z-50">
        <button onClick={onClose} className="text-white/40 hover:text-white font-bold transition-colors">
          ← Back
        </button>
        <span className="font-bold text-lg tracking-tight">Privacy</span>
        <div className="w-16" /> {/* Spacer */}
      </div>

      <section className="w-full min-h-[80vh] flex items-center justify-center py-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-5xl mx-auto px-8 text-center space-y-24"
        >
          <h2 className="text-[4rem] md:text-[6rem] lg:text-[8rem] font-bold tracking-tighter leading-none">
            Your data <br /> stays yours.
          </h2>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 text-3xl font-bold text-white/40 tracking-tight">
            <span>Your ZIP</span>
            <ArrowRight className="w-8 h-8 opacity-30 rotate-90 md:rotate-0" />
            <span>Your Browser</span>
            <ArrowRight className="w-8 h-8 opacity-30 rotate-90 md:rotate-0" />
            <span className="text-white">Your Wrapped</span>
          </div>
          
          <p className="text-2xl text-white/30 max-w-3xl mx-auto font-medium leading-relaxed">
            Zero cloud uploads. Zero database storage. <br /> Processed 100% locally on your device.
          </p>
        </motion.div>
      </section>
    </div>
  );
};

export default PrivacyPage;
