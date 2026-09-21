const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldFilter = `<filter id={warpId} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.010" numOctaves="2" seed="3" result="noise">
            <animate attributeName="baseFrequency" dur="12s" repeatCount="indefinite" values="0.006 0.010; 0.012 0.006; 0.006 0.010"/>
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G"/>
        </filter>`;

// We add a hueRotate to the result of the displacement map
const newFilter = `<filter id={warpId} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.010" numOctaves="2" seed="3" result="noise">
            <animate attributeName="baseFrequency" dur="12s" repeatCount="indefinite" values="0.006 0.010; 0.012 0.006; 0.006 0.010"/>
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" result="warped"/>
          <feColorMatrix in="warped" type="hueRotate" values="0">
            <animate attributeName="values" from="0" to="360" dur="5s" repeatCount="indefinite" />
          </feColorMatrix>
        </filter>`;

code = code.replace(oldFilter, newFilter);

fs.writeFileSync(path, code);
