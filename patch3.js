const fs = require('fs');
const path = 'frontend/src/components/GameScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
`                className="absolute -translate-y-1/2 w-[3px] h-[1em] bg-[var(--theme-caret)] rounded-full pointer-events-none transition-all duration-150 ease-out animate-caret exclude-theme"
                style={{
                  left: \`\${caretLeft}px\`,
                  top: \`\${caretTop}px\`,
                }}`,
`                className="absolute -translate-y-1/2 w-[3px] h-[1em] rounded-full pointer-events-none transition-all duration-150 ease-out animate-caret exclude-theme"
                style={{
                  left: \`\${caretLeft}px\`,
                  top: \`\${caretTop}px\`,
                  backgroundColor: 'var(--theme-caret, var(--hot, #ff00ff))'
                }}`
);

fs.writeFileSync(path, code);
