'use client';
import React from 'react';
import { motion } from 'framer-motion';

type Props = {
  title: string;
  description: string;
  datasetSize?: string;
  factors?: string;
  cta?: string;
  onClick?: () => void;
  onPreview?: () => void;
  accent?: 'red'|'amber'|'cyan';
  comingSoon?: boolean;
};

const accentConfig: Record<NonNullable<Props['accent']>, {
  border: string;
  bg: string;
  button: string;
  glow: string;
}> = {
  red: {
    border: 'border-red-500/30 hover:border-red-500/50',
    bg: 'from-red-500/5 to-transparent',
    button: 'from-red-500 to-orange-500 shadow-red-500/25',
    glow: 'shadow-red-500/20',
  },
  amber: {
    border: 'border-amber-400/30 hover:border-amber-400/50',
    bg: 'from-amber-400/5 to-transparent',
    button: 'from-amber-400 to-yellow-500 shadow-amber-400/25',
    glow: 'shadow-amber-400/20',
  },
  cyan: {
    border: 'border-cyan-400/30 hover:border-cyan-400/50',
    bg: 'from-cyan-400/5 to-transparent',
    button: 'from-cyan-400 to-sky-500 shadow-cyan-400/25',
    glow: 'shadow-cyan-400/20',
  },
};

export function DatasetCard({
  title, description, datasetSize, factors, cta='Explore', onClick, onPreview,
  accent='cyan', comingSoon=false,
}: Props) {
  const colors = accentConfig[accent];
  
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: .3 }}
      transition={{ duration: .6, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="group relative"
    >
      {/* Glow effect on hover */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${colors.button} rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition duration-500 ${colors.glow}`} />
      
      <div className={`relative rounded-2xl bg-gradient-to-br from-zinc-900/90 to-zinc-900/50 border-2 ${colors.border}
                       backdrop-blur-sm overflow-hidden transition-all duration-500
                       ${comingSoon ? 'opacity-75' : ''}`}>
        {/* Top gradient accent */}
        <div className={`absolute top-0 left-0 right-0 h-48 bg-gradient-to-b ${colors.bg} pointer-events-none`} />
        
        {/* Shimmer effect for coming soon */}
        {comingSoon && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          </div>
        )}
        
        <div className="relative p-8 flex flex-col h-[520px]">
          {/* Title */}
          <header className="mb-4">
            <h3 className="text-2xl font-bold text-white leading-tight">{title}</h3>
          </header>
          
          {/* Description */}
          <p className="text-base text-zinc-300 leading-relaxed flex-1 mb-6">{description}</p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {datasetSize && (
              <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4">
                <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">Dataset Size</p>
                <p className="text-base font-bold text-white">{datasetSize}</p>
              </div>
            )}
            {factors && (
              <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4">
                <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">Key Factors</p>
                <p className="text-base font-bold text-white">{factors}</p>
              </div>
            )}
          </div>

          {/* CTA Buttons */}
          {comingSoon ? (
            <button
              disabled
              className="group/btn relative w-full py-4 px-6 rounded-xl font-bold text-base bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
            >
              Coming Soon
            </button>
          ) : (
            <div className="space-y-2">
              {/* Primary: Analyze Now */}
              <button
                onClick={onClick}
                className={`group/btn relative w-full py-3.5 px-6 rounded-xl font-bold text-base
                            bg-gradient-to-r ${colors.button} text-white hover:shadow-lg active:scale-[0.98]
                            transition-all duration-300 focus:outline-none focus-visible:ring-4
                            focus-visible:ring-violet-400/30`}
              >
                <span className="flex items-center justify-center gap-2">
                  {cta}
                  <svg className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
              
              {/* Secondary: Preview Data */}
              {onPreview && (
                <button
                  onClick={onPreview}
                  className={`group/preview w-full py-2.5 px-6 rounded-lg font-semibold text-sm
                             bg-gradient-to-r ${colors.bg} border-2 ${colors.border}
                             hover:border-opacity-80 active:scale-[0.98]
                             transition-all duration-300 focus:outline-none focus-visible:ring-2
                             focus-visible:ring-primary/30`}
                  style={{
                    color: accent === 'red' ? '#fca5a5' : accent === 'amber' ? '#fde68a' : '#67e8f9'
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Preview Data First
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}

