const fs = require('fs');
const path = 'src/components/RankedSandbox.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add selectedCharacters
code = code.replace(
  "  // My states\n",
  "  // My states\n  const selectedCharacters = ['mushgirl', 'screwed', 'joker', 'gravity', 'moneyguy'];\n"
);

// 2. Change the main flex container
code = code.replace(
  '<div className="flex-1 flex flex-row overflow-hidden relative">',
  '<div className="flex-1 flex flex-col relative w-full max-w-5xl mx-auto px-4 md:px-8">'
);

// 3. Hide the opponent side container
const oppSideStart = code.indexOf('{/* OPPONENT SIDE */}');
if (oppSideStart !== -1) {
  const oppSideEnd = code.lastIndexOf('</div>\n    </div>\n  );\n}'); 
  if (oppSideEnd !== -1) {
    code = code.slice(0, oppSideStart) + '{/* OPPONENT SIDE HIDDEN */}\n' + code.slice(oppSideEnd);
  }
}

// 4. Move toggles to top bar
const togglesStart = code.indexOf('<div className="absolute bottom-0 left-0 w-full p-4 bg-slate-900/80');
const togglesEndStr = '</div>\n          <div className="flex-1 pt-12 pb-24 px-8 overflow-hidden flex flex-col">';
const togglesEnd = code.indexOf(togglesEndStr);
if (togglesStart !== -1 && togglesEnd !== -1) {
  let myToggles = code.slice(togglesStart, togglesEnd);
  
  // Add gravity toggles
  const mySequenceTogglesStart = myToggles.indexOf('<label className="flex items-center gap-1 cursor-pointer">\n              <input type="checkbox" checked={mySequence.includes(\'scramble\')');
  const gToggles = `
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={mySequence.includes('gravity1')} onChange={() => toggleSeq(mySequence, setMySequence, 'gravity1')} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">G-Warp</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={mySequence.includes('gravity2')} onChange={() => toggleSeq(mySequence, setMySequence, 'gravity2')} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">G-Hole</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={mySequence.includes('gravity3')} onChange={() => toggleSeq(mySequence, setMySequence, 'gravity3')} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">G-Horizon</span>
            </label>
`;
  myToggles = myToggles.slice(0, mySequenceTogglesStart) + gToggles + myToggles.slice(mySequenceTogglesStart);

  const headerEnd = code.indexOf('</header>') + 9;
  const topBar = `\n<div className="w-full bg-slate-900/50 p-2 flex flex-wrap justify-center gap-4 border-b border-slate-800 z-50 relative">\n  <span className="text-[10px] text-[var(--hot)]">MY ABILITIES:</span>` + myToggles.replace('<div className="absolute bottom-0 left-0 w-full p-4 bg-slate-900/80 border-t border-slate-800 flex flex-wrap items-center justify-center gap-4 z-40 backdrop-blur-md">', '').replace('<div className="text-xs text-[var(--hot)] uppercase tracking-widest mr-2 font-bold">Your Screen</div>', '') + `\n</div>\n`;
  
  code = code.slice(0, headerEnd) + topBar + code.slice(headerEnd);
  
  code = code.replace(myToggles, '');
}

// 5. Bottom Stats and dynamic right side characters
const bottomStatsAndChars = `
      {/* Bottom Stats & Right Side Characters */}
      {gameState === 'playing' && (
        <>
          {/* Bottom Bar: Stats */}
          <div className="fixed bottom-0 left-0 w-full px-12 py-6 flex justify-between items-end pointer-events-none z-30 bg-gradient-to-t from-background via-background/80 to-transparent">
            {/* My Stats */}
            <div className="flex flex-col gap-2 pointer-events-auto">
              <h3 className="font-display text-xl text-[var(--hot)] tracking-widest uppercase">You</h3>
              {(!oppSequence.includes('joker2')) && (
                <div className="font-mono text-3xl text-white tracking-widest">{myWpm} <span className="text-sm text-slate-500">WPM</span></div>
              )}
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
              {(!mySequence.includes('joker2')) && (
                <div className="font-mono text-3xl text-white tracking-widest">{oppWpm} <span className="text-sm text-slate-500">WPM</span></div>
              )}
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
        </>
      )}
`;

