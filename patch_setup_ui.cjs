const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/SetupScreen.tsx', 'utf8');

// Find the section for key rows
const rowsHtmlRegex = /<h2 className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-4">1\. Choose your key rows<\/h2>[\s\S]*?<div className="flex flex-col gap-3">/;

const newUiHtml = `<h2 className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-4">1. Choose your key rows</h2>
                    <div className="flex flex-col gap-6 w-full">
                      <div className="flex flex-wrap gap-4 w-full">
                        {[
                          { key: 'top', label: 'Top Row' },
                          { key: 'home', label: 'Home Row' },
                          { key: 'bottom', label: 'Bottom Row' }
                        ].map(r => {
                          const active = rows.includes(r.key as RowKey);
                          return (
                            <button
                              key={r.key}
                              disabled={enableCustom}
                              onClick={() => setRows(prev =>
                                prev.includes(r.key as RowKey)
                                  ? prev.filter(x => x !== r.key)
                                  : [...prev, r.key as RowKey]
                              )}
                              className={\`px-6 py-2 rounded border border-slate-700 transition-all font-mono tracking-widest \${active ? 'bg-slate-700 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-slate-800 text-slate-400 hover:border-slate-500'} \${enableCustom ? 'opacity-50 cursor-not-allowed' : ''}\`}
                            >
                              {r.label}
                            </button>
                          );
                        })}
                      </div>
                      
                      <div className="flex flex-col gap-3 border border-slate-700 p-4 rounded bg-slate-800/50">
                        <label className="flex items-center gap-2 cursor-pointer font-mono text-sm tracking-widest">
                          <input 
                            type="checkbox" 
                            checked={enableCustom} 
                            onChange={e => {
                              setEnableCustom(e.target.checked);
                              if (e.target.checked) setRows([]);
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-white">Custom Letters</span>
                        </label>
                        {enableCustom && (
                          <input
                            type="text"
                            placeholder="e.g. h t a d a f c a c"
                            value={customLetters}
                            onChange={e => setCustomLetters(e.target.value)}
                            className="bg-background border border-slate-700 p-2 rounded text-white font-mono text-sm focus:outline-none focus:border-[var(--hot)]"
                          />
                        )}
                      </div>

                      <div className="flex flex-col gap-3 border border-slate-700 p-4 rounded bg-slate-800/50">
                        <label className="flex items-center gap-2 cursor-pointer font-mono text-sm tracking-widest">
                          <input 
                            type="checkbox" 
                            checked={enableExtra} 
                            onChange={e => setEnableExtra(e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span className="text-white">Extra (Affixes)</span>
                        </label>
                        {enableExtra && (
                          <div className="flex flex-col gap-2">
                            <input
                              type="text"
                              placeholder="Initial (e.g. pre)"
                              value={extraInitial}
                              onChange={e => setExtraInitial(e.target.value)}
                              className="bg-background border border-slate-700 p-2 rounded text-white font-mono text-sm focus:outline-none focus:border-[var(--hot)]"
                            />
                            <input
                              type="text"
                              placeholder="Middle (e.g. ing)"
                              value={extraMiddle}
                              onChange={e => setExtraMiddle(e.target.value)}
                              className="bg-background border border-slate-700 p-2 rounded text-white font-mono text-sm focus:outline-none focus:border-[var(--hot)]"
                            />
                            <input
                              type="text"
                              placeholder="Final (e.g. tion)"
                              value={extraFinal}
                              onChange={e => setExtraFinal(e.target.value)}
                              className="bg-background border border-slate-700 p-2 rounded text-white font-mono text-sm focus:outline-none focus:border-[var(--hot)]"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">`;

// We have TWO places where "1. Choose your key rows" appears: one for words, one for random-sentences!
content = content.replace(rowsHtmlRegex, newUiHtml);
content = content.replace(rowsHtmlRegex, newUiHtml);

fs.writeFileSync('frontend/src/components/SetupScreen.tsx', content);
