const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/SetupScreen.tsx', 'utf8');

const injection = `
  const handleCustomLettersChange = (val: string) => {
    const raw = val.toLowerCase();
    const seen = new Set();
    let filtered = '';
    for (const char of raw) {
      if (char === ' ') {
        filtered += char;
      } else if (/[a-z]/.test(char) && !seen.has(char)) {
        seen.add(char);
        filtered += char;
      }
    }
    setCustomLetters(filtered);
  };
`;

// Insert after state declarations
content = content.replace(
  /  const \[enableExtra, setEnableExtra\] = useState\(false\);/,
  `  const [enableExtra, setEnableExtra] = useState(false);\n${injection}`
);

// Replace onChange=...
content = content.replace(
  /onChange=\{e => setCustomLetters\(e\.target\.value\)\}/g,
  `onChange={e => handleCustomLettersChange(e.target.value)}`
);

fs.writeFileSync('frontend/src/components/SetupScreen.tsx', content);
