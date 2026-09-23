const fs = require('fs');
let boxTs = fs.readFileSync('frontend/src/components/RankedSandbox.tsx', 'utf8');

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

// Insert the dummy clock after <div className="flex-1 flex flex-col md:flex-row relative w-full h-full">
boxTs = boxTs.replace(
  /<div className="flex-1 flex flex-col md:flex-row relative w-full h-full">/,
  `<div className="flex-1 flex flex-col md:flex-row relative w-full h-full">${clockUI}`
);

fs.writeFileSync('frontend/src/components/RankedSandbox.tsx', boxTs);
