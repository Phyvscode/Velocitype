const fs = require('fs');

let boxTs = fs.readFileSync('src/components/RankedSandbox.tsx', 'utf8');

// 1. Add timeLeft state and interval
if (!boxTs.includes('timeLeft')) {
  boxTs = boxTs.replace(
    /const \[startTime, setStartTime\] = useState<number \| null>\(null\);/,
    `const [startTime, setStartTime] = useState<number | null>(null);\n  const [timeLeft, setTimeLeft] = useState(120);`
  );
  
  const tickLogic = `
  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      setTimeLeft(t => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return \`0\${m}:\${ss < 10 ? '0' : ''}\${ss}\`;
  };
`;
  boxTs = boxTs.replace(
    /useEffect\(\(\) => \{\n    if \(!startTime\) return;\n    const interval = setInterval\(\(\) => \{/,
    `${tickLogic}\n  useEffect(() => {\n    if (!startTime) return;\n    const interval = setInterval(() => {`
  );
}


// 2. Remove old Dummy Clock
boxTs = boxTs.replace(/\{\/\* Dummy Clock for Sandbox Testing \*\/\}[\s\S]*?<\/div>\n\n/m, '');

// 3. Remove absolute top bars for My Screen and Bot Screen, make them bottom bars
boxTs = boxTs.replace(
  /className="absolute top-0 left-0 w-full p-4 bg-slate-900\/80 border-b border-slate-800 flex flex-wrap items-center justify-center gap-4 z-40 backdrop-blur-md"/g,
  `className="absolute bottom-0 left-0 w-full p-4 bg-slate-900/80 border-t border-slate-800 flex flex-wrap items-center justify-center gap-4 z-40 backdrop-blur-md"`
);

// 4. Add the Global Timer Overlay like Ranked
const timerOverlay = `
      {/* Global Timer Overlay */}
      <div className="absolute top-0 w-full p-4 flex justify-between items-center z-50 pointer-events-none">
        <div className="flex-1" />
        {mySequence.includes('joker3') ? (
          <div className="font-mono text-xl tracking-widest text-slate-600 uppercase">???</div>
        ) : (
          <div className="font-mono text-2xl tracking-widest text-emerald-400">
            {formatTime(timeLeft)}
          </div>
        )}
        <div className="flex-1 flex justify-end"></div>
      </div>
`;
boxTs = boxTs.replace(
  /<div className="flex-1 flex flex-col md:flex-row relative w-full h-full">/,
  `<div className="flex-1 flex flex-col md:flex-row relative w-full h-full">${timerOverlay}`
);

// 5. Change padding of flex-1 to account for bottom bar instead of top bar
boxTs = boxTs.replace(
  /className="flex-1 pt-24 px-8 overflow-hidden flex flex-col"/g,
  `className="flex-1 pt-12 pb-24 px-8 overflow-hidden flex flex-col"`
);

fs.writeFileSync('src/components/RankedSandbox.tsx', boxTs);
