const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

// The string to replace is exactly this:
const oldKeyboardStr = `<div 
        className="w-full max-w-[600px] mx-auto mt-8 mb-12 origin-bottom transform-gpu"
        style={{ transform: 'scale(0.75) perspective(1200px) rotateX(45deg)' }}
      >
        <LiveKeyboard activeKeys={activeKeys} />
      </div>`;

const newKeyboardStr = `<div 
        className="w-full max-w-[600px] mx-auto mt-0 mb-32 origin-bottom transform-gpu -translate-y-8"
        style={{ transform: 'scale(0.75)' }}
      >
        <LiveKeyboard activeKeys={activeKeys} />
      </div>`;

if (code.includes(oldKeyboardStr)) {
  code = code.replace(oldKeyboardStr, newKeyboardStr);
} else {
  console.log("Could not find the exact oldKeyboardStr string. Trying regex...");
  const fallbackRegex = /<div\s+className="w-full max-w-\[600px\] mx-auto mt-8 mb-12 origin-bottom transform-gpu"\s+style=\{\{\s*transform:\s*'scale\(0\.75\)\s*perspective\(1200px\)\s*rotateX\(45deg\)'\s*\}\}\s*>\s*<LiveKeyboard activeKeys=\{activeKeys\}\s*\/>\s*<\/div>/g;
  code = code.replace(fallbackRegex, newKeyboardStr);
}

// And fix the text container which ALSO failed in patch_ranked_lean.js:
// <div className="flex-1 relative flex flex-col overflow-visible pt-12">
const oldTextContainer = '<div className="flex-1 relative flex flex-col overflow-visible pt-12">';
const newTextContainer = '<div className="flex-1 relative flex flex-col overflow-visible pt-4 pb-4">';
code = code.replace(oldTextContainer, newTextContainer);

fs.writeFileSync(path, code);
