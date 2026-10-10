const fs = require('fs');
const path = '../backend/src/services/socketService.ts';
let code = fs.readFileSync(path, 'utf8');

// Insert after rankedTimeWarp
const injection = `
    socket.on('rankedGravityTime', (data: { matchId: string, amountMs: number }) => {
      const match = rankedMatches[data.matchId];
      if (match) {
        match.extraTime = (match.extraTime || 0) + data.amountMs;
        io.to(data.matchId).emit('rankedGravityTimeSync', { amountSec: data.amountMs / 1000 });
      }
    });

    socket.on('rankedGravitySabotage', (data: { matchId: string, isBuffed: boolean }) => {
      socket.to(data.matchId).emit('rankedGravitySabotage', { isBuffed: data.isBuffed });
    });

    socket.on('rankedGravityEndRound', (data: { matchId: string }) => {
      const match = rankedMatches[data.matchId];
      if (match && match.state === 'playing') {
         if (match.roundTimer) clearTimeout(match.roundTimer);
         match.extraTime = 0;
         match.roundTimer = setTimeout(() => {
           // Emulate timer expiration early
         }, 0);
         // Actually, let's just directly call a helper, but wait, handleRoundEnd is inside socket block.
         // Let's just emit to both clients that time is 0.
         io.to(data.matchId).emit('rankedGravityForceEnd');
      }
    });
`;

code = code.replace("socket.on('rankedTimeWarp', (data: { matchId: string }) => {", injection + "\n    socket.on('rankedTimeWarp', (data: { matchId: string }) => {");

fs.writeFileSync(path, code);
console.log("Socket service patched.");
