const fs = require('fs');

let modeTs = fs.readFileSync('frontend/src/components/RankedMode.tsx', 'utf8');

const wpmEffect = `
  useEffect(() => {
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
  }, [gameState, startTime, typedText, myTargetText, oppTargetText]);
`;

modeTs = modeTs.replace(
  /const \[myWpm, setMyWpm\] = useState\(0\);/,
  `const [myWpm, setMyWpm] = useState(0);${wpmEffect}`
);

fs.writeFileSync('frontend/src/components/RankedMode.tsx', modeTs);
