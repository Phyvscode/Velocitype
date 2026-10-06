const fs = require('fs');
let content = fs.readFileSync('frontend/src/lib/words.ts', 'utf8');

const replacement = `function getLettersForRows(rows: RowKey[]): string[] {
  let chars = '';
  if (rows.includes('top')) chars += 'qwertyuiop';
  if (rows.includes('home')) chars += 'asdfghjkl';
  if (rows.includes('bottom')) chars += 'zxcvbnm';
  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz';
  return chars.split('');
}

function generateGibberishWord(letters: string[], minLen: number, maxLen: number, initial = '', middle = '', final = ''): string {
  let length = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;
  const requiredLen = initial.length + middle.length + final.length;
  if (length < requiredLen) length = requiredLen + Math.floor(Math.random() * 3);
  
  const remaining = length - requiredLen;
  let filler = '';
  if (letters.length > 0) {
    for (let i = 0; i < remaining; i++) {
      filler += letters[Math.floor(Math.random() * letters.length)];
    }
  } else {
    for (let i = 0; i < remaining; i++) {
      filler += 'a';
    }
  }
  
  const insertPos = Math.floor(Math.random() * (filler.length + 1));
  const inner = filler.slice(0, insertPos) + middle + filler.slice(insertPos);
  
  return initial + inner + final;
}

export function filterWords(
  activeRows: RowKey[], 
  minLen: number, 
  maxLen: number,
  customLetters?: string,
  extraInitial?: string,
  extraMiddle?: string,
  extraFinal?: string
): string[] {
  let pool: string[] = [];
  
  const hasExtra = !!(extraInitial || extraMiddle || extraFinal);
  
  if (customLetters && customLetters.trim().length > 0) {
    const letters = customLetters.split(/\\s+/).filter(c => c.trim().length > 0).map(c => c.toLowerCase());
    if (letters.length > 0) {
      for (let i = 0; i < 300; i++) {
        pool.push(generateGibberishWord(letters, minLen, maxLen, extraInitial, extraMiddle, extraFinal));
      }
      return pool;
    }
  }

  const rowSet = new Set(activeRows);
  const dictMatches = DICTIONARY.filter(
    (w) =>
      w.word.length >= minLen &&
      w.word.length <= maxLen &&
      w.rows.every((r) => rowSet.has(r)) &&
      (!extraInitial || w.word.startsWith(extraInitial)) &&
      (!extraFinal || w.word.endsWith(extraFinal)) &&
      (!extraMiddle || w.word.includes(extraMiddle))
  ).map((w) => w.word);
  
  pool = [...dictMatches];

  // If there are extra requirements, or if the pool is empty, pad with gibberish
  if (hasExtra && pool.length < 200) {
    const allowedLetters = getLettersForRows(activeRows);
    while (pool.length < 200) {
      pool.push(generateGibberishWord(allowedLetters, minLen, maxLen, extraInitial, extraMiddle, extraFinal));
    }
  }

  return pool;
}`;

content = content.replace(/export function filterWords.*?\n\}/s, replacement);
fs.writeFileSync('frontend/src/lib/words.ts', content);
