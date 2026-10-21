
import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { getAllowedOrigins, getJwtSecret } from '../config/security.js';

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
export type RankedAbility = 'longer_words' | 'scribberish' | 'no_color_change' | 'word_shuffle' | 'opponent_mistakes' | 'time_stop' | 'screen_flash' | 'none';

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
  colorTheme?: any;
  fontFamily?: string;
  bgTheme?: any;
  characters?: string[];
  fullTheme?: string;
  abilities?: string[]; // Ability ids this player has purchased (cast on the opponent)
}

interface RankedMatch {
  id: string;
  language: string;
  players: Record<string, RankedPlayer>; // Keyed by socket ID
  sentences: string[];
  currentRound: number;
  state: 'generating' | 'waiting_ready' | 'playing' | 'round_finished' | 'ability_selection' | 'finished';
  roundTimer?: NodeJS.Timeout;
  abilitySelectionTimer?: NodeJS.Timeout;
  extraTime?: number;
  roundEndAt?: number; // Epoch ms when the current round ends (extended by Time Warp)
  gravityInterval?: NodeJS.Timeout; // Watches Gravity abilities (Time Warp / Event Horizon)
  timeWarpUses?: Record<string, number>; // Time Warp uses per player id (max 3 per match)
  eventHorizonUsed?: Record<string, boolean>; // Event Horizon is 1-time only (for that round)
}

const MAX_TIME_WARPS_PER_MATCH = 3;
const TIME_WARP_BONUS_MS = 10000;
const EVENT_HORIZON_MIN_ELAPSED_SEC = 30;

const rankedQueue: Record<string, RankedPlayer[]> = {}; // Keyed by language
const rankedMatches: Record<string, RankedMatch> = {}; // Keyed by match ID

function generateLobbyCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

