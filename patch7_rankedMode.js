const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /      if \(myActiveAbility === 'time_stop'\) \{[\s\S]*?setMyTargetText\(target\);\n      \}\n/g;
code = code.replace(regex, '');

fs.writeFileSync(path, code);
