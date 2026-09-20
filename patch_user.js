const fs = require('fs');
const path = 'backend/src/models/User.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "portalBorder?: string;",
  "portalBorder?: string;\n  bgTheme?: any;"
);

code = code.replace(
  "portalBorder: {",
  "bgTheme: {\n      type: Schema.Types.Mixed,\n      default: null,\n    },\n    portalBorder: {"
);

fs.writeFileSync(path, code);
