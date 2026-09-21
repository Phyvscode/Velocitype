const fs = require('fs');
const path = 'frontend/src/trip.css';
let code = fs.readFileSync(path, 'utf8');

const driftAnim = `@keyframes drift {
    0%   { transform: translate(0, 0) scale(1) rotate(0deg); }
    25%  { transform: translate(15%, -10%) scale(1.4) rotate(45deg); }
    50%  { transform: translate(-10%, 15%) scale(0.9) rotate(90deg); }
    75%  { transform: translate(10%, 10%) scale(1.5) rotate(45deg); }
    100% { transform: translate(-15%, -15%) scale(1.1) rotate(0deg); }
  }`;

const oldDriftAnim = `@keyframes drift {
    0%   { transform: translate(0, 0) scale(1) rotate(0deg); }
    50%  { transform: translate(6%, -5%) scale(1.15) rotate(20deg); }
    100% { transform: translate(-6%, 5%) scale(1.05) rotate(-15deg); }
  }`;

code = code.replace(driftAnim, oldDriftAnim);

code = code.replace(
  /animation: drift 5s ease-in-out infinite alternate;/,
  "animation: drift 18s ease-in-out infinite alternate;"
);

code = code.replace(
  /animation: hue 2s linear infinite;/,
  "animation: hue 16s linear infinite;"
);

fs.writeFileSync(path, code);
