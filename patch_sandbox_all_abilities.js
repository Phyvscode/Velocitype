const fs = require('fs');
const path = 'frontend/src/components/RankedSandbox.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace state
code = code.replace(
  /const \[myChar, setMyChar\] = useState\('mushgirl'\);\n  const \[myUpg1, setMyUpg1\] = useState\(false\);\n  const \[myUpg2, setMyUpg2\] = useState\(false\);\n  const \[myUpg3, setMyUpg3\] = useState\(false\);\n\n  const \[oppChar, setOppChar\] = useState\('mushgirl'\);\n  const \[oppUpg1, setOppUpg1\] = useState\(false\);\n  const \[oppUpg2, setOppUpg2\] = useState\(false\);\n  const \[oppUpg3, setOppUpg3\] = useState\(false\);/,
  `const [myShrooms, setMyShrooms] = useState(false);
  const [myDyslexia, setMyDyslexia] = useState(false);
  const [myBlink, setMyBlink] = useState(false);
  const [myScramble, setMyScramble] = useState(false);
  const [mySabotage, setMySabotage] = useState(false);
  const [mySpam, setMySpam] = useState(false);

  const [oppShrooms, setOppShrooms] = useState(false);
  const [oppDyslexia, setOppDyslexia] = useState(false);
  const [oppBlink, setOppBlink] = useState(false);
  const [oppScramble, setOppScramble] = useState(false);
  const [oppSabotage, setOppSabotage] = useState(false);
  const [oppSpam, setOppSpam] = useState(false);`
);

// Replace player UI panel
code = code.replace(
  /<div className="absolute top-0 left-0 w-full p-4 bg-slate-900\/80 border-b border-slate-800 flex items-center justify-center gap-6 z-40 backdrop-blur-md">[\s\S]*?<\/div>\n          <div className="flex-1 pt-24 px-8 overflow-hidden flex flex-col">/m,
  `<div className="absolute top-0 left-0 w-full p-4 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-center gap-4 z-40 backdrop-blur-md">
             <div className="text-xs text-[var(--hot)] uppercase tracking-widest mr-2 font-bold">My Screen</div>
             <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={myShrooms} onChange={e => setMyShrooms(e.target.checked)} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Shrooms</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={myDyslexia} onChange={e => setMyDyslexia(e.target.checked)} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Dyslexia</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={myBlink} onChange={e => setMyBlink(e.target.checked)} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Blinking</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={myScramble} onChange={e => setMyScramble(e.target.checked)} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Scramble</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={mySabotage} onChange={e => setMySabotage(e.target.checked)} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Sabotage</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={mySpam} onChange={e => setMySpam(e.target.checked)} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Spam</span>
            </label>
          </div>
          <div className="flex-1 pt-24 px-8 overflow-hidden flex flex-col">`
);

// Replace bot UI panel
code = code.replace(
  /<div className="absolute top-0 left-0 w-full p-4 bg-slate-900\/80 border-b border-slate-800 flex items-center justify-center gap-6 z-40 backdrop-blur-md">[\s\S]*?<\/div>\n          <div className="flex-1 pt-24 px-8 overflow-hidden flex flex-col">/m,
  `<div className="absolute top-0 left-0 w-full p-4 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-center gap-4 z-40 backdrop-blur-md">
             <div className="text-xs text-slate-500 uppercase tracking-widest mr-2 font-bold">Bot Screen</div>
             <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={oppShrooms} onChange={e => setOppShrooms(e.target.checked)} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Shrooms</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={oppDyslexia} onChange={e => setOppDyslexia(e.target.checked)} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Dyslexia</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={oppBlink} onChange={e => setOppBlink(e.target.checked)} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Blinking</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={oppScramble} onChange={e => setOppScramble(e.target.checked)} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Scramble</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={oppSabotage} onChange={e => setOppSabotage(e.target.checked)} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Sabotage</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={oppSpam} onChange={e => setOppSpam(e.target.checked)} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Spam</span>
            </label>
          </div>
          <div className="flex-1 pt-24 px-8 overflow-hidden flex flex-col">`
);

// Fix effect logic
code = code.replace(
  /let myText = baseTargetText;\n      if \(myChar === 'screwed'\) \{\n        myText = applyScrewedEffects\(baseTargetText, \{ scramble: myUpg1, sabotage: myUpg2, spam: myUpg3 \}, 'e'\) \+ ' ';\n      \}/g,
  `let myText = applyScrewedEffects(baseTargetText, { scramble: myScramble, sabotage: mySabotage, spam: mySpam }, 'e') + ' ';`
);

code = code.replace(
  /let oppText = baseTargetText;\n      if \(oppChar === 'screwed'\) \{\n        oppText = applyScrewedEffects\(baseTargetText, \{ scramble: oppUpg1, sabotage: oppUpg2, spam: oppUpg3 \}, 'e'\) \+ ' ';\n      \}/g,
  `let oppText = applyScrewedEffects(baseTargetText, { scramble: oppScramble, sabotage: oppSabotage, spam: oppSpam }, 'e') + ' ';`
);

// Fix useEffect dependencies
code = code.replace(
  /\[myChar, myUpg1, myUpg2, myUpg3, oppChar, oppUpg1, oppUpg2, oppUpg3, baseTargetText\]/g,
  `[myScramble, mySabotage, mySpam, oppScramble, oppSabotage, oppSpam, baseTargetText]`
);

// Fix player area props
code = code.replace(
  /dyslexiaActive=\{myChar === 'mushgirl' \? myUpg2 : false\}\n              tripActive=\{myChar === 'mushgirl' \? myUpg1 : false\}\n              blinkActive=\{myChar === 'mushgirl' \? myUpg3 : false\}\n              characters=\{\[myChar\]\}/,
  `dyslexiaActive={myDyslexia}
              tripActive={myShrooms}
              blinkActive={myBlink}
              characters={['mushgirl', 'screwed']}`
);

code = code.replace(
  /dyslexiaActive=\{oppChar === 'mushgirl' \? oppUpg2 : false\}\n              tripActive=\{oppChar === 'mushgirl' \? oppUpg1 : false\}\n              blinkActive=\{oppChar === 'mushgirl' \? oppUpg3 : false\}\n              characters=\{\[oppChar\]\}/,
  `dyslexiaActive={oppDyslexia}
              tripActive={oppShrooms}
              blinkActive={oppBlink}
              characters={['mushgirl', 'screwed']}`
);

fs.writeFileSync(path, code);
