import { useState } from 'react';

import type { RowKey } from '@/lib/words';
import { filterWords } from '@/lib/words';
import { useAuth } from '@/contexts/AuthContext';

export interface GameConfig {
  rows: RowKey[];
  duration: number;
  minLen: number;
  maxLen: number;
}

interface Props {
  onStart: (config: GameConfig) => void;
  onOpenLibrary: () => void;
  onOpenLeaderboard: () => void;
  onOpenAuth: () => void;
  onOpenFont: () => void;
  onOpenColor: () => void;
  onOpenUiColor: () => void;
}

const ROW_LABELS: { key: RowKey; label: string; keys: string }[] = [
  { key: 'top', label: 'Top Row', keys: 'Q W E R T Y U I O P' },
  { key: 'home', label: 'Home Row', keys: 'A S D F G H J K L' },
  { key: 'bottom', label: 'Bottom Row', keys: 'Z X C V B N M' },
];

const PRESET_DURATIONS: { label: string; value: number }[] = [
  { label: '30 sec', value: 30 },
  { label: '1 min', value: 60 },
  { label: '3 min', value: 180 },
  { label: '5 min', value: 300 },
  { label: '10 min', value: 600 },
];

export default function SetupScreen({
  onStart,
  onOpenLibrary,
  onOpenLeaderboard,
  onOpenAuth,
  onOpenFont,
  onOpenColor,
  onOpenUiColor,
}: Props) {
  const { user, stats, logout } = useAuth();
  const [rows, setRows] = useState<RowKey[]>(['home']);
  const [durationInput, setDurationInput] = useState<string>('30');
  const duration = Math.max(1, Math.min(3600, parseInt(durationInput, 10) || 0));
  const [showCustomDuration, setShowCustomDuration] = useState<boolean>(false);
  const [minLen, setMinLen] = useState<number>(3);
  const [maxLen, setMaxLen] = useState<number>(8);
  const [error, setError] = useState<string>('');

  const isPresetValue = PRESET_DURATIONS.some((d) => d.value === duration);

  const toggleRow = (r: RowKey) => {
    setError('');
    setRows((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };

  const canStart = rows.length > 0 && minLen <= maxLen && duration > 0;

  const handleStart = () => {
    if (rows.length === 0) {
      setError('Select at least one key row.');
      return;
    }
    if (minLen > maxLen) {
      setError('Minimum length cannot exceed maximum length.');
      return;
    }
    const pool = filterWords(rows, minLen, maxLen);
    if (pool.length === 0) {
      setError('No words match these filters. Try wider length or more rows.');
      return;
    }
    onStart({ rows, duration, minLen, maxLen });
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-100 flex flex-col items-center px-4 py-10">
      {/* Header */}
      <header className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Velocitype</h1>
            <p className="text-sm text-slate-400">Train your fingers. Learn words.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onOpenFont}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 transition-colors text-sm font-medium border border-slate-700/50"
            title="Choose Google Font"
          >
            
            Fonts
          </button>

          {/* New Colors Button */}
          <button
            onClick={onOpenColor}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 transition-colors text-sm font-medium border border-slate-700/50"
            title="Choose Text Color"
          >
            
            Colors
          </button>
          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 transition-colors text-sm font-medium border border-slate-700/50"
          >
            
            Rankings
          </button>
          <button
            onClick={onOpenLibrary}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 transition-colors text-sm font-medium border border-slate-700/50"
          >
            
            Library
          </button>

          {user ? (
            <div className="flex items-center gap-2 bg-slate-800/90 pl-3 pr-2 py-1.5 border border-slate-700/60 text-sm">
              <div className="flex items-center gap-2">
                
                <span className="font-semibold">{user.username}</span>
                {stats?.bestWpm ? (
                  <span className="text-xs px-2 py-0.5 bg-amber-400/20 text-amber-300 font-mono">
                    {stats.bestWpm} WPM
                  </span>
                ) : null}
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
              >
                
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-2 bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 transition-colors text-sm shadow-md"
            >
              
              Sign In
            </button>
          )}
        </div>
      </header>

      <div className="w-full max-w-3xl space-y-8">
        {/* Step 1: Key rows */}
        <section className="bg-slate-800/40 p-6 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-full bg-amber-400 text-slate-900 font-bold text-sm flex items-center justify-center">1</span>
            <h2 className="text-lg font-semibold flex items-center gap-2">
               Choose your key rows
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {ROW_LABELS.map((r) => {
              const active = rows.includes(r.key);
              return (
                <button
                  key={r.key}
                  onClick={() => toggleRow(r.key)}
                  className={`text-left p-4 border transition-all ${
                    active
                      ? 'border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-500/10'
                      : 'border-slate-700 bg-slate-900/40 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{r.label}</span>
                    <span
                      className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${
                        active ? 'border-amber-400 bg-amber-400' : 'border-slate-600'
                      }`}
                    >
                      {active && <span className="w-2 h-2 bg-slate-900" />}
                    </span>
                  </div>
                  <code className="text-xs text-slate-400 tracking-wider">{r.keys}</code>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2: Duration */}
        <section className="bg-slate-800/40 p-6 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-full bg-amber-400 text-slate-900 font-bold text-sm flex items-center justify-center">2</span>
            <h2 className="text-lg font-semibold flex items-center gap-2">
               Pick a time limit
            </h2>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {PRESET_DURATIONS.map((d) => {
                const active = !showCustomDuration && duration === d.value;
                return (
                  <button
                    key={d.value}
                    onClick={() => {
                      setError('');
                      setShowCustomDuration(false);
                      setDurationInput(String(d.value));
                    }}
                    className={`px-3 py-2.5 text-sm font-semibold transition-all ${
                      active
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50'
                        : 'bg-slate-900/40 text-slate-400 border border-slate-700/50 hover:bg-slate-700/60'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => { setError(''); setShowCustomDuration(true); }}
              className={`w-full px-3 py-2.5 text-sm font-semibold text-center transition-all ${
                showCustomDuration || !isPresetValue
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50'
                  : 'bg-slate-900/40 text-slate-400 border border-slate-700/50 hover:bg-slate-700/60'
              }`}
            >
              Custom
            </button>

            {(showCustomDuration || !isPresetValue) && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={3600}
                  autoFocus
                  value={durationInput}
                  onChange={(e) => { setError(''); setDurationInput(e.target.value); }}
                  className="w-28 px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 focus:border-amber-400 focus:outline-none text-lg font-semibold text-center text-slate-100"
                />
                <span className="text-slate-400 font-medium">seconds</span>
              </div>
            )}
          </div>
        </section>

        {/* Step 3: Word length */}
        <section className="bg-slate-800/40 p-6 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-full bg-amber-400 text-slate-900 font-bold text-sm flex items-center justify-center">3</span>
            <h2 className="text-lg font-semibold flex items-center gap-2">
               Set word length
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Minimum letters</label>
              <input
                type="number"
                min={2}
                max={45}
                value={minLen}
                onChange={(e) => {
                  setError('');
                  const val = parseInt(e.target.value, 10);
                  setMinLen(Number.isNaN(val) ? 2 : Math.max(2, Math.min(45, val)));
                }}
                className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 focus:border-amber-400 focus:outline-none text-lg font-semibold text-center text-slate-100"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Maximum letters</label>
              <input
                type="number"
                min={2}
                max={45}
                value={maxLen}
                onChange={(e) => {
                  setError('');
                  const val = parseInt(e.target.value, 10);
                  setMaxLen(Number.isNaN(val) ? 2 : Math.max(2, Math.min(45, val)));
                }}
                className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 focus:border-amber-400 focus:outline-none text-lg font-semibold text-center text-slate-100"
              />
            </div>
          </div>
        </section>

        {error && (
          <div className="text-center text-rose-400 text-sm font-medium">{error}</div>
        )}

        {/* Play button */}
        <div className="flex justify-center">
          <button
            onClick={handleStart}
            disabled={!canStart}
            className={`flex items-center gap-3 px-10 py-4 font-bold text-lg transition-all ${
              canStart
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 hover:scale-105'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            
            Start Typing
          </button>
        </div>
      </div>
    </div>
  );
}