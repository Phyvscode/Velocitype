export const LANGUAGES = [
  { id: 'english', label: 'English', url: 'https://raw.githubusercontent.com/monkeytypegame/monkeytype/master/frontend/static/languages/english_10k.json' },
  { id: 'spanish', label: 'Spanish', url: 'https://raw.githubusercontent.com/monkeytypegame/monkeytype/master/frontend/static/languages/spanish.json' },
  { id: 'french', label: 'French', url: 'https://raw.githubusercontent.com/monkeytypegame/monkeytype/master/frontend/static/languages/french.json' },
  { id: 'german', label: 'German', url: 'https://raw.githubusercontent.com/monkeytypegame/monkeytype/master/frontend/static/languages/german.json' },
  { id: 'portuguese', label: 'Portuguese', url: 'https://raw.githubusercontent.com/monkeytypegame/monkeytype/master/frontend/static/languages/portuguese.json' },
  { id: 'italian', label: 'Italian', url: 'https://raw.githubusercontent.com/monkeytypegame/monkeytype/master/frontend/static/languages/italian.json' },
  { id: 'dutch', label: 'Dutch', url: 'https://raw.githubusercontent.com/monkeytypegame/monkeytype/master/frontend/static/languages/dutch.json' },
  { id: 'swedish', label: 'Swedish', url: 'https://raw.githubusercontent.com/monkeytypegame/monkeytype/master/frontend/static/languages/swedish.json' },
  { id: 'danish', label: 'Danish', url: 'https://raw.githubusercontent.com/monkeytypegame/monkeytype/master/frontend/static/languages/danish.json' },
  { id: 'norwegian_bokmal', label: 'Norwegian Bokmål', url: 'https://raw.githubusercontent.com/monkeytypegame/monkeytype/master/frontend/static/languages/norwegian_bokmal.json' },
  { id: 'norwegian_nynorsk', label: 'Norwegian Nynorsk', url: 'https://raw.githubusercontent.com/monkeytypegame/monkeytype/master/frontend/static/languages/norwegian_nynorsk.json' },
  { id: 'finnish', label: 'Finnish', url: 'https://raw.githubusercontent.com/monkeytypegame/monkeytype/master/frontend/static/languages/finnish.json' },
  { id: 'icelandic', label: 'Icelandic', url: 'https://raw.githubusercontent.com/monkeytypegame/monkeytype/master/frontend/static/languages/icelandic.json' },
  { id: 'irish', label: 'Irish', url: 'https://raw.githubusercontent.com/monkeytypegame/monkeytype/master/frontend/static/languages/irish.json' },
  { id: 'welsh', label: 'Welsh', url: 'https://raw.githubusercontent.com/monkeytypegame/monkeytype/master/frontend/static/languages/welsh.json' },
  { id: 'polish', label: 'Polish', url: 'https://raw.githubusercontent.com/monkeytypegame/monkeytype/master/frontend/static/languages/polish.json' },
  { id: 'czech', label: 'Czech', url: 'https://raw.githubusercontent.com/monkeytypegame/monkeytype/master/frontend/static/languages/czech.json' },
  { id: 'slovak', label: 'Slovak', url: 'https://raw.githubusercontent.com/monkeytypegame/monkeytype/master/frontend/static/languages/slovak.json' },
];

export function getLanguageUrl(id: string): string {
  const lang = LANGUAGES.find((l) => l.id === id);
  return lang ? lang.url : LANGUAGES[0].url;
}

export function getCurrentLanguage(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('velocitype_language') || 'english';
  }
  return 'english';
}

export function setCurrentLanguage(id: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('velocitype_language', id);
    window.dispatchEvent(new Event('languagechange'));
  }
}
