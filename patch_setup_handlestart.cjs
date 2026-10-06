const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/SetupScreen.tsx', 'utf8');

// Note: filterWords takes extra arguments now: customLetters, extraInitial, extraMiddle, extraFinal
content = content.replace(
  /const available = filterWords\(rows, minL, maxL\);/,
  `const cl = enableCustom ? customLetters : undefined;
    const ei = enableExtra ? extraInitial : undefined;
    const em = enableExtra ? extraMiddle : undefined;
    const ef = enableExtra ? extraFinal : undefined;
    const available = filterWords(rows, minL, maxL, cl, ei, em, ef);`
);

content = content.replace(
  /const available = filterWords\(rows, 1, 15\);/,
  `const cl = enableCustom ? customLetters : undefined;
      const ei = enableExtra ? extraInitial : undefined;
      const em = enableExtra ? extraMiddle : undefined;
      const ef = enableExtra ? extraFinal : undefined;
      const available = filterWords(rows, 1, 15, cl, ei, em, ef);`
);

content = content.replace(
  /const genSentences = await generateSentences\(apiKey, rows, minL, maxL, 20, sentenceTheme\);/,
  `const genSentences = await generateSentences(apiKey, rows, minL, maxL, 20, sentenceTheme, cl, ei, em, ef);`
);

// Add fields to GameConfig in onStart payload
content = content.replace(
  /        limitValue: limitModeWords === 'words' \? parseInt\(wordLimitWords, 10\) \|\| 20 : undefined,\n        minLen: minL,\n        maxLen: maxL,\n        useVirtualKeyboard\n      \} as any\);/,
  `        limitValue: limitModeWords === 'words' ? parseInt(wordLimitWords, 10) || 20 : undefined,
        minLen: minL,
        maxLen: maxL,
        useVirtualKeyboard,
        customLetters: cl,
        extraInitial: ei,
        extraMiddle: em,
        extraFinal: ef
      } as any);`
);

// We need to bypass the "Select at least one key row." error if enableCustom is true
// Wait, the prompt says "when the user uses the custom option then he cannot enable top bottom or home row. for that he needs to disable it first."
// This means if custom is checked, they shouldn't select rows, so rows.length === 0 is valid!
content = content.replace(
  /    if \(rows\.length === 0\) \{\n      setError\('Select at least one key row\.'\);\n      setTimeout\(\(\) => setError\(''\), 3000\);\n      return;\n    \}/,
  `    if (rows.length === 0 && !enableCustom) {
      setError('Select at least one key row.');
      setTimeout(() => setError(''), 3000);
      return;
    }`
);

fs.writeFileSync('frontend/src/components/SetupScreen.tsx', content);
