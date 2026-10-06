const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/SetupScreen.tsx', 'utf8');

const newConfigFields = `  limitMode?: 'time' | 'words';
  limitValue?: number;
  customLetters?: string;
  extraInitial?: string;
  extraMiddle?: string;
  extraFinal?: string;`;

content = content.replace(
  /  limitMode\?: 'time' \| 'words';\n  limitValue\?: number;/,
  newConfigFields
);

fs.writeFileSync('frontend/src/components/SetupScreen.tsx', content);
