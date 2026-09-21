import { AnimatedCharacter } from './AnimatedCharacter';
import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { LANGUAGES } from '@/lib/languages';
import { loadDictionary, DICTIONARY, applyScrewedEffects } from "@/lib/words";

import { generateSentences } from '@/lib/quotes';
import LiveKeyboard, { getKeyLabel } from '@/components/LiveKeyboard';
import '../trip.css';

interface RankedMatchData {
  matchId: string;
  language: string;
  role: 'host' | 'client';
  opponent: { 
    id: string; 
    username: string; 
    elo: number;
    colorTheme?: any;
    fontFamily?: string;
    bgTheme?: any;
    characters?: string[];
  };
}

interface RankedMatchState {
  currentRound: number;
  scores: Record<string, number>;
}

interface Props {
  onBack: () => void;
}

export interface RankedPlayerAreaProps {
  label: string;
  wpm: number;
  progress: number;
  targetText: string;
  typedText: string;
  activeKeys: Set<string>;
  gameState: string;
  isOpponent?: boolean;
  colorTheme?: any;
  fontFamily?: string;
  bgTheme?: any;
  cia?: {c: number, i: number, a: number} | null;
  charge: number;
  dyslexiaActive?: boolean;
  tripActive?: boolean;
  blinkActive?: boolean;
  characters?: string[];
}



const WarpFilter = React.memo(({ id }: { id: string }) => (
  <svg width="0" height="0" style={{position: 'absolute'}} aria-hidden="true" focusable="false">
    <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.006 0.010" numOctaves="2" seed="3" result="noise">
        <animate attributeName="baseFrequency" dur="12s" repeatCount="indefinite" values="0.006 0.010; 0.012 0.006; 0.006 0.010"/>
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </svg>
));


