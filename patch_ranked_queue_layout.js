const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. First, we remove the character selection block from inside the box
const charSelectionBlockRegex = /        <div className="w-full space-y-4">\n          <label className="text-\[10px\] font-mono text-slate-500 uppercase tracking-widest block text-center">\n            Select Characters \(Max 3\)\n          <\/label>\n          <div className="flex flex-wrap gap-4 justify-center">\n            \{\['mushgirl'\]\.map\(charId => \{\n              const isSelected = selectedCharacters\.includes\(charId\);\n              return \([\s\S]*?\);\n            \}\)\}\n          <\/div>\n        <\/div>\n\n/g;

code = code.replace(charSelectionBlockRegex, '');

// 2. Wrap the box and append the character selection outside
const startRegex = /    return \(\n      <div className="w-full max-w-lg mx-auto bg-slate-900\/50 border border-slate-800 p-8 rounded flex flex-col items-center gap-8">/g;

const newStart = `    return (
      <div className="w-full max-w-lg mx-auto flex flex-col gap-8 pt-12">
        <div className="w-full bg-slate-900/50 border border-slate-800 p-8 rounded flex flex-col items-center gap-8">`;

code = code.replace(startRegex, newStart);

const endRegex = /          <\/button>\n        \)\}\n      <\/div>\n    \);\n  \}/g;

const newEnd = `          </button>
        )}
        </div>

        {/* Character Selection */}
        <div className="w-full">
          <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block text-left mb-4">
            Select Characters (Max 3)
          </label>
          <div className="flex gap-4 items-center justify-start">
            {['mushgirl'].map(charId => {
              const isSelected = selectedCharacters.includes(charId);
              return (
                <div 
                  key={charId}
                  onClick={() => {
                    if (queueing) return;
                    if (isSelected) {
                      setSelectedCharacters(prev => prev.filter(c => c !== charId));
                    } else if (selectedCharacters.length < 3) {
                      setSelectedCharacters(prev => [...prev, charId]);
                    }
                  }}
                  className={\`cursor-pointer w-28 h-28 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all \${
                    isSelected ? 'border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.7)] bg-cyan-950/40' : 'border-slate-800 hover:border-slate-600 bg-slate-900/50'
                  }\`}
                >
                  <AnimatedCharacter id={charId} className="h-40 object-contain scale-[1.3] transform-gpu" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }`;

code = code.replace(endRegex, newEnd);

fs.writeFileSync(path, code);
