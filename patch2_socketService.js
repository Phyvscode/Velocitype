const fs = require('fs');
const path = 'backend/src/services/socketService.ts';
const lines = fs.readFileSync(path, 'utf8').split('\n');

const filtered = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes("socket.on('rankedSelectAbility'")) {
    skip = true;
  }
  if (line.includes("socket.on('rankedTimeStop'")) {
    skip = true;
  }
  if (line.includes("socket.on('rankedScreenFlash'")) {
    skip = true;
  }
  
  if (!skip) {
    filtered.push(line);
  }
  
  if (skip && line === '    });') {
    skip = false;
  }
}

fs.writeFileSync(path, filtered.join('\n'));
