const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/SetupScreen.tsx', 'utf8');

// 1. Remove the customOptionsHtml that got mistakenly placed inside renderDurationSelector
const customOptionsStart = `                    <div className="mt-8 flex flex-col md:flex-row gap-8 w-full border border-slate-800 rounded p-6 bg-slate-900/50">`;
const customOptionsEnd = `Forces words to match these patterns.</p>\n                      </div>\n\n                    </div>\n                  </section>`;

const startIdx = content.indexOf(customOptionsStart);
const firstSectionIdx = content.indexOf('</section>', startIdx);
// actually it's easier to use a regex to match the block
const blockRegex = /<div className="mt-8 flex flex-col md:flex-row gap-8 w-full border border-slate-800 rounded p-6 bg-slate-900\/50">[\s\S]*?Forces words to match these patterns\.<\/p>\s*<\/div>\s*<\/div>\s*<\/section>/g;

content = content.replace(blockRegex, '</section>');

// Now we removed it from renderDurationSelector, and any other places.
// We need to carefully inject it below the rows selector map.
// The rows selector map is followed by `</div>\n                  </section>`.
// So we can find:
// <h2 className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-4">1. Choose your key rows</h2>
// ...
// </div>
// </section>

// Wait, the row toggle button also got the disabled class:
content = content.replace(
  /onClick=\{\(\) => !enableCustom && toggleRow\(r\.key\)\}/g,
  `onClick={() => !enableCustom && toggleRow(r.key)}` // this is fine for row toggles
);

// We need to fix the limitToggle button which we accidentally added enableCustom to.
// The limitToggle button is inside setLimitMode ? ...
content = content.replace(
  /className=\{\`w-14 h-7 rounded-full relative transition-all duration-300 flex-shrink-0 bg-slate-800 shadow-\[inset_0_2px_4px_rgba\(0,0,0,0\.3\)\] border border-slate-700\/50 \$\{enableCustom \? 'opacity-50 cursor-not-allowed' : ''\}\`\}/g,
  `className={\`w-14 h-7 rounded-full relative transition-all duration-300 flex-shrink-0 bg-slate-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] border border-slate-700/50\`}`
);

// But wait! We DO want enableCustom to disable the row toggles!
// Let's manually add the disable logic ONLY to the row toggles.
// Let's find the row toggles:
// onClick={() => !enableCustom && toggleRow(r.key)}
// className={`w-14 h-7 ...`}
// We can just rely on the onClick we already patched.

// Now inject the UI properly.
// The row selector section is:
/*
                  <section className="shrink-0">
                    <h2 className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-4">1. Choose your key rows</h2>
                    <div className="grid sm:grid-cols-3 gap-4">
                      {ROW_LABELS.map((r) => {
...
                      })}
                    </div>
                  </section>
*/
const injection = `
                  <section className="shrink-0">
                    <div className="mt-8 flex flex-col md:flex-row gap-8 w-full border border-slate-800 rounded p-6 bg-slate-900/50">
                      
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
// We need to find:
//                      })}
//                    </div>
//                  </section>
// And append our new section.
content = content.replace(
  /                        \}\)\}\n                    <\/div>\n                  <\/section>/g,
  `                        })}\n                    </div>\n                  </section>\n${injection}`
);

// Re-disable the row toggles if custom is enabled (specifically those buttons, not all buttons)
// The row buttons look like this:
// <button
//   onClick={() => !enableCustom && toggleRow(r.key)}
//   className={`w-14 h-7 rounded-full relative transition-all duration-300 flex-shrink-0 bg-slate-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] border border-slate-700/50`}
// >
// We can use a regex to match ONLY the ones that have toggleRow(r.key)
content = content.replace(
  /onClick=\{\(\) => !enableCustom && toggleRow\(r\.key\)\}\n                              className=\{\`w-14 h-7/g,
  `onClick={() => !enableCustom && toggleRow(r.key)}\n                              className={\`w-14 h-7\${enableCustom ? ' opacity-50 cursor-not-allowed' : ''} `
);

fs.writeFileSync('frontend/src/components/SetupScreen.tsx', content);
