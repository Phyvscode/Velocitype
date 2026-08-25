import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import User from '../models/User.js';

interface Player {
  id: string; // Socket ID
  userId: string; // MongoDB User ID
  username: string;
  elo: number;
  progress: number;
  wpm: number;
  isFinished: boolean;
}

interface GameConfig {
  mode: string;
  textPayload: string[];
  duration: number;
}

interface Lobby {
  id: string;
  hostId: string;
  hostName: string;
  isPublic: boolean;
  maxPlayers: number;
  players: Player[];
  config: GameConfig | null;
  state: 'waiting' | 'playing' | 'finished';
  startTime?: number;
}

const lobbies: Record<string, Lobby> = {};

// Ranked interfaces
interface RankedPlayer {
  id: string;
  userId: string;
  username: string;
  elo: number;
  ready: boolean;
  score: number;
  progress: number;
  wpm: number;
  finishedRound: boolean;
}

interface RankedMatch {
  id: string;
  language: string;
  players: Record<string, RankedPlayer>; // Keyed by socket ID
  sentences: string[];
  currentRound: number; // 0 to 8
  state: 'generating' | 'waiting_ready' | 'playing' | 'round_finished' | 'finished';
  roundTimer?: NodeJS.Timeout;
}

const rankedQueue: Record<string, RankedPlayer[]> = {}; // Keyed by language
const rankedMatches: Record<string, RankedMatch> = {}; // Keyed by match ID

function generateLobbyCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

