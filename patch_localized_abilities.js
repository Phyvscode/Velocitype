const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Remove trip-body from root div
code = code.replace(
  /\${oppUpgrades >= 1 \? 'trip-body tripping' : ''} \${oppUpgrades >= 3 \? 'view-blink blinking' : ''}/g,
  ""
);

// 2. Remove global trip-layer
code = code.replace(
  /      \{oppUpgrades >= 1 && \(\n        <div className="trip-layer">\n          <div className="trip-hue"><\/div>\n          <div className="blobs"><\/div>\n        <\/div>\n      \)\}\n/g,
  ""
);

// 3. Update RankedPlayerAreaProps
code = code.replace(
  "dyslexiaActive?: boolean;\n  characters?: string[];\n}",
  "dyslexiaActive?: boolean;\n  tripActive?: boolean;\n  blinkActive?: boolean;\n  characters?: string[];\n}"
);

// 4. Update RankedPlayerArea definition
code = code.replace(
  "function RankedPlayerArea({ label, wpm, progress, targetText, typedText, activeKeys, gameState, isOpponent, colorTheme, fontFamily, bgTheme, cia, charge, dyslexiaActive, characters = [] }: RankedPlayerAreaProps) {",
  "function RankedPlayerArea({ label, wpm, progress, targetText, typedText, activeKeys, gameState, isOpponent, colorTheme, fontFamily, bgTheme, cia, charge, dyslexiaActive, tripActive, blinkActive, characters = [] }: RankedPlayerAreaProps) {"
);

// 5. Apply trip classes to RankedPlayerArea root wrapper
// It currently starts with:
//   return (
//     <div id={isOpponent ? "opponent-area" : undefined} className={`flex-1 p-4 md:p-8 flex flex-col relative ${isOpponent ? 'bg-slate-900/40' : ''}`}>
code = code.replace(
  /<div id=\{isOpponent \? "opponent-area" : undefined\} className=\{\`flex-1 p-4 md:p-8 flex flex-col relative \$\{isOpponent \? 'bg-slate-900\/40' : ''\}\`\}>/g,
  `<div id={isOpponent ? "opponent-area" : undefined} className={\`flex-1 p-4 md:p-8 flex flex-col relative \${isOpponent ? 'bg-slate-900/40' : ''} \${tripActive ? 'trip-body tripping' : ''} \${blinkActive ? 'view-blink blinking' : ''}\`}>
      {tripActive && (
        <div className="trip-layer">
          <div className="trip-hue"></div>
          <div className="blobs"></div>
        </div>
      )}`
);

// 6. Pass props to My Area
code = code.replace(
  "dyslexiaActive={oppUpgrades >= 2}\n          characters={selectedCharacters}\n        />",
  "dyslexiaActive={oppUpgrades >= 2}\n          tripActive={oppUpgrades >= 1}\n          blinkActive={oppUpgrades >= 3}\n          characters={selectedCharacters}\n        />"
);

// 7. Pass props to Opponent Area
code = code.replace(
  "dyslexiaActive={myUpgrades >= 2}\n          characters={matchData.opponent.characters}\n        />",
  "dyslexiaActive={myUpgrades >= 2}\n          tripActive={myUpgrades >= 1}\n          blinkActive={myUpgrades >= 3}\n          characters={matchData.opponent.characters}\n        />"
);

fs.writeFileSync(path, code);
