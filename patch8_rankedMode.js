const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/        \{isScreenFlashed && \(\n          <div className="absolute inset-0 bg-black z-40 pointer-events-none transition-opacity duration-150" \/>\n        \)\}\n/g, '');

fs.writeFileSync(path, code);
