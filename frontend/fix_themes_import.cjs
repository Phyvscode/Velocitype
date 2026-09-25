const fs = require('fs');
let colors = fs.readFileSync('src/lib/colors.ts', 'utf8');
colors = colors.replace(
  /import\('\.\/themes'\)\.then\(\(\{\s*THEMES\s*\}\) => \{/,
  `const { THEMES } = require('./themes');\n    if (true) {`
);
// Actually it's better to just statically import it at the top
colors = `import { THEMES } from './themes';\n` + colors;
colors = colors.replace(
  /import\('\.\/themes'\)\.then\(\(\{\s*THEMES\s*\}\) => \{([\s\S]*?)\}\);/m,
  `$1`
);
fs.writeFileSync('src/lib/colors.ts', colors);
