const fs = require('fs');
const path = 'frontend/src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

// Import RankedSandbox
if (!code.includes("import RankedSandbox")) {
  code = code.replace(
    "import RankedMode from './components/RankedMode';",
    "import RankedMode from './components/RankedMode';\nimport RankedSandbox from './components/RankedSandbox';"
  );
}

// Add 'ranked_test' to Screen type
code = code.replace(
  "type Screen = 'casual' | 'setup' | 'lobby' | 'multiplayerGame' | 'game' | 'results' | 'library' | 'configure' | 'ranked';",
  "type Screen = 'casual' | 'setup' | 'lobby' | 'multiplayerGame' | 'game' | 'results' | 'library' | 'configure' | 'ranked' | 'ranked_test';"
);

// Add RankedSandbox to the render tree
const sandboxScreen = `
      {screen === 'ranked_test' && (
        <RankedSandbox onBack={() => navigate('setup')} />
      )}
`;

if (!code.includes("<RankedSandbox")) {
  code = code.replace(
    "{screen === 'ranked' && (",
    `${sandboxScreen}\n      {screen === 'ranked' && (`
  );
}

// Map the prop
code = code.replace(
  "          onOpenRanked={() => navigate('ranked')}",
  "          onOpenRanked={() => navigate('ranked')}\n          onOpenRankedTest={() => navigate('ranked_test')}"
);

fs.writeFileSync(path, code);
