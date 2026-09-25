const fs = require('fs');

// 1. Fix RankedMode.tsx to add ??? logic
let rm = fs.readFileSync('frontend/src/components/RankedMode.tsx', 'utf8');
rm = rm.replace(
  /              \{timeLeft\}\n              <span className="text-xs text-\[var\(--hot\)\] font-mono mt-1">SEC<\/span>/,
  `              {oppAbilities.includes('joker3') ? (
                <div className="text-4xl text-slate-600 mt-2">???</div>
              ) : (
                <>
                  {timeLeft}
                  <span className="text-xs text-[var(--hot)] font-mono mt-1">SEC</span>
                </>
              )}`
);
fs.writeFileSync('frontend/src/components/RankedMode.tsx', rm);

// 2. Fix RankedSandbox.tsx clock & timer
let rs = fs.readFileSync('frontend/src/components/RankedSandbox.tsx', 'utf8');

// Fix the timer logic
rs = rs.replace(
  /  useEffect\(\(\) => \{\n    if \(\!startTime\) return;\n    const interval = setInterval\(\(\) => \{\n      setTimeLeft\(t => Math\.max\(0, t - 1\)\);\n    \}, 1000\);\n    return \(\) => clearInterval\(interval\);\n  \}, \[startTime\]\);/,
  `  useEffect(() => {
    setStartTime(Date.now());
  }, []);

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) return 120;
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);`
);

// Replace the top clock with the center divider
const oldClockStart = rs.indexOf('{/* Global Clock Overlay */}');
const oldClockEnd = rs.indexOf('</div>', oldClockStart + 100) + 6; // finds the first closing div of the top bar
// actually let's just use regex

rs = rs.replace(
  /        \{\/\* Global Clock Overlay \*\/\}(.|\n)*?        \{\/\* PLAYER SIDE \*\/\}/m,
  `        {/* Center Divider - with timer shifted down */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2 z-30 pointer-events-none flex flex-col justify-end pb-32">
          {/* Explicit white separator line */}
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/50 -translate-x-1/2 z-20 pointer-events-none" />
          
          <div className="bg-background border-2 border-white rounded-full w-24 h-24 flex flex-col items-center justify-center font-display text-3xl text-slate-100 shadow-[0_0_20px_rgba(255,255,255,0.1)] z-30 pointer-events-auto relative">
            {mySequence.includes('joker3') ? (
              <div className="text-4xl text-slate-600 mt-2">???</div>
            ) : (
              <>
                {timeLeft}
                <span className="text-xs text-[var(--hot)] font-mono mt-1">SEC</span>
              </>
            )}
          </div>
        </div>

        {/* PLAYER SIDE */}`
);

fs.writeFileSync('frontend/src/components/RankedSandbox.tsx', rs);
