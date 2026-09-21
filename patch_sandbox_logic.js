const fs = require('fs');
const path = 'frontend/src/components/RankedSandbox.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /useEffect\(\(\) => \{\n    if \(\!baseTargetText\.startsWith[\s\S]*?\}, \[myChar, myUpg1, myUpg2, myUpg3, oppChar, oppUpg1, oppUpg2, oppUpg3, baseTargetText\]\);/,
  `useEffect(() => {
    if (!baseTargetText.startsWith('generating')) {
      // My abilities affect MY target text (sandbox logic: testing on myself)
      let myUpgrades = 0;
      if (myUpg1) myUpgrades = 1;
      if (myUpg2) myUpgrades = 2;
      if (myUpg3) myUpgrades = 3;
      
      let myText = baseTargetText;
      if (myChar === 'screwed' && myUpgrades > 0) {
        myText = applyScrewedEffects(baseTargetText, myUpgrades, 'e') + ' ';
      }
      setMyTargetText(myText);

      // Opp abilities affect OPP target text (sandbox logic: testing on bot)
      let oppUpgrades = 0;
      if (oppUpg1) oppUpgrades = 1;
      if (oppUpg2) oppUpgrades = 2;
      if (oppUpg3) oppUpgrades = 3;

      let oppText = baseTargetText;
      if (oppChar === 'screwed' && oppUpgrades > 0) {
        oppText = applyScrewedEffects(baseTargetText, oppUpgrades, 'e') + ' ';
      }
      setOppTargetText(oppText);
    }
  }, [myChar, myUpg1, myUpg2, myUpg3, oppChar, oppUpg1, oppUpg2, oppUpg3, baseTargetText]);`
);

fs.writeFileSync(path, code);
