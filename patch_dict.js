const fs = require('fs');
const path = 'frontend/src/lib/dictionary.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
`export async function fetchMeaning(word: string): Promise<MeaningResult[] | null> {
  try {
    const res = await fetch(
      \`https://api.dictionaryapi.dev/api/v2/entries/en/\${encodeURIComponent(word)}\`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const entry = data[0];
    const meanings = entry?.meanings;
    if (!Array.isArray(meanings)) return null;

    const results: MeaningResult[] = [];
    for (const m of meanings) {
      if (!Array.isArray(m?.definitions)) continue;
      for (const d of m.definitions) {
        if (d?.definition) {
          results.push({
            partOfSpeech: m.partOfSpeech ?? '',
            definition: d.definition,
            example: d.example,
          });
        }
      }
    }
    return results.length > 0 ? results : null;
  } catch {
    return null;
  }
}`,
`export async function fetchMeaning(word: string): Promise<MeaningResult[] | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    
    const res = await fetch(
      \`https://api.dictionaryapi.dev/api/v2/entries/en/\${encodeURIComponent(word)}\`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    
    if (!res.ok) throw new Error("dictionaryapi failed");
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error("no data");

    const entry = data[0];
    const meanings = entry?.meanings;
    if (!Array.isArray(meanings)) throw new Error("no meanings");

    const results: MeaningResult[] = [];
    for (const m of meanings) {
      if (!Array.isArray(m?.definitions)) continue;
      for (const d of m.definitions) {
        if (d?.definition) {
          results.push({
            partOfSpeech: m.partOfSpeech ?? '',
            definition: d.definition,
            example: d.example,
          });
        }
      }
    }
    if (results.length > 0) return results;
    throw new Error("empty results");
  } catch {
    // Fallback to Datamuse
    try {
      const res = await fetch(\`https://api.datamuse.com/words?sp=\${encodeURIComponent(word)}&md=d&max=1\`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return null;
      const entry = data[0];
      if (entry.word !== word && entry.word.toLowerCase() !== word.toLowerCase()) return null;
      if (!Array.isArray(entry.defs)) return null;
      
      const results: MeaningResult[] = [];
      for (const d of entry.defs) {
        const parts = d.split('\\t');
        if (parts.length >= 2) {
          results.push({
            partOfSpeech: parts[0],
            definition: parts[1]
          });
        }
      }
      return results.length > 0 ? results : null;
    } catch {
      return null;
    }
  }
}`
);

fs.writeFileSync(path, code);
