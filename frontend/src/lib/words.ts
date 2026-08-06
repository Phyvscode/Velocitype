// Keyboard row definitions (QWERTY)
export const HOME_ROW = new Set('asdfghjkl'.split(''));
export const TOP_ROW = new Set('qwertyuiop'.split(''));
export const BOTTOM_ROW = new Set('zxcvbnm'.split(''));

export type RowKey = 'home' | 'top' | 'bottom';

// A curated word list. Each word is tagged with the set of rows its letters span.
// Words are filtered at runtime by the rows the player activates.
export interface DictWord {
  word: string;
  rows: RowKey[];
}

function rowsFor(word: string): RowKey[] {
  const rows = new Set<RowKey>();
  for (const ch of word.toLowerCase()) {
    if (HOME_ROW.has(ch)) rows.add('home');
    else if (TOP_ROW.has(ch)) rows.add('top');
    else if (BOTTOM_ROW.has(ch)) rows.add('bottom');
  }
  return Array.from(rows);
}

// Small curated word list — used as an instant fallback while the full
// remote dictionary loads, and as a safety net if that fetch ever fails.
const FALLBACK_WORDS: string[] = [
  // short (3-4)
  'cat', 'dog', 'hat', 'run', 'sun', 'top', 'box', 'red', 'fox', 'big',
  'jam', 'key', 'log', 'map', 'net', 'pen', 'pig', 'rat', 'sea', 'ten',
  'van', 'war', 'yes', 'zip', 'ace', 'age', 'air', 'art', 'ask', 'bad',
  'bag', 'bar', 'bat', 'bed', 'bee', 'bit', 'bow', 'bug', 'bus', 'buy',
  'cab', 'cap', 'car', 'cry', 'cup', 'cut', 'day', 'den', 'dew', 'dig',
  'dot', 'dry', 'ear', 'eat', 'egg', 'end', 'eye', 'fan', 'far', 'fat',
  'fee', 'few', 'fig', 'fit', 'fix', 'fly', 'fog', 'for', 'fun', 'gap',
  'gas', 'get', 'god', 'got', 'gum', 'gun', 'guy', 'had', 'ham', 'has',
  'data', 'code', 'type', 'word', 'game', 'play', 'fast', 'slow', 'time', 'line',
  'home', 'road', 'path', 'star', 'moon', 'tree', 'leaf', 'rain', 'snow', 'wind',
  'fire', 'lake', 'hill', 'rock', 'sand', 'dust', 'gold', 'iron', 'wood', 'ship',
  'boat', 'blue', 'dark', 'deep', 'easy', 'hard', 'high', 'late', 'long', 'next',
  'open', 'safe', 'soft', 'true', 'warm', 'wild', 'zone', 'jump', 'walk', 'talk',
  'book', 'door', 'room', 'desk', 'lamp', 'ring', 'king', 'hand', 'foot', 'head',
  // medium (5-6)
  'apple', 'water', 'house', 'mouse', 'horse', 'tiger', 'eagle', 'snake', 'whale', 'shark',
  'cloud', 'storm', 'river', 'ocean', 'beach', 'field', 'forest', 'valley', 'mount', 'peak',
  'light', 'night', 'sound', 'music', 'voice', 'story', 'dream', 'magic', 'power', 'glory',
  'happy', 'lucky', 'merry', 'brave', 'proud', 'quiet', 'swift', 'sharp', 'bright', 'clear',
  'green', 'black', 'white', 'brown', 'amber', 'coral', 'ivory', 'olive', 'peach', 'rose',
  'chair', 'table', 'window', 'door', 'floor', 'wall', 'roof', 'gate', 'fence', 'path',
  'bread', 'fruit', 'lemon', 'mango', 'melon', 'berry', 'cherry', 'olive', 'plum', 'grape',
  'garden', 'flower', 'butter', 'honey', 'sugar', 'coffee', 'tea', 'milk', 'juice', 'soda',
  'planet', 'galaxy', 'rocket', 'comet', 'orbit', 'space', 'earth', 'venus', 'mars', 'jupiter',
  'letter', 'number', 'puzzle', 'riddle', 'cipher', 'signal', 'memory', 'record', 'report', 'notice',
  'travel', 'voyage', 'journey', 'ticket', 'flight', 'harbor', 'bridge', 'tunnel', 'station', 'engine',
  'silver', 'copper', 'bronze', 'crystal', 'marble', 'granite', 'pebble', 'boulder', 'fossil', 'mineral',
  'winter', 'summer', 'spring', 'autumn', 'season', 'weather', 'climate', 'breeze', 'thunder', 'lightning',
  // longer (7-8)
  'keyboard', 'monitor', 'printer', 'network', 'browser', 'program', 'command', 'screen', 'cursor', 'system',
  'library', 'chapter', 'history', 'science', 'physics', 'chemist', 'biology', 'geology', 'astronomy', 'weather',
  'mountain', 'volcano', 'glacier', 'canyon', 'desert', 'forest', 'jungle', 'meadow', 'prairie', 'tundra',
  'elephant', 'dolphin', 'penguin', 'sparrow', 'robin', 'falcon', 'raven', 'turtle', 'lizard', 'spider',
  'rainbow', 'sunrise', 'sunset', 'twilight', 'midnight', 'morning', 'evening', 'holiday', 'weekend', 'moment',
  'journey', 'freedom', 'courage', 'justice', 'wisdom', 'honor', 'spirit', 'wonder', 'beauty', 'mystery',
  'diamond', 'emerald', 'ruby', 'sapphire', 'pearl', 'crystal', 'treasure', 'fortune', 'riches', 'wealth',
  'thunder', 'whisper', 'shouted', 'singing', 'dancing', 'running', 'jumping', 'climbing', 'crawling', 'flying',
  // longer (9+)
  'adventure', 'beautiful', 'chocolate', 'dangerous', 'education', 'fantastic', 'gigantic', 'happiness', 'important', 'knowledge',
  'landscape', 'mysterious', 'necessary', 'operation', 'parachute', 'quicksilver', 'restaurant', 'symphony', 'telescope', 'university',
  'vocabulary', 'wonderful', 'xylophone', 'yesterday', 'zoological', 'atmosphere', 'biological', 'celebration', 'discovery', 'evolution',
  'friendship', 'gentleness', 'horizon', 'imagination', 'jubilation', 'kindness', 'lighthouse', 'mountainous', 'navigation', 'orchestra',
  'photograph', 'quotation', 'reflection', 'satisfaction', 'tradition', 'universe', 'vegetable', 'waterfall', 'exhibition', 'youthful',
  'pneumonoultramicroscopicsilicovolcanoconiosis'
];

