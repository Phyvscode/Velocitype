const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/GameScreen.tsx', 'utf8');

content = content.replace(
  /const \{ rows, duration, minLen, maxLen, customSentences \} = config;/,
  `const { rows, duration, minLen, maxLen, customSentences, customLetters, extraInitial, extraMiddle, extraFinal } = config;`
);

content = content.replace(
  /const pool = useMemo\(\(\) => customSentences && customSentences\.length > 0 \? customSentences : filterWords\(rows as RowKey\[\], minLen, maxLen\), \[rows, minLen, maxLen, customSentences\]\);/,
  `const pool = useMemo(() => customSentences && customSentences.length > 0 ? customSentences : filterWords(rows as RowKey[], minLen, maxLen, customLetters, extraInitial, extraMiddle, extraFinal), [rows, minLen, maxLen, customSentences, customLetters, extraInitial, extraMiddle, extraFinal]);`
);

fs.writeFileSync('frontend/src/components/GameScreen.tsx', content);
