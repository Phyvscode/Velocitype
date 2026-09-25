const fs = require('fs');

let file = fs.readFileSync('backend/src/services/socketService.ts', 'utf8');

file = file.replace(
  /    socket\.on\('rankedUpgrades'.*?\}\);\n      \}\n    \}\);/s,
  `$&
    
    socket.on('rankedTimeWarp', (data: { matchId: string }) => {
      socket.to(data.matchId).emit('rankedTimeWarp');
    });`
);

fs.writeFileSync('backend/src/services/socketService.ts', file);