export const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*', // Adjust this for production
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ----- CASUAL MODE LOBBIES -----
    socket.on('createLobby', (data: { userId: string; username: string; elo: number; isPublic: boolean; maxPlayers: number; config: GameConfig }) => {
      let code = generateLobbyCode();
      while (lobbies[code]) {
        code = generateLobbyCode();
      }

      const lobby: Lobby = {
        id: code,
        hostId: socket.id,
        hostName: data.username,
        isPublic: data.isPublic,
        maxPlayers: data.maxPlayers,
        players: [{
          id: socket.id,
          userId: data.userId,
          username: data.username,
          elo: data.elo,
          progress: 0,
          wpm: 0,
          isFinished: false,
        }],
        config: data.config,
        state: 'waiting',
      };

      lobbies[code] = lobby;
      socket.join(code);
      socket.emit('lobbyCreated', lobby);
      
      if (lobby.isPublic) {
        io.emit('publicLobbiesUpdated', getPublicLobbies());
      }
    });

    socket.on('getPublicLobbies', () => {
      socket.emit('publicLobbiesUpdated', getPublicLobbies());
    });

    socket.on('joinLobby', (data: { code: string; userId: string; username: string; elo: number }) => {
      const lobby = lobbies[data.code];
      if (!lobby) return socket.emit('error', 'Lobby not found');
      if (lobby.state !== 'waiting') return socket.emit('error', 'Game has already started');
      if (lobby.players.length >= lobby.maxPlayers) return socket.emit('error', 'Lobby is full');

      const existingPlayer = lobby.players.find(p => p.userId === data.userId);
      if (existingPlayer) {
         existingPlayer.id = socket.id;
      } else {
        lobby.players.push({
          id: socket.id,
          userId: data.userId,
          username: data.username,
          elo: data.elo,
          progress: 0,
          wpm: 0,
          isFinished: false,
        });
      }

      socket.join(data.code);
      io.to(data.code).emit('lobbyUpdated', lobby);

      if (lobby.isPublic) {
        io.emit('publicLobbiesUpdated', getPublicLobbies());
      }
    });

    socket.on('kickPlayer', (data: { code: string; targetId: string }) => {
      const lobby = lobbies[data.code];
      if (lobby && lobby.hostId === socket.id) {
        lobby.players = lobby.players.filter(p => p.id !== data.targetId);
        io.to(data.targetId).emit('kicked');
        const targetSocket = io.sockets.sockets.get(data.targetId);
        if (targetSocket) targetSocket.leave(data.code);
        io.to(data.code).emit('lobbyUpdated', lobby);
      }
    });

    socket.on('leaveLobby', (code: string) => {
      const lobby = lobbies[code];
      if (lobby) {
        lobby.players = lobby.players.filter(p => p.id !== socket.id);
        socket.leave(code);
        
        if (lobby.players.length === 0) {
          delete lobbies[code];
        } else if (lobby.hostId === socket.id) {
          lobby.hostId = lobby.players[0].id;
          lobby.hostName = lobby.players[0].username;
        }
        
        if (lobbies[code]) {
          io.to(code).emit('lobbyUpdated', lobby);
        }
        io.emit('publicLobbiesUpdated', getPublicLobbies());
      }
    });

    socket.on('startGame', (code: string) => {
      const lobby = lobbies[code];
      if (lobby && lobby.hostId === socket.id && lobby.state === 'waiting') {
        lobby.state = 'playing';
        lobby.startTime = Date.now();
        io.to(code).emit('gameStarted', lobby);
        io.emit('publicLobbiesUpdated', getPublicLobbies());
      }
    });

    socket.on('updateProgress', async (data: { code: string; progress: number; wpm: number; isFinished: boolean }) => {
      const lobby = lobbies[data.code];
      if (!lobby || lobby.state !== 'playing') return;

      const player = lobby.players.find(p => p.id === socket.id);
      if (player) {
        player.progress = data.progress;
        player.wpm = data.wpm;
        if (data.isFinished && !player.isFinished) player.isFinished = true;

        io.to(data.code).emit('playerProgress', { playerId: socket.id, progress: player.progress, wpm: player.wpm, isFinished: player.isFinished });

        const allFinished = lobby.players.every(p => p.isFinished);
        if (allFinished) {
          await handleGameEnd(lobby, io);
        }
      }
    });

    socket.on('timeUp', async (code: string) => {
      const lobby = lobbies[code];
      if (lobby && lobby.state === 'playing') {
        await handleGameEnd(lobby, io);
      }
    });

    // ----- RANKED MODE -----
    socket.on('joinRankedQueue', (data: { userId: string; username: string; elo: number; language: string }) => {
      const lang = data.language || 'english';
      if (!rankedQueue[lang]) rankedQueue[lang] = [];

      // Avoid duplicate queueing
      rankedQueue[lang] = rankedQueue[lang].filter(p => p.userId !== data.userId);

      const player: RankedPlayer = {
        id: socket.id,
        userId: data.userId,
        username: data.username,
        elo: data.elo,
        ready: false,
        score: 0,
        progress: 0,
        wpm: 0,
        finishedRound: false
      };

      rankedQueue[lang].push(player);
      socket.emit('rankedQueueJoined');

      // Check for match
      if (rankedQueue[lang].length >= 2) {
        const p1 = rankedQueue[lang].shift()!;
        const p2 = rankedQueue[lang].shift()!;
        
        const matchId = `ranked_${generateLobbyCode()}`;
        
        const match: RankedMatch = {
          id: matchId,
          language: lang,
          players: {
            [p1.id]: p1,
            [p2.id]: p2
          },
          sentences: [],
          currentRound: 0,
          state: 'generating'
        };

        rankedMatches[matchId] = match;

        const p1Socket = io.sockets.sockets.get(p1.id);
        const p2Socket = io.sockets.sockets.get(p2.id);
        
        if (p1Socket) p1Socket.join(matchId);
        if (p2Socket) p2Socket.join(matchId);

        // Tell p1 to generate sentences
        if (p1Socket) {
          p1Socket.emit('rankedMatchFound', { matchId, language: lang, role: 'host', opponent: p2 });
        }
        if (p2Socket) {
          p2Socket.emit('rankedMatchFound', { matchId, language: lang, role: 'client', opponent: p1 });
        }
      }
    });

    socket.on('leaveRankedQueue', (data: { language: string }) => {
      const lang = data.language || 'english';
      if (rankedQueue[lang]) {
        rankedQueue[lang] = rankedQueue[lang].filter(p => p.id !== socket.id);
      }
    });

    socket.on('rankedMatchPayload', (data: { matchId: string; sentences: string[] }) => {
      const match = rankedMatches[data.matchId];
      if (match && match.state === 'generating') {
        match.sentences = data.sentences;
        match.state = 'waiting_ready';
        io.to(data.matchId).emit('rankedMatchReady', { sentences: data.sentences });
      }
    });

    socket.on('rankedReady', (data: { matchId: string }) => {
      const match = rankedMatches[data.matchId];
      if (match && match.state === 'waiting_ready') {
        const player = match.players[socket.id];
        if (player) {
          player.ready = true;
          io.to(data.matchId).emit('rankedPlayerReady', { playerId: socket.id });

          const allReady = Object.values(match.players).every(p => p.ready);
          if (allReady) {
            match.state = 'playing';
            
            // reset progress for the round
            Object.values(match.players).forEach(p => {
              p.progress = 0;
              p.wpm = 0;
              p.finishedRound = false;
            });
            
            io.to(data.matchId).emit('rankedRoundStart', { round: match.currentRound, duration: 60 });
            
            const roundIndex = match.currentRound;

            match.roundTimer = setTimeout(async () => {
              // Ensure we are still in the same round and game hasn't ended via disconnect
              if (rankedMatches[match.id] && match.state === 'playing' && match.currentRound === roundIndex) {
                match.state = 'round_finished';
                
                const playersList = Object.values(match.players);
                // Decide winner by WPM
                let roundWinner = playersList[0];
                let roundLoser = playersList[1];
                
                if (playersList[1].wpm > playersList[0].wpm) {
                  roundWinner = playersList[1];
                  roundLoser = playersList[0];
                } else if (playersList[1].wpm === playersList[0].wpm) {
                  // Tie breaker by progress
                  if (playersList[1].progress > playersList[0].progress) {
                    roundWinner = playersList[1];
                    roundLoser = playersList[0];
                  }
                }

                roundWinner.score += 1;
                
                io.to(data.matchId).emit('rankedRoundEnd', { 
                  winnerId: roundWinner.id, 
                  scores: { [playersList[0].id]: playersList[0].score, [playersList[1].id]: playersList[1].score } 
                });

                // Check if someone reached 5 points
                if (roundWinner.score >= 5) {
                  match.state = 'finished';
                  await handleRankedMatchEnd(match, io);
                } else {
                  match.currentRound += 1;
                  match.state = 'waiting_ready';
                  Object.values(match.players).forEach(p => p.ready = false);
                  
                  // Automatically move to next round after 3 seconds
                  setTimeout(() => {
                    if (rankedMatches[match.id]) {
                      io.to(data.matchId).emit('rankedNextRound', { round: match.currentRound });
                    }
                  }, 3000);
                }
              }
            }, 60000);
          }
        }
      }
    });

    socket.on('updateRankedProgress', (data: { matchId: string; progress: number; wpm: number; typedText?: string; activeKeys?: string[] }) => {
      const match = rankedMatches[data.matchId];
      if (match && match.state === 'playing') {
        const player = match.players[socket.id];
        if (player) {
          player.progress = data.progress;
          player.wpm = data.wpm;
          socket.to(data.matchId).emit('rankedOpponentProgress', { 
            progress: data.progress, 
            wpm: data.wpm, 
            typedText: data.typedText, 
            activeKeys: data.activeKeys 
          });
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      // Cleanup Casual
      for (const code of Object.keys(lobbies)) {
        const lobby = lobbies[code];
        const isPlayer = lobby.players.some(p => p.id === socket.id);
        
        if (isPlayer) {
          lobby.players = lobby.players.filter(p => p.id !== socket.id);
          if (lobby.players.length === 0) {
            delete lobbies[code];
          } else if (lobby.hostId === socket.id) {
            lobby.hostId = lobby.players[0].id;
            lobby.hostName = lobby.players[0].username;
            io.to(code).emit('lobbyUpdated', lobby);
          } else {
            io.to(code).emit('lobbyUpdated', lobby);
          }
          io.emit('publicLobbiesUpdated', getPublicLobbies());
        }
      }

      // Cleanup Ranked Queue
      for (const lang of Object.keys(rankedQueue)) {
        rankedQueue[lang] = rankedQueue[lang].filter(p => p.id !== socket.id);
      }

      // Cleanup Ranked Matches (if a player disconnects, they forfeit)
      for (const matchId of Object.keys(rankedMatches)) {
        const match = rankedMatches[matchId];
        if (match.players[socket.id] && match.state !== 'finished') {
          match.state = 'finished';
          if (match.roundTimer) clearTimeout(match.roundTimer);
          
          const remainingPlayer = Object.values(match.players).find(p => p.id !== socket.id);
          if (remainingPlayer) {
            io.to(matchId).emit('rankedOpponentDisconnected');
            // Give remaining player the win
            remainingPlayer.score = 5;
            handleRankedMatchEnd(match, io).catch(console.error);
          } else {
            delete rankedMatches[matchId];
          }
        }
      }
    });
  });
};

