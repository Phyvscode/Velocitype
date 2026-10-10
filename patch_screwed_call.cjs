const fs = require('fs');

function patch(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Find applyScrewedEffects call
  /*
        newTargetText = applyScrewedEffects(newTargetText, {
          scramble: oppUpgradesRef.current >= 1,
          sabotage: oppUpgradesRef.current >= 2,
          spam: oppUpgradesRef.current >= 3
        }, myWorstLetterRef.current);
  */
  // Wait, wait! RankedMode uses `oppUpgradesRef.current`? No, wait, how did Screwed abilities work?
  // Let's check!
  
  fs.writeFileSync(file, content);
}
patch('frontend/src/components/RankedMode.tsx');
