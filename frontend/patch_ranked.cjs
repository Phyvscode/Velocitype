const fs = require('fs');
const path = 'src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add new socket listeners
const socketListeners = `
    const onGravityTimeSync = (data: { amountSec: number }) => {
      setTimeLeft(prev => prev + data.amountSec);
    };
    const onGravitySabotage = (data: { isBuffed: boolean }) => {
      setShowGravityPopup(true);
      // Wait, if it's buffed we could require multiple CTRL+X. Let's add a state for it.
      setGravityEscapesNeeded(data.isBuffed ? 2 : 1);
    };
    const onGravityForceEnd = () => {
      setTimeLeft(0); // This will trigger the frontend timer to stop, and backend will naturally end via its extra timer if we synced it, wait, backend timer won't end unless it hits 0. We'll handle backend timer cleanly.
    };

    socket.on('rankedGravityTimeSync', onGravityTimeSync);
    socket.on('rankedGravitySabotage', onGravitySabotage);
    socket.on('rankedGravityForceEnd', onGravityForceEnd);
`;
code = code.replace("socket.on('rankedOpponentDisconnected', onOpponentDisconnected);", "socket.on('rankedOpponentDisconnected', onOpponentDisconnected);\n" + socketListeners);

// Cleanup listeners
const socketCleanup = `
      socket.off('rankedGravityTimeSync', onGravityTimeSync);
      socket.off('rankedGravitySabotage', onGravitySabotage);
      socket.off('rankedGravityForceEnd', onGravityForceEnd);
`;
code = code.replace("socket.off('rankedOpponentDisconnected', onOpponentDisconnected);", "socket.off('rankedOpponentDisconnected', onOpponentDisconnected);\n" + socketCleanup);


// 2. Add Gravity 1 periodic check and gravity state
code = code.replace(
  "const [gravity1Count, setGravity1Count] = useState(0);",
  "const [gravity1Count, setGravity1Count] = useState(0);\n  const [gravityEscapesNeeded, setGravityEscapesNeeded] = useState(1);\n  const [gravity1Triggered, setGravity1Triggered] = useState(0);\n  const lastGravityTickRef = useRef(0);"
);

// We need to trigger Gravity 1 inside the timer tick.
// In useEffect for timer:
// useEffect(() => {
//     if (gameState === 'playing' && timeLeft > 0 ) {
const timerLogic = `
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => {
           const newTime = prev - 1;
           
           // Gravity periodic logic (every 5 seconds)
           const now = Date.now();
           if (now - lastGravityTickRef.current > 5000) {
             lastGravityTickRef.current = now;
             
             // Gravity 1 logic
             const g1 = myAbilities.includes('gravity1');
             const g1Buffed = myBuffedAbilities.includes('gravity1');
             if ((g1 || g1Buffed) && gravity1Triggered < 3 && myWpm < oppWpm && myWpm > 0) {
               setGravity1Triggered(c => c + 1);
               socket?.emit('rankedGravityTime', { matchId: matchData?.matchId, amountMs: g1Buffed ? 20000 : 10000 });
             }

             // Gravity 2 logic (Sabotage)
             const g2 = myAbilities.includes('gravity2');
             const g2Buffed = myBuffedAbilities.includes('gravity2');
             if ((g2 || g2Buffed) && Math.random() < 0.3) {
                socket?.emit('rankedGravitySabotage', { matchId: matchData?.matchId, isBuffed: g2Buffed });
             }

             // Gravity 3 logic (Event Horizon)
             const g3 = myAbilities.includes('gravity3');
             const g3Buffed = myBuffedAbilities.includes('gravity3');
             if ((g3 || g3Buffed) && myWpm > oppWpm && oppWpm > 0) {
                socket?.emit('rankedGravityEndRound', { matchId: matchData?.matchId });
             }
           }

           return newTime;
        });
      }, 1000);
`;

code = code.replace(
  "timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);",
  timerLogic
);


// 3. Round start reset for Gravity
const roundStartReset = `
      setGravity1Count(0);
      setShowGravityPopup(false);
      setGravity1Triggered(0);
      setGravityEscapesNeeded(1);
`;
code = code.replace(
  "setGravity1Count(0);\n      setShowGravityPopup(false);",
  roundStartReset
);


// 4. Update the popup rendering and ctrl+x logic
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


// 5. Update popup UI to show how many times to press
code = code.replace(
  "<p className=\"text-white font-mono font-bold tracking-widest bg-red-900/50 p-4 rounded\">Press CTRL + X to escape</p>",
  "{gravityEscapesNeeded > 1 ? <p className=\"text-white font-mono font-bold tracking-widest bg-red-900/50 p-4 rounded\">Press CTRL + X to escape ({gravityEscapesNeeded} times left!)</p> : <p className=\"text-white font-mono font-bold tracking-widest bg-red-900/50 p-4 rounded\">Press CTRL + X to escape</p>}"
);

// 6. Joker _buffed
// In render joker active logic
// joker1Active (Delusion): opponent sees ALL letters as correct. if buffed, maybe also hide wpm? 
// joker2Active (Blindness): text is low opacity. if buffed, text is invisible (opacity 0)?
// joker3Active (Amnesia): every 5th letter is hidden. if buffed, every 2nd letter is hidden?
code = code.replace(
  "joker1Active={oppAbilities.includes('joker1')}",
  "joker1Active={oppAbilities.includes('joker1') || oppBuffedAbilities.includes('joker1')}"
);
code = code.replace(
  "joker2Active={oppAbilities.includes('joker2')}",
  "joker2Active={oppAbilities.includes('joker2') || oppBuffedAbilities.includes('joker2')}"
);
code = code.replace(
  "joker3Active={oppAbilities.includes('joker3')}",
  "joker3Active={oppAbilities.includes('joker3') || oppBuffedAbilities.includes('joker3')}"
);

// Let's pass oppBuffedAbilities to RankedPlayerArea to know if it's buffed. Wait, oppBuffedAbilities doesn't exist?
// Let's check how oppAbilities are passed. 
// Ah, the backend sends `oppUpgrades` but `RankedMode` tracks `oppAbilities`.
// wait, RankedMode parses `oppAbilities`?
// I'll just check `oppAbilities.includes('joker2_buffed')`
