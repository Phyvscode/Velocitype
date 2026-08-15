import { RowKey, filterWords } from './words';

export interface Quote {
  text: string;
  author: string;
}

const QUOTES_URL = 'https://raw.githubusercontent.com/JamesFT/Database-Quotes-JSON/master/quotes.json';

let quotesCache: Quote[] | null = null;
let markovMap: Map<string, string[]> | null = null;

export async function generateSentences(
  apiKey: string,
  rows: RowKey[],
  minWords: number,
  maxWords: number,
  count: number = 20,
  theme?: string
): Promise<string[]> {
  let sentences: string[] = [];
  
  if (apiKey && apiKey.trim().length > 0) {
    sentences = await generateWithGemini(apiKey.trim(), rows, minWords, maxWords, count, theme);
  } else if (rows.length > 0) {
    sentences = await generateRandomDictionarySentences(rows, minWords, maxWords, count);
  } else {
    sentences = await generateMarkovSentences(minWords, maxWords, count);
  }

  return sentences.map(s => s.toLowerCase().replace(/[.,!?;:]/g, ''));
}

// 1. GEMINI LLM
async function generateWithGemini(apiKey: string, rows: RowKey[], minWords: number, maxWords: number, count: number, theme?: string): Promise<string[]> {
  const rowRestriction = rows.length > 0 
    ? `ONLY use words that can be spelled using the letters from these rows: ${rows.join(', ')}.`
    : '';

  const themeRestriction = theme && theme.trim().length > 0
    ? `The sentences MUST be heavily themed around or directly about: "${theme}".`
    : '';

  const prompt = `Generate ${count} random English sentences. Keep each sentence exactly between ${minWords} and ${maxWords} words long. Use common vocabulary. ${rowRestriction} ${themeRestriction} Output ONLY a valid JSON array of strings, with no markdown formatting.`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!res.ok) throw new Error('Gemini API Error');
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response');
    
    let parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error('Not an array');
    return parsed;
  } catch (err) {
    console.error("LLM Error, falling back...", err);
    return generateRandomDictionarySentences(rows, minWords, maxWords, count);
  }
}

// 2. MARKOV CHAIN
async function generateMarkovSentences(minWords: number, maxWords: number, count: number): Promise<string[]> {
  if (!markovMap) {
    if (!quotesCache) {
      try {
        const res = await fetch(QUOTES_URL);
        const raw = await res.json();
        // The JamesFT quotes JSON has { quoteText, quoteAuthor }
        quotesCache = raw.map((q: any) => ({
          text: q.quoteText,
          author: q.quoteAuthor
        }));
      } catch {
        return generateRandomDictionarySentences([], minWords, maxWords, count);
      }
    }
    
    markovMap = new Map();
    quotesCache!.forEach(q => {
      const cleanText = q.text.replace(/[^a-zA-Z\s']/g, '');
      const words = cleanText.split(/\s+/).filter(w => w.length > 0);
      for (let i = 0; i < words.length - 1; i++) {
        const current = words[i].toLowerCase();
        const next = words[i + 1];
        if (!markovMap!.has(current)) markovMap!.set(current, []);
        markovMap!.get(current)!.push(next);
      }
    });
  }

  const sentences: string[] = [];
  const keys = Array.from(markovMap.keys());
  if (keys.length === 0) return generateRandomDictionarySentences([], minWords, maxWords, count);

  for (let i = 0; i < count; i++) {
    const targetLength = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
    let currentWord = keys[Math.floor(Math.random() * keys.length)];
    let sentence = currentWord.charAt(0).toUpperCase() + currentWord.slice(1);
    let length = 1;

    while (length < targetLength) {
      const nextOptions = markovMap.get(currentWord.toLowerCase());
      if (!nextOptions || nextOptions.length === 0) {
        break;
      }
      const next = nextOptions[Math.floor(Math.random() * nextOptions.length)];
      sentence += ' ' + next;
      currentWord = next;
      length++;
    }

    if (!/[.!?]$/.test(sentence)) {
      sentence += '.';
    }
    sentences.push(sentence);
  }
  return sentences;
}

// 3. COMMON WORDS FALLBACK (FOR RESTRICTED ROWS)
async function generateRandomDictionarySentences(rows: RowKey[], minWords: number, maxWords: number, count: number): Promise<string[]> {
  const pool = filterWords(rows, 1, 15);
  
  const sentences: string[] = [];
  for (let i = 0; i < count; i++) {
    const targetLength = Math.max(3, Math.min(15, Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords));
    let sentence = '';
    for (let j = 0; j < targetLength; j++) {
      let w = 'fallback';
      if (pool && pool.length > 0) {
        w = pool[Math.floor(Math.random() * pool.length)];
      }
      if (j === 0) sentence += w.charAt(0).toUpperCase() + w.slice(1);
      else sentence += ' ' + w;
    }
    sentence += '.';
    sentences.push(sentence);
  }
  
  if (sentences.length === 0) {
    return ["This is a guaranteed fallback sentence.", "Please check your network or api key.", "The fallback engine is running safely."];
  }
  return sentences;
}
