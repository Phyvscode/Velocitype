const fs = require('fs');
let socketTs = fs.readFileSync('src/services/socketService.ts', 'utf8');
socketTs = socketTs.replace(
  /characters\?: string\[\];\n\}/,
  `characters?: string[];\n  fullTheme?: string;\n}`
);
fs.writeFileSync('src/services/socketService.ts', socketTs);
