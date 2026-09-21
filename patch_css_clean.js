const fs = require('fs');
const path = 'frontend/src/trip.css';
let code = fs.readFileSync(path, 'utf8');

// I will just replace the entire end of the file starting from .tripping .trip-text-target
const marker = ".tripping .trip-text-target {";
const idx = code.indexOf(marker);
if (idx !== -1) {
  code = code.substring(0, idx);
}

const newCss = `.tripping .trip-text-target { transform-origin: 50% 50%; animation: breathe 4s ease-in-out infinite; }
.tripping .trip-text-glow { animation: glow 3s linear infinite; }
  
@keyframes breathe {
  0%, 100% { transform: scale(1) translate(0, 0) rotate(0deg); }
  25%      { transform: scale(calc(1 + var(--lvl) * .02)) translate(calc(var(--lvl) * 1%), calc(var(--lvl) * -1%)) rotate(calc(var(--lvl) * .5deg)); }
  50%      { transform: scale(calc(1 + var(--lvl) * .015)) translate(calc(var(--lvl) * -1.5%), calc(var(--lvl) * 1%)) rotate(calc(var(--lvl) * -.7deg)); }
  75%      { transform: scale(calc(1 + var(--lvl) * .03)) translate(calc(var(--lvl) * .5%), calc(var(--lvl) * -2%)) rotate(calc(var(--lvl) * .3deg)); }
}

@keyframes glow {
  0%, 100% { 
    text-shadow: 0 0 .25em rgba(255, 80, 170, calc(var(--lvl) * .8)); 
  }
  33% { 
    text-shadow: 0 0 .25em rgba(60, 220, 255, calc(var(--lvl) * .8)); 
  }
  66% { 
    text-shadow: 0 0 .25em rgba(170, 255, 70, calc(var(--lvl) * .75)); 
  }
}

.dyslexia-char {
  display: inline-block;
  scale: var(--fx, 1) var(--fy, 1);
  transition: scale .35s ease;
}
`;

fs.writeFileSync(path, code + newCss);
