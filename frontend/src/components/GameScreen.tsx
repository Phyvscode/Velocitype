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
  const queueRef = useRef<string[]>(shuffle(pool));
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

  useEffect(() => {
    if (letterRefs.current[typed.length]) {
      const el = document.getElementById('current-word');
      if (!el) return;
      if (typed.length < currentWord.length) {
        setCaretLeft(el.offsetLeft);
        setCaretTop(el.offsetTop + el.offsetHeight / 2);
      }
    } else if (typed.length > 0 && letterRefs.current[typed.length - 1]) {
      const el = letterRefs.current[typed.length - 1];
      if (!el) return;
      setCaretLeft(el.offsetLeft + el.offsetWidth);
      setCaretTop(el.offsetTop + el.offsetHeight / 2);
    } else {
      setCaretLeft(0);
      setCaretTop(0);
    }
  }, [typed, currentWord]);

  const updateCaretPosition = useCallback(() => {
    if (typed.length === 0) {
      const firstEl = letterRefs.current[0];
      if (firstEl) {
        setCaretLeft(firstEl.offsetLeft);
        setCaretTop(firstEl.offsetTop + firstEl.offsetHeight / 2);
      }
    } else {
      const targetIndex = Math.min(typed.length - 1, currentWord.length - 1);
      const targetEl = letterRefs.current[targetIndex];
      if (targetEl) {
        setCaretLeft(targetEl.offsetLeft + targetEl.offsetWidth);
        setCaretTop(targetEl.offsetTop + targetEl.offsetHeight / 2);
      }
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
      queueRef.current = shuffle(pool);
    }
    setCurrentWord(queueRef.current[0] ?? '');
  }, [pool]);

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
              onMouseDown={(e) => e.stopPropagation()}
              onClick={onQuit}
              className="text-sm font-mono text-slate-400 hover:text-[var(--hot)] transition-colors uppercase tracking-widest"
            >
              &larr; Quit
            </button>
            <div className="flex items-center gap-4 text-[clamp(18px,2vw,24px)] font-bold tabular-nums">
            </div>
          </div>
        </header>
      )}

      {/* Centered single word */}
      <main className="flex-1 min-h-0 w-full flex flex-col items-center justify-center overflow-visible">
        <div
          className={`relative w-full max-w-7xl mx-auto text-center font-mono tracking-wide select-none transition-colors duration-150 px-4 py-[clamp(10px,4vh,40px)] ${
            flash === 'correct'
              ? 'text-emerald-400'
              : flash === 'wrong'
              ? 'text-rose-400'
              : 'text-slate-100'
          }`}
          style={{ whiteSpace: 'pre-wrap', fontSize: 'clamp(32px, min(8vw, 12vh), 120px)', lineHeight: 1.4, paddingBottom: '0.35em' }}
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
                className={`transition-colors leading-loose ${cls}`}
              >
                {ch}
              </span>
            );
          })}
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