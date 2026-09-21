import React, { useState, useEffect } from 'react';
import { RankedPlayerArea } from './RankedMode';
import { generateSentences } from '@/lib/quotes';
import { useAuth } from '../contexts/AuthContext';



interface RankedSandboxProps {
  onBack: () => void;
}

export default function RankedSandbox({ onBack }: RankedSandboxProps) {
  const { user } = useAuth();
  const [tripActive, setTripActive] = useState(false);
  const [dyslexiaActive, setDyslexiaActive] = useState(false);
  const [blinkActive, setBlinkActive] = useState(false);

  const [typedText, setTypedText] = useState('');
  const [targetText, setTargetText] = useState('generating text please wait... ');
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    generateSentences('', ['top', 'home', 'bottom'], 3, 12, 30, '').then(words => {
      setTargetText(words.join(' ') + ' ');
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length === 1) {
        e.preventDefault();
        setTypedText(prev => {
          let next = prev + e.key;
          if (next.length > targetText.length) next = next.slice(0, targetText.length);
          return next;
        });
        setActiveKeys(prev => {
          const s = new Set(prev);
          s.add(e.key.toUpperCase());
          return s;
        });
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setTypedText(prev => prev.slice(0, -1));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setActiveKeys(prev => {
        const s = new Set(prev);
        s.delete(e.key.toUpperCase());
        return s;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [targetText]);

  

  return (
    <div className="w-screen h-[100dvh] flex flex-col bg-background overflow-hidden relative">
      <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-950/50">
        <button 
          onClick={onBack}
          className="text-slate-400 hover:text-white uppercase tracking-widest text-sm font-mono transition-colors flex items-center gap-2"
        >
          <span>&larr;</span> Exit Sandbox
        </button>
        <div className="font-mono text-xs text-[var(--hot)] uppercase tracking-widest">
          Ranked Test Mode
        </div>
      </div>

      <div className="p-6 bg-slate-900 border-b border-slate-800 flex justify-center gap-8">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={tripActive} onChange={e => setTripActive(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
          <span className="font-mono text-sm uppercase tracking-widest text-slate-300">Shrooms</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={dyslexiaActive} onChange={e => setDyslexiaActive(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
          <span className="font-mono text-sm uppercase tracking-widest text-slate-300">Dyslexia</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={blinkActive} onChange={e => setBlinkActive(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
          <span className="font-mono text-sm uppercase tracking-widest text-slate-300">Blinking</span>
        </label>
      </div>

      <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col pt-8">
        <RankedPlayerArea
          label={user?.username || "Player"}
          wpm={120}
          progress={(typedText.length / Math.max(1, targetText.length)) * 100}
          targetText={targetText}
          typedText={typedText}
          activeKeys={activeKeys}
          gameState="playing"
          isOpponent={false}
          colorTheme={undefined}
          charge={100}
          dyslexiaActive={dyslexiaActive}
          tripActive={tripActive}
          blinkActive={blinkActive}
          characters={["mushgirl"]}
        />
      </div>
    </div>
  );
}
