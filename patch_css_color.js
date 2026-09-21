const fs = require('fs');
const path = 'frontend/src/trip.css';
let code = fs.readFileSync(path, 'utf8');

const newGlow = `@keyframes glow {
    0%, 100% { 
      text-shadow: 0 0 .25em rgba(255, 80, 170, calc(var(--lvl) * .8)); 
      color: hsl(330, 100%, 75%);
    }
    33% { 
      text-shadow: 0 0 .25em rgba(60, 220, 255, calc(var(--lvl) * .8)); 
      color: hsl(190, 100%, 75%);
    }
    66% { 
      text-shadow: 0 0 .25em rgba(170, 255, 70, calc(var(--lvl) * .75)); 
      color: hsl(90, 100%, 75%);
    }
  }`;

code = code.replace(/@keyframes glow \{[\s\S]*?\}/, newGlow);

// Also make the breathe animation more intense for "its positions"
const newBreathe = `@keyframes breathe {
    0%, 100% { transform: scale(1) translate(0, 0) rotate(0deg); }
    25%      { transform: scale(calc(1 + var(--lvl) * .02)) translate(calc(var(--lvl) * 1%), calc(var(--lvl) * -1%)) rotate(calc(var(--lvl) * .5deg)); }
    50%      { transform: scale(calc(1 + var(--lvl) * .015)) translate(calc(var(--lvl) * -1.5%), calc(var(--lvl) * 1%)) rotate(calc(var(--lvl) * -.7deg)); }
    75%      { transform: scale(calc(1 + var(--lvl) * .03)) translate(calc(var(--lvl) * .5%), calc(var(--lvl) * -2%)) rotate(calc(var(--lvl) * .3deg)); }
  }`;

code = code.replace(/@keyframes breathe \{[\s\S]*?\}/, newBreathe);

// Make trip-text-glow faster
code = code.replace(/\.tripping \.trip-text-glow \{ animation: glow 12s linear infinite; \}/, ".tripping .trip-text-glow { animation: glow 3s linear infinite; }");
code = code.replace(/\.tripping \.trip-text-target \{ transform-origin: 0 60%; animation: breathe 7s ease-in-out infinite;  \}/, ".tripping .trip-text-target { transform-origin: 50% 50%; animation: breathe 4s ease-in-out infinite; }");

fs.writeFileSync(path, code);
