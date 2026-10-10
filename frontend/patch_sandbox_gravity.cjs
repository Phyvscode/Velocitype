const fs = require('fs');
const path = 'src/components/RankedSandbox.tsx';
let code = fs.readFileSync(path, 'utf8');

const gravityState = `
  const [gravity1Triggered, setGravity1Triggered] = useState(0);
  const [showGravityPopup, setShowGravityPopup] = useState(false);
  const [gravityEscapesNeeded, setGravityEscapesNeeded] = useState(1);
  const lastGravityTickRef = useRef(0);
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

// We need to add the Gravity popup rendering.
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

// And keydown logic
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

// We should also add toggles for Gravity in the top bar!
const mySequenceTogglesStart = code.indexOf('<label className="flex items-center gap-1 cursor-pointer">\n              <input type="checkbox" checked={mySequence.includes(\'scramble\')');
if (mySequenceTogglesStart !== -1) {
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
  code = code.slice(0, mySequenceTogglesStart) + gToggles + code.slice(mySequenceTogglesStart);
}

fs.writeFileSync(path, code);
