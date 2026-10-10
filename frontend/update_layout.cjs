const fs = require('fs');
const path = 'src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Remove split screen layout, make it center.
code = code.replace(
  '<div className="flex-1 flex flex-col md:flex-row relative">',
  '<div className="flex-1 flex flex-col relative w-full max-w-5xl mx-auto px-4 md:px-8">'
);

// 2. Hide Opponent Area from rendering
// The opponent area starts with {/* Opponent Side (Right) */}
// and ends with 
//         {/* Center Divider - with timer shifted down */}
const opponentStart = code.indexOf('{/* Opponent Side (Right) */}');
const dividerStart = code.indexOf('{/* Center Divider - with timer shifted down */}');
if (opponentStart !== -1 && dividerStart !== -1) {
  code = code.slice(0, opponentStart) + '{/* OPPONENT AREA HIDDEN */}\n' + code.slice(dividerStart);
}

// 3. Hide center divider
// The center divider block is from dividerStart to the end of the div holding the timer.
// Wait, the timer is inside the center divider! We need to keep the timer.
// We can just remove the divider line itself.
code = code.replace(
  '<div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/50 -translate-x-1/2 z-20 pointer-events-none" />',
  '{/* HIDDEN DIVIDER */}'
);

// We can move the timer to the top center instead of floating in the middle.
// Let's rewrite the timer container.
code = code.replace(
  '<div className="hidden md:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2 z-30 pointer-events-none flex flex-col justify-end pb-32">',
  '<div className="absolute left-1/2 top-4 -translate-x-1/2 z-30 pointer-events-none flex flex-col justify-start">'
);

// 4. In RankedPlayerArea, hide the top stats (WPM/CIA) because they will be at the bottom.
// Wait, RankedPlayerArea has a Header Info block.
code = code.replace(
  '{(!joker2Active || isOpponent) && <span className="font-mono text-sm uppercase tracking-widest"',
  '{/* HIDDEN STATS */ false && <span className="font-mono text-sm uppercase tracking-widest"'
);
code = code.replace(
  '{!isOpponent && cia && !joker2Active && (',
  '{/* HIDDEN CIA */ false && ('
);


// 5. Add Bottom Stats and Characters
// Look for where to insert the bottom stats. The main playing area ends where the overlays start (e.g. Upgrade Screen).
const overlaysStart = code.indexOf('{/* Overlays */}');
const bottomStats = `
      {/* Bottom Stats & Right Side Characters */}
      {gameState === 'playing' && (
        <>
          {/* Bottom Bar: Stats */}
          <div className="absolute bottom-0 left-0 w-full p-6 flex justify-between items-end pointer-events-none z-30 bg-gradient-to-t from-background via-background/80 to-transparent">
            {/* My Stats */}
            <div className="flex flex-col gap-2 pointer-events-auto">
              <h3 className="font-display text-xl text-[var(--hot)] tracking-widest uppercase">You</h3>
              {(!oppAbilities.includes('joker2') && !oppAbilities.includes('joker2_buffed')) && (
                <div className="font-mono text-3xl text-white tracking-widest">{myWpm} <span className="text-sm text-slate-500">WPM</span></div>
              )}
              {myCia && (
                <div className="font-mono text-sm text-slate-400 tracking-widest">
                  <span className="text-emerald-400">{myCia.c}</span>/
                  <span className="text-red-500">{myCia.i}</span>/
                  <span className="text-amber-400">{myCia.a}</span>
                </div>
              )}
              <div className="font-mono text-xs text-slate-500">{myCharge}% Charge</div>
            </div>

            {/* Opponent Stats */}
            <div className="flex flex-col gap-2 text-right pointer-events-auto">
              <h3 className="font-display text-xl text-red-500 tracking-widest uppercase">Opponent</h3>
              {(!myAbilities.includes('joker2') && !myBuffedAbilities.includes('joker2')) && (
                <div className="font-mono text-3xl text-white tracking-widest">{oppWpm} <span className="text-sm text-slate-500">WPM</span></div>
              )}
              {oppCia && (
                <div className="font-mono text-sm text-slate-400 tracking-widest">
                  <span className="text-emerald-400">{oppCia.c}</span>/
                  <span className="text-red-500">{oppCia.i}</span>/
                  <span className="text-amber-400">{oppCia.a}</span>
                </div>
              )}
              <div className="font-mono text-xs text-slate-500">{oppCharge}% Charge</div>
            </div>
          </div>

          {/* Right Side Characters */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-8 pointer-events-none z-20">
            {/* Opponent Character(s) */}
            {matchData?.opponent.characters?.map((charId, idx) => (
              <div key={'opp-'+idx} className="w-32 h-32 rounded-full border-4 border-red-500/50 bg-red-900/20 overflow-hidden flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                <AnimatedCharacter id={charId} className="h-40 object-cover mt-4" />
              </div>
            ))}
            
            {/* My Character(s) */}
            {selectedCharacters.map((charId, idx) => (
              <div key={'my-'+idx} className="w-32 h-32 rounded-full border-4 border-[var(--hot)]/50 bg-[var(--hot)]/10 overflow-hidden flex items-center justify-center shadow-[0_0_20px_var(--color-hot-soft)]">
                <AnimatedCharacter id={charId} className="h-40 object-cover mt-4" />
              </div>
            ))}
          </div>
        </>
      )}
`;

if (overlaysStart !== -1) {
  code = code.slice(0, overlaysStart) + bottomStats + '\n      ' + code.slice(overlaysStart);
}

// 6. Remove the old characters rendering block.
const oldCharsStart = code.indexOf('{gameState === \'playing\' && characters.length > 0 && (');
if (oldCharsStart !== -1) {
  const oldCharsEnd = code.indexOf(')}', oldCharsStart) + 2;
  code = code.slice(0, oldCharsStart) + '{/* OLD CHARS MOVED */}' + code.slice(oldCharsEnd);
}

fs.writeFileSync(path, code);
