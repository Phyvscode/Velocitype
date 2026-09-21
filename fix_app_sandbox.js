const fs = require('fs');
const path = 'frontend/src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes("import RankedSandbox from './components/RankedSandbox';")) {
  code = code.replace(
    "import RankedMode from './components/RankedMode';",
    "import RankedMode from './components/RankedMode';\nimport RankedSandbox from './components/RankedSandbox';"
  );
}

const typeDef = "type Screen = 'casual' | 'setup' | 'lobby' | 'multiplayerGame' | 'game' | 'results' | 'library' | 'configure' | 'ranked';";
if (code.includes(typeDef)) {
  code = code.replace(
    typeDef,
    "type Screen = 'casual' | 'setup' | 'lobby' | 'multiplayerGame' | 'game' | 'results' | 'library' | 'configure' | 'ranked' | 'ranked_test';"
  );
}

fs.writeFileSync(path, code);
