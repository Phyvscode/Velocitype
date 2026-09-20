const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

const target = '{/* Top Info Bar */}';
const replacement = `<svg style={{ width: 0, height: 0, position: 'absolute' }}>
        <filter id="warp">
          <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      {/* Top Info Bar */}`;

code = code.replace(target, replacement);

fs.writeFileSync(path, code);
