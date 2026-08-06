import React, { useEffect, useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  lobbyCode: string;
  onLeave: () => void;
  onGameStart: (config: any) => void;
}

export default function LobbyScreen({ lobbyCode, onLeave, onGameStart }: Props) {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [lobby, setLobby] = useState<any>(null);

  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    socket.emit('joinLobby', {
      code: lobbyCode,
      userId: user.id,
      username: user.username,
      elo: (user as any).elo || 10
    });

    socket.on('lobbyUpdated', (data) => {
      setLobby(data);
    });

    socket.on('kicked', () => {
      alert('You have been kicked from the lobby.');
      onLeave();
    });

    socket.on('error', (msg) => {
      alert(msg);
      onLeave();
    });

    socket.on('gameStarted', (data) => {
      onGameStart(data.config);
    });

    return () => {
      socket.off('lobbyUpdated');
      socket.off('kicked');
      socket.off('error');
      socket.off('gameStarted');
      socket.emit('leaveLobby', lobbyCode);
    };
  }, [socket, isConnected, lobbyCode, user, onLeave, onGameStart]);

  if (!lobby) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-xl font-bold text-amber-400">Joining Lobby {lobbyCode}...</div>
      </div>
    );
  }

  const isHost = lobby.hostId === socket?.id;

  const handleStart = () => {
    if (socket && isHost) {
      socket.emit('startGame', lobbyCode);
    }
  };

  const handleKick = (targetId: string) => {
    if (socket && isHost) {
      socket.emit('kickPlayer', { code: lobbyCode, targetId });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-slate-800/40 p-6 border border-slate-700/50">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">{lobby.hostName}'s Match</h2>
          <p className="text-slate-400">Code: <span className="font-mono text-amber-400 font-bold">{lobbyCode}</span> • Mode: {lobby.config?.mode} • {lobby.isPublic ? 'Public' : 'Private'}</p>
        </div>
        <button onClick={onLeave} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold transition-colors">
          Leave Lobby
        </button>
      </div>

      <div className="bg-slate-800/40 border border-slate-700/50 p-6">
        <h3 className="text-lg font-bold text-slate-200 mb-4 flex justify-between">
          <span>Players</span>
          <span className="text-amber-400">{lobby.players.length} / {lobby.maxPlayers}</span>
        </h3>
        
        <div className="grid sm:grid-cols-2 gap-4">
          {lobby.players.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between p-4 bg-slate-900 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-amber-400/20 flex items-center justify-center text-amber-400 font-bold">
                  {p.username.substring(0,2).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-slate-100 flex items-center gap-2">
                    {p.username}
                    {p.id === lobby.hostId && <span className="text-xs bg-amber-400 text-slate-900 px-1 rounded font-bold">HOST</span>}
                  </div>
                  <div className="text-xs text-slate-400">ELO: {p.elo}</div>
                </div>
              </div>
              
              {isHost && p.id !== socket?.id && (
                <button 
                  onClick={() => handleKick(p.id)}
                  className="text-xs text-rose-400 hover:text-rose-300 font-bold px-3 py-1 border border-rose-500/30 hover:bg-rose-500/10 transition-colors"
                >
                  Kick
                </button>
              )}
            </div>
          ))}
          
          {Array.from({ length: lobby.maxPlayers - lobby.players.length }).map((_, i) => (
            <div key={`empty-${i}`} className="flex items-center justify-center p-4 bg-slate-900/50 border border-slate-700/50 border-dashed text-slate-500 italic">
              Waiting for player...
            </div>
          ))}
        </div>
      </div>

      {isHost ? (
        <button 
          onClick={handleStart}
          disabled={lobby.players.length < 2}
          className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-bold text-xl hover:scale-[1.01] transition-transform disabled:opacity-50 disabled:hover:scale-100"
        >
          {lobby.players.length < 2 ? 'Waiting for players...' : 'Start Match'}
        </button>
      ) : (
        <div className="w-full py-4 bg-slate-800 text-slate-400 text-center font-bold text-xl border border-slate-700">
          Waiting for host to start...
        </div>
      )}
    </div>
  );
}