export const initSocket = (httpServer: HttpServer) => {
  const allowedOrigins = getAllowedOrigins();
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authenticate every Socket.io connection via JWT and resolve user identity from MongoDB
  io.use(async (socket, next) => {
    try {
      const rawToken =
        socket.handshake.auth?.token ||
        (typeof socket.handshake.headers?.authorization === 'string' &&
        socket.handshake.headers.authorization.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.slice(7).trim()
          : undefined);

      if (!rawToken || typeof rawToken !== 'string') {
        return next(new Error('Authentication error: token required'));
      }

      const decoded = jwt.verify(rawToken, getJwtSecret()) as { id?: string; purpose?: string };
      if (!decoded.id || decoded.purpose || !mongoose.isValidObjectId(decoded.id)) {
        return next(new Error('Authentication error: invalid token'));
      }

      const dbUser = await User.findById(decoded.id).select('username elo');
      if (!dbUser) {
        return next(new Error('Authentication error: user not found'));
      }

      socket.data.user = {
        userId: dbUser._id.toString(),
        username: dbUser.username,
        elo: dbUser.elo,
      };
      return next();
    } catch {
      return next(new Error('Authentication error: token verification failed'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const authUser = socket.data.user as { userId: string; username: string; elo: number } | undefined;
    if (!authUser) {
      socket.disconnect(true);
      return;
    }
    console.log(`Socket connected: ${socket.id} (${authUser.username})`);

    // ----- CASUAL MODE LOBBIES -----
    socket.on('createLobby', async (data: { userId?: string; username?: string; elo?: number; isPublic: boolean; maxPlayers: number; config: GameConfig }) => {
      const freshUser = await User.findById(authUser.userId).select('username elo');
      const verifiedUsername = freshUser?.username || authUser.username;
      const verifiedElo = freshUser?.elo ?? authUser.elo;

      let code = generateLobbyCode();
      while (lobbies[code]) {
        code = generateLobbyCode();
      }

      const safeMaxPlayers = Math.min(100, Math.max(2, Number(data?.maxPlayers) || 4));

      const lobby: Lobby = {
        id: code,
        hostId: socket.id,
        hostName: verifiedUsername,
        isPublic: Boolean(data?.isPublic),
        maxPlayers: safeMaxPlayers,
        players: [{
          id: socket.id,
          userId: authUser.userId,
          username: verifiedUsername,
          elo: verifiedElo,
          progress: 0,
          wpm: 0,
          isFinished: false,
        }],
        config: data?.config || { mode: 'words', textPayload: [], duration: 60 },
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

    socket.on('joinLobby', async (data: { code: string; userId?: string; username?: string; elo?: number }) => {
      const code = typeof data?.code === 'string' ? data.code.trim().toUpperCase() : '';
      const lobby = lobbies[code];
      if (!lobby) return socket.emit('error', 'Lobby not found');
      if (lobby.state !== 'waiting') return socket.emit('error', 'Game has already started');
      if (lobby.players.length >= lobby.maxPlayers) return socket.emit('error', 'Lobby is full');

      const freshUser = await User.findById(authUser.userId).select('username elo');
      const verifiedUsername = freshUser?.username || authUser.username;
      const verifiedElo = freshUser?.elo ?? authUser.elo;

      const existingPlayer = lobby.players.find(p => p.userId === authUser.userId);
      if (existingPlayer) {
         existingPlayer.id = socket.id;
         existingPlayer.username = verifiedUsername;
         existingPlayer.elo = verifiedElo;
      } else {
        lobby.players.push({
          id: socket.id,
          userId: authUser.userId,
          username: verifiedUsername,
          elo: verifiedElo,
          progress: 0,
          wpm: 0,
          isFinished: false,
        });
      }

      socket.join(code);
      io.to(code).emit('lobbyUpdated', lobby);

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

    socket.on('updateProgress', async (data: { code: string; progress: number; wpm: number; isFinished: boolean; cia?: {c: number, i: number, a: number} }) => {
      const lobby = lobbies[data?.code];
      if (!lobby || lobby.state !== 'playing') return;

      const player = lobby.players.find(p => p.id === socket.id);
      if (player) {
        player.progress = Math.min(100, Math.max(0, Number(data.progress) || 0));
        player.wpm = Math.min(350, Math.max(0, Math.round(Number(data.wpm) || 0)));
        if (data.isFinished && !player.isFinished) player.isFinished = true;

        io.to(data.code).emit('playerProgress', { playerId: socket.id, progress: player.progress, wpm: player.wpm, isFinished: player.isFinished, cia: data.cia });

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
    socket.on('joinRankedQueue', async (data: { userId?: string; username?: string; elo?: number; language: string; colorTheme?: any; fontFamily?: string; bgTheme?: any; characters?: string[]; fullTheme?: any }) => {
      const lang = typeof data?.language === 'string' && data.language.trim() ? data.language.trim().toLowerCase() : 'english';
      if (!rankedQueue[lang]) rankedQueue[lang] = [];

      const freshUser = await User.findById(authUser.userId).select('username elo');
      const verifiedUsername = freshUser?.username || authUser.username;
      const verifiedElo = freshUser?.elo ?? authUser.elo;

      // Avoid duplicate queueing (allow same userId if different socket for testing in multiple tabs)
      rankedQueue[lang] = rankedQueue[lang].filter(p => p.id !== socket.id);

      const player: RankedPlayer = {
        id: socket.id,
        userId: authUser.userId,
        username: verifiedUsername,
        elo: verifiedElo,
        ready: false,
        score: 0,
        progress: 0,
        wpm: 0,
        finishedRound: false,
        colorTheme: data.colorTheme,
        fontFamily: data.fontFamily,
        bgTheme: data.bgTheme,
        characters: Array.isArray(data.characters) ? data.characters.slice(0, 3) : [],
        fullTheme: data.fullTheme
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
            match.extraTime = 0;
            const roundStartAt = Date.now();
            match.roundEndAt = roundStartAt + 60000;
            if (match.gravityInterval) clearInterval(match.gravityInterval);
            if (!match.timeWarpUses) match.timeWarpUses = {};
            if (!match.eventHorizonUsed) match.eventHorizonUsed = {};

            const handleRoundEnd = async (forcedByEventHorizon = false) => {
              if (rankedMatches[match.id] && match.state === 'playing' && match.currentRound === roundIndex) {
                // Time Warp may have pushed the end of the round further out
                const remainingMs = (match.roundEndAt || 0) - Date.now();
                if (!forcedByEventHorizon && remainingMs > 50) {
                  match.roundTimer = setTimeout(() => handleRoundEnd(false), remainingMs);
                  return;
                }

                const playersList = Object.values(match.players);

                // Time Warp: when timer hits 0, a slower caster adds +10s (+20s if buffed) for BOTH players (max 3 per match)
                if (!forcedByEventHorizon && playersList.length >= 2) {
                  for (const caster of playersList) {
                    const opp = playersList.find(p => p.id !== caster.id)!;
                    const ab = caster.abilities || [];
                    const used = match.timeWarpUses![caster.id] || 0;
                    if ((ab.includes('gravity1') || ab.includes('gravity1_buffed')) && used < MAX_TIME_WARPS_PER_MATCH && caster.wpm < opp.wpm) {
                      const bonusMs = ab.includes('gravity1_buffed') ? TIME_WARP_BONUS_MS * 2 : TIME_WARP_BONUS_MS;
                      match.timeWarpUses![caster.id] = used + 1;
                      match.roundEndAt = Date.now() + bonusMs;
                      if (match.roundTimer) clearTimeout(match.roundTimer);
                      match.roundTimer = setTimeout(() => handleRoundEnd(false), bonusMs);
                      io.to(match.id).emit('rankedGravityTimeSync', {
                        amountSec: bonusMs / 1000,
                        casterId: caster.id,
                        usesLeft: MAX_TIME_WARPS_PER_MATCH - (used + 1)
                      });
                      return;
                    }
                  }
                }

                // Event Horizon is 1-time only for the round it was active in: consume it at round end
                for (const p of playersList) {
                  if (p.abilities && (p.abilities.includes('gravity3') || p.abilities.includes('gravity3_buffed'))) {
                    match.eventHorizonUsed![p.id] = true;
                    p.abilities = p.abilities.filter(a => a !== 'gravity3' && a !== 'gravity3_buffed');
                  }
                }

                if (match.gravityInterval) clearInterval(match.gravityInterval);
                match.state = 'round_finished';
                
                let roundWinner = playersList[0];
                let roundLoser = playersList[1];
                
                if (playersList[1].wpm > playersList[0].wpm) {
                  roundWinner = playersList[1];
                  roundLoser = playersList[0];
                } else if (playersList[1].wpm === playersList[0].wpm) {
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

                if (roundWinner.score >= 3) {
                  match.state = 'finished';
                  await handleRankedMatchEnd(match, io);
                } else {
                  
                  match.currentRound += 1;
                  match.state = 'waiting_ready';
                  Object.values(match.players).forEach(p => {
                    p.ready = false;
                  });
                  setTimeout(() => {
                    if (rankedMatches[match.id]) {
                      io.to(match.id).emit('rankedNextRound', { round: match.currentRound });
                    }
                  }, 30000);

                }
              }
            };
            match.roundTimer = setTimeout(() => handleRoundEnd(false), 60000);

            // Gravity abilities, evaluated server-side from live WPM
            match.gravityInterval = setInterval(() => {
              if (!rankedMatches[match.id] || match.state !== 'playing' || match.currentRound !== roundIndex) {
                if (match.gravityInterval) clearInterval(match.gravityInterval);
                return;
              }
              const players = Object.values(match.players);
              if (players.length < 2) return;

              const elapsedSec = (Date.now() - roundStartAt) / 1000;

              // Event Horizon: 1-time only for that round — after 30s, if the caster out-types the opponent, end the round instantly
              for (const caster of players) {
                const opp = players.find(p => p.id !== caster.id)!;
                const ab = caster.abilities || [];
                if (
                  !match.eventHorizonUsed![caster.id] &&
                  (ab.includes('gravity3') || ab.includes('gravity3_buffed')) &&
                  elapsedSec >= EVENT_HORIZON_MIN_ELAPSED_SEC &&
                  caster.wpm > opp.wpm
                ) {
                  match.eventHorizonUsed![caster.id] = true;
                  caster.abilities = ab.filter(a => a !== 'gravity3' && a !== 'gravity3_buffed');
                  io.to(match.id).emit('rankedGravityEventHorizon', { casterId: caster.id });
                  if (match.gravityInterval) clearInterval(match.gravityInterval);
                  if (match.roundTimer) clearTimeout(match.roundTimer);
                  match.roundEndAt = Date.now();
                  handleRoundEnd(true);
                  return;
                }
              }
            }, 500);
          }
        }
      }
    });

    socket.on('updateRankedProgress', (data: { matchId: string; progress: number; wpm: number; typedText?: string; activeKeys?: string[]; targetText?: string; cia?: {c: number, i: number, a: number}; charge?: number; bestLetter?: string; worstLetter?: string; rawWpm?: number; accuracy?: number; consistency?: number; coins?: number; hearts?: number }) => {
      const match = rankedMatches[data?.matchId];
      if (match && match.state === 'playing') {
        const player = match.players[socket.id];
        if (player) {
          const safeProgress = Math.min(100, Math.max(0, Number(data.progress) || 0));
          const safeWpm = Math.min(350, Math.max(0, Math.round(Number(data.wpm) || 0)));
          player.progress = safeProgress;
          player.wpm = safeWpm;
          socket.to(data.matchId).emit('rankedOpponentProgress', {
            charge: data.charge, 
            progress: safeProgress, 
            wpm: safeWpm, 
            typedText: data.typedText, 
            activeKeys: data.activeKeys,
            targetText: data.targetText,
            cia: data.cia,
            bestLetter: data.bestLetter,
            worstLetter: data.worstLetter,
            rawWpm: data.rawWpm,
            accuracy: data.accuracy,
            consistency: data.consistency,
            coins: Number.isFinite(Number(data.coins)) ? Math.max(0, Math.min(1000000, Math.round(Number(data.coins)))) : undefined,
            hearts: Number.isFinite(Number(data.hearts)) ? Math.max(0, Math.min(1000000, Math.round(Number(data.hearts)))) : undefined
          });
        }
      }
    });

    socket.on('rankedUpgrades', (data: { matchId: string; upgrades: string[] }) => {
      const match = rankedMatches[data.matchId];
      if (match) {
        const player = match.players[socket.id];
        if (player) player.abilities = Array.isArray(data.upgrades) ? data.upgrades : [];
        socket.to(data.matchId).emit('rankedOpponentUpgrades', { upgrades: data.upgrades });
      }
    });

    // Money Guy Inflation: relay cost-increase percentages to the opponent (validated + clamped)
    socket.on('rankedInflation', (data: { matchId: string; coinPct: number; heartPct: number }) => {
      const match = rankedMatches[data?.matchId];
      if (!match || !match.players[socket.id]) return;
      const clamp = (v: unknown) => Math.max(0, Math.min(200, Math.round(Number(v) || 0)));
      socket.to(data.matchId).emit('rankedInflation', { coinPct: clamp(data.coinPct), heartPct: clamp(data.heartPct) });
    });

    socket.on('rankedRemoveOpponentAbility', (data: { matchId: string; abilityId: string }) => {
      const match = rankedMatches[data?.matchId];
      if (match && typeof data?.abilityId === 'string') {
        const opponent = Object.values(match.players).find(p => p.id !== socket.id);
        if (opponent && Array.isArray(opponent.abilities)) {
          opponent.abilities = opponent.abilities.filter(
            a => a !== data.abilityId && a !== `${data.abilityId}_buffed`
          );
        }
        socket.to(data.matchId).emit('rankedAbilityRemoved', { abilityId: data.abilityId });
      }
    });
    
    // Time Warp (gravity1) and Event Horizon (gravity3) are resolved server-side in the round loop above.
    socket.on('rankedGravitySabotage', (data: { matchId: string, isBuffed: boolean }) => {
      socket.to(data.matchId).emit('rankedGravitySabotage', { isBuffed: data.isBuffed });
    });

    socket.on('rankedTimeWarp', (data: { matchId: string }) => {
      socket.to(data.matchId).emit('rankedTimeWarp');
    });





    socket.on('leaveRankedMatch', (data: { matchId: string }) => {
      const match = rankedMatches[data.matchId];
      if (match && match.players[socket.id] && match.state !== 'finished') {
        match.state = 'finished';
        if (match.roundTimer) clearTimeout(match.roundTimer);
        
        const remainingPlayer = Object.values(match.players).find(p => p.id !== socket.id);
        if (remainingPlayer) {
          io.to(data.matchId).emit('rankedOpponentDisconnected');
          remainingPlayer.score = 5;
          handleRankedMatchEnd(match, io).catch(console.error);
        } else {
          delete rankedMatches[data.matchId];
        }
        socket.leave(data.matchId);
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
