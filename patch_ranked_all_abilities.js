const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

// Dyslexia Fix: Instead of 20% of all chars, pick just 3-8 chars every 900ms and revert them after 1-2.5s.
const newDyslexiaEffect = `
  useEffect(() => {
    if (!dyslexiaActive) return;
    const interval = setInterval(() => {
      if (!containerRef.current) return;
      const letters = Array.from(containerRef.current.querySelectorAll('.dyslexia-char')) as HTMLElement[];
      if (!letters.length) return;
      
      const n = 3 + Math.floor(Math.random() * 6); // 3 to 8 letters
      for (let i = 0; i < n; i++) {
        const ch = letters[Math.floor(Math.random() * letters.length)];
        if (ch.dataset.busy) continue;
        ch.dataset.busy = "1";
        
        const prop = Math.random() < 0.5 ? "--fy" : "--fx";
        ch.style.setProperty(prop, "-1");
        
        setTimeout(() => {
          ch.style.removeProperty(prop);
          delete ch.dataset.busy;
        }, 1200 + Math.random() * 1400); // 1.2s to 2.6s
      }
    }, 900);
    
    return () => clearInterval(interval);
  }, [dyslexiaActive]);
`;

code = code.replace(
  /useEffect\(\(\) => \{\n    if \(!dyslexiaActive\) return;\n    let timeout: any;[\s\S]*?return \(\) => clearTimeout\(timeout\);\n  \}, \[dyslexiaActive\]\);/,
  newDyslexiaEffect
);

// Blink Fix: Randomly blink or flicker every 2s
// We need a blinkStyle state in RankedPlayerArea.
// Add state: const [blinkStyle, setBlinkStyle] = useState('');
code = code.replace(
  'const [tripLevel, setTripLevel] = useState(0);',
  'const [tripLevel, setTripLevel] = useState(0);\n  const [blinkStyle, setBlinkStyle] = useState("");'
);

const newBlinkEffect = `
  useEffect(() => {
    if (!blinkActive) {
      setBlinkStyle('');
      return;
    }
    const STYLES = ['blinking', 'flickering'];
    let active = false;
    
    const rollBlink = () => {
      if (active) return;
      if (Math.random() < 0.3) {
        active = true;
        const style = STYLES[Math.floor(Math.random() * STYLES.length)];
        setBlinkStyle(style);
        setTimeout(() => {
          setBlinkStyle('');
          active = false;
        }, 5000); // Wait enough time for either animation to finish (flicker is 5s, blink is 2s)
      }
    };
    
    const interval = setInterval(rollBlink, 2000);
    return () => clearInterval(interval);
  }, [blinkActive]);
`;

// Insert the blink effect right after the Dyslexia effect
code = code.replace(
  /\}, \[dyslexiaActive\]\);/,
  `}, [dyslexiaActive]);\n\n${newBlinkEffect}`
);


// And apply blinkStyle instead of hardcoded blink class
code = code.replace(
  /\$\{blinkActive \? 'view-blink blinking' : ''\}/g,
  `\${blinkActive ? 'view-blink ' + blinkStyle : ''}`
);

fs.writeFileSync(path, code);
