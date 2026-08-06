import { useState } from 'react';

import type { RowKey } from '@/lib/words';
import { filterWords } from '@/lib/words';
import { useAuth } from '@/contexts/AuthContext';
import { parseFile, extractSentences, type ParsedDocument } from '@/lib/fileParser';
import { generateSentences } from '@/lib/quotes';

export interface GameConfig {
  rows: RowKey[];
  duration: number;
  minLen: number;
  maxLen: number;
  customSentences?: string[];
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
  const [durationWords, setDurationWords] = useState<string>('30');
  const [showCustomWords, setShowCustomWords] = useState<boolean>(false);
  const durWords = Math.max(1, Math.min(3600, parseInt(durationWords, 10) || 0));

  const [durationFile, setDurationFile] = useState<string>('30');
  const [showCustomFile, setShowCustomFile] = useState<boolean>(false);
  const durFile = Math.max(1, Math.min(3600, parseInt(durationFile, 10) || 0));

  const [durationSentences, setDurationSentences] = useState<string>('30');
  const [showCustomSentences, setShowCustomSentences] = useState<boolean>(false);
  const durSentences = Math.max(1, Math.min(3600, parseInt(durationSentences, 10) || 0));
  const [minLen, setMinLen] = useState<number>(3);
  const [maxLen, setMaxLen] = useState<number>(8);
  const [error, setError] = useState<string>('');
  const [activeMode, setActiveMode] = useState<string | null>(null);

