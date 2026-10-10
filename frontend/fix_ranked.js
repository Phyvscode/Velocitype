const fs = require('fs');
let content = fs.readFileSync('src/components/RankedMode.tsx', 'utf8');

content = content.replace(/upgrades: newSocketAbilities/g, 'upgrades: newAbilities');
content = content.replace(/\{myUpgrades === 3 && \(/g, '{myAbilities.length >= 3 && (');

fs.writeFileSync('src/components/RankedMode.tsx', content);
console.log("Fixed RankedMode.tsx variables");
