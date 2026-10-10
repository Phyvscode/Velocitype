const fs = require('fs');
const path = 'src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  '<div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-8 pointer-events-none z-20">',
  '<div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 pointer-events-none z-40 max-h-screen overflow-hidden justify-center">'
);

code = code.replace(
  /w-32 h-32/g,
  'w-24 h-24'
);

code = code.replace(
  /className="h-40 object-cover mt-4"/g,
  'className="h-32 object-cover mt-4"'
);

fs.writeFileSync(path, code);
