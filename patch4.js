const fs = require('fs');

// Patch GameScreen.tsx
const gsPath = 'frontend/src/components/GameScreen.tsx';
let gsCode = fs.readFileSync(gsPath, 'utf8');

// Fix active char color back to foreground (white)
gsCode = gsCode.replace(
`                } else if (ci === typed.length) {
                  colorVar = 'var(--theme-text)'; // Changed from --theme-main to --theme-text for active char
                  extraCls = 'exclude-theme';
                }`,
`                } else if (ci === typed.length) {
                  colorVar = 'var(--foreground, white)';
                  extraCls = 'exclude-theme';
                }`
);

// Fix caret background (just use bg-[var(--theme-caret)] if tailwind supports it, or inline style)
gsCode = gsCode.replace(
`                className="absolute -translate-y-1/2 w-[3px] h-[1em] rounded-full pointer-events-none transition-all duration-150 ease-out animate-caret exclude-theme"
                style={{
                  left: \`\${caretLeft}px\`,
                  top: \`\${caretTop}px\`,
                  backgroundColor: 'var(--theme-caret, var(--hot, #ff00ff))'
                }}`,
`                className="absolute -translate-y-1/2 w-[3px] h-[1em] bg-[var(--theme-caret)] rounded-full pointer-events-none transition-all duration-150 ease-out animate-caret exclude-theme"
                style={{
                  left: \`\${caretLeft}px\`,
                  top: \`\${caretTop}px\`,
                  backgroundColor: 'var(--theme-caret)'
                }}`
);

fs.writeFileSync(gsPath, gsCode);

// Patch SetupScreen.tsx
const ssPath = 'frontend/src/components/SetupScreen.tsx';
let ssCode = fs.readFileSync(ssPath, 'utf8');

ssCode = ssCode.replace(
`                        {liveTargetSentence.split('').map((char, i) => {
                          let colorClass = 'text-slate-600 exclude-theme';
                          if (i < typedText.length) {
                            colorClass = typedText[i] === char ? 'text-[var(--hot)] theme-text-override' : 'text-rose-400 underline exclude-theme';
                          } else if (i === typedText.length) {
                            colorClass = 'text-slate-100 exclude-theme';
                          }
                          return (
                            <span key={i} className={\`relative \${colorClass}\`}>`,
`                        {liveTargetSentence.split('').map((char, i) => {
                          let colorVar = 'var(--theme-sub, #64748b)';
                          let extraCls = 'exclude-theme';
                          if (i < typedText.length) {
                            if (typedText[i] === char) {
                              colorVar = 'var(--theme-text)';
                              extraCls = 'theme-text-override';
                            } else {
                              colorVar = 'var(--theme-error)';
                              extraCls = 'underline exclude-theme';
                            }
                          } else if (i === typedText.length) {
                            colorVar = 'var(--foreground, white)';
                            extraCls = 'exclude-theme';
                          }
                          return (
                            <span key={i} className={\`relative \${extraCls}\`} style={{ color: colorVar }}>`
);

fs.writeFileSync(ssPath, ssCode);
