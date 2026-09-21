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
  const [myTripActive, setMyTripActive] = useState(false);
  const [myDyslexiaActive, setMyDyslexiaActive] = useState(false);
  const [myBlinkActive, setMyBlinkActive] = useState(false);
  const [myScrewedActive, setMyScrewedActive] = useState(false);

  // Opponent states
  const [oppTripActive, setOppTripActive] = useState(false);
  const [oppDyslexiaActive, setOppDyslexiaActive] = useState(false);
  const [oppBlinkActive, setOppBlinkActive] = useState(false);
  const [oppScrewedActive, setOppScrewedActive] = useState(false);

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
      if (oppScrewedActive) {
        setTargetText(applyScrewedEffects(baseTargetText, 3, 'e') + ' ');
      } else {
        setTargetText(baseTargetText);
      }
    }
  }, [oppScrewedActive, baseTargetText]);

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
          <div className="absolute top-0 left-0 w-full p-4 bg-slate-900/80 border-b border-slate-800 flex justify-center gap-6 z-40 backdrop-blur-md">
             <div className="text-xs text-slate-500 uppercase tracking-widest mr-4">My Screen</div>
             <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={myTripActive} onChange={e => setMyTripActive(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
              <span className="font-mono text-sm uppercase tracking-widest text-slate-300">Shrooms</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={myDyslexiaActive} onChange={e => setMyDyslexiaActive(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
              <span className="font-mono text-sm uppercase tracking-widest text-slate-300">Dyslexia</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={myBlinkActive} onChange={e => setMyBlinkActive(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
              <span className="font-mono text-sm uppercase tracking-widest text-slate-300">Blinking</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={myScrewedActive} onChange={e => setMyScrewedActive(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
              <span className="font-mono text-sm uppercase tracking-widest text-slate-300">Screwed (3 upg)</span>
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
              dyslexiaActive={myDyslexiaActive}
              tripActive={myTripActive}
              blinkActive={myBlinkActive}
              characters={["mushgirl", ...(myScrewedActive ? ["screwed"] : [])]}
            />
          </div>
        </div>

        {/* OPPONENT SIDE */}
        <div className="flex-1 flex flex-col h-full relative">
          <div className="absolute top-0 left-0 w-full p-4 bg-slate-900/80 border-b border-slate-800 flex justify-center gap-6 z-40 backdrop-blur-md">
             <div className="text-xs text-slate-500 uppercase tracking-widest mr-4">Opponent Screen</div>
             <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={oppTripActive} onChange={e => setOppTripActive(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
              <span className="font-mono text-sm uppercase tracking-widest text-slate-300">Shrooms</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={oppDyslexiaActive} onChange={e => setOppDyslexiaActive(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
              <span className="font-mono text-sm uppercase tracking-widest text-slate-300">Dyslexia</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={oppBlinkActive} onChange={e => setOppBlinkActive(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
              <span className="font-mono text-sm uppercase tracking-widest text-slate-300">Blinking</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={oppScrewedActive} onChange={e => setOppScrewedActive(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
              <span className="font-mono text-sm uppercase tracking-widest text-slate-300">Screwed (3 upg)</span>
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
              dyslexiaActive={oppDyslexiaActive}
              tripActive={oppTripActive}
              blinkActive={oppBlinkActive}
              characters={["mushgirl", ...(oppScrewedActive ? ["screwed"] : [])]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
