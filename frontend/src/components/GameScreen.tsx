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
  onFinish: (typed: TypedWord[]) => void;
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
  const [currentWord, setCurrentWord] = useState<string>(() => queueRef.current[0] ?? '');

  const [timeLeft, setTimeLeft] = useState<number>(duration);
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
    setCurrentWord(queueRef.current[0] ?? '');
  }, [pool, config]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish(completedRef.current);
  }, [onFinish]);

  // Timer starts on first keystroke.
  useEffect(() => {
    if (!started) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          finish();
          return 0;
        }
        
        // Calculate WPM
        const timeElapsed = duration - (t - 1);
        const correctWords = completedRef.current.filter(w => w.correct).length;
        const currentWpm = timeElapsed > 0 ? (correctWords / timeElapsed) * 60 : 0;
        
        if (onProgress) {
          onProgress((timeElapsed / duration) * 100, currentWpm);
        }
        
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [started, finish, duration, onProgress]);

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
      completedRef.current = [...completedRef.current, entry];
      setCompleted((prev) => [...prev, entry]);
      setFlash(isCorrect ? 'correct' : 'wrong');
      setTimeout(() => setFlash('none'), 200);
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
    if (e.key === 'Escape') {
      onQuit();
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
      className="h-full min-h-0 w-full bg-[#0f1117] text-slate-100 flex flex-col overflow-hidden"
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
          className={`relative w-full transition-colors duration-150 select-none font-mono tracking-wide ${
            (config as any).mode === 'file' || (config as any).mode === 'random-sentences'
              ? 'max-w-5xl mx-auto text-left px-8 py-8 md:px-12 md:py-10 bg-[#15171e]/80 border border-slate-800/80 rounded-2xl shadow-xl'
              : 'max-w-7xl mx-auto text-center px-4 py-[clamp(10px,4vh,40px)]'
          } ${
            flash === 'correct'
              ? 'text-emerald-400'
              : flash === 'wrong'
              ? 'text-rose-400'
              : 'text-slate-100'
          }`}
          style={(config as any).mode === 'file' || (config as any).mode === 'random-sentences'
            ? { fontSize: 'clamp(20px, 2.5vw, 32px)' }
            : { whiteSpace: 'pre-wrap', fontSize: 'clamp(32px, min(8vw, 12vh), 120px)', lineHeight: 1.4, paddingBottom: '0.35em' }}
        >
          {/* Inner scroll window with fade mask to hide clipped ascenders/descenders */}
          <div 
            className={(config as any).mode === 'file' || (config as any).mode === 'random-sentences' ? 'overflow-hidden relative' : ''}
            style={(config as any).mode === 'file' || (config as any).mode === 'random-sentences' ? { 
              height: '3.2em', 
              lineHeight: 1.6,
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)'
            } : {}}
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
          <span className={`text-2xl font-bold tabular-nums font-mono tracking-widest ${timeLeft <= 5 ? 'text-rose-400' : 'text-[var(--hot)]'}`}>{timeLeft}s</span>
          <HourglassAnimation durationVal={config.duration} timeLeft={timeLeft} isTyping={started} />
        </div>
      </footer>


      {/* Virtual Keyboard Overlay */}
      {/* Handled globally by App.tsx, GameScreen listens to virtual_keydown */}
    </div>
  );
}