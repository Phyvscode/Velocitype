const fs = require('fs');

let boxTs = fs.readFileSync('src/components/RankedSandbox.tsx', 'utf8');

const logic = `
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

if (!boxTs.includes('const formatTime =')) {
  boxTs = boxTs.replace(
    /const \[timeLeft, setTimeLeft\] = useState\(120\);/,
    `const [timeLeft, setTimeLeft] = useState(120);\n${logic}`
  );
  fs.writeFileSync('src/components/RankedSandbox.tsx', boxTs);
}
