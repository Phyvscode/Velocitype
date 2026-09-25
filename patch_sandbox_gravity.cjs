const fs = require('fs');

let file = fs.readFileSync('frontend/src/components/RankedSandbox.tsx', 'utf8');

// Add checkbox for gravity1, 2, 3
file = file.replace(
  /  const \[oppBlink, setOppBlink\] = useState\(false\);/,
  `  const [oppBlink, setOppBlink] = useState(false);
  
  const [myGravity1, setMyGravity1] = useState(false);
  const [myGravity2, setMyGravity2] = useState(false);
  const [myGravity3, setMyGravity3] = useState(false);
  const [oppGravity1, setOppGravity1] = useState(false);
  const [oppGravity2, setOppGravity2] = useState(false);
  const [oppGravity3, setOppGravity3] = useState(false);
  const [showGravityPopup, setShowGravityPopup] = useState(false);
  const [gravity1Count, setGravity1Count] = useState(0);`
);

// Add sequence push
file = file.replace(
  /  if \(myDyslexia\) mySequence.push\('dyslexia'\);/,
  `  if (myDyslexia) mySequence.push('dyslexia');
  if (myGravity1) mySequence.push('gravity1');
  if (myGravity2) mySequence.push('gravity2');
  if (myGravity3) mySequence.push('gravity3');`
);
file = file.replace(
  /  if \(oppDyslexia\) oppSequence.push\('dyslexia'\);/,
  `  if (oppDyslexia) oppSequence.push('dyslexia');
  if (oppGravity1) oppSequence.push('gravity1');
  if (oppGravity2) oppSequence.push('gravity2');
  if (oppGravity3) oppSequence.push('gravity3');`
);

// Gravity Sandbox Logic
const gravitySandboxLogic = `
  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      // Gravity 1 logic
      if (myGravity1 && gravity1Count < 3 && myWpm < oppWpm && oppWpm > 0) {
        setGravity1Count(c => c + 1);
        setTimeLeft(t => t + 10);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, myGravity1, gravity1Count, myWpm, oppWpm]);

  useEffect(() => {
    // Gravity 3 logic
    if (myGravity3 && myWpm > oppWpm && oppWpm > 0) {
       // Reset Sandbox
       setTimeLeft(120);
       setMyProgress(0);
       setOppProgress(0);
       setMyTypedText("");
       setOppTypedText("");
       setGravity1Count(0);
       setShowGravityPopup(false);
    }
  }, [myGravity3, myWpm, oppWpm]);

  useEffect(() => {
    // Gravity 2 logic (opponent has it)
    if (oppGravity2 && !showGravityPopup) {
      const timer = setTimeout(() => {
        setShowGravityPopup(true);
      }, 3000 + Math.random() * 5000);
      return () => clearTimeout(timer);
    }
  }, [oppGravity2]);
`;

file = file.replace(
  /  \/\/ --- BOT AUTO-TYPING ---/,
  gravitySandboxLogic + '\n  // --- BOT AUTO-TYPING ---'
);

// Block keyboard input if popup active
file = file.replace(
  /  const handleKeyDown = \(e: KeyboardEvent\) => \{/,
  `  const handleKeyDown = (e: KeyboardEvent) => {
    if (showGravityPopup) {
      if (e.ctrlKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        setShowGravityPopup(false);
      }
      return;
    }`
);

// Render popup overlay
file = file.replace(
  /      \{\/\* Center Divider - with timer shifted down \*\/\}/,
  `      {showGravityPopup && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto">
           <div className="bg-red-950 border border-red-500 p-8 rounded-xl shadow-[0_0_50px_rgba(239,68,68,0.5)] text-center animate-bounce">
              <h2 className="text-3xl text-red-500 font-display uppercase tracking-widest mb-4">Black Hole Sabotage!</h2>
              <p className="text-red-200 font-mono text-sm tracking-widest mb-4">You have been sucked into a gravity well!</p>
              <p className="text-white font-mono font-bold tracking-widest bg-red-900/50 p-4 rounded">Press CTRL + X to escape</p>
           </div>
        </div>
      )}
      
      {/* Center Divider - with timer shifted down */}`
);

// Add UI Checkboxes
file = file.replace(
  /                <label className="flex items-center gap-1 cursor-pointer">\n                  <input type="checkbox" checked=\{myBlink\} onChange=\{\(e\) => setMyBlink\(e.target.checked\)\} \/> Blink\n                <\/label>/,
  `                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={myBlink} onChange={(e) => setMyBlink(e.target.checked)} /> Blink
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={myGravity1} onChange={(e) => setMyGravity1(e.target.checked)} /> G1 Warp
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={myGravity2} onChange={(e) => setMyGravity2(e.target.checked)} /> G2 Sabo
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={myGravity3} onChange={(e) => setMyGravity3(e.target.checked)} /> G3 End
                </label>`
);

file = file.replace(
  /                <label className="flex items-center gap-1 cursor-pointer">\n                  <input type="checkbox" checked=\{oppBlink\} onChange=\{\(e\) => setOppBlink\(e.target.checked\)\} \/> Blink\n                <\/label>/,
  `                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={oppBlink} onChange={(e) => setOppBlink(e.target.checked)} /> Blink
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={oppGravity1} onChange={(e) => setOppGravity1(e.target.checked)} /> G1 Warp
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={oppGravity2} onChange={(e) => setOppGravity2(e.target.checked)} /> G2 Sabo
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={oppGravity3} onChange={(e) => setOppGravity3(e.target.checked)} /> G3 End
                </label>`
);

fs.writeFileSync('frontend/src/components/RankedSandbox.tsx', file);
