const fs = require('fs');

function patchFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');

  // Add goldenLetters to props
  content = content.replace(
    /  characters\?: string\[\];\n\}/,
    `  characters?: string[];\n  goldenLetters?: Set<number>;\n}`
  );

  content = content.replace(
    /characters = \[\]/,
    `characters = [], goldenLetters = new Set()`
  );

  // Apply golden style in the render loop.
  // We need to find where color is set for the letters.
  /*
                        if (i < typedText.length) {
                          let isCorrect = typedText[i] === char;
                          if (joker1Active) isCorrect = true; // Joker 1 makes all mistakes look correct
                          
                          color = isCorrect ? 'correct-char' : 'text-red-500 bg-red-500/20 exclude-theme';
                        } else if (i === typedText.length) {
                          color = 'text-slate-100 exclude-theme';
                        } else {
                          color = 'text-slate-500';
                        }
  */
  
  content = content.replace(
    /color = 'text-slate-500';\n                        let isUnTyped = false;/,
    `color = 'text-slate-500';
                        let isUnTyped = false;
                        if (goldenLetters.has(i) && !isOpponent) color = 'text-yellow-400 font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.6)] exclude-theme';`
  );

  // In the RankedPlayerArea component, pass the prop down
  // Find <RankedPlayerArea ... /> for the player
  // Actually, we can just replace `characters={selectedCharacters}` with `characters={selectedCharacters} goldenLetters={goldenLettersRef?.current}`
  // But wait, RankedPlayerArea is in both RankedMode.tsx and RankedSandbox.tsx, or is it?
  
  fs.writeFileSync(filepath, content);
}

patchFile('frontend/src/components/RankedMode.tsx');
// RankedSandbox uses its own copy of RankedPlayerArea!
patchFile('frontend/src/components/RankedSandbox.tsx');
