const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

const newFilter = `<filter id={warpId} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.010" numOctaves="2" seed="3" result="noise">
            <animate attributeName="baseFrequency" dur="12s" repeatCount="indefinite" values="0.006 0.010; 0.012 0.006; 0.006 0.010"/>
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" result="warped"/>
          
          <feColorMatrix in="warped" type="matrix" values="
            1.2 0   0   0 0.5
            0   0.8 0   0 0.1
            0   0   1.5 0 0.8
            0   0   0   1 0" result="colorized" />
            
          <feColorMatrix in="colorized" type="hueRotate" values="0">
            <animate attributeName="values" from="0" to="360" dur="3s" repeatCount="indefinite" />
          </feColorMatrix>
        </filter>`;

code = code.replace(/<filter id=\{warpId\}[\s\S]*?<\/filter>/, newFilter);

fs.writeFileSync(path, code);
