import { useEffect, useMemo, useRef, useState, useCallback, useLayoutEffect } from 'react';

import { filterWords } from '@/lib/words';
import type { RowKey } from '@/lib/words';
import type { GameConfig } from './SetupScreen';
import LiveKeyboard, { getKeyLabel } from './LiveKeyboard';
import HourglassAnimation from './HourglassAnimation';
import VirtualKeyboardConnector from './VirtualKeyboardConnector';

export interface TypedWord {
  word: string;
  correct: boolean;
}

interface Props {
  config: GameConfig;
  onFinish: (typed: TypedWord[], finalTimeElapsed?: number) => void;
  onQuit: () => void;
  onProgress?: (progress: number, wpm: number) => void;
  hideHeader?: boolean;
}

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function GameScreen({ config, onFinish, onQuit, onProgress, hideHeader }: Props) {
  const { rows, duration, minLen, maxLen, customSentences } = config;
  const pool = useMemo(() => customSentences && customSentences.length > 0 ? customSentences : filterWords(rows as RowKey[], minLen, maxLen), [rows, minLen, maxLen, customSentences]);

  // A shuffled queue of all pool words; when exhausted, reshuffle for a fresh cycle.
  // If sequential is true (for file mode), we just use the sentences in their original order.
  const queueRef = useRef<string[]>((config as any).sequential ? [...pool] : shuffle(pool));
  const [currentWord, setCurrentWord] = useState<string>(() => {
    let nextStr = queueRef.current[0] ?? '';
    if ((config as any).limitMode === 'words' && (config as any).limitValue) {
      const words = nextStr.trim().split(/\s+/);
      if (words.length > (config as any).limitValue) {
        nextStr = words.slice(0, (config as any).limitValue).join(' ');
      }
    }
    return nextStr;
  });

  const [timeLeft, setTimeLeft] = useState<number>(() => (config as any).limitMode === 'words' ? 0 : duration);
  const timeLeftRef = useRef<number>((config as any).limitMode === 'words' ? 0 : duration);
  const [typed, setTyped] = useState<string>('');
  const [, setCompleted] = useState<TypedWord[]>([]);
  const [started, setStarted] = useState<boolean>(false);
  const [flash, setFlash] = useState<'none' | 'correct' | 'wrong'>('none');
  const finishedRef = useRef<boolean>(false);
  const completedRef = useRef<TypedWord[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());

  // Caret positioning refs & state
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [caretLeft, setCaretLeft] = useState(0);
  const [caretTop, setCaretTop] = useState(0);

  const [scrollLines, setScrollLines] = useState(0);

  const updateCaretPosition = useCallback(() => {
    const nextIndex = Math.min(typed.length, currentWord.length - 1);
    
    // Compute line index accurately by tracking offsetTop changes up to the NEXT character
    let currentLine = 0;
    let lastTop = letterRefs.current[0]?.offsetTop || 0;
    for (let i = 1; i <= nextIndex; i++) {
      const el = letterRefs.current[i];
      if (el && el.offsetTop > lastTop + 10) { // +10 threshold to ignore sub-pixel rounding
        currentLine++;
        lastTop = el.offsetTop;
      }
    }

    setScrollLines(currentLine);

    const nextEl = letterRefs.current[nextIndex];
    if (nextEl) {
      // Position caret at the left edge of the character we are ABOUT to type.
      // This ensures it wraps to the next line immediately when a word wraps.
      // If we've typed everything, position it at the right edge of the last character.
      if (typed.length >= currentWord.length) {
        setCaretLeft(nextEl.offsetLeft + nextEl.offsetWidth);
      } else {
        setCaretLeft(nextEl.offsetLeft);
      }
      setCaretTop(nextEl.offsetTop + nextEl.offsetHeight / 2);
    }
  }, [typed, currentWord]);

  useLayoutEffect(() => {
    updateCaretPosition();
  }, [typed, currentWord, updateCaretPosition]);

  useEffect(() => {
    window.addEventListener('resize', updateCaretPosition);
    return () => window.removeEventListener('resize', updateCaretPosition);
  }, [updateCaretPosition]);

  const nextWord = useCallback(() => {
    queueRef.current.shift();
    if (queueRef.current.length === 0) {
      queueRef.current = (config as any).sequential ? [...pool] : shuffle(pool);
    }
    let nextStr = queueRef.current[0] ?? '';
    if ((config as any).limitMode === 'words' && (config as any).limitValue) {
      const wordsTyped = completedRef.current.reduce((acc, curr) => acc + curr.word.trim().split(/\s+/).length, 0);
      const remaining = (config as any).limitValue - wordsTyped;
      if (remaining > 0) {
        const words = nextStr.trim().split(/\s+/);
        if (words.length > remaining) {
          nextStr = words.slice(0, remaining).join(' ');
        }
      }
    }
    setCurrentWord(nextStr);
  }, [pool, config]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const isWordsMode = (config as any).limitMode === 'words';
    const elapsed = isWordsMode ? timeLeftRef.current : duration - timeLeftRef.current;
    onFinish(completedRef.current, elapsed);
  }, [onFinish, config, duration]);

  const startTimeRef = useRef<number | null>(null);

  // Timer starts on first keystroke.
  useEffect(() => {
    if (!started) return;
    startTimeRef.current = performance.now();
    let animFrameId: number;
    const isWordsMode = (config as any).limitMode === 'words';
    
    const update = () => {
      if (finishedRef.current) return;
      const now = performance.now();
      const elapsedMs = now - (startTimeRef.current || now);
      const elapsedSec = elapsedMs / 1000;
      
      let newT = 0;
      let shouldFinish = false;
      
      if (isWordsMode) {
        newT = elapsedSec;
      } else {
        newT = Math.max(0, duration - elapsedSec);
        if (newT <= 0) {
          shouldFinish = true;
          newT = 0;
        }
      }
      
      timeLeftRef.current = newT;
      setTimeLeft(newT);
      
      // Calculate WPM
      const timeElapsed = isWordsMode ? newT : duration - newT;
      const correctWords = completedRef.current.filter(w => w.correct).length;
      const currentWpm = timeElapsed > 0 ? (correctWords / timeElapsed) * 60 : 0;
      
      if (onProgress) {
        const lastProg = (startTimeRef as any).lastProgressTime || 0;
        if (now - lastProg >= 1000) {
          (startTimeRef as any).lastProgressTime = now;
          const limit = (config as any).limitValue || 20;
          const progressPct = isWordsMode ? (completedRef.current.length / limit) * 100 : (timeElapsed / duration) * 100;
          onProgress(progressPct, currentWpm);
        }
      }
      
      if (shouldFinish) {
        finish();
      } else {
        animFrameId = requestAnimationFrame(update);
      }
    };
    
    animFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animFrameId);
  }, [started, finish, duration, onProgress, config]);

  // Focus input on mount.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Submits the current word (called from the auto-advance effect below,
  // and as an Enter-key fallback for keyboards/IMEs that delay firing
  // onChange until a key like Enter commits the composition).
  const submitWord = useCallback(
    (value: string) => {
      const word = value.slice(0, currentWord.length);
      const isCorrect = word === currentWord && value.length >= currentWord.length;
      const entry: TypedWord = { word: currentWord, correct: isCorrect };
      const newCompleted = [...completedRef.current, entry];
      completedRef.current = newCompleted;
      setCompleted(newCompleted);
      setFlash(isCorrect ? 'correct' : 'wrong');
      setTimeout(() => setFlash('none'), 200);

      const wordsTyped = newCompleted.reduce((acc, curr) => acc + curr.word.trim().split(/\s+/).length, 0);
      if ((config as any).limitMode === 'words' && wordsTyped >= ((config as any).limitValue || 20)) {
        finish();
        return;
      }

      nextWord();
      setTyped('');
    },
    [currentWord, nextWord]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!started && value.length > 0) setStarted(true);
    setTyped(value);
  };

  // Auto-advance: reacts directly to state rather than the onChange event,
  // so it still fires correctly even on mobile keyboards/IMEs that batch
  // keystrokes and only flush the input's value on a delay.
  useEffect(() => {
    if (currentWord.length === 0) return;
    if (typed.length >= currentWord.length) {
      submitWord(typed);
    }
  }, [typed, currentWord, submitWord]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Visual keyboard capture
    const key = getKeyLabel(e);
    setActiveKeys(prev => new Set(prev).add(key));

    if (e.key === 'Backspace' && typed === '') {
      e.preventDefault();
    }
    // Fallback: some mobile keyboards only flush composed text on Enter.
    // If the word hasn't auto-advanced yet, force it through on Enter.
    if (e.key === 'Enter' && typed.length > 0) {
      submitWord(typed);
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = getKeyLabel(e);
    setActiveKeys(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  return (
    <div
      className="h-full min-h-0 w-full bg-background text-slate-100 flex flex-col overflow-hidden"
      onMouseDown={(e) => {
        const t = e.target as HTMLElement;
        // Don't steal focus if clicking a real interactive element
        if (t.closest('button, a, input, select, textarea, [tabindex]')) return;
        e.preventDefault();
        inputRef.current?.focus();
      }}
    >
      {/* Top bar */}
      {!hideHeader && (
        <header className="w-full flex-none px-4 sm:px-8 py-[clamp(8px,2vh,24px)] flex items-center justify-between pointer-events-auto">
          <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={onQuit}
              className="text-sm font-mono text-slate-400 hover:text-[var(--hot)] transition-colors uppercase tracking-widest z-50 relative"
            >
              &larr; Quit
            </button>
            <div className="flex items-center gap-4 text-[clamp(18px,2vw,24px)] font-bold tabular-nums">
            </div>
          </div>
        </header>
      )}

      {/* Centered single word / Paragraph box */}
      <main className="flex-1 min-h-0 w-full flex flex-col items-center justify-center overflow-visible">
        <div
          className={`relative w-full transition-colors duration-150 select-none font-mono tracking-wide max-w-5xl mx-auto px-8 py-8 md:px-12 md:py-10 translate-y-12 ${
            (config as any).mode === 'words' 
              ? 'text-center' 
              : 'text-left bg-[#15171e]/50 border border-slate-800/80 rounded-2xl shadow-xl'
          } ${
            flash === 'correct'
              ? 'text-emerald-400'
              : flash === 'wrong'
              ? 'text-rose-400'
              : 'text-slate-100'
          }`}
          style={{ fontSize: 'clamp(20px, 2.5vw, 32px)' }}
        >
          {/* Inner scroll window with fade mask to hide clipped ascenders/descenders */}
          <div 
            className="overflow-hidden relative"
            style={{ 
              height: '3.2em', 
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
              {/* Smooth Fluid Caret Bar */}
              <span
                className="absolute -translate-y-1/2 w-[3px] h-[1em] bg-[var(--hot)] rounded-full pointer-events-none transition-all duration-150 ease-out animate-caret exclude-theme"
                style={{
                  left: `${caretLeft}px`,
                  top: `${caretTop}px`,
                }}
              />

              {currentWord.split('').map((ch, ci) => {
                let cls = 'text-slate-500 exclude-theme';
                if (ci < typed.length) {
                  cls = typed[ci] === ch ? 'text-amber-300 theme-text-override' : 'text-rose-400 underline exclude-theme';
                } else if (ci === typed.length) {
                  cls = 'text-slate-100 exclude-theme';
                }
                return (
                  <span
                    key={ci}
                    ref={(el) => { letterRefs.current[ci] = el; }}
                    className={`transition-colors ${cls}`}
                  >
                    {ch}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

      </main>

      {/* Hidden input captures keystrokes */}
      <input
        ref={inputRef}
        type="text"
        value={typed}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onCompositionEnd={(e) => setTyped(e.currentTarget.value)}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="absolute opacity-0 pointer-events-none"
        aria-label="Typing input"
      />

      <footer className="w-full max-w-7xl mx-auto flex-none px-4 sm:px-12 pb-8 pt-4 flex items-center justify-between min-h-0">
        <div className="w-full max-w-[800px] perspective-[1200px] translate-y-[120px] -translate-x-24">
          <LiveKeyboard activeKeys={activeKeys} />
        </div>
        <div className="flex flex-col items-center gap-2 flex-none translate-y-[40px] ml-auto translate-x-24">
          <HourglassAnimation 
            durationVal={(config as any).limitMode === 'words' ? ((config as any).limitValue || 20) : config.duration} 
            timeLeft={(config as any).limitMode === 'words' ? Math.max(0, ((config as any).limitValue || 20) - completedRef.current.length) : timeLeft} 
            isTyping={started} 
          >
            <span className={`text-3xl font-bold tabular-nums tracking-widest ${!(config as any).limitMode || (config as any).limitMode === 'time' ? (timeLeft <= 5 ? 'text-rose-400' : 'text-white') : 'text-white'}`}>{timeLeft.toFixed(2)}s</span>
          </HourglassAnimation>
        </div>
      </footer>


      {/* Virtual Keyboard Overlay */}
      {/* Handled globally by App.tsx, GameScreen listens to virtual_keydown */}
    </div>
  );
}