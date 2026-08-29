import React, { useState, useEffect } from 'react';
import { getLayoutConfig, saveLayoutConfig, LayoutConfig } from '@/lib/layoutConfig';
import LiveKeyboard from './LiveKeyboard';

interface Props {
  onClose: () => void;
}

export default function ConfigureModal({ onClose }: Props) {
  const [config, setConfig] = useState<LayoutConfig>(getLayoutConfig());

  useEffect(() => {
    saveLayoutConfig(config);
    // Dispatch a custom event so other components (like App or SetupScreen) could know if they cared,
    // but typically GameScreen reads this on mount.
    window.dispatchEvent(new Event('layoutConfigChanged'));
  }, [config]);

  // Preview dummy text
  const dummyText = "this is a preview of the sentences mode layout configuration. you can adjust the sliders to change how the game looks. the keyboard will also resize.";
  const typedText = "this is a preview of ";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      {/* Full Screen Container */}
      <div className="relative w-full h-full flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Side: Preview Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-background">
          <div className="absolute top-4 left-4 text-xs font-mono text-slate-500 uppercase tracking-widest z-10">Preview</div>
          
          <div className={`flex-1 min-h-0 w-full flex flex-col items-${config.boxAlign === 'left' ? 'start' : config.boxAlign === 'right' ? 'end' : 'center'} justify-center p-8`}>
            
            <div
              className={`relative transition-colors duration-150 select-none font-mono tracking-wide ${config.textAlign === 'center' ? 'text-center' : config.textAlign === 'right' ? 'text-right' : 'text-left'} ${
                config.showBox ? 'bg-[#15171e]/50 border border-slate-800/80 rounded-2xl shadow-xl px-8 py-8 md:px-12 md:py-10' : ''
              }`}
              style={{ 
                fontSize: `${config.fontSize}px`,
                maxWidth: `${config.maxChars}ch`,
                width: '100%'
              }}
            >
              <div 
                className="overflow-hidden relative"
                style={{ 
                  height: `${config.numLines * 1.6}em`, 
                  lineHeight: 1.6,
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
                  maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)'
                }}
              >
                <div className="relative" style={{ whiteSpace: 'pre-wrap' }}>
                  {/* Fake Caret */}
                  <span
                    className="absolute -translate-y-1/2 w-[3px] h-[1em] bg-[var(--hot)] rounded-full animate-caret"
                    style={{ left: '0', top: '0', opacity: 0 }} // Simplified for preview
                  />
                  {dummyText.split('').map((char, i) => {
                    let color = 'text-slate-500';
                    if (i < typedText.length) {
                      color = 'text-[var(--hot)]';
                    } else if (i === typedText.length) {
                      color = 'text-slate-100 bg-slate-800/50';
                    }
                    return <span key={i} className={color}>{char}</span>;
                  })}
                </div>
              </div>
            </div>

            <div 
              className="w-full mt-auto pt-8 transition-transform duration-300"
              style={{ transform: `scale(${config.keyboardScale})`, transformOrigin: 'bottom center' }}
            >
              <LiveKeyboard activeKeys={new Set(['S', 'P', 'A', 'C', 'E'])} />
            </div>

          </div>
        </div>

        {/* Right Side: Controls */}
        <div className="w-full md:w-80 bg-slate-950 border-l border-slate-800 p-6 flex flex-col gap-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-display text-[var(--hot)] uppercase tracking-widest">Layout</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
          </div>

          {/* Font Size */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-widest flex justify-between">
              <span>Font Size</span>
              <span className="text-[var(--hot)]">{config.fontSize}px</span>
            </label>
            <input 
              type="range" min="14" max="64" step="1" 
              value={config.fontSize}
              onChange={e => setConfig({...config, fontSize: parseInt(e.target.value)})}
              className="accent-[var(--hot)]"
            />
          </div>

          {/* Max Characters per line */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-widest flex justify-between">
              <span>Width Limit</span>
              <span className="text-[var(--hot)]">{config.maxChars}ch</span>
            </label>
            <input 
              type="range" min="10" max="150" step="5" 
              value={config.maxChars}
              onChange={e => setConfig({...config, maxChars: parseInt(e.target.value)})}
              className="accent-[var(--hot)]"
            />
          </div>

          {/* Number of Lines */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-widest flex justify-between">
              <span>Lines Visible</span>
              <span className="text-[var(--hot)]">{config.numLines}</span>
            </label>
            <input 
              type="range" min="1" max="10" step="1" 
              value={config.numLines}
              onChange={e => setConfig({...config, numLines: parseInt(e.target.value)})}
              className="accent-[var(--hot)]"
            />
          </div>

          {/* Keyboard Scale */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-widest flex justify-between">
              <span>Keyboard Size</span>
              <span className="text-[var(--hot)]">{Math.round(config.keyboardScale * 100)}%</span>
            </label>
            <input 
              type="range" min="0.4" max="1.5" step="0.05" 
              value={config.keyboardScale}
              onChange={e => setConfig({...config, keyboardScale: parseFloat(e.target.value)})}
              className="accent-[var(--hot)]"
            />
          </div>

          {/* Box Alignment */}
          <div className="flex flex-col gap-2 mt-2">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-widest">Container Alignment</label>
            <div className="flex gap-2">
              {['left', 'center', 'right'].map(a => (
                <button
                  key={a}
                  onClick={() => setConfig({...config, boxAlign: a as any})}
                  className={`flex-1 py-1 text-xs font-mono uppercase tracking-widest rounded border ${config.boxAlign === a ? 'bg-[var(--hot)] text-black border-[var(--hot)]' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Text Alignment */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-widest">Text Alignment</label>
            <div className="flex gap-2">
              {['left', 'center', 'right'].map(a => (
                <button
                  key={a}
                  onClick={() => setConfig({...config, textAlign: a as any})}
                  className={`flex-1 py-1 text-xs font-mono uppercase tracking-widest rounded border ${config.textAlign === a ? 'bg-[var(--hot)] text-black border-[var(--hot)]' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Show Box Toggle */}
          <div className="flex flex-col gap-2 mt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox"
                checked={config.showBox}
                onChange={e => setConfig({...config, showBox: e.target.checked})}
                className="w-4 h-4 accent-[var(--hot)]"
              />
              <span className="text-sm font-mono text-slate-300 uppercase tracking-widest">Show Box Background</span>
            </label>
          </div>

        </div>
      </div>
    </div>
  );
}
