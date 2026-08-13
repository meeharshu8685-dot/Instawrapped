import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import type { ExportRange } from '../types/instagram';

interface Props {
  onContinue: (range: ExportRange) => void;
}

const OPTIONS: { id: ExportRange; title: string; description?: string; recommended?: boolean }[] = [
  {
    id: 'all',
    title: 'All available data',
    description: 'Best for your complete Wrapped',
    recommended: true
  },
  {
    id: '1_year',
    title: 'Last 1 year',
    description: 'Good for a recent Wrapped'
  },
  {
    id: '6_months',
    title: 'Last 6 months'
  },
  {
    id: '3_months',
    title: 'Last 3 months'
  }
];

const ExportRangeSelection: React.FC<Props> = ({ onContinue }) => {
  const [selected, setSelected] = useState<ExportRange>('all');

  return (
    <div className="w-full max-w-xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h2 className="text-3xl md:text-4xl font-black mb-3 text-white">How much data did you export?</h2>
        <p className="text-white/60 text-lg">This helps us make your Wrapped more accurate.</p>
      </motion.div>

      <div className="space-y-4 mb-10" role="radiogroup" aria-label="Export Range Selection">
        {OPTIONS.map((option, index) => {
          const isSelected = selected === option.id;
          
          return (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <button
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelected(option.id)}
                className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 group focus:outline-none focus:ring-2 focus:ring-insta-pink focus:ring-offset-2 focus:ring-offset-background
                  ${isSelected 
                    ? 'bg-white/10 border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.05)]' 
                    : 'bg-white/5 border-white/5 hover:bg-white-[0.07] hover:border-white/10'
                  }`}
              >
                <div className={`mt-0.5 shrink-0 transition-colors ${isSelected ? 'text-insta-pink' : 'text-white/20 group-hover:text-white/40'}`}>
                  {isSelected ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-white/80'}`}>
                      {option.title}
                    </span>
                    {option.recommended && (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-insta-gradient text-white px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  {option.description && (
                    <p className={`text-sm ${isSelected ? 'text-white/70' : 'text-white/40'}`}>
                      {option.description}
                    </p>
                  )}
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        onClick={() => onContinue(selected)}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white text-black font-bold text-lg hover:scale-[1.02] transition-transform group"
      >
        Continue 
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </motion.button>
    </div>
  );
};

export default ExportRangeSelection;
