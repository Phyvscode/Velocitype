const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/GameScreen.tsx', 'utf8');

const isSequentialLogic = `(config as any).sequential || config.customLetters || config.extraInitial || config.extraMiddle || config.extraFinal`;

content = content.replace(
  /const queueRef = useRef<string\[\]>\(\(config as any\)\.sequential \? \[\.\.\.pool\] : shuffle\(pool\)\);/,
  `const queueRef = useRef<string[]>(${isSequentialLogic} ? [...pool] : shuffle(pool));`
);

content = content.replace(
  /      queueRef\.current = \(config as any\)\.sequential \? \[\.\.\.pool\] : shuffle\(pool\);/,
  `      queueRef.current = ${isSequentialLogic} ? [...pool] : shuffle(pool);`
);

fs.writeFileSync('frontend/src/components/GameScreen.tsx', content);
