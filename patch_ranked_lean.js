const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Move typing text up slightly (change pt-12 to pt-4 or similar)
// Let's actually add negative margin top to the flex container or use `pt-0`
code = code.replace(
  '<div className="flex-1 relative flex flex-col overflow-visible pt-12">',
  '<div className="flex-1 relative flex flex-col overflow-visible pt-4 pb-4">'
);

// 2. Remove the heavy leaning and move keyboard UP
const keyboardRegex = /<div \n        className="w-full max-w-\[600px\] mx-auto mt-8 mb-12 origin-bottom transform-gpu"\n        style=\{\{ transform: 'scale\\(0\.75\\) perspective\\(1200px\\) rotateX\\(45deg\\)' \}\}\n      >\n        <LiveKeyboard activeKeys=\{activeKeys\} \/>\n      <\/div>/g;

// If we want it flat like homescreen, transform is just scale(0.75)
const newKeyboard = `<div 
        className="w-full max-w-[600px] mx-auto mt-0 mb-20 origin-bottom transform-gpu"
        style={{ transform: 'scale(0.75)' }}
      >
        <LiveKeyboard activeKeys={activeKeys} />
      </div>`;

code = code.replace(keyboardRegex, newKeyboard);

fs.writeFileSync(path, code);
