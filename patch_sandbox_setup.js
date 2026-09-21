const fs = require('fs');
const path = 'frontend/src/components/SetupScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  '  onOpenRanked: () => void;',
  '  onOpenRanked: () => void;\n  onOpenRankedTest: () => void;'
);

code = code.replace(
  '  onOpenRanked,\n  onLobbyJoined,',
  '  onOpenRanked,\n  onOpenRankedTest,\n  onLobbyJoined,'
);

const rankedBtnRegex = /<button\s+onClick=\{onOpenRanked\}[\s\S]*?<\/button>/;
const match = code.match(rankedBtnRegex);
if (match) {
  const rankedBtn = match[0];
  const testBtn = rankedBtn
    .replace('onOpenRanked', 'onOpenRankedTest')
    .replace('>Ranked<', '>Ranked Sandbox<')
    .replace('>Climb the ladder<', '>Test Abilities<')
    .replace('Face off against players of similar skill', 'Infinite energy mode to preview and test the visual abilities.');
  
  code = code.replace(rankedBtn, rankedBtn + '\n\n' + testBtn);
}

fs.writeFileSync(path, code);
