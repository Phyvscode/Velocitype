import { AnimatedCharacter } from './AnimatedCharacter';
import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { LANGUAGES } from '@/lib/languages';
import { THEMES } from '@/lib/themes';
import { loadDictionary, DICTIONARY, applyScrewedEffects } from "@/lib/words";

import { generateSentences } from '@/lib/quotes';
import LiveKeyboard, { getKeyLabel } from '@/components/LiveKeyboard';
import '../trip.css';
import { FlyingResourceOverlay, FlyingResourceRef, CoinIcon, HeartIcon } from './FlyingResourceOverlay';

export function computeConsistency(samples: number[]): number {
  if (samples.length < 2) return 100;
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  if (mean === 0) return 100;
  const variance = samples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / samples.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;
  return Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));
}

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
    fullTheme?: any;
  };
}

interface RankedMatchState {
  currentRound: number;
  scores: Record<string, number>;
}

interface Props {
  onBack: () => void;
  onOpenAuth?: () => void;
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
  joker1Active?: boolean;
  joker2Active?: boolean;
  joker3Active?: boolean;
  characters?: string[];
  goldenLetters?: Set<number>;
  buffedAbilities?: string[];
  fullTheme?: any;
  moneyguyActive?: boolean;
  coins?: number;
  hearts?: number;
  coinTargetRef?: React.RefObject<HTMLDivElement>;
  heartTargetRef?: React.RefObject<HTMLDivElement>;
  coinPulse?: boolean;
  heartPulse?: boolean;
  externalLetterRefs?: React.MutableRefObject<(HTMLSpanElement | null)[]>;
}

