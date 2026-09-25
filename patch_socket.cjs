const fs = require('fs');

let file = fs.readFileSync('backend/src/services/socketService.ts', 'utf8');

const injection = `    socket.on('rankedUpgrades', (data: { matchId: string; upgrades: string[] }) => {
      socket.to(data.matchId).emit('rankedUpgrades', { upgrades: data.upgrades });
    });
    
    socket.on('rankedTimeWarp', (data: { matchId: string }) => {
      socket.to(data.matchId).emit('rankedTimeWarp');
    });`;

file = file.replace(/    socket\.on\('rankedUpgrades'.*?\}\);/s, injection);

fs.writeFileSync('backend/src/services/socketService.ts', file);
