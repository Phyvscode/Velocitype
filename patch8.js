const fs = require('fs');
const path = 'frontend/src/components/ResultsScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
`                        : !t.correct 
                          ? 'bg-red-500/10 hover:bg-red-500/20 text-[var(--theme-error,#ef4444)] border border-red-500/30'
                          : 'bg-slate-900/50 hover:bg-slate-700/60 text-slate-200'`,
`                        : !t.correct 
                          ? 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30'
                          : 'bg-slate-900/50 hover:bg-slate-700/60 text-slate-200'`
);

code = code.replace(
`                  <button
                    key={i}
                    onClick={() => handleSelect(w)}
                    className={\`px-3 py-1.5 font-mono text-sm transition-all flex items-center gap-1.5 \${`,
`                  <button
                    key={i}
                    onClick={() => handleSelect(w)}
                    style={!isSel && !t.correct ? { color: 'var(--theme-error, #ef4444)' } : undefined}
                    className={\`px-3 py-1.5 font-mono text-sm transition-all flex items-center gap-1.5 \${`
);

fs.writeFileSync(path, code);