function getPublicLobbies() {
  return Object.values(lobbies)
    .filter(l => l.isPublic && l.state === 'waiting')
    .map(l => ({
      id: l.id,
      hostName: l.hostName,
      maxPlayers: l.maxPlayers,
      currentPlayers: l.players.length,
      mode: l.config?.mode || 'Unknown'
    }));
}

async function handleGameEnd(lobby: Lobby, io: Server) {
  if (lobby.state === 'finished') return;
  lobby.state = 'finished';

  const sortedPlayers = [...lobby.players].sort((a, b) => b.wpm - a.wpm);
  
  if (sortedPlayers.length > 1) {
    const winner = sortedPlayers[0];
    try {
      await User.findByIdAndUpdate(winner.userId, { $inc: { elo: 5 } });
      for (let i = 1; i < sortedPlayers.length; i++) {
        const loser = sortedPlayers[i];
        const dbUser = await User.findById(loser.userId);
        if (dbUser) {
          dbUser.elo = Math.max(10, dbUser.elo - 3);
          await dbUser.save();
        }
      }
    } catch (err) {
      console.error('Failed to update ELOs:', err);
    }
  }

  io.to(lobby.id).emit('gameFinished', {
    results: sortedPlayers.map(p => ({
      userId: p.userId,
      username: p.username,
      wpm: p.wpm,
      eloChange: p === sortedPlayers[0] && sortedPlayers.length > 1 ? 5 : -3,
      isWinner: p === sortedPlayers[0] && sortedPlayers.length > 1
    }))
  });

  setTimeout(() => {
    delete lobbies[lobby.id];
    io.emit('publicLobbiesUpdated', getPublicLobbies());
  }, 10000);
}

async function handleRankedMatchEnd(match: RankedMatch, io: Server) {
  const p1 = Object.values(match.players)[0];
  const p2 = Object.values(match.players)[1];

  let winner, loser;
  if (p1.score > p2.score) {
    winner = p1;
    loser = p2;
  } else {
    winner = p2;
    loser = p1;
  }

  const eloGain = 15;
  const eloLoss = 10;

  try {
    await User.findByIdAndUpdate(winner.userId, { $inc: { elo: eloGain } });
    const loserDoc = await User.findById(loser.userId);
    if (loserDoc) {
      loserDoc.elo = Math.max(10, loserDoc.elo - eloLoss);
      await loserDoc.save();
    }
  } catch (err) {
    console.error('Failed to update Ranked ELOs:', err);
  }

  io.to(match.id).emit('rankedMatchFinished', {
    winnerId: winner.id,
    scores: { [p1.id]: p1.score, [p2.id]: p2.score },
    eloChanges: {
      [winner.id]: eloGain,
      [loser.id]: -eloLoss
    }
  });

  setTimeout(() => {
    delete rankedMatches[match.id];
  }, 5000);
}
