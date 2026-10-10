const fs = require('fs');
const path = 'src/components/SetupScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

const savePrefsCall = `
    savePrefs({
      rows, customLetters, extraInitial, extraMiddle, extraFinal, enableCustom, enableExtra, durWords, durFile, durSentences, minLen, maxLen, limitModeWords, wordLimitWords, limitModeSentences, wordLimitSentences
    });
`;

code = code.replace(
  "const handleStartFile = () => {",
  "const handleStartFile = () => {\n" + savePrefsCall
);

code = code.replace(
  "const handleStartRandomSentences = async () => {",
  "const handleStartRandomSentences = async () => {\n" + savePrefsCall
);

code = code.replace(
  "const handleStart = async () => {",
  "const handleStart = async () => {\n" + savePrefsCall
);

fs.writeFileSync(path, code);
