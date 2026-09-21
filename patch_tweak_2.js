const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Increase waviness (targetScale max from 12 to 16)
code = code.replace(
  /const targetScale = tripActive \? 12 \* \(multipliers\[tripLevel\] \|\| 0\) : 0;/g,
  'const targetScale = tripActive ? 16 * (multipliers[tripLevel] || 0) : 0;'
);

// 2. Increase dyslexia ability
// Find: const n = 3 + Math.floor(Math.random() * 6);
// Replace with: const n = 6 + Math.floor(Math.random() * 6); // 6 to 11 letters
code = code.replace(
  /const n = 3 \+ Math\.floor\(Math\.random\(\) \* 6\);/g,
  'const n = 6 + Math.floor(Math.random() * 6);'
);

// Find the dyslexia interval: }, 900);
// Replace with: }, 700);
code = code.replace(
  /\}, 900\);/g,
  '}, 700);'
);

fs.writeFileSync(path, code);
