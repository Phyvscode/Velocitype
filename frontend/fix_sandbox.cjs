const fs = require('fs');

let boxTs = fs.readFileSync('src/components/RankedSandbox.tsx', 'utf8');

// 1. Add Dummy Clock
const clockUI = `
      {/* Dummy Clock for Sandbox Testing */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 bg-slate-900/80 px-6 py-2 rounded-full border border-slate-700 flex flex-col items-center pointer-events-none">
        <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Global Clock</span>
        {mySequence.includes('joker3') ? (
          <div className="font-mono text-xl tracking-widest text-slate-600 uppercase">???</div>
        ) : (
          <div className="font-mono text-2xl tracking-widest text-emerald-400">
            01:30
          </div>
        )}
      </div>
`;
boxTs = boxTs.replace(
  /<div className="flex-1 pt-24 px-8 overflow-hidden flex flex-col">/,
  `${clockUI}\n          <div className="flex-1 pt-24 px-8 overflow-hidden flex flex-col">`
);


// 2. Add Bot Typos
const botTyping = `
    const botInterval = setInterval(() => {
      setOppTypedText(prev => {
        if (prev.length >= oppTargetText.length) {
          clearInterval(botInterval);
          return prev;
        }
        const char = oppTargetText[prev.length];
        if (Math.random() < 0.15) { // 15% typo chance
          let typo = String.fromCharCode(97 + Math.floor(Math.random() * 26));
          if (typo === char) typo = 'x';
          return prev + typo;
        }
        return prev + char;
      });
    }, 150);
`;

boxTs = boxTs.replace(
  /const botInterval = setInterval\(\(\) => \{\n      setOppTypedText\(prev => \{\n        if \(prev.length >= oppTargetText.length\) \{\n          clearInterval\(botInterval\);\n          return prev;\n        \}\n        return prev \+ oppTargetText\[prev.length\];\n      \}\);\n    \}, 150\);/,
  botTyping
);


fs.writeFileSync('src/components/RankedSandbox.tsx', boxTs);
