// Fetches a word's definition from the free Dictionary API (dictionaryapi.dev).
// Returns a short human-readable meaning string, or null if not found.

export interface MeaningResult {
  partOfSpeech: string;
  definition: string;
  example?: string;
}

export async function fetchMeaning(word: string): Promise<MeaningResult[] | null> {
  const fetchDictAPI = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    try {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error("dictionaryapi failed");
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error("no data");
      const entry = data[0];
      const meanings = entry?.meanings;
      if (!Array.isArray(meanings)) throw new Error("no meanings");
      const results = [];
      for (const m of meanings) {
        if (!Array.isArray(m?.definitions)) continue;
        for (const d of m.definitions) {
          if (d?.definition) {
            results.push({ partOfSpeech: m.partOfSpeech ?? '', definition: d.definition, example: d.example });
          }
        }
      }
      if (results.length > 0) return results;
      throw new Error("empty results");
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }
  };

  const fetchDatamuse = async () => {
    const res = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=d&max=1`);
    if (!res.ok) throw new Error("datamuse failed");
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error("no data");
    const entry = data[0];
    if (entry.word !== word && entry.word.toLowerCase() !== word.toLowerCase()) throw new Error("mismatch");
    if (!Array.isArray(entry.defs)) throw new Error("no defs");
    
    const results = [];
    for (const d of entry.defs) {
      const parts = d.split('\t');
      if (parts.length >= 2) {
        results.push({ partOfSpeech: parts[0], definition: parts[1] });
      }
    }
    if (results.length > 0) return results;
    throw new Error("empty results");
  };

  try {
    return await Promise.any([fetchDictAPI(), fetchDatamuse()]);
  } catch {
    return null;
  }
}

export function meaningToText(meanings: MeaningResult[] | null): string {
  if (!meanings || meanings.length === 0) return 'No definition found.';
  return meanings
    .slice(0, 3)
    .map((m) => `(${m.partOfSpeech}) ${m.definition}`)
    .join(' ');
}
