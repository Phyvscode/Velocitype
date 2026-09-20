const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /<div className="absolute bottom-0 left-1\/2 -translate-x-1\/2 pointer-events-none z-10">\n          <img src=\{\`\/characters\/Mushgirl\/girlwithoutmush_000\$\{frame\}\.png\`\} className="h-48 object-contain" alt="Character" \/>\n        <\/div>/g;

const newHTML = `<div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none z-10 flex gap-4">
          {selectedCharacters.map((charId, idx) => (
            <AnimatedCharacter key={idx} id={charId} className="h-48 object-contain" />
          ))}
        </div>`;

code = code.replace(regex, newHTML);

// Remove the dangling `frame` state and interval
const frameStateRegex = /  const \[frame, setFrame\] = useState\(1\);\n\n  useEffect\(\(\) => \{\n    const int = setInterval\(\(\) => setFrame\(f => f >= 8 \? 1 : f \+ 1\), 100\);\n    return \(\) => clearInterval\(int\);\n  \}, \[\]\);\n\n/g;
code = code.replace(frameStateRegex, '');

fs.writeFileSync(path, code);
