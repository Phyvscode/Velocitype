const fs = require('fs');
const path = 'frontend/src/components/RankedSandbox.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace state block
code = code.replace(
  /const \[myTripActive[\s\S]*?const \[oppScrewedActive, setOppScrewedActive\] = useState\(false\);/,
  `const [myChar, setMyChar] = useState('mushgirl');
  const [myUpg1, setMyUpg1] = useState(false);
  const [myUpg2, setMyUpg2] = useState(false);
  const [myUpg3, setMyUpg3] = useState(false);

  const [oppChar, setOppChar] = useState('mushgirl');
  const [oppUpg1, setOppUpg1] = useState(false);
  const [oppUpg2, setOppUpg2] = useState(false);
  const [oppUpg3, setOppUpg3] = useState(false);`
);

// Replace applyScrewedEffects logic
code = code.replace(
  /useEffect\(\(\) => \{\n    if \(\!baseTargetText\.startsWith[\s\S]*?\}\n  \}, \[oppScrewedActive, baseTargetText\]\);/,
  `useEffect(() => {
    if (!baseTargetText.startsWith('generating')) {
      let text = baseTargetText;
      let upgrades = 0;
      if (oppUpg1) upgrades = 1;
      if (oppUpg2) upgrades = 2;
      if (oppUpg3) upgrades = 3;
      
      if (oppChar === 'screwed' && upgrades > 0) {
        text = applyScrewedEffects(baseTargetText, upgrades, 'e') + ' ';
      }
      setTargetText(text);
    }
  }, [oppChar, oppUpg1, oppUpg2, oppUpg3, baseTargetText]);`
);

// Update Player UI Panel
const oldPlayerPanel = `<div className="absolute top-0 left-0 w-full p-4 bg-slate-900/80 border-b border-slate-800 flex justify-center gap-6 z-40 backdrop-blur-md">
             <div className="text-xs text-slate-500 uppercase tracking-widest mr-4">My Screen</div>
             <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={myTripActive} onChange={e => setMyTripActive(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
              <span className="font-mono text-sm uppercase tracking-widest text-slate-300">Shrooms</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={myDyslexiaActive} onChange={e => setMyDyslexiaActive(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
              <span className="font-mono text-sm uppercase tracking-widest text-slate-300">Dyslexia</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={myBlinkActive} onChange={e => setMyBlinkActive(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
              <span className="font-mono text-sm uppercase tracking-widest text-slate-300">Blinking</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={myScrewedActive} onChange={e => setMyScrewedActive(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
              <span className="font-mono text-sm uppercase tracking-widest text-slate-300">Screwed (3 upg)</span>
            </label>
          </div>`;

const newPlayerPanel = `<div className="absolute top-0 left-0 w-full p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-center gap-6 z-40 backdrop-blur-md">
             <div className="text-xs text-[var(--hot)] uppercase tracking-widest mr-4 font-bold flex items-center gap-3">
               My Screen:
               <select className="bg-slate-950 border border-slate-700 text-slate-200 p-1 text-xs outline-none focus:border-[var(--hot)]" value={myChar} onChange={e => setMyChar(e.target.value)}>
                 <option value="mushgirl">Mushgirl</option>
                 <option value="screwed">Screwed</option>
               </select>
             </div>
             <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={myUpg1} onChange={e => setMyUpg1(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
              <span className="font-mono text-sm uppercase tracking-widest text-slate-300">{myChar === 'mushgirl' ? 'Shrooms' : 'Scramble'}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={myUpg2} onChange={e => setMyUpg2(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
              <span className="font-mono text-sm uppercase tracking-widest text-slate-300">{myChar === 'mushgirl' ? 'Dyslexia' : 'Sabotage'}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={myUpg3} onChange={e => setMyUpg3(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
              <span className="font-mono text-sm uppercase tracking-widest text-slate-300">{myChar === 'mushgirl' ? 'Blinking' : 'Spam'}</span>
            </label>
          </div>`;

code = code.replace(oldPlayerPanel, newPlayerPanel);

// Update Opponent UI Panel
const oldOppPanel = `<div className="absolute top-0 left-0 w-full p-4 bg-slate-900/80 border-b border-slate-800 flex justify-center gap-6 z-40 backdrop-blur-md">
             <div className="text-xs text-slate-500 uppercase tracking-widest mr-4">Opponent Screen</div>
             <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={oppTripActive} onChange={e => setOppTripActive(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
              <span className="font-mono text-sm uppercase tracking-widest text-slate-300">Shrooms</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={oppDyslexiaActive} onChange={e => setOppDyslexiaActive(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
              <span className="font-mono text-sm uppercase tracking-widest text-slate-300">Dyslexia</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={oppBlinkActive} onChange={e => setOppBlinkActive(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
              <span className="font-mono text-sm uppercase tracking-widest text-slate-300">Blinking</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={oppScrewedActive} onChange={e => setOppScrewedActive(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
              <span className="font-mono text-sm uppercase tracking-widest text-slate-300">Screwed (3 upg)</span>
            </label>
          </div>`;

const newOppPanel = `<div className="absolute top-0 left-0 w-full p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-center gap-6 z-40 backdrop-blur-md">
             <div className="text-xs text-slate-500 uppercase tracking-widest mr-4 font-bold flex items-center gap-3">
               Bot Screen:
               <select className="bg-slate-950 border border-slate-700 text-slate-500 p-1 text-xs outline-none focus:border-slate-500" value={oppChar} onChange={e => setOppChar(e.target.value)}>
                 <option value="mushgirl">Mushgirl</option>
                 <option value="screwed">Screwed</option>
               </select>
             </div>
             <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={oppUpg1} onChange={e => setOppUpg1(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
              <span className="font-mono text-sm uppercase tracking-widest text-slate-300">{oppChar === 'mushgirl' ? 'Shrooms' : 'Scramble'}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={oppUpg2} onChange={e => setOppUpg2(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
              <span className="font-mono text-sm uppercase tracking-widest text-slate-300">{oppChar === 'mushgirl' ? 'Dyslexia' : 'Sabotage'}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={oppUpg3} onChange={e => setOppUpg3(e.target.checked)} className="w-4 h-4 accent-[var(--hot)]" />
              <span className="font-mono text-sm uppercase tracking-widest text-slate-300">{oppChar === 'mushgirl' ? 'Blinking' : 'Spam'}</span>
            </label>
          </div>`;

code = code.replace(oldOppPanel, newOppPanel);

// Update RankedPlayerArea for Player
code = code.replace(
  /dyslexiaActive=\{myDyslexiaActive\}[\s\S]*?characters=\{\["mushgirl", \.\.\.\(myScrewedActive \? \["screwed"\] : \[\]\)\]\}/,
  `dyslexiaActive={myChar === 'mushgirl' ? myUpg2 : false}
              tripActive={myChar === 'mushgirl' ? myUpg1 : false}
              blinkActive={myChar === 'mushgirl' ? myUpg3 : false}
              characters={[myChar]}`
);

// Update RankedPlayerArea for Opponent
code = code.replace(
  /dyslexiaActive=\{oppDyslexiaActive\}[\s\S]*?characters=\{\["mushgirl", \.\.\.\(oppScrewedActive \? \["screwed"\] : \[\]\)\]\}/,
  `dyslexiaActive={oppChar === 'mushgirl' ? oppUpg2 : false}
              tripActive={oppChar === 'mushgirl' ? oppUpg1 : false}
              blinkActive={oppChar === 'mushgirl' ? oppUpg3 : false}
              characters={[oppChar]}`
);

fs.writeFileSync(path, code);
