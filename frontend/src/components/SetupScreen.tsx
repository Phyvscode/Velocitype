import { useState, useRef, useEffect, useLayoutEffect } from 'react';

import type { RowKey } from '@/lib/words';
import { filterWords } from '@/lib/words';
import { useAuth } from '@/contexts/AuthContext';
import { parseFile, extractSentences, type ParsedDocument } from '@/lib/fileParser';
import { generateSentences } from '@/lib/quotes';
import LiveKeyboard, { getKeyLabel } from './LiveKeyboard';
import VersusModeSetup from './VersusModeSetup';
import { ProfileOrb } from './ProfileOrb';
import VirtualKeyboardConnector from './VirtualKeyboardConnector';
import BorderModal from './BorderModal';
import ClockTimeSelector from './ClockTimeSelector';
import PortalBorderOverlay from './PortalBorderOverlay';

export interface GameConfig {
  rows: RowKey[];
  duration: number; // Keep for backwards compatibility
  minLen: number;
  maxLen: number;
  customSentences?: string[];
  useVirtualKeyboard?: boolean;
  limitMode?: 'time' | 'words';
  limitValue?: number;
}

interface Props {
  onStart: (config: GameConfig) => void;
  onOpenLibrary: () => void;
  onOpenLeaderboard: () => void;
  onOpenAuth: () => void;
  onOpenFont: () => void;
  onOpenColor: () => void;
  onOpenUiColor: () => void;
  onOpenBorder: () => void;
  onLobbyJoined: (code: string) => void;
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

const AnimatedBorderButton = ({ onClick, children }: { onClick: () => void, children: React.ReactNode }) => (
  <button onClick={onClick} className="relative text-[var(--hot)] px-3 py-1.5 group transition-colors hover:text-white">
    {children}
    <span className="exclude-theme absolute left-0 bottom-0 w-full h-[2px] bg-[var(--hot)] scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-300 ease-out shadow-[0_0_8px_var(--color-hot-soft)]"></span>
    <span className="exclude-theme absolute left-0 top-0 w-full h-[2px] bg-[var(--hot)] scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-300 ease-out shadow-[0_0_8px_var(--color-hot-soft)]"></span>
    <span className="exclude-theme absolute left-0 top-0 w-[2px] h-full bg-[var(--hot)] scale-y-0 group-hover:scale-y-100 transition-transform origin-center duration-300 ease-out shadow-[0_0_8px_var(--color-hot-soft)]"></span>
    <span className="exclude-theme absolute right-0 top-0 w-[2px] h-full bg-[var(--hot)] scale-y-0 group-hover:scale-y-100 transition-transform origin-center duration-300 ease-out shadow-[0_0_8px_var(--color-hot-soft)]"></span>
  </button>
);

const PortalButton = ({ active, onClick, letter, label, title, borderStyle }: { active: boolean, onClick: () => void, letter: string, label: string, title: string, borderStyle: string }) => {
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const stage = e.currentTarget;
    const rect = stage.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    const mx = Math.max(-1, Math.min(1, dx / (rect.width / 2)));
    const my = Math.max(-1, Math.min(1, dy / (rect.height / 2)));
    const dist = Math.min(1, Math.hypot(dx, dy) / (rect.width / 2));
    const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;

    stage.style.setProperty('--mx', mx.toFixed(3));
    stage.style.setProperty('--my', my.toFixed(3));
    stage.style.setProperty('--dist', dist.toFixed(3));
    stage.style.setProperty('--angle', angle.toFixed(1));

    const radar = stage.querySelector('#radar');
    if (radar) {
      const ticks = radar.querySelectorAll('i');
      ticks.forEach(t => {
        const tAngle = parseFloat(t.getAttribute('data-angle') || '0');
        let diff = Math.abs(angle - tAngle) % 360;
        diff = diff > 180 ? 360 - diff : diff;
        t.classList.toggle('lit', diff < 10);
        t.classList.toggle('near', diff >= 10 && diff < 28);
      });
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const stage = e.currentTarget;
    stage.classList.add('leaving');
    stage.style.setProperty('--mx', '0');
    stage.style.setProperty('--my', '0');
    stage.style.setProperty('--dist', '0');
    const radar = stage.querySelector('#radar');
    if (radar) {
      const ticks = radar.querySelectorAll('i');
      ticks.forEach(t => { t.classList.remove('lit'); t.classList.remove('near'); });
    }
    setTimeout(() => stage.classList.remove('leaving'), 650);
  };

  return (
  <div className="flex flex-col items-center gap-6 relative group" style={{ perspective: '1500px' }}>

    <button 
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transformStyle: 'preserve-3d' }}
      className={
        borderStyle === 'b16'
          ? `portal-stage relative inline-flex flex-col w-[clamp(5rem,8vw,9rem)] h-[clamp(5rem,8vw,9rem)] items-center justify-center rounded-2xl border-2 border-[var(--hot)] bg-[var(--key-cap)] font-semibold tracking-wide text-[var(--key-text)] key-gradient transform-gpu transition-all duration-150 ease-out z-10 ${active ? 'translate-y-3 key-3d-pressed shadow-none' : 'key-3d hover:translate-y-3 hover:key-3d-pressed active:translate-y-4 active:scale-[0.98]'}`
          : `portal-stage w-[clamp(5rem,8vw,9rem)] h-[clamp(5rem,8vw,9rem)] rounded-full flex items-center justify-center transition-all duration-700 ease-in-out ${borderStyle === 'b0' ? 'group-hover:-translate-y-[10%] group-hover:[transform:rotateX(75deg)] border' : ''} group-hover:border-transparent group-hover:bg-transparent group-hover:shadow-none relative z-10 ${active ? `${borderStyle === 'b0' ? 'border-[var(--hot)] ' : ''}bg-[var(--hot)]/10 shadow-[0_0_40px_var(--color-hot-soft)] text-[var(--hot)]` : `${borderStyle === 'b0' ? 'border-[var(--hot)]/40 ' : ''}bg-slate-900/50 text-slate-400`}`
      }
    >
      {/* Content wrapper */}
      <div className="flex flex-col items-center justify-center leading-none">
        <span className="text-[clamp(1.5rem,2vw,2.5rem)] font-display font-bold leading-none mb-1 scale-x-[1.15] origin-center inline-block">➔</span>
        <span className="text-[clamp(2rem,3.5vw,4rem)] font-display uppercase leading-none">{letter}</span>
      </div>

