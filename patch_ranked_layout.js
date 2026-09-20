const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Remove label rendering
const labelRegex = /<span className="font-mono text-\[10px\] text-slate-500 uppercase tracking-widest">\{label\}<\/span>/g;
code = code.replace(labelRegex, '');

// 2. Adjust text layout: The text container is flex-1 flex flex-col justify-center. We want it higher.
// <div className="flex-1 relative flex flex-col justify-center overflow-visible">
const textContainerRegex = /<div className="flex-1 relative flex flex-col justify-center overflow-visible">/g;
code = code.replace(textContainerRegex, '<div className="flex-1 relative flex flex-col overflow-visible pt-12">');

// 3. Fix keyboard leaning and shift it up
const keyboardRegex = /<div className="w-full max-w-\[600px\] mx-auto transform scale-\[0\.6\] origin-bottom md:scale-75 mt-auto pt-8">\n        <LiveKeyboard activeKeys=\{activeKeys\} \/>\n      <\/div>/g;
const newKeyboard = `<div 
        className="w-full max-w-[600px] mx-auto mt-8 mb-12 origin-bottom transform-gpu"
        style={{ transform: 'scale(0.75) perspective(1200px) rotateX(45deg)' }}
      >
        <LiveKeyboard activeKeys={activeKeys} />
      </div>`;
code = code.replace(keyboardRegex, newKeyboard);

fs.writeFileSync(path, code);
