#!/bin/bash
sed -i '/export function applyScrewedEffects/,$d' frontend/src/lib/words.ts
cat << 'INNER_EOF' >> frontend/src/lib/words.ts
export function applyScrewedEffects(text: string, upgrades: number, mostIncorrectLetter: string | null): string {
  if (upgrades < 1) return text;

  const words = text.split(' ');
  const random5LetterWords = ['apple', 'brave', 'chase', 'dance', 'eagle', 'flame', 'grape', 'heart', 'image', 'juice', 'knife', 'lemon', 'magic', 'night', 'ocean', 'peace', 'queen', 'river', 'snake', 'train'];

  let newWords = [];
  for (let i = 0; i < words.length; i++) {
    let word = words[i];

    // Upgrade 1: Shuffle word
    if (upgrades >= 1 && word.length > 1) {
      const arr = word.split('');
      for (let j = arr.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [arr[j], arr[k]] = [arr[k], arr[j]];
      }
      word = arr.join('');
    }

    // Upgrade 2: Every 3rd word (1-indexed, so (i+1)%3 === 0), insert most incorrect letter
    if (upgrades >= 2 && (i + 1) % 3 === 0 && mostIncorrectLetter) {
      const pos = Math.floor(Math.random() * (word.length + 1));
      word = word.slice(0, pos) + mostIncorrectLetter + word.slice(pos);
    }

    newWords.push(word);

    // Upgrade 3: Every 10th word, insert a random 5-letter word right after it
    if (upgrades >= 3 && (i + 1) % 10 === 0) {
      newWords.push(random5LetterWords[Math.floor(Math.random() * random5LetterWords.length)]);
    }
  }

  return newWords.join(' ');
}
INNER_EOF
