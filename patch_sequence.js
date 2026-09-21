const fs = require('fs');

// 1. words.ts
let wordsTs = fs.readFileSync('frontend/src/lib/words.ts', 'utf8');

const newWordsFunc = `export function applyScrewedEffects(text: string, activeSequence: string[], mostIncorrectLetter: string | null): string {
  if (activeSequence.length === 0) return text;

  let words = text.split(' ');
  const random5LetterWords = ['apple', 'brave', 'chase', 'dance', 'eagle', 'flame', 'grape', 'heart', 'image', 'juice', 'knife', 'lemon', 'magic', 'night', 'ocean', 'peace', 'queen', 'river', 'snake', 'train'];

  for (const ability of activeSequence) {
    let nextWords = [];
    if (ability === 'scramble') {
      for (let i = 0; i < words.length; i++) {
        let word = words[i];
        if (word.length > 1) {
          const arr = word.split('');
          let scrambleSeed = i * 1000 + text.length; 
          for (let j = arr.length - 1; j > 0; j--) {
            const k = Math.floor(seededRandom(scrambleSeed++) * (j + 1));
            [arr[j], arr[k]] = [arr[k], arr[j]];
          }
          word = arr.join('');
        }
        nextWords.push(word);
      }
      words = nextWords;
    } else if (ability === 'sabotage') {
      for (let i = 0; i < words.length; i++) {
        let word = words[i];
        if ((i + 1) % 3 === 0 && mostIncorrectLetter) {
          const pos = Math.floor(seededRandom(i * 500 + text.length) * (word.length + 1));
          word = word.slice(0, pos) + mostIncorrectLetter + word.slice(pos);
        }
        nextWords.push(word);
      }
      words = nextWords;
    } else if (ability === 'spam') {
      for (let i = 0; i < words.length; i++) {
        nextWords.push(words[i]);
        if ((i + 1) % 10 === 0) {
          nextWords.push(random5LetterWords[Math.floor(seededRandom(i * 100 + text.length) * random5LetterWords.length)]);
        }
      }
      words = nextWords;
    }
  }

  return words.join(' ');
}`;

wordsTs = wordsTs.replace(/export function applyScrewedEffects[\s\S]*?return newWords\.join\(' '\);\n\}/m, newWordsFunc);
fs.writeFileSync('frontend/src/lib/words.ts', wordsTs);


// 2. RankedMode.tsx
let modeTs = fs.readFileSync('frontend/src/components/RankedMode.tsx', 'utf8');

modeTs = modeTs.replace(
  /let screwedEffects = \{ scramble: false, sabotage: false, spam: false \};\n      if \(oppUpgrades >= 1\) screwedEffects\.scramble = true;\n      if \(oppUpgrades >= 2\) screwedEffects\.sabotage = true;\n      if \(oppUpgrades >= 3\) screwedEffects\.spam = true;\n      targetText = applyScrewedEffects\(targetText, screwedEffects, myWorstLetterRef\.current\);/,
  `let screwedSequence: string[] = [];
      if (oppUpgrades >= 1) screwedSequence.push('scramble');
      if (oppUpgrades >= 2) screwedSequence.push('sabotage');
      if (oppUpgrades >= 3) screwedSequence.push('spam');
      targetText = applyScrewedEffects(targetText, screwedSequence, myWorstLetterRef.current);`
);

fs.writeFileSync('frontend/src/components/RankedMode.tsx', modeTs);


// 3. RankedSandbox.tsx
let boxTs = fs.readFileSync('frontend/src/components/RankedSandbox.tsx', 'utf8');

boxTs = boxTs.replace(
  /const \[myScramble, setMyScramble\] = useState\(false\);\n  const \[mySabotage, setMySabotage\] = useState\(false\);\n  const \[mySpam, setMySpam\] = useState\(false\);/,
  `const [mySequence, setMySequence] = useState<string[]>([]);`
);

boxTs = boxTs.replace(
  /const \[oppScramble, setOppScramble\] = useState\(false\);\n  const \[oppSabotage, setOppSabotage\] = useState\(false\);\n  const \[oppSpam, setOppSpam\] = useState\(false\);/,
  `const [oppSequence, setOppSequence] = useState<string[]>([]);
  
  const toggleSeq = (seq: string[], setSeq: React.Dispatch<React.SetStateAction<string[]>>, name: string) => {
    if (seq.includes(name)) setSeq(seq.filter(n => n !== name));
    else setSeq([...seq, name]);
  };`
);

// update useEffect dependencies
boxTs = boxTs.replace(
  /\[myScramble, mySabotage, mySpam, oppScramble, oppSabotage, oppSpam, baseTargetText\]/,
  `[mySequence, oppSequence, baseTargetText]`
);

// update applyScrewedEffects calls
boxTs = boxTs.replace(
  /applyScrewedEffects\(baseTargetText, \{ scramble: myScramble, sabotage: mySabotage, spam: mySpam \}, 'e'\)/g,
  `applyScrewedEffects(baseTargetText, mySequence, 'e')`
);
boxTs = boxTs.replace(
  /applyScrewedEffects\(baseTargetText, \{ scramble: oppScramble, sabotage: oppSabotage, spam: oppSpam \}, 'e'\)/g,
  `applyScrewedEffects(baseTargetText, oppSequence, 'e')`
);

// replace my checkboxes
boxTs = boxTs.replace(
  /checked=\{myScramble\} onChange=\{e => setMyScramble\(e\.target\.checked\)\}/g,
  `checked={mySequence.includes('scramble')} onChange={() => toggleSeq(mySequence, setMySequence, 'scramble')}`
);
boxTs = boxTs.replace(
  /checked=\{mySabotage\} onChange=\{e => setMySabotage\(e\.target\.checked\)\}/g,
  `checked={mySequence.includes('sabotage')} onChange={() => toggleSeq(mySequence, setMySequence, 'sabotage')}`
);
boxTs = boxTs.replace(
  /checked=\{mySpam\} onChange=\{e => setMySpam\(e\.target\.checked\)\}/g,
  `checked={mySequence.includes('spam')} onChange={() => toggleSeq(mySequence, setMySequence, 'spam')}`
);

// replace opp checkboxes
boxTs = boxTs.replace(
  /checked=\{oppScramble\} onChange=\{e => setOppScramble\(e\.target\.checked\)\}/g,
  `checked={oppSequence.includes('scramble')} onChange={() => toggleSeq(oppSequence, setOppSequence, 'scramble')}`
);
boxTs = boxTs.replace(
  /checked=\{oppSabotage\} onChange=\{e => setOppSabotage\(e\.target\.checked\)\}/g,
  `checked={oppSequence.includes('sabotage')} onChange={() => toggleSeq(oppSequence, setOppSequence, 'sabotage')}`
);
boxTs = boxTs.replace(
  /checked=\{oppSpam\} onChange=\{e => setOppSpam\(e\.target\.checked\)\}/g,
  `checked={oppSequence.includes('spam')} onChange={() => toggleSeq(oppSequence, setOppSequence, 'spam')}`
);


fs.writeFileSync('frontend/src/components/RankedSandbox.tsx', boxTs);

