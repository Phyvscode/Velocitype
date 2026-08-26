import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { getStoredBgColor } from '@/lib/colors';
import { LANGUAGES } from '@/lib/languages';
import { loadDictionary } from '@/lib/words';
import { generateSentences } from '@/lib/quotes';
import LiveKeyboard, { getKeyLabel } from '@/components/LiveKeyboard';

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
    bgTheme?: any;
  };
}

interface RankedMatchState {
  currentRound: number;
  scores: Record<string, number>;
}

interface Props {
  onBack: () => void;
}

interface RankedPlayerAreaProps {
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
    bgTheme?: any;
}

function RankedPlayerArea({ label, wpm, progress, targetText, typedText, activeKeys, gameState, isOpponent, colorTheme, fontFamily, bgTheme }: RankedPlayerAreaProps) {
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [caretLeft, setCaretLeft] = useState(0);
  const [caretTop, setCaretTop] = useState(0);
  const [scrollLines, setScrollLines] = useState(0);

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
    <div id={isOpponent ? "opponent-area" : undefined} className={`flex-1 p-4 md:p-8 flex flex-col relative ${isOpponent ? 'bg-slate-900/40' : ''}`}>
      {isOpponent && oppStyle && <style>{oppStyle}</style>}
      <div className="flex justify-between items-end mb-4 md:mb-8">
        <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">{label}</span>
        <span className="font-mono text-sm uppercase tracking-widest" style={{ color: isOpponent ? oppPrimaryHex : 'var(--hot)' }}>{wpm} WPM</span>
      </div>

      <div className="flex-1 relative flex flex-col justify-center overflow-visible">
        <div 
          className="relative w-full select-none font-mono tracking-wide text-left"
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

              {targetText.split('').map((char, i) => {
                let color = 'text-slate-500';
                if (i < typedText.length) {
                  // We don't apply classes for correct opponent text, we rely on the injected #opponent-area span css!
                  // Except for mistakes, which we style specifically.
                  color = typedText[i] === char ? 'correct-char' : 'text-rose-500 underline exclude-theme';
                } else if (i === typedText.length) {
                  color = 'text-slate-100 exclude-theme';
                }
                
                // For the local player, we apply the normal theme class
                if (!isOpponent && color === 'correct-char') {
                  color = 'text-[var(--hot)]';
                }

                return (
                  <span 
                    key={i} 
                    ref={el => letterRefs.current[i] = el}
                    className={`${color}`}
                    style={isOpponent && color === 'correct-char' ? {} : undefined} // will use scoped styles
                  >
                    {char}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      <div className="w-full max-w-[600px] mx-auto transform scale-[0.6] origin-bottom md:scale-75 mt-auto pt-8">
        <LiveKeyboard activeKeys={activeKeys} />
      </div>
    </div>
  );
}

export default function RankedMode({ onBack }: Props) {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [language, setLanguage] = useState('english');
  const [queueing, setQueueing] = useState(false);
  const [matchData, setMatchData] = useState<RankedMatchData | null>(null);
  
  // Game state
  const [sentences, setSentences] = useState<string[]>([]);
  const [gameState, setGameState] = useState<'waiting_ready' | 'playing' | 'round_finished' | 'match_finished'>('waiting_ready');
  const [currentRound, setCurrentRound] = useState(0);
  const [myProgress, setMyProgress] = useState(0);
  const [myWpm, setMyWpm] = useState(0);
  const [oppProgress, setOppProgress] = useState(0);
  const [oppWpm, setOppWpm] = useState(0);
  const [amIReady, setAmIReady] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [matchWinner, setMatchWinner] = useState<string | null>(null);
  const [eloChanges, setEloChanges] = useState<Record<string, number>>({});

  const [typedText, setTypedText] = useState('');
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [startTime, setStartTime] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Opponent typing state
  const [oppTypedText, setOppTypedText] = useState('');
  const [oppActiveKeys, setOppActiveKeys] = useState<Set<string>>(new Set());

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
          await loadDictionary(langObj.url);
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
      setOppProgress(0);
      setOppWpm(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    };

    const onOpponentProgress = (data: { progress: number; wpm: number; typedText?: string; activeKeys?: string[] }) => {
      setOppProgress(data.progress);
      setOppWpm(data.wpm);
      if (data.typedText !== undefined) setOppTypedText(data.typedText);
      if (data.activeKeys) setOppActiveKeys(new Set(data.activeKeys));
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

    socket.on('rankedQueueJoined', onQueueJoined);
    socket.on('rankedMatchFound', onMatchFound);
    socket.on('rankedMatchReady', onMatchReady);
    socket.on('rankedRoundStart', onRoundStart);
    socket.on('rankedOpponentProgress', onOpponentProgress);
    socket.on('rankedRoundEnd', onRoundEnd);
    socket.on('rankedNextRound', onNextRound);
    socket.on('rankedMatchFinished', onMatchFinished);
    socket.on('rankedOpponentDisconnected', onOpponentDisconnected);

    return () => {
      socket.off('rankedQueueJoined', onQueueJoined);
      socket.off('rankedMatchFound', onMatchFound);
      socket.off('rankedMatchReady', onMatchReady);
      socket.off('rankedRoundStart', onRoundStart);
      socket.off('rankedOpponentProgress', onOpponentProgress);
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
      bgTheme: getStoredBgColor()
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
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (gameState !== 'playing') {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, gameState]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== 'playing' || !matchData || !socket) return;
    let val = e.target.value;
    const target = sentences[currentRound];
    
    if (val.length > target.length) {
      val = val.slice(0, target.length);
    }

    setTypedText(val);
    
    // Only count correct characters for progress and WPM
    let correctCount = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] === target[i]) correctCount++;
    }

    const progress = (correctCount / target.length) * 100;
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
      activeKeys: Array.from(activeKeys) 
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = getKeyLabel(e);
    setActiveKeys(prev => {
      const next = new Set(prev);
      next.add(key);
      socket?.emit('updateRankedProgress', { matchId: matchData?.matchId, progress: myProgress, wpm: myWpm, typedText, activeKeys: Array.from(next) });
      return next;
    });
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = getKeyLabel(e);
    setActiveKeys(prev => {
      const next = new Set(prev);
      next.delete(key);
      socket?.emit('updateRankedProgress', { matchId: matchData?.matchId, progress: myProgress, wpm: myWpm, typedText, activeKeys: Array.from(next) });
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
      <div className="w-full max-w-lg mx-auto bg-slate-900/50 border border-slate-800 p-8 rounded flex flex-col items-center gap-8">
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
              className="w-full py-5 border border-rose-500/50 text-rose-500 bg-rose-500/10 font-mono text-sm uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-colors rounded"
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
    );
  }

  // 2. Match Screen (Split Screen)
  const targetText = sentences[currentRound] || '';
  const myScore = scores[socket!.id] || 0;
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
      className="w-screen h-[100dvh] flex flex-col bg-background overflow-hidden relative"
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
            <div className="font-mono text-lg text-rose-400 uppercase tracking-widest">{matchData.opponent.username}</div>
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
          targetText={targetText}
          typedText={typedText}
          activeKeys={activeKeys}
          gameState={gameState}
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
          targetText={targetText}
          typedText={oppTypedText}
          activeKeys={oppActiveKeys}
          gameState={gameState}
          isOpponent
          colorTheme={matchData.opponent.colorTheme}
          fontFamily={matchData.opponent.fontFamily}
          bgTheme={matchData.opponent.bgTheme}
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
          <div className="text-center space-y-4">
            <h3 className="font-display text-4xl text-white uppercase tracking-widest">Round Finished</h3>
            <p className="font-mono text-sm text-[var(--hot)] uppercase tracking-widest">Next round starting soon...</p>
          </div>
        </div>
      )}

      {gameState === 'match_finished' && (
        <div className="absolute inset-0 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center z-30 gap-8">
          <h2 className="font-display text-6xl text-white uppercase tracking-widest">
            {matchWinner === socket!.id ? 'Victory' : 'Defeat'}
          </h2>
          <div className="flex items-center gap-12 font-mono text-lg uppercase tracking-widest">
            <div className="text-center">
              <div className="text-[var(--hot)] mb-2">You</div>
              <div className="text-3xl text-white">{scores[socket!.id] || 0}</div>
              <div className={`text-xs mt-2 ${eloChanges[socket!.id] > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {eloChanges[socket!.id] > 0 ? '+' : ''}{eloChanges[socket!.id]} ELO
              </div>
            </div>
            <div className="text-center">
              <div className="text-rose-400 mb-2">{matchData.opponent.username}</div>
              <div className="text-3xl text-white">{scores[matchData.opponent.id] || 0}</div>
              <div className={`text-xs mt-2 ${eloChanges[matchData.opponent.id] > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {eloChanges[matchData.opponent.id] > 0 ? '+' : ''}{eloChanges[matchData.opponent.id]} ELO
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