function buildDictionary(words: string[], minLen = 2, maxLen = 45): DictWord[] {
  const seen = new Set<string>();
  const out: DictWord[] = [];
  for (const raw of words) {
    const lw = raw.toLowerCase();
    if (!/^[a-z]+$/.test(lw)) continue; // skip anything with punctuation/numbers
    if (lw.length < minLen || lw.length > maxLen) continue;
    if (seen.has(lw)) continue;
    seen.add(lw);
    out.push({ word: lw, rows: rowsFor(lw) });
  }
  return out;
}

// The live word pool the game draws from. Starts as the small curated
// fallback list so the app is usable instantly, then gets swapped out for
// a real dictionary of thousands of words once loadDictionary() resolves.
export let DICTIONARY: DictWord[] = buildDictionary(FALLBACK_WORDS);

let dictionaryReady = false;
let loadPromise: Promise<void> | null = null;

// Two sources, intersected, so a word only makes it into the game if it's
// BOTH well-known AND a validated real dictionary entry:
//  - COMMON_WORDS_URL: Google's "10,000 most common English words" (from a
//    trillion-word web corpus) — but on its own this includes web-common
//    acronyms like "dsl" or "fda" that aren't actually words.
//  - REAL_DICTIONARY_URL: a SCOWL-based spellcheck dictionary (250,000+
//    entries) — a proper validated wordlist, but on its own includes many
//    obscure/archaic entries nobody would recognize.
// Intersecting the two keeps only words that are both familiar and real,
// which matters a lot once the pool gets narrowed down to just the letters
// on a given keyboard row. Both are hosted on GitHub's raw CDN with
// permissive CORS headers.
const REAL_DICTIONARY_URL =
  'https://raw.githubusercontent.com/dwyl/english-words/master/words.txt';

const SEVERE_SWEARS = new Set([
  'fuck', 'fucking', 'fucker', 'fucks', 'faggot', 'faggots', 'bitch', 'bitches', 'bitching', 
  'retard', 'retarded', 'retards', 'nigger', 'niggers', 'nigga', 'niggas', 
  'cunt', 'cunts', 'whore', 'whores', 'slut', 'sluts', 'dick', 'dicks', 
  'cock', 'cocks', 'pussy', 'pussies', 'shit', 'shits', 'shitting', 'shitty', 
  'motherfucker', 'motherfucking', 'asshole', 'assholes', 'bastard', 'bastards', 'twat', 'twats', 'wank', 'wanker'
]);

const CACHE_KEY = 'velocitype_dictionary_cache_v5';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // re-fetch at most once a week

function readCache(): string[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { words: string[]; ts: number };
    if (!parsed?.words?.length || Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.words;
  } catch {
    return null;
  }
}

function writeCache(words: string[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ words, ts: Date.now() }));
  } catch {
    // Storage full or unavailable — the dictionary still works in-memory.
  }
}

function parseWordList(text: string): Set<string> {
  return new Set(
    text
      .split(/\r?\n/)
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean)
  );
}

// Fetches both word lists (or a cached intersection of them) and swaps the
// result in as the active DICTIONARY. Safe to call multiple times — only
// fetches once. If the network requests fail for any reason, the app
// silently keeps using the small curated fallback list so gameplay is
// never blocked.
export async function loadDictionary(): Promise<void> {
  if (dictionaryReady) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      let words = readCache();

      if (!words) {
        const realRes = await fetch(REAL_DICTIONARY_URL);
        if (!realRes.ok) {
          throw new Error(`Dictionary fetch failed: ${realRes.status}`);
        }
        const realText = await realRes.text();
        const realWords = parseWordList(realText);

        words = [...realWords].filter((w) => !SEVERE_SWEARS.has(w));
        writeCache(words);
      }

      const built = buildDictionary(words);
      if (built.length > 0) {
        DICTIONARY = built;
      }
    } catch (err) {
      console.warn(
        'Could not load the full dictionary — continuing with the built-in word list.',
        err
      );
    } finally {
      dictionaryReady = true;
    }
  })();

  return loadPromise;
}

export function isDictionaryReady(): boolean {
  return dictionaryReady;
}

// Filter words by active rows and min/max length. Reads whichever
// dictionary is currently active (fallback or fully-loaded remote list).
export function filterWords(activeRows: RowKey[], minLen: number, maxLen: number): string[] {
  const rowSet = new Set(activeRows);
  return DICTIONARY.filter(
    (w) =>
      w.word.length >= minLen &&
      w.word.length <= maxLen &&
      w.rows.every((r) => rowSet.has(r))
  ).map((w) => w.word);
}