const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/const WarpFilter = React\.memo\(\(\{ id \}: \{ id: string \}\) => \([\s\S]*?\)\);\n\n\n/, '');

fs.writeFileSync(path, code);
