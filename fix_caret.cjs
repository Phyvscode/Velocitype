const fs = require('fs');

function fix(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /opacity: gameState === 'playing' \? 1 : 0,/,
    "opacity: gameState === 'playing' && !joker1Active ? 1 : 0,"
  );
  fs.writeFileSync(file, content);
}

fix('frontend/src/components/RankedMode.tsx');
fix('frontend/src/components/RankedSandbox.tsx');
