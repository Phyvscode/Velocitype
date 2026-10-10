const fs = require('fs');
const path = 'src/components/RankedSandbox.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Change the main flex container
code = code.replace(
  '<div className="flex-1 flex flex-row overflow-hidden relative">',
  '<div className="flex-1 flex flex-col relative w-full max-w-5xl mx-auto px-4 md:px-8">'
);

// 2. Hide the opponent side container
const oppSideStart = code.indexOf('{/* OPPONENT SIDE */}');
if (oppSideStart !== -1) {
  const oppSideEnd = code.lastIndexOf('</div>\n    </div>\n  );\n}'); // End of the file basically
  if (oppSideEnd !== -1) {
    code = code.slice(0, oppSideStart) + '{/* OPPONENT SIDE HIDDEN */}\n' + code.slice(oppSideEnd);
  }
}

// 3. We still need to render the bottom stats bar and characters.
// In RankedSandbox, the bottom bar currently has toggles. Let's move the toggles to a top bar.
const togglesStart = code.indexOf('<div className="absolute bottom-0 left-0 w-full p-4 bg-slate-900/80');
const togglesEndStr = '</div>\n          <div className="flex-1 pt-12 pb-24 px-8 overflow-hidden flex flex-col">';
const togglesEnd = code.indexOf(togglesEndStr);

if (togglesStart !== -1 && togglesEnd !== -1) {
  const myToggles = code.slice(togglesStart, togglesEnd);
  
  // We can inject these toggles at the top of the screen.
  const headerEnd = code.indexOf('</header>') + 9;
  const topBar = `\n<div className="w-full bg-slate-900/50 p-2 flex flex-wrap justify-center gap-4 border-b border-slate-800 z-50 relative">\n  <span className="text-[10px] text-[var(--hot)]">MY ABILITIES:</span>` + myToggles.replace('<div className="absolute bottom-0 left-0 w-full p-4 bg-slate-900/80 border-t border-slate-800 flex flex-wrap items-center justify-center gap-4 z-40 backdrop-blur-md">', '').replace('<div className="text-xs text-[var(--hot)] uppercase tracking-widest mr-2 font-bold">Your Screen</div>', '') + `\n</div>\n`;
  
  code = code.slice(0, headerEnd) + topBar + code.slice(headerEnd);
  
  // Remove original toggles
  code = code.slice(0, code.indexOf(myToggles)) + code.slice(togglesEnd);
}

// 4. Add the bottom stats and characters block to the end of MY SIDE.
const bottomStatsAndChars = `
      {/* Bottom Stats & Right Side Characters */}
      {gameState === 'playing' && (
        <>
          {/* Bottom Bar: Stats */}
          <div className="fixed bottom-0 left-0 w-full px-12 py-6 flex justify-between items-end pointer-events-none z-30 bg-gradient-to-t from-background via-background/80 to-transparent">
            {/* My Stats */}
            <div className="flex flex-col gap-2 pointer-events-auto">
              <h3 className="font-display text-xl text-[var(--hot)] tracking-widest uppercase">You</h3>
              <div className="font-mono text-3xl text-white tracking-widest">{myWpm} <span className="text-sm text-slate-500">WPM</span></div>
              {myCia && (
                <div className="font-mono text-sm text-slate-400 tracking-widest">
                  <span className="text-emerald-400">{myCia.c}</span>/
                  <span className="text-red-500">{myCia.i}</span>/
                  <span className="text-amber-400">{myCia.a}</span>
                </div>
              )}
              <div className="font-mono text-xs text-slate-500">100% Charge</div>
            </div>

            {/* Opponent Stats */}
            <div className="flex flex-col gap-2 text-right pointer-events-auto">
              <h3 className="font-display text-xl text-red-500 tracking-widest uppercase">Opponent</h3>
              <div className="font-mono text-3xl text-white tracking-widest">{oppWpm} <span className="text-sm text-slate-500">WPM</span></div>
              {oppCia && (
                <div className="font-mono text-sm text-slate-400 tracking-widest">
                  <span className="text-emerald-400">{oppCia.c}</span>/
                  <span className="text-red-500">{oppCia.i}</span>/
                  <span className="text-amber-400">{oppCia.a}</span>
                </div>
              )}
              <div className="font-mono text-xs text-slate-500">100% Charge</div>
            </div>
          </div>

          {/* Right Side Characters */}
          <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 pointer-events-none z-40 max-h-screen overflow-hidden justify-center">
            {/* Opponent Character */}
            <div className="w-24 h-24 rounded-full border-4 border-red-500/50 bg-red-900/20 overflow-hidden flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              <AnimatedCharacter id="mushgirl" className="h-32 object-cover mt-4" />
            </div>
            
            {/* My Character */}
            <div className="w-24 h-24 rounded-full border-4 border-[var(--hot)]/50 bg-[var(--hot)]/10 overflow-hidden flex items-center justify-center shadow-[0_0_20px_var(--color-hot-soft)]">
              <AnimatedCharacter id="moneyguy" className="h-32 object-cover mt-4" />
            </div>
          </div>
        </>
      )}
`;

code = code.replace(
  '<div className="flex-1 pt-12 pb-24 px-8 overflow-hidden flex flex-col">',
  '<div className="flex-1 pt-12 pb-24 px-8 overflow-hidden flex flex-col">\n' + bottomStatsAndChars
);

fs.writeFileSync(path, code);
