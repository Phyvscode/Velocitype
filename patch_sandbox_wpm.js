const fs = require('fs');

let boxTs = fs.readFileSync('frontend/src/components/RankedSandbox.tsx', 'utf8');

const wpmStates = `
  const [startTime, setStartTime] = useState<number | null>(null);
  const [myWpm, setMyWpm] = useState(0);
  const [oppWpm, setOppWpm] = useState(0);
`;

boxTs = boxTs.replace(
  /const \[mySequence, setMySequence\] = useState<string\[\]>\(\[\]\);/,
  `${wpmStates}\n  const [mySequence, setMySequence] = useState<string[]>([]);`
);

// Add setInterval for sandbox WPM
const wpmEffect = `
  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      const timeElapsed = (Date.now() - startTime) / 60000;
      if (timeElapsed > 0) {
        let myC = 0, oppC = 0;
        for (let i = 0; i < typedText.length; i++) {
          if (typedText[i] === myTargetText[i]) myC++;
        }
        for (let i = 0; i < oppTypedText.length; i++) {
          if (oppTypedText[i] === oppTargetText[i]) oppC++;
        }
        setMyWpm(Math.round((myC / 5) / timeElapsed));
        setOppWpm(Math.round((oppC / 5) / timeElapsed));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, typedText, myTargetText, oppTypedText, oppTargetText]);
`;

boxTs = boxTs.replace(
  /useEffect\(\(\) => \{\n    const gen = generateSentences\(30\)/,
  `${wpmEffect}\n  useEffect(() => {
    setStartTime(Date.now());
    const gen = generateSentences(30)`
);

// Use myWpm and oppWpm
boxTs = boxTs.replace(/wpm=\{120\}/, `wpm={myWpm}`);
boxTs = boxTs.replace(/wpm=\{80\}/, `wpm={oppWpm}`);

fs.writeFileSync('frontend/src/components/RankedSandbox.tsx', boxTs);
