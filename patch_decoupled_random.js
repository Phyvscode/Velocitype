const fs = require('fs');
const path = 'frontend/src/lib/words.ts';
let code = fs.readFileSync(path, 'utf8');

const replacement = `export function applyScrewedEffects(text: string, activeAbilities: { scramble: boolean, sabotage: boolean, spam: boolean }, mostIncorrectLetter: string | null): string {
  if (!activeAbilities.scramble && !activeAbilities.sabotage && !activeAbilities.spam) return text;

  const words = text.split(' ');
  const random5LetterWords = ['apple', 'brave', 'chase', 'dance', 'eagle', 'flame', 'grape', 'heart', 'image', 'juice', 'knife', 'lemon', 'magic', 'night', 'ocean', 'peace', 'queen', 'river', 'snake', 'train'];

  let newWords = [];
  
  for (let i = 0; i < words.length; i++) {
    let word = words[i];

    // Upgrade 1: Shuffle word
    if (activeAbilities.scramble && word.length > 1) {
      const arr = word.split('');
      let scrambleSeed = i * 1000 + text.length; // Unique seed sequence for scrambling this specific word
      for (let j = arr.length - 1; j > 0; j--) {
        const k = Math.floor(seededRandom(scrambleSeed++) * (j + 1));
        [arr[j], arr[k]] = [arr[k], arr[j]];
      }
      word = arr.join('');
    }

    // Upgrade 2: Every 3rd word (1-indexed, so (i+1)%3 === 0), insert most incorrect letter
    if (activeAbilities.sabotage && (i + 1) % 3 === 0 && mostIncorrectLetter) {
      const pos = Math.floor(seededRandom(i * 500 + text.length) * (word.length + 1));
      word = word.slice(0, pos) + mostIncorrectLetter + word.slice(pos);
    }

    newWords.push(word);

    // Upgrade 3: Every 10th word, insert a random 5-letter word right after it
    if (activeAbilities.spam && (i + 1) % 10 === 0) {
      newWords.push(random5LetterWords[Math.floor(seededRandom(i * 100 + text.length) * random5LetterWords.length)]);
    }
  }

  return newWords.join(' ');
}`;

code = code.replace(
  /export function applyScrewedEffects[\s\S]*?return newWords\.join\(' '\);\n\}/m,
  replacement
);

fs.writeFileSync(path, code);
