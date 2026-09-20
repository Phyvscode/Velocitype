const fs = require('fs');
const path = 'backend/src/services/socketService.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "targetText?: string; cia?: {c: number, i: number, a: number} }) => {",
  "targetText?: string; cia?: {c: number, i: number, a: number}; charge?: number }) => {"
);

code = code.replace(
  "socket.to(data.matchId).emit('rankedOpponentProgress', {",
  "socket.to(data.matchId).emit('rankedOpponentProgress', {\n          charge: data.charge,"
);

fs.writeFileSync(path, code);
