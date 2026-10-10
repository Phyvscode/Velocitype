const fs = require('fs');

function patchFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');

  // Add character to lists
  content = content.replace(/\['mushgirl', 'screwed', 'joker', 'gravity'\]/g, "['mushgirl', 'screwed', 'joker', 'gravity', 'moneyguy']");

  // Add states
  if (!content.includes('const [myCoins, setMyCoins]')) {
    content = content.replace(
      /  const \[myCharge, setMyCharge\] = useState\(0\);/,
      `  const [myCharge, setMyCharge] = useState(0);\n  const [myCoins, setMyCoins] = useState(0);\n  const [myHearts, setMyHearts] = useState(0);\n  const myCoinsRef = useRef(0);\n  const myHeartsRef = useRef(0);\n  const goldenLettersRef = useRef<Set<number>>(new Set());\n  const claimedGoldenRef = useRef<Set<number>>(new Set());\n  const [myBuffedAbilities, setMyBuffedAbilities] = useState<string[]>([]);\n  const prevValLengthRef = useRef(0);\n  const [showAbilitySelect, setShowAbilitySelect] = useState<'moneyguy1' | 'moneyguy2' | null>(null);\n  const [showBuffSelect, setShowBuffSelect] = useState(false);`
    );
  }

  // Update setGameState('playing') or similar logic for resetting round
  // In RankedMode.tsx this is in onRoundStart and onMatchReady.
  // Actually, we can just compute golden letters whenever myTargetText is set.
  // We'll search for setMyTargetText.
  
  fs.writeFileSync(filepath, content);
}

patchFile('frontend/src/components/RankedMode.tsx');
patchFile('frontend/src/components/RankedSandbox.tsx');
