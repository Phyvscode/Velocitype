const fs = require('fs');
const path = 'frontend/src/components/GameScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace the tailwind class string assignments with explicit CSS variable names for the style attribute
code = code.replace(
`                let cls = 'text-[var(--theme-sub)] exclude-theme';
                if (ci < typed.length) {
                  cls = typed[ci] === ch ? 'text-[var(--theme-text)] theme-text-override' : 'text-[var(--theme-error)] underline exclude-theme';
                } else if (ci === typed.length) {
                  cls = 'text-[var(--theme-main,var(--foreground))] exclude-theme';
                }`,
`                let colorVar = 'var(--theme-sub)';
                let extraCls = 'exclude-theme';
                if (ci < typed.length) {
                  if (typed[ci] === ch) {
                    colorVar = 'var(--theme-text)';
                    extraCls = 'theme-text-override';
                  } else {
                    colorVar = 'var(--theme-error)';
                    extraCls = 'underline exclude-theme';
                  }
                } else if (ci === typed.length) {
                  colorVar = 'var(--theme-text)'; // Changed from --theme-main to --theme-text for active char
                  extraCls = 'exclude-theme';
                }`
);

code = code.replace(
`                    className={\`transition-colors \${cls}\`}`,
`                    className={\`transition-colors \${extraCls}\`}
                    style={{ color: colorVar }}`
);

fs.writeFileSync(path, code);
