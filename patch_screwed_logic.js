const fs = require('fs');

// 1. Update words.ts
const wordsPath = 'frontend/src/lib/words.ts';
let wordsCode = fs.readFileSync(wordsPath, 'utf8');

wordsCode = wordsCode.replace(
  /export function applyScrewedEffects\(text: string, upgrades: number, mostIncorrectLetter: string \| null\): string \{[\s\S]*?if \(upgrades < 1\) return text;/m,
  `export function applyScrewedEffects(text: string, activeAbilities: { scramble: boolean, sabotage: boolean, spam: boolean }, mostIncorrectLetter: string | null): string {
  if (!activeAbilities.scramble && !activeAbilities.sabotage && !activeAbilities.spam) return text;`
);

wordsCode = wordsCode.replace(/if \(upgrades >= 1 && word.length > 1\)/g, "if (activeAbilities.scramble && word.length > 1)");
wordsCode = wordsCode.replace(/if \(upgrades >= 2 && \(i \+ 1\) % 3 === 0 && mostIncorrectLetter\)/g, "if (activeAbilities.sabotage && (i + 1) % 3 === 0 && mostIncorrectLetter)");
wordsCode = wordsCode.replace(/if \(upgrades >= 3 && \(i \+ 1\) % 10 === 0\)/g, "if (activeAbilities.spam && (i + 1) % 10 === 0)");

fs.writeFileSync(wordsPath, wordsCode);

// 2. Update RankedMode.tsx
const rankedPath = 'frontend/src/components/RankedMode.tsx';
let rankedCode = fs.readFileSync(rankedPath, 'utf8');

rankedCode = rankedCode.replace(
  /newTargetText = applyScrewedEffects\(newTargetText, oppUpgradesRef\.current, myWorstLetterRef\.current\);/g,
  `newTargetText = applyScrewedEffects(newTargetText, {
          scramble: oppUpgradesRef.current >= 1,
          sabotage: oppUpgradesRef.current >= 2,
          spam: oppUpgradesRef.current >= 3
        }, myWorstLetterRef.current);`
);

fs.writeFileSync(rankedPath, rankedCode);

// 3. Update RankedSandbox.tsx
const sandboxPath = 'frontend/src/components/RankedSandbox.tsx';
let sandboxCode = fs.readFileSync(sandboxPath, 'utf8');

sandboxCode = sandboxCode.replace(
  /let myUpgrades = 0;\n      if \(myUpg1\) myUpgrades = 1;\n      if \(myUpg2\) myUpgrades = 2;\n      if \(myUpg3\) myUpgrades = 3;\n      \n      let myText = baseTargetText;\n      if \(myChar === 'screwed' && myUpgrades > 0\) \{\n        myText = applyScrewedEffects\(baseTargetText, myUpgrades, 'e'\) \+ ' ';\n      \}/g,
  `let myText = baseTargetText;
      if (myChar === 'screwed') {
        myText = applyScrewedEffects(baseTargetText, { scramble: myUpg1, sabotage: myUpg2, spam: myUpg3 }, 'e') + ' ';
      }`
);

sandboxCode = sandboxCode.replace(
  /let oppUpgrades = 0;\n      if \(oppUpg1\) oppUpgrades = 1;\n      if \(oppUpg2\) oppUpgrades = 2;\n      if \(oppUpg3\) oppUpgrades = 3;\n\n      let oppText = baseTargetText;\n      if \(oppChar === 'screwed' && oppUpgrades > 0\) \{\n        oppText = applyScrewedEffects\(baseTargetText, oppUpgrades, 'e'\) \+ ' ';\n      \}/g,
  `let oppText = baseTargetText;
      if (oppChar === 'screwed') {
        oppText = applyScrewedEffects(baseTargetText, { scramble: oppUpg1, sabotage: oppUpg2, spam: oppUpg3 }, 'e') + ' ';
      }`
);

fs.writeFileSync(sandboxPath, sandboxCode);
