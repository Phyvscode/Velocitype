const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/  noColorChange\?: boolean;\n/g, '');
code = code.replace(/ bgTheme, noColorChange, cia \}/g, ' bgTheme, cia }');

// Remove usage
code = code.replace(/                if \(!noColorChange\) \{\n                  color = typedText\[i\] === char \? 'correct-char' : 'text-red-500 underline exclude-theme';\n                \}\n/g, "                color = typedText[i] === char ? 'correct-char' : 'text-red-500 underline exclude-theme';\n");

// Remove passing noColorChange prop
code = code.replace(/          noColorChange=\{myActiveAbility === 'no_color_change'\}\n/g, '');
code = code.replace(/          noColorChange=\{oppActiveAbility === 'no_color_change'\}\n/g, ''); // Not sure if this exists

fs.writeFileSync(path, code);
