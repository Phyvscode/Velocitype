const fs = require('fs');
const path = 'src/components/AnimatedCharacter.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "const frameCount = id === 'screwed' ? 42 : id === 'joker' ? 6 : id === 'gravity' ? 4 : 8;",
  "const frameCount = id === 'screwed' ? 42 : id === 'joker' ? 6 : id === 'gravity' ? 4 : id === 'moneyguy' ? 2 : 8;"
);

code = code.replace(
  "const fps = id === 'screwed' ? 10 : id === 'gravity' ? 6 : 7.8;",
  "const fps = id === 'screwed' ? 10 : id === 'gravity' ? 6 : id === 'moneyguy' ? 2 : 7.8;"
);

code = code.replace(
  "  if (!src) return null;",
  "  } else if (id === 'moneyguy') {\n    const frameStr = String(frame).padStart(4, '0');\n    src = `/characters/moneyguy/moneyguy_${frameStr}.png`;\n  }\n\n  if (!src) return null;"
);

fs.writeFileSync(path, code);
