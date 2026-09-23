const fs = require('fs');

let boxTs = fs.readFileSync('src/components/RankedSandbox.tsx', 'utf8');

const botTyping = `
  // Auto-typing bot
  useEffect(() => {
    if (!startTime) return;
    const botInterval = setInterval(() => {
      setOppTypedText(prev => {
        if (prev.length >= oppTargetText.length) {
          clearInterval(botInterval);
          return prev;
        }
        const char = oppTargetText[prev.length];
        if (Math.random() < 0.15) { // 15% typo chance
          let typo = String.fromCharCode(97 + Math.floor(Math.random() * 26));
          if (typo === char) typo = 'x';
          return prev + typo;
        }
        return prev + char;
      });
    }, 150);
    return () => clearInterval(botInterval);
  }, [startTime, oppTargetText]);
`;

if (!boxTs.includes('// Auto-typing bot')) {
  boxTs = boxTs.replace(
    /const \[baseTargetText, setBaseTargetText\] = useState\('generating text please wait\.\.\. '\);\n/,
    `const [baseTargetText, setBaseTargetText] = useState('generating text please wait... ');\n${botTyping}\n`
  );
  fs.writeFileSync('src/components/RankedSandbox.tsx', boxTs);
}
