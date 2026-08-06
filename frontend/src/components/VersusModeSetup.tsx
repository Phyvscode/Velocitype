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

  if (!user) {
    return (
      <div className="bg-slate-800/40 p-6 border border-slate-700/50 text-center">
        <h3 className="text-xl font-bold text-amber-400 mb-2">Sign In Required</h3>
        <p className="text-slate-300">You must be signed in to play multiplayer.</p>
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
    <div className="bg-slate-800/40 border border-slate-700/50">
      <div className="flex border-b border-slate-700/50">
        <button
          onClick={() => setTab('join')}
          className={`flex-1 p-4 font-bold transition-colors ${tab === 'join' ? 'bg-amber-400 text-slate-900' : 'text-slate-400 hover:bg-slate-800'}`}
        >
          Browse Matches
        </button>
        <button
          onClick={() => setTab('create')}
          className={`flex-1 p-4 font-bold transition-colors ${tab === 'create' ? 'bg-amber-400 text-slate-900' : 'text-slate-400 hover:bg-slate-800'}`}
        >
          Create Match
        </button>
      </div>

      <div className="p-6">
        {!isConnected ? (
          <p className="text-center text-slate-400">Connecting to server...</p>
        ) : tab === 'join' ? (
          <div className="space-y-6">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter 6-letter Code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 text-slate-100 font-mono focus:border-amber-400 focus:outline-none"
              />
              <button
                onClick={() => handleJoinLobby(joinCode)}
                disabled={joinCode.length !== 6}
                className="px-6 py-2 bg-amber-400 text-slate-900 font-bold disabled:opacity-50"
              >
                Join
              </button>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-slate-200 mb-3">Public Lobbies</h3>
              {lobbies.length === 0 ? (
                <p className="text-slate-400 text-sm">No public lobbies found. Be the first to create one!</p>
              ) : (
                <div className="space-y-2">
                  {lobbies.map(l => (
                    <div key={l.id} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-700">
                      <div>
                        <div className="font-bold text-amber-400">{l.hostName}'s Lobby</div>
                        <div className="text-xs text-slate-400">Mode: {l.mode} • Players: {l.currentPlayers}/{l.maxPlayers}</div>
                      </div>
                      <button
                        onClick={() => handleJoinLobby(l.id)}
                        disabled={l.currentPlayers >= l.maxPlayers}
                        className="px-4 py-1.5 bg-slate-800 text-slate-200 text-sm font-bold hover:bg-slate-700 transition-colors disabled:opacity-50"
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
              <label className="text-sm text-slate-400 mb-2 block">Game Mode</label>
              <select value={mode} onChange={e => setMode(e.target.value)} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-slate-100 focus:border-amber-400 focus:outline-none">
                <option value="words">Words</option>
                <option value="random">Random Sentences</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Max Players</label>
                <input type="number" min={2} max={100} value={maxPlayers} onChange={e => setMaxPlayers(parseInt(e.target.value) || 2)} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-slate-100 focus:border-amber-400 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Privacy</label>
                <select value={isPublic ? 'public' : 'private'} onChange={e => setIsPublic(e.target.value === 'public')} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-slate-100 focus:border-amber-400 focus:outline-none">
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
            
            <button onClick={handleCreateLobby} className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-bold text-lg hover:scale-[1.02] transition-transform">
              Create Match
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
