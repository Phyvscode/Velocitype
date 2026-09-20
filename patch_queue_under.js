const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

const containerRegex = /<div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-center gap-16 pt-24 px-8">/g;
const newContainer = `<div className="w-full max-w-lg mx-auto flex flex-col items-end justify-center gap-12 pt-12">`;
code = code.replace(containerRegex, newContainer);

const charSelectionRegex = /\{\/\* Character Selection \*\/\}\n        <div className="w-full md:w-auto flex flex-col items-center md:items-start shrink-0">\n          <label className="text-\[10px\] font-mono text-slate-500 uppercase tracking-widest block text-center md:text-left mb-6">\n            Select Characters \(Max 3\)\n          <\/label>\n          <div className="flex flex-wrap gap-6 items-center justify-center md:justify-start">/g;
const newCharSelection = `{/* Character Selection */}
        <div className="w-full flex flex-col items-end shrink-0 pr-4">
          <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block text-right mb-6">
            Select Characters (Max 3)
          </label>
          <div className="flex flex-wrap gap-6 items-center justify-end">`;
code = code.replace(charSelectionRegex, newCharSelection);

fs.writeFileSync(path, code);
