const fs = require('fs');
const path = 'frontend/src/trip.css';
let code = fs.readFileSync(path, 'utf8');

const driftAnim = `@keyframes drift {
    0%   { transform: translate(0, 0) scale(1) rotate(0deg); }
    50%  { transform: translate(6%, -5%) scale(1.15) rotate(20deg); }
    100% { transform: translate(-6%, 5%) scale(1.05) rotate(-15deg); }
  }`;

const newDriftAnim = `@keyframes drift {
    0%   { transform: translate(0, 0) scale(1) rotate(0deg); }
    25%  { transform: translate(15%, -10%) scale(1.4) rotate(45deg); }
    50%  { transform: translate(-10%, 15%) scale(0.9) rotate(90deg); }
    75%  { transform: translate(10%, 10%) scale(1.5) rotate(45deg); }
    100% { transform: translate(-15%, -15%) scale(1.1) rotate(0deg); }
  }`;

code = code.replace(driftAnim, newDriftAnim);

code = code.replace(
  /animation: drift 18s ease-in-out infinite alternate;/,
  "animation: drift 5s ease-in-out infinite alternate;"
);

code = code.replace(
  /animation: hue 16s linear infinite;/,
  "animation: hue 2s linear infinite;"
);

// I will also revert the text breathe animation to normal if the user didn't want the text to bounce around?
// They said "i dont mean the text colors, i mean the screen blurry colors" - they might have liked the text breathing, or didn't care. I'll leave the text breathe as is since it was fine before I made it super crazy. Actually I made the text breathe crazy in the last step. Let's tone down the text breathe to what it was.
code = code.replace(
  /\.tripping \.trip-text-target \{ transform-origin: 50% 50%; animation: breathe 4s ease-in-out infinite; \}/,
  ".tripping .trip-text-target { transform-origin: 0 60%; animation: breathe 7s ease-in-out infinite;  }"
);
code = code.replace(
  /\.tripping \.trip-text-glow \{ animation: glow 3s linear infinite; \}/,
  ".tripping .trip-text-glow { animation: glow 12s linear infinite; }"
);
const crazyBreathe = `@keyframes breathe {
  0%, 100% { transform: scale(1) translate(0, 0) rotate(0deg); }
  25%      { transform: scale(calc(1 + var(--lvl) * .02)) translate(calc(var(--lvl) * 1%), calc(var(--lvl) * -1%)) rotate(calc(var(--lvl) * .5deg)); }
  50%      { transform: scale(calc(1 + var(--lvl) * .015)) translate(calc(var(--lvl) * -1.5%), calc(var(--lvl) * 1%)) rotate(calc(var(--lvl) * -.7deg)); }
  75%      { transform: scale(calc(1 + var(--lvl) * .03)) translate(calc(var(--lvl) * .5%), calc(var(--lvl) * -2%)) rotate(calc(var(--lvl) * .3deg)); }
}`;
const normalBreathe = `@keyframes breathe {
    0%, 100% { transform: scale(1) rotate(0deg); }
    50%      { transform: scale(calc(1 + var(--lvl) * .015)) rotate(calc(var(--lvl) * -.2deg)); }
  }`;
code = code.replace(crazyBreathe, normalBreathe);

const newGlow = `@keyframes glow {
  0%, 100% { 
    text-shadow: 0 0 .25em rgba(255, 80, 170, calc(var(--lvl) * .8)); 
  }
  33% { 
    text-shadow: 0 0 .25em rgba(60, 220, 255, calc(var(--lvl) * .8)); 
  }
  66% { 
    text-shadow: 0 0 .25em rgba(170, 255, 70, calc(var(--lvl) * .75)); 
  }
}`;
const oldGlow = `@keyframes glow {
    0%, 100% { text-shadow: 0 0 .25em rgba(255, 80, 170, calc(var(--lvl) * .8)); }
    33%      { text-shadow: 0 0 .25em rgba(60, 220, 255, calc(var(--lvl) * .8)); }
    66%      { text-shadow: 0 0 .25em rgba(170, 255, 70, calc(var(--lvl) * .75)); }
  }`;
code = code.replace(newGlow, oldGlow);


fs.writeFileSync(path, code);
