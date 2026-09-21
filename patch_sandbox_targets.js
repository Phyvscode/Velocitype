const fs = require('fs');
const path = 'frontend/src/components/RankedSandbox.tsx';
let code = fs.readFileSync(path, 'utf8');

// Fix the typo myTargetText={myTargetText} back to targetText={myTargetText}
code = code.replace(/myTargetText=\{myTargetText\}/, "targetText={myTargetText}");

// Fix the opponent's area myTargetText={myTargetText} to targetText={oppTargetText}
// Also fix the progress calculation for opponent
code = code.replace(
  /progress=\{\(oppTypedText\.length \/ Math\.max\(1, myTargetText\.length\)\) \* 100\}\n              myTargetText=\{myTargetText\}/,
  "progress={(oppTypedText.length / Math.max(1, oppTargetText.length)) * 100}\n              targetText={oppTargetText}"
);

// Fix the useEffect dependency array for handleKeyDown: [oppTargetText] should be [myTargetText]
code = code.replace(
  /window\.removeEventListener\('keyup', handleKeyUp\);\n    \};\n  \}, \[oppTargetText\]\);/,
  "window.removeEventListener('keyup', handleKeyUp);\n    };\n  }, [myTargetText]);"
);

fs.writeFileSync(path, code);
