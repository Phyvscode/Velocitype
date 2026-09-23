const fs = require('fs');

let boxTs = fs.readFileSync('frontend/src/components/RankedSandbox.tsx', 'utf8');

// 1. Add Joker 1, 2, 3 checkboxes for My Screen
const myChecks = `            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={mySequence.includes('spam')} onChange={() => toggleSeq(mySequence, setMySequence, 'spam')} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Spam</span>
            </label>`;
            
const myJokerChecks = myChecks + `
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={mySequence.includes('joker1')} onChange={() => toggleSeq(mySequence, setMySequence, 'joker1')} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Delusion</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={mySequence.includes('joker2')} onChange={() => toggleSeq(mySequence, setMySequence, 'joker2')} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Blindness</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={mySequence.includes('joker3')} onChange={() => toggleSeq(mySequence, setMySequence, 'joker3')} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Amnesia</span>
            </label>`;

boxTs = boxTs.replace(myChecks, myJokerChecks);

// 2. Add Joker 1, 2, 3 checkboxes for Bot Screen
const oppChecks = `            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={oppSequence.includes('spam')} onChange={() => toggleSeq(oppSequence, setOppSequence, 'spam')} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Spam</span>
            </label>`;

const oppJokerChecks = oppChecks + `
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={oppSequence.includes('joker1')} onChange={() => toggleSeq(oppSequence, setOppSequence, 'joker1')} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Delusion</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={oppSequence.includes('joker2')} onChange={() => toggleSeq(oppSequence, setOppSequence, 'joker2')} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Blindness</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={oppSequence.includes('joker3')} onChange={() => toggleSeq(oppSequence, setOppSequence, 'joker3')} className="w-3 h-3 accent-[var(--hot)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">Amnesia</span>
            </label>`;

boxTs = boxTs.replace(oppChecks, oppJokerChecks);

// 3. Pass Joker states to RankedPlayerArea for My Area
boxTs = boxTs.replace(
  /blinkActive=\{mySequence\.includes\('blinking'\)\}\n              characters=\{\['mushgirl', 'screwed'\]\}/,
  `blinkActive={mySequence.includes('blinking')}
              joker1Active={mySequence.includes('joker1')}
              joker2Active={mySequence.includes('joker2')}
              joker3Active={mySequence.includes('joker3')}
              characters={['mushgirl', 'screwed', 'joker']}`
);

// 4. Pass Joker states to RankedPlayerArea for Bot Area
boxTs = boxTs.replace(
  /blinkActive=\{oppSequence\.includes\('blinking'\)\}\n              characters=\{\['mushgirl', 'screwed'\]\}/,
  `blinkActive={oppSequence.includes('blinking')}
              joker1Active={oppSequence.includes('joker1')}
              joker2Active={oppSequence.includes('joker2')}
              joker3Active={oppSequence.includes('joker3')}
              characters={['mushgirl', 'screwed', 'joker']}`
);

fs.writeFileSync('frontend/src/components/RankedSandbox.tsx', boxTs);
