const fs = require('fs');
const path = 'frontend/src/components/ResultsScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
`                      isSel
                        ? 'bg-[var(--hot)] text-slate-900'
                        : 'bg-slate-900/50 hover:bg-slate-700/60 text-slate-200'
                    }\`}`,
`                      isSel
                        ? 'bg-[var(--hot)] text-slate-900'
                        : !t.correct 
                          ? 'bg-red-500/10 hover:bg-red-500/20 text-[var(--theme-error,theme(colors.red.400))] border border-red-500/30'
                          : 'bg-slate-900/50 hover:bg-slate-700/60 text-slate-200'
                    }\`}`
);

fs.writeFileSync(path, code);
