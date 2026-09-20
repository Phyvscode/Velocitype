const fs = require('fs');
const path = 'backend/src/services/socketService.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/                    p\.selectedAbility = undefined;\n                    p\.activeAbility = undefined;\n/g, '');

fs.writeFileSync(path, code);
