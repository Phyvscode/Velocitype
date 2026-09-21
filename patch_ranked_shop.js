const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/RankedMode.tsx', 'utf8');

// 1. State changes
code = code.replace(
  /const \[myUpgrades, setMyUpgrades\] = useState\(0\);\n  const \[oppUpgrades, setOppUpgrades\] = useState\(0\);/,
  `const [myAbilities, setMyAbilities] = useState<string[]>([]);\n  const [oppAbilities, setOppAbilities] = useState<string[]>([]);`
);

code = code.replace(
  /const oppUpgradesRef = useRef\(0\);\n  useEffect\(\(\) => \{ oppUpgradesRef\.current = oppUpgrades; \}, \[oppUpgrades\]\);/,
  `const oppAbilitiesRef = useRef<string[]>([]);\n  useEffect(() => { oppAbilitiesRef.current = oppAbilities; }, [oppAbilities]);`
);

// 2. Socket receive
code = code.replace(
  /socket\.on\('rankedOpponentUpgrades', \(data: \{ upgrades: number \}\) => \{\n      setOppUpgrades\(data\.upgrades\);\n    \}\);/,
  `socket.on('rankedOpponentUpgrades', (data: { upgrades: string[] }) => {\n      setOppAbilities(data.upgrades);\n    });`
);

// 3. Reset between rounds
code = code.replace(
  /setMyUpgrades\(0\);\n        setOppUpgrades\(0\);/,
  `setMyAbilities([]);\n        setOppAbilities([]);`
);

// 4. Update applyScrewedEffects targetText injection
code = code.replace(
  /let screwedSequence: string\[\] = \[\];\n      if \(oppUpgrades >= 1\) screwedSequence\.push\('scramble'\);\n      if \(oppUpgrades >= 2\) screwedSequence\.push\('sabotage'\);\n      if \(oppUpgrades >= 3\) screwedSequence\.push\('spam'\);\n      targetText = applyScrewedEffects\(targetText, screwedSequence, myWorstLetterRef\.current\);/,
  `// Filter only the screwed abilities from the sequence\n      const screwedSequence = oppAbilitiesRef.current.filter(a => ['scramble', 'sabotage', 'spam'].includes(a));\n      targetText = applyScrewedEffects(targetText, screwedSequence, myWorstLetterRef.current);`
);

// 5. Update RankedPlayerArea usage
code = code.replace(
  /dyslexiaActive=\{oppUpgrades >= 2\}\n          tripActive=\{oppUpgrades >= 1\}\n          blinkActive=\{oppUpgrades >= 3\}/,
  `dyslexiaActive={oppAbilities.includes('dyslexia')}\n          tripActive={oppAbilities.includes('shrooms')}\n          blinkActive={oppAbilities.includes('blinking')}`
);

// 6. Update Shop UI
const oldShopUI = `{myUpgrades === 0 && (
                <button 
                  onClick={() => {
                    if (myCharge >= 30) {
                      setMyCharge(c => c - 30);
                      myChargeRef.current -= 30;
                      setMyUpgrades(1);
                      socket?.emit('rankedUpgrades', { matchId: matchData?.matchId, upgrades: 1 });
                    }
                  }}
                  disabled={myCharge < 30}
                  className="w-full py-3 border border-slate-700 bg-slate-800 font-mono text-sm uppercase tracking-widest disabled:opacity-50 hover:bg-slate-700 transition-colors"
                >
                  Buy Shrooms (30 Charge)
                </button>
              )}
              {myUpgrades === 1 && (
                <button 
                  onClick={() => {
                    if (myCharge >= 60) {
                      setMyCharge(c => c - 60);
                      myChargeRef.current -= 60;
                      setMyUpgrades(2);
                      socket?.emit('rankedUpgrades', { matchId: matchData?.matchId, upgrades: 2 });
                    }
                  }}
                  disabled={myCharge < 60}
                  className="w-full py-3 border border-slate-700 bg-slate-800 font-mono text-sm uppercase tracking-widest disabled:opacity-50 hover:bg-slate-700 transition-colors"
                >
                  Buy Dyslexia (60 Charge)
                </button>
              )}
              {myUpgrades === 2 && (
                <button 
                  onClick={() => {
                    if (myCharge >= 100) {
                      setMyCharge(c => c - 100);
                      myChargeRef.current -= 100;
                      setMyUpgrades(3);
                      socket?.emit('rankedUpgrades', { matchId: matchData?.matchId, upgrades: 3 });
                    }
                  }}
                  disabled={myCharge < 100}
                  className="w-full py-3 border border-slate-700 bg-slate-800 font-mono text-sm uppercase tracking-widest disabled:opacity-50 hover:bg-slate-700 transition-colors"
                >
                  Buy Blinking (100 Charge)
                </button>
              )}`;

const newShopUI = `
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'shrooms', name: 'Shrooms', cost: 30 },
                  { id: 'scramble', name: 'Scramble', cost: 30 },
                  { id: 'dyslexia', name: 'Dyslexia', cost: 60 },
                  { id: 'sabotage', name: 'Sabotage', cost: 60 },
                  { id: 'blinking', name: 'Blinking', cost: 100 },
                  { id: 'spam', name: 'Spam', cost: 100 },
                ].map(ability => (
                  <button
                    key={ability.id}
                    onClick={() => {
                      if (myCharge >= ability.cost && !myAbilities.includes(ability.id)) {
                        setMyCharge(c => c - ability.cost);
                        myChargeRef.current -= ability.cost;
                        const newAbilities = [...myAbilities, ability.id];
                        setMyAbilities(newAbilities);
                        socket?.emit('rankedUpgrades', { matchId: matchData?.matchId, upgrades: newAbilities });
                      }
                    }}
                    disabled={myCharge < ability.cost || myAbilities.includes(ability.id)}
                    className="w-full py-3 px-2 border border-slate-700 bg-slate-800 font-mono text-xs uppercase tracking-widest disabled:opacity-50 hover:bg-slate-700 transition-colors flex flex-col items-center justify-center gap-1"
                  >
                    <span className={myAbilities.includes(ability.id) ? "text-emerald-400" : ""}>
                      {ability.name}
                    </span>
                    <span className="text-[10px] text-[var(--hot)]">{ability.cost} Charge</span>
                  </button>
                ))}
              </div>
`;

code = code.replace(oldShopUI, newShopUI);

fs.writeFileSync('frontend/src/components/RankedMode.tsx', code);