export function RankedPlayerArea({
  label,
  wpm,
  progress,
  targetText,
  typedText,
  activeKeys,
  gameState,
  isOpponent,
  colorTheme,
  fontFamily,
  bgTheme,
  cia,
  charge,
  dyslexiaActive,
  tripActive,
  blinkActive,
  joker1Active,
  joker2Active,
  joker3Active,
  characters = [],
  goldenLetters = new Set(),
  fullTheme,
  buffedAbilities = [],
  moneyguyActive = false,
  coins = 0,
  hearts = 0,
  coinTargetRef,
  heartTargetRef,
  coinPulse = false,
  heartPulse = false,
  externalLetterRefs,
}: RankedPlayerAreaProps) {
  const localLetterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const letterRefs = externalLetterRefs || localLetterRefs;
  const [caretLeft, setCaretLeft] = useState(0);
  const [caretTop, setCaretTop] = useState(0);
  const [scrollLines, setScrollLines] = useState(0);
  const [scrollOffsetPx, setScrollOffsetPx] = useState(0);
  const [visibleRange, setVisibleRange] = useState<{ start: number; end: number }>({ start: 0, end: 999999 });
  const [tripLevel, setTripLevel] = useState(0);
  const [splitActive, setSplitActive] = useState(false);
  const [splitOffset, setSplitOffset] = useState<{ x: number; y: number }>({ x: 8, y: 3 });
  const [dyslexiaFlips, setDyslexiaFlips] = useState<Record<number, '--fx' | '--fy'>>({});
  const dyslexiaBusyRef = useRef<Set<number>>(new Set());
  const [blinkStyle, setBlinkStyle] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const updateCaretPosition = useCallback(() => {
    if (letterRefs.current.length === 0 || !targetText) return;
    const totalChars = targetText.length;
    const nextIndex = Math.min(typedText.length, totalChars - 1);
    const firstEl = letterRefs.current[0];
    if (!firstEl) return;

    const getLineTop = (el: HTMLSpanElement) =>
      el.parentElement ? el.parentElement.offsetTop : el.offsetTop;

    const baseTop = getLineTop(firstEl);
    let line = 0;
    let lastTop = baseTop;
    let currentLine = 0;
    let currentLineTop = baseTop;

    const lineStarts: number[] = [0];

    for (let i = 0; i < totalChars; i++) {
      const el = letterRefs.current[i];
      if (!el) continue;
      const elTop = getLineTop(el);
      if (i > 0 && elTop > lastTop + 10) {
        line++;
        lastTop = elTop;
        lineStarts.push(i);
      }
      if (i === nextIndex) {
        currentLine = line;
        currentLineTop = lastTop;
      }
    }

    const vStart = lineStarts[currentLine] ?? 0;
    const vEnd =
      currentLine + 3 < lineStarts.length
        ? lineStarts[currentLine + 3] - 1
        : totalChars - 1;

    setScrollLines(currentLine);
    setScrollOffsetPx(currentLineTop - baseTop);
    setVisibleRange((prev) =>
      prev.start === vStart && prev.end === vEnd ? prev : { start: vStart, end: vEnd }
    );

    const nextEl = letterRefs.current[nextIndex];
    if (nextEl) {
      if (typedText.length >= targetText.length) {
        setCaretLeft(nextEl.offsetLeft + nextEl.offsetWidth);
      } else {
        setCaretLeft(nextEl.offsetLeft);
      }
      setCaretTop(nextEl.offsetTop + nextEl.offsetHeight / 2);
    }
  }, [typedText, targetText, fontFamily]);

  
  
  
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
    if (!tripActive) {
      setSplitActive(false);
      return;
    }
    let active = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const splitDuration = 3000; // 3s animation at a random position around the text

    const rollSplit = () => {
      if (active) return;
      if (Math.random() < 0.3) {
        active = true;
        const angle = Math.random() * Math.PI * 2;
        const dist = 10 + Math.random() * 8; // 10px to 18px radius in all directions (including on top/above and around)
        setSplitOffset({
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
        });
        setSplitActive(true);
        timeoutId = setTimeout(() => {
          setSplitActive(false);
          active = false;
        }, splitDuration);
      }
    };

    const interval = setInterval(rollSplit, 1000);
    return () => {
      clearInterval(interval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [tripActive]);

  
  useEffect(() => {
    if (!dyslexiaActive) {
      dyslexiaBusyRef.current.clear();
      setDyslexiaFlips({});
      return;
    }
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const interval = setInterval(() => {
      if (!containerRef.current) return;
      const letters = Array.from(
        containerRef.current.querySelectorAll('.dyslexia-char[data-char-idx]')
      ) as HTMLElement[];
      if (!letters.length) return;
      
      const n = 8 + Math.floor(Math.random() * 8);
      const updates: Record<number, '--fx' | '--fy'> = {};
      for (let i = 0; i < n; i++) {
        const ch = letters[Math.floor(Math.random() * letters.length)];
        const idx = Number(ch.dataset.charIdx);
        if (Number.isNaN(idx) || dyslexiaBusyRef.current.has(idx)) continue;
        dyslexiaBusyRef.current.add(idx);
        
        const prop: '--fx' | '--fy' = Math.random() < 0.5 ? "--fy" : "--fx";
        updates[idx] = prop;
        
        const tid = setTimeout(() => {
          dyslexiaBusyRef.current.delete(idx);
          setDyslexiaFlips(prev => {
            if (!(idx in prev)) return prev;
            const next = { ...prev };
            delete next[idx];
            return next;
          });
        }, 1200 + Math.random() * 1400); // 1.2s to 2.6s
        timeouts.push(tid);
      }
      if (Object.keys(updates).length > 0) {
        setDyslexiaFlips(prev => ({ ...prev, ...updates }));
      }
    }, 700);
    
    return () => {
      clearInterval(interval);
      timeouts.forEach(clearTimeout);
    };
  }, [dyslexiaActive]);


  useEffect(() => {
    const blinkInterval = buffedAbilities.includes('blinking') ? 2000 : 5000;
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
        }, blinkInterval); // Wait enough time for either animation to finish (flicker is 5s, blink is 2s)
      }
    };
    
    const interval = setInterval(rollBlink, 2000);
    return () => clearInterval(interval);
  }, [blinkActive]);



  
  


  useLayoutEffect(() => {
    updateCaretPosition();
  }, [updateCaretPosition]);

  useEffect(() => {
    window.addEventListener('resize', updateCaretPosition);
    let ro: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => updateCaretPosition());
      ro.observe(containerRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateCaretPosition);
      if (ro) ro.disconnect();
    };
  }, [updateCaretPosition]);

  // Extract opponent colors if available
  let oppPrimaryHex = '#ef4444';
  let oppStyle = '';
  if (isOpponent && colorTheme) {
    const hexes = colorTheme.value.match(/#[0-9a-fA-F]{6}/g) || ['#f59e0b'];
    oppPrimaryHex = hexes[0];
    
    const oppThemeObj = fullTheme ? THEMES.find(t => t.name === fullTheme) : null;
    const oppSubColor = oppThemeObj ? oppThemeObj.subColor : 'var(--sub, #64748b)';
    
    const cssRules = (colorTheme && colorTheme.isGradient) ? `
      #opponent-area span.text-slate-500 {
        color: ${oppSubColor} !important;
      }
      #opponent-area span:not(.text-slate-500):not(.exclude-theme) {
        background-image: ${colorTheme.value} !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        color: transparent !important;
      }
    ` : (colorTheme ? `
      #opponent-area span.text-slate-500 {
        color: ${oppSubColor} !important;
      }
      #opponent-area span:not(.text-slate-500):not(.exclude-theme) {
        color: ${colorTheme.value} !important;
      }
    ` : `
      #opponent-area span.text-slate-500 {
        color: ${oppSubColor} !important;
      }
    `);
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
    <div id={isOpponent ? "opponent-area" : undefined} className={`flex-1 p-4 md:p-8 flex flex-col justify-center items-center relative w-full ${isOpponent ? 'bg-slate-900/40' : ''} ${tripActive ? 'trip-body tripping' : ''} ${blinkActive ? 'view-blink ' + blinkStyle : ''}`} data-level={tripActive ? String(tripLevel) : "0"}>
      {tripActive && (
        <div className="trip-layer">
          <div className="fog fog-1" />
          <div className="fog fog-2" />
          <div className="fog fog-3" />
          <div className="fog fog-4" />
          <div className="fog fog-5" />
          <div className="fog fog-6" />
        </div>
      )}
      {isOpponent && oppStyle && <style>{oppStyle}</style>}

      <div className="flex-1 w-full max-w-4xl mx-auto relative flex flex-col justify-center items-center overflow-visible py-4" ref={containerRef}>
        <div 
          className={`relative w-full select-none font-mono tracking-wide text-center trip-text-target trip-text-glow ${splitActive ? 'splitting' : ''}`}
          style={{
            fontSize: 'clamp(14px, 1.8vw, 24px)',
            fontFamily: fontFamily ? `"${fontFamily}", monospace` : undefined,
            '--split-target-x': `${splitOffset.x.toFixed(2)}px`,
            '--split-target-y': `${splitOffset.y.toFixed(2)}px`,
          } as React.CSSProperties}
        >
          <div 
            className="overflow-hidden relative py-3 -my-3"
            style={{ 
              height: 'calc(4.8em + 24px)',
              lineHeight: 1.6,
            }}
          >
            <div 
              className="transition-transform duration-200 ease-out relative"
              style={{
                transform: scrollOffsetPx > 0 ? `translateY(-${scrollOffsetPx}px)` : `translateY(calc(-${scrollLines} * 1.6em))`,
                whiteSpace: 'pre-wrap'
              }}
            >
              {/* Caret */}
              <span
                className="absolute -translate-y-1/2 w-[3px] h-[1em] rounded-full pointer-events-none transition-all duration-150 ease-out animate-caret exclude-theme"
                style={{
                  left: `${caretLeft}px`,
                  top: `${caretTop}px`,
                  opacity: gameState === 'playing' && !joker1Active ? 1 : 0,
                  backgroundColor: isOpponent ? oppPrimaryHex : (moneyguyActive ? '#fbbf24' : 'var(--hot)')
                }}
              />

              {(() => {
                const renderWords = (isSplitCopy: boolean) => {
                  const words = targetText.split(' ');
                  let charIndex = 0;
                  return words.map((word, wIdx) => {
                    const charsAndSpace = wIdx < words.length - 1 ? word.split('').concat([' ']) : word.split('');
                    return (
                      <span key={wIdx} className="inline-block whitespace-pre exclude-theme">
                        {charsAndSpace.map((char) => {
                          const i = charIndex++;
                          const isGolden = goldenLetters.has(i);
                          const isHiddenLine = i < visibleRange.start || i > visibleRange.end;

                          // Lines that have scrolled up above the top line or are below the 3 visible lines
                          // must be completely invisible and unaffected by any abilities.
                          if (isHiddenLine) {
                            return (
                              <span
                                key={i}
                                ref={isSplitCopy ? undefined : (el => letterRefs.current[i] = el)}
                                className="opacity-0 pointer-events-none select-none exclude-theme"
                                style={{
                                  opacity: 0,
                                  visibility: 'hidden',
                                  filter: 'none',
                                  textShadow: 'none',
                                  display: isGolden ? 'inline-block' : undefined,
                                  fontWeight: isGolden ? 800 : undefined,
                                }}
                              >
                                {char}
                              </span>
                            );
                          }

                          let color = 'text-slate-500';
                          let isUnTyped = false;

                          if (isGolden) {
                            // The gold letters will only be gold and no other color!
                            if (i < typedText.length && (typedText[i] === char || joker1Active)) {
                              color = 'gold-raised-char gold-typed-correct exclude-theme';
                            } else {
                              color = 'gold-raised-char exclude-theme';
                            }
                          } else if (i < typedText.length) {
                            let isCorrect = typedText[i] === char;
                            if (joker1Active) isCorrect = true; // Joker 1 makes all mistakes look correct
                            
                            if (isCorrect) {
                              color = !isOpponent ? 'text-[var(--hot)]' : (colorTheme ? 'correct-char' : 'text-red-400');
                            } else {
                              color = 'text-red-500 bg-red-500/20 exclude-theme';
                            }
                          } else if (i === typedText.length) {
                            color = 'text-slate-100 exclude-theme';
                          } else {
                            isUnTyped = true;
                          }
                          
                          // Joker 3: Only every 5th letter is colored, the rest are blank/slate (never masks gold letters)
                          if (!isGolden && joker3Active && i < typedText.length && (i + 1) % (buffedAbilities.includes('joker3') ? 3 : 5) !== 0) {
                            color = 'text-slate-500';
                          }

                          let styleObj: React.CSSProperties = isGolden ? { textShadow: 'none' } : {};

                          if (!isGolden && dyslexiaActive && isUnTyped) {
                            color += ' dyslexia-char';
                            const flipProp = dyslexiaFlips[i];
                            if (flipProp) {
                              (styleObj as Record<string, string | number>)[flipProp] = "-1";
                            }
                          }

                          return (
                            <span 
                              key={i} 
                              ref={isSplitCopy ? undefined : (el => letterRefs.current[i] = el)}
                              data-char-idx={isSplitCopy ? undefined : i}
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
                };

                return (
                  <>
                    {renderWords(false)}
                    {tripActive && splitActive && (
                      <div className="drunk-split-overlay" aria-hidden="true">
                        {renderWords(true)}
                      </div>
                    )}
                  </>
                );
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

      {/* Battery Charge Meter OR Coin & Heart HUD */}
      {moneyguyActive ? (
        <div className="absolute bottom-6 left-6 flex items-center gap-5 select-none">
          {/* Coin Symbol + Count */}
          <div 
            ref={coinTargetRef}
            className={`flex items-center gap-1.5 transition-transform duration-200 ${coinPulse ? 'resource-hit-pulse-coin' : ''}`}
          >
            <CoinIcon className="w-5 h-5" glow />
            <span className="font-mono text-sm font-bold text-amber-300 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              {joker2Active ? '???' : coins}
            </span>
          </div>

          {/* Heart Symbol + Count */}
          <div 
            ref={heartTargetRef}
            className={`flex items-center gap-1.5 transition-transform duration-200 ${heartPulse ? 'resource-hit-pulse-heart' : ''}`}
          >
            <HeartIcon className="w-5 h-5" glow />
            <span className="font-mono text-sm font-bold text-red-400 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              {joker2Active ? '???' : hearts}
            </span>
          </div>
        </div>
      ) : (
        <div className="absolute bottom-6 left-6 flex items-center gap-2">
          <div className="relative flex items-center">
            <div className="w-10 h-4 rounded-sm border-2 border-slate-700 relative overflow-hidden flex bg-slate-900/50">
              <div 
                className="h-full bg-[var(--hot)] transition-all duration-200" 
                style={{ width: joker2Active ? '0%' : `${charge}%` }}
              />
            </div>
            <div className="w-[3px] h-2 bg-slate-700 rounded-r-sm" />
          </div>
          <span className="font-mono text-xs text-slate-500">{joker2Active ? '???' : `${charge}%`}</span>
        </div>
      )}
      
      {/* OLD CHARS MOVED */}
    </div>
  );
}

export default function RankedMode({ onBack, onOpenAuth }: Props) {
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
  const myChargeRef = useRef(0);
  const [oppCharge, setOppCharge] = useState(0);
  const [myCoins, setMyCoins] = useState(0);
  const [myHearts, setMyHearts] = useState(0);
  const myCoinsRef = useRef(0);
  const myHeartsRef = useRef(0);
  const goldenLettersRef = useRef<Set<number>>(new Set());
  const [goldenLetters, setGoldenLetters] = useState<Set<number>>(new Set());
  const claimedGoldenRef = useRef<Set<number>>(new Set());
  const flyingResourceRef = useRef<FlyingResourceRef>(null);
  const coinTargetRef = useRef<HTMLDivElement>(null);
  const heartTargetRef = useRef<HTMLDivElement>(null);
  const [coinPulse, setCoinPulse] = useState(false);
  const [heartPulse, setHeartPulse] = useState(false);
  const myLetterElementsRef = useRef<(HTMLSpanElement | null)[]>([]);

  const triggerCoinSpawn = useCallback((charIndex: number) => {
    let startX = window.innerWidth / 2;
    let startY = window.innerHeight / 2;
    const letterEl = myLetterElementsRef.current[charIndex];
    if (letterEl) {
      const rect = letterEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const angle = Math.random() * Math.PI * 2;
      const dist = 14 + Math.random() * 22;
      startX = cx + Math.cos(angle) * dist;
      startY = cy + Math.sin(angle) * dist;
    }
    let targetX = 50;
    let targetY = window.innerHeight - 50;
    if (coinTargetRef.current) {
      const tRect = coinTargetRef.current.getBoundingClientRect();
      targetX = tRect.left + tRect.width / 2;
      targetY = tRect.top + tRect.height / 2;
    }
    flyingResourceRef.current?.spawnCoin(startX, startY, targetX, targetY, () => {
      setMyCoins(c => c + 5);
      myCoinsRef.current += 5;
      setCoinPulse(true);
      setTimeout(() => setCoinPulse(false), 350);
    });
  }, []);

  const triggerHeartSpawn = useCallback((charIndex: number) => {
    let startX = window.innerWidth / 2;
    let startY = window.innerHeight / 2;
    const letterEl = myLetterElementsRef.current[charIndex];
    if (letterEl) {
      const rect = letterEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const angle = Math.random() * Math.PI * 2;
      const dist = 14 + Math.random() * 22;
      startX = cx + Math.cos(angle) * dist;
      startY = cy + Math.sin(angle) * dist;
    }
    let targetX = 90;
    let targetY = window.innerHeight - 50;
    if (heartTargetRef.current) {
      const tRect = heartTargetRef.current.getBoundingClientRect();
      targetX = tRect.left + tRect.width / 2;
      targetY = tRect.top + tRect.height / 2;
    }
    flyingResourceRef.current?.spawnHeart(startX, startY, targetX, targetY, () => {
      setMyHearts(h => h + 3);
      myHeartsRef.current += 3;
      setHeartPulse(true);
      setTimeout(() => setHeartPulse(false), 350);
    });
  }, []);

  const [myBuffedAbilities, setMyBuffedAbilities] = useState<string[]>([]);
  const prevValLengthRef = useRef(0);
  const [showAbilitySelect, setShowAbilitySelect] = useState(false);
  const [pickedExternalAbility, setPickedExternalAbility] = useState<string | null>(null);
  const [showBuffSelect, setShowBuffSelect] = useState(false);

  const [myBestLetter, setMyBestLetter] = useState<string | null>(null);
  const [myWorstLetter, setMyWorstLetter] = useState<string | null>(null);
  const [oppBestLetter, setOppBestLetter] = useState<string | null>(null);
  const [oppWorstLetter, setOppWorstLetter] = useState<string | null>(null);
  const myLetterStatsRef = useRef<Record<string, {c: number, i: number}>>({});
  const myWorstLetterRef = useRef<string | null>(null);

  const [myCia, setMyCia] = useState({c: 0, i: 0, a: 0});
  const myLetterStatesRef = useRef<number[]>([]);
  const [oppCia, setOppCia] = useState<{c: number, i: number, a: number} | null>(null);
  const [gravity1Count, setGravity1Count] = useState(0);
  const [showGravityPopup, setShowGravityPopup] = useState(false);
  const [gravityNotice, setGravityNotice] = useState<string | null>(null);
  const gravityNoticeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [myWpm, setMyWpm] = useState(0);
  const [myRawWpm, setMyRawWpm] = useState(0);
  const [myAccuracy, setMyAccuracy] = useState(100);
  const [myConsistency, setMyConsistency] = useState(100);
  const mySpeedSamplesRef = useRef<number[]>([]);
  const myLastCharsRef = useRef<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  const [oppProgress, setOppProgress] = useState(0);
  const [oppWpm, setOppWpm] = useState(0);
  const [oppRawWpm, setOppRawWpm] = useState(0);
  const [oppAccuracy, setOppAccuracy] = useState(100);
  const [oppConsistency, setOppConsistency] = useState(100);
  const oppSpeedSamplesRef = useRef<number[]>([]);
  const oppLastCharsRef = useRef<number>(0);
  const [amIReady, setAmIReady] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [matchWinner, setMatchWinner] = useState<string | null>(null);
  const [eloChanges, setEloChanges] = useState<Record<string, number>>({});

  const [myTargetText, setMyTargetText] = useState('');
  const [oppTargetText, setOppTargetText] = useState('');

  const [typedText, setTypedText] = useState('');
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  // Opponent typing state
  const [oppTypedText, setOppTypedText] = useState('');
  const [oppActiveKeys, setOppActiveKeys] = useState<Set<string>>(new Set());

  const [selectedCharacters, setSelectedCharacters] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('velocitype_ranked_chars') || localStorage.getItem('velocitype_sandbox_characters');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 3) return parsed;
      }
    } catch {}
    return [];
  });
  const [myAbilities, setMyAbilities] = useState<string[]>([]);
  const [oppAbilities, setOppAbilities] = useState<string[]>([]);
  const oppAbilitiesRef = useRef<string[]>([]);
  const [eventHorizonUsed, setEventHorizonUsed] = useState(false);

  const [frame, setFrame] = useState(1);

  useEffect(() => {
    try {
      localStorage.setItem('velocitype_ranked_chars', JSON.stringify(selectedCharacters));
    } catch {}
    if (user && selectedCharacters.length === 3) {
      api.updateSettings({ selectedCharacters }).catch(() => {});
    }
  }, [selectedCharacters, user]);

  useEffect(() => { oppAbilitiesRef.current = oppAbilities; }, [oppAbilities]);
  useEffect(() => { myWorstLetterRef.current = myWorstLetter; }, [myWorstLetter]);

  useEffect(() => {
    if (selectedCharacters.includes('moneyguy') && myAbilities.includes('moneyguy1')) {
      const newGolden = new Set<number>();
      for (let i = 0; i < myTargetText.length; i++) {
        if (myTargetText[i] !== ' ' && Math.random() < 0.3) {
          newGolden.add(i);
        }
      }
      goldenLettersRef.current = newGolden;
      setGoldenLetters(newGolden);
      claimedGoldenRef.current = new Set();
    } else {
      goldenLettersRef.current = new Set();
      setGoldenLetters(new Set());
      claimedGoldenRef.current = new Set();
    }
  }, [myTargetText, selectedCharacters, myAbilities]);

  useEffect(() => {
    if (gameState !== 'playing' || !startTime) return;
    const interval = setInterval(() => {
      const timeElapsed = (Date.now() - startTime) / 60000;
      if (timeElapsed > 0) {
        let correctCount = 0;
        for (let i = 0; i < typedText.length; i++) {
          if (typedText[i] === myTargetText[i]) {
            correctCount++;
          }
        }
        const wpm = Math.round((correctCount / 5) / timeElapsed);
        const rawWpm = Math.round((typedText.length / 5) / timeElapsed);
        const accuracy = typedText.length > 0 ? Math.round((correctCount / typedText.length) * 100) : 100;

        if (typedText.length > 0) {
          const charsThisSec = Math.max(0, typedText.length - myLastCharsRef.current);
          myLastCharsRef.current = typedText.length;
          const instantRaw = Math.round((charsThisSec / 5) * 60);
          mySpeedSamplesRef.current.push(instantRaw);
        }
        const consistency = computeConsistency(mySpeedSamplesRef.current);

        setMyWpm(wpm);
        setMyRawWpm(rawWpm);
        setMyAccuracy(accuracy);
        setMyConsistency(consistency);

        if (socket && matchData?.matchId) {
          socket.emit('updateRankedProgress', {
            matchId: matchData.matchId,
            progress: myProgress,
            wpm,
            rawWpm,
            accuracy,
            consistency,
            typedText,
            targetText: myTargetText,
            charge: myChargeRef.current
          });
        }

        // Fallback for opponent in case socket didn't deliver them
        if (oppTypedText.length > 0) {
          let oppCorrect = 0;
          for (let i = 0; i < oppTypedText.length; i++) {
            if (oppTypedText[i] === (oppTargetText[i] || '')) oppCorrect++;
          }
          const oRaw = Math.round((oppTypedText.length / 5) / timeElapsed);
          const oAcc = Math.round((oppCorrect / oppTypedText.length) * 100);
          const oppCharsThisSec = Math.max(0, oppTypedText.length - oppLastCharsRef.current);
          oppLastCharsRef.current = oppTypedText.length;
          const oppInstantRaw = Math.round((oppCharsThisSec / 5) * 60);
          oppSpeedSamplesRef.current.push(oppInstantRaw);
          const oCons = computeConsistency(oppSpeedSamplesRef.current);

          setOppRawWpm(prev => prev || oRaw);
          setOppAccuracy(prev => prev !== 100 ? prev : oAcc);
          setOppConsistency(prev => prev !== 100 ? prev : oCons);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, startTime, typedText, myTargetText, oppTargetText, oppTypedText]);

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
      setEventHorizonUsed(false);
      
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
      setMyRawWpm(0);
      setMyAccuracy(100);
      setMyConsistency(100);
      mySpeedSamplesRef.current = [];
      myLastCharsRef.current = 0;
      setMyCia({c: 0, i: 0, a: 0});
      myLetterStatesRef.current = [];
      setOppCia(null);
      setOppProgress(0);
      setOppWpm(0);
      setOppRawWpm(0);
      setOppAccuracy(100);
      setOppConsistency(100);
      oppSpeedSamplesRef.current = [];
      oppLastCharsRef.current = 0;
      setGravity1Count(0);
      setShowGravityPopup(false);
      
      let newTargetText = sentencesRef.current[data.round] || sentencesRef.current[0] || "Hello world.";
      if (matchDataRef.current?.opponent.characters?.includes("screwed")) {
        newTargetText = applyScrewedEffects(newTargetText, oppAbilitiesRef.current, myWorstLetterRef.current);
      }

      setMyTargetText(newTargetText);

      setTimeout(() => inputRef.current?.focus(), 100);
    };

    const onOpponentProgress = (data: { progress: number; wpm: number; typedText?: string; activeKeys?: string[]; targetText?: string; cia?: {c: number, i: number, a: number}; charge?: number; bestLetter?: string; worstLetter?: string; rawWpm?: number; accuracy?: number; consistency?: number; }) => {
      setOppProgress(data.progress);
      setOppWpm(data.wpm);
      if (data.rawWpm !== undefined) setOppRawWpm(data.rawWpm);
      if (data.accuracy !== undefined) setOppAccuracy(data.accuracy);
      if (data.consistency !== undefined) setOppConsistency(data.consistency);
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
      // Event Horizon is 1-time only for that round: consume it when the round finishes
      setMyAbilities(prev => {
        if (prev.includes('gravity3') || prev.includes('gravity3_buffed')) {
          setEventHorizonUsed(true);
          return prev.filter(a => a !== 'gravity3' && a !== 'gravity3_buffed');
        }
        return prev;
      });
      setOppAbilities(prev => {
        const next = prev.filter(a => a !== 'gravity3' && a !== 'gravity3_buffed');
        oppAbilitiesRef.current = next;
        return next;
      });
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

    const onOpponentUpgrades = (data: { upgrades: string[] | number }) => {
      if (Array.isArray(data.upgrades)) {
        setOppAbilities(data.upgrades);
        oppAbilitiesRef.current = data.upgrades;
        setOppUpgrades(data.upgrades.length);
      } else if (typeof data.upgrades === 'number') {
        setOppUpgrades(data.upgrades);
      }
    };

    const showGravityNotice = (msg: string) => {
      setGravityNotice(msg);
      if (gravityNoticeTimerRef.current) clearTimeout(gravityNoticeTimerRef.current);
      gravityNoticeTimerRef.current = setTimeout(() => setGravityNotice(null), 3500);
    };

    // Time Warp: when timer hits 0, server adds +10s (+20s if buffed) for BOTH players when the caster is slower (max 3 per match)
    const onGravityTimeSync = (data: { amountSec: number; casterId?: string; usesLeft?: number }) => {
      setTimeLeft(data.amountSec);
      showGravityNotice(`TIME WARP! +${data.amountSec}s for both players${data.usesLeft !== undefined ? ` (${data.usesLeft} left)` : ''}`);
    };

    // Event Horizon: server ends the round instantly (round end itself arrives via rankedRoundEnd)
    const onGravityEventHorizon = () => {
      showGravityNotice('EVENT HORIZON! Round ended early');
    };

    const onGravitySabotage = () => {
      setShowGravityPopup(true);
    };

    socket.on('rankedQueueJoined', onQueueJoined);
    socket.on('rankedGravityTimeSync', onGravityTimeSync);
    socket.on('rankedGravityEventHorizon', onGravityEventHorizon);
    socket.on('rankedGravitySabotage', onGravitySabotage);
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
      socket.off('rankedGravityTimeSync', onGravityTimeSync);
      socket.off('rankedGravityEventHorizon', onGravityEventHorizon);
      socket.off('rankedGravitySabotage', onGravitySabotage);
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
      characters: selectedCharacters,
      fullTheme: localStorage.getItem('velocitype_full_theme')
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
      const hasOppBlackHole = oppAbilities.includes('gravity2') || oppAbilities.includes('gravity2_buffed');
      const isBuffedBlackHole = oppAbilities.includes('gravity2_buffed');
      if (hasOppBlackHole && (timeLeft === 40 || timeLeft === 20 || (isBuffedBlackHole && timeLeft === 30))) {
        setShowGravityPopup(true);
      }
      timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (gameState !== 'playing') {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, gameState, oppAbilities]);

  useEffect(() => {
    if (!showGravityPopup) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        setShowGravityPopup(false);
        setTimeout(() => inputRef.current?.focus(), 20);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showGravityPopup]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== 'playing' || !matchData || !socket || timeLeft <= 0 || showGravityPopup) return;
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
        if (currState === 0) {
          myLetterStatesRef.current[i] = 1;
          if (goldenLettersRef.current.has(i) && !claimedGoldenRef.current.has(i)) {
            claimedGoldenRef.current.add(i);
            triggerCoinSpawn(i);
          }
        }
        else if (currState === 2) myLetterStatesRef.current[i] = 3;
      } else {
        if ((currState === 0 || currState === 1) && (myAbilities.includes('moneyguy1') || myAbilities.includes('moneyguy1_buffed'))) {
          triggerHeartSpawn(i);
        }
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
    const rawWpm = timeElapsed > 0 ? Math.round((val.length / 5) / timeElapsed) : 0;
    const accuracy = val.length > 0 ? Math.round((correctCount / val.length) * 100) : 100;
    const consistency = computeConsistency(mySpeedSamplesRef.current);
    
    setMyProgress(progress);
    setMyWpm(wpm);
    setMyRawWpm(rawWpm);
    setMyAccuracy(accuracy);
    setMyConsistency(consistency);
    
    socket.emit('updateRankedProgress', { 
      matchId: matchData.matchId, 
      progress, 
      wpm, 
      rawWpm,
      accuracy,
      consistency,
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
      socket?.emit('updateRankedProgress', { matchId: matchData?.matchId, progress: myProgress, wpm: myWpm, rawWpm: myRawWpm, accuracy: myAccuracy, consistency: myConsistency, typedText, activeKeys: Array.from(next), targetText: myTargetText });
      return next;
    });
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (timeLeft <= 0) return;
    const key = getKeyLabel(e);
    setActiveKeys(prev => {
      const next = new Set(prev);
      next.delete(key);
      socket?.emit('updateRankedProgress', { matchId: matchData?.matchId, progress: myProgress, wpm: myWpm, rawWpm: myRawWpm, accuracy: myAccuracy, consistency: myConsistency, typedText, activeKeys: Array.from(next), targetText: myTargetText });
      return next;
    });
  };

  if (!user) {
    return (
      <div className="w-full max-w-lg mx-auto p-12 flex flex-col items-center gap-6 text-center">
        <button 
          onClick={onBack}
          className="self-start text-slate-400 hover:text-white uppercase tracking-widest text-sm font-mono transition-colors flex items-center gap-2 cursor-pointer"
        >
          <span>&larr;</span> Back
        </button>
        <div className="text-[var(--hot)] font-mono text-base uppercase tracking-widest font-bold">Please log in to play Ranked.</div>
        <p className="font-mono text-xs text-slate-400 uppercase tracking-widest">Ranked matchmaking requires an active account to track your ELO and stats.</p>
        {onOpenAuth && (
          <button 
            onClick={onOpenAuth}
            className="px-8 py-3 border border-[var(--hot)] text-black bg-[var(--hot)] hover:bg-white font-mono text-xs uppercase tracking-widest font-bold rounded shadow-[0_0_15px_var(--color-hot-soft)] transition-all cursor-pointer"
          >
            Log In / Sign Up
          </button>
        )}
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="w-full max-w-lg mx-auto p-12 flex flex-col items-center gap-6 text-center">
        <button 
          onClick={onBack}
          className="self-start text-slate-400 hover:text-white uppercase tracking-widest text-sm font-mono transition-colors flex items-center gap-2 cursor-pointer"
        >
          <span>&larr;</span> Back
        </button>
        <div className="text-slate-500 font-mono text-sm uppercase tracking-widest animate-pulse">Connecting to server...</div>
      </div>
    );
  }

  // 1. Setup / Queueing Screen
  if (!matchData) {
    return (
      <div className="w-full max-w-[1400px] mx-auto flex flex-col items-center justify-center gap-8 pt-8 relative">
        <div className="w-full px-8 flex justify-between items-center">
          <button 
            onClick={onBack}
            className="text-slate-400 hover:text-white uppercase tracking-widest text-sm font-mono transition-colors flex items-center gap-2 cursor-pointer"
          >
            <span>&larr;</span> Back
          </button>
        </div>
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
            disabled={selectedCharacters.length !== 3}
            className={`w-full py-5 border font-mono text-sm uppercase tracking-widest transition-colors rounded ${selectedCharacters.length === 3 ? 'border-[var(--hot)] text-[var(--hot)] bg-[var(--hot)]/10 hover:bg-[var(--hot)] hover:text-black shadow-[0_0_15px_var(--color-hot-soft)]' : 'border-slate-700 text-slate-500 bg-slate-800/50 cursor-not-allowed'}`}
          >
            {selectedCharacters.length === 3 ? 'Play Ranked' : `Select 3 Characters (${selectedCharacters.length}/3)`}
          </button>
        )}
        </div>

        {/* Character Selection */}
        <div className="w-full flex flex-col items-start shrink-0 px-8">
          <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block text-left mb-6">
            Select Characters (Max 3)
          </label>
          <div className="flex flex-wrap gap-6 items-center justify-start">
            {['mushgirl', 'screwed', 'joker', 'gravity', 'moneyguy'].map(charId => {
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
                  className={`cursor-pointer w-40 h-40 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all ${
                    isSelected ? 'border-cyan-400 bg-cyan-950/40' : 'border-slate-800 hover:border-slate-600 bg-slate-900/50'
                  }`}
                >
                  <AnimatedCharacter 
                    id={charId} 
                    className="h-56 object-contain scale-[1.3] transform-gpu" 
                    style={charId === 'screwed' ? { transform: 'scale(-1.3, 1.3)' } : undefined}
                    staticMode 
                  />
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
      <FlyingResourceOverlay ref={flyingResourceRef} />
      
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

      {/* Match Screen Area */}
      <div className="flex-1 flex flex-col relative w-full max-w-5xl mx-auto px-4 md:px-8 justify-center items-center">
        {/* Playing Area */}
        <div className="flex-1 w-full flex flex-col min-h-0 justify-center items-center">
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
            dyslexiaActive={oppAbilities.includes('dyslexia') || oppAbilities.includes('dyslexia_buffed')}
            tripActive={oppAbilities.includes('shrooms') || oppAbilities.includes('shrooms_buffed')}
            blinkActive={oppAbilities.includes('blinking') || oppAbilities.includes('blinking_buffed')}
            joker1Active={oppAbilities.includes('joker1') || oppAbilities.includes('joker1_buffed')}
            joker2Active={oppAbilities.includes('joker2') || oppAbilities.includes('joker2_buffed')}
            joker3Active={oppAbilities.includes('joker3') || oppAbilities.includes('joker3_buffed')}
            buffedAbilities={oppAbilities.filter(a => a.endsWith('_buffed')).map(a => a.replace('_buffed', ''))}
            characters={selectedCharacters}
            goldenLetters={goldenLetters}
            moneyguyActive={selectedCharacters.includes('moneyguy') && myAbilities.some(a => a.startsWith('moneyguy'))}
            coins={myCoins}
            hearts={myHearts}
            coinTargetRef={coinTargetRef}
            heartTargetRef={heartTargetRef}
            coinPulse={coinPulse}
            heartPulse={heartPulse}
            externalLetterRefs={myLetterElementsRef}
          />
        </div>
        
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

        {/* OPPONENT AREA HIDDEN */}
{/* Center Divider - with timer shifted down */}
        <div className="absolute left-1/2 top-4 -translate-x-1/2 z-30 pointer-events-none flex flex-col justify-start">
          {/* Explicit white separator line */}
          {/* HIDDEN DIVIDER */}
          
          {gameState === 'playing' && (
            <div className="bg-background border-2 border-white rounded-full w-24 h-24 flex flex-col items-center justify-center font-display text-3xl text-slate-100 shadow-[0_0_20px_rgba(255,255,255,0.1)] z-30 pointer-events-auto relative">
              {oppAbilities.includes('joker3') ? (
                <div className="text-4xl text-slate-600 mt-2">???</div>
              ) : (
                <>
                  {timeLeft}
                  <span className="text-xs text-[var(--hot)] font-mono mt-1">SEC</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>


      {/* Modals for Money Guy */}
      {showAbilitySelect && (() => {
        const unselectedPool = [
          { id: 'shrooms', name: 'Shrooms', cost: 30, char: 'mushgirl', desc: 'Split double-vision & trippy fog' },
          { id: 'dyslexia', name: 'Dyslexia', cost: 60, char: 'mushgirl', desc: 'Inverts upcoming letters in place' },
          { id: 'blinking', name: 'Blinking', cost: 100, char: 'mushgirl', desc: 'Periodic screen blackout blink' },
          { id: 'scramble', name: 'Scramble', cost: 30, char: 'screwed', desc: 'Shuffles letters within words' },
          { id: 'sabotage', name: 'Sabotage', cost: 60, char: 'screwed', desc: 'Inserts worst letter every 3rd word' },
          { id: 'spam', name: 'Spam', cost: 100, char: 'screwed', desc: 'Inserts random 5-letter word every 10th word' },
          { id: 'joker1', name: 'Delusion', cost: 30, char: 'joker', desc: 'All mistakes appear correct' },
          { id: 'joker2', name: 'Blindness', cost: 60, char: 'joker', desc: 'Masks WPM and raw stats as ???' },
          { id: 'joker3', name: 'Amnesia', cost: 100, char: 'joker', desc: 'Only reveals every 5th letter, timer as ???' },
          { id: 'gravity1', name: 'Time Warp', cost: 40, char: 'gravity', desc: '+10s when timer hits 0 if your WPM is lower' },
          { id: 'gravity2', name: 'Black Hole', cost: 70, char: 'gravity', desc: 'Black Hole Sabotage popup (Ctrl+X)' },
          { id: 'gravity3', name: 'Event Horizon', cost: 110, char: 'gravity', desc: 'After 30s, ends round if your WPM is higher (1 round only)' }
        ].filter(a => !selectedCharacters.includes(a.char) && !myAbilities.includes(a.id) && !(a.id === 'gravity3' && eventHorizonUsed));

        const selectExternalAbility = (abilityId: string) => {
          const mgCost = { c: 300, h: 30 };
          if (myCharge >= 100) {
            setMyCharge(c => c - 100);
            myChargeRef.current -= 100;
          } else {
            setMyCoins(c => c - mgCost.c);
            setMyHearts(h => h - mgCost.h);
            myCoinsRef.current -= mgCost.c;
            myHeartsRef.current -= mgCost.h;
          }

          const newAbilities = [...myAbilities, 'moneyguy3', abilityId];
          setMyAbilities(newAbilities);
          setPickedExternalAbility(abilityId);
          if (typeof socket !== 'undefined' && socket) {
            socket.emit('rankedUpgrades', { matchId: matchData?.matchId, upgrades: newAbilities });
          }
          setShowAbilitySelect(false);
        };

        return (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-[var(--hot)] p-8 rounded-xl max-w-2xl w-full shadow-2xl">
              <div className="flex items-center justify-between gap-4 mb-2">
                <h3 className="font-display text-2xl text-[var(--hot)] uppercase tracking-widest">
                  Select Unselected Character Ability
                </h3>
                {unselectedPool.length > 0 && (
                  <button
                    onClick={() => {
                      const rand = unselectedPool[Math.floor(Math.random() * unselectedPool.length)];
                      selectExternalAbility(rand.id);
                    }}
                    className="px-3 py-1.5 rounded border border-amber-400/70 bg-amber-500/20 hover:bg-amber-400 hover:text-black text-amber-300 font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer"
                  >
                    🎲 Pick Random
                  </button>
                )}
              </div>
              <p className="text-slate-400 font-mono text-xs mb-6">
                Choose one ability from the characters not selected by you.
              </p>
              {unselectedPool.length === 0 ? (
                <div className="text-slate-400 font-mono text-xs py-6 text-center">
                  No unselected character abilities remaining.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-h-[340px] overflow-y-auto pr-1">
                  {unselectedPool.map(ability => (
                    <button
                      key={ability.id}
                      onClick={() => selectExternalAbility(ability.id)}
                      className="p-3 border border-slate-700 bg-slate-800/90 hover:border-[var(--hot)] hover:bg-slate-700 transition-all text-left rounded-lg cursor-pointer flex flex-col justify-between gap-2"
                    >
                      <div>
                        <div className="font-mono text-xs uppercase tracking-widest text-white font-bold">
                          {ability.name}
                        </div>
                        <div className="text-[10px] font-mono text-[var(--hot)] uppercase mt-0.5">
                          {ability.char}
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 leading-snug">
                        {ability.desc}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowAbilitySelect(false)}
                className="mt-6 text-xs font-mono text-slate-500 hover:text-white uppercase tracking-widest cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        );
      })()}

      {showBuffSelect && (
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-yellow-500 p-8 rounded max-w-md w-full">
            <h3 className="font-display text-2xl text-yellow-500 uppercase tracking-widest mb-2">Invest: Double Effect</h3>
            <p className="text-slate-400 font-mono text-xs mb-6">Select an active ability to double its effect permanently!</p>
            <div className="flex flex-col gap-4">
              {myAbilities.filter(a => !a.startsWith('moneyguy') && !a.endsWith('_buffed')).length === 0 ? (
                <div className="text-red-400 text-xs font-mono">You have no active abilities to buff!</div>
              ) : myAbilities.filter(a => !a.startsWith('moneyguy') && !a.endsWith('_buffed')).map(abilityId => {
                 const name = [
                    { id: 'shrooms', name: 'Shrooms' }, { id: 'dyslexia', name: 'Dyslexia' }, { id: 'blinking', name: 'Blinking' },
                    { id: 'scramble', name: 'Scramble' }, { id: 'sabotage', name: 'Sabotage' }, { id: 'spam', name: 'Spam' },
                    { id: 'joker1', name: 'Delusion' }, { id: 'joker2', name: 'Blindness' }, { id: 'joker3', name: 'Amnesia' },
                    { id: 'gravity1', name: 'Time Warp' }, { id: 'gravity2', name: 'Black Hole' }, { id: 'gravity3', name: 'Event Horizon' }
                 ].find(x => x.id === abilityId)?.name || abilityId;
                 
                 const isBuffed = myBuffedAbilities.includes(abilityId);

                 return (
                  <button
                    key={abilityId}
                    disabled={isBuffed}
                    onClick={() => {
                      const mgCost = { c: 150, h: 10 }; // Invest cost (Tier 2)
                      if (myCharge >= 60) {
                        setMyCharge(c => c - 60);
                        myChargeRef.current -= 60;
                      } else {
                        setMyCoins(c => c - mgCost.c);
                        setMyHearts(h => h - mgCost.h);
                        myCoinsRef.current -= mgCost.c;
                        myHeartsRef.current -= mgCost.h;
                      }
                      
                      const newBuffs = [...myBuffedAbilities, abilityId];
                      setMyBuffedAbilities(newBuffs);
                      const newAbilities = [...myAbilities, 'moneyguy2', abilityId + '_buffed'];
                      setMyAbilities(newAbilities);
                      
                      if (typeof socket !== 'undefined' && socket) {
                         socket.emit('rankedUpgrades', { matchId: matchData?.matchId, upgrades: newAbilities });
                      }
                      setShowBuffSelect(false);
                    }}
                    className={`py-3 px-2 border border-slate-700 bg-slate-800 font-mono text-xs uppercase tracking-widest ${isBuffed ? 'opacity-50' : 'hover:bg-yellow-500 hover:text-black cursor-pointer'} transition-colors`}
                  >
                    {name} {isBuffed ? '(Already Buffed)' : ''}
                  </button>
                 );
              })}
            </div>
            <button onClick={() => setShowBuffSelect(false)} className="mt-6 text-xs font-mono text-slate-500 hover:text-white uppercase tracking-widest">Cancel</button>
          </div>
        </div>
      )}
  
      {gravityNotice && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full border border-purple-400/70 bg-purple-950/90 text-purple-200 font-mono text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(168,85,247,0.5)] pointer-events-none">
          🪐 {gravityNotice}
        </div>
      )}

      {showGravityPopup && gameState === 'playing' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto">
           <div className="bg-red-950 border border-red-500 p-8 rounded-xl shadow-[0_0_50px_rgba(239,68,68,0.5)] text-center animate-bounce">
              <h2 className="text-3xl text-red-500 font-display uppercase tracking-widest mb-4">Black Hole Sabotage!</h2>
              <p className="text-red-200 font-mono text-sm tracking-widest mb-4">You have been sucked into a gravity well!</p>
              <p className="text-white font-mono font-bold tracking-widest bg-red-900/50 p-4 rounded">Press CTRL + X to escape</p>
           </div>
        </div>
      )}
      
      
      {/* Bottom Stats & Right Side Characters */}
      {gameState === 'playing' && (
        <>
          {/* Bottom Bar: Stats */}
          <div className="fixed bottom-0 left-0 w-full px-12 py-6 flex justify-between items-end pointer-events-none z-30 bg-gradient-to-t from-background via-background/80 to-transparent">
            {/* My Stats & Opponent Stats */}
            {(() => {
              // When opponent activated blindness, the player is blinded (victim): both player and opponent stats show ???
              // But for the player who activated this ability, stats are NOT masked with ???
              const isBlindMasked = oppAbilities.includes('joker2') || oppAbilities.includes('joker2_buffed');

              return (
                <>
                  <div className="flex flex-col gap-2 pointer-events-auto">
                    <h3 className="font-display text-xl text-[var(--hot)] tracking-widest uppercase">You</h3>
                    <div className="font-mono text-3xl text-white tracking-widest">
                      {isBlindMasked ? '???' : myWpm} <span className="text-sm text-slate-500">WPM</span>
                    </div>
                    {myCia && (
                      <div className="font-mono text-sm text-slate-400 tracking-widest">
                        {isBlindMasked ? (
                          <span className="text-slate-500">??? / ??? / ???</span>
                        ) : (
                          <>
                            <span className="text-emerald-400">{myCia.c}</span>/
                            <span className="text-red-500">{myCia.i}</span>/
                            <span className="text-amber-400">{myCia.a}</span>
                          </>
                        )}
                      </div>
                    )}
                    {selectedCharacters.includes('moneyguy') && myAbilities.some(a => a.startsWith('moneyguy')) ? (
                      <div className="font-mono text-xs text-slate-300 flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <CoinIcon className="w-3.5 h-3.5" glow />
                          <span className="text-yellow-400 font-bold">{isBlindMasked ? '???' : myCoins} Coins</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <HeartIcon className="w-3.5 h-3.5" glow />
                          <span className="text-red-400 font-bold">{isBlindMasked ? '???' : myHearts} Hearts</span>
                        </div>
                      </div>
                    ) : (
                      <div className="font-mono text-xs text-slate-500">{isBlindMasked ? '???' : `${myCharge}%`} Charge</div>
                    )}
                    
                    <div className="flex flex-col gap-1 pt-2 border-t border-slate-800/80">
                      <div>
                        <div className="font-mono text-sm text-white tracking-widest">
                          {isBlindMasked ? '???' : myRawWpm} <span className="text-[10px] text-slate-400">RAW WPM</span>
                        </div>
                        <div className="font-mono text-[9px] text-slate-500 tracking-tight">Speed before error penalties</div>
                      </div>
                      <div>
                        <div className="font-mono text-sm text-white tracking-widest">
                          {isBlindMasked ? '???' : `${myAccuracy}%`} <span className="text-[10px] text-slate-400">ACC</span>
                        </div>
                        <div className="font-mono text-[9px] text-slate-500 tracking-tight">Typing correctness</div>
                      </div>
                      <div>
                        <div className="font-mono text-sm text-white tracking-widest">
                          {isBlindMasked ? '???' : `${myConsistency}%`} <span className="text-[10px] text-slate-400">CONSISTENCY</span>
                        </div>
                        <div className="font-mono text-[9px] text-slate-500 tracking-tight">How stable speed was</div>
                      </div>
                    </div>
                  </div>

                  {/* Opponent Stats */}
                  <div className="flex flex-col gap-2 text-right pointer-events-auto items-end">
                    <h3 className="font-display text-xl text-red-500 tracking-widest uppercase">Opponent</h3>
                    <div className="font-mono text-3xl text-white tracking-widest">
                      {isBlindMasked ? '???' : oppWpm} <span className="text-sm text-slate-500">WPM</span>
                    </div>
                    {oppCia && (
                      <div className="font-mono text-sm text-slate-400 tracking-widest">
                        {isBlindMasked ? (
                          <span className="text-slate-500">??? / ??? / ???</span>
                        ) : (
                          <>
                            <span className="text-emerald-400">{oppCia.c}</span>/
                            <span className="text-red-500">{oppCia.i}</span>/
                            <span className="text-amber-400">{oppCia.a}</span>
                          </>
                        )}
                      </div>
                    )}
                    <div className="font-mono text-xs text-slate-500">{isBlindMasked ? '???' : `${oppCharge}%`} Charge</div>

                    <div className="flex flex-col gap-1 pt-2 border-t border-slate-800/80 items-end">
                      <div>
                        <div className="font-mono text-sm text-white tracking-widest">
                          {isBlindMasked ? '???' : oppRawWpm} <span className="text-[10px] text-slate-400">RAW WPM</span>
                        </div>
                        <div className="font-mono text-[9px] text-slate-500 tracking-tight">Speed before error penalties</div>
                      </div>
                      <div>
                        <div className="font-mono text-sm text-white tracking-widest">
                          {isBlindMasked ? '???' : `${oppAccuracy}%`} <span className="text-[10px] text-slate-400">ACC</span>
                        </div>
                        <div className="font-mono text-[9px] text-slate-500 tracking-tight">Typing correctness</div>
                      </div>
                      <div>
                        <div className="font-mono text-sm text-white tracking-widest">
                          {isBlindMasked ? '???' : `${oppConsistency}%`} <span className="text-[10px] text-slate-400">CONSISTENCY</span>
                        </div>
                        <div className="font-mono text-[9px] text-slate-500 tracking-tight">How stable speed was</div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Right Side Characters */}
          <div 
            className="fixed right-4 top-[84px] bottom-[260px] flex flex-col justify-between items-end z-40 pointer-events-none"
          >
            {/* My Character(s) */}
            {selectedCharacters.map((charId, idx) => {
              const charStyle: React.CSSProperties | undefined = 
                charId === 'screwed'
                  ? { transform: 'scale(-2, 2)' }
                  : charId === 'mushgirl'
                    ? { transform: 'scale(2)' }
                    : charId === 'joker'
                      ? { transform: 'scale(1.65)' }
                      : charId === 'moneyguy'
                        ? { transform: 'scale(1.3)' }
                        : undefined;

              return (
                <div 
                  key={'my-'+idx} 
                  className="w-[calc((100dvh-380px)/3)] h-[calc((100dvh-380px)/3)] shrink-0 rounded-full border-4 border-[var(--hot)]/50 bg-[var(--hot)]/10 overflow-hidden flex items-center justify-center shadow-[0_0_25px_var(--color-hot-soft)]"
                >
                  <AnimatedCharacter 
                    id={charId} 
                    className="h-[82%] object-cover mt-2 transform-gpu" 
                    style={charStyle}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}

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
            {selectedCharacters.includes('moneyguy') && myAbilities.some(a => a.startsWith('moneyguy')) ? (
              <div className="font-mono text-sm text-slate-300 flex items-center gap-5">
                <div className="flex items-center gap-1.5">
                  <CoinIcon className="w-4 h-4" glow />
                  <span>Coins: <span className="text-yellow-400 font-bold">{myCoins}</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <HeartIcon className="w-4 h-4" glow />
                  <span>Hearts: <span className="text-red-400 font-bold">{myHearts}</span></span>
                </div>
              </div>
            ) : (
              <div className="font-mono text-sm text-slate-300">Available Charge: <span className="text-[var(--hot)]">{myCharge}%</span></div>
            )}
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
              
              
{(() => {
  const ALL_ABILITIES = [
    { id: 'shrooms', name: 'Shrooms', cost: 30, char: 'mushgirl' },
    { id: 'dyslexia', name: 'Dyslexia', cost: 60, char: 'mushgirl' },
    { id: 'blinking', name: 'Blinking', cost: 100, char: 'mushgirl' },
    { id: 'scramble', name: 'Scramble', cost: 30, char: 'screwed' },
    { id: 'sabotage', name: 'Sabotage', cost: 60, char: 'screwed' },
    { id: 'spam', name: 'Spam', cost: 100, char: 'screwed' },
    { id: 'joker1', name: 'Delusion', cost: 30, char: 'joker' },
    { id: 'joker2', name: 'Blindness', cost: 60, char: 'joker' },
    { id: 'joker3', name: 'Amnesia', cost: 100, char: 'joker' },
    { id: 'gravity1', name: 'Time Warp', cost: 40, char: 'gravity' },
    { id: 'gravity2', name: 'Black Hole', cost: 70, char: 'gravity' },
    { id: 'gravity3', name: 'Event Horizon', cost: 110, char: 'gravity' },
    { id: 'moneyguy1', name: 'Bribe', cost: 30, char: 'moneyguy' },
    { id: 'moneyguy2', name: 'Invest', cost: 60, char: 'moneyguy' },
    { id: 'moneyguy3', name: 'Buyout', cost: 100, char: 'moneyguy' }
  ];

  const getMG = (cost) => {
    if (cost <= 40) return { c: 100, h: 20 };
    if (cost <= 70) return { c: 150, h: 10 };
    return { c: 300, h: 30 };
  };

  const isMG = selectedCharacters.includes('moneyguy') && myAbilities.some(a => a.startsWith('moneyguy'));
  const shopAbilities = ALL_ABILITIES.filter(a => selectedCharacters.includes(a.char));

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {shopAbilities.map(ability => {
        const hasIt = myAbilities.includes(ability.id) || myBuffedAbilities.includes(ability.id) || (ability.id === 'gravity3' && eventHorizonUsed);
        const mgCost = getMG(ability.cost);
        const canAfford = ability.char === 'moneyguy'
          ? (myCharge >= ability.cost || (myCoins >= mgCost.c && myHearts >= mgCost.h))
          : (isMG ? (myCoins >= mgCost.c && myHearts >= mgCost.h) : (myCharge >= ability.cost));
        
        return (
          <button
            key={ability.id}
            onClick={() => {
              if (canAfford && !hasIt) {
                if (ability.char === 'moneyguy') {
                  if (ability.id === 'moneyguy2') {
                    setShowBuffSelect(true);
                    return; 
                  }
                  if (ability.id === 'moneyguy3') {
                    setShowAbilitySelect(true);
                    return;
                  }
                  
                  if (myCharge >= ability.cost) {
                    setMyCharge(c => c - ability.cost);
                    myChargeRef.current -= ability.cost;
                  } else {
                    setMyCoins(c => c - mgCost.c);
                    setMyHearts(h => h - mgCost.h);
                    myCoinsRef.current -= mgCost.c;
                    myHeartsRef.current -= mgCost.h;
                  }
                  const newAbilities = [...myAbilities, ability.id];
                  setMyAbilities(newAbilities);
                  if (typeof socket !== 'undefined' && socket) {
                     socket.emit('rankedUpgrades', { matchId: matchData?.matchId, upgrades: newAbilities });
                  }
                  return;
                }
                
                if (isMG) {
                  setMyCoins(c => c - mgCost.c);
                  setMyHearts(h => h - mgCost.h);
                  myCoinsRef.current -= mgCost.c;
                  myHeartsRef.current -= mgCost.h;
                } else {
                  setMyCharge(c => c - ability.cost);
                  myChargeRef.current -= ability.cost;
                }
                const newAbilities = [...myAbilities, ability.id];
                setMyAbilities(newAbilities);
                if (typeof socket !== 'undefined' && socket) {
                   socket.emit('rankedUpgrades', { matchId: matchData?.matchId, upgrades: newAbilities });
                }
              }
            }}
            disabled={!canAfford || hasIt}
            className={`w-full py-3 px-2 border border-slate-700 bg-slate-800 font-mono text-xs uppercase tracking-widest ${(!canAfford || hasIt) ? 'opacity-50' : 'hover:bg-slate-700 cursor-pointer'} transition-colors flex flex-col items-center justify-center gap-1 relative`}
          >
            {myBuffedAbilities.includes(ability.id) && (
               <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[9px] px-1 rounded font-bold">BUFFED</span>
            )}
            <span className={hasIt ? "text-emerald-400" : ""}>
              {ability.id === 'moneyguy3' && pickedExternalAbility
                ? `Buyout (${ALL_ABILITIES.find(x => x.id === pickedExternalAbility)?.name || pickedExternalAbility})`
                : ability.name}
            </span>
            {isMG && ability.char !== 'moneyguy' ? (
              <div className="flex gap-2 text-[9px]">
                <span className="text-yellow-400">{mgCost.c}c</span>
                <span className="text-red-400">{mgCost.h}h</span>
              </div>
            ) : (
              <span className="text-[10px] text-[var(--hot)]">{ability.cost} Charge</span>
            )}
          </button>
        );
      })}
    </div>
  );
})()}
              {myAbilities.length >= 3 && (
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
              <div className="text-[11px] mt-2 text-slate-400 font-mono flex flex-col gap-0.5">
                <div>{myRawWpm} RAW WPM</div>
                <div>{myAccuracy}% ACC &bull; {myConsistency}% CON</div>
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
              <div className="text-[11px] mt-2 text-slate-400 font-mono flex flex-col gap-0.5">
                <div>{oppRawWpm} RAW WPM</div>
                <div>{oppAccuracy}% ACC &bull; {oppConsistency}% CON</div>
              </div>
            </div>
          </div>
          <button 
            onClick={() => {
              setMatchData(null);
              setScores({});
              setMatchWinner(null);
              setEloChanges({});
            }}
            className="mt-8 px-8 py-3 border border-slate-500 text-slate-300 font-mono text-xs uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-colors rounded cursor-pointer"
          >
            Back to Queue
          </button>
        </div>
      )}
    </div>
  );
}
