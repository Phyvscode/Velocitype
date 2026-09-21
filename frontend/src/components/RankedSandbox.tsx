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
  const [myShrooms, setMyShrooms] = useState(false);
  const [myDyslexia, setMyDyslexia] = useState(false);
  const [myBlink, setMyBlink] = useState(false);
  const [myScramble, setMyScramble] = useState(false);
  const [mySabotage, setMySabotage] = useState(false);
  const [mySpam, setMySpam] = useState(false);

  const [oppShrooms, setOppShrooms] = useState(false);
  const [oppDyslexia, setOppDyslexia] = useState(false);
  const [oppBlink, setOppBlink] = useState(false);
  const [oppScramble, setOppScramble] = useState(false);
  const [oppSabotage, setOppSabotage] = useState(false);
  const [oppSpam, setOppSpam] = useState(false);

  const [typedText, setTypedText] = useState('');
  const [myTargetText, setMyTargetText] = useState('generating text please wait... ');
  const [oppTargetText, setOppTargetText] = useState('generating text please wait... ');
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  
  // For opponent, we'll auto-type
  const [oppTypedText, setOppTypedText] = useState('');
  
  const [baseTargetText, setBaseTargetText] = useState('generating text please wait... ');

  useEffect(() => {
    generateSentences('', ['top', 'home', 'bottom'], 3, 12, 30, '').then(words => {
      const t = words.join(' ') + ' ';
      setBaseTargetText(t);
      setMyTargetText(t);
      setOppTargetText(t);
    });
  }, []);

  useEffect(() => {
    if (!baseTargetText.startsWith('generating')) {
      // My abilities affect MY target text (sandbox logic: testing on myself)
      let myText = applyScrewedEffects(baseTargetText, { scramble: myScramble, sabotage: mySabotage, spam: mySpam }, 'e') + ' ';
      setMyTargetText(myText);

      // Opp abilities affect OPP target text (sandbox logic: testing on bot)
      let oppText = applyScrewedEffects(baseTargetText, { scramble: oppScramble, sabotage: oppSabotage, spam: oppSpam }, 'e') + ' ';
      setOppTargetText(oppText);
    }
  }, [myScramble, mySabotage, mySpam, oppScramble, oppSabotage, oppSpam, baseTargetText]);

  // Opponent auto-typing loop
  useEffect(() => {
    if (oppTargetText.startsWith('generating')) return;
    const interval = setInterval(() => {
      setOppTypedText(prev => {
        if (prev.length >= oppTargetText.length) return prev;
        return prev + oppTargetText[prev.length];
      });
    }, 150); // ~80 WPM
    return () => clearInterval(interval);
  }, [oppTargetText]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length === 1) {
        e.preventDefault();
        setTypedText(prev => {
          let next = prev + e.key;
          if (next.length > myTargetText.length) next = next.slice(0, myTargetText.length);
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
  }, [myTargetText]);

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
          <div className="absolute top-0 left-0 w-full p-4 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-center gap-4 z-40 backdrop-blur-md">
             <div className="text-xs text-[var(--hot)] uppercase tracking-widest mr-2 font-bold">My Screen</div>
             <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={myShrooms} onChange={e => setMyShrooms(e.target.checked)} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Shrooms</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={myDyslexia} onChange={e => setMyDyslexia(e.target.checked)} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Dyslexia</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={myBlink} onChange={e => setMyBlink(e.target.checked)} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Blinking</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={myScramble} onChange={e => setMyScramble(e.target.checked)} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Scramble</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={mySabotage} onChange={e => setMySabotage(e.target.checked)} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Sabotage</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={mySpam} onChange={e => setMySpam(e.target.checked)} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Spam</span>
            </label>
          </div>
          <div className="flex-1 pt-24 px-8 overflow-hidden flex flex-col">
            <RankedPlayerArea
              label={user?.username || "Player"}
              wpm={120}
              progress={(typedText.length / Math.max(1, myTargetText.length)) * 100}
              targetText={myTargetText}
              typedText={typedText}
              activeKeys={activeKeys}
              gameState="playing"
              isOpponent={false}
              colorTheme={undefined}
              charge={100}
              dyslexiaActive={myDyslexia}
              tripActive={myShrooms}
              blinkActive={myBlink}
              characters={['mushgirl', 'screwed']}
            />
          </div>
        </div>

        {/* OPPONENT SIDE */}
        <div className="flex-1 flex flex-col h-full relative">
          <div className="absolute top-0 left-0 w-full p-4 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-center gap-4 z-40 backdrop-blur-md">
             <div className="text-xs text-slate-500 uppercase tracking-widest mr-2 font-bold">Bot Screen</div>
             <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={oppShrooms} onChange={e => setOppShrooms(e.target.checked)} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Shrooms</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={oppDyslexia} onChange={e => setOppDyslexia(e.target.checked)} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Dyslexia</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={oppBlink} onChange={e => setOppBlink(e.target.checked)} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Blinking</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={oppScramble} onChange={e => setOppScramble(e.target.checked)} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Scramble</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={oppSabotage} onChange={e => setOppSabotage(e.target.checked)} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Sabotage</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={oppSpam} onChange={e => setOppSpam(e.target.checked)} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Spam</span>
            </label>
          </div>
          <div className="flex-1 pt-24 px-8 overflow-hidden flex flex-col">
            <RankedPlayerArea
              label="Bot"
              wpm={80}
              progress={(oppTypedText.length / Math.max(1, oppTargetText.length)) * 100}
              targetText={oppTargetText}
              typedText={oppTypedText}
              activeKeys={new Set()}
              gameState="playing"
              isOpponent={true}
              colorTheme={undefined}
              charge={100}
              dyslexiaActive={oppDyslexia}
              tripActive={oppShrooms}
              blinkActive={oppBlink}
              characters={['mushgirl', 'screwed']}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
