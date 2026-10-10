const fs = require('fs');

function patch(file) {
  let content = fs.readFileSync(file, 'utf8');

  const startStr = '<div className="grid grid-cols-3 gap-3">';
  const endStr = '{myUpgrades === 3 && (';
  
  const startIndex = content.indexOf(startStr);
  const endIndex = content.indexOf(endStr);
  
  if (startIndex === -1 || endIndex === -1) {
    console.log('Failed to find markers in ' + file);
    return;
  }
  
  const before = content.slice(0, startIndex);
  const after = content.slice(endIndex);
  
  const newCode = `
{(() => {
  const ALL_ABILITIES = [
    { id: 'shrooms', name: 'Shrooms', cost: 30, char: 'mushgirl' },
    { id: 'dyslexia', name: 'Dyslexia', cost: 60, char: 'mushgirl' },
    { id: 'blinking', name: 'Blinking', cost: 100, char: 'mushgirl' },
    { id: 'scramble', name: 'Scramble', cost: 30, char: 'screwed' },
    { id: 'sabotage', name: 'Sabotage', cost: 60, char: 'screwed' },
    { id: 'spam', name: 'Spam', cost: 100, char: 'screwed' },
    { id: 'joker1', name: 'Delusion', cost: 30, char: 'joker' },
    { id: 'joker2', name: 'Blindness', cost: 60, char: 'joker' },
    { id: 'joker3', name: 'Amnesia', cost: 100, char: 'joker' },
    { id: 'gravity1', name: 'Time Warp', cost: 40, char: 'gravity' },
    { id: 'gravity2', name: 'Black Hole', cost: 70, char: 'gravity' },
    { id: 'gravity3', name: 'Event Horizon', cost: 110, char: 'gravity' },
    { id: 'moneyguy1', name: 'Bribe I', cost: 30, char: 'moneyguy' },
    { id: 'moneyguy2', name: 'Bribe II', cost: 60, char: 'moneyguy' },
    { id: 'moneyguy3', name: 'Invest', cost: 100, char: 'moneyguy' }
  ];

  const getMG = (cost) => {
    if (cost <= 40) return { c: 100, h: 20 };
    if (cost <= 70) return { c: 150, h: 10 };
    return { c: 300, h: 30 };
  };

  const isMG = selectedCharacters.includes('moneyguy');
  const shopAbilities = ALL_ABILITIES.filter(a => selectedCharacters.includes(a.char));

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {shopAbilities.map(ability => {
        const hasIt = myAbilities.includes(ability.id) || myBuffedAbilities.includes(ability.id);
        const mgCost = getMG(ability.cost);
        const canAfford = isMG ? (myCoins >= mgCost.c && myHearts >= mgCost.h) : (myCharge >= ability.cost);
        
        return (
          <button
            key={ability.id}
            onClick={() => {
              if (canAfford && !hasIt) {
                if (ability.char === 'moneyguy') {
                  if (ability.id === 'moneyguy3') {
                    setShowBuffSelect(true);
                  } else {
                    setShowAbilitySelect(ability.id);
                  }
                  return; 
                }
                
                if (isMG) {
                  setMyCoins(c => c - mgCost.c);
                  setMyHearts(h => h - mgCost.h);
                  myCoinsRef.current -= mgCost.c;
                  myHeartsRef.current -= mgCost.h;
                } else {
                  setMyCharge(c => c - ability.cost);
                  myChargeRef.current -= ability.cost;
                }
                const newAbilities = [...myAbilities, ability.id];
                setMyAbilities(newAbilities);
                if (typeof socket !== 'undefined' && socket) {
                   socket.emit('rankedUpgrades', { matchId: matchData?.matchId, upgrades: newAbilities });
                }
              }
            }}
            disabled={!canAfford || hasIt}
            className={\`w-full py-3 px-2 border border-slate-700 bg-slate-800 font-mono text-xs uppercase tracking-widest \${(!canAfford || hasIt) ? 'opacity-50' : 'hover:bg-slate-700 cursor-pointer'} transition-colors flex flex-col items-center justify-center gap-1 relative\`}
          >
            {myBuffedAbilities.includes(ability.id) && (
               <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[9px] px-1 rounded font-bold">BUFFED</span>
            )}
            <span className={hasIt ? "text-emerald-400" : ""}>
              {ability.name}
            </span>
            {isMG ? (
              <div className="flex gap-2 text-[9px]">
                <span className="text-yellow-400">{mgCost.c}c</span>
                <span className="text-red-400">{mgCost.h}h</span>
              </div>
            ) : (
              <span className="text-[10px] text-[var(--hot)]">{ability.cost} Charge</span>
            )}
          </button>
        );
      })}
    </div>
  );
})()}
              `;
  fs.writeFileSync(file, before + newCode + after);
}
patch('frontend/src/components/RankedMode.tsx');
// For RankedSandbox, the end string might be different, let's just do it manually for sandbox if it fails
