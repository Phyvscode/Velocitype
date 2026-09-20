const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

// Import AnimatedCharacter
code = code.replace(
  "import { getSocket, connectSocket, disconnectSocket } from '../lib/socket';",
  "import { getSocket, connectSocket, disconnectSocket } from '../lib/socket';\nimport { AnimatedCharacter } from './AnimatedCharacter';"
);

// Replace frame state and its useEffect
const frameStateRegex = /  const \[frame, setFrame\] = useState\(1\);\n\n  useEffect\(\(\) => \{\n    const int = setInterval\(\(\) => setFrame\(f => f >= 8 \? 1 : f \+ 1\), 100\);\n    return \(\) => clearInterval\(int\);\n  \}, \[\]\);\n\n/g;
code = code.replace(frameStateRegex, '');

// Replace myCharacter string with selectedCharacters array
code = code.replace(
  "const [myCharacter, setMyCharacter] = useState('mushgirl');",
  "const [selectedCharacters, setSelectedCharacters] = useState<string[]>(['mushgirl']);"
);

// We need to find where handleJoinQueue uses myCharacter and change it
code = code.replace(
  "socket.emit('joinRankedQueue', { language, character: myCharacter });",
  "socket.emit('joinRankedQueue', { language, characters: selectedCharacters });"
);

// Wait, the backend probably expects `character` string right now. I should modify the backend too!

// Let's replace the queue rendering for Character Selection
const oldQueueCharUI = `        <div className="w-full space-y-4">
          <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block text-center">Select Character</label>
          <select 
            value={myCharacter} 
            onChange={e => setMyCharacter(e.target.value)}
            disabled={queueing}
            className="w-full px-4 py-4 bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:border-[var(--hot)] focus:outline-none rounded text-center"
          >
            <option value="mushgirl">Mushgirl</option>
          </select>
        </div>`;

const newQueueCharUI = `        <div className="w-full space-y-4">
          <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block text-center">
            Select Characters (Max 3)
          </label>
          <div className="flex flex-wrap gap-4 justify-center">
            {['mushgirl'].map(charId => {
              const isSelected = selectedCharacters.includes(charId);
              return (
                <div 
                  key={charId}
                  onClick={() => {
                    if (queueing) return;
                    if (isSelected) {
                      setSelectedCharacters(prev => prev.filter(c => c !== charId));
                    } else if (selectedCharacters.length < 3) {
                      setSelectedCharacters(prev => [...prev, charId]);
                    }
                  }}
                  className={\`cursor-pointer border-2 rounded-lg p-2 transition-all \${
                    isSelected ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'border-slate-800 hover:border-slate-600'
                  }\`}
                >
                  <AnimatedCharacter id={charId} className="h-24 w-24 object-contain" />
                </div>
              );
            })}
          </div>
        </div>`;

code = code.replace(oldQueueCharUI, newQueueCharUI);

// Now for the Match screen (bottom rendering)
const oldMatchCharUI = /<div className="absolute bottom-6 left-1\/2 -translate-x-1\/2 z-10">\n            <img src=\{\`\/characters\/Mushgirl\/girlwithoutmush_000\$\{frame\}\.png\`\} className="h-48 object-contain" alt="Character" \/>\n          <\/div>/g;

const newMatchCharUI = `<div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-4">
            {selectedCharacters.map((charId, idx) => (
              <AnimatedCharacter key={idx} id={charId} className="h-48 object-contain" />
            ))}
          </div>`;

code = code.replace(oldMatchCharUI, newMatchCharUI);

fs.writeFileSync(path, code);
