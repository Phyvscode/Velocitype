const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

// Add warpNowRef to RankedPlayerArea
code = code.replace(
  'const [blinkStyle, setBlinkStyle] = useState("");',
  'const [blinkStyle, setBlinkStyle] = useState("");\n  const warpNowRef = useRef(0);'
);

// Rewrite the useEffect
const oldTween = `  useEffect(() => {
    // 0 = 0, 1 = 0.35, 2 = 0.7, 3 = 1.0
    const multipliers = [0, 0.35, 0.7, 1];
    const targetScale = tripActive ? 16 * (multipliers[tripLevel] || 0) : 0;
    
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
  }, [tripActive, tripLevel]);`;

const newTween = `  useEffect(() => {
    // 0 = 0, 1 = 0.35, 2 = 0.7, 3 = 1.0
    const multipliers = [0, 0.35, 0.7, 1];
    const targetScale = tripActive ? 16 * (multipliers[tripLevel] || 0) : 0;
    
    const warpTarget = targetScale;
    let warpRaf: any;
    const warpEl = containerRef.current?.querySelector('feDisplacementMap');
    
    const tweenWarp = () => {
      if (!warpEl) return;
      warpNowRef.current += (warpTarget - warpNowRef.current) * 0.04;
      if (Math.abs(warpTarget - warpNowRef.current) < 0.05) warpNowRef.current = warpTarget;
      warpEl.setAttribute("scale", warpNowRef.current.toFixed(2));
      
      if (warpNowRef.current !== warpTarget) {
        warpRaf = requestAnimationFrame(tweenWarp);
      }
    };
    
    warpRaf = requestAnimationFrame(tweenWarp);
    return () => cancelAnimationFrame(warpRaf);
  }, [tripActive, tripLevel]);`;

code = code.replace(oldTween, newTween);

fs.writeFileSync(path, code);
