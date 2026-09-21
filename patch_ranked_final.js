const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add WarpFilter component
const warpFilterCode = `
const WarpFilter = React.memo(({ id }: { id: string }) => (
  <svg width="0" height="0" style={{position: 'absolute'}} aria-hidden="true" focusable="false">
    <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.006 0.010" numOctaves="2" seed="3" result="noise">
        <animate attributeName="baseFrequency" dur="12s" repeatCount="indefinite" values="0.006 0.010; 0.012 0.006; 0.006 0.010"/>
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </svg>
));
`;
// Insert before RankedPlayerArea
code = code.replace(
  'function RankedPlayerArea(',
  `${warpFilterCode}\nfunction RankedPlayerArea(`
);

// 2. Replace the inline SVG with <WarpFilter id={warpId} />
code = code.replace(
  /<svg width="0" height="0" style=\{\{position: 'absolute'\}\} aria-hidden="true" focusable="false">[\s\S]*?<\/svg>/,
  '<WarpFilter id={warpId} />'
);

// 3. Fix word wrapping by wrapping words in inline-block
const oldMapping = `              {targetText.split('').map((char, i) => {
                let color = 'text-slate-500';
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
                }

                return (
                  <span 
                    key={i} 
                    ref={el => letterRefs.current[i] = el}
                    className={\`\${color}\`}
                    style={styleObj}
                  >
                    {char}
                  </span>
                );
              })}`;

const newMapping = `              {(() => {
                const words = targetText.split(' ');
                let charIndex = 0;
                return words.map((word, wIdx) => {
                  const charsAndSpace = wIdx < words.length - 1 ? word.split('').concat([' ']) : word.split('');
                  return (
                    <span key={wIdx} className="inline-block whitespace-nowrap">
                      {charsAndSpace.map((char, cIdx) => {
                        const i = charIndex++;
                        let color = 'text-slate-500';
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
                        }

                        return (
                          <span 
                            key={i} 
                            ref={el => letterRefs.current[i] = el}
                            className={\`\${color}\`}
                            style={styleObj}
                          >
                            {char}
                          </span>
                        );
                      })}
                    </span>
                  );
                });
              })()}`;

code = code.replace(oldMapping, newMapping);

fs.writeFileSync(path, code);
