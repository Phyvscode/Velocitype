import React, { useState, useEffect, useRef } from 'react';
import { getLayoutConfig, saveLayoutConfig, LayoutConfig, DEFAULT_CONFIG } from '@/lib/layoutConfig';
import LiveKeyboard from './LiveKeyboard';

export default function ConfigureModal() {
  const [config, setConfig] = useState<LayoutConfig>(getLayoutConfig());

  useEffect(() => {
    saveLayoutConfig(config);
    // Dispatch a custom event so other components (like App or SetupScreen) could know if they cared,
    // but typically GameScreen reads this on mount.
    window.dispatchEvent(new Event('layoutConfigChanged'));
  }, [config]);

  // Dragging state
  // Dragging state for Box
  const [isDraggingBox, setIsDraggingBox] = useState(false);
  const dragStartPosBox = useRef({ x: 0, y: 0 });
  const dragStartOffsetBox = useRef({ x: 0, y: 0 });

  const handlePointerDownBox = (e: React.PointerEvent) => {
    setIsDraggingBox(true);
    dragStartPosBox.current = { x: e.clientX, y: e.clientY };
    dragStartOffsetBox.current = { x: config.boxOffsetX || 0, y: config.boxOffsetY || 0 };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveBox = (e: React.PointerEvent) => {
    if (!isDraggingBox) return;
    const dx = e.clientX - dragStartPosBox.current.x;
    const dy = e.clientY - dragStartPosBox.current.y;
    setConfig({
      ...config,
      boxOffsetX: dragStartOffsetBox.current.x + dx,
      boxOffsetY: dragStartOffsetBox.current.y + dy
    });
  };

  const handlePointerUpBox = (e: React.PointerEvent) => {
    setIsDraggingBox(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // Dragging state for Keyboard
  const [isDraggingKb, setIsDraggingKb] = useState(false);
  const dragStartPosKb = useRef({ x: 0, y: 0 });
  const dragStartOffsetKb = useRef({ x: 0, y: 0 });

  const handlePointerDownKb = (e: React.PointerEvent) => {
    setIsDraggingKb(true);
    dragStartPosKb.current = { x: e.clientX, y: e.clientY };
    dragStartOffsetKb.current = { x: config.keyboardOffsetX || 0, y: config.keyboardOffsetY || 0 };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveKb = (e: React.PointerEvent) => {
    if (!isDraggingKb) return;
    const dx = e.clientX - dragStartPosKb.current.x;
    const dy = e.clientY - dragStartPosKb.current.y;
    setConfig({
      ...config,
      keyboardOffsetX: dragStartOffsetKb.current.x + dx,
      keyboardOffsetY: dragStartOffsetKb.current.y + dy
    });
  };

  const handlePointerUpKb = (e: React.PointerEvent) => {
    setIsDraggingKb(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const [isDraggingQuit, setIsDraggingQuit] = useState(false);
  const dragStartPosQuit = useRef({ x: 0, y: 0 });
  const dragStartOffsetQuit = useRef({ x: 0, y: 0 });

  const handlePointerDownQuit = (e: React.PointerEvent) => {
    setIsDraggingQuit(true);
    dragStartPosQuit.current = { x: e.clientX, y: e.clientY };
    dragStartOffsetQuit.current = { x: config.quitOffsetX || 0, y: config.quitOffsetY || 0 };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveQuit = (e: React.PointerEvent) => {
    if (!isDraggingQuit) return;
    const dx = e.clientX - dragStartPosQuit.current.x;
    const dy = e.clientY - dragStartPosQuit.current.y;
    setConfig({
      ...config,
      quitOffsetX: dragStartOffsetQuit.current.x + dx,
      quitOffsetY: dragStartOffsetQuit.current.y + dy
    });
  };

  const handlePointerUpQuit = (e: React.PointerEvent) => {
    setIsDraggingQuit(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const [showSidebar, setShowSidebar] = useState(false);

  // Preview dummy text
  const dummyText = "this is a preview of the sentences mode layout configuration. you can adjust the sliders to change how the game looks. the keyboard will also resize.";
  const typedText = "this is a preview of ";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="relative w-full h-full overflow-hidden">
        
        {/* Left Side: Preview Area */}
        <div className="absolute inset-0 flex flex-col overflow-hidden bg-background">
          
          {!showSidebar && (
            <div className="absolute top-4 right-4 z-10">
              <button 
                onClick={() => setShowSidebar(true)} 
                className="text-xs font-mono text-[var(--hot)] hover:text-[var(--hot)]/80 uppercase tracking-widest flex items-center gap-2 border border-[var(--hot)] px-4 py-2 bg-[var(--hot)]/10 transition-colors"
              >
                Layout Configurations
              </button>
            </div>
          )}

          <header className="w-full flex-none px-4 sm:px-8 py-[clamp(8px,2vh,24px)] flex items-center justify-between pointer-events-auto">
            <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
              <div 
                className={`relative ${isDraggingQuit ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{ 
                  transform: `translate(${config.quitOffsetX || 0}px, ${config.quitOffsetY || 0}px)`,
                  touchAction: 'none'
                }}
                onPointerDown={handlePointerDownQuit}
                onPointerMove={handlePointerMoveQuit}
                onPointerUp={handlePointerUpQuit}
                onPointerCancel={handlePointerUpQuit}
              >
                <div className="text-sm font-mono text-slate-400 uppercase tracking-widest pointer-events-none">
                  &larr; Quit
                </div>
              </div>
            </div>
          </header>
          
          <main className={`flex-1 min-h-0 w-full flex flex-col ${config.boxAlign === 'left' ? 'items-start' : config.boxAlign === 'right' ? 'items-end' : 'items-center'} justify-center overflow-visible`}>
            <div
              onPointerDown={handlePointerDownBox}
              onPointerMove={handlePointerMoveBox}
              onPointerUp={handlePointerUpBox}
              onPointerCancel={handlePointerUpBox}
              className={`relative transition-colors duration-150 select-none font-mono tracking-wide px-8 py-8 md:px-12 md:py-10 ${config.textAlign === 'center' ? 'text-center' : config.textAlign === 'right' ? 'text-right' : 'text-left'} ${
                config.showBox ? 'bg-[#15171e]/50 border border-slate-800/80 rounded-2xl shadow-xl' : 'border border-transparent'
              } ${isDraggingBox ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{ 
                fontSize: `${config.fontSize}px`,
                maxWidth: `${config.maxChars}ch`,
                transform: `translate(${config.boxOffsetX || 0}px, ${config.boxOffsetY || 0}px)`,
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
          </main>

          <footer className="w-full max-w-7xl mx-auto flex-none px-4 sm:px-12 pb-8 pt-4 flex items-center justify-between min-h-0">
            {config.showKeyboard && (
              <div 
                onPointerDown={handlePointerDownKb}
                onPointerMove={handlePointerMoveKb}
                onPointerUp={handlePointerUpKb}
                onPointerCancel={handlePointerUpKb}
                className={`w-full max-w-[800px] perspective-[1200px] ${isDraggingKb ? 'cursor-grabbing' : 'transition-transform duration-300 cursor-grab'}`}
                style={{ 
                  transform: `translate(calc(-6rem + ${config.keyboardOffsetX || 0}px), calc(120px + ${config.keyboardOffsetY || 0}px)) scale(${config.keyboardScale})`, 
                  transformOrigin: 'bottom left' 
                }}
              >
                <div className="pointer-events-none">
                  <LiveKeyboard activeKeys={new Set(['S', 'P', 'A', 'C', 'E'])} />
                </div>
              </div>
            )}
            <div className="flex flex-col items-center gap-2 flex-none translate-y-[40px] ml-auto translate-x-24">
               {/* Dummy Hourglass placeholder to maintain flex spacing */}
               <div className="w-[80px] h-[80px] opacity-20 border-2 border-dashed border-slate-500 rounded-full flex items-center justify-center text-xs">Timer</div>
            </div>
          </footer>
        </div>

        {/* Right Side: Controls */}
        {showSidebar && (
          <div className="absolute right-0 top-0 bottom-0 z-50 w-full md:w-80 bg-transparent p-6 flex flex-col gap-6 overflow-y-auto pointer-events-auto">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-display text-[var(--hot)] uppercase tracking-widest">Layout</h2>
              <button 
                onClick={() => setShowSidebar(false)} 
                className="text-slate-400 hover:text-white transition-colors text-2xl leading-none"
              >
                &times;
              </button>
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

          {/* Position X */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-widest flex justify-between">
              <span>X Offset</span>
              <span className="text-[var(--hot)]">{config.boxOffsetX || 0}px</span>
            </label>
            <input 
              type="range" min="-800" max="800" step="10" 
              value={config.boxOffsetX || 0}
              onChange={e => setConfig({...config, boxOffsetX: parseInt(e.target.value)})}
              className="accent-[var(--hot)]"
            />
          </div>

          {/* Position Y */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-widest flex justify-between">
              <span>Y Offset</span>
              <span className="text-[var(--hot)]">{config.boxOffsetY || 0}px</span>
            </label>
            <input 
              type="range" min="-800" max="800" step="10" 
              value={config.boxOffsetY || 0}
              onChange={e => setConfig({...config, boxOffsetY: parseInt(e.target.value)})}
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

          {/* Show Keyboard Toggle */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox"
                checked={config.showKeyboard ?? true}
                onChange={e => setConfig({...config, showKeyboard: e.target.checked})}
                className="w-4 h-4 accent-[var(--hot)]"
              />
              <span className="text-sm font-mono text-slate-300 uppercase tracking-widest">Show Live Keyboard</span>
            </label>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800">
            <button 
              onClick={() => setConfig(DEFAULT_CONFIG)}
              className="w-full py-2.5 text-xs font-mono uppercase tracking-widest text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded transition-colors"
            >
              Reset to Defaults
            </button>
          </div>

        </div>
        )}
      </div>
    </div>
  );
}
