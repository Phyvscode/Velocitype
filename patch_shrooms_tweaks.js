const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Modify the rollLevel chance to 50%
code = code.replace(
  /if \(r < 0\.6\) currentLevel = Math\.min\(2, currentLevel \+ 1\); \/\/ 60% chance to go up\n\s+else if \(r < 0\.8\) currentLevel = Math\.max\(0, currentLevel - 1\); \/\/ 20% chance to go down/g,
  'if (r < 0.5) currentLevel = Math.min(2, currentLevel + 1);\n      else currentLevel = Math.max(0, currentLevel - 1);'
);

// 2. Reduce waviness (targetScale max from 22 to 12)
code = code.replace(
  /const targetScale = tripActive \? 22 \* \(multipliers\[tripLevel\] \|\| 0\) : 0;/g,
  'const targetScale = tripActive ? 12 * (multipliers[tripLevel] || 0) : 0;'
);

fs.writeFileSync(path, code);

// 3. Modify trip.css for less expansion and compression
const cssPath = 'frontend/src/trip.css';
let cssCode = fs.readFileSync(cssPath, 'utf8');

cssCode = cssCode.replace(
  /50%\s+\{ transform: scale\(calc\(1 \+ var\(--lvl\) \* \.04\)\) rotate\(calc\(var\(--lvl\) \* -\.5deg\)\); \}/g,
  '50%      { transform: scale(calc(1 + var(--lvl) * .015)) rotate(calc(var(--lvl) * -.2deg)); }'
);

fs.writeFileSync(cssPath, cssCode);

