const fs = require('fs');
let socketTs = fs.readFileSync('backend/src/services/socketService.ts', 'utf8');
socketTs = socketTs.replace(
  /characters\?: string\[\];\n\}/,
  `characters?: string[];\n  fullTheme?: string;\n}`
);
fs.writeFileSync('backend/src/services/socketService.ts', socketTs);
