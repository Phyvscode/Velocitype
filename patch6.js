const fs = require('fs');

// Patch index.css
const cssPath = 'frontend/src/index.css';
let css = fs.readFileSync(cssPath, 'utf8');
css = css.replace(/--theme-error: #fb7185;/g, '--theme-error: #ef4444;');
fs.writeFileSync(cssPath, css);

// Patch RankedMode.tsx
const rankedPath = 'frontend/src/components/RankedMode.tsx';
let ranked = fs.readFileSync(rankedPath, 'utf8');
ranked = ranked.replace(/text-rose-500/g, 'text-red-500');
fs.writeFileSync(rankedPath, ranked);
