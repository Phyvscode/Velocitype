import React, { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  onLobbyJoined: (code: string) => void;
}

export default function VersusModeSetup({ onLobbyJoined }: Props) {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [tab, setTab] = useState<'create' | 'join'>('join');
  const [lobbies, setLobbies] = useState<any[]>([]);
  const [joinCode, setJoinCode] = useState('');
  
  // Create Lobby State
  const [isPublic, setIsPublic] = useState(true);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [mode, setMode] = useState('words');

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit('getPublicLobbies');

    socket.on('publicLobbiesUpdated', (data) => {
      setLobbies(data);
    });

    socket.on('lobbyCreated', (lobby) => {
      onLobbyJoined(lobby.id);
    });

    return () => {
      socket.off('publicLobbiesUpdated');
      socket.off('lobbyCreated');
    };
  }, [socket, isConnected, onLobbyJoined]);

  const [versusType, setVersusType] = useState<'casual' | 'ranked'>('casual');

  if (!user) {
    return (
      <div className="bg-slate-800/40 p-6 border border-slate-700/50 text-center">
        <h3 className="text-xl font-bold text-[var(--hot)] mb-2">Sign In Required</h3>
        <p className="text-slate-300 font-mono text-[10px] uppercase tracking-widest">You must be signed in to play multiplayer.</p>
      </div>
    );
  }

  const handleCreateLobby = () => {
    if (!socket || !isConnected) return;
    socket.emit('createLobby', {
      userId: user.id,
      username: user.username,
      elo: (user as any).elo || 10,
      isPublic,
      maxPlayers,
      config: {
        mode,
        textPayload: ['waiting', 'for', 'generation'],
        duration: 60
      }
    });
  };

  const handleJoinLobby = (code: string) => {
    if (!socket || !isConnected) return;
    onLobbyJoined(code.toUpperCase());
  };

  return (
    <div className="bg-transparent border border-slate-800 rounded">
      {/* Versus Type Toggle */}
      <div className="flex border-b border-slate-800 bg-slate-900/30">
        <button
          onClick={() => setVersusType('casual')}
          className={`flex-1 p-5 font-mono text-xs uppercase tracking-widest transition-colors ${versusType === 'casual' ? 'text-[var(--hot)] bg-[var(--hot)]/5' : 'text-slate-500 hover:text-white hover:bg-slate-800/30'}`}
        >
          Casual
        </button>
        <button
          onClick={() => setVersusType('ranked')}
          className={`flex-1 p-5 font-mono text-xs uppercase tracking-widest transition-colors ${versusType === 'ranked' ? 'text-[var(--hot)] bg-[var(--hot)]/5' : 'text-slate-500 hover:text-white hover:bg-slate-800/30'}`}
        >
          Ranked
        </button>
      </div>

      {versusType === 'casual' ? (
        <>
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setTab('join')}
              className={`flex-1 p-4 font-mono text-[10px] uppercase tracking-widest transition-colors ${tab === 'join' ? 'text-[var(--hot)]' : 'text-slate-500 hover:text-white'}`}
            >
              Browse Matches
            </button>
            <button
              onClick={() => setTab('create')}
              className={`flex-1 p-4 font-mono text-[10px] uppercase tracking-widest transition-colors ${tab === 'create' ? 'text-[var(--hot)]' : 'text-slate-500 hover:text-white'}`}
            >
              Create Match
            </button>
          </div>

          <div className="p-6">
            {!isConnected ? (
              <p className="text-center font-mono text-[10px] uppercase tracking-widest text-slate-400">Connecting to server...</p>
            ) : tab === 'join' ? (
              <div className="space-y-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter 6-letter Code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-800 text-white font-mono text-sm focus:border-[var(--hot)] focus:outline-none rounded"
                  />
                  <button
                    onClick={() => handleJoinLobby(joinCode)}
                    disabled={joinCode.length !== 6}
                    className="px-6 py-3 text-[var(--hot)] font-mono text-[10px] uppercase tracking-widest hover:bg-[var(--hot)]/10 transition-colors disabled:opacity-50 border border-transparent rounded"
                  >
                    Join
                  </button>
                </div>
                
                <div>
                  <h3 className="text-[10px] font-mono uppercase tracking-widest text-[var(--hot)] mb-3">Public Lobbies</h3>
                  {lobbies.length === 0 ? (
                    <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">No public lobbies found. Be the first to create one!</p>
                  ) : (
                    <div className="space-y-2">
                      {lobbies.map(l => (
                        <div key={l.id} className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-800 rounded">
                          <div>
                            <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--hot)]">{l.hostName}'s Lobby</div>
                            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mt-1">Mode: {l.mode} • Players: {l.currentPlayers}/{l.maxPlayers}</div>
                          </div>
                          <button
                            onClick={() => handleJoinLobby(l.id)}
                            disabled={l.currentPlayers >= l.maxPlayers}
                            className="px-4 py-2 bg-slate-800 text-white font-mono text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-colors disabled:opacity-50 rounded"
                          >
                            {l.currentPlayers >= l.maxPlayers ? 'Full' : 'Join'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 block">Game Mode</label>
                  <select value={mode} onChange={e => setMode(e.target.value)} className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800 text-white font-mono text-sm focus:border-[var(--hot)] focus:outline-none rounded">
                    <option value="words">Words</option>
                    <option value="random">Random Sentences</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 block">Max Players</label>
                    <input type="number" min={2} max={100} value={maxPlayers} onChange={e => setMaxPlayers(parseInt(e.target.value) || 2)} className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800 text-white font-mono text-sm focus:border-[var(--hot)] focus:outline-none rounded" />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 block">Privacy</label>
                    <select value={isPublic ? 'public' : 'private'} onChange={e => setIsPublic(e.target.value === 'public')} className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800 text-white font-mono text-sm focus:border-[var(--hot)] focus:outline-none rounded">
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>
                
                <button onClick={handleCreateLobby} className="w-full py-5 border border-[var(--hot)] text-[var(--hot)] bg-[var(--hot)]/10 font-mono text-[10px] uppercase tracking-widest hover:bg-[var(--hot)] hover:text-black transition-colors rounded">
                  Create Match
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="p-12 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--hot)] animate-pulse">Ranked Mode Coming Soon...</p>
        </div>
      )}
    </div>
  );
}
