const fs = require('fs');
const path = 'backend/src/services/socketService.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "socket.on('joinRankedQueue', (data: { userId: string; username: string; elo: number; language: string; colorTheme?: any; fontFamily?: string; bgTheme?: any }) => {",
  "socket.on('joinRankedQueue', (data: { userId: string; username: string; elo: number; language: string; colorTheme?: any; fontFamily?: string; bgTheme?: any; characters?: string[] }) => {"
);

fs.writeFileSync(path, code);
