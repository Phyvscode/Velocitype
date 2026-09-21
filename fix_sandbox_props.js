const fs = require('fs');
const path = 'frontend/src/components/RankedSandbox.tsx';
let code = fs.readFileSync(path, 'utf8');

// Remove ColorTheme and getLayoutConfig imports
code = code.replace("import { ColorTheme } from '@/lib/colors';", "");
code = code.replace("import { getLayoutConfig } from '@/lib/layoutConfig';", "");

// Remove activeColorTheme logic
code = code.replace(
  /const config = getLayoutConfig\(\);[\s\S]*?isGradient: false\n  \} : undefined;/m,
  ""
);

// Update colorTheme prop
code = code.replace(
  "colorTheme={activeColorTheme}",
  "colorTheme={undefined}"
);

fs.writeFileSync(path, code);
