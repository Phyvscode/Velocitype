const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

// Add charge state
code = code.replace(
  "const [myProgress, setMyProgress] = useState(0);",
  "const [myProgress, setMyProgress] = useState(0);\n  const [myCharge, setMyCharge] = useState(0);\n  const [oppCharge, setOppCharge] = useState(0);"
);

// Reset charge on round start
code = code.replace(
  "setMyProgress(0);",
  "setMyProgress(0);\n      setMyCharge(0);\n      setOppCharge(0);"
);

// Update payload in onOpponentProgress
code = code.replace(
  "cia?: {c: number, i: number, a: number} }) => {",
  "cia?: {c: number, i: number, a: number}; charge?: number }) => {"
);
code = code.replace(
  "if (data.cia) setOppCia(data.cia);",
  "if (data.cia) setOppCia(data.cia);\n      if (data.charge !== undefined) setOppCharge(data.charge);"
);

// Calculate charge inside handleTyping
code = code.replace(
  "let tempC = 0, tempI = 0, tempA = 0;",
  "const prevC = myLetterStatesRef.current.filter(x => x === 1).length;\n    let tempC = 0, tempI = 0, tempA = 0;"
);

const emitCode = `    socket.emit('updateRankedProgress', { 
      matchId: matchData.matchId, 
      progress, 
      wpm,
      typedText: val,
      activeKeys: Array.from(activeKeys),
      targetText: target,
      cia: newCia,`;

const replaceEmitCode = `    const correctDelta = tempC - prevC;
    let newCharge = myCharge;
    if (correctDelta > 0) {
      newCharge = Math.min(100, myCharge + correctDelta);
      setMyCharge(newCharge);
    }
    
    socket.emit('updateRankedProgress', { 
      matchId: matchData.matchId, 
      progress, 
      wpm,
      typedText: val,
      activeKeys: Array.from(activeKeys),
      targetText: target,
      cia: newCia,
      charge: newCharge,`;
      
code = code.replace(emitCode, replaceEmitCode);

// Add charge to RankedPlayerArea component
code = code.replace(
  "cia?: {c: number, i: number, a: number} | null;\n}",
  "cia?: {c: number, i: number, a: number} | null;\n  charge: number;\n}"
);

code = code.replace(
  "cia }: RankedPlayerAreaProps) {",
  "cia, charge }: RankedPlayerAreaProps) {"
);

// Render charge battery in RankedPlayerArea
const batteryCode = `
      {/* Battery Charge Meter */}
      <div className="absolute bottom-6 left-6 flex items-center gap-2">
        <div className="w-8 h-4 rounded-sm border-2 border-slate-700 relative overflow-hidden flex bg-slate-900/50">
          <div 
            className="h-full bg-emerald-500 transition-all duration-200" 
            style={{ width: \`\${charge}%\` }}
          />
          <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-[3px] h-2 bg-slate-700 rounded-r-sm" />
        </div>
        <span className="font-mono text-xs text-slate-500">{charge}%</span>
      </div>
    </div>
  );
}
`;

code = code.replace(
  "    </div>\n  );\n}\n",
  batteryCode
);

// Pass charge to RankedPlayerArea
code = code.replace(
  "cia={myCia}\n        />",
  "cia={myCia}\n          charge={myCharge}\n        />"
);

code = code.replace(
  "cia={oppCia}\n        />",
  "cia={oppCia}\n          charge={oppCharge}\n        />"
);

fs.writeFileSync(path, code);