code = code.replace(
  '<div className="flex-1 pt-12 pb-24 px-8 overflow-hidden flex flex-col">',
  '<div className="flex-1 pt-12 pb-24 px-8 overflow-hidden flex flex-col">\n' + bottomStatsAndChars
);


// 6. Gravity State and Logic
const gravityState = `
  const [gravity1Triggered, setGravity1Triggered] = useState(0);
  const [showGravityPopup, setShowGravityPopup] = useState(false);
  const [gravityEscapesNeeded, setGravityEscapesNeeded] = useState(1);
  const lastGravityTickRef = React.useRef(0);
`;

code = code.replace(
  "const [myBlink, setMyBlink] = useState(false);",
  "const [myBlink, setMyBlink] = useState(false);\n" + gravityState
);

const timerLogic = `
  useEffect(() => {
    if (startTime && timeLeft > 0 && !showGravityPopup) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          
          const now = Date.now();
          if (now - lastGravityTickRef.current > 5000) {
             lastGravityTickRef.current = now;
             
             // Gravity 1 logic
             const g1 = mySequence.includes('gravity1');
             if (g1 && gravity1Triggered < 3 && myWpm < oppWpm && myWpm > 0) {
               setGravity1Triggered(c => c + 1);
               return prev + 10;
             }

             // Gravity 2 logic (Sabotage)
             const g2 = mySequence.includes('gravity2');
             if (g2 && Math.random() < 0.3) {
                setShowGravityPopup(true);
                setGravityEscapesNeeded(1);
             }

             // Gravity 3 logic (Event Horizon)
             const g3 = mySequence.includes('gravity3');
             if (g3 && myWpm > oppWpm && oppWpm > 0) {
                return 0; // Force end
             }
          }
          
          return newTime;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [startTime, timeLeft, myWpm, oppWpm, mySequence, gravity1Triggered, showGravityPopup]);
`;

code = code.replace(
  /useEffect\(\(\) => \{\s*if \(startTime && timeLeft > 0\) \{\s*const timer = setTimeout\(\(\) => setTimeLeft\(prev => prev - 1\), 1000\);\s*return \(\) => clearTimeout\(timer\);\s*\}\s*\}, \[startTime, timeLeft\]\);/,
  timerLogic
);


// 7. Gravity Popup Rendering
const popup = `
      {showGravityPopup && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto">
           <div className="bg-red-950 border border-red-500 p-8 rounded-xl shadow-[0_0_50px_rgba(239,68,68,0.5)] text-center animate-bounce">
              <h2 className="text-3xl text-red-500 font-display uppercase tracking-widest mb-4">Black Hole Sabotage!</h2>
              <p className="text-red-200 font-mono text-sm tracking-widest mb-4">You have been sucked into a gravity well!</p>
              {gravityEscapesNeeded > 1 ? <p className="text-white font-mono font-bold tracking-widest bg-red-900/50 p-4 rounded">Press CTRL + X to escape ({gravityEscapesNeeded} times left!)</p> : <p className="text-white font-mono font-bold tracking-widest bg-red-900/50 p-4 rounded">Press CTRL + X to escape</p>}
           </div>
        </div>
      )}
`;

const oppSideHiddenIdx = code.indexOf('{/* OPPONENT SIDE HIDDEN */}');
if (oppSideHiddenIdx !== -1) {
  code = code.slice(0, oppSideHiddenIdx) + popup + code.slice(oppSideHiddenIdx);
}


// 8. Keydown handlers
code = code.replace(
  "const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {",
  `const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showGravityPopup) {
      if (e.ctrlKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        setGravityEscapesNeeded(prev => {
          if (prev <= 1) {
            setShowGravityPopup(false);
            return 1;
          }
          return prev - 1;
        });
      }
      return;
    }
`
);

code = code.replace(
  "const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {",
  `const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (showGravityPopup) return;
`
);

fs.writeFileSync(path, code);
