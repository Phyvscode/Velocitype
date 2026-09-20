const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

const charSelectionRegex = /\{\/\* Character Selection \*\/\}\n        <div className="w-full flex flex-col items-end shrink-0 pr-4">\n          <label className="text-\[10px\] font-mono text-slate-500 uppercase tracking-widest block text-right mb-6">\n            Select Characters \(Max 3\)\n          <\/label>\n          <div className="flex flex-wrap gap-6 items-center justify-end">/g;

const newCharSelection = `{/* Character Selection */}
        <div className="w-full flex flex-col items-start shrink-0 pl-4">
          <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block text-left mb-6">
            Select Characters (Max 3)
          </label>
          <div className="flex flex-wrap gap-6 items-center justify-start">`;

code = code.replace(charSelectionRegex, newCharSelection);
fs.writeFileSync(path, code);
