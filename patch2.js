const fs = require('fs');
const path = 'frontend/src/components/SetupScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
`                            let colorClass = 'text-slate-500 exclude-theme';
                            if (i < typedText.length) {
                              colorClass = typedText[i] === char ? 'text-[var(--hot)] theme-text-override' : 'text-rose-400 underline exclude-theme';
                            } else if (i === typedText.length) {
                              colorClass = 'text-white exclude-theme';
                            }`,
`                            let colorVar = 'var(--theme-sub, #64748b)';
                            let extraCls = 'exclude-theme';
                            if (i < typedText.length) {
                              if (typedText[i] === char) {
                                colorVar = 'var(--hot)';
                                extraCls = 'theme-text-override';
                              } else {
                                colorVar = 'var(--theme-error, #fb7185)';
                                extraCls = 'underline exclude-theme';
                              }
                            } else if (i === typedText.length) {
                              colorVar = 'var(--foreground, white)';
                              extraCls = 'exclude-theme';
                            }`
);

code = code.replace(
`                              <span key={i} className={\`\${colorClass} transition-colors\`}>{char}</span>`,
`                              <span key={i} className={\`\${extraCls} transition-colors\`} style={{ color: colorVar }}>{char}</span>`
);

fs.writeFileSync(path, code);
