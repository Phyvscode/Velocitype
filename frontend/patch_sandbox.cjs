const fs = require('fs');
let code = fs.readFileSync('src/components/RankedSandbox.tsx', 'utf8');

// 1. Add myMoneyguy3 state
code = code.replace(
  "const [myGravity3, setMyGravity3] = useState(false);",
  "const [myGravity3, setMyGravity3] = useState(false);\n  const [myMoneyguy3, setMyMoneyguy3] = useState(false);"
);

// 2. Add UI toggles for Gravity and Moneyguy3
const togglesInsertion = `
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={mySequence.includes('joker3')} onChange={() => toggleSeq(mySequence, setMySequence, 'joker3')} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Amnesia</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={myGravity1} onChange={e => setMyGravity1(e.target.checked)} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Heavy</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={myGravity2} onChange={e => setMyGravity2(e.target.checked)} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Crush</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={myGravity3} onChange={e => setMyGravity3(e.target.checked)} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Blackhole</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={myMoneyguy3} onChange={e => setMyMoneyguy3(e.target.checked)} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Invest (Buff)</span>
            </label>
`;
code = code.replace(
  /<label className="flex items-center gap-1 cursor-pointer">\s*<input type="checkbox" checked=\{mySequence\.includes\('joker3'\)\}.*?\s*<span className="font-mono text-\[10px\] uppercase tracking-widest text-slate-300">Amnesia<\/span>\s*<\/label>/,
  togglesInsertion.trim()
);

// 3. Update character circles to w-32 h-32
code = code.replace(
  /className="w-20 h-20 rounded-full border-4 border-red-500\/50/g,
  'className="w-32 h-32 rounded-full border-4 border-red-500/50'
);
code = code.replace(
  /className="w-20 h-20 rounded-full border-4 border-\[var\(--hot\)\]\/50/g,
  'className="w-32 h-32 rounded-full border-4 border-[var(--hot)]/50'
);
code = code.replace(
  /className="h-28 object-cover mt-4"/g,
  'className="h-40 object-cover mt-4"'
);

// 4. Update the flex container for right-side characters if needed
code = code.replace(
  /className="fixed right-4 top-1\/2 -translate-y-1\/2 flex flex-col gap-2 pointer-events-none z-40 max-h-screen overflow-hidden justify-center"/,
  'className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 pointer-events-none z-40 max-h-screen overflow-hidden justify-center scale-75 sm:scale-100 origin-right"'
);

// 5. Update RankedPlayerArea props to include joker and buffedAbilities
const rpaOld = `<RankedPlayerArea
              label={user?.username || "Player"}
              wpm={myWpm}
              cia={myCia}
              progress={(typedText.length / Math.max(1, myTargetText.length)) * 100}
              targetText={myTargetText}
              typedText={typedText}
              activeKeys={activeKeys}
              gameState="playing"
              isOpponent={false}
              colorTheme={undefined}
              charge={100}
              dyslexiaActive={myDyslexia}
              tripActive={myShrooms}
              blinkActive={myBlink}
              characters={['mushgirl', 'screwed', 'joker', 'gravity']}
            />`;

const buffedArrStr = `[
                ...(myShrooms && myMoneyguy3 ? ['shrooms'] : []),
                ...(myDyslexia && myMoneyguy3 ? ['dyslexia'] : []),
                ...(myBlink && myMoneyguy3 ? ['blinking'] : []),
                ...(mySequence.includes('joker1') && myMoneyguy3 ? ['joker1'] : []),
                ...(mySequence.includes('joker2') && myMoneyguy3 ? ['joker2'] : []),
                ...(mySequence.includes('joker3') && myMoneyguy3 ? ['joker3'] : [])
              ]`;

const rpaNew = `<RankedPlayerArea
              label={user?.username || "Player"}
              wpm={myWpm}
              cia={myCia}
              progress={(typedText.length / Math.max(1, myTargetText.length)) * 100}
              targetText={myTargetText}
              typedText={typedText}
              activeKeys={activeKeys}
              gameState="playing"
              isOpponent={false}
              colorTheme={undefined}
              charge={100}
              dyslexiaActive={myDyslexia}
              tripActive={myShrooms}
              blinkActive={myBlink}
              joker1Active={mySequence.includes('joker1')}
              joker2Active={mySequence.includes('joker2')}
              joker3Active={mySequence.includes('joker3')}
              buffedAbilities={${buffedArrStr}}
              characters={selectedCharacters}
            />`;

code = code.replace(rpaOld, rpaNew);

fs.writeFileSync('src/components/RankedSandbox.tsx', code);
