const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/  useEffect\(\(\) => \{\n    if \(gameState === 'playing' && myActiveAbility === 'screen_flash'\) \{\n      const interval = setInterval\(\(\) => \{\n        if \(Math\.random\(\) < 0\.3\) \{\n          socket\?\.emit\('rankedScreenFlash', \{ matchId: matchData\?\.matchId \}\);\n        \}\n      \}, 3000\);\n      return \(\) => clearInterval\(interval\);\n    \}\n  \}, \[gameState, myActiveAbility, matchData\?\.matchId, socket\]\);\n\n/g, '');

code = code.replace(/&& !isTimeStopped/g, '');
code = code.replace(/, isTimeStopped\]\)/g, '])');

fs.writeFileSync(path, code);
