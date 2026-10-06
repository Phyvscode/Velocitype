const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/SetupScreen.tsx', 'utf8');

// Disable the row toggles if enableCustom is true
content = content.replace(
  /onClick=\{\(\) => toggleRow\(r\.key\)\}/g,
  `onClick={() => !enableCustom && toggleRow(r.key)}`
);

content = content.replace(
  /className=\{\`w-14 h-7 rounded-full relative transition-all duration-300 flex-shrink-0 bg-slate-800 shadow-\[inset_0_2px_4px_rgba\(0,0,0,0\.3\)\] border border-slate-700\/50\`\}/g,
  `className={\`w-14 h-7 rounded-full relative transition-all duration-300 flex-shrink-0 bg-slate-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] border border-slate-700/50 \${enableCustom ? 'opacity-50 cursor-not-allowed' : ''}\`}`
);

const customOptionsHtml = `
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

// Replace both instances of </section> for the row selection
// It should be the first </section> in the activeMode === 'words' block, and the first in 'random-sentences'
let arr = content.split('</section>');
// We know arr[0] ends with the first section (WordsMode rows). 
arr[0] = arr[0] + customOptionsHtml;
// We know arr[1] has some other sections, let's find the one for random-sentences.
// The string "1. Choose your key rows" appears again in arr... let's just use string replace.
content = arr.join('</section>');

fs.writeFileSync('frontend/src/components/SetupScreen.tsx', content);
