const fs = require('fs');
const path = 'frontend/src/lib/words.ts';
let code = fs.readFileSync(path, 'utf8');

const seededRandomCode = `
// Simple deterministic PRNG
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}
`;

if (!code.includes("function seededRandom")) {
  code = code.replace(
    "export function applyScrewedEffects",
    seededRandomCode + "\nexport function applyScrewedEffects"
  );
}

// Replace Math.random() with seededRandom(i * something)
// But we need a moving seed.
const funcReplacement = `export function applyScrewedEffects(text: string, activeAbilities: { scramble: boolean, sabotage: boolean, spam: boolean }, mostIncorrectLetter: string | null): string {
  if (!activeAbilities.scramble && !activeAbilities.sabotage && !activeAbilities.spam) return text;

  const words = text.split(' ');
  const random5LetterWords = ['apple', 'brave', 'chase', 'dance', 'eagle', 'flame', 'grape', 'heart', 'image', 'juice', 'knife', 'lemon', 'magic', 'night', 'ocean', 'peace', 'queen', 'river', 'snake', 'train'];

  let newWords = [];
  let seed = text.length; // deterministic base seed

  for (let i = 0; i < words.length; i++) {
    let word = words[i];

    // Upgrade 1: Shuffle word
    if (activeAbilities.scramble && word.length > 1) {
      const arr = word.split('');
      for (let j = arr.length - 1; j > 0; j--) {
        const k = Math.floor(seededRandom(seed++) * (j + 1));
        [arr[j], arr[k]] = [arr[k], arr[j]];
      }
      word = arr.join('');
    }

    // Upgrade 2: Every 3rd word (1-indexed, so (i+1)%3 === 0), insert most incorrect letter
    if (activeAbilities.sabotage && (i + 1) % 3 === 0 && mostIncorrectLetter) {
      const pos = Math.floor(seededRandom(seed++) * (word.length + 1));
      word = word.slice(0, pos) + mostIncorrectLetter + word.slice(pos);
    }

    newWords.push(word);

    // Upgrade 3: Every 10th word, insert a random 5-letter word right after it
    if (activeAbilities.spam && (i + 1) % 10 === 0) {
      newWords.push(random5LetterWords[Math.floor(seededRandom(seed++) * random5LetterWords.length)]);
    }
  }

  return newWords.join(' ');
}`;

code = code.replace(
  /export function applyScrewedEffects[\s\S]*?return newWords\.join\(' '\);\n\}/m,
  funcReplacement
);

fs.writeFileSync(path, code);
