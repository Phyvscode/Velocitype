const fs = require('fs');

let file = fs.readFileSync('frontend/src/components/AnimatedCharacter.tsx', 'utf8');

file = file.replace(
  `const frameCount = id === 'screwed' ? 42 : 8;`,
  `const frameCount = id === 'screwed' ? 42 : id === 'joker' ? 6 : 8;`
);

file = file.replace(
  `} else if (id === 'screwed') {`,
  `} else if (id === 'screwed') {`
); // just checking it exists

file = file.replace(
  `} else if (id === 'screwed') {
    const frameStr = String(frame).padStart(4, '0');
    src = \`/characters/Screwed/screwed_\${frameStr}.png\`;
  }`,
  `} else if (id === 'screwed') {
    const frameStr = String(frame).padStart(4, '0');
    src = \`/characters/Screwed/screwed_\${frameStr}.png\`;
  } else if (id === 'joker') {
    const frameStr = String(frame).padStart(4, '0');
    src = \`/characters/joker/joker-new_\${frameStr}.png\`;
  }`
);

fs.writeFileSync('frontend/src/components/AnimatedCharacter.tsx', file);
