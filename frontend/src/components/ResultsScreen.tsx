import { useEffect, useState, useRef } from 'react';

import type { TypedWord } from './GameScreen';
import { fetchMeaning, meaningToText, type MeaningResult } from '@/lib/dictionary';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { RowKey } from '@/lib/words';

interface Props {
  typed: TypedWord[];
  duration: number;
  rows?: RowKey[];
  onPlayAgain: () => void;
  onHome: () => void;
}

interface WordState {
  meanings: MeaningResult[] | null;
  loading: boolean;
  error: string;
  saved: boolean;
  saving: boolean;
}

export default function ResultsScreen({ typed, duration, rows, onPlayAgain, onHome }: Props) {
  const { user, refreshUser } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [states, setStates] = useState<Record<string, WordState>>({});
  const resultSavedRef = useRef<boolean>(false);

  const correctCount = typed.filter((t) => t.correct).length;
  const accuracy = typed.length > 0 ? Math.round((correctCount / typed.length) * 100) : 0;
  // WPM formula = (correct characters / 5) / minutes
  const correctChars = typed.filter((t) => t.correct).reduce((sum, t) => sum + t.word.length, 0);
  const minutes = duration > 0 ? duration / 60 : 1;
  const wpm = minutes > 0 ? Math.round(correctChars / 5 / minutes) : 0;
  const uniqueWords = Array.from(new Set(typed.map((t) => t.word)));

  useEffect(() => {
    if (typeof window !== 'undefined' && wpm > 0) {
      const stored = localStorage.getItem('velocitype_highest_wpm');
      const highest = stored ? parseInt(stored, 10) : 0;
      if (wpm > highest) {
        localStorage.setItem('velocitype_highest_wpm', wpm.toString());
      }
    }
  }, [wpm]);

  // Save result to MongoDB backend via Node.js API
  useEffect(() => {
    if (user && !resultSavedRef.current) {
      resultSavedRef.current = true;
      api
        .saveResult({
          wpm,
          accuracy,
          correctCount,
          totalWords: typed.length,
          duration,
          rows,
        })
        .then(() => refreshUser())
        .catch((err) => console.error('Failed to auto-save test result to backend:', err));
    }
  }, [user, wpm, accuracy, correctCount, typed.length, duration, rows, refreshUser]);

  const ensureState = (word: string): WordState => {
    if (states[word]) return states[word];
    return { meanings: null, loading: false, error: '', saved: false, saving: false };
  };

  const loadMeaning = async (word: string) => {
    if (states[word]?.meanings || states[word]?.loading) return;
    setStates((prev) => ({ ...prev, [word]: { ...ensureState(word), loading: true } }));
    const result = await fetchMeaning(word);
    setStates((prev) => ({
      ...prev,
      [word]: {
        ...ensureState(word),
        loading: false,
        meanings: result,
        error: result ? '' : 'No definition found.',
      },
    }));
  };

  const handleSelect = (word: string) => {
    setSelected(word);
    loadMeaning(word);
  };

  const handleSave = async (word: string) => {
    const st = states[word];
    if (st?.saved || st?.saving) return;
    setStates((prev) => ({ ...prev, [word]: { ...ensureState(word), saving: true } }));
    const meaning = meaningToText(st?.meanings ?? null);

    try {
      await api.saveWord(word, meaning);
      setStates((prev) => ({
        ...prev,
        [word]: { ...ensureState(word), saving: false, saved: true },
      }));
      refreshUser();
    } catch (err) {
      console.error('Failed to save word:', err);
      setStates((prev) => ({
        ...prev,
        [word]: { ...ensureState(word), saving: false, saved: false, error: 'Sign in to save words.' },
      }));
    }
  };

  // Auto-load the first word's meaning
  useEffect(() => {
    if (uniqueWords.length > 0) {
      handleSelect(uniqueWords[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedState = selected ? states[selected] : undefined;

  return (
    <div className="h-[100dvh] w-full bg-[#0f1117] text-slate-100 p-4 sm:p-8 flex flex-col overflow-hidden">
      <div className="max-w-5xl w-full mx-auto flex-1 min-h-0 flex flex-col">
        {/* Header / stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Round complete</h1>
            <p className="text-slate-400">Click any word to see its meaning and save it to your library.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onPlayAgain}
              className="flex items-center gap-2 px-5 py-2.5 bg-[var(--hot)] text-slate-900 font-semibold hover:opacity-90 transition-opacity"
            >
               Play again
            </button>
            <button
              onClick={onHome}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 transition-colors font-medium"
            >
               Home
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8 flex-none">
          <StatCard label="Words typed" value={String(typed.length)} />
          <StatCard label="Correct" value={String(correctCount)} />
          <StatCard label="Accuracy" value={`${accuracy}%`} />
          <StatCard label="WPM" value={String(wpm)} highlight />
        </div>

        <div className="flex-1 min-h-0 grid lg:grid-cols-2 gap-4 lg:gap-6 pb-4">
          {/* Word list */}
          <div className="bg-slate-800/40 p-4 sm:p-5 border border-slate-700/50 flex flex-col min-h-0">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 flex-none flex items-center gap-2">
               All words ({typed.length})
            </h2>
            <div className="flex-1 overflow-y-auto pr-1 flex flex-wrap gap-2 content-start custom-scrollbar">
              {typed.map((t, i) => {
                const w = t.word;
                const isSel = selected === w;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(w)}
                    className={`px-3 py-1.5 font-mono text-sm transition-all flex items-center gap-1.5 ${
                      isSel
                        ? 'bg-[var(--hot)] text-slate-900'
                        : 'bg-slate-900/50 hover:bg-slate-700/60 text-slate-200'
                    }`}
                  >
                    {w}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meaning panel */}
          <div className="bg-slate-800/40 p-4 sm:p-6 border border-slate-700/50 flex flex-col min-h-0">
            {selected ? (
              <div className="flex flex-col h-full min-h-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold font-mono capitalize">{selected}</h3>
                  <button
                    onClick={() => handleSave(selected)}
                    disabled={selectedState?.saved || selectedState?.saving}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                      selectedState?.saved
                        ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                        : selectedState?.saving
                        ? 'bg-slate-700 text-slate-400 cursor-wait'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                    }`}
                  >
                    {selectedState?.saved ? (
                      <> Saved</>
                    ) : selectedState?.saving ? (
                      <> Saving</>
                    ) : (
                      <> Save to library</>
                    )}
                  </button>
                </div>

                {selectedState?.loading ? (
                  <div className="flex items-center gap-2 text-slate-400 flex-none">
                     Looking up definition
                  </div>
                ) : selectedState?.meanings && selectedState.meanings.length > 0 ? (
                  <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                    {selectedState.meanings.map((m, i) => (
                      <div key={i} className="border-l-2 border-[var(--hot)]/40 pl-3">
                        <span className="text-xs uppercase tracking-wide text-[var(--hot)] font-semibold">{m.partOfSpeech}</span>
                        <p className="text-slate-200">{m.definition}</p>
                        {m.example && (
                          <p className="text-slate-400 text-sm italic mt-1">"{m.example}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">{selectedState?.error || 'No definition found.'}</p>
                )}
              </div>
            ) : (
              <p className="text-slate-400">Select a word to view its meaning.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-slate-800/40 p-2 sm:p-4 border border-slate-700/50 text-center flex flex-col justify-center">
      <div className={`text-2xl sm:text-3xl font-bold ${highlight ? 'text-[var(--hot)]' : 'text-slate-100'}`}>{value}</div>
      <div className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wide mt-1">{label}</div>
    </div>
  );
}