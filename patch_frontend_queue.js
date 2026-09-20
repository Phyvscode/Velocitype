const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "fontFamily: user.fontFamily,\n    });",
  "fontFamily: user.fontFamily,\n      characters: selectedCharacters\n    });"
);

fs.writeFileSync(path, code);
