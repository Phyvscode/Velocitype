const fs = require('fs');

let boxTs = fs.readFileSync('frontend/src/components/RankedSandbox.tsx', 'utf8');

const botTyping = `
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
`;

boxTs = boxTs.replace(
  /const botInterval = setInterval\(\(\) => \{\n      setOppTypedText\(prev => \{\n        if \(prev\.length >= oppTargetText\.length\) \{\n          clearInterval\(botInterval\);\n          return prev;\n        \}\n        return prev \+ oppTargetText\[prev\.length\];\n      \}\);\n    \}, 150\);/,
  botTyping
);

fs.writeFileSync('frontend/src/components/RankedSandbox.tsx', boxTs);
