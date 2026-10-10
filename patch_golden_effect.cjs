const fs = require('fs');

function patch(file) {
  let content = fs.readFileSync(file, 'utf8');
  const injection = `
  useEffect(() => {
    if (selectedCharacters.includes('moneyguy')) {
      const newGolden = new Set<number>();
      for (let i = 0; i < myTargetText.length; i++) {
        if (myTargetText[i] !== ' ' && Math.random() < 0.3) {
          newGolden.add(i);
        }
      }
      goldenLettersRef.current = newGolden;
      claimedGoldenRef.current = new Set();
    }
  }, [myTargetText, selectedCharacters]);
  `;
  content = content.replace(
    /  useEffect\(\(\) => \{/i,
    `${injection}\n  useEffect(() => {`
  );
  fs.writeFileSync(file, content);
}
patch('frontend/src/components/RankedMode.tsx');
patch('frontend/src/components/RankedSandbox.tsx');
