const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /      \{gameState === 'ability_selection' && \([\s\S]*?\)\}\n\n/g;
code = code.replace(regex, '');

// Also remove import
code = code.replace(/import { AbilitySelection, Ability } from '@\/components\/AbilitySelection';\n/g, '');

fs.writeFileSync(path, code);
