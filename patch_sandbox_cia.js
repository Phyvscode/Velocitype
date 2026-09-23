const fs = require('fs');

let boxTs = fs.readFileSync('frontend/src/components/RankedSandbox.tsx', 'utf8');

const ciaStates = `
  const [myCia, setMyCia] = useState<{c: number, i: number, a: number}>({c: 0, i: 0, a: 0});
  const [oppCia, setOppCia] = useState<{c: number, i: number, a: number}>({c: 0, i: 0, a: 0});
`;

boxTs = boxTs.replace(
  /const \[myWpm, setMyWpm\] = useState\(0\);\n  const \[oppWpm, setOppWpm\] = useState\(0\);/,
  `const [myWpm, setMyWpm] = useState(0);\n  const [oppWpm, setOppWpm] = useState(0);\n${ciaStates}`
);

// update useEffect for calculating CIA
const oldEffect = `        for (let i = 0; i < typedText.length; i++) {
          if (typedText[i] === myTargetText[i]) myC++;
        }
        for (let i = 0; i < oppTypedText.length; i++) {
          if (oppTypedText[i] === oppTargetText[i]) oppC++;
        }`;
        
const newEffect = `        let myI = 0;
        for (let i = 0; i < typedText.length; i++) {
          if (typedText[i] === myTargetText[i]) myC++;
          else myI++;
        }
        let oppI = 0;
        for (let i = 0; i < oppTypedText.length; i++) {
          if (oppTypedText[i] === oppTargetText[i]) oppC++;
          else oppI++;
        }
        
        setMyCia({ c: myC, i: myI, a: Math.round((myC / Math.max(1, myC + myI)) * 100) });
        setOppCia({ c: oppC, i: oppI, a: Math.round((oppC / Math.max(1, oppC + oppI)) * 100) });`;

boxTs = boxTs.replace(oldEffect, newEffect);

// Pass cia to RankedPlayerArea
boxTs = boxTs.replace(
  /wpm=\{myWpm\}\n              progress=/,
  `wpm={myWpm}\n              cia={myCia}\n              progress=`
);

boxTs = boxTs.replace(
  /wpm=\{oppWpm\}\n              progress=/,
  `wpm={oppWpm}\n              cia={oppCia}\n              progress=`
);

fs.writeFileSync('frontend/src/components/RankedSandbox.tsx', boxTs);
