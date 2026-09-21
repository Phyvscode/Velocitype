const fs = require('fs');

// 1. Patch Frontend RankedMode.tsx
const fePath = 'frontend/src/components/RankedMode.tsx';
let feCode = fs.readFileSync(fePath, 'utf8');

// We need a ref to hold matchData so the unmount cleanup can access it
if (!feCode.includes('const matchDataRef = useRef<RankedMatchData | null>(null);')) {
  feCode = feCode.replace(
    'const [matchData, setMatchData] = useState<RankedMatchData | null>(null);',
    'const [matchData, setMatchData] = useState<RankedMatchData | null>(null);\n  const matchDataRef = useRef<RankedMatchData | null>(null);\n  useEffect(() => { matchDataRef.current = matchData; }, [matchData]);'
  );
}

// In the main socket useEffect cleanup, emit leaveRankedMatch
const oldCleanup = `    return () => {
      socket.off('rankedQueueJoined', onQueueJoined);`;

const newCleanup = `    return () => {
      if (matchDataRef.current) {
        socket.emit('leaveRankedMatch', { matchId: matchDataRef.current.matchId });
      }
      socket.emit('leaveRankedQueue', { language: 'english' }); // just in case they leave while queueing
      socket.off('rankedQueueJoined', onQueueJoined);`;

feCode = feCode.replace(oldCleanup, newCleanup);
fs.writeFileSync(fePath, feCode);


// 2. Patch Backend socketService.ts
const bePath = 'backend/src/services/socketService.ts';
let beCode = fs.readFileSync(bePath, 'utf8');

const leaveRankedMatchLogic = `
    socket.on('leaveRankedMatch', (data: { matchId: string }) => {
      const match = rankedMatches[data.matchId];
      if (match && match.players[socket.id] && match.state !== 'finished') {
        match.state = 'finished';
        if (match.roundTimer) clearTimeout(match.roundTimer);
        
        const remainingPlayer = Object.values(match.players).find(p => p.id !== socket.id);
        if (remainingPlayer) {
          io.to(data.matchId).emit('rankedOpponentDisconnected');
          remainingPlayer.score = 5;
          handleRankedMatchEnd(match, io).catch(console.error);
        } else {
          delete rankedMatches[data.matchId];
        }
        socket.leave(data.matchId);
      }
    });
`;

// Insert it before the disconnect listener
beCode = beCode.replace(
  "    socket.on('disconnect', () => {",
  `${leaveRankedMatchLogic}\n    socket.on('disconnect', () => {`
);

// Also inside disconnect, add socket.leave just to be safe? Disconnect automatically leaves all rooms anyway.
// But we should also make sure the backend actually deletes the match after handleRankedMatchEnd, wait, does it?
// Let's check handleRankedMatchEnd.

fs.writeFileSync(bePath, beCode);
