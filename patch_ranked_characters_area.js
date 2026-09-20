const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Update RankedPlayerAreaProps
code = code.replace(
  "dyslexiaActive?: boolean;\n}",
  "dyslexiaActive?: boolean;\n  characters?: string[];\n}"
);

// 2. Update RankedPlayerArea definition
code = code.replace(
  "function RankedPlayerArea({ label, wpm, progress, targetText, typedText, activeKeys, gameState, isOpponent, colorTheme, fontFamily, bgTheme, cia, charge, dyslexiaActive }: RankedPlayerAreaProps) {",
  "function RankedPlayerArea({ label, wpm, progress, targetText, typedText, activeKeys, gameState, isOpponent, colorTheme, fontFamily, bgTheme, cia, charge, dyslexiaActive, characters = [] }: RankedPlayerAreaProps) {"
);

// 3. Render characters inside RankedPlayerArea (add just above the closing div)
// RankedPlayerArea ends with:
//         <span className="font-mono text-xs text-slate-500">{charge}%</span>
//       </div>
//     </div>
//   );
// }
const areaEndRegex = /        <span className="font-mono text-xs text-slate-500">\{charge\}%<\/span>\n      <\/div>\n    <\/div>\n  \);\n\}/g;
const newAreaEnd = `        <span className="font-mono text-xs text-slate-500">{charge}%</span>
      </div>
      
      {gameState === 'playing' && characters.length > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-10 flex gap-4">
          {characters.map((charId, idx) => (
            <AnimatedCharacter key={idx} id={charId} className="h-48 object-contain" />
          ))}
        </div>
      )}
    </div>
  );
}`;
code = code.replace(areaEndRegex, newAreaEnd);

// 4. Pass selectedCharacters to My side
code = code.replace(
  "charge={myCharge}\n          dyslexiaActive={oppUpgrades >= 2}\n        />",
  "charge={myCharge}\n          dyslexiaActive={oppUpgrades >= 2}\n          characters={selectedCharacters}\n        />"
);

// 5. Pass matchData.opponent.characters to Opponent side
code = code.replace(
  "charge={oppCharge}\n          dyslexiaActive={myUpgrades >= 2}\n        />",
  "charge={oppCharge}\n          dyslexiaActive={myUpgrades >= 2}\n          characters={matchData.opponent.characters}\n        />"
);

// 6. Remove old global characters rendering
const globalCharRegex = /      \{gameState === 'playing' && \(\n        <div className="absolute bottom-0 left-1\/2 -translate-x-1\/2 pointer-events-none z-10 flex gap-4">\n          \{selectedCharacters.map\(\(charId, idx\) => \(\n            <AnimatedCharacter key=\{idx\} id=\{charId\} className="h-48 object-contain" \/>\n          \)\)\}\n        <\/div>\n      \)\}\n/g;
code = code.replace(globalCharRegex, '');

fs.writeFileSync(path, code);
