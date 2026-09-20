const fs = require('fs');
const path = 'backend/src/services/socketService.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Update RankedPlayer interface
code = code.replace(
  "bgTheme?: any;\n}",
  "bgTheme?: any;\n  characters?: string[];\n}"
);

// 2. Add characters to the player object pushed to rankedQueue
code = code.replace(
  "bgTheme: data.bgTheme\n      };\n\n      rankedQueue[lang]",
  "bgTheme: data.bgTheme,\n        characters: data.characters\n      };\n\n      rankedQueue[lang]"
);

fs.writeFileSync(path, code);
