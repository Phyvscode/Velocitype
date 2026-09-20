const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

const containerRegex = /<div className="w-full max-w-lg mx-auto flex flex-col items-end justify-center gap-12 pt-12">/g;
const newContainer = `<div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center gap-12 pt-12">`;
code = code.replace(containerRegex, newContainer);

// Make the queue box specifically max-w-lg so it stays centered
const queueBoxRegex = /<div className="w-full bg-slate-900\/50 border border-slate-800 p-8 rounded flex flex-col items-center gap-8">/g;
const newQueueBox = `<div className="w-full max-w-lg bg-slate-900/50 border border-slate-800 p-8 rounded flex flex-col items-center gap-8">`;
code = code.replace(queueBoxRegex, newQueueBox);

fs.writeFileSync(path, code);
