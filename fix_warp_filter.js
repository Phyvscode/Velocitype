const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

// Fix the WarpFilter component definition
const correctWarpFilter = `
const WarpFilter = React.memo(({ id }: { id: string }) => (
  <svg width="0" height="0" style={{position: 'absolute'}} aria-hidden="true" focusable="false">
    <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.006 0.010" numOctaves="2" seed="3" result="noise">
        <animate attributeName="baseFrequency" dur="12s" repeatCount="indefinite" values="0.006 0.010; 0.012 0.006; 0.006 0.010"/>
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </svg>
));
`;

code = code.replace(
  /const WarpFilter = React\.memo\(\(\{ id \}: \{ id: string \}\) => \(\n  <WarpFilter id=\{warpId\} \/>\n\)\);/,
  correctWarpFilter
);

// Add React import
if (!code.includes("import React, {")) {
  code = code.replace("import {", "import React, {");
}

fs.writeFileSync(path, code);
