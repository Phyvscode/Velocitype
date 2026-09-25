const fs = require('fs');
let file = fs.readFileSync('src/components/RankedMode.tsx', 'utf8');

// Remove the old declaration
file = file.replace(/  const \[startTime, setStartTime\] = useState<number \| null>\(null\);\n/, '');

// Add it before the WPM useEffect
file = file.replace(
  /  const \[myWpm, setMyWpm\] = useState\(0\);\n/,
  `  const [myWpm, setMyWpm] = useState(0);\n  const [startTime, setStartTime] = useState<number | null>(null);\n`
);

fs.writeFileSync('src/components/RankedMode.tsx', file);
