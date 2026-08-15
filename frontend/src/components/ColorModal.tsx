import React, { useState, useEffect } from 'react';

import { HexColorPicker } from 'react-colorful';
import { SOLID_COLORS, GRADIENT_COLORS, getStoredColor, applyTextColor, type ThemeColor } from '@/lib/colors';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ColorModal({ isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'solid' | 'gradient'>('solid');
  const [activeColor, setActiveColor] = useState<string>(() => getStoredColor()?.value ?? '');
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredColor();
      if (stored) {
        setActiveColor(stored.value);
        if (stored.isGradient) setActiveTab('gradient');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectColor = (color: ThemeColor) => {
    setActiveColor(color.value);
    applyTextColor(color, true);
  };

  const handleClose = () => {
    if (user) {
      const stored = getStoredColor();
      if (stored) {
        api.updateSettings({ colorTheme: stored }).catch(console.error);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-background border border-slate-700/60 p-6 sm:p-8 shadow-2xl relative max-h-[85vh] flex flex-col">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white hover:text-slate-200 transition-colors p-2 text-xl font-bold exclude-theme"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
            
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Text Color Settings</h2>
            <p className="text-xs text-slate-400">Customize the color of your typing text</p>
          </div>
        </div>

        {/* Source Selector Tabs */}
        <div className="flex bg-slate-900/60 p-1 mb-6 border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('solid')}
            className={`flex-1 py-2 text-sm font-semibold flex items-center justify-center gap-2 transition-all exclude-theme ${
              activeTab === 'solid'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
             Solid Color
          </button>
          <button
            onClick={() => setActiveTab('gradient')}
            className={`flex-1 py-2 text-sm font-semibold flex items-center justify-center gap-2 transition-all exclude-theme ${
              activeTab === 'gradient'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
             Combinations (20+)
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-2">
          {activeTab === 'solid' ? (
            <div className="flex flex-col items-center justify-center py-6">
              <HexColorPicker 
                color={activeColor.includes('gradient') ? '#f1f5f9' : activeColor || '#f1f5f9'} 
                onChange={(hex) => handleSelectColor({ name: 'Custom', value: hex, isGradient: false })}
                style={{ width: '100%', maxWidth: '350px', height: '250px' }}
              />
              <div className="mt-8 flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-lg border border-slate-600 shadow-inner"
                  style={{ backgroundColor: activeColor.includes('gradient') ? '#f1f5f9' : activeColor || '#f1f5f9' }}
                />
                <input
                  type="text"
                  value={activeColor.includes('gradient') ? '#F1F5F9' : (activeColor || '#f1f5f9').toUpperCase()}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (!val.startsWith('#') && val.length > 0) val = '#' + val;
                    handleSelectColor({ name: 'Custom', value: val, isGradient: false });
                  }}
                  className="font-mono text-xl text-slate-100 bg-slate-900 border border-slate-700 px-3 py-2 rounded-md w-32 text-center exclude-theme focus:border-amber-400 focus:outline-none transition-colors shadow-inner"
                  maxLength={7}
                  spellCheck={false}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {GRADIENT_COLORS.map((color, idx) => {
                const isSelected = activeColor === color.value;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectColor(color)}
                    className={`h-24 flex items-end p-3 transition-all hover:scale-105 exclude-theme ${
                      isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-[#161922] shadow-lg' : 'shadow-md border border-slate-700/50'
                    }`}
                    style={{ background: color.value }}
                  >
                    <div className="w-full flex items-center justify-between">
                      <span className="text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] exclude-theme">
                        {color.name}
                      </span>
                      {isSelected && <span className="text-white text-xs">(Selected)</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Preview */}
        <div className="mt-6 p-6 bg-slate-950 border border-slate-800 text-center">
          <p className="text-sm text-slate-500 mb-2 uppercase tracking-widest">Live Text Preview</p>
          <h1 
            className="text-3xl sm:text-4xl font-bold font-mono tracking-wide"
            style={
              activeColor.includes('gradient') || activeColor.includes('linear-gradient')
                ? {
                    backgroundImage: activeColor,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    color: 'transparent'
                  }
                : { color: activeColor || '#f1f5f9' }
            }
          >
            velocitype text
          </h1>
        </div>
      </div>
    </div>
  );
}