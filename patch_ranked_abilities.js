const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add data-level to the main container
code = code.replace(
  /className=\{\`flex-1 p-4 md:p-8 flex flex-col relative \$\{isOpponent \? 'bg-slate-900\/40' : ''\} \$\{tripActive \? 'trip-body tripping' : ''\} \$\{blinkActive \? 'view-blink blinking' : ''\}\`\}/g,
  `className={\`flex-1 p-4 md:p-8 flex flex-col relative \${isOpponent ? 'bg-slate-900/40' : ''} \${tripActive ? 'trip-body tripping' : ''} \${blinkActive ? 'view-blink blinking' : ''}\`} data-level={tripActive ? "3" : "0"}`
);

// 2. Add trip-text-target to typing container
code = code.replace(
  /<div className="flex-1 relative flex flex-col overflow-visible pt-4 pb-4">/g,
  '<div className={`flex-1 relative flex flex-col overflow-visible pt-4 pb-4 ${tripActive ? "trip-text-target" : ""}`} ref={containerRef}>'
);

// We need to add containerRef to RankedPlayerArea
// Find: const [scrollLines, setScrollLines] = useState(0);
// Add: const containerRef = useRef<HTMLDivElement>(null);
code = code.replace(
  'const [scrollLines, setScrollLines] = useState(0);',
  'const [scrollLines, setScrollLines] = useState(0);\n  const containerRef = useRef<HTMLDivElement>(null);'
);

// Add the dyslexia useEffect
// Find: useLayoutEffect(() => {
// Insert before it.
const dyslexiaEffect = `
  useEffect(() => {
    if (!dyslexiaActive) return;
    let timeout: any;
    const scramble = () => {
      if (containerRef.current) {
        const elems = containerRef.current.querySelectorAll('.dyslexia-char');
        elems.forEach((el: any) => {
          if (Math.random() < 0.2) {
            el.style.setProperty('--fx', Math.random() > 0.5 ? -1 : 1);
            el.style.setProperty('--fy', Math.random() > 0.5 ? -1 : 1);
          }
        });
      }
      timeout = setTimeout(scramble, 400 + Math.random() * 800);
    };
    scramble();
    return () => clearTimeout(timeout);
  }, [dyslexiaActive]);
`;
code = code.replace(
  'useLayoutEffect(() => {',
  `${dyslexiaEffect}\n  useLayoutEffect(() => {`
);

// Fix the render loop dyslexia
// Replace the block:
const oldRenderDyslexia = `                let styleObj: any = isOpponent && color === 'correct-char' ? {} : undefined;
                if (dyslexiaActive && color === 'text-slate-500') {
                  color += ' dyslexia-char';
                  const flipX = Math.random() > 0.5 ? -1 : 1;
                  const flipY = Math.random() > 0.5 ? -1 : 1;
                  styleObj = { ...styleObj, '--fx': flipX, '--fy': flipY };
                }`;

const newRenderDyslexia = `                let styleObj: any = isOpponent && color === 'correct-char' ? {} : undefined;
                if (dyslexiaActive && color === 'text-slate-500') {
                  color += ' dyslexia-char';
                }`;

code = code.replace(oldRenderDyslexia, newRenderDyslexia);

fs.writeFileSync(path, code);
