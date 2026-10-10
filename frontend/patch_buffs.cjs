const fs = require('fs');
const path = 'src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

// Mushgirl & Joker Buffs in RankedPlayerAreaProps
// We just need to check if the buffed version is in the abilities array.
// Wait, the opponent abilities are received via socket 'rankedOpponentUpgrades' as an array of strings.
// Let's pass the raw array to RankedPlayerArea and handle it there, OR pass new booleans.
// We already pass `joker1Active={oppAbilities.includes('joker1')}` etc.
// Let's change it to check for buffed as well, and pass buffed state.

// Actually, in `RankedPlayerAreaProps` we have:
// dyslexiaActive?: boolean;
// tripActive?: boolean;
// blinkActive?: boolean;
// joker1Active?: boolean;
// joker2Active?: boolean;
// joker3Active?: boolean;
// Let's just add `buffedAbilities?: string[];` to RankedPlayerAreaProps
code = code.replace(
  "goldenLetters?: Set<number>;",
  "goldenLetters?: Set<number>;\n  buffedAbilities?: string[];"
);

code = code.replace(
  "export function RankedPlayerArea({ label, wpm, progress, targetText, typedText, activeKeys, gameState, isOpponent, colorTheme, fontFamily, bgTheme, cia, charge, dyslexiaActive, tripActive, blinkActive, joker1Active, joker2Active, joker3Active, characters = [], goldenLetters = new Set(), fullTheme }: RankedPlayerAreaProps) {",
  "export function RankedPlayerArea({ label, wpm, progress, targetText, typedText, activeKeys, gameState, isOpponent, colorTheme, fontFamily, bgTheme, cia, charge, dyslexiaActive, tripActive, blinkActive, joker1Active, joker2Active, joker3Active, characters = [], goldenLetters = new Set(), fullTheme, buffedAbilities = [] }: RankedPlayerAreaProps) {"
);

// Mushgirl buffs:
// shrooms_buffed -> double trip level. tripLevel goes 1 -> 5 based on progress?
code = code.replace(
  "setTripLevel(Math.min(5, Math.floor(progress / 20)));",
  "setTripLevel(Math.min(10, Math.floor(progress / (buffedAbilities.includes('shrooms') ? 10 : 20))));"
);

// dyslexia_buffed -> faster interval?
code = code.replace(
  "if (!dyslexiaActive) return;",
  "if (!dyslexiaActive) return;\n    const intervalMs = buffedAbilities.includes('dyslexia') ? 1500 : 3000;"
);
code = code.replace(
  "setInterval(() => {",
  "setInterval(() => {"
);
code = code.replace(
  "}, 3000);",
  "}, intervalMs);"
);

// blinking_buffed -> faster blink
code = code.replace(
  "if (!blinkActive) {",
  "const blinkInterval = buffedAbilities.includes('blinking') ? 2000 : 5000;\n    if (!blinkActive) {"
);
code = code.replace(
  "}, 5000); // Wait enough time",
  "}, blinkInterval); // Wait enough time"
);

// Joker buffs:
// joker2_buffed -> Blindness opacity 0 instead of 0.2
code = code.replace(
  "const oppPrimaryHex = isOpponent && colorTheme",
  "const isBlindBuffed = buffedAbilities.includes('joker2');\n  const oppPrimaryHex = isOpponent && colorTheme"
);
code = code.replace(
  "opacity: joker2Active ? (isOpponent ? 0.2 : 0.2) : 1",
  "opacity: joker2Active ? (isBlindBuffed ? 0 : 0.2) : 1"
);

// joker3_buffed -> Amnesia hides every 3rd letter instead of 5th
code = code.replace(
  "if (joker3Active && i < typedText.length && (i + 1) % 5 !== 0) {",
  "if (joker3Active && i < typedText.length && (i + 1) % (buffedAbilities.includes('joker3') ? 3 : 5) !== 0) {"
);


// In RankedMode component, pass buffedAbilities to both PlayerAreas
// For the opponent:
code = code.replace(
  "joker3Active={oppAbilities.includes('joker3')}",
  "joker3Active={oppAbilities.includes('joker3') || oppAbilities.includes('joker3_buffed')}\n          buffedAbilities={oppAbilities.filter(a => a.endsWith('_buffed')).map(a => a.replace('_buffed', ''))}"
);
code = code.replace(
  "joker2Active={oppAbilities.includes('joker2')}",
  "joker2Active={oppAbilities.includes('joker2') || oppAbilities.includes('joker2_buffed')}"
);
code = code.replace(
  "joker1Active={oppAbilities.includes('joker1')}",
  "joker1Active={oppAbilities.includes('joker1') || oppAbilities.includes('joker1_buffed')}"
);
code = code.replace(
  "dyslexiaActive={oppAbilities.includes('dyslexia')}",
  "dyslexiaActive={oppAbilities.includes('dyslexia') || oppAbilities.includes('dyslexia_buffed')}"
);
code = code.replace(
  "tripActive={oppAbilities.includes('shrooms')}",
  "tripActive={oppAbilities.includes('shrooms') || oppAbilities.includes('shrooms_buffed')}"
);
code = code.replace(
  "blinkActive={oppAbilities.includes('blinking')}",
  "blinkActive={oppAbilities.includes('blinking') || oppAbilities.includes('blinking_buffed')}"
);

// For myself (I also get effects if I have them? wait, opponent applies to me)
// The right side is me? No, right side is opponent. Wait! 
// Left side is me. My area gets effects based on OPPONENT's abilities.
// Let's check: 
// The first RankedPlayerArea is label="My Area", dyslexiaActive={oppAbilities.includes('dyslexia')}.
// This is correct.
// The second RankedPlayerArea is label="Opponent Area", dyslexiaActive={myUpgrades >= 2}. Wait, it uses myUpgrades? 
// The prompt says: "dyslexiaActive={myUpgrades >= 2}". This is old logic!
// Let's fix the second player area to use myAbilities!
code = code.replace(
  "dyslexiaActive={myUpgrades >= 2}",
  "dyslexiaActive={myAbilities.includes('dyslexia') || myBuffedAbilities.includes('dyslexia')}"
);
code = code.replace(
  "tripActive={myUpgrades >= 1}",
  "tripActive={myAbilities.includes('shrooms') || myBuffedAbilities.includes('shrooms')}"
);
code = code.replace(
  "blinkActive={myUpgrades >= 3}",
  "blinkActive={myAbilities.includes('blinking') || myBuffedAbilities.includes('blinking')}\n          buffedAbilities={myBuffedAbilities}"
);

// Ensure joker is applied to opponent based on my abilities
code = code.replace(
  "bgTheme={matchData.opponent.bgTheme}",
  "bgTheme={matchData.opponent.bgTheme}\n          joker1Active={myAbilities.includes('joker1') || myBuffedAbilities.includes('joker1')}\n          joker2Active={myAbilities.includes('joker2') || myBuffedAbilities.includes('joker2')}\n          joker3Active={myAbilities.includes('joker3') || myBuffedAbilities.includes('joker3')}"
);

fs.writeFileSync(path, code);
console.log("Buffs patched.");
