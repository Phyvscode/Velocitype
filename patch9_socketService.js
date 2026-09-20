const fs = require('fs');
const path = 'backend/src/services/socketService.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/  abilityChoices\?: RankedAbility\[\];\n  selectedAbility\?: RankedAbility;\n  activeAbility\?: RankedAbility;\n/g, '');
code = code.replace(/type RankedAbility = 'longer_words' \| 'scribberish' \| 'no_color_change' \| 'word_shuffle' \| 'opponent_mistakes' \| 'time_stop' \| 'screen_flash';\n\n/g, '');

fs.writeFileSync(path, code);
