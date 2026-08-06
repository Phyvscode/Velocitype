import { useEffect, useMemo, useRef, useState, useCallback, useLayoutEffect } from 'react';

import { filterWords } from '@/lib/words';
import type { RowKey } from '@/lib/words';
import type { GameConfig } from './SetupScreen';

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

  // Caret positioning refs & state
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [caretLeft, setCaretLeft] = useState<number>(0);

  const updateCaretPosition = useCallback(() => {
    if (typed.length === 0) {
      const firstEl = letterRefs.current[0];
      if (firstEl) {
        setCaretLeft(firstEl.offsetLeft);
      }
    } else {
      const targetIndex = Math.min(typed.length - 1, currentWord.length - 1);
      const targetEl = letterRefs.current[targetIndex];
      if (targetEl) {
        setCaretLeft(targetEl.offsetLeft + targetEl.offsetWidth);
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

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-100 flex flex-col items-center px-4 py-8">
      {/* Top bar */}
      {!hideHeader && (
        <div className="w-full max-w-4xl flex items-center justify-between mb-8">
          <button
            onClick={onQuit}
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Quit
          </button>
          <div className="flex items-center gap-2 text-2xl font-bold tabular-nums">
            <span className={timeLeft <= 5 ? 'text-rose-400' : 'text-slate-100'}>{timeLeft}s</span>
          </div>
        </div>
      )}

      {/* Centered single word */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <div
          className={`relative flex items-center text-6xl sm:text-7xl font-mono tracking-wide select-none transition-colors duration-150 py-2 px-1 ${
            flash === 'correct'
              ? 'text-emerald-400'
              : flash === 'wrong'
              ? 'text-rose-400'
              : 'text-slate-100'
          }`}
        >
          {/* Smooth Fluid Caret Bar */}
          <span
            className="absolute top-1/2 -translate-y-1/2 w-[3.5px] h-[75%] bg-gradient-to-b from-amber-300 via-amber-400 to-orange-500 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.85)] pointer-events-none transition-all duration-150 ease-out animate-cursor-blink"
            style={{
              left: `${caretLeft}px`,
            }}
          />

          {currentWord.split('').map((ch, ci) => {
            let cls = 'text-slate-500';
            if (ci < typed.length) {
              cls = typed[ci] === ch ? 'text-amber-300 theme-text-override' : 'text-rose-400 underline exclude-theme';
            } else if (ci === typed.length) {
              cls = 'text-slate-100 theme-text-override';
            }
            return (
              <span
                key={ci}
                ref={(el) => { letterRefs.current[ci] = el; }}
                className={`inline-block transition-colors ${cls}`}
              >
                {ch === ' ' ? '\u00A0' : ch}
              </span>
            );
          })}
        </div>

        <div className="mt-10 flex items-center gap-2 text-sm text-slate-500">
          
          {started ? 'Type the word. It advances automatically.' : 'Start typing to begin the timer.'}
        </div>
      </div>

      {/* Hidden input captures keystrokes */}
      <input
        ref={inputRef}
        type="text"
        value={typed}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onCompositionEnd={(e) => setTyped(e.currentTarget.value)}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="absolute opacity-0 pointer-events-none"
        aria-label="Typing input"
      />

      {/* Click anywhere to refocus */}
      <div
        className="fixed inset-0 -z-10"
        onClick={() => inputRef.current?.focus()}
      />
    </div>
  );
}