const fs = require('fs');
const path = 'frontend/src/components/RankedSandbox.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "import { generateSentences } from '../lib/dictionary';",
  "import { generateSentences } from '@/lib/dictionary';"
);

code = code.replace(
  "import { ColorTheme, getLayoutConfig } from '../lib/colors';",
  "import { ColorTheme } from '@/lib/colors';\nimport { getLayoutConfig } from '@/lib/layoutConfig';"
);

code = code.replace(
  "activeKeys={Array.from(activeKeys)}",
  "activeKeys={activeKeys}"
);

fs.writeFileSync(path, code);
