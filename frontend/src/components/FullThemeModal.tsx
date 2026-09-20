import React, { useState, useEffect } from 'react';
import { THEMES, Theme } from '@/lib/themes';
import { applyFullTheme, getStoredTheme } from '@/lib/colors';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function FullThemeModal({ isOpen, onClose }: Props) {
  const [activeTheme, setActiveTheme] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTheme(getStoredTheme());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (t: Theme | null) => {
    setActiveTheme(t ? t.name : null);
    applyFullTheme(t, true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 font-mono tracking-wide uppercase">Select Theme</h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">If a theme is active, it overrides custom text and background colors.</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <button
              onClick={() => handleSelect(null)}
              className={`p-4 border text-left transition-all relative overflow-hidden group ${
                activeTheme === null
                  ? 'border-[var(--hot)] bg-[var(--hot)]/5'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800'
              }`}
            >
              <div className="font-mono text-sm uppercase tracking-widest text-slate-300">None (Use custom colors)</div>
            </button>
            {THEMES.map((t) => {
              const isActive = activeTheme === t.name;
              return (
                <button
                  key={t.name}
                  onClick={() => handleSelect(t)}
                  className={`p-4 border text-left transition-all relative overflow-hidden group ${
                    isActive
                      ? 'border-[var(--hot)] bg-[var(--hot)]/5 shadow-[0_0_15px_var(--color-hot-soft)]'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800'
                  }`}
                  style={{ backgroundColor: isActive ? t.bgColor : undefined }}
                >
                  <div className="flex items-center gap-3">
                    {/* Color palette preview */}
                    <div className="flex -space-x-1">
                      <div className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: t.bgColor }} />
                      <div className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: t.mainColor }} />
                      <div className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: t.subColor }} />
                      <div className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: t.textColor }} />
                    </div>
                    <span 
                      className="font-mono text-sm font-bold uppercase tracking-widest"
                      style={{ color: t.mainColor }}
                    >
                      {t.name}
                    </span>
                  </div>
                  {isActive && (
                    <div 
                      className="absolute top-2 right-2"
                      style={{ color: t.mainColor }}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
