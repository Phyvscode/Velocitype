const fs = require('fs');

function patch(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  const modals = `
      {/* Modals for Money Guy */}
      {showAbilitySelect && (
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-[var(--hot)] p-8 rounded max-w-2xl w-full">
            <h3 className="font-display text-2xl text-[var(--hot)] uppercase tracking-widest mb-2">Bribe: Select Ability</h3>
            <p className="text-slate-400 font-mono text-xs mb-6">Choose an ability from a character not currently in the game.</p>
            <div className="grid grid-cols-3 gap-4">
              {[
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
                { id: 'gravity3', name: 'Event Horizon', cost: 110, char: 'gravity' }
              ].filter(a => !selectedCharacters.includes(a.char)).map(ability => (
                <button
                  key={ability.id}
                  onClick={() => {
                    const getMG = (c) => c <= 40 ? {c:100,h:20} : c <= 70 ? {c:150,h:10} : {c:300,h:30};
                    const baseCost = showAbilitySelect === 'moneyguy1' ? 30 : 60;
                    const mgCost = getMG(baseCost);
                    
                    setMyCoins(c => c - mgCost.c);
                    setMyHearts(h => h - mgCost.h);
                    myCoinsRef.current -= mgCost.c;
                    myHeartsRef.current -= mgCost.h;
                    
                    const newAbilities = [...myAbilities, showAbilitySelect, ability.id];
                    setMyAbilities(newAbilities);
                    if (typeof socket !== 'undefined' && socket) {
                       socket.emit('rankedUpgrades', { matchId: matchData?.matchId, upgrades: newAbilities });
                    }
                    setShowAbilitySelect(null);
                  }}
                  className="py-3 px-2 border border-slate-700 bg-slate-800 font-mono text-xs uppercase tracking-widest hover:bg-slate-700 transition-colors text-white"
                >
                  {ability.name}
                  <div className="text-[9px] text-slate-500 mt-1 capitalize">{ability.char}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setShowAbilitySelect(null)} className="mt-6 text-xs font-mono text-slate-500 hover:text-white uppercase tracking-widest">Cancel</button>
          </div>
        </div>
      )}

      {showBuffSelect && (
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-yellow-500 p-8 rounded max-w-md w-full">
            <h3 className="font-display text-2xl text-yellow-500 uppercase tracking-widest mb-2">Invest: Double Effect</h3>
            <p className="text-slate-400 font-mono text-xs mb-6">Select an active ability to double its effect permanently!</p>
            <div className="flex flex-col gap-4">
              {myAbilities.filter(a => !a.startsWith('moneyguy')).length === 0 ? (
                <div className="text-red-400 text-xs font-mono">You have no active abilities to buff!</div>
              ) : myAbilities.filter(a => !a.startsWith('moneyguy')).map(abilityId => {
                 const name = [
                    { id: 'shrooms', name: 'Shrooms' }, { id: 'dyslexia', name: 'Dyslexia' }, { id: 'blinking', name: 'Blinking' },
                    { id: 'scramble', name: 'Scramble' }, { id: 'sabotage', name: 'Sabotage' }, { id: 'spam', name: 'Spam' },
                    { id: 'joker1', name: 'Delusion' }, { id: 'joker2', name: 'Blindness' }, { id: 'joker3', name: 'Amnesia' },
                    { id: 'gravity1', name: 'Time Warp' }, { id: 'gravity2', name: 'Black Hole' }, { id: 'gravity3', name: 'Event Horizon' }
                 ].find(x => x.id === abilityId)?.name || abilityId;
                 
                 const isBuffed = myBuffedAbilities.includes(abilityId);

                 return (
                  <button
                    key={abilityId}
                    disabled={isBuffed}
                    onClick={() => {
                      const getMG = (c) => c <= 40 ? {c:100,h:20} : c <= 70 ? {c:150,h:10} : {c:300,h:30};
                      const mgCost = getMG(100); // Invest cost
                      
                      setMyCoins(c => c - mgCost.c);
                      setMyHearts(h => h - mgCost.h);
                      myCoinsRef.current -= mgCost.c;
                      myHeartsRef.current -= mgCost.h;
                      
                      const newAbilities = [...myAbilities, 'moneyguy3'];
                      setMyAbilities(newAbilities);
                      
                      const newBuffs = [...myBuffedAbilities, abilityId];
                      setMyBuffedAbilities(newBuffs);
                      
                      if (typeof socket !== 'undefined' && socket) {
                         socket.emit('rankedUpgrades', { matchId: matchData?.matchId, upgrades: newAbilities });
                      }
                      setShowBuffSelect(false);
                    }}
                    className={\`py-3 px-2 border border-slate-700 bg-slate-800 font-mono text-xs uppercase tracking-widest \${isBuffed ? 'opacity-50' : 'hover:bg-yellow-500 hover:text-black cursor-pointer'} transition-colors\`}
                  >
                    {name} {isBuffed ? '(Already Buffed)' : ''}
                  </button>
                 );
              })}
            </div>
            <button onClick={() => setShowBuffSelect(false)} className="mt-6 text-xs font-mono text-slate-500 hover:text-white uppercase tracking-widest">Cancel</button>
          </div>
        </div>
      )}
  `;

  content = content.replace(
    /      \{showGravityPopup && gameState === 'playing' && \(/,
    `${modals}\n      {showGravityPopup && gameState === 'playing' && (`
  );
  
  fs.writeFileSync(file, content);
}
patch('frontend/src/components/RankedMode.tsx');
patch('frontend/src/components/RankedSandbox.tsx');
