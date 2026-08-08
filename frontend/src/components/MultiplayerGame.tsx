import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import GameScreen from './GameScreen';
import { type GameConfig } from '@/components/SetupScreen';

interface Props {
  lobbyCode: string;
  config: GameConfig;
  onLeave: () => void;
}

export default function MultiplayerGame({ lobbyCode, config, onLeave }: Props) {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [players, setPlayers] = useState<any[]>([]);
  const [results, setResults] = useState<any[] | null>(null);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on('playerProgress', (data) => {
      setPlayers(prev => {
        const pIndex = prev.findIndex(p => p.id === data.playerId);
        if (pIndex >= 0) {
          const newPlayers = [...prev];
          newPlayers[pIndex] = { ...newPlayers[pIndex], progress: data.progress, wpm: data.wpm, isFinished: data.isFinished };
          return newPlayers;
        } else {
          return [...prev, { id: data.playerId, progress: data.progress, wpm: data.wpm, isFinished: data.isFinished, username: 'Unknown' }];
        }
      });
    });

    socket.on('lobbyUpdated', (data) => {
      setPlayers(prev => {
        // Merge names
        return data.players.map((dp: any) => {
          const existing = prev.find(p => p.id === dp.id);
          return { ...dp, progress: existing?.progress || 0, wpm: existing?.wpm || 0, isFinished: existing?.isFinished || false };
        });
      });
    });

    socket.on('gameFinished', (data) => {
      setResults(data.results);
    });

    // Request full lobby data initially to get names
    socket.emit('getPublicLobbies'); // Not ideal, but the lobby should already be synced in state if we tracked it higher up.
    // Actually, LobbyScreen just passed us here. We should have a way to just keep players in sync.

    return () => {
      socket.off('playerProgress');
      socket.off('lobbyUpdated');
      socket.off('gameFinished');
    };
  }, [socket, isConnected]);

  const handleUpdate = (progress: number, wpm: number, isFinished: boolean) => {
    if (socket && isConnected) {
      socket.emit('updateProgress', { code: lobbyCode, progress, wpm, isFinished });
    }
  };

  if (results) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12 px-6 bg-slate-900 border border-slate-700 shadow-2xl">
        <h2 className="text-3xl font-bold text-amber-400 mb-8 text-center">Match Results</h2>
        <div className="space-y-4">
          {results.map((r, i) => (
            <div key={r.userId} className={`flex items-center justify-between p-4 border ${r.isWinner ? 'bg-amber-400/20 border-amber-400/50' : 'bg-slate-800 border-slate-700'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${r.isWinner ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-slate-300'}`}>
                  {i + 1}
                </div>
                <div>
                  <div className="font-bold text-slate-100 text-lg">{r.username}</div>
                  <div className="text-sm text-slate-400">
                    ELO Change: <span className={r.eloChange > 0 ? 'text-emerald-400' : 'text-rose-400'}>{r.eloChange > 0 ? '+' : ''}{r.eloChange}</span>
                  </div>
                </div>
              </div>
              <div className="font-mono text-2xl font-bold text-amber-400">
                {Math.round(r.wpm)} WPM
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <button onClick={onLeave} className="px-8 py-3 bg-slate-700 hover:bg-slate-600 font-bold text-slate-100 transition-colors">
            Return to Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 p-4 lg:p-8 overflow-hidden bg-background">
      <div className="flex-1 border border-slate-700/50 rounded-lg overflow-hidden relative min-h-0">
        <GameScreen 
          config={config} 
          onFinish={() => handleUpdate(100, players.find(p => p.id === socket?.id)?.wpm || 0, true)} 
          onQuit={onLeave}
          onProgress={(progress, wpm) => handleUpdate(progress, wpm, false)}
          hideHeader={true}
        />
      </div>

      <div className="w-full lg:w-80 shrink-0 bg-slate-800/40 border border-slate-700/50 p-6 flex flex-col gap-4 rounded-lg">
        <h3 className="font-bold text-slate-200">Live Opponents</h3>
        <div className="space-y-4">
          {players.map(p => (
            <div key={p.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-slate-300">
                  {p.username} {p.id === socket?.id && '(You)'}
                </span>
                <span className="text-amber-400 font-mono font-bold">
                  {Math.round(p.wpm || 0)} WPM
                </span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded overflow-hidden">
                <div 
                  className="h-full bg-amber-400 transition-all duration-300 ease-out" 
                  style={{ width: `${Math.min(100, Math.max(0, p.progress || 0))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
