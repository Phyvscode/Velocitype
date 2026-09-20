const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

const keyboardRegex = /<div \n        className="w-full max-w-\[600px\] mx-auto mt-0 mb-20 origin-bottom transform-gpu"\n        style=\{\{ transform: 'scale\\(0\.75\\)' \}\}\n      >/g;

const newKeyboard = `<div 
        className="w-full max-w-[600px] mx-auto mt-0 mb-32 origin-bottom transform-gpu -translate-y-8"
        style={{ transform: 'scale(0.75)' }}
      >`;

code = code.replace(keyboardRegex, newKeyboard);

fs.writeFileSync(path, code);
