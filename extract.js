const fs = require('fs');

const data = fs.readFileSync('mt_themes.ts', 'utf8');
const themesBlock = data.substring(data.indexOf('export const themes'));

// Match `"key": { ... }` OR `key: { ... }`
const regex = /(?:"([^"]+)"|([a-zA-Z0-9_]+)):\s*{\s*([^}]*)}/g;
let match;
const resultThemes = [];

while ((match = regex.exec(themesBlock)) !== null) {
  const name = match[1] || match[2];
  const propsStr = match[3];
  
  const bgMatch = propsStr.match(/bg:\s*"([^"]+)"/);
  const mainMatch = propsStr.match(/main:\s*"([^"]+)"/);
  const caretMatch = propsStr.match(/caret:\s*"([^"]+)"/);
  const subMatch = propsStr.match(/sub:\s*"([^"]+)"/);
  const textMatch = propsStr.match(/text:\s*"([^"]+)"/);
  const errorMatch = propsStr.match(/error:\s*"([^"]+)"/);
  
  if (bgMatch && mainMatch && subMatch && textMatch) {
    const formattedName = name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    resultThemes.push(`  {
    name: '${formattedName}',
    bgColor: '${bgMatch[1]}',
    mainColor: '${mainMatch[1]}',
    caretColor: '${caretMatch ? caretMatch[1] : mainMatch[1]}',
    subColor: '${subMatch[1]}',
    textColor: '${textMatch[1]}',
    errorColor: '${errorMatch ? errorMatch[1] : '#ff0000'}'
  }`);
  }
}

const out = `import { ThemeConfig } from './colors';

export const THEMES: ThemeConfig[] = [
${resultThemes.join(',\n')}
];
`;
fs.writeFileSync('frontend/src/lib/themes.ts', out);
console.log("Successfully extracted " + resultThemes.length + " themes.");
