const fs = require('fs');
let content = fs.readFileSync('frontend/src/lib/words.ts', 'utf8');

// The activeSequence array comes from oppAbilities.
// We can check if `activeSequence.includes('sabotage_buffed')`
content = content.replace(
  /if \(ability === 'sabotage'\) \{[\s\S]*?\} else if \(ability === 'spam'\) \{[\s\S]*?\}/,
  `if (ability === 'sabotage' || ability === 'sabotage_buffed') {
      const isBuffed = activeSequence.includes('sabotage_buffed');
      for (let i = 0; i < words.length; i++) {
        let word = words[i];
        if ((i + 1) % (isBuffed ? 1 : 3) === 0 && mostIncorrectLetter) {
          const pos = Math.floor(seededRandom(i * 500 + text.length) * (word.length + 1));
          word = word.slice(0, pos) + mostIncorrectLetter + word.slice(pos);
        }
        nextWords.push(word);
      }
      words = nextWords;
    } else if (ability === 'spam' || ability === 'spam_buffed') {
      const isBuffed = activeSequence.includes('spam_buffed');
      for (let i = 0; i < words.length; i++) {
        nextWords.push(words[i]);
        if ((i + 1) % (isBuffed ? 5 : 10) === 0) {
          nextWords.push(random5LetterWords[Math.floor(seededRandom(i * 100 + text.length) * random5LetterWords.length)]);
        }
      }
      words = nextWords;
    }`
);

fs.writeFileSync('frontend/src/lib/words.ts', content);
