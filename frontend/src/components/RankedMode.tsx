import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { LANGUAGES } from '@/lib/languages';
import { loadDictionary } from '@/lib/words';
import { generateSentences } from '@/lib/quotes';

interface RankedMatchData {
  matchId: string;
  language: string;
  role: 'host' | 'client';
  opponent: { id: string; username: string; elo: number };
}

interface RankedMatchState {
  currentRound: number;
  scores: Record<string, number>;
}

export default function RankedMode() {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
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

  // Typing state
  const [typedText, setTypedText] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    const newSocket = io(backendUrl);

    newSocket.on('connect', () => {
      setIsConnected(true);
      setSocket(newSocket);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setQueueing(false);
    });

    newSocket.on('rankedQueueJoined', () => {
      setQueueing(true);
    });

    newSocket.on('rankedMatchFound', async (data: RankedMatchData) => {
      setQueueing(false);
      setMatchData(data);
      
      // If host, generate payload
      if (data.role === 'host') {
        const langObj = LANGUAGES.find(l => l.id === data.language);
        if (langObj) {
          // Preload language dictionary
          await loadDictionary(langObj.url);
          // Generate 5 random sentences (max rounds)
          // We will use 5 sentences, one for each round
          const s = [];
          for (let i = 0; i < 5; i++) {
             // Let's generate short sentences (min 4, max 8 words) for quick rounds
             const res = await generateSentences('', ['top'], 3, 10, 5, '');
             s.push(res[0]); // Take first generated sentence
          }
          newSocket.emit('rankedMatchPayload', { matchId: data.matchId, sentences: s });
        }
      }
    });

    newSocket.on('rankedMatchReady', (data: { sentences: string[] }) => {
      setSentences(data.sentences);
      setGameState('waiting_ready');
      setCurrentRound(0);
      setAmIReady(false);
    });

    newSocket.on('rankedRoundStart', (data: { round: number }) => {
      setGameState('playing');
      setCurrentRound(data.round);
      setTypedText('');
      setStartTime(Date.now());
      setMyProgress(0);
      setMyWpm(0);
      setOppProgress(0);
      setOppWpm(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    });

    newSocket.on('rankedOpponentProgress', (data: { progress: number; wpm: number }) => {
      setOppProgress(data.progress);
      setOppWpm(data.wpm);
    });

    newSocket.on('rankedRoundEnd', (data: { winnerId: string; scores: Record<string, number> }) => {
      setGameState('round_finished');
      setScores(data.scores);
    });

    newSocket.on('rankedNextRound', (data: { round: number }) => {
      setGameState('waiting_ready');
      setCurrentRound(data.round);
      setAmIReady(false);
    });

    newSocket.on('rankedMatchFinished', (data: { winnerId: string; scores: Record<string, number>; eloChanges: Record<string, number> }) => {
      setGameState('match_finished');
      setMatchWinner(data.winnerId);
      setScores(data.scores);
      setEloChanges(data.eloChanges);
    });

    newSocket.on('rankedOpponentDisconnected', () => {
      alert('Opponent disconnected. You win by default!');
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const handleJoinQueue = () => {
    if (!socket || !user) return;
    socket.emit('joinRankedQueue', { 
      userId: user.id, 
      username: user.username, 
      elo: (user as any).elo || 10, 
      language 
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

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== 'playing' || !matchData || !socket) return;
    const val = e.target.value;
    const target = sentences[currentRound];
    
    // Allow typing only if it matches so far
    if (target.startsWith(val)) {
      setTypedText(val);
      
      const progress = (val.length / target.length) * 100;
      const timeElapsed = (Date.now() - (startTime || Date.now())) / 60000;
      const words = val.length / 5;
      const wpm = timeElapsed > 0 ? Math.round(words / timeElapsed) : 0;
      
      setMyProgress(progress);
      setMyWpm(wpm);
      
      socket.emit('updateRankedProgress', { matchId: matchData.matchId, progress, wpm });

      if (val === target) {
        socket.emit('rankedRoundFinished', { matchId: matchData.matchId });
      }
    }
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

  // Dots for Best of 5 (Need 3 to win)
  const renderDots = (score: number) => {
    return (
      <div className="flex gap-2">
        {[0, 1, 2].map(i => (
          <div key={i} className={`w-3 h-3 rounded-full border ${i < score ? 'bg-[var(--hot)] border-[var(--hot)]' : 'border-slate-700 bg-transparent'}`} />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col h-[70vh] border border-slate-800 rounded bg-slate-900/30 overflow-hidden relative">
      
      {/* Top Bar / Scoreboard */}
      <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-4">
          <div>
            <div className="font-mono text-sm text-[var(--hot)] uppercase tracking-widest">{user.username}</div>
            <div className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">ELO: {(user as any).elo || 10}</div>
          </div>
          {renderDots(myScore)}
        </div>
        
        <div className="font-display text-xl text-slate-400 uppercase tracking-widest">Round {currentRound + 1}</div>

        <div className="flex items-center gap-4 text-right">
          {renderDots(oppScore)}
          <div>
            <div className="font-mono text-sm text-rose-400 uppercase tracking-widest">{matchData.opponent.username}</div>
            <div className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">ELO: {matchData.opponent.elo}</div>
          </div>
        </div>
      </div>

      {/* Split Screen Area */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        {/* Center Divider */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-800 -translate-x-1/2 z-10" />

        {/* My Side (Left) */}
        <div className="flex-1 p-8 flex flex-col relative">
          <div className="flex justify-between items-end mb-8">
            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">Your Area</span>
            <span className="font-mono text-sm text-[var(--hot)] uppercase tracking-widest">{myWpm} WPM</span>
          </div>

          <div className="flex-1 relative">
            <div className="font-mono text-2xl leading-relaxed text-slate-600 break-words whitespace-pre-wrap">
              {targetText.split('').map((char, i) => {
                let color = 'text-slate-600';
                if (i < typedText.length) {
                  color = typedText[i] === char ? 'text-[var(--hot)]' : 'text-rose-500 underline bg-rose-500/10';
                } else if (i === typedText.length && gameState === 'playing') {
                  color = 'text-slate-100 bg-slate-800';
                }
                return <span key={i} className={color}>{char}</span>;
              })}
            </div>
            
            {/* Hidden Input */}
            <input 
              ref={inputRef}
              type="text"
              value={typedText}
              onChange={handleTyping}
              disabled={gameState !== 'playing'}
              className="absolute opacity-0 -z-10"
              autoFocus
            />
          </div>
          
          <div className="h-1 bg-slate-800 w-full rounded-full overflow-hidden mt-4">
            <div className="h-full bg-[var(--hot)] transition-all duration-200" style={{ width: `${myProgress}%` }} />
          </div>
        </div>

        {/* Opponent Side (Right) */}
        <div className="flex-1 p-8 flex flex-col relative bg-slate-900/20">
          <div className="flex justify-between items-end mb-8">
            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">Opponent Area</span>
            <span className="font-mono text-sm text-rose-400 uppercase tracking-widest">{oppWpm} WPM</span>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center opacity-50">
            {/* We don't show the exact opponent text, just their progress clearly */}
            <div className="w-full text-center space-y-4">
              <span className="font-display text-4xl text-rose-400">{Math.round(oppProgress)}%</span>
              <div className="h-2 bg-slate-800 w-full rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-rose-400 transition-all duration-300" style={{ width: `${oppProgress}%` }} />
              </div>
            </div>
          </div>
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
