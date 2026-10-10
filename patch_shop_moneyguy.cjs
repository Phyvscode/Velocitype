const fs = require('fs');

function patch(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Replace "Available Charge: {myCharge}" with conditional
  content = content.replace(
    /<div className="font-mono text-sm text-slate-300">Available Charge: <span className="text-\[var\(--hot\)\]">\{myCharge\}<\/span><\/div>/,
    `{selectedCharacters.includes('moneyguy') ? (
      <div className="font-mono text-sm text-slate-300 flex gap-4">
        <span>Coins: <span className="text-yellow-400">{myCoins}</span></span>
        <span>Hearts: <span className="text-red-400">{myHearts}</span></span>
      </div>
    ) : (
      <div className="font-mono text-sm text-slate-300">Available Charge: <span className="text-[var(--hot)]">{myCharge}</span></div>
    )}`
  );

  // Add Money Guy abilities to the list
  const addMG = `
                  { id: 'gravity1', name: 'Time Warp', cost: 40 },
                  { id: 'gravity2', name: 'Black Hole', cost: 70 },
                  { id: 'gravity3', name: 'Event Horizon', cost: 110 },
                  { id: 'moneyguy1', name: 'Bribe I', cost: 30 },
                  { id: 'moneyguy2', name: 'Bribe II', cost: 60 },
                  { id: 'moneyguy3', name: 'Invest', cost: 100 },`;
  content = content.replace(
    /                  \{ id: 'gravity1', name: 'Time Warp', cost: 40 \},\n                  \{ id: 'gravity2', name: 'Black Hole', cost: 70 \},\n                  \{ id: 'gravity3', name: 'Event Horizon', cost: 110 \},/g,
    addMG
  );

  // Filter abilities by selected characters
  // We need to only map abilities of selected characters!
  // Oh wait, currently it shows ALL abilities of ALL characters?
  // Let's check how it maps.
  /*
                {[
                  { id: 'shrooms', name: 'Shrooms', cost: 30 }, ...
                ].map(ability => (
  */
  
  // Actually, wait, does it filter?
  
  fs.writeFileSync(file, content);
}

patch('frontend/src/components/RankedMode.tsx');
patch('frontend/src/components/RankedSandbox.tsx');
