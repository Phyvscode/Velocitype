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
  const selectedCharacters = ['mushgirl', 'screwed', 'joker', 'gravity', 'moneyguy'];
  const [myShrooms, setMyShrooms] = useState(false);
  const [myDyslexia, setMyDyslexia] = useState(false);
  const [myBlink, setMyBlink] = useState(false);

  const [gravity1Triggered, setGravity1Triggered] = useState(0);
  const [showGravityPopup, setShowGravityPopup] = useState(false);
  const [gravityEscapesNeeded, setGravityEscapesNeeded] = useState(1);
  const lastGravityTickRef = React.useRef(0);

  
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    setStartTime(Date.now());
  }, []);

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) return 120;
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `0${m}:${ss < 10 ? '0' : ''}${ss}`;
  };

  const [myWpm, setMyWpm] = useState(0);
  const [oppWpm, setOppWpm] = useState(0);

  const [myCia, setMyCia] = useState<{c: number, i: number, a: number}>({c: 0, i: 0, a: 0});
  const [oppCia, setOppCia] = useState<{c: number, i: number, a: number}>({c: 0, i: 0, a: 0});


  const [mySequence, setMySequence] = useState<string[]>([]);

  const [oppShrooms, setOppShrooms] = useState(false);
  const [oppDyslexia, setOppDyslexia] = useState(false);
  const [oppBlink, setOppBlink] = useState(false);
  
  const [myGravity1, setMyGravity1] = useState(false);
  const [myGravity2, setMyGravity2] = useState(false);
  const [myGravity3, setMyGravity3] = useState(false);
  const [oppGravity1, setOppGravity1] = useState(false);
  const [oppGravity2, setOppGravity2] = useState(false);
  const [oppGravity3, setOppGravity3] = useState(false);
  const [gravity1Count, setGravity1Count] = useState(0);
  const [oppSequence, setOppSequence] = useState<string[]>([]);
  
  const toggleSeq = (seq: string[], setSeq: React.Dispatch<React.SetStateAction<string[]>>, name: string) => {
    if (seq.includes(name)) setSeq(seq.filter(n => n !== name));
    else setSeq([...seq, name]);
  };

  const [typedText, setTypedText] = useState('');
  const [myTargetText, setMyTargetText] = useState('generating text please wait... ');
  const [oppTargetText, setOppTargetText] = useState('generating text please wait... ');
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  
  // For opponent, we'll auto-type
  const [oppTypedText, setOppTypedText] = useState('');
  
  const [baseTargetText, setBaseTargetText] = useState('generating text please wait... ');

  // Auto-typing bot
  useEffect(() => {
    if (!startTime) return;
    const botInterval = setInterval(() => {
      setOppTypedText(prev => {
        if (prev.length >= oppTargetText.length) {
          clearInterval(botInterval);
          return prev;
        }
        const char = oppTargetText[prev.length];
        if (Math.random() < 0.15) { // 15% typo chance
          let typo = String.fromCharCode(97 + Math.floor(Math.random() * 26));
          if (typo === char) typo = 'x';
          return prev + typo;
        }
        return prev + char;
      });
    }, 150);
    return () => clearInterval(botInterval);
  }, [startTime, oppTargetText]);


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
      let myText = applyScrewedEffects(baseTargetText, mySequence, 'e') + ' ';
      setMyTargetText(myText);

      // Opp abilities affect OPP target text (sandbox logic: testing on bot)
      let oppText = applyScrewedEffects(baseTargetText, oppSequence, 'e') + ' ';
      setOppTargetText(oppText);
    }
  }, [mySequence, oppSequence, baseTargetText]);

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
    if (showGravityPopup) {
      if (e.ctrlKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        setShowGravityPopup(false);
      }
      return;
    }
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

      <div className="flex-1 w-full flex h-full relative">
        {/* Global Timer Overlay */}
        <div className="absolute top-0 w-full p-4 flex justify-between items-center z-50 pointer-events-none">
          <div className="flex-1" />
          {mySequence.includes('joker3') ? (
            <div className="font-mono text-xl tracking-widest text-slate-600 uppercase">???</div>
          ) : (
            <div className="font-mono text-2xl tracking-widest text-emerald-400">
              {formatTime(timeLeft)}
            </div>
          )}
          <div className="flex-1 flex justify-end"></div>
        </div>

        {/* PLAYER SIDE */}
        <div className="flex-1 border-r border-slate-800/50 flex flex-col h-full relative">
          <div className="absolute bottom-0 left-0 w-full p-4 bg-slate-900/80 border-t border-slate-800 flex flex-wrap items-center justify-center gap-4 z-40 backdrop-blur-md">
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
              <input type="checkbox" checked={mySequence.includes('scramble')} onChange={() => toggleSeq(mySequence, setMySequence, 'scramble')} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Scramble</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={mySequence.includes('sabotage')} onChange={() => toggleSeq(mySequence, setMySequence, 'sabotage')} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Sabotage</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={mySequence.includes('spam')} onChange={() => toggleSeq(mySequence, setMySequence, 'spam')} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Spam</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={mySequence.includes('joker1')} onChange={() => toggleSeq(mySequence, setMySequence, 'joker1')} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Delusion</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={mySequence.includes('joker2')} onChange={() => toggleSeq(mySequence, setMySequence, 'joker2')} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Blindness</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={mySequence.includes('joker3')} onChange={() => toggleSeq(mySequence, setMySequence, 'joker3')} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Amnesia</span>
            </label>
          </div>
          
                <div className="flex-1 pt-12 pb-24 px-8 overflow-hidden flex flex-col">

      {/* Bottom Stats & Right Side Characters */}
      {gameState === 'playing' && (
        <>
          {/* Bottom Bar: Stats */}
          <div className="fixed bottom-0 left-0 w-full px-12 py-6 flex justify-between items-end pointer-events-none z-30 bg-gradient-to-t from-background via-background/80 to-transparent">
            {/* My Stats */}
            <div className="flex flex-col gap-2 pointer-events-auto">
              <h3 className="font-display text-xl text-[var(--hot)] tracking-widest uppercase">You</h3>
              {(!oppSequence.includes('joker2')) && (
                <div className="font-mono text-3xl text-white tracking-widest">{myWpm} <span className="text-sm text-slate-500">WPM</span></div>
              )}
              {myCia && (
                <div className="font-mono text-sm text-slate-400 tracking-widest">
                  <span className="text-emerald-400">{myCia.c}</span>/
                  <span className="text-red-500">{myCia.i}</span>/
                  <span className="text-amber-400">{myCia.a}</span>
                </div>
              )}
              <div className="font-mono text-xs text-slate-500">100% Charge</div>
            </div>

            {/* Opponent Stats */}
            <div className="flex flex-col gap-2 text-right pointer-events-auto">
              <h3 className="font-display text-xl text-red-500 tracking-widest uppercase">Opponent</h3>
              {(!mySequence.includes('joker2')) && (
                <div className="font-mono text-3xl text-white tracking-widest">{oppWpm} <span className="text-sm text-slate-500">WPM</span></div>
              )}
              {oppCia && (
                <div className="font-mono text-sm text-slate-400 tracking-widest">
                  <span className="text-emerald-400">{oppCia.c}</span>/
                  <span className="text-red-500">{oppCia.i}</span>/
                  <span className="text-amber-400">{oppCia.a}</span>
                </div>
              )}
              <div className="font-mono text-xs text-slate-500">100% Charge</div>
            </div>
          </div>

          {/* Right Side Characters */}
          <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 pointer-events-none z-40 max-h-screen overflow-hidden justify-center">
            {/* Opponent Characters */}
            {selectedCharacters.map((charId, idx) => (
              <div key={'opp-'+idx} className="w-20 h-20 rounded-full border-4 border-red-500/50 bg-red-900/20 overflow-hidden flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                <AnimatedCharacter id={charId} className="h-28 object-cover mt-4" />
              </div>
            ))}
            
            {/* My Characters */}
            {selectedCharacters.map((charId, idx) => (
              <div key={'my-'+idx} className="w-20 h-20 rounded-full border-4 border-[var(--hot)]/50 bg-[var(--hot)]/10 overflow-hidden flex items-center justify-center shadow-[0_0_10px_var(--color-hot-soft)]">
                <AnimatedCharacter id={charId} className="h-28 object-cover mt-4" />
              </div>
            ))}
          </div>
        </>
      )}

            <RankedPlayerArea
              label={user?.username || "Player"}
              wpm={myWpm}
              cia={myCia}
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
              characters={['mushgirl', 'screwed', 'joker', 'gravity']}
            />
          </div>
        </div>

        
      {showGravityPopup && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto">
           <div className="bg-red-950 border border-red-500 p-8 rounded-xl shadow-[0_0_50px_rgba(239,68,68,0.5)] text-center animate-bounce">
              <h2 className="text-3xl text-red-500 font-display uppercase tracking-widest mb-4">Black Hole Sabotage!</h2>
              <p className="text-red-200 font-mono text-sm tracking-widest mb-4">You have been sucked into a gravity well!</p>
              {gravityEscapesNeeded > 1 ? <p className="text-white font-mono font-bold tracking-widest bg-red-900/50 p-4 rounded">Press CTRL + X to escape ({gravityEscapesNeeded} times left!)</p> : <p className="text-white font-mono font-bold tracking-widest bg-red-900/50 p-4 rounded">Press CTRL + X to escape</p>}
           </div>
        </div>
      )}
{/* OPPONENT SIDE HIDDEN */}
</div>
    </div>
  );
}
