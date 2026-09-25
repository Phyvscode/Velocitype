const fs = require('fs');

let file = fs.readFileSync('frontend/src/components/RankedMode.tsx', 'utf8');

// 1. Add gravity states
file = file.replace(
  /  const \[showGravityPopup, setShowGravityPopup\] = useState\(false\);/,
  ''
); // remove if exists
file = file.replace(
  /  const \[oppCia, setOppCia\] = useState<{c: number, i: number, a: number} \| null>\(null\);/,
  `  const [oppCia, setOppCia] = useState<{c: number, i: number, a: number} | null>(null);
  const [gravity1Count, setGravity1Count] = useState(0);
  const [showGravityPopup, setShowGravityPopup] = useState(false);`
);

// 2. Add gravity shop items
file = file.replace(
  /\{ id: 'joker3', name: 'Amnesia', cost: 100 \},/,
  `{ id: 'joker3', name: 'Amnesia', cost: 100 },
                  { id: 'gravity1', name: 'Time Warp', cost: 40 },
                  { id: 'gravity2', name: 'Black Hole', cost: 70 },
                  { id: 'gravity3', name: 'Event Horizon', cost: 110 },`
);

// 3. Add gravity effect logic to useEffect for WPM/Game State
// Since we have multiple effects, I'll just append it right before "// Socket Listeners"
const gravityEffect = `
  // Gravity Abilities Logic
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    // Gravity 3: End round instantly if my WPM > opp WPM
    if (myAbilities.includes('gravity3') && myWpm > oppWpm && oppWpm > 0) {
      handleRoundEnd();
    }
  }, [gameState, myAbilities, myWpm, oppWpm]);

  useEffect(() => {
    if (gameState !== 'playing' || !startTime) return;
    
    // Gravity 1: Add 10 seconds (move startTime 10s into the future)
    const interval = setInterval(() => {
      if (myAbilities.includes('gravity1') && gravity1Count < 3 && myWpm < oppWpm && oppWpm > 0) {
        setGravity1Count(c => c + 1);
        setStartTime(prev => prev! + 10000);
        socket?.emit('rankedTimeWarp', { matchId: matchData.matchId });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, startTime, myAbilities, gravity1Count, myWpm, oppWpm, matchData, socket]);

  useEffect(() => {
    if (gameState === 'playing' && oppAbilities.includes('gravity2') && !showGravityPopup) {
      const timer = setTimeout(() => {
        setShowGravityPopup(true);
      }, 3000 + Math.random() * 5000); // 3-8 seconds in
      return () => clearTimeout(timer);
    }
  }, [gameState, oppAbilities]);
  
  useEffect(() => {
    if (gameState === 'round_finished') {
      setMyAbilities(prev => prev.filter(a => !a.startsWith('gravity')));
    }
  }, [gameState]);
`;

file = file.replace(
  /  \/\/ Socket Listeners/,
  gravityEffect + '\n  // Socket Listeners'
);

// 4. Add socket listener for rankedTimeWarp
file = file.replace(
  /      socket\.off\('rankedUpgrades'\);/,
  `      socket.off('rankedUpgrades');\n      socket.off('rankedTimeWarp');`
);
file = file.replace(
  /    socket\.on\('rankedUpgrades', \(data: any\) => \{.*?\n    \}\);/s,
  `$&
    socket.on('rankedTimeWarp', () => {
      setStartTime(prev => prev ? prev + 10000 : prev);
    });`
);

// 5. Reset states on rankedRoundStart
file = file.replace(
  /      setOppProgress\(0\);/,
  `      setOppProgress(0);\n      setGravity1Count(0);\n      setShowGravityPopup(false);`
);

// 6. Block typing if showGravityPopup
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

// 7. Render popup overlay
file = file.replace(
  /      \{\/\* Overlays \*\/\}/,
  `      {showGravityPopup && gameState === 'playing' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto">
           <div className="bg-red-950 border border-red-500 p-8 rounded-xl shadow-[0_0_50px_rgba(239,68,68,0.5)] text-center animate-bounce">
              <h2 className="text-3xl text-red-500 font-display uppercase tracking-widest mb-4">Black Hole Sabotage!</h2>
              <p className="text-red-200 font-mono text-sm tracking-widest mb-4">You have been sucked into a gravity well!</p>
              <p className="text-white font-mono font-bold tracking-widest bg-red-900/50 p-4 rounded">Press CTRL + X to escape</p>
           </div>
        </div>
      )}
      
      {/* Overlays */}`
);

fs.writeFileSync('frontend/src/components/RankedMode.tsx', file);
