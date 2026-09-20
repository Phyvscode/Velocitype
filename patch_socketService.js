const fs = require('fs');
const path = 'backend/src/services/socketService.ts';
let code = fs.readFileSync(path, 'utf8');

const regex = /match\.state = 'ability_selection';[\s\S]*?}, 3000\);/g;

code = code.replace(regex, `
                  match.currentRound += 1;
                  match.state = 'waiting_ready';
                  Object.values(match.players).forEach(p => {
                    p.ready = false;
                    p.selectedAbility = undefined;
                    p.activeAbility = undefined;
                  });
                  setTimeout(() => {
                    if (rankedMatches[match.id]) {
                      io.to(match.id).emit('rankedNextRound', { round: match.currentRound });
                    }
                  }, 4000);
`);

// Now let's remove the rankedSelectAbility listener
const regex2 = /socket\.on\('rankedSelectAbility'[\s\S]*?clearTimeout\(match\.abilitySelectionTimer\);\n              }\n            }\n          }\n        }\n      }\n    }\);\n/g;
code = code.replace(regex2, '');

// Now let's remove rankedTimeStop and rankedScreenFlash listeners
const regex3 = /socket\.on\('rankedTimeStop'[\s\S]*?\}\);\n    \}\);\n/g;
code = code.replace(regex3, '');

const regex4 = /socket\.on\('rankedScreenFlash'[\s\S]*?\}\);\n    \}\);\n/g;
code = code.replace(regex4, '');

fs.writeFileSync(path, code);
