import { Server } from 'socket.io';
import User from '../models/User.js';
const lobbies = {};
function generateLobbyCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++)
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
}
export const initSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: '*', // Adjust this for production
            methods: ['GET', 'POST'],
        },
    });
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);
        // Create a new lobby
        socket.on('createLobby', (data) => {
            let code = generateLobbyCode();
            while (lobbies[code]) {
                code = generateLobbyCode();
            }
            const lobby = {
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
        // Get public lobbies
        socket.on('getPublicLobbies', () => {
            socket.emit('publicLobbiesUpdated', getPublicLobbies());
        });
        // Join a lobby
        socket.on('joinLobby', (data) => {
            const lobby = lobbies[data.code];
            if (!lobby) {
                return socket.emit('error', 'Lobby not found');
            }
            if (lobby.state !== 'waiting') {
                return socket.emit('error', 'Game has already started');
            }
            if (lobby.players.length >= lobby.maxPlayers) {
                return socket.emit('error', 'Lobby is full');
            }
            const existingPlayer = lobby.players.find(p => p.userId === data.userId);
            if (existingPlayer) {
                existingPlayer.id = socket.id; // Rejoin
            }
            else {
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
        // Kick player
        socket.on('kickPlayer', (data) => {
            const lobby = lobbies[data.code];
            if (lobby && lobby.hostId === socket.id) {
                lobby.players = lobby.players.filter(p => p.id !== data.targetId);
                io.to(data.targetId).emit('kicked');
                const targetSocket = io.sockets.sockets.get(data.targetId);
                if (targetSocket) {
                    targetSocket.leave(data.code);
                }
                io.to(data.code).emit('lobbyUpdated', lobby);
            }
        });
        // Leave lobby
        socket.on('leaveLobby', (code) => {
            const lobby = lobbies[code];
            if (lobby) {
                lobby.players = lobby.players.filter(p => p.id !== socket.id);
                socket.leave(code);
                if (lobby.players.length === 0) {
                    delete lobbies[code];
                }
                else if (lobby.hostId === socket.id) {
                    lobby.hostId = lobby.players[0].id;
                    lobby.hostName = lobby.players[0].username;
                }
                if (lobbies[code]) {
                    io.to(code).emit('lobbyUpdated', lobby);
                }
                io.emit('publicLobbiesUpdated', getPublicLobbies());
            }
        });
        // Start Game
        socket.on('startGame', (code) => {
            const lobby = lobbies[code];
            if (lobby && lobby.hostId === socket.id && lobby.state === 'waiting') {
                lobby.state = 'playing';
                lobby.startTime = Date.now();
                io.to(code).emit('gameStarted', lobby);
                io.emit('publicLobbiesUpdated', getPublicLobbies());
            }
        });
        // Update Progress
        socket.on('updateProgress', async (data) => {
            const lobby = lobbies[data.code];
            if (!lobby || lobby.state !== 'playing')
                return;
            const player = lobby.players.find(p => p.id === socket.id);
            if (player) {
                player.progress = data.progress;
                player.wpm = data.wpm;
                if (data.isFinished && !player.isFinished) {
                    player.isFinished = true;
                }
                io.to(data.code).emit('playerProgress', { playerId: socket.id, progress: player.progress, wpm: player.wpm, isFinished: player.isFinished });
                const allFinished = lobby.players.every(p => p.isFinished);
                if (allFinished) {
                    await handleGameEnd(lobby, io);
                }
            }
        });
        // Force end (time ran out)
        socket.on('timeUp', async (code) => {
            const lobby = lobbies[code];
            if (lobby && lobby.state === 'playing') {
                // Just let the host trigger it, or whoever hits it first
                await handleGameEnd(lobby, io);
            }
        });
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
            // Find any lobbies the player is in and remove them
            for (const code of Object.keys(lobbies)) {
                const lobby = lobbies[code];
                const isPlayer = lobby.players.some(p => p.id === socket.id);
                if (isPlayer) {
                    lobby.players = lobby.players.filter(p => p.id !== socket.id);
                    if (lobby.players.length === 0) {
                        delete lobbies[code];
                    }
                    else if (lobby.hostId === socket.id) {
                        lobby.hostId = lobby.players[0].id;
                        lobby.hostName = lobby.players[0].username;
                        io.to(code).emit('lobbyUpdated', lobby);
                    }
                    else {
                        io.to(code).emit('lobbyUpdated', lobby);
                    }
                    io.emit('publicLobbiesUpdated', getPublicLobbies());
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
async function handleGameEnd(lobby, io) {
    if (lobby.state === 'finished')
        return;
    lobby.state = 'finished';
    // Calculate winner based on WPM
    const sortedPlayers = [...lobby.players].sort((a, b) => b.wpm - a.wpm);
    if (sortedPlayers.length > 1) {
        const winner = sortedPlayers[0];
        // Update ELOs in MongoDB
        try {
            // Winner gets +5
            await User.findByIdAndUpdate(winner.userId, { $inc: { elo: 5 } });
            // Losers get -3, minimum 10
            for (let i = 1; i < sortedPlayers.length; i++) {
                const loser = sortedPlayers[i];
                const dbUser = await User.findById(loser.userId);
                if (dbUser) {
                    dbUser.elo = Math.max(10, dbUser.elo - 3);
                    await dbUser.save();
                }
            }
        }
        catch (err) {
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
    // Clean up lobby after 10 seconds
    setTimeout(() => {
        delete lobbies[lobby.id];
        io.emit('publicLobbiesUpdated', getPublicLobbies());
    }, 10000);
}
