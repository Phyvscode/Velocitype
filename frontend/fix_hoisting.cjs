const fs = require('fs');
let file = fs.readFileSync('src/components/RankedMode.tsx', 'utf8');

// The WPM useEffect block
const wpmEffect = `  useEffect(() => {
    if (gameState !== 'playing' || !startTime) return;
    const interval = setInterval(() => {
      const timeElapsed = (Date.now() - startTime) / 60000;
      if (timeElapsed > 0) {
        let correctCount = 0;
        for (let i = 0; i < typedText.length; i++) {
          if (typedText[i] === (myTargetText[i] || oppTargetText[i])) { // Roughly correct
            correctCount++;
          }
        }
        const wpm = Math.round((correctCount / 5) / timeElapsed);
        setMyWpm(wpm);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, startTime, typedText, myTargetText, oppTargetText]);`;

// Remove the effect from its current position
file = file.replace(wpmEffect, '');

// Find a good place to put it: after all useState declarations
// Let's put it right before `// Opponent typing state`
file = file.replace(
  /  \/\/ Opponent typing state/,
  wpmEffect + '\n\n  // Opponent typing state'
);

fs.writeFileSync('src/components/RankedMode.tsx', file);
