import React, { useState, useEffect } from 'react';
import { RankedPlayerArea } from './RankedMode';
import { generateSentences } from "@/lib/quotes";
import { applyScrewedEffects } from "@/lib/words";

import { useAuth } from '../contexts/AuthContext';

interface RankedSandboxProps {
  onBack: () => void;
}

export default function RankedSandbox({ onBack }: RankedSandboxProps) {
  const { user } = useAuth();
  
  // My states
  const [myChar, setMyChar] = useState('mushgirl');
  const [myUpg1, setMyUpg1] = useState(false);
  const [myUpg2, setMyUpg2] = useState(false);
  const [myUpg3, setMyUpg3] = useState(false);

  const [oppChar, setOppChar] = useState('mushgirl');
  const [oppUpg1, setOppUpg1] = useState(false);
  const [oppUpg2, setOppUpg2] = useState(false);
  const [oppUpg3, setOppUpg3] = useState(false);

  const [typedText, setTypedText] = useState('');
  const [targetText, setTargetText] = useState('generating text please wait... ');
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  
  // For opponent, we'll auto-type
  const [oppTypedText, setOppTypedText] = useState('');
  
  const [baseTargetText, setBaseTargetText] = useState('generating text please wait... ');

  useEffect(() => {
    generateSentences('', ['top', 'home', 'bottom'], 3, 12, 30, '').then(words => {
      const t = words.join(' ') + ' ';
      setBaseTargetText(t);
      setTargetText(t);
    });
  }, []);

  useEffect(() => {
    if (!baseTargetText.startsWith('generating')) {
      let text = baseTargetText;
      let upgrades = 0;
      if (oppUpg1) upgrades = 1;
      if (oppUpg2) upgrades = 2;
      if (oppUpg3) upgrades = 3;
      
      if (oppChar === 'screwed' && upgrades > 0) {
        text = applyScrewedEffects(baseTargetText, upgrades, 'e') + ' ';
      }
      setTargetText(text);
    }
  }, [oppChar, oppUpg1, oppUpg2, oppUpg3, baseTargetText]);

  // Opponent auto-typing loop
  useEffect(() => {
    if (targetText.startsWith('generating')) return;
    const interval = setInterval(() => {
      setOppTypedText(prev => {
        if (prev.length >= targetText.length) return prev;
        return prev + targetText[prev.length];
      });
    }, 150); // ~80 WPM
    return () => clearInterval(interval);
  }, [targetText]);

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
      <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-950/50 z-50">
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

      <div className="flex-1 w-full flex h-full">
        {/* PLAYER SIDE */}
        <div className="flex-1 border-r border-slate-800/50 flex flex-col h-full relative">
          <div className="absolute top-0 left-0 w-full p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-center gap-6 z-40 backdrop-blur-md">
             <div className="text-xs text-[var(--hot)] uppercase tracking-widest mr-4 font-bold flex items-center gap-3">
               My Screen:
               <select className="bg-slate-950 border border-slate-700 text-slate-200 p-1 text-xs outline-none focus:border-[var(--hot)]" value={myChar} onChange={e => setMyChar(e.target.value)}>
                 <option value="mushgirl">Mushgirl</option>
                 <option value="screwed">Screwed</option>
               </select>
             </div>
             <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={myUpg1} onChange={e => setMyUpg1(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
              <span className="font-mono text-sm uppercase tracking-widest text-slate-300">{myChar === 'mushgirl' ? 'Shrooms' : 'Scramble'}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={myUpg2} onChange={e => setMyUpg2(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
              <span className="font-mono text-sm uppercase tracking-widest text-slate-300">{myChar === 'mushgirl' ? 'Dyslexia' : 'Sabotage'}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={myUpg3} onChange={e => setMyUpg3(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
              <span className="font-mono text-sm uppercase tracking-widest text-slate-300">{myChar === 'mushgirl' ? 'Blinking' : 'Spam'}</span>
            </label>
          </div>
          <div className="flex-1 pt-24 px-8 overflow-hidden flex flex-col">
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
              dyslexiaActive={myChar === 'mushgirl' ? myUpg2 : false}
              tripActive={myChar === 'mushgirl' ? myUpg1 : false}
              blinkActive={myChar === 'mushgirl' ? myUpg3 : false}
              characters={[myChar]}
            />
          </div>
        </div>

        {/* OPPONENT SIDE */}
        <div className="flex-1 flex flex-col h-full relative">
          <div className="absolute top-0 left-0 w-full p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-center gap-6 z-40 backdrop-blur-md">
             <div className="text-xs text-slate-500 uppercase tracking-widest mr-4 font-bold flex items-center gap-3">
               Bot Screen:
               <select className="bg-slate-950 border border-slate-700 text-slate-500 p-1 text-xs outline-none focus:border-slate-500" value={oppChar} onChange={e => setOppChar(e.target.value)}>
                 <option value="mushgirl">Mushgirl</option>
                 <option value="screwed">Screwed</option>
               </select>
             </div>
             <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={oppUpg1} onChange={e => setOppUpg1(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
              <span className="font-mono text-sm uppercase tracking-widest text-slate-300">{oppChar === 'mushgirl' ? 'Shrooms' : 'Scramble'}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={oppUpg2} onChange={e => setOppUpg2(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
              <span className="font-mono text-sm uppercase tracking-widest text-slate-300">{oppChar === 'mushgirl' ? 'Dyslexia' : 'Sabotage'}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={oppUpg3} onChange={e => setOppUpg3(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
              <span className="font-mono text-sm uppercase tracking-widest text-slate-300">{oppChar === 'mushgirl' ? 'Blinking' : 'Spam'}</span>
            </label>
          </div>
          <div className="flex-1 pt-24 px-8 overflow-hidden flex flex-col">
            <RankedPlayerArea
              label="Bot"
              wpm={80}
              progress={(oppTypedText.length / Math.max(1, targetText.length)) * 100}
              targetText={targetText}
              typedText={oppTypedText}
              activeKeys={new Set()}
              gameState="playing"
              isOpponent={true}
              colorTheme={undefined}
              charge={100}
              dyslexiaActive={oppChar === 'mushgirl' ? oppUpg2 : false}
              tripActive={oppChar === 'mushgirl' ? oppUpg1 : false}
              blinkActive={oppChar === 'mushgirl' ? oppUpg3 : false}
              characters={[oppChar]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
