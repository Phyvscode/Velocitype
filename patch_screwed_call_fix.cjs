const fs = require('fs');

function patch(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Fix RankedMode
  const oldCall = `        newTargetText = applyScrewedEffects(newTargetText, {
          scramble: oppUpgradesRef.current >= 1,
          sabotage: oppUpgradesRef.current >= 2,
          spam: oppUpgradesRef.current >= 3
        }, myWorstLetterRef.current);`;
        
  const newCall = `        newTargetText = applyScrewedEffects(newTargetText, oppAbilitiesRef.current, myWorstLetterRef.current);`;
  
  if (content.includes(oldCall)) {
    content = content.replace(oldCall, newCall);
  } else {
    // maybe formatted differently
    content = content.replace(
      /newTargetText = applyScrewedEffects\(newTargetText,\s*\{[\s\S]*?\}, myWorstLetterRef\.current\);/,
      newCall
    );
  }
  
  // also fix the condition `if (matchDataRef.current?.opponent.characters?.includes("screwed") && oppUpgradesRef.current >= 1)`
  // it should just be `if (matchDataRef.current?.opponent.characters?.includes("screwed"))`
  content = content.replace(
    /if \(matchDataRef\.current\?\.opponent\.characters\?\.includes\("screwed"\) && oppUpgradesRef\.current >= 1\) \{/,
    `if (matchDataRef.current?.opponent.characters?.includes("screwed")) {`
  );

  fs.writeFileSync(file, content);
}
patch('frontend/src/components/RankedMode.tsx');
patch('frontend/src/components/RankedSandbox.tsx');
