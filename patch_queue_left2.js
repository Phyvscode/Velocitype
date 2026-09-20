const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

const containerRegex = /<div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center gap-12 pt-12">/g;
const newContainer = `<div className="w-full max-w-lg mx-auto flex flex-col items-start justify-center gap-12 pt-12">`;
code = code.replace(containerRegex, newContainer);

// Also remove the padding left (pl-4) that I just added, so it perfectly aligns
const plRegex = /<div className="w-full flex flex-col items-start shrink-0 pl-4">/g;
const newPl = `<div className="w-full flex flex-col items-start shrink-0">`;
code = code.replace(plRegex, newPl);

fs.writeFileSync(path, code);