  const [parsedDoc, setParsedDoc] = useState<ParsedDocument | null>(null);
  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(1);
  const [fileError, setFileError] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);

  const [isLoadingQuotes, setIsLoadingQuotes] = useState<boolean>(false);
  const [quoteError, setQuoteError] = useState<string>('');
  
  const [apiKey, setApiKey] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('gemini_api_key') || '';
    return '';
  });
  const [minWordsSentences, setMinWordsSentences] = useState<number>(5);
  const [maxWordsSentences, setMaxWordsSentences] = useState<number>(12);

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    if (typeof window !== 'undefined') localStorage.setItem('gemini_api_key', val);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    setFileError('');
    try {
      const doc = await parseFile(file);
      setParsedDoc(doc);
      setStartPage(1);
      setEndPage(doc.pages.length);
    } catch (err: any) {
      setFileError(err.message || 'Error reading file');
      setParsedDoc(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleStartFile = () => {
    if (!parsedDoc) {
      setFileError('Please upload a file first.');
      return;
    }
    const sentences = extractSentences(parsedDoc.pages, startPage, endPage, parsedDoc.isTextFile);
    if (sentences.length === 0) {
      setFileError('No sentences found in the selected range.');
      return;
    }
    onStart({ rows, duration: durFile, minLen, maxLen, customSentences: sentences });
  };

  const handleStartRandomSentences = async () => {
    setIsLoadingQuotes(true);
    setQuoteError('');
    try {
      const sentences = await generateSentences(apiKey, rows, minWordsSentences, maxWordsSentences, 20);
      onStart({ rows, duration: durSentences, minLen, maxLen, customSentences: sentences });
    } catch (err: any) {
      setQuoteError('Failed to load random sentences.');
    } finally {
      setIsLoadingQuotes(false);
    }
  };

  const renderDurationSelector = (
    stepNumber: number,
    durationInput: string,
    setDurationInput: (v: string) => void,
    showCustom: boolean,
    setShowCustom: (v: boolean) => void,
    durationVal: number
  ) => {
    const isPresetValue = PRESET_DURATIONS.some((d) => d.value === durationVal);
    return (
      <section className="bg-slate-800/40 p-6 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-7 h-7 rounded-full bg-amber-400 text-slate-900 font-bold text-sm flex items-center justify-center">{stepNumber}</span>
          <h2 className="text-lg font-semibold flex items-center gap-2">
             Pick a time limit
          </h2>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {PRESET_DURATIONS.map((d) => {
              const active = !showCustom && durationVal === d.value;
              return (
                <button
                  key={d.value}
                  onClick={() => {
                    setError('');
                    setShowCustom(false);
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
            onClick={() => { setError(''); setShowCustom(true); }}
            className={`w-full px-3 py-2.5 text-sm font-semibold text-center transition-all ${
              showCustom || !isPresetValue
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50'
                : 'bg-slate-900/40 text-slate-400 border border-slate-700/50 hover:bg-slate-700/60'
            }`}
          >
            Custom
          </button>

          {(showCustom || !isPresetValue) && (
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
              <span className="text-slate-400">seconds</span>
            </div>
          )}
        </div>
      </section>
    );
  };

  const toggleRow = (r: RowKey) => {
    setError('');
    setRows((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };

  const canStart = rows.length > 0 && minLen <= maxLen && durWords > 0;

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
    onStart({ rows, duration: durWords, minLen, maxLen });
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
        {(!activeMode || activeMode === 'words') && (
          <>
            <button 
              onClick={() => setActiveMode(activeMode === 'words' ? null : 'words')}
          className={`w-full p-6 border transition-all text-left group ${
            activeMode === 'words' 
              ? 'bg-amber-400/5 border-amber-400/50' 
              : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-100">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
                activeMode === 'words' ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-slate-300 group-hover:bg-amber-400/20 group-hover:text-amber-400'
              }`}>
                W
              </span>
              Words
            </h2>
            <span className={`text-sm font-medium transition-colors ${
              activeMode === 'words' ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'
            }`}>
              {activeMode === 'words' ? 'Close settings' : 'Configure & Start'}
            </span>
          </div>
        </button>

        {activeMode === 'words' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
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

        {renderDurationSelector(2, durationWords, setDurationWords, showCustomWords, setShowCustomWords, durWords)}

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
          )}
          </>
        )}

        {/* File Mode Toggle */}
        {(!activeMode || activeMode === 'file') && (
          <>
            <button 
              onClick={() => setActiveMode(activeMode === 'file' ? null : 'file')}
          className={`w-full p-6 border transition-all text-left group mt-4 ${
            activeMode === 'file' 
              ? 'bg-amber-400/5 border-amber-400/50' 
              : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-100">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
                activeMode === 'file' ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-slate-300 group-hover:bg-amber-400/20 group-hover:text-amber-400'
              }`}>
                F
              </span>
              Sentences from file
            </h2>
            <span className={`text-sm font-medium transition-colors ${
              activeMode === 'file' ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'
            }`}>
              {activeMode === 'file' ? 'Close settings' : 'Configure & Start'}
            </span>
          </div>
        </button>

        {activeMode === 'file' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-300 mt-8">
            <section className="bg-slate-800/40 p-6 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-7 h-7 rounded-full bg-amber-400 text-slate-900 font-bold text-sm flex items-center justify-center">1</span>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                   Upload Document
                </h2>
              </div>
              <input
                type="file"
                accept=".txt,.pdf,.docx,.pptx"
                onChange={handleFileUpload}
                className="w-full text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-400 file:text-slate-900 hover:file:bg-amber-300 transition-colors"
              />
              {isParsing && <p className="text-amber-400 mt-3 text-sm">Parsing file...</p>}
              {parsedDoc && !isParsing && (
                <p className="text-emerald-400 mt-3 text-sm">✓ File parsed successfully ({parsedDoc.pages.length} pages found)</p>
              )}
            </section>

            <section className={`bg-slate-800/40 p-6 border border-slate-700/50 transition-opacity ${parsedDoc?.isTextFile ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-7 h-7 rounded-full bg-amber-400 text-slate-900 font-bold text-sm flex items-center justify-center">2</span>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                   Select Page Range
                </h2>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                {parsedDoc?.isTextFile ? "Page selection is disabled for TXT files. The entire file will be used." : "Choose which pages to extract sentences from."}
              </p>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Starting Page</label>
                  <input
                    type="number"
                    min={1}
                    max={parsedDoc ? parsedDoc.pages.length : 1}
                    value={startPage}
                    onChange={(e) => setStartPage(parseInt(e.target.value) || 1)}
                    disabled={!parsedDoc || parsedDoc.isTextFile}
                    className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 focus:border-amber-400 focus:outline-none text-lg font-semibold text-center text-slate-100 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Ending Page</label>
                  <input
                    type="number"
                    min={startPage}
                    max={parsedDoc ? parsedDoc.pages.length : 1}
                    value={endPage}
                    onChange={(e) => setEndPage(parseInt(e.target.value) || 1)}
                    disabled={!parsedDoc || parsedDoc.isTextFile}
                    className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 focus:border-amber-400 focus:outline-none text-lg font-semibold text-center text-slate-100 disabled:opacity-50"
                  />
                </div>
              </div>
              <p className="text-sm text-amber-400/80 italic mt-2">
                Note: Page limits act as bounds. The text extracted may be large depending on page content.
              </p>
            </section>

            {renderDurationSelector(3, durationFile, setDurationFile, showCustomFile, setShowCustomFile, durFile)}

            {fileError && (
              <div className="text-center text-rose-400 text-sm font-medium">{fileError}</div>
            )}

            <div className="flex justify-center">
              <button
                onClick={handleStartFile}
                disabled={!parsedDoc || isParsing}
                className={`flex items-center gap-3 px-10 py-4 font-bold text-lg transition-all ${
                  parsedDoc && !isParsing
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 hover:scale-105'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Start Typing
              </button>
            </div>
            </div>
          )}
          </>
        )}

        {/* Random Sentences Toggle */}
        {(!activeMode || activeMode === 'random-sentences') && (
          <>
            <button 
              onClick={() => setActiveMode(activeMode === 'random-sentences' ? null : 'random-sentences')}
          className={`w-full p-6 border transition-all text-left group mt-4 ${
            activeMode === 'random-sentences' 
              ? 'bg-amber-400/5 border-amber-400/50' 
              : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-100">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
                activeMode === 'random-sentences' ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-slate-300 group-hover:bg-amber-400/20 group-hover:text-amber-400'
              }`}>
                R
              </span>
              Random Sentences
            </h2>
            <span className={`text-sm font-medium transition-colors ${
              activeMode === 'random-sentences' ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'
            }`}>
              {activeMode === 'random-sentences' ? 'Close settings' : 'Configure & Start'}
            </span>
          </div>
        </button>

        {activeMode === 'random-sentences' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-300 mt-8">
            <section className="bg-slate-800/40 p-6 border border-slate-700/50">
              <h3 className="text-xl font-bold mb-4 text-amber-400">Sentence Configuration</h3>
              <p className="text-slate-300 mb-6 text-sm">
                Provide a Gemini API Key to generate custom sentences via AI. If left blank, we will generate sentences using a Markov Chain trained on English quotes.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Gemini API Key (Optional)</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 focus:border-amber-400 focus:outline-none text-lg font-mono text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Min Words</label>
                    <input
                      type="number"
                      min={2}
                      max={maxWordsSentences}
                      value={minWordsSentences}
                      onChange={(e) => setMinWordsSentences(parseInt(e.target.value) || 2)}
                      className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 focus:border-amber-400 focus:outline-none text-lg font-semibold text-center text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Max Words</label>
                    <input
                      type="number"
                      min={minWordsSentences}
                      max={100}
                      value={maxWordsSentences}
                      onChange={(e) => setMaxWordsSentences(parseInt(e.target.value) || 12)}
                      className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 focus:border-amber-400 focus:outline-none text-lg font-semibold text-center text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Allowed Rows (Both AI & Markov Mode)</label>
                  <div className="flex gap-4">
                    {(['top', 'home', 'bottom'] as RowKey[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => toggleRow(r)}
                        className={`flex-1 py-3 text-lg font-bold capitalize transition-colors ${
                          rows.includes(r)
                            ? 'bg-amber-400 text-slate-900'
                            : 'bg-slate-900/50 text-slate-500 hover:bg-slate-800'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {renderDurationSelector(2, durationSentences, setDurationSentences, showCustomSentences, setShowCustomSentences, durSentences)}

            {quoteError && (
              <div className="text-center text-rose-400 text-sm font-medium">{quoteError}</div>
            )}

            <div className="flex justify-center">
              <button
                onClick={handleStartRandomSentences}
                disabled={isLoadingQuotes}
                className={`flex items-center gap-3 px-10 py-4 font-bold text-lg transition-all ${
                  !isLoadingQuotes
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 hover:scale-105'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isLoadingQuotes ? 'Loading Quotes...' : 'Start Typing'}
              </button>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}