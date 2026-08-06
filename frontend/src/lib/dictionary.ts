// Fetches a word's definition from the free Dictionary API (dictionaryapi.dev).
// Returns a short human-readable meaning string, or null if not found.

export interface MeaningResult {
  partOfSpeech: string;
  definition: string;
  example?: string;
}

export async function fetchMeaning(word: string): Promise<MeaningResult[] | null> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
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
}

export function meaningToText(meanings: MeaningResult[] | null): string {
  if (!meanings || meanings.length === 0) return 'No definition found.';
  return meanings
    .slice(0, 3)
    .map((m) => `(${m.partOfSpeech}) ${m.definition}`)
    .join(' ');
}
