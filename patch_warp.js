const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. We need a unique warpId
// Find: const [scrollLines, setScrollLines] = useState(0);
// Insert after it: const warpId = isOpponent ? "warp-opp" : "warp-me";
code = code.replace(
  'const [scrollLines, setScrollLines] = useState(0);',
  'const [scrollLines, setScrollLines] = useState(0);\n  const warpId = isOpponent ? "warp-opp" : "warp-me";'
);

// 2. We need the useEffect for tweening the warp scale
const tweenWarpCode = `
  useEffect(() => {
    const warpTarget = tripActive ? 22 : 0;
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
  }, [tripActive]);
`;
// Insert before: useLayoutEffect(() => {
code = code.replace(
  'useLayoutEffect(() => {',
  `${tweenWarpCode}\n  useLayoutEffect(() => {`
);

// 3. Render the SVG and apply the inline filter
const svgCode = `
      <svg width="0" height="0" style={{position: 'absolute'}} aria-hidden="true" focusable="false">
        <filter id={warpId} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.010" numOctaves="2" seed="3" result="noise">
            <animate attributeName="baseFrequency" dur="12s" repeatCount="indefinite" values="0.006 0.010; 0.012 0.006; 0.006 0.010"/>
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </svg>
`;

code = code.replace(
  '<div className={`flex-1 relative flex flex-col overflow-visible pt-4 pb-4 ${tripActive ? "trip-text-target" : ""}`} ref={containerRef}>',
  `<div className={\`flex-1 relative flex flex-col overflow-visible pt-4 pb-4 \${tripActive ? "trip-text-target" : ""}\`} ref={containerRef} style={tripActive ? { filter: \`url(#\${warpId})\` } : undefined}>
${svgCode}`
);

fs.writeFileSync(path, code);
