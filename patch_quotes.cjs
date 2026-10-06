const fs = require('fs');
let content = fs.readFileSync('frontend/src/lib/quotes.ts', 'utf8');

// Update generateSentences signature
content = content.replace(
  /export async function generateSentences\(\n  apiKey: string,\n  rows: RowKey\[\],\n  minWords: number,\n  maxWords: number,\n  count: number = 20,\n  theme\?: string\n\): Promise<string\[\]> \{/,
  `export async function generateSentences(
  apiKey: string,
  rows: RowKey[],
  minWords: number,
  maxWords: number,
  count: number = 20,
  theme?: string,
  customLetters?: string,
  extraInitial?: string,
  extraMiddle?: string,
  extraFinal?: string
): Promise<string[]> {`
);

// Update calls to generateRandomDictionarySentences
content = content.replace(
  /sentences = await generateRandomDictionarySentences\(rows, minWords, maxWords, count\);/,
  `sentences = await generateRandomDictionarySentences(rows, minWords, maxWords, count, customLetters, extraInitial, extraMiddle, extraFinal);`
);
content = content.replace(
  /return generateRandomDictionarySentences\(rows, minWords, maxWords, count\);/,
  `return generateRandomDictionarySentences(rows, minWords, maxWords, count, customLetters, extraInitial, extraMiddle, extraFinal);`
);

// Update generateRandomDictionarySentences signature and filterWords call
content = content.replace(
  /async function generateRandomDictionarySentences\(rows: RowKey\[\], minWords: number, maxWords: number, count: number\): Promise<string\[\]> \{\n  const pool = filterWords\(rows, 1, 15\);/,
  `async function generateRandomDictionarySentences(rows: RowKey[], minWords: number, maxWords: number, count: number, customLetters?: string, extraInitial?: string, extraMiddle?: string, extraFinal?: string): Promise<string[]> {
  const pool = filterWords(rows, 1, 15, customLetters, extraInitial, extraMiddle, extraFinal);`
);

fs.writeFileSync('frontend/src/lib/quotes.ts', content);
