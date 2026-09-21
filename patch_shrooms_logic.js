const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. We need state to track the trip level inside RankedPlayerArea
// Find: const [scrollLines, setScrollLines] = useState(0);
// Insert after it: const [tripLevel, setTripLevel] = useState(0);
code = code.replace(
  'const [scrollLines, setScrollLines] = useState(0);',
  'const [scrollLines, setScrollLines] = useState(0);\n  const [tripLevel, setTripLevel] = useState(0);'
);

// 2. Add the trip level interval logic
const tripEffectCode = `
  useEffect(() => {
    if (!tripActive) {
      setTripLevel(0);
      return;
    }
    setTripLevel(1); // start at level 1 (or 0 internally, but let's say 1 to match data-level="1")
    let currentLevel = 0;
    
    const rollLevel = () => {
      const r = Math.random();
      if (r < 0.6) currentLevel = Math.min(2, currentLevel + 1); // 60% chance to go up
      else if (r < 0.8) currentLevel = Math.max(0, currentLevel - 1); // 20% chance to go down
      
      setTripLevel(currentLevel + 1); // mapping 0,1,2 to data-level 1,2,3
    };
    
    const interval = setInterval(rollLevel, 3000);
    return () => clearInterval(interval);
  }, [tripActive]);
`;

// Insert it before the dyslexia effect
code = code.replace(
  'useEffect(() => {\n    if (!dyslexiaActive) return;',
  `${tripEffectCode}\n  useEffect(() => {\n    if (!dyslexiaActive) return;`
);

// 3. Apply the tripLevel to data-level instead of "3"
code = code.replace(
  /data-level=\{tripActive \? "3" : "0"\}/g,
  `data-level={tripActive ? String(tripLevel) : "0"}`
);

// 4. Update the tweening logic to use the correct MAX_WARP multiplier
// In the user code: MAX_WARP * [0.35, 0.7, 1][level]
// So for tripLevel 1,2,3 we use 0.35, 0.7, 1
const newTweenLogic = `
  useEffect(() => {
    // 0 = 0, 1 = 0.35, 2 = 0.7, 3 = 1.0
    const multipliers = [0, 0.35, 0.7, 1];
    const targetScale = tripActive ? 22 * (multipliers[tripLevel] || 0) : 0;
    
    const warpTarget = targetScale;
    let warpNow = 0;
    let warpRaf: any;
    const warpEl = containerRef.current?.querySelector('feDisplacementMap');
    
    const tweenWarp = () => {
      if (!warpEl) return;
      warpNow += (warpTarget - warpNow) * 0.04;
      if (Math.abs(warpTarget - warpNow) < 0.05) warpNow = warpTarget;
      warpEl.setAttribute("scale", warpNow.toFixed(2));
      
      if (warpNow !== warpTarget) {
        warpRaf = requestAnimationFrame(tweenWarp);
      }
    };
    
    warpRaf = requestAnimationFrame(tweenWarp);
    return () => cancelAnimationFrame(warpRaf);
  }, [tripActive, tripLevel]);
`;

// Find the old tween effect and replace it
code = code.replace(
  /useEffect\(\(\) => \{\n    const warpTarget = tripActive \? 22 : 0;\n    let warpNow = 0;[\s\S]*?\}, \[tripActive\]\);/m,
  newTweenLogic
);


fs.writeFileSync(path, code);
