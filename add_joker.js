const fs = require('fs');

let modeTs = fs.readFileSync('frontend/src/components/RankedMode.tsx', 'utf8');

// 1. Add joker to characters
modeTs = modeTs.replace(
  /\['mushgirl', 'screwed'\]/g,
  `['mushgirl', 'screwed', 'joker']`
);

// 2. Add Joker abilities to shop UI
const shopFind = `                  { id: 'spam', name: 'Spam', cost: 100 },
                ].map`;
const shopReplace = `                  { id: 'spam', name: 'Spam', cost: 100 },
                  { id: 'joker1', name: 'Delusion', cost: 30 },
                  { id: 'joker2', name: 'Blindness', cost: 60 },
                  { id: 'joker3', name: 'Amnesia', cost: 100 },
                ].map`;
modeTs = modeTs.replace(shopFind, shopReplace);

// 3. Update RankedPlayerAreaProps
modeTs = modeTs.replace(
  /blinkActive\?: boolean;\n  characters\?: string\[\];/,
  `blinkActive?: boolean;\n  joker1Active?: boolean;\n  joker2Active?: boolean;\n  joker3Active?: boolean;\n  characters?: string[];`
);

// 4. Update RankedPlayerArea declaration
modeTs = modeTs.replace(
  /blinkActive, characters = \[\] \}: RankedPlayerAreaProps\) \{/,
  `blinkActive, joker1Active, joker2Active, joker3Active, characters = [] }: RankedPlayerAreaProps) {`
);

// 5. Update RankedPlayerArea usage for ME (Left side)
// Wait, my own area receives debuffs from opponent's upgrades! So oppAbilities.includes('joker1') affects ME!
modeTs = modeTs.replace(
  /blinkActive=\{oppAbilities\.includes\('blinking'\)\}\n          characters=\{selectedCharacters\}\n        \/>/,
  `blinkActive={oppAbilities.includes('blinking')}
          joker1Active={oppAbilities.includes('joker1')}
          joker2Active={oppAbilities.includes('joker2')}
          joker3Active={oppAbilities.includes('joker3')}
          characters={selectedCharacters}
        />`
);

// 6. Update RankedPlayerArea usage for OPPONENT (Right side)
// Opponent's area receives debuffs from MY upgrades! So myAbilities.includes('joker1') affects OPPONENT!
modeTs = modeTs.replace(
  /blinkActive=\{myAbilities\.includes\('blinking'\)\}\n          characters=\{matchData\.opponent\.characters\}\n        \/>/,
  `blinkActive={myAbilities.includes('blinking')}
          joker1Active={myAbilities.includes('joker1')}
          joker2Active={myAbilities.includes('joker2')}
          joker3Active={myAbilities.includes('joker3')}
          characters={matchData.opponent.characters}
        />`
);

// 7. Implement Joker 1, 2, 3 in RankedPlayerArea
// WPM and CIA (Joker 2)
modeTs = modeTs.replace(
  /<span className="font-mono text-sm uppercase tracking-widest" style=\{\{ color: isOpponent \? oppPrimaryHex : 'var\(--hot\)' \}\}>\{wpm\} WPM<\/span>\n          \{!isOpponent && cia && \(/,
  `{(!joker2Active || isOpponent) && <span className="font-mono text-sm uppercase tracking-widest" style={{ color: isOpponent ? oppPrimaryHex : 'var(--hot)' }}>{wpm} WPM</span>}
          {!isOpponent && cia && !joker2Active && (`
);

// Hide Caret (Joker 1)
modeTs = modeTs.replace(
  /className="absolute w-\[2px\] h-\[1\.2em\] bg-cyan-400 z-10 transition-all duration-100 ease-out"/,
  `className={\`absolute w-[2px] h-[1.2em] bg-cyan-400 z-10 transition-all duration-100 ease-out \${joker1Active ? 'opacity-0' : ''}\`}`
);

// Letter Colors (Joker 1 and 3)
// We need to find the mapping of text colors.
// In the letter rendering:
/*
let colorClass = "text-slate-500";
let bgClass = "";
if (i < typedText.length) {
  if (typedText[i] === char) {
    colorClass = isOpponent ? "text-cyan-400" : "text-[var(--hot)]";
  } else {
    colorClass = "text-red-500";
    bgClass = "bg-red-500/20";
  }
}
*/
const oldColorLogic = `let colorClass = "text-slate-500";
                  let bgClass = "";
                  
                  if (i < typedText.length) {
                    if (typedText[i] === char) {
                      colorClass = isOpponent ? "text-cyan-400" : "text-[var(--hot)]";
                    } else {
                      colorClass = "text-red-500";
                      bgClass = "bg-red-500/20";
                    }
                  }`;

const newColorLogic = `let colorClass = "text-slate-500";
                  let bgClass = "";
                  
                  if (i < typedText.length) {
                    let isCorrect = typedText[i] === char;
                    if (joker1Active) isCorrect = true; // Joker 1 makes all mistakes look correct
                    
                    if (isCorrect) {
                      colorClass = isOpponent ? "text-cyan-400" : "text-[var(--hot)]";
                    } else {
                      colorClass = "text-red-500";
                      bgClass = "bg-red-500/20";
                    }
                  }
                  
                  // Joker 3: Every 5th letter shows color (i.e. indices where (i + 1) % 5 === 0)
                  // The others are uncolored (text-slate-500)
                  if (joker3Active && i < typedText.length && (i + 1) % 5 !== 0) {
                    colorClass = "text-slate-500";
                    bgClass = "";
                  }`;

modeTs = modeTs.replace(oldColorLogic, newColorLogic);

// Hide Clock (Joker 3)
// Wait, the clock is in RankedMode top bar:
// <div className="font-mono text-2xl tracking-widest text-emerald-400">
//  {formatTime(timeLeft)}
// </div>
modeTs = modeTs.replace(
  /<div className="font-mono text-2xl tracking-widest text-emerald-400">\n            \{formatTime\(timeLeft\)\}\n          <\/div>/,
  `{oppAbilities.includes('joker3') ? (
            <div className="font-mono text-xl tracking-widest text-slate-600 uppercase">???</div>
          ) : (
            <div className="font-mono text-2xl tracking-widest text-emerald-400">
              {formatTime(timeLeft)}
            </div>
          )}`
);

// Wait, the grid cols in shop might need to be larger?
modeTs = modeTs.replace(/grid-cols-2 gap-4/, `grid-cols-3 gap-3`);

fs.writeFileSync('frontend/src/components/RankedMode.tsx', modeTs);

