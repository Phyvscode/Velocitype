import { DICTIONARY } from './src/lib/words.ts';
console.log(DICTIONARY.filter(w => w.rows.length === 1 && w.rows[0] === 'home').length);
