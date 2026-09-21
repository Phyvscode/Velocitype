const fs = require('fs');
let code = fs.readFileSync('backend/src/services/socketService.ts', 'utf8');
code = code.replace(
  /upgrades: number/,
  `upgrades: string[]`
);
fs.writeFileSync('backend/src/services/socketService.ts', code);
