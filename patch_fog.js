const fs = require('fs');

// 1. Update RankedMode.tsx to render the 5 fog divs
let rm = fs.readFileSync('frontend/src/components/RankedMode.tsx', 'utf8');
rm = rm.replace(
  /<div className="blobs"><\/div>/,
  `<div className="fog fog-1"></div>
          <div className="fog fog-2"></div>
          <div className="fog fog-3"></div>
          <div className="fog fog-4"></div>
          <div className="fog fog-5"></div>`
);
fs.writeFileSync('frontend/src/components/RankedMode.tsx', rm);


// 2. Update RankedSandbox.tsx to do the same
let rs = fs.readFileSync('frontend/src/components/RankedSandbox.tsx', 'utf8');
rs = rs.replace(
  /<div className="blobs"><\/div>/g,
  `<div className="fog fog-1"></div>
          <div className="fog fog-2"></div>
          <div className="fog fog-3"></div>
          <div className="fog fog-4"></div>
          <div className="fog fog-5"></div>`
);
// wait, RankedSandbox might not even render trip-layer itself? It uses RankedPlayerArea which is in RankedMode.tsx.
// So I don't need to patch RankedSandbox.tsx for the DOM change!
// Let's just check if it's there.
if (rs.includes('<div className="blobs"></div>')) {
  fs.writeFileSync('frontend/src/components/RankedSandbox.tsx', rs);
}

// 3. Update trip.css
let css = fs.readFileSync('frontend/src/trip.css', 'utf8');

// We need to add --hue property and animation to .tripping or .trip-body
const hueProperty = `
  @property --hue {
    syntax: "<number>";
    inherits: true;
    initial-value: 0;
  }
  .tripping { animation: hue-cycle 10s linear infinite; }
  @keyframes hue-cycle {
    from { --hue: 0; }
    to   { --hue: 360; }
  }
`;

if (!css.includes('--hue')) {
  css = css.replace(
    /@property --lvl \{/,
    hueProperty + "\n  @property --lvl {"
  );
}

// Replace trip-layer background
css = css.replace(
  /\.trip-layer \{\n    position: absolute;\n    inset: 0;\n    z-index: 50;\n    overflow: hidden;\n    pointer-events: none;\n    opacity: var\(--lvl\);\n  \}/,
  `.trip-layer {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
    opacity: var(--lvl);
    background: linear-gradient(135deg,
      hsl(var(--hue) 75% 48% / .30),
      hsl(calc(var(--hue) + 120) 75% 48% / .30));
  }`
);

// Delete the old trip-hue and blobs
const oldBlobsStart = css.indexOf('.trip-hue {');
const oldBlobsEnd = css.indexOf('.tripping .trip-text-target');
if (oldBlobsStart !== -1 && oldBlobsEnd !== -1) {
  const fogCss = `
  .trip-hue {
    position: absolute;
    inset: 0;
  }
  .fog {
    position: absolute;
    width: 65vmax;
    height: 65vmax;
    border-radius: 50%;
    background: radial-gradient(circle,
      hsl(calc(var(--hue) + var(--off)) 90% 55% / .60) 0%,
      hsl(calc(var(--hue) + var(--off)) 90% 55% / .22) 40%,
      transparent 68%);
    will-change: transform;
  }
  .fog-1 { --off: 0;   top: -20%;   left: -15%;  animation: fog-1 26s ease-in-out infinite alternate; }
  .fog-2 { --off: 72;  top: 15%;    right: -25%; animation: fog-2 33s ease-in-out infinite alternate; }
  .fog-3 { --off: 144; bottom: -30%; left: 5%;   animation: fog-3 39s ease-in-out infinite alternate; }
  .fog-4 { --off: 216; top: 30%;    left: 25%;   animation: fog-4 30s ease-in-out infinite alternate; }
  .fog-5 { --off: 288; top: -35%;   right: 15%;  animation: fog-5 44s ease-in-out infinite alternate; }

  @keyframes fog-1 {
    0%   { transform: translate(0, 0) scale(1); }
    50%  { transform: translate(50vw, 25vh) scale(1.3); }
    100% { transform: translate(15vw, 60vh) scale(.9); }
  }
  @keyframes fog-2 {
    0%   { transform: translate(0, 0) scale(1.1); }
    50%  { transform: translate(-55vw, -10vh) scale(1.25); }
    100% { transform: translate(-20vw, 35vh) scale(1.45); }
  }
  @keyframes fog-3 {
    0%   { transform: translate(0, 0) scale(.9); }
    50%  { transform: translate(40vw, -45vh) scale(1.3); }
    100% { transform: translate(-15vw, -20vh) scale(1.05); }
  }
  @keyframes fog-4 {
    0%   { transform: translate(-20vw, 10vh) scale(1.2); }
    50%  { transform: translate(25vw, -25vh) scale(.85); }
    100% { transform: translate(35vw, 30vh) scale(1.35); }
  }
  @keyframes fog-5 {
    0%   { transform: translate(0, 0) scale(1); }
    50%  { transform: translate(-30vw, 55vh) scale(1.4); }
    100% { transform: translate(25vw, 35vh) scale(1.1); }
  }

  `;
  
  css = css.substring(0, oldBlobsStart) + fogCss + css.substring(oldBlobsEnd);
}

fs.writeFileSync('frontend/src/trip.css', css);