export function RankedPlayerArea({ label, wpm, progress, targetText, typedText, activeKeys, gameState, isOpponent, colorTheme, fontFamily, bgTheme, cia, charge, dyslexiaActive, tripActive, blinkActive, characters = [] }: RankedPlayerAreaProps) {
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [caretLeft, setCaretLeft] = useState(0);
  const [caretTop, setCaretTop] = useState(0);
  const [scrollLines, setScrollLines] = useState(0);
  const [tripLevel, setTripLevel] = useState(0);
  const [blinkStyle, setBlinkStyle] = useState("");
  const warpNowRef = useRef(0);
  const warpId = isOpponent ? "warp-opp" : "warp-me";
  const containerRef = useRef<HTMLDivElement>(null);

  const updateCaretPosition = useCallback(() => {
    if (letterRefs.current.length === 0 || !targetText) return;
    const nextIndex = Math.min(typedText.length, targetText.length - 1);
    let currentLine = 0;
    let lastTop = letterRefs.current[0]?.offsetTop || 0;
    for (let i = 1; i <= nextIndex; i++) {
      const el = letterRefs.current[i];
      if (el && el.offsetTop > lastTop + 10) {
        currentLine++;
        lastTop = el.offsetTop;
      }
    }
    setScrollLines(currentLine);

    const nextEl = letterRefs.current[nextIndex];
    if (nextEl) {
      if (typedText.length >= targetText.length) {
        setCaretLeft(nextEl.offsetLeft + nextEl.offsetWidth);
      } else {
        setCaretLeft(nextEl.offsetLeft);
      }
      setCaretTop(nextEl.offsetTop + nextEl.offsetHeight / 2);
    }
  }, [typedText, targetText]);

  
  
  useEffect(() => {
    if (!tripActive) {
      setTripLevel(0);
      return;
    }
    setTripLevel(1); // start at level 1 (or 0 internally, but let's say 1 to match data-level="1")
    let currentLevel = 0;
    
    const rollLevel = () => {
      const r = Math.random();
      if (r < 0.5) currentLevel = Math.min(2, currentLevel + 1);
      else currentLevel = Math.max(0, currentLevel - 1);
      
      setTripLevel(currentLevel + 1); // mapping 0,1,2 to data-level 1,2,3
    };
    
    const interval = setInterval(rollLevel, 3000);
    return () => clearInterval(interval);
  }, [tripActive]);

  
  useEffect(() => {
    if (!dyslexiaActive) return;
    const interval = setInterval(() => {
      if (!containerRef.current) return;
      const letters = Array.from(containerRef.current.querySelectorAll('.dyslexia-char')) as HTMLElement[];
      if (!letters.length) return;
      
      const n = 8 + Math.floor(Math.random() * 8); // 3 to 8 letters
      for (let i = 0; i < n; i++) {
        const ch = letters[Math.floor(Math.random() * letters.length)];
        if (ch.dataset.busy) continue;
        ch.dataset.busy = "1";
        
        const prop = Math.random() < 0.5 ? "--fy" : "--fx";
        ch.style.setProperty(prop, "-1");
        
        setTimeout(() => {
          ch.style.removeProperty(prop);
          delete ch.dataset.busy;
        }, 1200 + Math.random() * 1400); // 1.2s to 2.6s
      }
    }, 700);
    
    return () => clearInterval(interval);
  }, [dyslexiaActive]);


  useEffect(() => {
    if (!blinkActive) {
      setBlinkStyle('');
      return;
    }
    const STYLES = ['blinking', 'flickering'];
    let active = false;
    
    const rollBlink = () => {
      if (active) return;
      if (Math.random() < 0.3) {
        active = true;
        const style = STYLES[Math.floor(Math.random() * STYLES.length)];
        setBlinkStyle(style);
        setTimeout(() => {
          setBlinkStyle('');
          active = false;
        }, 5000); // Wait enough time for either animation to finish (flicker is 5s, blink is 2s)
      }
    };
    
    const interval = setInterval(rollBlink, 2000);
    return () => clearInterval(interval);
  }, [blinkActive]);



  
  
  useEffect(() => {
    // 0 = 0, 1 = 0.35, 2 = 0.7, 3 = 1.0
    const multipliers = [0, 0.35, 0.7, 1];
    const targetScale = tripActive ? 16 * (multipliers[tripLevel] || 0) : 0;
    
    const warpTarget = targetScale;
    let warpRaf: any;
    const warpEl = containerRef.current?.querySelector('feDisplacementMap');
    
    const tweenWarp = () => {
      if (!warpEl) return;
      warpNowRef.current += (warpTarget - warpNowRef.current) * 0.04;
      if (Math.abs(warpTarget - warpNowRef.current) < 0.05) warpNowRef.current = warpTarget;
      warpEl.setAttribute("scale", warpNowRef.current.toFixed(2));
      
      if (warpNowRef.current !== warpTarget) {
        warpRaf = requestAnimationFrame(tweenWarp);
      }
    };
    
    warpRaf = requestAnimationFrame(tweenWarp);
    return () => cancelAnimationFrame(warpRaf);
  }, [tripActive, tripLevel]);


  useLayoutEffect(() => {
    updateCaretPosition();
  }, [updateCaretPosition]);

  useEffect(() => {
    window.addEventListener('resize', updateCaretPosition);
    return () => window.removeEventListener('resize', updateCaretPosition);
  }, [updateCaretPosition]);

  // Extract opponent colors if available
  let oppPrimaryHex = '#fbbf24';
  let oppStyle = '';
  if (isOpponent && colorTheme) {
    const hexes = colorTheme.value.match(/#[0-9a-fA-F]{6}/g) || ['#f59e0b'];
    oppPrimaryHex = hexes[0];
    const cssRules = colorTheme.isGradient ? `
      #opponent-area span.text-slate-500 {
        /* Un-typed letters stay slate */
      }
      #opponent-area span:not(.text-slate-500):not(.exclude-theme) {
        background-image: ${colorTheme.value} !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        color: transparent !important;
      }
    ` : `
      #opponent-area span:not(.text-slate-500):not(.exclude-theme) {
        color: ${colorTheme.value} !important;
      }
    `;
    const bgRules = bgTheme ? (bgTheme.isGradient ? `background: ${bgTheme.value} !important; background-attachment: fixed !important;` : `background: ${bgTheme.value} !important;`) : '';
    
    oppStyle = `
      #opponent-area {
        --hot: ${oppPrimaryHex};
        ${bgRules}
      }
      #opponent-area, #opponent-area * {
        font-family: "${fontFamily || 'Inter'}", sans-serif !important;
      }
      ${cssRules}
    `;
  }

  // Inject font stylesheet if needed
  useEffect(() => {
    if (isOpponent && fontFamily) {
      const linkId = `opponent-font-${fontFamily.replace(/\s+/g, '-')}`;
      if (!document.getElementById(linkId)) {
        const linkEl = document.createElement('link');
        linkEl.id = linkId;
        linkEl.rel = 'stylesheet';
        linkEl.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@400;500;600;700;800&display=swap`;
        document.head.appendChild(linkEl);
      }
    }
  }, [isOpponent, fontFamily]);

  return (
    <div id={isOpponent ? "opponent-area" : undefined} className={`flex-1 p-4 md:p-8 flex flex-col relative ${isOpponent ? 'bg-slate-900/40' : ''} ${tripActive ? 'trip-body tripping' : ''} ${blinkActive ? 'view-blink ' + blinkStyle : ''}`} data-level={tripActive ? String(tripLevel) : "0"}>
      {tripActive && (
        <div className="trip-layer">
          <div className="trip-hue"></div>
          <div className="blobs"></div>
        </div>
      )}
      {isOpponent && oppStyle && <style>{oppStyle}</style>}
      <div className="flex justify-between items-end mb-4 md:mb-8">
        
        <div className="flex flex-col items-end gap-1">
          <span className="font-mono text-sm uppercase tracking-widest" style={{ color: isOpponent ? oppPrimaryHex : 'var(--hot)' }}>{wpm} WPM</span>
          {!isOpponent && cia && (
            <span className="font-mono text-[10px] text-slate-400 tracking-widest">
              <span className="text-emerald-400">{cia.c}</span>/
              <span className="text-red-500">{cia.i}</span>/
              <span className="text-amber-400">{cia.a}</span>
            </span>
          )}
        </div>
      </div>

      <div className={`flex-1 relative flex flex-col overflow-visible pt-4 pb-4 ${tripActive ? "trip-text-target" : ""}`} ref={containerRef} style={tripActive ? { filter: `url(#${warpId})` } : undefined}>

      <svg width="0" height="0" style={{position: 'absolute'}} aria-hidden="true" focusable="false">
        <filter id={warpId} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.010" numOctaves="2" seed="3" result="noise">
            <animate attributeName="baseFrequency" dur="12s" repeatCount="indefinite" values="0.006 0.010; 0.012 0.006; 0.006 0.010"/>
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </svg>

        <div 
          className="relative w-full select-none font-mono tracking-wide text-left trip-text-target"
          style={{ fontSize: 'clamp(14px, 1.8vw, 24px)' }}
        >
          <div 
            className="overflow-hidden relative"
            style={{ 
              height: '4.8em',
              lineHeight: 1.6,
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)'
            }}
          >
            <div 
              className="transition-transform duration-200 ease-out relative"
              style={{
                transform: `translateY(calc(-${scrollLines} * 1.6em))`,
                whiteSpace: 'pre-wrap'
              }}
            >
              {/* Caret */}
              <span
                className="absolute -translate-y-1/2 w-[3px] h-[1em] rounded-full pointer-events-none transition-all duration-150 ease-out animate-caret exclude-theme"
                style={{
                  left: `${caretLeft}px`,
                  top: `${caretTop}px`,
                  opacity: gameState === 'playing' ? 1 : 0,
                  backgroundColor: isOpponent ? oppPrimaryHex : 'var(--hot)'
                }}
              />

              {(() => {
                const words = targetText.split(' ');
                let charIndex = 0;
                return words.map((word, wIdx) => {
                  const charsAndSpace = wIdx < words.length - 1 ? word.split('').concat([' ']) : word.split('');
                  return (
                    <span key={wIdx} className="inline-block whitespace-pre">
                      {charsAndSpace.map((char, cIdx) => {
                        const i = charIndex++;
                        let color = 'text-slate-500';
                        if (i < typedText.length) {
                          color = typedText[i] === char ? 'correct-char' : 'text-red-500 underline exclude-theme';
                        } else if (i === typedText.length) {
                          color = 'text-slate-100 exclude-theme';
                        }
                        
                        if (!isOpponent && color === 'correct-char') {
                          color = 'text-[var(--hot)]';
                        }

                        let styleObj: any = isOpponent && color === 'correct-char' ? {} : undefined;
                        if (dyslexiaActive && color === 'text-slate-500') {
                          color += ' dyslexia-char';
                        }

                        return (
                          <span 
                            key={i} 
                            ref={el => letterRefs.current[i] = el}
                            className={`${color}`}
                            style={styleObj}
                          >
                            {char}
                          </span>
                        );
                      })}
                    </span>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>
      
      <div 
        className="w-full max-w-[600px] mx-auto mt-0 mb-32 origin-bottom transform-gpu -translate-y-8"
        style={{ transform: 'scale(0.75)' }}
      >
        <LiveKeyboard activeKeys={activeKeys} />
      </div>

      {/* Battery Charge Meter */}
      <div className="absolute bottom-6 left-6 flex items-center gap-2">
        <div className="relative flex items-center">
          <div className="w-10 h-4 rounded-sm border-2 border-slate-700 relative overflow-hidden flex bg-slate-900/50">
            <div 
              className="h-full bg-[var(--hot)] transition-all duration-200" 
              style={{ width: `${charge}%` }}
            />
          </div>
          <div className="w-[3px] h-2 bg-slate-700 rounded-r-sm" />
        </div>
        <span className="font-mono text-xs text-slate-500">{charge}%</span>
      </div>
      
      {gameState === 'playing' && characters.length > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-10 flex gap-4">
          {characters.map((charId, idx) => (
            <AnimatedCharacter key={idx} id={charId} className="h-48 object-contain" />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RankedMode({ onBack }: Props) {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [language, setLanguage] = useState('english');
  const [queueing, setQueueing] = useState(false);
  const [matchData, setMatchData] = useState<RankedMatchData | null>(null);
  const matchDataRef = useRef<RankedMatchData | null>(null);
  useEffect(() => { matchDataRef.current = matchData; }, [matchData]);
  
  // Game state
  const [sentences, setSentences] = useState<string[]>([]);
  const sentencesRef = useRef<string[]>([]);
  const [gameState, setGameState] = useState<'waiting_ready' | 'playing' | 'round_finished' | 'match_finished'>('waiting_ready');
  const [currentRound, setCurrentRound] = useState(0);
  const [myProgress, setMyProgress] = useState(0);
  const [myCharge, setMyCharge] = useState(0);
  const [myBestLetter, setMyBestLetter] = useState<string | null>(null);
  const [myWorstLetter, setMyWorstLetter] = useState<string | null>(null);
  const [oppBestLetter, setOppBestLetter] = useState<string | null>(null);
  const [oppWorstLetter, setOppWorstLetter] = useState<string | null>(null);
  const myLetterStatsRef = useRef<Record<string, {c: number, i: number}>>({});

  const myChargeRef = useRef(0);
  const [oppCharge, setOppCharge] = useState(0);
  const [myCia, setMyCia] = useState({c: 0, i: 0, a: 0});
  const myLetterStatesRef = useRef<number[]>([]);
  const [oppCia, setOppCia] = useState<{c: number, i: number, a: number} | null>(null);
  const [myWpm, setMyWpm] = useState(0);
  const [oppProgress, setOppProgress] = useState(0);
  const [oppWpm, setOppWpm] = useState(0);
  const [amIReady, setAmIReady] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [matchWinner, setMatchWinner] = useState<string | null>(null);
  const [eloChanges, setEloChanges] = useState<Record<string, number>>({});


  const [myTargetText, setMyTargetText] = useState('');
  const [oppTargetText, setOppTargetText] = useState('');

  const [typedText, setTypedText] = useState('');
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [startTime, setStartTime] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Opponent typing state
  const [oppTypedText, setOppTypedText] = useState('');
  const [oppActiveKeys, setOppActiveKeys] = useState<Set<string>>(new Set());

  const [selectedCharacters, setSelectedCharacters] = useState<string[]>(['mushgirl']);
  const [myUpgrades, setMyUpgrades] = useState(0);
  const [oppUpgrades, setOppUpgrades] = useState(0);
  const oppUpgradesRef = useRef(0);
  useEffect(() => { oppUpgradesRef.current = oppUpgrades; }, [oppUpgrades]);
  const myWorstLetterRef = useRef<string | null>(null);
  useEffect(() => { myWorstLetterRef.current = myWorstLetter; }, [myWorstLetter]);

  const [frame, setFrame] = useState(1);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(() => {
      setFrame(f => (f % 8) + 1);
    }, 100);
    return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    if (!user || !socket || !isConnected) return;

    const onQueueJoined = () => setQueueing(true);
    const onMatchFound = async (data: RankedMatchData) => {
      setQueueing(false);
      setMatchData(data);
      
      // If host, generate payload
      if (data.role === 'host') {
        const langObj = LANGUAGES.find(l => l.id === data.language);
        if (langObj) {
          // Preload language dictionary
          await loadDictionary();
          // Generate 9 massive blocks of text (one for each round)
          const s = [];
          for (let i = 0; i < 9; i++) {
             // Generate enough text for a 60 second round (around 30 sentences ~ 150-200 words)
             const res = await generateSentences('', ['top', 'home', 'bottom'], 3, 12, 30, '');
             s.push(res.join(' ')); 
          }
          socket.emit('rankedMatchPayload', { matchId: data.matchId, sentences: s });
        }
      }
    };

    const onMatchReady = (data: { sentences: string[] }) => {
      setSentences(data.sentences);
      sentencesRef.current = data.sentences;
      setGameState('waiting_ready');
      setCurrentRound(0);
      setAmIReady(false);
    };

    const onRoundStart = (data: { round: number }) => {
      setGameState('playing');
      setCurrentRound(data.round);
      setTimeLeft(60);
      setTypedText('');
      setStartTime(Date.now());
      setMyProgress(0);
      setMyWpm(0);
      setMyCia({c: 0, i: 0, a: 0});
      myLetterStatesRef.current = [];
      setOppCia(null);
      setOppProgress(0);
      setOppProgress(0);
      setOppWpm(0);
      
      let newTargetText = sentencesRef.current[data.round] || sentencesRef.current[0] || "Hello world.";
      if (matchDataRef.current?.opponent.characters?.includes("screwed") && oppUpgradesRef.current >= 1) {
        newTargetText = applyScrewedEffects(newTargetText, {
          scramble: oppUpgradesRef.current >= 1,
          sabotage: oppUpgradesRef.current >= 2,
          spam: oppUpgradesRef.current >= 3
        }, myWorstLetterRef.current);
      }

      setMyTargetText(newTargetText);

      setTimeout(() => inputRef.current?.focus(), 100);
    };

    const onOpponentProgress = (data: { progress: number; wpm: number; typedText?: string; activeKeys?: string[]; targetText?: string; cia?: {c: number, i: number, a: number}; charge?: number; bestLetter?: string; worstLetter?: string; }) => {
      setOppProgress(data.progress);
      setOppWpm(data.wpm);
      if (data.cia) setOppCia(data.cia);
      if (data.charge !== undefined) setOppCharge(data.charge);
      if (data.bestLetter !== undefined) setOppBestLetter(data.bestLetter);
      if (data.worstLetter !== undefined) setOppWorstLetter(data.worstLetter);

      if (data.activeKeys) setOppActiveKeys(new Set(data.activeKeys));
      if (data.targetText !== undefined) setOppTargetText(data.targetText);
      if (data.typedText !== undefined) {
        setOppTypedText(data.typedText);
        
      }
    };

    const onRoundEnd = (data: { winnerId: string; scores: Record<string, number> }) => {
      setGameState('round_finished');
      setScores(data.scores);
    };

    const onNextRound = (data: { round: number }) => {
      setGameState('waiting_ready');
      setCurrentRound(data.round);
      setAmIReady(false);
      setOppTypedText('');
      setOppActiveKeys(new Set());
    };

    const onMatchFinished = (data: { winnerId: string; scores: Record<string, number>; eloChanges: Record<string, number> }) => {
      setGameState('match_finished');
      setMatchWinner(data.winnerId);
      setScores(data.scores);
      setEloChanges(data.eloChanges);
    };

    const onOpponentDisconnected = () => {
      alert('Opponent disconnected. You win by default!');
    };

    const onOpponentUpgrades = (data: { upgrades: number }) => {
      setOppUpgrades(data.upgrades);
    };

    socket.on('rankedQueueJoined', onQueueJoined);
    socket.on('rankedMatchFound', onMatchFound);
    socket.on('rankedMatchReady', onMatchReady);
    socket.on('rankedRoundStart', onRoundStart);
    socket.on('rankedOpponentProgress', onOpponentProgress);
    socket.on('rankedOpponentUpgrades', onOpponentUpgrades);
    socket.on('rankedRoundEnd', onRoundEnd);
    socket.on('rankedNextRound', onNextRound);
    socket.on('rankedMatchFinished', onMatchFinished);
    socket.on('rankedOpponentDisconnected', onOpponentDisconnected);

    return () => {
      if (matchDataRef.current) {
        socket.emit('leaveRankedMatch', { matchId: matchDataRef.current.matchId });
      }
      socket.emit('leaveRankedQueue', { language: 'english' }); // just in case they leave while queueing
      socket.off('rankedQueueJoined', onQueueJoined);
      socket.off('rankedMatchFound', onMatchFound);
      socket.off('rankedMatchReady', onMatchReady);
      socket.off('rankedRoundStart', onRoundStart);
      socket.off('rankedOpponentProgress', onOpponentProgress);
      socket.off('rankedOpponentUpgrades', onOpponentUpgrades);
      socket.off('rankedRoundEnd', onRoundEnd);
      socket.off('rankedNextRound', onNextRound);
      socket.off('rankedMatchFinished', onMatchFinished);
      socket.off('rankedOpponentDisconnected', onOpponentDisconnected);
    };
  }, [user, socket, isConnected]);

  const handleJoinQueue = () => {
    if (!socket || !user) return;
    setQueueing(true);
    socket.emit('joinRankedQueue', { 
      userId: user.id, 
      username: user.username, 
      elo: (user as any).elo || 10,
      language,
      colorTheme: user.colorTheme,
      fontFamily: user.fontFamily,
      characters: selectedCharacters
    });
  };

  const handleLeaveQueue = () => {
    if (!socket) return;
    socket.emit('leaveRankedQueue', { language });
    setQueueing(false);
  };

  const handleReady = () => {
    if (!socket || !matchData) return;
    setAmIReady(true);
    socket.emit('rankedReady', { matchId: matchData.matchId });
  };

  // Timer state
  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0 ) {
      timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (gameState !== 'playing') {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, gameState]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== 'playing' || !matchData || !socket || timeLeft <= 0) return;
    let val = e.target.value;
    let target = myTargetText;
    
    if (val.length > target.length) {
      val = val.slice(0, target.length);
    }
    
    // Check spacebar completion
    if (val.length > typedText.length && val[val.length - 1] === ' ') {
      const wordStart = val.lastIndexOf(' ', val.length - 2) + 1;
      const wordTyped = val.slice(wordStart, val.length - 1);
      const wordTarget = target.slice(wordStart, val.length - 1);
      
      let wordCorrectCount = 0;
      for (let i = 0; i < wordTyped.length; i++) {
        if (wordTyped[i] === wordTarget[i]) wordCorrectCount++;
      }
      const accuracy = wordTarget.length > 0 ? wordCorrectCount / wordTarget.length : 0;
      
    }

    setTypedText(val);
    
    // CIA Tracking
    const prevC = myLetterStatesRef.current.filter(x => x === 1).length;
    let tempC = 0, tempI = 0, tempA = 0;
    for (let i = 0; i < val.length; i++) {
      const isMatch = val[i] === target[i];
      const currState = myLetterStatesRef.current[i] || 0;
      if (isMatch) {
        if (currState === 0) myLetterStatesRef.current[i] = 1;
        else if (currState === 2) myLetterStatesRef.current[i] = 3;
      } else {
        myLetterStatesRef.current[i] = 2;
      }
    }
    
    for (let i = 0; i < val.length; i++) {
      const state = myLetterStatesRef.current[i] || 0;
      if (state === 1) tempC++;
      else if (state === 3) tempA++;
      else tempI++;
    }
    
    const newCia = { c: tempC, i: tempI, a: tempA };
    setMyCia(newCia);
    
    if (tempC > prevC) {
      const newCharge = Math.min(100, myChargeRef.current + (tempC - prevC));
      setMyCharge(newCharge);
      myChargeRef.current = newCharge;
    }
    
    // Only count correct characters for progress and WPM
    let correctCount = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] === target[i]) correctCount++;
    }

    const progress = (correctCount / target.length) * 100;
    let maxI = -1, worstChar = null, maxC = -1, bestChar = null;
    for (const char in myLetterStatsRef.current) {
      if (myLetterStatsRef.current[char].i > maxI) { maxI = myLetterStatsRef.current[char].i; worstChar = char; }
      if (myLetterStatsRef.current[char].c > maxC) { maxC = myLetterStatsRef.current[char].c; bestChar = char; }
    }
    setMyBestLetter(bestChar);
    setMyWorstLetter(worstChar);

    const timeElapsed = (Date.now() - (startTime || Date.now())) / 60000;
    const words = correctCount / 5;
    const wpm = timeElapsed > 0 ? Math.round(words / timeElapsed) : 0;
    
    setMyProgress(progress);
    setMyWpm(wpm);
    
    socket.emit('updateRankedProgress', { 
      matchId: matchData.matchId, 
      progress, 
      wpm, 
      typedText: val, 
      activeKeys: Array.from(activeKeys),
      targetText: target,
      cia: newCia,
      bestLetter: bestChar,
      worstLetter: worstChar,

      charge: myChargeRef.current
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (timeLeft <= 0) return;
    const key = getKeyLabel(e);
    setActiveKeys(prev => {
      const next = new Set(prev);
      next.add(key);
      socket?.emit('updateRankedProgress', { matchId: matchData?.matchId, progress: myProgress, wpm: myWpm, typedText, activeKeys: Array.from(next), targetText: myTargetText });
      return next;
    });
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (timeLeft <= 0) return;
    const key = getKeyLabel(e);
    setActiveKeys(prev => {
      const next = new Set(prev);
      next.delete(key);
      socket?.emit('updateRankedProgress', { matchId: matchData?.matchId, progress: myProgress, wpm: myWpm, typedText, activeKeys: Array.from(next), targetText: myTargetText });
      return next;
    });
  };

  if (!user) {
    return <div className="text-center p-12 text-[var(--hot)] font-mono text-sm uppercase tracking-widest">Please log in to play Ranked.</div>;
  }

  if (!isConnected) {
    return <div className="text-center p-12 text-slate-500 font-mono text-sm uppercase tracking-widest animate-pulse">Connecting to server...</div>;
  }

  // 1. Setup / Queueing Screen
  if (!matchData) {
    return (
      <div className="w-full max-w-[1400px] mx-auto flex flex-col items-center justify-center gap-12 pt-12 relative">
        <div className="w-full max-w-lg bg-slate-900/50 border border-slate-800 p-8 rounded flex flex-col items-center gap-8">
        <h2 className="font-display text-3xl tracking-widest text-[var(--hot)] uppercase">Ranked Queue</h2>
        
        <div className="w-full space-y-4">
          <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block text-center">Select Language</label>
          <select 
            value={language} 
            onChange={e => setLanguage(e.target.value)}
            disabled={queueing}
            className="w-full px-4 py-4 bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:border-[var(--hot)] focus:outline-none rounded text-center"
          >
            {LANGUAGES.map(l => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
        </div>

        {queueing ? (
          <div className="w-full space-y-4">
            <button 
              onClick={handleLeaveQueue}
              className="w-full py-5 border border-rose-500/50 text-red-500 bg-rose-500/10 font-mono text-sm uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-colors rounded"
            >
              Cancel Matchmaking
            </button>
            <p className="text-center text-[10px] font-mono text-slate-400 uppercase tracking-widest animate-pulse">Searching for opponent...</p>
          </div>
        ) : (
          <button 
            onClick={handleJoinQueue}
            className="w-full py-5 border border-[var(--hot)] text-[var(--hot)] bg-[var(--hot)]/10 font-mono text-sm uppercase tracking-widest hover:bg-[var(--hot)] hover:text-black transition-colors rounded shadow-[0_0_15px_var(--color-hot-soft)]"
          >
            Play Ranked
          </button>
        )}
        </div>

        {/* Character Selection */}
        <div className="w-full flex flex-col items-start shrink-0 px-8">
          <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block text-left mb-6">
            Select Characters (Max 3)
          </label>
          <div className="flex flex-wrap gap-6 items-center justify-start">
            {['mushgirl', 'screwed'].map(charId => {
              const isSelected = selectedCharacters.includes(charId);
              return (
                <div 
                  key={charId}
                  onClick={() => {
                    if (queueing) return;
                    if (isSelected) {
                      setSelectedCharacters(prev => prev.filter(c => c !== charId));
                    } else if (selectedCharacters.length < 3) {
                      setSelectedCharacters(prev => [...prev, charId]);
                    }
                  }}
                  className={`cursor-pointer w-28 h-28 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all ${
                    isSelected ? 'border-cyan-400 bg-cyan-950/40' : 'border-slate-800 hover:border-slate-600 bg-slate-900/50'
                  }`}
                >
                  <AnimatedCharacter id={charId} className="h-40 object-contain scale-[1.3] transform-gpu" staticMode />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 2. Match Screen (Split Screen)
  const myScore = scores[socket?.id || ''] || 0;
  const oppScore = scores[matchData.opponent.id] || 0;

  // Dots for First to 5
  const renderDots = (score: number) => {
    return (
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className={`w-3 h-3 rounded-full border ${i < score ? 'bg-[var(--hot)] border-[var(--hot)]' : 'border-slate-700 bg-transparent'}`} />
        ))}
      </div>
    );
  };

  return (
    <div 
      className={`w-screen h-[100dvh] flex flex-col bg-background overflow-hidden relative `}
      data-level={oppUpgrades > 3 ? 3 : oppUpgrades}
      onMouseDown={(e) => {
        const t = e.target as HTMLElement;
        if (t.closest('button, select')) return;
        e.preventDefault();
        inputRef.current?.focus();
      }}
    >
      
      {/* Top Bar / Scoreboard */}
      <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-6">
          <div>
            <div className="font-mono text-lg text-[var(--hot)] uppercase tracking-widest">{user.username}</div>
            <div className="font-mono text-xs text-slate-500 uppercase tracking-widest mt-1">ELO: {(user as any).elo || 10}</div>
          </div>
          {renderDots(myScore)}
        </div>
        
        <div className="text-center">
          <div className="font-display text-2xl text-slate-400 uppercase tracking-widest">Round {currentRound + 1}</div>
        </div>

        <div className="flex items-center gap-6 text-right">
          {renderDots(oppScore)}
          <div>
            <div className="font-mono text-lg text-red-500 uppercase tracking-widest">{matchData.opponent.username}</div>
            <div className="font-mono text-xs text-slate-500 uppercase tracking-widest mt-1">ELO: {matchData.opponent.elo}</div>
          </div>
        </div>
      </div>

      {/* Split Screen Area */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        {/* My Side (Left) */}
        <RankedPlayerArea
          label="Your Area"
          wpm={myWpm}
          progress={myProgress}
          targetText={myTargetText}
          typedText={typedText}
          activeKeys={activeKeys}
          gameState={gameState}
          cia={myCia}
          charge={myCharge}
          dyslexiaActive={oppUpgrades >= 2}
          tripActive={oppUpgrades >= 1}
          blinkActive={oppUpgrades >= 3}
          characters={selectedCharacters}
        />
        
        {/* Hidden Input for me */}
        <input 
          ref={inputRef}
          type="text"
          value={typedText}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          disabled={gameState !== 'playing'}
          className="absolute opacity-0 -z-10"
          autoFocus
        />

        {/* Opponent Side (Right) */}
        <RankedPlayerArea
          label="Opponent Area"
          wpm={oppWpm}
          progress={oppProgress}
          targetText={oppTargetText || myTargetText}
          typedText={oppTypedText}
          activeKeys={oppActiveKeys}
          gameState={gameState}
          isOpponent
          colorTheme={matchData.opponent.colorTheme}
          fontFamily={matchData.opponent.fontFamily}
          bgTheme={matchData.opponent.bgTheme}
          cia={oppCia}
          charge={oppCharge}
          dyslexiaActive={myUpgrades >= 2}
          tripActive={myUpgrades >= 1}
          blinkActive={myUpgrades >= 3}
          characters={matchData.opponent.characters}
        />

        {/* Center Divider - with timer shifted down */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2 z-30 pointer-events-none flex flex-col justify-end pb-32">
          {/* Explicit white separator line */}
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/50 -translate-x-1/2 z-20 pointer-events-none" />
          
          {gameState === 'playing' && (
            <div className="bg-background border-2 border-white rounded-full w-24 h-24 flex flex-col items-center justify-center font-display text-3xl text-slate-100 shadow-[0_0_20px_rgba(255,255,255,0.1)] z-30 pointer-events-auto relative">
              {timeLeft}
              <span className="text-xs text-[var(--hot)] font-mono mt-1">SEC</span>
            </div>
          )}
        </div>
      </div>

      {/* Overlays */}
      {gameState === 'waiting_ready' && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="text-center space-y-6">
            <h3 className="font-display text-4xl text-white uppercase tracking-widest">Round {currentRound + 1}</h3>
            {amIReady ? (
              <p className="font-mono text-sm text-[var(--hot)] uppercase tracking-widest animate-pulse">Waiting for opponent...</p>
            ) : (
              <button 
                onClick={handleReady}
                className="px-12 py-4 border-2 border-[var(--hot)] text-[var(--hot)] bg-[var(--hot)]/10 font-mono text-lg uppercase tracking-widest hover:bg-[var(--hot)] hover:text-black transition-colors rounded shadow-[0_0_20px_var(--color-hot-soft)]"
              >
                Ready
              </button>
            )}
          </div>
        </div>
      )}



      {gameState === 'round_finished' && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded flex flex-col items-center gap-6 max-w-md w-full">
            <h3 className="font-display text-3xl text-[var(--hot)] uppercase tracking-widest">Upgrade Shop</h3>
            <div className="font-mono text-sm text-slate-300">Available Charge: <span className="text-[var(--hot)]">{myCharge}</span></div>
            <div className="flex w-full justify-between gap-8 mb-4">
              <div className="flex-1 border border-slate-700 p-4 rounded bg-slate-800/50">
                <div className="text-[var(--hot)] text-xs font-mono uppercase mb-2">You</div>
                <div className="flex justify-between text-xs font-mono text-slate-300">
                  <span>Best: <span className="text-emerald-400">{myBestLetter || "-"}</span></span>
                  <span>Worst: <span className="text-red-400">{myWorstLetter || "-"}</span></span>
                </div>
              </div>
              <div className="flex-1 border border-slate-700 p-4 rounded bg-slate-800/50">
                <div className="text-red-400 text-xs font-mono uppercase mb-2">Opponent</div>
                <div className="flex justify-between text-xs font-mono text-slate-300">
                  <span>Best: <span className="text-emerald-400">{oppBestLetter || "-"}</span></span>
                  <span>Worst: <span className="text-red-400">{oppWorstLetter || "-"}</span></span>
                </div>
              </div>
            </div>

            
            <div className="w-full space-y-4">
              {myUpgrades === 0 && (
                <button 
                  onClick={() => {
                    if (myCharge >= 30) {
                      setMyCharge(c => c - 30);
                      myChargeRef.current -= 30;
                      setMyUpgrades(1);
                      socket?.emit('rankedUpgrades', { matchId: matchData?.matchId, upgrades: 1 });
                    }
                  }}
                  disabled={myCharge < 30}
                  className="w-full py-3 border border-slate-700 bg-slate-800 font-mono text-sm uppercase tracking-widest disabled:opacity-50 hover:bg-slate-700 transition-colors"
                >
                  Buy Shrooms (30 Charge)
                </button>
              )}
              {myUpgrades === 1 && (
                <button 
                  onClick={() => {
                    if (myCharge >= 60) {
                      setMyCharge(c => c - 60);
                      myChargeRef.current -= 60;
                      setMyUpgrades(2);
                      socket?.emit('rankedUpgrades', { matchId: matchData?.matchId, upgrades: 2 });
                    }
                  }}
                  disabled={myCharge < 60}
                  className="w-full py-3 border border-slate-700 bg-slate-800 font-mono text-sm uppercase tracking-widest disabled:opacity-50 hover:bg-slate-700 transition-colors"
                >
                  Buy Dyslexia (60 Charge)
                </button>
              )}
              {myUpgrades === 2 && (
                <button 
                  onClick={() => {
                    if (myCharge >= 100) {
                      setMyCharge(c => c - 100);
                      myChargeRef.current -= 100;
                      setMyUpgrades(3);
                      socket?.emit('rankedUpgrades', { matchId: matchData?.matchId, upgrades: 3 });
                    }
                  }}
                  disabled={myCharge < 100}
                  className="w-full py-3 border border-slate-700 bg-slate-800 font-mono text-sm uppercase tracking-widest disabled:opacity-50 hover:bg-slate-700 transition-colors"
                >
                  Buy Blinking (100 Charge)
                </button>
              )}
              {myUpgrades === 3 && (
                <div className="text-center font-mono text-sm text-emerald-400 uppercase tracking-widest">
                  Max Upgrades Reached!
                </div>
              )}
            </div>

            <p className="font-mono text-xs text-slate-500 uppercase tracking-widest mt-4">Next round starting soon...</p>
          </div>
        </div>
      )}

      {gameState === 'match_finished' && (
        <div className="absolute inset-0 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center z-30 gap-8">
          <h2 className="font-display text-6xl text-white uppercase tracking-widest">
            {matchWinner === (socket?.id || '') ? 'Victory' : 'Defeat'}
          </h2>
          <div className="flex items-center gap-12 font-mono text-lg uppercase tracking-widest">
            <div className="text-center">
              <div className="text-emerald-400 mb-2">You</div>
              <div className="text-3xl text-white">{scores[socket?.id || ''] || 0}</div>
              <div className={`text-xs mt-2 ${eloChanges[socket?.id || ''] > 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                {eloChanges[socket?.id || ''] > 0 ? '+' : ''}{eloChanges[socket?.id || '']} ELO
              </div>
              <div className="text-xs mt-2 font-mono tracking-widest">
                <span className="text-emerald-400">{myCia.c}</span>/
                <span className="text-red-500">{myCia.i}</span>/
                <span className="text-amber-400">{myCia.a}</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-red-500 mb-2">{matchData.opponent.username}</div>
              <div className="text-3xl text-white">{scores[matchData.opponent.id] || 0}</div>
              <div className={`text-xs mt-2 ${eloChanges[matchData.opponent.id] > 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                {eloChanges[matchData.opponent.id] > 0 ? '+' : ''}{eloChanges[matchData.opponent.id]} ELO
              </div>
              <div className="text-xs mt-2 font-mono tracking-widest">
                <span className="text-emerald-400">{oppCia?.c ?? 0}</span>/
                <span className="text-red-500">{oppCia?.i ?? 0}</span>/
                <span className="text-amber-400">{oppCia?.a ?? 0}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => window.location.href = '/?page=ranked'}
            className="mt-8 px-8 py-3 border border-slate-500 text-slate-300 font-mono text-xs uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-colors rounded"
          >
            Back to Queue
          </button>
        </div>
      )}
    </div>
  );
}
