const fs = require('fs');
const path = 'src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  '<div className="absolute bottom-0 left-0 w-full p-6 flex justify-between items-end pointer-events-none z-30 bg-gradient-to-t from-background via-background/80 to-transparent">',
  '<div className="fixed bottom-0 left-0 w-full px-12 py-6 flex justify-between items-end pointer-events-none z-30 bg-gradient-to-t from-background via-background/80 to-transparent">'
);

fs.writeFileSync(path, code);
