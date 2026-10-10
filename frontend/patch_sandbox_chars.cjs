const fs = require('fs');
const path = 'src/components/RankedSandbox.tsx';
let code = fs.readFileSync(path, 'utf8');

const newChars = `
          {/* Right Side Characters */}
          <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 pointer-events-none z-40 max-h-screen overflow-hidden justify-center">
            {/* Opponent Characters */}
            {selectedCharacters.map((charId, idx) => (
              <div key={'opp-'+idx} className="w-20 h-20 rounded-full border-4 border-red-500/50 bg-red-900/20 overflow-hidden flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                <AnimatedCharacter id={charId} className="h-28 object-cover mt-4" />
              </div>
            ))}
            
            {/* My Characters */}
            {selectedCharacters.map((charId, idx) => (
              <div key={'my-'+idx} className="w-20 h-20 rounded-full border-4 border-[var(--hot)]/50 bg-[var(--hot)]/10 overflow-hidden flex items-center justify-center shadow-[0_0_10px_var(--color-hot-soft)]">
                <AnimatedCharacter id={charId} className="h-28 object-cover mt-4" />
              </div>
            ))}
          </div>
`;

// Replace the hardcoded ones
code = code.replace(
  /{[\s\S]*?\/\* Right Side Characters \*\/[\s\S]*?<\/div>\s*<\/div>/,
  newChars
);

fs.writeFileSync(path, code);
