const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

const containerRegex = /<div className="w-full max-w-lg mx-auto flex flex-col gap-8 pt-12">/g;
const newContainer = `<div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-center gap-16 pt-24 px-8">`;
code = code.replace(containerRegex, newContainer);

const charSelectionRegex = /\{\/\* Character Selection \*\/\}\n        <div className="w-full">\n          <label className="text-\[10px\] font-mono text-slate-500 uppercase tracking-widest block text-left mb-4">\n            Select Characters \(Max 3\)\n          <\/label>\n          <div className="flex gap-4 items-center justify-start">/g;
const newCharSelection = `{/* Character Selection */}
        <div className="w-full md:w-auto flex flex-col items-center md:items-start shrink-0">
          <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block text-center md:text-left mb-6">
            Select Characters (Max 3)
          </label>
          <div className="flex flex-wrap gap-6 items-center justify-center md:justify-start">`;
code = code.replace(charSelectionRegex, newCharSelection);

const charItemRegex = /className=\{\`cursor-pointer w-28 h-28 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all \\\$\{\n                    isSelected \? 'border-cyan-400 shadow-\[0_0_25px_rgba\\(34,211,238,0\.7\\)\] bg-cyan-950\/40' : 'border-slate-800 hover:border-slate-600 bg-slate-900\/50'\n                  \}\`\}\n                >\n                  <AnimatedCharacter id=\{charId\} className="h-40 object-contain scale-\[1\.3\] transform-gpu" \/>/g;
const newCharItem = `className={\`cursor-pointer w-36 h-36 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all \${
                    isSelected ? 'border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.7)] bg-cyan-950/40' : 'border-slate-800 hover:border-slate-600 bg-slate-900/50'
                  }\`}
                >
                  <AnimatedCharacter id={charId} className="h-56 object-contain scale-[1.5] transform-gpu translate-y-2" />`;
code = code.replace(charItemRegex, newCharItem);

fs.writeFileSync(path, code);
