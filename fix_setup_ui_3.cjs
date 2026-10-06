const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/SetupScreen.tsx', 'utf8');

const injection = `
                  <section className="shrink-0 mt-8">
                    <div className="flex flex-col md:flex-row gap-8 w-full border border-slate-800 rounded p-6 bg-slate-900/50">
                      
                      <div className="flex-1 flex flex-col gap-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={enableCustom} 
                            onChange={e => {
                              setEnableCustom(e.target.checked);
                              if (e.target.checked) setRows([]);
                            }}
                            className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-[var(--hot)] focus:ring-[var(--hot)] focus:ring-offset-slate-900"
                          />
                          <span className="text-sm font-mono tracking-widest text-slate-300 group-hover:text-white transition-colors">CUSTOM LETTERS</span>
                        </label>
                        <div className={\`transition-all duration-300 \${enableCustom ? 'opacity-100' : 'opacity-30 pointer-events-none'}\`}>
                          <input
                            type="text"
                            placeholder="e.g. h t a d a f c a c"
                            value={customLetters}
                            onChange={e => setCustomLetters(e.target.value)}
                            disabled={!enableCustom}
                            className="w-full bg-slate-800 border border-slate-700 p-3 rounded text-white font-mono text-sm focus:outline-none focus:border-[var(--hot)] transition-colors"
                          />
                          <p className="text-[10px] text-slate-500 font-mono tracking-widest mt-2 uppercase">Type letters separated by spaces. Disables row selection.</p>
                        </div>
                      </div>

                      <div className="w-px bg-slate-800 hidden md:block"></div>

                      <div className="flex-1 flex flex-col gap-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={enableExtra} 
                            onChange={e => setEnableExtra(e.target.checked)}
                            className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-[var(--hot)] focus:ring-[var(--hot)] focus:ring-offset-slate-900"
                          />
                          <span className="text-sm font-mono tracking-widest text-slate-300 group-hover:text-white transition-colors">EXTRA AFFIXES</span>
                        </label>
                        <div className={\`flex gap-2 transition-all duration-300 \${enableExtra ? 'opacity-100' : 'opacity-30 pointer-events-none'}\`}>
                          <input
                            type="text"
                            placeholder="Initial (e.g. un)"
                            value={extraInitial}
                            onChange={e => setExtraInitial(e.target.value)}
                            disabled={!enableExtra}
                            className="w-1/3 min-w-0 bg-slate-800 border border-slate-700 p-3 rounded text-white font-mono text-sm focus:outline-none focus:border-[var(--hot)] transition-colors"
                          />
                          <input
                            type="text"
                            placeholder="Middle (e.g. ly)"
                            value={extraMiddle}
                            onChange={e => setExtraMiddle(e.target.value)}
                            disabled={!enableExtra}
                            className="w-1/3 min-w-0 bg-slate-800 border border-slate-700 p-3 rounded text-white font-mono text-sm focus:outline-none focus:border-[var(--hot)] transition-colors"
                          />
                          <input
                            type="text"
                            placeholder="Final (e.g. ing)"
                            value={extraFinal}
                            onChange={e => setExtraFinal(e.target.value)}
                            disabled={!enableExtra}
                            className="w-1/3 min-w-0 bg-slate-800 border border-slate-700 p-3 rounded text-white font-mono text-sm focus:outline-none focus:border-[var(--hot)] transition-colors"
                          />
                        </div>
                        <p className={\`text-[10px] text-slate-500 font-mono tracking-widest uppercase transition-opacity \${enableExtra ? 'opacity-100' : 'opacity-30'}\`}>Forces words to match these patterns.</p>
                      </div>
                    </div>
                  </section>`;

// Replace after ROW_LABELS mapping in both words mode and sentence mode
content = content.replace(
  /                      \}\)\}\n                    <\/div>\n                  <\/section>\n                <\/div>/g,
  `                      })}\n                    </div>\n                  </section>\n${injection}\n                </div>`
);

// We need to re-disable the row toggles if custom is enabled (specifically those buttons, not all buttons)
// We didn't actually do this correctly before because the regex didn't match.
// The button is:
// <button
//   onClick={() => toggleRow(r.key)}
//   className={`w-14 h-7 rounded-full relative transition-all duration-300 flex-shrink-0 bg-slate-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] border border-slate-700/50`}
// >
// Or if it was partially modified:
content = content.replace(
  /onClick=\{\(\) => toggleRow\(r\.key\)\}\n                              className=\{\`w-14 h-7/g,
  `onClick={() => !enableCustom && toggleRow(r.key)}\n                              className={\`w-14 h-7\${enableCustom ? ' opacity-50 cursor-not-allowed' : ''} `
);

// And catch the one we modified to `!enableCustom && toggleRow` but missed the class
content = content.replace(
  /onClick=\{\(\) => !enableCustom && toggleRow\(r\.key\)\}\n                              className=\{\`w-14 h-7 rounded-full/g,
  `onClick={() => !enableCustom && toggleRow(r.key)}\n                              className={\`w-14 h-7\${enableCustom ? ' opacity-50 cursor-not-allowed' : ''} rounded-full`
);

fs.writeFileSync('frontend/src/components/SetupScreen.tsx', content);
