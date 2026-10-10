const fs = require('fs');

function patch(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  const oldCode = `      if (isMatch) {
        if (currState === 0) myLetterStatesRef.current[i] = 1;
        else if (currState === 2) myLetterStatesRef.current[i] = 3;
      } else {
        myLetterStatesRef.current[i] = 2;
      }`;
      
  const newCode = `      if (isMatch) {
        if (currState === 0) {
          myLetterStatesRef.current[i] = 1;
          if (goldenLettersRef.current.has(i) && !claimedGoldenRef.current.has(i)) {
            claimedGoldenRef.current.add(i);
            setMyCoins(c => c + 5);
            myCoinsRef.current += 5;
          }
        }
        else if (currState === 2) myLetterStatesRef.current[i] = 3;
      } else {
        if (currState === 0 || currState === 1) {
          setMyHearts(h => h + 3);
          myHeartsRef.current += 3;
        }
        myLetterStatesRef.current[i] = 2;
      }`;

  content = content.replace(oldCode, newCode);
  
  // Disable normal charge accumulation if moneyguy is selected
  content = content.replace(
    /if \(tempC > prevC\) \{/,
    `if (tempC > prevC && !selectedCharacters.includes('moneyguy')) {`
  );
  
  fs.writeFileSync(file, content);
}

patch('frontend/src/components/RankedMode.tsx');
patch('frontend/src/components/RankedSandbox.tsx');