      <PortalBorderOverlay borderStyle={borderStyle} />
    </button>

    {/* Hologram Label — rises up above for Original Portal, drops down below for custom borders */}
    <span 
      className={`absolute left-1/2 -translate-x-1/2 text-xl sm:text-2xl font-display uppercase tracking-widest text-[var(--hot)] whitespace-nowrap opacity-0 transition-all duration-700 ease-out pointer-events-none z-50 drop-shadow-[0_0_15px_var(--color-hot-soft)] ${
        borderStyle === 'b0' 
          ? 'top-0 translate-y-4 group-hover:-translate-y-4' 
          : '-bottom-10 -translate-y-4 group-hover:translate-y-8'
      } group-hover:opacity-100`}
    >
      {label}
    </span>
  </div>
  );
};

export default function SetupScreen({
  onStart,
  onOpenLibrary,
  onOpenLeaderboard,
  onOpenAuth,
  onOpenFont,
  onOpenColor,
  onOpenUiColor,
  onOpenBorder,
  onLobbyJoined,
}: Props) {
  const [typedText, setTypedText] = useState('');
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [isHoveringKeyboard, setIsHoveringKeyboard] = useState(false);
  const keyboardRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const previousTextRef = useRef('');
  const spinnerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spinnerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startSpin = (fn: () => void) => {
    fn(); // Increment once immediately
    spinnerTimeoutRef.current = setTimeout(() => {
      spinnerTimerRef.current = setInterval(fn, 80);
    }, 400); // Wait 400ms before starting continuous loop
  };

  const stopSpin = () => {
    if (spinnerTimeoutRef.current) clearTimeout(spinnerTimeoutRef.current);
    if (spinnerTimerRef.current) clearInterval(spinnerTimerRef.current);
  };

  const renderSpinner = (label: string, val: number | string, onInc: () => void, onDec: () => void) => (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">{label}</span>
      <button
        onMouseDown={() => startSpin(onInc)} onMouseUp={stopSpin} onMouseLeave={stopSpin}
        onTouchStart={(e) => { e.preventDefault(); startSpin(onInc); }} onTouchEnd={stopSpin}
        className="w-16 h-12 flex items-center justify-center text-[var(--hot)] hover:text-white transition-colors select-none"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12"><polygon points="12,4 22,20 2,20"/></svg>
      </button>
      <div className="flex items-center justify-center text-4xl font-mono font-bold text-white select-none py-2">
        {val}
      </div>
      <button
        onMouseDown={() => startSpin(onDec)} onMouseUp={stopSpin} onMouseLeave={stopSpin}
        onTouchStart={(e) => { e.preventDefault(); startSpin(onDec); }} onTouchEnd={stopSpin}
        className="w-16 h-12 flex items-center justify-center text-[var(--hot)] hover:text-white transition-colors select-none"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12"><polygon points="12,20 22,4 2,4"/></svg>
      </button>
    </div>
  );
  const [isRandomSentencesLive, setIsRandomSentencesLive] = useState(false);
  const [liveTargetSentence, setLiveTargetSentence] = useState('');
  const [liveWpm, setLiveWpm] = useState<number | null>(null);
  const [liveStartTime, setLiveStartTime] = useState<number | null>(null);
  const [highestWpm, setHighestWpm] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('velocitype_highest_wpm');
      return stored ? parseInt(stored, 10) : null;
    }
    return null;
  });

  const [useVirtualKeyboard, setUseVirtualKeyboard] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('velocitype_ai_webcam') === 'true';
    return false;
  });

  const [borderStyle, setBorderStyle] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('velocitype_portal_border') || 'b0';
    return 'b0';
  });

  useEffect(() => {
    const handleStorage = () => {
      setBorderStyle(localStorage.getItem('velocitype_portal_border') || 'b0');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('velocitype_ai_webcam', String(useVirtualKeyboard));
  }, [useVirtualKeyboard]);

  useLayoutEffect(() => {
    if (textContainerRef.current && !isRandomSentencesLive) {
      if (textContainerRef.current.scrollHeight > textContainerRef.current.clientHeight + 10) {
        setTypedText(previousTextRef.current);
      } else {
        previousTextRef.current = typedText;
      }
    }
  }, [typedText, isRandomSentencesLive]);

  useLayoutEffect(() => {
    if (textContainerRef.current && isRandomSentencesLive && liveTargetSentence) {
      const container = textContainerRef.current;
      if (container.scrollHeight > container.clientHeight + 10) {
        const ratio = (container.clientHeight) / container.scrollHeight;
        const targetChars = Math.floor(liveTargetSentence.length * ratio * 0.95);
        let truncated = liveTargetSentence.slice(0, targetChars);
        const lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > 0) {
          truncated = truncated.slice(0, lastSpace);
        }
        if (truncated && truncated !== liveTargetSentence) {
          setLiveTargetSentence(truncated);
        }
      }
    }
  }, [liveTargetSentence, isRandomSentencesLive]);

  useEffect(() => {
    if (isRandomSentencesLive && !liveTargetSentence) {
      generateSentences('', ['home', 'top', 'bottom'], 5, 12, 15).then(res => {
        if (res && res.length > 0) {
          const target = res.join(' ').toLowerCase().replace(/[.]/g, '');
          setLiveTargetSentence(target);
          setLiveStartTime(null);
        }
      });
    }
  }, [isRandomSentencesLive, liveTargetSentence]);

  useEffect(() => {
    if (isRandomSentencesLive && typedText.length === 1 && !liveStartTime) {
      setLiveStartTime(Date.now());
      setLiveWpm(null);
    }
  }, [typedText, isRandomSentencesLive, liveStartTime]);

  useEffect(() => {
    if (isRandomSentencesLive && liveTargetSentence && typedText === liveTargetSentence) {
      if (liveStartTime) {
        const timeMinutes = (Date.now() - liveStartTime) / 60000;
        const words = liveTargetSentence.length / 5;
        const currentWpm = Math.round(words / timeMinutes);
        setLiveWpm(currentWpm);
        setHighestWpm(prev => {
          const next = prev ? Math.max(prev, currentWpm) : currentWpm;
          if (typeof window !== 'undefined') {
            localStorage.setItem('velocitype_highest_wpm', next.toString());
          }
          return next;
        });
      }
      setLiveTargetSentence('');
      setTypedText('');
      setLiveStartTime(null);
    }
  }, [typedText, liveTargetSentence, isRandomSentencesLive, liveStartTime]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isHoveringKeyboard) return;
      e.preventDefault();
      const key = getKeyLabel(e);
      setActiveKeys(prev => new Set(prev).add(key));
      
      if (e.key === 'Backspace') {
        setTypedText(prev => prev.slice(0, -1));
        return;
      }

      if (e.key === 'Enter') {
        if (!isRandomSentencesLive) setTypedText(prev => prev + '\n');
      } else if (e.key.length === 1) {
        setTypedText(prev => {
          if (isRandomSentencesLive && prev.length >= liveTargetSentence.length) return prev;
          return prev + e.key;
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = getKeyLabel(e);
      setActiveKeys(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isHoveringKeyboard, useVirtualKeyboard, isRandomSentencesLive, liveTargetSentence]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!keyboardRef.current) return;
    const rect = keyboardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;
    
    keyboardRef.current.style.transition = 'transform 0.1s ease-out';
    keyboardRef.current.style.transform = `translateZ(30px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.012)`;
  };

  const handleMouseLeave = () => {
    if (!keyboardRef.current) return;
    keyboardRef.current.style.transition = 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.45s ease, background-color 0.45s ease';
    keyboardRef.current.style.transform = ''; 
  };

  const { user, stats, logout } = useAuth();
  const [rows, setRows] = useState<RowKey[]>(['top', 'home', 'bottom']);
  const [durationWords, setDurationWords] = useState<string>('30');
  const [showCustomWords, setShowCustomWords] = useState<boolean>(false);
  const durWords = Math.max(1, Math.min(3600, parseInt(durationWords, 10) || 0));
  const [limitModeWords, setLimitModeWords] = useState<'time' | 'words'>('time');
  const [wordLimitWords, setWordLimitWords] = useState<string>('20');

  const [durationFile, setDurationFile] = useState<string>('30');
  const [showCustomFile, setShowCustomFile] = useState<boolean>(false);
  const durFile = Math.max(1, Math.min(3600, parseInt(durationFile, 10) || 0));

  const [fileSequential, setFileSequential] = useState<boolean>(false);
  const [durationSentences, setDurationSentences] = useState<string>('30');
  const [showCustomSentences, setShowCustomSentences] = useState<boolean>(false);
  const durSentences = Math.max(1, Math.min(3600, parseInt(durationSentences, 10) || 0));
  const [limitModeSentences, setLimitModeSentences] = useState<'time' | 'words'>('time');
  const [wordLimitSentences, setWordLimitSentences] = useState<string>('10');
  
  const [minLen, setMinLen] = useState<number | string>(2);
  const [maxLen, setMaxLen] = useState<number | string>(8);
  const [error, setError] = useState<string>('');
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [sentenceTheme, setSentenceTheme] = useState<string>('');

  const [parsedDoc, setParsedDoc] = useState<ParsedDocument | null>(null);
  const [startPage, setStartPage] = useState<number | string>(1);
  const [endPage, setEndPage] = useState<number | string>(1);
  const [fileError, setFileError] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');

  const [isLoadingQuotes, setIsLoadingQuotes] = useState<boolean>(false);
  const [quoteError, setQuoteError] = useState<string>('');
  
  const [apiKey, setApiKey] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('gemini_api_key') || '';
    return '';
  });

  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`velocitype_settings_${user.id}`);
      if (stored) {
        try {
          const s = JSON.parse(stored);
          if (s.minLen) setMinLen(s.minLen);
          if (s.maxLen) setMaxLen(s.maxLen);
          if (s.rows) setRows(s.rows);
          if (s.durationWords) setDurationWords(s.durationWords);
          if (s.durationFile) setDurationFile(s.durationFile);
          if (s.durationSentences) setDurationSentences(s.durationSentences);
        } catch(e) {}
      }
    } else {
      setMinLen(2);
      setMaxLen(8);
      setRows(['top', 'home', 'bottom']);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const parsedMinL = parseInt(String(minLen), 10);
      const parsedMaxL = parseInt(String(maxLen), 10);
      
      if (!isNaN(parsedMinL) && !isNaN(parsedMaxL)) {
        localStorage.setItem(`velocitype_settings_${user.id}`, JSON.stringify({
          minLen: parsedMinL,
          maxLen: parsedMaxL,
          rows,
          durationWords,
          durationFile,
          durationSentences,
        }));
      }
    }
  }, [user, minLen, maxLen, rows, durationWords, durationFile, durationSentences]);

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    if (typeof window !== 'undefined') localStorage.setItem('gemini_api_key', val);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
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
    const sPage = Math.max(1, parseInt(String(startPage), 10) || 1);
    const ePage = Math.max(sPage, parseInt(String(endPage), 10) || 1);
    const textArray = extractSentences(parsedDoc.pages, sPage, ePage, parsedDoc.isTextFile);
    if (textArray.length === 0) {
      setFileError('No text found in selected pages.');
      return;
    }

    const sentences = [...textArray];
    if (!fileSequential) {
      for (let i = sentences.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sentences[i], sentences[j]] = [sentences[j], sentences[i]];
      }
    }

    const batched: string[] = [];
    let currentBatch = '';
    for (const s of sentences) {
      if ((currentBatch + ' ' + s).split(' ').length > 80 && currentBatch.length > 0) {
        batched.push(currentBatch.trim());
        currentBatch = s;
      } else {
        currentBatch += (currentBatch ? ' ' : '') + s;
      }
    }
    if (currentBatch) batched.push(currentBatch.trim());

    onStart({
      mode: 'file',
      customSentences: batched,
      duration: durFile,
      useVirtualKeyboard,
      sequential: true
    } as any);
  };

  const handleStartRandomSentences = async () => {
    if (activeMode === 'random-sentences' && rows.length > 0) {
      const available = filterWords(rows, 1, 15);
      if (available.length === 0) {
        setQuoteError('No words or sentences available with the chosen rows.');
        setTimeout(() => setQuoteError(''), 3000);
        return;
      }
    }
    setIsLoadingQuotes(true);
    setQuoteError('');
    try {
      const minL = Math.max(2, Math.min(45, parseInt(String(minLen), 10) || 10));
      const maxL = Math.max(minL, Math.min(45, parseInt(String(maxLen), 10) || 27));
      const genSentences = await generateSentences(apiKey, rows, minL, maxL, 20, sentenceTheme);
      onStart({
        mode: 'random-sentences',
        customSentences: genSentences,
        duration: durSentences,
        limitMode: limitModeSentences,
        limitValue: limitModeSentences === 'words' ? parseInt(wordLimitSentences, 10) || 10 : undefined,
        useVirtualKeyboard
      } as any);
    } catch (err: any) {
      setQuoteError(err.message || 'Failed to generate sentences');
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
    durationVal: number,
    limitMode?: 'time' | 'words',
    setLimitMode?: (m: 'time' | 'words') => void,
    wordLimitInput?: string,
    setWordLimitInput?: (v: string) => void
  ) => {
    return (
      <section className="pt-2">
        <ClockTimeSelector 
          durationVal={limitMode === 'words' ? (parseInt(wordLimitInput || '20', 10) || 20) : durationVal} 
          setDurationInput={limitMode === 'words' && setWordLimitInput ? setWordLimitInput : setDurationInput}
          mode={limitMode || 'time'}
          limitToggle={
            setLimitMode ? (
              <div className="flex items-center justify-center">
                <button
                  onClick={() => setLimitMode(limitMode === 'time' ? 'words' : 'time')}
                  className={`w-14 h-7 rounded-full relative transition-all duration-300 flex-shrink-0 bg-slate-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] border border-slate-700/50`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white absolute top-1 shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                      limitMode === 'words' ? 'translate-x-[30px]' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ) : undefined
          }
        />
      </section>
    );
  };

  const toggleRow = (r: RowKey) => {
    setError('');
    setRows((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };

  const handleStart = () => {
    if (rows.length === 0) {
      setError('Select at least one key row.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    const minL = Math.max(2, Math.min(45, parseInt(String(minLen), 10) || 3));
    const maxL = Math.max(minL, Math.min(45, parseInt(String(maxLen), 10) || 8));
    
    const available = filterWords(rows, minL, maxL);
    if (available.length === 0) {
      setError('No words available for these settings.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    if (activeMode === 'words') {
      onStart({
        mode: 'words',
        rows,
        duration: durWords,
        limitMode: limitModeWords,
        limitValue: limitModeWords === 'words' ? parseInt(wordLimitWords, 10) || 20 : undefined,
        minLen: minL,
        maxLen: maxL,
        useVirtualKeyboard
      } as any);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col items-center overflow-x-hidden">
      {/* Header */}
      <header className="w-full flex items-center justify-center px-8 py-4 border-b border-slate-800/0">
        <div className="flex items-center gap-10">
          <div>
            <h1 className="text-7xl font-display tracking-widest text-white uppercase">Veloci<span className="text-[var(--hot)]">type</span></h1>
          </div>
        </div>
      </header>

      <div className="fixed top-8 right-8 z-50 flex flex-col items-end gap-3">
        <div className="flex items-start gap-4">
          <ProfileOrb onOpenAuth={onOpenAuth} />
        </div>
        <div className="flex items-center gap-3 mr-2">
          <span className="text-[10px] font-mono text-[var(--hot)] uppercase tracking-widest">AI Webcam Input:</span>
          <button
            onClick={() => {
              const newVal = !useVirtualKeyboard;
              setUseVirtualKeyboard(newVal);
              if (typeof window !== 'undefined') {
                localStorage.setItem('velocitype_ai_webcam', String(newVal));
                window.dispatchEvent(new Event('ai_webcam_toggled'));
              }
            }}
            className={`text-[10px] font-mono font-bold uppercase transition-colors hover:text-white ${useVirtualKeyboard ? 'text-emerald-500' : 'text-[var(--hot)]'}`}
          >
            {useVirtualKeyboard ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Main Hero */}
      {!activeMode && (
      <main className="w-full px-8 pt-0 pb-4 flex flex-col items-center justify-center">
        
        {/* Training Modes */}
        <div className="flex w-full flex-col justify-center items-center relative">
          <div className="flex items-center justify-center gap-[clamp(1rem,2vw,2rem)] flex-wrap w-full pt-4 pb-12 px-4 relative z-20">
            
            <PortalButton
              active={activeMode === 'words'}
              onClick={() => setActiveMode(activeMode === 'words' ? null : 'words')}
              letter="W"
              label="Words"
              title="Words: Timed drills across 10k common words. 15s, 30s or 60s."
              borderStyle={borderStyle}
            />
            
            <PortalButton
              active={activeMode === 'file'}
              onClick={() => setActiveMode(activeMode === 'file' ? null : 'file')}
              letter="F"
              label="File"
              title="Sentences From File: Drop a .txt and train on your own corpus, line by line."
              borderStyle={borderStyle}
            />
            
            <PortalButton
              active={activeMode === 'random-sentences'}
              onClick={() => setActiveMode(activeMode === 'random-sentences' ? null : 'random-sentences')}
              letter="S"
              label="Sentences"
              title="Random Sentences: Punctuation, numbers and casing toggled exactly how you like."
              borderStyle={borderStyle}
            />
            
            <PortalButton
              active={activeMode === 'versus'}
              onClick={() => setActiveMode(activeMode === 'versus' ? null : 'versus')}
              letter="V"
              label="Versus"
              title="Versus: Race up to eight opponents live, with a shared word stream."
              borderStyle={borderStyle}
            />

            <PortalButton
              active={false}
              onClick={onOpenLibrary}
              letter="L"
              label="Library"
              title="Library: Manage and select your imported texts."
              borderStyle={borderStyle}
            />

            <PortalButton
              active={activeMode === 'graph'}
              onClick={() => setActiveMode(activeMode === 'graph' ? null : 'graph')}
              letter="G"
              label="Graph"
              title="Graph: View your typing statistics."
              borderStyle={borderStyle}
            />

            <PortalButton
              active={activeMode === 'customization'}
              onClick={() => setActiveMode(activeMode === 'customization' ? null : 'customization')}
              letter="C"
              label="Customization"
              title="Customization: Configure Fonts, Colors, and Backgrounds."
              borderStyle={borderStyle}
            />

          </div>
        </div>
      </main>
      )}

      {/* Live Keyboard */}
      {!activeMode && (
      <section className="w-full px-12 md:px-20 lg:px-32 pt-[clamp(0.5rem,2vh,2rem)] pb-[clamp(1rem,2vh,3rem)]">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 xl:gap-24 items-center justify-center w-full">
          <div className="scene flex flex-col justify-center flex-none w-full lg:w-[600px] xl:w-[680px]">
            <div 
              ref={keyboardRef}
              onMouseEnter={() => setIsHoveringKeyboard(true)}
              onMouseMove={handleMouseMove}
              onMouseLeave={(e) => { setIsHoveringKeyboard(false); handleMouseLeave(); }}
              className="w-full mx-auto"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Keyboard Layout */}
              <LiveKeyboard activeKeys={activeKeys} />
            </div>
          </div>
          
          {/* Stats Card */}
          <div className="flex-none flex flex-col w-full lg:w-[560px] lg:min-w-[560px] lg:max-w-[560px] h-full justify-center">
            <div className="w-full h-[340px] min-h-[340px] max-h-[340px] flex-none overflow-hidden">
              <div className="border border-[var(--hot)]/40 rounded-xl p-[clamp(1rem,2vh,2.5rem)] bg-transparent w-full h-full flex flex-col justify-start text-left overflow-hidden relative">
                <div ref={textContainerRef} className="font-mono text-2xl sm:text-3xl text-[var(--hot)] leading-[1.6] break-words whitespace-pre-wrap w-full h-full overflow-hidden text-ellipsis relative">
                  {!isHoveringKeyboard && !isRandomSentencesLive ? (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-slate-600">Hover here to try the keyboard...</span>
                    </div>
                  ) : (
                    <>
                      {isRandomSentencesLive && liveTargetSentence ? (
                        <>
                        {liveTargetSentence.split('').map((char, i) => {
                          let colorClass = 'text-slate-600 exclude-theme';
                          if (i < typedText.length) {
                            colorClass = typedText[i] === char ? 'text-[var(--hot)] theme-text-override' : 'text-rose-400 underline exclude-theme';
                          } else if (i === typedText.length) {
                            colorClass = 'text-slate-100 exclude-theme';
                          }
                          return (
                            <span key={i} className={`relative ${colorClass}`}>
                              {i === typedText.length && (
                                 <span className="absolute -left-[1px] top-0 bottom-0 w-[3px] bg-[var(--hot)] animate-caret z-10"></span>
                              )}
                              {char}
                            </span>
                          );
                        })}
                        {typedText.length === liveTargetSentence.length && (
                          <span className="border-r-[3px] border-[var(--hot)] animate-caret ml-[1px] inline-block h-[1.2em] align-middle -mb-1"></span>
                        )}
                        </>
                      ) : (
                        <>
                          {typedText}
                          <span className="border-r-[3px] border-[var(--hot)] animate-caret ml-0.5 inline-block h-[1.2em] align-middle -mb-1"></span>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="w-full mt-4 flex items-center justify-between ml-2 min-h-[2rem]">
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="w-5 h-5 min-w-[1.25rem] min-h-[1.25rem] max-w-[1.25rem] max-h-[1.25rem] flex-none rounded border border-[var(--hot)]/40 bg-transparent flex items-center justify-center overflow-hidden box-border">
                  {isRandomSentencesLive && (
                    <svg viewBox="0 0 14 14" className="w-3.5 h-3.5 text-[var(--hot)] fill-current flex-none mt-[1px]">
                      <path d="M5.5 10.5L2 7l1.4-1.4 2.1 2.1 5.1-5.1L12 4l-6.5 6.5z"/>
                    </svg>
                  )}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden"
                  checked={isRandomSentencesLive}
                  onChange={(e) => {
                    setIsRandomSentencesLive(e.target.checked);
                    setTypedText('');
                    setLiveWpm(null);
                    setLiveStartTime(null);
                    if (!e.target.checked) {
                      setLiveTargetSentence('');
                    }
                  }}
                />
                <span className="font-mono text-xs uppercase tracking-widest text-[var(--hot)]">
                  Random Sentences
                </span>
              </label>

              <div className="flex items-center gap-4 mr-2">
                {highestWpm !== null && (
                  <div className="text-[var(--hot)] font-display text-lg tracking-widest flex items-baseline gap-1 opacity-80">
                    BEST: <span className="text-xl ml-1">{highestWpm}</span> <span className="font-mono text-[0.65rem] uppercase tracking-widest">WPM</span>
                  </div>
                )}
                {liveWpm !== null && (
                  <div className="text-[var(--hot)] font-display text-2xl tracking-widest flex items-center gap-2">
                    {liveWpm} <span className="font-mono text-sm text-slate-500 uppercase">WPM</span>
                  </div>
                )}
                {isRandomSentencesLive && (
                  <button 
                    onClick={() => {
                      setTypedText('');
                      setLiveWpm(null);
                      setLiveStartTime(null);
                      setLiveTargetSentence('');
                    }}
                    className="w-8 h-8 rounded border border-slate-800 bg-slate-900/50 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
                    title="Refresh Sentences"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        {useVirtualKeyboard && <VirtualKeyboardConnector />}
      </section>
      )}

      {/* Configuration View */}
      {activeMode && (
      <section className="w-full px-8 py-[clamp(3vh,5vh,6rem)] flex-1 grid grid-cols-[1fr_auto] gap-8 items-start">
          <div className="w-full max-w-4xl mr-auto animate-in fade-in slide-in-from-top-4 duration-500 mb-20">
            <button onClick={() => setActiveMode(null)} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-[var(--hot)] transition-colors font-mono text-sm uppercase tracking-widest group">
              <span className="transition-transform group-hover:-translate-x-1">←</span> Back to Modes
            </button>
            <div className="w-full rounded-lg p-[clamp(1rem,2vh,2.5rem)]">
            
            {activeMode === 'customization' && (
              <div className="flex items-center justify-center gap-16 py-12">
                <button onClick={onOpenFont} className="text-3xl font-display tracking-widest text-[var(--hot)] hover:text-white transition-colors">Fonts</button>
                <button onClick={onOpenColor} className="text-3xl font-display tracking-widest text-[var(--hot)] hover:text-white transition-colors">Colors</button>
                <button onClick={onOpenUiColor} className="text-3xl font-display tracking-widest text-[var(--hot)] hover:text-white transition-colors">Background</button>
                <button onClick={onOpenBorder} className="text-3xl font-display tracking-widest text-[var(--hot)] hover:text-white transition-colors">Border</button>
              </div>
            )}
            
            {activeMode === 'words' && (
              <div className="space-y-10">
                <div className="flex flex-row items-start w-full">
                  <section className="shrink-0">
                    <h2 className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-4">1. Choose your key rows</h2>
                    <div className="grid sm:grid-cols-3 gap-4">
                      {ROW_LABELS.map((r) => {
                        const active = rows.includes(r.key);
                        return (
                          <div key={r.key} className="text-left p-6 transition-all rounded flex flex-col items-start gap-4">
                            <div className={`transition-all duration-300 ${active ? 'text-[var(--hot)] drop-shadow-[0_0_10px_var(--color-hot-soft)]' : 'text-slate-400'}`}>
                              <div className="flex items-center mb-3">
                                <span className="font-semibold tracking-wide">{r.label}</span>
                              </div>
                              <code className={`text-[10px] tracking-widest transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-70'}`}>{r.keys}</code>
                            </div>
                            <button
                              onClick={() => toggleRow(r.key)}
                              className={`w-14 h-7 rounded-full relative transition-all duration-300 flex-shrink-0 bg-slate-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] border border-slate-700/50`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full bg-white absolute top-1 shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                                  active ? 'translate-x-[30px]' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>
                <section>
                  <h2 className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-6">3. Set word length</h2>
                  <div className="flex items-center gap-10">
                    {/* Min Letters Spinner */}
                    {renderSpinner('Min', minLen, 
                      () => setMinLen(v => { const c = parseInt(String(v), 10) || 2; const m = parseInt(String(maxLen), 10) || 45; return Math.min(45, Math.min(m, c + 1)); }),
                      () => setMinLen(v => { const c = parseInt(String(v), 10) || 2; return Math.max(2, c - 1); })
                    )}

                    <div className="w-px h-20 bg-slate-800 self-center" />

                    {/* Max Letters Spinner */}
                    {renderSpinner('Max', maxLen, 
                      () => setMaxLen(v => { const c = parseInt(String(v), 10) || 15; return Math.min(45, c + 1); }),
                      () => setMaxLen(v => { const c = parseInt(String(v), 10) || 15; const min = parseInt(String(minLen), 10) || 2; return Math.max(min, c - 1); })
                    )}
                  </div>
                </section>


              </div>
            )}

            {activeMode === 'file' && (
              <div className="space-y-10">
                <section>
                  <h2 className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-4">1. Upload Document</h2>
                  <div className="flex items-center">
                    <label className="cursor-pointer px-6 py-3 rounded border border-[var(--hot)] text-[10px] uppercase tracking-widest bg-[var(--hot)]/10 text-[var(--hot)] hover:bg-[var(--hot)] hover:text-black transition-colors font-mono mr-4">
                      Choose File
                      <input type="file" accept=".txt,.pdf,.docx,.pptx" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest max-w-[200px] truncate">
                      {fileName || 'No file chosen'}
                    </span>
                  </div>
                  {isParsing && <p className="text-[var(--hot)] mt-3 text-xs font-mono uppercase tracking-widest">Parsing file...</p>}
                  {parsedDoc && !isParsing && <p className="text-emerald-400 mt-3 text-xs font-mono uppercase tracking-widest">✓ File parsed ({parsedDoc.pages.length} pages)</p>}
                </section>
                <section>
                  <h2 className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-4">2. Sentence Order</h2>
                  <div className="flex items-center gap-6">
                    <span className={`text-sm font-mono tracking-widest uppercase transition-colors ${!fileSequential ? 'text-[var(--hot)] drop-shadow-[0_0_8px_var(--color-hot-soft)]' : 'text-slate-500'}`}>Random</span>
                    <button
                      onClick={() => setFileSequential(!fileSequential)}
                      className={`w-14 h-7 rounded-full relative transition-all duration-300 flex-shrink-0 bg-slate-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] border border-slate-700/50`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white absolute top-1 shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                          fileSequential ? 'translate-x-[30px]' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-sm font-mono tracking-widest uppercase transition-colors ${fileSequential ? 'text-[var(--hot)] drop-shadow-[0_0_8px_var(--color-hot-soft)]' : 'text-slate-500'}`}>Line by Line</span>
                  </div>
                </section>
                <section className={`transition-opacity ${parsedDoc?.isTextFile ? 'opacity-50 pointer-events-none' : ''}`}>
                  <h2 className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-4">3. Select Page Range</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Start Page</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={(!parsedDoc || parsedDoc.isTextFile) ? 'None' : startPage} 
                        onChange={(e) => setStartPage(e.target.value.replace(/[^0-9-]/g, ''))} 
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            let v = parseInt(String(startPage), 10);
                            if (isNaN(v)) v = 1;
                            const maxP = parsedDoc ? parsedDoc.pages.length : 1;
                            let currentEnd = parseInt(String(endPage), 10) || 1;
                            v = Math.max(1, Math.min(maxP, Math.min(currentEnd, v)));
                            setStartPage(v);
                            e.currentTarget.blur();
                          }
                        }}
                        onBlur={() => {
                          let v = parseInt(String(startPage), 10);
                          if (isNaN(v)) v = 1;
                          const maxP = parsedDoc ? parsedDoc.pages.length : 1;
                          let currentEnd = parseInt(String(endPage), 10) || 1;
                          v = Math.max(1, Math.min(maxP, Math.min(currentEnd, v)));
                          setStartPage(v);
                        }}
                        disabled={!parsedDoc || parsedDoc.isTextFile} 
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800 rounded focus:border-[var(--hot)] focus:outline-none text-lg font-mono text-white caret-[var(--hot)] disabled:opacity-50 disabled:cursor-not-allowed" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">End Page</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={(!parsedDoc || parsedDoc.isTextFile) ? 'None' : endPage} 
                        onChange={(e) => setEndPage(e.target.value.replace(/[^0-9-]/g, ''))} 
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            let v = parseInt(String(endPage), 10);
                            if (isNaN(v)) v = 1;
                            const maxP = parsedDoc ? parsedDoc.pages.length : 1;
                            let currentStart = parseInt(String(startPage), 10) || 1;
                            v = Math.max(1, Math.min(maxP, Math.max(currentStart, v)));
                            setEndPage(v);
                            e.currentTarget.blur();
                          }
                        }}
                        onBlur={() => {
                          let v = parseInt(String(endPage), 10);
                          if (isNaN(v)) v = 1;
                          const maxP = parsedDoc ? parsedDoc.pages.length : 1;
                          let currentStart = parseInt(String(startPage), 10) || 1;
                          v = Math.max(1, Math.min(maxP, Math.max(currentStart, v)));
                          setEndPage(v);
                        }}
                        disabled={!parsedDoc || parsedDoc.isTextFile} 
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800 rounded focus:border-[var(--hot)] focus:outline-none text-lg font-mono text-white caret-[var(--hot)] disabled:opacity-50 disabled:cursor-not-allowed" 
                      />
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeMode === 'random-sentences' && (
              <div className="space-y-10">
                <div className="flex flex-row items-start w-full">
                  <section className="shrink-0">
                    <h2 className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-4">1. Choose your key rows</h2>
                    <div className="grid sm:grid-cols-3 gap-4">
                      {ROW_LABELS.map((r) => {
                        const active = rows.includes(r.key);
                        return (
                          <div key={r.key} className="text-left p-6 transition-all rounded flex flex-col items-start gap-4">
                            <div className={`transition-all duration-300 ${active ? 'text-[var(--hot)] drop-shadow-[0_0_10px_var(--color-hot-soft)]' : 'text-slate-400'}`}>
                              <div className="flex items-center mb-3">
                                <span className="font-semibold tracking-wide">{r.label}</span>
                              </div>
                              <code className={`text-[10px] tracking-widest transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-70'}`}>{r.keys}</code>
                            </div>
                            <button
                              onClick={() => toggleRow(r.key)}
                              className={`w-14 h-7 rounded-full relative transition-all duration-300 flex-shrink-0 bg-slate-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] border border-slate-700/50`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full bg-white absolute top-1 shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                                  active ? 'translate-x-[30px]' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>
                <section>
                  <h2 className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-4">2. Sentence Configuration</h2>
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-[clamp(0.5rem,1.5vh,1.5rem)]">
                      <div>
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 block">Gemini API Key (Optional)</label>
                        <input type="password" value={apiKey} onChange={(e) => handleApiKeyChange(e.target.value)} placeholder="AIzaSy..." className="w-full px-4 py-3 bg-slate-900/50 border border-[var(--hot)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--hot)] text-lg font-mono text-white caret-[var(--hot)] transition-colors" />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 block">Topic / Theme (Requires Key)</label>
                        <input type="text" value={sentenceTheme} onChange={(e) => setSentenceTheme(e.target.value)} disabled={!apiKey} placeholder={apiKey ? "e.g., rick and morty" : ""} className="w-full px-4 py-3 bg-slate-900/50 border border-[var(--hot)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--hot)] text-lg font-mono text-white caret-[var(--hot)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors" />
                      </div>
                    </div>
                  </div>
                </section>
                <section>
                  <h2 className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-6">3. Set word length</h2>
                  <div className="flex items-center gap-10">
                    {/* Min Letters Spinner */}
                    {renderSpinner('Min', minLen, 
                      () => setMinLen(v => { const c = parseInt(String(v), 10) || 2; const m = parseInt(String(maxLen), 10) || 45; return Math.min(45, Math.min(m, c + 1)); }),
                      () => setMinLen(v => { const c = parseInt(String(v), 10) || 2; return Math.max(2, c - 1); })
                    )}

                    <div className="w-px h-20 bg-slate-800 self-center" />

                    {/* Max Letters Spinner */}
                    {renderSpinner('Max', maxLen, 
                      () => setMaxLen(v => { const c = parseInt(String(v), 10) || 15; return Math.min(45, c + 1); }),
                      () => setMaxLen(v => { const c = parseInt(String(v), 10) || 15; const min = parseInt(String(minLen), 10) || 2; return Math.max(min, c - 1); })
                    )}
                  </div>
                </section>
              </div>
            )}

            {activeMode === 'versus' && (
              <div className="pt-4">
                <VersusModeSetup onLobbyJoined={onLobbyJoined} />
              </div>
            )}
            </div>
          </div>
          {['words', 'file', 'random-sentences'].includes(activeMode || '') && (
            <div className="sticky top-20 self-start flex flex-col items-center gap-4">
              {activeMode === 'words' && renderDurationSelector(2, durationWords, setDurationWords, showCustomWords, setShowCustomWords, durWords, limitModeWords, setLimitModeWords, wordLimitWords, setWordLimitWords)}
              {activeMode === 'file' && renderDurationSelector(3, durationFile, setDurationFile, showCustomFile, setShowCustomFile, durFile)}
              {activeMode === 'random-sentences' && renderDurationSelector(2, durationSentences, setDurationSentences, showCustomSentences, setShowCustomSentences, durSentences, limitModeSentences, setLimitModeSentences, wordLimitSentences, setWordLimitSentences)}
              
              {/* Start Typing — mirrors PortalButton exactly */}
              <div className={`flex flex-col items-center gap-6 relative group ${(activeMode === 'file' && (!parsedDoc || isParsing)) || (activeMode === 'random-sentences' && isLoadingQuotes) ? 'opacity-50 pointer-events-none' : ''}`} style={{ perspective: '1500px' }}>
                <button
                  onClick={activeMode === 'words' ? handleStart : activeMode === 'file' ? handleStartFile : handleStartRandomSentences}
                  onMouseMove={(e) => {
                    const stage = e.currentTarget;
                    const rect = stage.getBoundingClientRect();
                    const cx = rect.left + rect.width / 2;
                    const cy = rect.top + rect.height / 2;
                    const dx = e.clientX - cx;
                    const dy = e.clientY - cy;
                    const mx = Math.max(-1, Math.min(1, dx / (rect.width / 2)));
                    const my = Math.max(-1, Math.min(1, dy / (rect.height / 2)));
                    const dist = Math.min(1, Math.hypot(dx, dy) / (rect.width / 2));
                    const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;
                    stage.style.setProperty('--mx', mx.toFixed(3));
                    stage.style.setProperty('--my', my.toFixed(3));
                    stage.style.setProperty('--dist', dist.toFixed(3));
                    stage.style.setProperty('--angle', angle.toFixed(1));
                    const radar = stage.querySelector('#radar');
                    if (radar) {
                      radar.querySelectorAll('i').forEach((t) => {
                        const tAngle = parseFloat(t.getAttribute('data-angle') || '0');
                        let diff = Math.abs(angle - tAngle) % 360;
                        diff = diff > 180 ? 360 - diff : diff;
                        t.classList.toggle('lit', diff < 10);
                        t.classList.toggle('near', diff >= 10 && diff < 28);
                      });
                    }
                  }}
                  onMouseLeave={(e) => {
                    const stage = e.currentTarget;
                    stage.classList.add('leaving');
                    stage.style.setProperty('--mx', '0');
                    stage.style.setProperty('--my', '0');
                    stage.style.setProperty('--dist', '0');
                    const radar = stage.querySelector('#radar');
                    if (radar) radar.querySelectorAll('i').forEach((t) => { t.classList.remove('lit'); t.classList.remove('near'); });
                    setTimeout(() => stage.classList.remove('leaving'), 650);
                  }}
                  style={{ transformStyle: 'preserve-3d' }}
                  className={
                    borderStyle === 'b16'
                      ? `portal-stage relative inline-flex flex-col w-[clamp(7rem,10vw,12rem)] h-[clamp(7rem,10vw,12rem)] items-center justify-center rounded-2xl border-2 border-[var(--hot)] bg-[var(--key-cap)] font-semibold tracking-wide text-[var(--key-text)] key-gradient transform-gpu transition-all duration-150 ease-out z-10 key-3d hover:translate-y-3 hover:key-3d-pressed active:translate-y-4 active:scale-[0.98]`
                      : `portal-stage w-[clamp(7rem,10vw,12rem)] h-[clamp(7rem,10vw,12rem)] rounded-full flex items-center justify-center transition-all duration-700 ease-in-out ${borderStyle === 'b0' ? 'group-hover:-translate-y-[10%] group-hover:[transform:rotateX(75deg)] border' : ''} group-hover:border-transparent group-hover:bg-transparent group-hover:shadow-none relative z-10 ${borderStyle === 'b0' ? 'border-[var(--hot)] ' : ''}bg-[var(--hot)]/10 shadow-[0_0_40px_var(--color-hot-soft)] text-[var(--hot)]`
                  }
                >
                  {/* Play icon */}
                  <div className="flex flex-col items-center justify-center leading-none">
                    <svg viewBox="0 0 24 24" className="w-[clamp(2.8rem,5vw,6rem)]" fill="currentColor">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  </div>
                  <PortalBorderOverlay borderStyle={borderStyle} />
                </button>

                {/* Floating label — same pattern as PortalButton */}
                <span className={`absolute left-1/2 -translate-x-1/2 text-xl sm:text-2xl font-display uppercase tracking-widest text-[var(--hot)] whitespace-nowrap opacity-0 transition-all duration-700 ease-out pointer-events-none z-50 drop-shadow-[0_0_15px_var(--color-hot-soft)] ${
                  borderStyle === 'b0'
                    ? 'top-0 translate-y-4 group-hover:-translate-y-4'
                    : '-bottom-10 -translate-y-4 group-hover:translate-y-8'
                } group-hover:opacity-100`}>
                  {activeMode === 'random-sentences' && isLoadingQuotes ? 'Loading...' : 'Start'}
                </span>
              </div>

              {/* Error Messages Below Start Button */}
              <div className="mt-6 flex flex-col items-center justify-center min-h-[24px]">
                {activeMode === 'words' && error && <div className="text-[var(--hot)] text-sm font-mono tracking-widest text-center animate-in fade-in duration-300">{error}</div>}
                {activeMode === 'file' && fileError && <div className="text-[var(--hot)] text-sm font-mono tracking-widest text-center animate-in fade-in duration-300">{fileError}</div>}
                {activeMode === 'random-sentences' && quoteError && <div className="text-[var(--hot)] text-sm font-mono tracking-widest text-center animate-in fade-in duration-300">{quoteError}</div>}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}