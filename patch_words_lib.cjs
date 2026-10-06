const fs = require('fs');
let content = fs.readFileSync('frontend/src/lib/words.ts', 'utf8');

const filterWordsReplacement = `export function filterWords(
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
  let hasCustom = false;
  let customSet = new Set<string>();
  let customArr: string[] = [];
  
  if (customLetters && customLetters.trim().length > 0) {
    customArr = customLetters.split(/\\s+/).filter(c => c.trim().length > 0).map(c => c.toLowerCase());
    if (customArr.length > 0) {
      hasCustom = true;
      customSet = new Set(customArr);
    }
  }

  const rowSet = new Set(activeRows);
  const dictMatches = DICTIONARY.filter(
    (w) => {
      if (w.word.length < minLen || w.word.length > maxLen) return false;
      if (extraInitial && !w.word.startsWith(extraInitial)) return false;
      if (extraFinal && !w.word.endsWith(extraFinal)) return false;
      if (extraMiddle && !w.word.includes(extraMiddle)) return false;
      
      if (hasCustom) {
         for (const char of w.word) {
            if (!customSet.has(char)) return false;
         }
         return true;
      } else {
         return w.rows.every((r) => rowSet.has(r));
      }
    }
  ).map((w) => w.word);
  
  // Shuffle dictMatches internally so they are randomized but stay at the front
  for (let i = dictMatches.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dictMatches[i], dictMatches[j]] = [dictMatches[j], dictMatches[i]];
  }
  
  pool = [...dictMatches];

  // If there are extra requirements or custom letters, pad with gibberish
  if ((hasExtra || hasCustom) && pool.length < 200) {
    const allowedLetters = hasCustom ? customArr : getLettersForRows(activeRows);
    while (pool.length < 200) {
      pool.push(generateGibberishWord(allowedLetters, minLen, maxLen, extraInitial, extraMiddle, extraFinal));
    }
  }

  return pool;
}`;

content = content.replace(/export function filterWords[\s\S]*?return pool;\n\}/m, filterWordsReplacement);
fs.writeFileSync('frontend/src/lib/words.ts', content);
