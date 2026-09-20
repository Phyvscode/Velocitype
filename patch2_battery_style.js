const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /<div className="w-8 h-4 rounded-sm border-2 border-slate-700 relative overflow-hidden flex bg-slate-900\/50">[\s\S]*?<\/div>/;

const newBattery = `<div className="relative flex items-center">
          <div className="w-10 h-4 rounded-sm border-2 border-slate-700 relative overflow-hidden flex bg-slate-900/50">
            <div 
              className="h-full bg-[var(--hot)] transition-all duration-200" 
              style={{ width: \`\${charge}%\` }}
            />
          </div>
          <div className="w-[3px] h-2 bg-slate-700 rounded-r-sm" />
        </div>`;

code = code.replace(regex, newBattery);
fs.writeFileSync(path, code);
