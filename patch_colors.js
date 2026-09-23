const fs = require('fs');

let modeTs = fs.readFileSync('frontend/src/components/RankedMode.tsx', 'utf8');

const oldColorLogic = `                        let color = 'text-slate-500';
                        if (i < typedText.length) {
                          color = typedText[i] === char ? 'correct-char' : 'text-red-500 underline exclude-theme';
                        } else if (i === typedText.length) {
                          color = 'text-slate-100 exclude-theme';
                        }
                        
                        if (!isOpponent && color === 'correct-char') {
                          color = 'text-[var(--hot)]';
                        }

                        let styleObj: any = isOpponent && color === 'correct-char' ? {} : undefined;
                        if (dyslexiaActive && color === 'text-slate-500') {
                          color += ' dyslexia-char';
                        }`;

const newColorLogic = `                        let color = 'text-slate-500';
                        let isUnTyped = false;
                        
                        if (i < typedText.length) {
                          let isCorrect = typedText[i] === char;
                          if (joker1Active) isCorrect = true; // Joker 1 makes all mistakes look correct
                          
                          color = isCorrect ? 'correct-char' : 'text-red-500 bg-red-500/20 exclude-theme';
                        } else if (i === typedText.length) {
                          color = 'text-slate-100 exclude-theme';
                        } else {
                          isUnTyped = true;
                        }
                        
                        if (!isOpponent && color === 'correct-char') {
                          color = 'text-[var(--hot)]';
                        }
                        
                        // Joker 3: Only every 5th letter is colored, the rest are blank/slate
                        if (joker3Active && i < typedText.length && (i + 1) % 5 !== 0) {
                          color = 'text-slate-500';
                        }

                        let styleObj: any = {};
                        if (isUnTyped) {
                           styleObj.color = colorTheme?.subColor || '#64748b'; // user's theme for untyped text
                        }

                        if (dyslexiaActive && isUnTyped) {
                          color += ' dyslexia-char';
                        }`;

modeTs = modeTs.replace(oldColorLogic, newColorLogic);
fs.writeFileSync('frontend/src/components/RankedMode.tsx', modeTs);
